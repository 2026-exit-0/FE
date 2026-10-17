import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getScanHistory } from '../api/scan';
import { mockDemoScanHistory } from '../utils/mockData';
import { getAiMode, useModeStore } from '../store/modeStore';
import { scanImages } from '../utils/scanSafety';

const measurement = value => {
  if (value == null || typeof value === 'boolean' || String(value).trim() === '') return null;
  const parsed = Number(String(value).replace(/%$/, '').trim());
  return Number.isFinite(parsed) ? parsed : null;
};

// 백엔드 narrative / result 응답을 flat 구조로 변환 (차트/UI 호환)
export function parseApiResult(apiResult) {
  if (!apiResult) return {};

  // 1. 새 BE 응답 형태: { session_id, total_score, result: { moisture/moisture_on, sebum, pore, elasticity, pigmentation/melanin_on }, advice: {...} }
  if (apiResult.result || apiResult.total_score !== undefined) {
    const r = apiResult.result || apiResult;
    const advice = apiResult.advice || {};

    const tipsList = Array.isArray(advice.tips) ? [...advice.tips] : (advice.tips ? [advice.tips] : []);
    if (advice.recommendation) tipsList.push(advice.recommendation);

    const moistureVal = measurement(r.moisture);
    const oilVal = measurement(r.sebum ?? r.oil);
    const elasticityVal = measurement(r.elasticity);
    const spotsVal = measurement(r.pore ?? r.spots);
    const pigmentationVal = measurement(r.pigmentation);
    const overall = measurement(apiResult.total_score ?? apiResult.overallScore);

    // 날짜 파싱 (1순위: BE created_at, 2순위: BE date, 3순위: 오늘 날짜)
    let formattedDate = new Date().toISOString().split('T')[0].replace(/-/g, '.');
    if (apiResult.created_at) {
      try {
        formattedDate = new Date(apiResult.created_at).toISOString().split('T')[0].replace(/-/g, '.');
      } catch { /* ignore parse error */ }
    } else if (apiResult.date) {
      formattedDate = apiResult.date;
    }

    return {
      sessionId: apiResult.session_id,
      is_mock: Boolean(apiResult.is_mock ?? apiResult._raw?.is_mock ?? false),
      moisture: moistureVal,
      oil: oilVal,
      elasticity: elasticityVal,
      spots: spotsVal,
      pigmentation: pigmentationVal,
      overallScore: overall,
      skinType: apiResult.skin_type_result || apiResult.skinType || null,
      date: formattedDate,
      area: apiResult.area || apiResult.region || '얼굴 전체',
      narrative: {
        overall_score: overall,
        summary: advice.summary || advice.description || (overall == null ? '' : `종합 피부 점수는 ${overall}점입니다.`),
        per_metric: [
          { name: '수분도', value: moistureVal == null ? null : `${moistureVal}%`, rating_text: moistureVal == null ? '데이터 없음' : moistureVal >= 60 ? '정상' : '주의' },
          { name: '유분도', value: oilVal == null ? null : `${oilVal}%`, rating_text: oilVal == null ? '데이터 없음' : oilVal <= 55 ? '보통' : '주의' },
          { name: '탄력', value: elasticityVal == null ? null : `${elasticityVal}%`, rating_text: elasticityVal == null ? '데이터 없음' : elasticityVal >= 60 ? '정상' : '주의' },
          { name: '모공', value: spotsVal == null ? null : `${spotsVal}%`, rating_text: spotsVal == null ? '데이터 없음' : spotsVal >= 60 ? '양호' : '관리 권장' },
          { name: '색소침착', value: pigmentationVal == null ? null : `${pigmentationVal}%`, rating_text: pigmentationVal == null ? '데이터 없음' : pigmentationVal <= 55 ? '정상' : '주의' },
        ],
        tips: tipsList,
      },
      recommendedProducts: apiResult.recommended_products || [],
      ...scanImages(apiResult),
      meta: apiResult.meta || {},
      _raw: apiResult,
    };
  }

  // 2. 기존 narrative / mock 구조
  const n = apiResult.narrative;
  if (!n) return {
    ...apiResult,
    sessionId: apiResult.session_id || apiResult.sessionId,
    moisture: measurement(apiResult.moisture),
    oil: measurement(apiResult.sebum ?? apiResult.oil),
    elasticity: measurement(apiResult.elasticity),
    pigmentation: measurement(apiResult.pigmentation),
    overallScore: measurement(apiResult.total_score ?? apiResult.overallScore),
    skinType: apiResult.skin_type_result || apiResult.skinType || null,
    spots: measurement(apiResult.pore ?? apiResult.spots),
    ...scanImages(apiResult),
  };

  const metrics = {};
  n.per_metric?.forEach((m) => {
    const key = metricKeyMap[m.name] || m.name.toLowerCase();
    metrics[key] = measurement(m.value);
  });

  let fallbackDate = new Date().toISOString().split('T')[0].replace(/-/g, '.');
  if (apiResult.created_at) {
    try {
      fallbackDate = new Date(apiResult.created_at).toISOString().split('T')[0].replace(/-/g, '.');
    } catch { /* ignore */ }
  } else if (apiResult.date) {
    fallbackDate = apiResult.date;
  }

  return {
    sessionId: apiResult.session_id,
    moisture: metrics.moisture ?? measurement(apiResult.moisture),
    oil: metrics.oil ?? measurement(apiResult.oil),
    elasticity: metrics.elasticity ?? measurement(apiResult.elasticity),
    spots: metrics.spots ?? measurement(apiResult.spots),
    pigmentation: metrics.pigmentation ?? measurement(apiResult.pigmentation),
    overallScore: measurement(n.overall_score ?? apiResult.total_score ?? apiResult.overallScore),
    skinType: apiResult.predictions?.classification?.skin_type || apiResult.skin_type_result || apiResult.skinType || null,
    date: fallbackDate,
    area: apiResult.meta?.region || apiResult.area || '얼굴 전체',
    is_mock: Boolean(apiResult.is_mock ?? apiResult._raw?.is_mock ?? false),
    narrative: n,
    recommendedProducts: apiResult.recommended_products || [],
    ...scanImages(apiResult),
    meta: apiResult.meta || {},
    _raw: apiResult,
  };
}

const metricKeyMap = {
  '수분도': 'moisture',
  '유분도': 'oil',
  '탄력': 'elasticity',
  '모공': 'spots',
  '색소침착': 'pigmentation',
};

// 계정 초기화 이전에 시작한 기록 요청은 더 이상 반영하지 않는다.
let historyGeneration = 0;
const modeHistory = new Map();

const useScanStore = create(
  persist(
    (set, get) => ({
      scans: [],
      currentScan: null,
      loading: false,
      scannerStatus: 'unknown',
      // 자가진단/직접입력으로 수집한 피부 정보 (ScanPage에서 FormData에 첨부)
      userInputs: null,

      setUserInputs: (inputs) => set({ userInputs: inputs }),
      clearUserInputs: () => set({ userInputs: null }),

      fetchHistory: async () => {
        const generation = historyGeneration;
        const token = localStorage.getItem('damda_token');
        const mode = getAiMode();
        try {
          const history = await getScanHistory();
          if (generation !== historyGeneration || token !== localStorage.getItem('damda_token') || mode !== getAiMode()) {
            return [];
          }
          const parsed = Array.isArray(history) ? history.map((s) => parseApiResult(s)) : [];
          set((state) => ({
            scans: parsed,
            currentScan: parsed.length === 0 ? null
              : parsed.some(scan => (scan.sessionId || scan.id) === (state.currentScan?.sessionId || state.currentScan?.id))
                ? state.currentScan : parsed[0],
          }));
          return parsed;
        } catch {
          return [];
        }
      },

      initializeIfNeeded: async () => {
        const state = get();
        const mode = getAiMode();
        if (mode === 'mock' && state.scans.length === 0) {
          const scans = mockDemoScanHistory.map(parseApiResult);
          set({ scans, currentScan: scans[0] || null });
          return scans;
        }

        if (state.currentScan || state.scans.length > 0) return;
        return get().fetchHistory();
      },

      addScan: (apiResult) => {
        const parsed = parseApiResult(apiResult);
        const newScan = {
          ...parsed,
          is_mock: Boolean(apiResult?.is_mock ?? parsed.is_mock ?? false),
          id: Date.now(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          scans: [newScan, ...state.scans],
          currentScan: newScan,
        }));
        return newScan;
      },

      setCurrentScan: (scan) => set({ currentScan: scan }),

      removeScan: (scanId) => {
        set((state) => {
          const filtered = state.scans.filter((s) => s.id !== scanId);
          return { scans: filtered, currentScan: filtered[0] || null };
        });
      },

      setScannerStatus: (status) => set({ scannerStatus: status }),
      setLoading: (loading) => set({ loading }),

      clearAll: () => {
        historyGeneration++;
        modeHistory.clear();
        set({ scans: [], currentScan: null, userInputs: null, loading: false, scannerStatus: 'unknown' });
      },
    }),
    {
      name: 'skinlab_scan_store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

useModeStore.subscribe((state, previous) => {
  if (state.mode === previous.mode) return;
  historyGeneration++;
  const current = useScanStore.getState();
  const belongsTo = (scan, mode) => Boolean(scan?.is_mock || scan?._raw?.is_mock) === (mode === 'mock');
  const scans = current.scans.filter(scan => belongsTo(scan, previous.mode));
  modeHistory.set(previous.mode, {
    scans,
    currentScan: current.currentScan && belongsTo(current.currentScan, previous.mode) ? current.currentScan : scans[0] || null,
  });
  const restored = modeHistory.get(state.mode) || { scans: [], currentScan: null };
  useScanStore.setState({ ...restored, loading: false });
  useScanStore.getState().initializeIfNeeded();
});

export default useScanStore;
