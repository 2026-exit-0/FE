import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getScanHistory } from '../api/scan';

// 백엔드 narrative / result 응답을 flat 구조로 변환 (차트/UI 호환)
export function parseApiResult(apiResult) {
  if (!apiResult) return {};

  // 1. 새 BE 응답 형태: { session_id, total_score, result: { moisture/moisture_on, sebum, pore, elasticity, pigmentation/melanin_on }, advice: {...} }
  if (apiResult.result || apiResult.total_score !== undefined) {
    const r = apiResult.result || {};
    const advice = apiResult.advice || {};

    const tipsList = Array.isArray(advice.tips) ? advice.tips : (advice.tips ? [advice.tips] : []);
    if (advice.recommendation) tipsList.push(advice.recommendation);

    const moistureVal = r.moisture ?? r.moisture_on ?? 0;
    const oilVal = r.sebum ?? r.oil ?? 0;
    const elasticityVal = r.elasticity ?? 0;
    const spotsVal = r.pore ?? r.spots ?? 0;
    const pigmentationVal = r.pigmentation ?? r.melanin_on ?? 0;
    const overall = apiResult.total_score ?? apiResult.overallScore ?? 70;

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
      moisture: moistureVal,
      oil: oilVal,
      elasticity: elasticityVal,
      spots: spotsVal,
      pigmentation: pigmentationVal,
      overallScore: overall,
      skinType: apiResult.skinType || '복합성 피부',
      date: formattedDate,
      area: apiResult.area || apiResult.region || '얼굴 전체',
      narrative: {
        overall_score: overall,
        summary: advice.summary || advice.description || `종합 피부 점수는 ${overall}점입니다.`,
        per_metric: [
          { name: '수분도', value: `${moistureVal}%`, rating_text: moistureVal >= 60 ? '정상' : '주의' },
          { name: '유분도', value: `${oilVal}%`, rating_text: oilVal <= 55 ? '보통' : '주의' },
          { name: '탄력', value: `${elasticityVal}%`, rating_text: elasticityVal >= 60 ? '정상' : '주의' },
          { name: '모공', value: `${spotsVal}%`, rating_text: spotsVal >= 60 ? '양호' : '관리 권장' },
          { name: '색소침착', value: `${pigmentationVal}%`, rating_text: pigmentationVal <= 55 ? '정상' : '주의' },
        ],
        tips: tipsList.length > 0 ? tipsList : ['하루 1.5L 이상 수분 섭취와 자외선 차단을 권장합니다.'],
      },
      recommendedProducts: apiResult.recommended_products || [],
      meta: apiResult.meta || {},
      _raw: apiResult,
    };
  }

  // 2. 기존 narrative / mock 구조
  const n = apiResult.narrative;
  if (!n) return apiResult; // 이미 flat 구조면 그대로 반환

  const metrics = {};
  n.per_metric?.forEach((m) => {
    const key = metricKeyMap[m.name] || m.name.toLowerCase();
    metrics[key] = parseFloat(m.value) || 0;
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
    moisture: metrics.moisture ?? metrics['수분도'] ?? apiResult.moisture ?? 0,
    oil: metrics.oil ?? metrics['유분도'] ?? apiResult.oil ?? 0,
    elasticity: metrics.elasticity ?? metrics['탄력'] ?? apiResult.elasticity ?? 0,
    spots: metrics.spots ?? metrics['모공'] ?? apiResult.spots ?? 0,
    pigmentation: metrics.pigmentation ?? metrics['색소침착'] ?? apiResult.pigmentation ?? 0,
    overallScore: n.overall_score || apiResult.overallScore || 70,
    skinType: apiResult.predictions?.classification?.skin_type || apiResult.skinType || '복합성 피부',
    date: fallbackDate,
    area: apiResult.meta?.region || apiResult.area || '얼굴 전체',
    narrative: n,
    recommendedProducts: apiResult.recommended_products || [],
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
        try {
          const history = await getScanHistory();
          const parsed = Array.isArray(history) ? history.map((s) => parseApiResult(s)) : [];
          set((state) => ({
            scans: parsed.length > 0 ? parsed : state.scans,
            currentScan: parsed.length > 0 ? parsed[0] : state.currentScan,
          }));
          return parsed;
        } catch {
          return [];
        }
      },

      initializeIfNeeded: async () => {
        const state = get();
        if (state.currentScan || state.scans.length > 0) return;
        return get().fetchHistory();
      },

      addScan: (apiResult) => {
        const parsed = parseApiResult(apiResult);
        const newScan = { ...parsed, id: Date.now(), createdAt: new Date().toISOString() };
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

      clearAll: () => set({ scans: [], currentScan: null }),
    }),
    {
      name: 'skinlab_scan_store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useScanStore;
