import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scan as ScanIcon, CheckCircle, AlertTriangle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import BottomNav from '../components/common/BottomNav';
import Button from '../components/common/Button';
import useAuth from '../hooks/useAuth';
import useScanStore from '../store/scanStore';
import { useModeStore } from '../store/modeStore';
import { getScannerHealth, measureWithScanner, triggerScan, getScanStatus } from '../api/scan';
import { SCAN_AREAS, MEASUREMENT_ITEMS } from '../utils/constants';

const REGION_MAP = {
  '이마': 'FOREHEAD',
  '코': 'NOSE',
  '왼쪽 뺨': 'L_CHEEK',
  '오른쪽 뺨': 'R_CHEEK',
  '턱': 'CHIN',
};

const ScanPage = () => {
  const navigate = useNavigate();
  useAuth(true);
  const { addScan, initializeIfNeeded, userInputs } = useScanStore();
  const { mode, setMode } = useModeStore();

  const [scanStatus, setScanStatus] = useState('ready');
  const [scanErrorMsg, setScanErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [scanProgress, setScanProgress] = useState(0);
  const [selectedArea, setSelectedArea] = useState('이마');
  const [scannerStatus, setScannerStatus] = useState('checking');
  const [scannerMsg, setScannerMsg] = useState('스캐너 상태 확인 중...');
  const [streamUrl, setStreamUrl] = useState(import.meta.env.VITE_SCANNER_STREAM_URL || '');
  const [detectedIp, setDetectedIp] = useState(null);
  const [streamError, setStreamError] = useState(false);
  const [measurements, setMeasurements] = useState(
    MEASUREMENT_ITEMS.reduce((acc, item) => ({ ...acc, [item.id]: item.default }), {})
  );

  const isSubmittingRef = useRef(false);
  const scanOriginRef = useRef('software');

  useEffect(() => {
    if (streamUrl) {
      setStreamError(false);
      console.log('[ESP32 Stream] 스트리밍 URL 적용:', streamUrl);
    }
  }, [streamUrl]);

  const isDemo = mode === 'mock';
  const displayScannerStatus = isDemo ? 'ok' : scannerStatus;
  const displayScannerMsg = isDemo ? '스캐너 연결됨 (상태: 대기 중)' : scannerMsg;
  const isScannerBlocked = !isDemo && scannerStatus !== 'ok';

  useEffect(() => { initializeIfNeeded(); }, [initializeIfNeeded]);

  // 스캐너 상태 및 ESP32 스트리밍 URL 확인
  const checkScanner = useCallback(async () => {
    if (mode === 'mock') {
      setScannerStatus('ok');
      setScannerMsg('스캐너 연결됨 (상태: 대기 중)');
      return;
    }

    setScannerStatus('checking');
    setScannerMsg('스캐너 상태 확인 중...');
    try {
      const data = await getScannerHealth();
      if (data.status === 'ok') {
        setScannerStatus('ok');
        setScannerMsg(data.message || '스캐너 연결됨');
        if (data.streamUrl) {
          setStreamUrl(data.streamUrl);
          setDetectedIp(data.ip || null);
        }
      } else {
        setScannerStatus('unreachable');
        setScannerMsg(data.message || '스캐너 미연결 — Wi-Fi 확인');
        if (!import.meta.env.VITE_SCANNER_STREAM_URL) {
          setStreamUrl('');
          setDetectedIp(null);
        }
      }
    } catch {
      setScannerStatus('unreachable');
      setScannerMsg('서버 응답 없음');
    }
  }, [mode]);

  useEffect(() => {
    checkScanner();
    // 실제 AI 모드일 때 10초마다 기기 등록 상태 확인
    if (mode !== 'mock') {
      const timer = setInterval(checkScanner, 10000);
      return () => clearInterval(timer);
    }
  }, [checkScanner, mode]);

  const toggleMeasurement = (id) => setMeasurements((prev) => ({ ...prev, [id]: !prev[id] }));

  // 스캔 진행 중 브라우저 탭 닫기/새로고침 이탈 방어
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (scanStatus === 'scanning' || scanStatus === 'countdown') {
        e.preventDefault();
        e.returnValue = '측정이 진행 중입니다. 페이지를 벗어나시겠습니까?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [scanStatus]);

  // 카운트다운
  useEffect(() => {
    if (scanStatus !== 'countdown') return;
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
    setScanStatus('scanning');
    setScanProgress(0);
  }, [scanStatus, countdown]);

  // 스캔 진행 및 실제 촬영 완료 감지 (mock: 5초 타이머, real: getScanStatus 폴링 완료 감지)
  useEffect(() => {
    if (scanStatus !== 'scanning') return;

    let progressTimer = null;
    let pollTimer = null;
    let isCancelled = false;

    // 1. 시연용(Mock) 모드: 약 5초 동안 100%까지 증가
    if (isDemo) {
      if (scanProgress < 100) {
        progressTimer = setTimeout(() => setScanProgress((p) => Math.min(p + 2, 100)), 100);
        return () => clearTimeout(progressTimer);
      }
    } else {
      // 2. 실제 AI 모드:
      // 프로그레스 바는 90%까지 서서히 상승하고, ESP32 완료(status: idle 복귀) 감지 시 100%로 도달
      if (scanProgress < 90) {
        progressTimer = setTimeout(() => setScanProgress((p) => Math.min(p + 2, 90)), 200);
      }

      // 하드웨어 완료 상태(idle) 폴링 (1.2초 주기)
      pollTimer = setInterval(async () => {
        try {
          const data = await getScanStatus();
          // 스캔 완료 후 서버가 status를 'idle'로 리셋했거나 완료된 경우 (최소 2.5초 진행 후 감지)
          if (data?.status === 'idle' && scanProgress >= 20) {
            console.log('[ESP32] 하드웨어 촬영 완료 감지 (status: idle) -> 분석 요청 진행');
            clearInterval(pollTimer);
            if (!isCancelled) {
              setScanProgress(100);
            }
          }
        } catch (_) {}
      }, 1200);

      // 최대 20초 안전 타임아웃 (서버 응답 지연 시에도 영구 정지 방지)
      const safetyTimeout = setTimeout(() => {
        console.warn('[ESP32] 안전 타임아웃 도달: 분석 요청 강제 진행');
        if (!isCancelled) {
          setScanProgress(100);
        }
      }, 20000);

      return () => {
        isCancelled = true;
        clearTimeout(progressTimer);
        clearInterval(pollTimer);
        clearTimeout(safetyTimeout);
      };
    }

    // 3. 진행바 완료(100%) → 백엔드 최종 분석 API 호출
    if (scanProgress >= 100) {
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;

      const run = async () => {
        try {
          const fd = new FormData();
          fd.append('region', REGION_MAP[selectedArea] || 'PART_0');
          // 자가진단 / 직접 입력 결과 첨부
          if (userInputs) {
            Object.entries(userInputs).forEach(([key, val]) => {
              if (val !== null && val !== undefined) fd.append(key, String(val));
            });
          }
          const result = await measureWithScanner(fd);
          addScan(result);
          setScanStatus('complete');
          setTimeout(() => navigate('/analysis'), 2200);
        } catch (err) {
          console.error('측정 실패:', err);
          const errorMsg = err.code === 'ECONNABORTED' || err.message?.includes('timeout')
            ? '측정 응답 시간이 초과되었습니다 (30초 제한). ESP32 스캐너 수신 상태를 확인해 주세요.'
            : (err.response?.data?.detail || '네트워크 연결이 불안정하거나 측정에 실패했습니다.');
          setScanErrorMsg(errorMsg);
          setScanStatus('error');
        } finally {
          isSubmittingRef.current = false;
        }
      };
      run();
    }
  }, [scanStatus, scanProgress, isDemo, navigate, selectedArea, addScan, userInputs]);

  const startScan = useCallback(async () => {
    if (scanStatus === 'scanning' || scanStatus === 'countdown' || isSubmittingRef.current) return;
    if (isScannerBlocked) return;
    isSubmittingRef.current = false;
    scanOriginRef.current = 'software';

    // 실제 AI 모드: triggerScan() 호출하여 하드웨어에 스캔 시작 신호 전송
    if (!isDemo) {
      try {
        await triggerScan();
      } catch (err) {
        console.error('[startScan] triggerScan 실패:', err);
        setScanErrorMsg('스캐너 시작 신호(trigger) 전송에 실패했습니다. ESP32 전원 및 Wi-Fi 연결을 확인해 주세요.');
        setScanStatus('error');
        return;
      }
    }

    setScanStatus('countdown');
    setCountdown(3);
    setScanProgress(0);
  }, [scanStatus, isDemo, isScannerBlocked]);

  // 하드웨어 버튼 감지용 폴링 (2초마다 상태 확인)
  useEffect(() => {
    if (scanStatus !== 'ready' || isDemo) return;
    const poll = setInterval(async () => {
      try {
        const data = await getScanStatus();
        if (data?.status === 'scanning') {
          console.log('[ESP32] 하드웨어 물리 버튼 감지 -> 스캔 시작');
          scanOriginRef.current = 'hardware';
          setScanStatus('scanning');
          setScanProgress(0);
        }
      } catch (_) {}
    }, 2000);
    return () => clearInterval(poll);
  }, [scanStatus, isDemo]);

  const checklist = [
    { icon: CheckCircle, text: '밝은 환경에서 측정하세요', type: 'ok' },
    { icon: CheckCircle, text: '스캐너를 피부에 밀착시켜 주세요', type: 'ok' },
    { icon: CheckCircle, text: '측정 중 움직이지 마세요', type: 'ok' },
    { icon: AlertTriangle, text: '메이크업 상태에서도 측정 가능해요', type: 'warn' },
  ];

  return (
    <div className="min-h-screen bg-background-gray">
      <Header variant="dashboard" />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-4 tablet:p-6 desktop:p-8 pb-36 desktop:pb-12">
          <div className="grid grid-cols-1 desktop:grid-cols-12 gap-6">

            {/* 스캔 인터페이스 */}
            <div className="desktop:col-span-7 space-y-6">
              <div className="card overflow-hidden">
                {/* 스캐너 연결 상태 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full transition-colors ${
                      displayScannerStatus === 'ok' ? 'bg-green-500' :
                      displayScannerStatus === 'checking' ? 'bg-yellow-400 animate-pulse' :
                      'bg-orange-400'
                    }`} />
                    <span className="text-sm text-text-secondary">{displayScannerMsg}</span>
                    {mode !== 'mock' && (
                      <button
                        type="button"
                        onClick={checkScanner}
                        title="기기 재검색"
                        className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <RefreshCw size={13} className={scannerStatus === 'checking' ? 'animate-spin' : ''} />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100">
                      {selectedArea}
                    </span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                      mode === 'mock'
                        ? 'bg-purple-50 text-purple-600 border-purple-200/70'
                        : 'bg-emerald-50 text-emerald-600 border-emerald-200/70'
                    }`}>
                      {mode === 'mock' ? '시연용' : '실제 AI'}
                    </span>
                    <span className="text-xs text-text-secondary">UV 모드</span>
                  </div>
                </div>

                {/* 카메라 / 얼굴 가이드 */}
                <div className="bg-gray-900 rounded-2xl aspect-[4/3] relative flex items-center justify-center mb-4 overflow-hidden shadow-inner">
                  {/* 하드웨어 실시간 MJPEG 스트림 (URL이 있고 에러 없을 시 즉시 표시) */}
                  {streamUrl && !streamError && (
                    <img
                      src={streamUrl}
                      alt="실시간 스캐너 화면"
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        console.warn('[ESP32 Stream] 이미지 로딩 실패 (Mixed Content 또는 네트워크 미접속):', streamUrl);
                        setStreamError(true);
                      }}
                    />
                  )}

                  {/* 스트림 상태 뱃지 (실시간 스트림 정상 출력 시) */}
                  {streamUrl && !streamError && (
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-full text-[11px] text-white font-medium border border-white/10 shadow">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      <span className="text-red-400 font-bold">LIVE</span>
                      <span className="text-gray-300">ESP32 스캐너 {detectedIp ? `(${detectedIp})` : ''}</span>
                    </div>
                  )}

                  {/* 동일 WiFi 연결 가이드 & Mixed Content 우회 옵션 (스트림 로딩 실패 시) */}
                  {streamError && streamUrl && mode !== 'mock' && (
                    <div className="absolute bottom-3 inset-x-3 z-10 flex flex-col items-center justify-center gap-1 p-2.5 bg-black/85 backdrop-blur-sm rounded-xl text-[11px] text-gray-200 border border-white/10 text-center">
                      <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                        <Wifi size={13} className="shrink-0" />
                        <span>ESP32 실시간 화면에 연결할 수 없습니다</span>
                      </div>
                      <p className="text-[10px] text-gray-400 leading-relaxed max-w-sm">
                        {typeof window !== 'undefined' && window.location.protocol === 'https:'
                          ? 'HTTPS 환경에서는 브라우저 보안으로 로컬 HTTP 스트림이 차단될 수 있습니다. 로컬(http://localhost:3000)에서 실행하거나 아래 버튼으로 열어보세요.'
                          : 'ESP32와 동일한 Wi-Fi 네트워크에 접속되어 있는지 확인해 주세요.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => window.open(streamUrl, '_blank')}
                        className="mt-0.5 px-3 py-1 bg-white/15 hover:bg-white/25 text-white rounded text-[10px] font-medium transition-colors border border-white/10"
                      >
                        새 창에서 스트림 직접 열기 ({detectedIp || 'ESP32'}) ↗
                      </button>
                    </div>
                  )}

                  {/* 격자 및 가이드 라인 오버레이 */}
                  <div className={`absolute inset-0 transition-opacity duration-300 ${streamUrl && !streamError ? 'opacity-20 pointer-events-none' : 'opacity-10'}`}>
                    {[...Array(10)].map((_, i) => (
                      <div key={`h${i}`} className="absolute w-full h-px bg-green-400" style={{ top: `${i * 10}%` }} />
                    ))}
                    {[...Array(10)].map((_, i) => (
                      <div key={`v${i}`} className="absolute h-full w-px bg-green-400" style={{ left: `${i * 10}%` }} />
                    ))}
                  </div>

                  {/* 피부 정밀 측정 포커스 타겟 (부위별 접촉/초점 영역) */}
                  <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${streamUrl && !streamError ? 'opacity-40' : 'opacity-60'}`}>
                    <div className="relative w-44 h-44 border border-dashed border-emerald-400/60 rounded-2xl flex items-center justify-center">
                      {/* 4개 모서리 브래킷 */}
                      <div className="absolute -top-0.5 -left-0.5 w-4 h-4 border-t-2 border-l-2 border-emerald-400 rounded-tl-md" />
                      <div className="absolute -top-0.5 -right-0.5 w-4 h-4 border-t-2 border-r-2 border-emerald-400 rounded-tr-md" />
                      <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 border-b-2 border-l-2 border-emerald-400 rounded-bl-md" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 border-b-2 border-r-2 border-emerald-400 rounded-br-md" />
                      {/* 중앙 십자선 타겟 */}
                      <div className="w-5 h-0.5 bg-emerald-400/70" />
                      <div className="h-5 w-0.5 bg-emerald-400/70 absolute" />
                    </div>
                  </div>

                  {scanStatus === 'scanning' && (
                    <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-scan-line z-10" />
                  )}
                  {scanStatus === 'countdown' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
                      <div className="text-center">
                        <div className="text-7xl font-bold text-green-400 animate-pulse">{countdown}</div>
                        <p className="text-green-300 text-sm mt-2">스캔 준비 중...</p>
                      </div>
                    </div>
                  )}
                  {scanStatus === 'complete' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-4 z-20 animate-fadeIn text-center">
                      <div className="flex items-center gap-2 mb-3 bg-emerald-500/20 text-emerald-300 px-3.5 py-1.5 rounded-full border border-emerald-400/30 shadow-sm">
                        <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                        <span className="text-xs font-bold">스캔 및 듀얼 촬영 완료!</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-3">
                        <div className="rounded-xl overflow-hidden border border-emerald-400/40 relative shadow-lg bg-black/40">
                          <img
                            src="/assets/demo_white_light.jpg"
                            alt="White Light"
                            className="w-full aspect-square object-cover"
                          />
                          <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-black/75 backdrop-blur-xs text-[10px] text-white rounded font-medium border border-white/10">
                            White 5500K
                          </span>
                        </div>
                        <div className="rounded-xl overflow-hidden border border-purple-400/40 relative shadow-lg bg-black/40">
                          <img
                            src="/assets/demo_uv_light.jpg"
                            alt="UV Light"
                            className="w-full aspect-square object-cover"
                          />
                          <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-black/75 backdrop-blur-xs text-[10px] text-purple-200 rounded font-medium border border-purple-400/20">
                            UV 395nm
                          </span>
                        </div>
                      </div>
                      <p className="text-white text-sm font-bold tracking-tight">AI 12개 지표 정밀 분석 중...</p>
                      <p className="text-emerald-400 text-xs mt-1 animate-pulse font-medium">분석 결과 페이지로 이동합니다</p>
                    </div>
                  )}
                  {scanStatus === 'error' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6 text-center z-30">
                      <div>
                        <AlertTriangle size={44} className="text-orange-400 mx-auto mb-3 animate-pulse" />
                        <p className="text-white text-base font-semibold mb-1">측정에 실패했습니다</p>
                        <p className="text-gray-300 text-xs mb-4 leading-relaxed max-w-xs">{scanErrorMsg}</p>
                        <button
                          onClick={() => {
                            if (isScannerBlocked) {
                              checkScanner();
                            } else {
                              startScan();
                            }
                          }}
                          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold rounded-lg transition-colors shadow"
                        >
                          {isScannerBlocked ? '스캐너 재연결 확인' : '다시 시도하기'}
                        </button>
                      </div>
                    </div>
                  )}
                  {scanStatus === 'ready' && (
                    <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
                      <p className="text-green-400/80 text-sm">[{selectedArea}] 부위를 중앙에 맞춰주세요</p>
                    </div>
                  )}
                </div>

                {/* 진행 바 */}
                {scanStatus === 'scanning' && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-text-secondary mb-1">
                      <span>스캔 진행 중...</span>
                      <span>{scanProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full transition-all duration-100" style={{ width: `${scanProgress}%` }} />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-text-secondary mb-4">
                  <span>
                    {scanStatus === 'ready' && '스캔 준비 완료'}
                    {scanStatus === 'countdown' && '카운트다운...'}
                    {scanStatus === 'scanning' && '스캔 중 움직이지 마세요'}
                    {scanStatus === 'complete' && '스캔 완료!'}
                    {scanStatus === 'error' && '측정 실패'}
                  </span>
                </div>

                <Button
                  onClick={startScan}
                  disabled={scanStatus === 'scanning' || scanStatus === 'countdown' || isScannerBlocked}
                  className={`w-full text-base transition-all ${
                    isScannerBlocked
                      ? 'opacity-60 cursor-not-allowed bg-gray-200 text-gray-500 hover:bg-gray-200 border-gray-300 shadow-none'
                      : ''
                  }`}
                  size="lg"
                >
                  <ScanIcon size={20} />
                  {isScannerBlocked
                    ? (scannerStatus === 'checking' ? '스캐너 확인 중...' : '스캐너 연결 후 스캔 가능')
                    : (scanStatus === 'ready' ? '스캔 시작하기' :
                       scanStatus === 'error' ? '다시 시도하기' :
                       scanStatus === 'complete' ? '다시 스캔하기' : '스캔 중...')}
                </Button>

                {isScannerBlocked && (
                  <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-2.5 text-xs text-orange-700 animate-fadeIn">
                    <AlertTriangle size={15} className="shrink-0 text-orange-500 mt-0.5" />
                    <div>
                      <p className="font-semibold mb-0.5">스캐너 연결 후 측정이 가능합니다</p>
                      <p className="text-orange-600 leading-relaxed">
                        {scannerStatus === 'checking'
                          ? '스캐너 연결 상태를 확인하고 있습니다. 잠시만 기다려주세요.'
                          : 'ESP32 스캐너가 아직 연결되지 않았습니다. 같은 Wi-Fi에 연결되어 있는지 확인하거나, 우측 상단에서 [시연용] 모드로 전환하시면 바로 체험할 수 있습니다.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 주의사항 */}
              <div className="card">
                <h3 className="text-sm font-semibold text-text-primary mb-4">스캔 시 주의사항</h3>
                <div className="space-y-3">
                  {checklist.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <Icon size={18} className={item.type === 'ok' ? 'text-primary-500' : 'text-orange-400'} />
                        <span className="text-sm text-text-secondary">{item.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 설정 패널 */}
            <div className="desktop:col-span-5 space-y-6">
              <div className="card">
                <h3 className="text-sm font-semibold text-text-primary mb-4">스캔 설정</h3>

                {/* AI 분석 모드 토글 */}
                <div className="mb-5 pb-4 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-text-primary">AI 분석 모드</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      mode === 'mock'
                        ? 'bg-purple-50 text-purple-600 border-purple-200/60'
                        : 'bg-emerald-50 text-emerald-600 border-emerald-200/60'
                    }`}>
                      {mode === 'mock' ? '시연 모드 활성' : '실시간 AI 연동'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl">
                    <button
                      type="button"
                      disabled={scanStatus === 'scanning' || scanStatus === 'countdown'}
                      onClick={() => {
                        setMode('mock');
                        if (scanStatus === 'error') setScanStatus('ready');
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${
                        mode === 'mock'
                          ? 'bg-white text-primary-600 shadow-xs'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      시연용
                    </button>
                    <button
                      type="button"
                      disabled={scanStatus === 'scanning' || scanStatus === 'countdown'}
                      onClick={() => setMode('real')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${
                        mode === 'real'
                          ? 'bg-primary-500 text-white shadow-xs'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      실제 AI
                    </button>
                  </div>
                  <p className="text-[11px] text-text-secondary mt-1.5">
                    {mode === 'mock'
                      ? '⚡ 끊김 없는 시연 촬영을 위한 사전 큐레이션 데이터 모드입니다.'
                      : '🔬 ESP32 스캐너 및 백엔드 AI 모델을 호출하여 실시간 분석합니다.'}
                  </p>
                </div>

                <div className="mb-5">
                  <p className="text-xs font-semibold text-text-primary mb-2.5">측정 부위</p>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {SCAN_AREAS.map((area) => {
                      const isSelected = selectedArea === area;
                      return (
                        <button
                          key={area}
                          type="button"
                          disabled={scanStatus === 'scanning' || scanStatus === 'countdown'}
                          onClick={() => setSelectedArea(area)}
                          className={`flex items-center justify-center py-2.5 px-2 rounded-xl text-xs font-semibold transition-all border disabled:opacity-50 disabled:cursor-not-allowed ${
                            isSelected
                              ? 'bg-primary-50 border-primary-500 text-primary-700 font-bold shadow-xs ring-1 ring-primary-500'
                              : 'bg-white border-gray-200 text-text-secondary hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <span className="truncate">{area}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-text-secondary mb-2">측정 항목</p>
                  <div className="space-y-3">
                    {MEASUREMENT_ITEMS.map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <span className="text-sm text-text-primary">{item.label}</span>
                        <button
                          disabled={scanStatus === 'scanning' || scanStatus === 'countdown'}
                          onClick={() => toggleMeasurement(item.id)}
                          className={`relative w-11 h-6 rounded-full transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed ${
                            measurements[item.id] ? 'bg-primary-500' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`inline-block w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            measurements[item.id] ? 'translate-x-[22px]' : 'translate-x-[2px]'
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 스캐너 연결 카드 */}
              <div className="card">
                <h3 className="text-sm font-semibold text-text-primary mb-3">스캐너 연결</h3>
                <div className={`rounded-xl p-4 flex items-center gap-3 ${
                  displayScannerStatus === 'ok' ? 'bg-primary-50' : 'bg-orange-50'
                }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    displayScannerStatus === 'ok' ? 'bg-primary-100' : 'bg-orange-100'
                  }`}>
                    {displayScannerStatus === 'ok'
                      ? <Wifi size={18} className="text-primary-500" />
                      : <WifiOff size={18} className="text-orange-500" />
                    }
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${displayScannerStatus === 'ok' ? 'text-primary-700' : 'text-orange-700'}`}>
                      {displayScannerStatus === 'ok' ? '스캐너 연결됨' : '스캐너 미연결'}
                    </p>
                    <p className={`text-xs ${displayScannerStatus === 'ok' ? 'text-primary-500' : 'text-orange-500'}`}>
                      {displayScannerMsg}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
};

export default ScanPage;
