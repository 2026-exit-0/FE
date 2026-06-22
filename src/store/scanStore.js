import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getScanHistory } from '../api/scan';

// 백엔드 narrative 응답을 flat 구조로 변환 (차트/UI 호환)
export function parseApiResult(apiResult) {
  const n = apiResult.narrative;
  if (!n) return apiResult; // 이미 flat이면 그대로

  const metrics = {};
  n.per_metric?.forEach((m) => {
    const key = metricKeyMap[m.name] || m.name.toLowerCase();
    metrics[key] = parseFloat(m.value) || 0;
  });

  return {
    // flat 필드 (기존 UI 호환)
    moisture: metrics.moisture ?? metrics['수분도'] ?? 0,
    oil: metrics.oil ?? metrics['유분도'] ?? 0,
    elasticity: metrics.elasticity ?? metrics['탄력'] ?? 0,
    spots: metrics.spots ?? metrics['모공'] ?? 0,
    pigmentation: metrics.pigmentation ?? metrics['색소침착'] ?? 0,
    overallScore: n.overall_score,
    skinType: apiResult.predictions?.classification?.skin_type || '복합성 피부',
    date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
    area: apiResult.meta?.region || '',
    // narrative 원본 보존
    narrative: n,
    recommendedProducts: apiResult.recommended_products || [],
    meta: apiResult.meta || {},
    // 원본 그대로도 보존
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

      initializeIfNeeded: async () => {
        const state = get();
        if (state.scans.length > 0) return;

        try {
          const history = await getScanHistory();
          const parsed = history.map((s) => parseApiResult(s));
          set({ scans: parsed, currentScan: parsed[0] || null });
        } catch {
          // API 실패 시 빈 상태 유지
          set({ scans: [], currentScan: null });
        }
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
