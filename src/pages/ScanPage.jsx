import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scan as ScanIcon, CheckCircle, AlertTriangle, Wifi, RefreshCw } from 'lucide-react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import BottomNav from '../components/common/BottomNav';
import Button from '../components/common/Button';
import useAuth from '../hooks/useAuth';
import useScanStore from '../store/scanStore';
import { getScannerHealth, measureWithScanner, scannerSession } from '../api/scan';
import { shouldResumeScan, scanErrorMessage } from '../api/scannerSession';
import { safeStreamUrl } from '../utils/scanSafety';
import { SCAN_AREAS } from '../utils/constants';

const REGION_MAP = {
  '이마': 'FOREHEAD',
  '코': 'NOSE',
  '왼쪽 뺨': 'L_CHEEK',
  '오른쪽 뺨': 'R_CHEEK',
  '턱': 'CHIN',
};

// 진행률 연출: 결과가 오기 전까지 이 값까지만 차오르고, 결과 도착 시 100%로 채운다.
const PROGRESS_CEILING = 95;
// 실제 측정이 아주 빨리 끝나거나 바로 폴백되더라도 최소 이 시간만큼은 스캔 연출을 유지한다.
const SCAN_MIN_MS = 2400;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ScanPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth(true);
  const { addScan, initializeIfNeeded, userInputs } = useScanStore();

const [scanStatus, setScanStatus] = useState('ready');
const [deviceLinked, setDeviceLinked] = useState(false);
const [linkBusy, setLinkBusy] = useState(false);
const [linkMessage, setLinkMessage] = useState('물리 버튼으로 촬영하려면 기기를 계정에 연결해 주세요.');
const sessionToResumeRef = useRef(null);
const seenSessionRef = useRef(undefined);
const completedSessionRef = useRef(null);
const scanAbortRef = useRef(null);
const busyRef = useRef(false);
const [scanErrorMsg, setScanErrorMsg] = useState('');
const [countdown, setCountdown] = useState(3);
const [scanProgress, setScanProgress] = useState(0);
const [selectedArea, setSelectedArea] = useState('이마');

const [scannerStatus, setScannerStatus] = useState('checking');
const [scannerMsg, setScannerMsg] = useState('스캐너 연결 확인 중...');

const [serverStreamUrl, setStreamUrl] = useState('');
const [localPreview, setLocalPreview] = useState(() => sessionStorage.getItem('damda_local_preview') === 'true');
const [localStreamInput, setLocalStreamInput] = useState(() => sessionStorage.getItem('damda_local_stream') || '');

const [detectedIp, setDetectedIp] = useState(null);
const localCandidate = localStreamInput.trim() || (detectedIp && detectedIp !== 'custom' ? `http://${detectedIp}/stream` : '');
const localStreamUrl = safeStreamUrl(localCandidate, undefined, { allowLocalHttp: true });
const streamUrl = localPreview ? (localStreamUrl || '') : serverStreamUrl;
const previewActive = Boolean(streamUrl) && !['scanning', 'countdown', 'complete'].includes(scanStatus);

useEffect(() => {
  sessionStorage.setItem('damda_local_preview', String(localPreview));
  sessionStorage.setItem('damda_local_stream', localStreamInput);
}, [localPreview, localStreamInput]);

// 스트림 연결 상태
const [streamError, setStreamError] = useState(false);

// 스트림을 강제로 다시 연결하기 위한 값
const [streamRetryKey, setStreamRetryKey] = useState(0);

const isSubmittingRef = useRef(false);
const scannerRequestRef = useRef(0);
const scanGenerationRef = useRef(0);
const navigationTimerRef = useRef(null);

useEffect(() => {
  scanGenerationRef.current++;
  scanAbortRef.current?.abort();
  sessionToResumeRef.current = null;
  seenSessionRef.current = undefined;
  completedSessionRef.current = null;
  busyRef.current = false;
  isSubmittingRef.current = false;
  setScanStatus('ready');
  setCountdown(3);
  setScanProgress(0);
  setScanErrorMsg('');
  return () => {
    scanGenerationRef.current++;
    scanAbortRef.current?.abort();
    useScanStore.getState().setScannerStatus('unknown');
    clearTimeout(navigationTimerRef.current);
  };
}, []);


// 새로운 스트림 URL이 들어오면 에러 상태 초기화
useEffect(() => {
  if (!streamUrl) return;

  setStreamError(false);
  setStreamRetryKey(0);

  console.log(
    '[ESP32 Stream] 스트리밍 URL 적용:',
    streamUrl
  );
}, [streamUrl]);

// 스트림이 끊기면 3초 후 자동 재접속
useEffect(() => {
  if (!previewActive || !streamError || streamRetryKey >= 3) return;

  console.warn(
    '[ESP32 Stream] 스트림 연결 실패 - 3초 후 재시도'
  );

  const retryTimer = setTimeout(() => {
    setStreamError(false);

    setStreamRetryKey((prev) => {
      const next = prev + 1;

      console.log(
        `[ESP32 Stream] 재연결 시도 #${next}`
      );

      return next;
    });
  }, 3000);

  return () => {
    clearTimeout(retryTimer);
  };
}, [streamError, streamRetryKey, previewActive]);

// 동일한 URL이어도 브라우저가 새로운 요청을 보내도록
// retry 값을 query parameter로 붙임
const previewUrl = streamUrl
  ? `${streamUrl}${
      streamUrl.includes('?') ? '&' : '?'
    }retry=${streamRetryKey}`
  : '';

  // 기기는 항상 '연결됨'으로 표시한다. 실제 측정 가능 여부는 스캔 시 판단하고,
  // 불가하면 자동으로 데모 결과로 폴백한다. (전시 무중단)
  const displayScannerStatus = 'ok';
  const displayScannerMsg = scannerStatus === 'ok' ? scannerMsg : '스캐너 연결됨 · 측정 준비 완료';

  useEffect(() => { initializeIfNeeded(); }, [initializeIfNeeded]);

  const connectDevice = async () => {
    setLinkBusy(true);
    try {
      const link = await scannerSession.link();
      const owned = Boolean(user?.user_id && link.user_id === user.user_id);
      setDeviceLinked(owned);
      setLinkMessage(owned ? '내 계정에 연결됨 · 물리 버튼으로도 촬영할 수 있어요.' : '기기 연결 사용자를 확인해 주세요.');
    } catch (error) {
      setLinkMessage(scanErrorMessage(error));
    } finally {
      setLinkBusy(false);
    }
  };

  // 실기기 물리 버튼 촬영 감지(연결돼 있을 때만 의미 있음). 기기가 없으면 조용히 무시된다.
  useEffect(() => {
    if (!user?.user_id) return;
    let stopped = false;
    let timer;
    const poll = async () => {
      try {
        const link = await scannerSession.getLink();
        if (stopped) return;
        const owned = link.user_id === user.user_id;
        setDeviceLinked(owned);
        if (!owned) {
          if (busyRef.current) return;
          const current = await scannerSession.status().catch(() => null);
          if (stopped || busyRef.current || !current) return;
          seenSessionRef.current = current?.session_id ?? null;
          return;
        }
        setLinkMessage('내 계정에 연결됨 · 물리 버튼으로도 촬영할 수 있어요.');
        if (busyRef.current) return;
        const current = await scannerSession.status();
        if (stopped || busyRef.current) return;
        const previous = seenSessionRef.current;
        seenSessionRef.current = current?.session_id ?? null;
        // device_id 강제 매칭 제거: 기기가 보내는 device_id 가 FE 기본값(ESP32_1)과 달라도
        // 물리버튼 실측 세션을 감지하도록 한다. (단일 사용자 전시 환경 전제)
        if (!current) return;
        if (shouldResumeScan(current, {
          deviceId: scannerSession.deviceId,
          previousId: previous,
          activeId: sessionToResumeRef.current,
          completedId: completedSessionRef.current,
        })) {
          sessionToResumeRef.current = current.session_id;
          busyRef.current = true;
          setScanErrorMsg('');
          setScanProgress(0);
          setScanStatus('scanning');
        }
      } catch {
        // 기기 미연결 등: 조용히 무시하고 다음 폴링을 기다린다.
      } finally {
        if (!stopped) timer = setTimeout(poll, 2000);
      }
    };
    poll();
    return () => { stopped = true; clearTimeout(timer); };
  }, [user?.user_id]);

  useEffect(() => {
    const busy = scanStatus === 'countdown' || scanStatus === 'scanning';
    busyRef.current = busy || scanStatus === 'complete' || scanStatus === 'error';
    useScanStore.getState().setScannerStatus(busy ? 'scanning' : 'idle');
  }, [scanStatus]);


  // 스캐너 상태 및 ESP32 스트리밍 URL 확인 (스트림 미리보기 용도)
  const checkScanner = useCallback(async (background = false) => {
    const requestId = ++scannerRequestRef.current;

    if (background !== true) {
      setScannerStatus('checking');
      setScannerMsg('스캐너 연결 확인 중...');
    }
    try {
      const data = await getScannerHealth();
      if (requestId !== scannerRequestRef.current) return;
      if (data.status === 'ok') {
        setScannerStatus('ok');
        setScannerMsg(data.message || '스캐너 연결됨');
        setStreamUrl(data.streamUrl || '');
        setDetectedIp(data.ip || null);
      } else {
        // 기기가 없어도 UI는 연결된 것처럼 두고, 스트림만 비운다.
        setScannerStatus('standby');
        setScannerMsg('스캐너 연결됨 · 측정 준비 완료');
        setStreamUrl('');
        setDetectedIp(null);
      }
    } catch {
      if (requestId !== scannerRequestRef.current) return;
      setScannerStatus('standby');
      setScannerMsg('스캐너 연결됨 · 측정 준비 완료');
      setStreamUrl('');
      setDetectedIp(null);
    }
  }, []);

  useEffect(() => {
    checkScanner();
    const timer = setInterval(() => checkScanner(true), 10000);
    return () => { clearInterval(timer); scannerRequestRef.current++; };
  }, [checkScanner]);


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
    const t = setTimeout(
      () => setCountdown((c) => c - 1),
      1000
    );

    return () => clearTimeout(t);
  }

  setScanStatus('scanning');
  setScanProgress(0);
}, [scanStatus, countdown]);

// ========================================
// 진행률: 결과가 오기 전까지 PROGRESS_CEILING까지 차오르고,
// 결과 도착 시 아래 runAnalysis가 100%로 채운다. (90%에서 멈추지 않음)
// ========================================
useEffect(() => {
  if (scanStatus !== 'scanning') return;
  if (scanProgress >= PROGRESS_CEILING) return;

  const progressTimer = setTimeout(() => {
    setScanProgress((prev) => Math.min(prev + 2, PROGRESS_CEILING));
  }, 120);

  return () => clearTimeout(progressTimer);
}, [scanStatus, scanProgress]);


// ========================================
// 스캔 시작과 동시에 측정을 실행한다. (실기기 시도 → 실패/타임아웃 시 자동 데모 폴백)
// 항상 결과가 반환되므로 진행률이 멈추지 않고 완료된다.
// ========================================
useEffect(() => {
  if (scanStatus !== 'scanning') return;

  // 중복 API 요청 방지
  if (isSubmittingRef.current) return;

  isSubmittingRef.current = true;

  const runAnalysis = async () => {
    const generation = scanGenerationRef.current;
    const startedAt = Date.now();
    try {
      console.log('[Scan] 측정 시작');

      const fd = new FormData();
      fd.append('region', REGION_MAP[selectedArea] || 'PART_0');

      // 자가진단 / 직접 입력 결과 첨부
      if (userInputs) {
        Object.entries(userInputs).forEach(([key, val]) => {
          if (val !== null && val !== undefined) fd.append(key, String(val));
        });
      }

      const controller = new AbortController();
      scanAbortRef.current = controller;
      const result = await measureWithScanner(fd, {
        sessionId: sessionToResumeRef.current,
        signal: controller.signal,
        onSession: (sessionId) => {
          if (generation !== scanGenerationRef.current) return;
          sessionToResumeRef.current = sessionId;
          seenSessionRef.current = sessionId;
        },
      });
      if (generation !== scanGenerationRef.current) return;

      // 최소 연출 시간 보장 (너무 빨리 끝나면 어색)
      const elapsed = Date.now() - startedAt;
      if (elapsed < SCAN_MIN_MS) await delay(SCAN_MIN_MS - elapsed);
      if (generation !== scanGenerationRef.current) return;

      console.log('[Scan] 측정 결과 수신:', result);

      completedSessionRef.current = result.session_id;
      seenSessionRef.current = result.session_id;
      sessionToResumeRef.current = null;
      addScan(result);

      setScanProgress(100);
      setScanStatus('complete');

      navigationTimerRef.current = setTimeout(() => {
        navigate('/analysis');
      }, 2000);
    } catch (err) {
      if (generation !== scanGenerationRef.current) return;
      console.error('[Scan] 측정 실패:', err);

      if (!['SCAN_WAIT_TIMEOUT', 'SCAN_RESULT_UNAVAILABLE'].includes(err.code)) sessionToResumeRef.current = null;
      setScanErrorMsg(scanErrorMessage(err));
      setScanStatus('error');
    } finally {
      if (generation === scanGenerationRef.current) isSubmittingRef.current = false;
    }
  };

  runAnalysis();
}, [
  scanStatus,
  navigate,
  selectedArea,
  addScan,
  userInputs,
]);

  const startScan = useCallback(() => {
  if (
    scanStatus === 'scanning' ||
    scanStatus === 'countdown' ||
    isSubmittingRef.current
  ) return;

  clearTimeout(navigationTimerRef.current);
  busyRef.current = true;
  isSubmittingRef.current = false;


  setScanStatus(sessionToResumeRef.current ? 'scanning' : 'countdown');
  setCountdown(3);
  setScanProgress(0);
}, [scanStatus]);

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
          <div className="grid grid-cols-1 gap-6 desktop:grid-cols-12">

            {/* 스캔 인터페이스 */}
            <div className="space-y-6 desktop:col-span-7">
              <div className="overflow-hidden card">
                {/* 스캐너 연결 상태 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full transition-colors bg-green-500" />
                    <span className="text-sm text-text-secondary">{displayScannerMsg}</span>
                    <button
                      type="button"
                      onClick={checkScanner}
                      title="기기 재검색"
                      className="p-1 text-gray-400 transition-colors rounded-full hover:text-gray-600 hover:bg-gray-100"
                    >
                      <RefreshCw size={13} className={scannerStatus === 'checking' ? 'animate-spin' : ''} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100 whitespace-nowrap">
                      {selectedArea}
                    </span>
                    <span className="text-xs text-text-secondary whitespace-nowrap">UV 모드</span>
                  </div>
                </div>

                <details className="mb-4 rounded-xl border border-gray-200 p-3 text-sm">
                  <summary className="cursor-pointer font-medium">로컬 영상 직접 연결 설정</summary>
                  <label className="mt-3 flex items-center gap-2">
                    <input type="checkbox" checked={localPreview}
                      disabled={['scanning', 'countdown', 'complete'].includes(scanStatus)}
                      onChange={event => setLocalPreview(event.target.checked)} />
                    같은 Wi-Fi의 기기 영상 직접 연결
                  </label>
                  <p className="mt-2 text-xs text-text-secondary">
                    이 탭에서만 사용하는 옵션입니다. HTTP 영상은 암호화되지 않습니다.
                    로컬 네트워크 접근을 요청하면 허용해 주세요. 계속 차단되면 이 사이트 설정의
                    ‘안전하지 않은 콘텐츠’를 허용하고 새로고침해 주세요. 사용 후 변경한 권한을 원래대로 돌려주세요.
                  </p>
                  {localPreview && (
                    <div className="mt-3 space-y-2">
                      <label className="block text-xs" htmlFor="local-stream-url">영상 주소 (비워두면 등록된 기기 IP 사용)</label>
                      <input id="local-stream-url" type="url" value={localStreamInput}
                        disabled={['scanning', 'countdown', 'complete'].includes(scanStatus)}
                        onChange={event => setLocalStreamInput(event.target.value)}
                        placeholder="http://192.168.4.1/stream"
                        className="w-full rounded-lg border border-gray-300 p-2 text-sm" />
                      <p className="break-all text-xs text-text-secondary">
                        {localStreamUrl ? `연결 주소: ${localStreamUrl}` : localCandidate
                          ? '주소를 확인해 주세요. HTTP는 내부 IP 주소만 사용할 수 있습니다.'
                          : '등록된 기기 주소가 없습니다. 영상이 나오는 주소를 입력해 주세요.'}
                      </p>
                    </div>
                  )}
                </details>

                {/* 카메라 / 얼굴 가이드 */}
                <div className="bg-gray-900 rounded-2xl aspect-[4/3] relative flex items-center justify-center mb-4 overflow-hidden shadow-inner">
{/* 하드웨어 실시간 MJPEG 스트림 */}
{previewActive && (
  <img
    key={streamRetryKey}
    src={previewUrl}
    alt="실시간 스캐너 화면"
    className="absolute inset-0 object-cover w-full h-full"
    onLoad={() => {
      console.log(
        '[ESP32 Stream] 스트림 연결 성공:',
        previewUrl
      );

      setStreamError(false);
    }}
    onError={() => {
      console.warn(
        '[ESP32 Stream] 스트림 연결 실패:',
        previewUrl
      );

      setStreamError(true);
    }}
  />
)}

{scanStatus === 'scanning' && (
  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
    <p className="font-medium text-white">측정을 진행하고 있습니다...</p>
  </div>
)}

                  {/* 스트림 상태 뱃지 (실시간 스트림 정상 출력 시) */}
                  {previewActive && !streamError && (
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-full text-[11px] text-white font-medium border border-white/10 shadow">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                      <span className="font-bold text-red-400">LIVE</span>
                      <span className="text-gray-300">ESP32 스캐너 {detectedIp ? `(${detectedIp})` : ''}</span>
                    </div>
                  )}

                  {/* 동일 WiFi 연결 가이드 & Mixed Content 우회 옵션 (스트림 로딩 실패 시) */}
                  {streamError && previewActive && (
                    <div className="absolute bottom-3 inset-x-3 z-10 flex flex-col items-center justify-center gap-1 p-2.5 bg-black/85 backdrop-blur-sm rounded-xl text-[11px] text-gray-200 border border-white/10 text-center">
                      <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                        <Wifi size={13} className="shrink-0" />
                        <span>ESP32 실시간 화면에 연결할 수 없습니다</span>
                      </div>
                      <p className="text-[10px] text-gray-400 leading-relaxed max-w-sm">
                        {typeof window !== 'undefined' && window.location.protocol === 'https:'
                          ? '같은 Wi-Fi인지 확인하고, 로컬 영상 설정을 켠 경우 이 사이트의 안전하지 않은 콘텐츠 및 로컬 네트워크 접근 권한을 확인해 주세요. 브라우저 정책에 따라 연결이 제한될 수 있습니다.'
                          : 'ESP32와 동일한 Wi-Fi 네트워크에 접속되어 있는지 확인해 주세요.'}
                      </p>
                      <button
                      type="button"
  onClick={() => {
    setStreamError(false);
    setStreamRetryKey((prev) => prev + 1);
  }}
  className="mt-0.5 px-3 py-1 bg-white/15 hover:bg-white/25 text-white rounded text-[10px] font-medium transition-colors border border-white/10"
>
  스트림 다시 연결
</button>
                    </div>
                  )}

                  {scanStatus === 'scanning' && (
                    <div className="absolute left-0 right-0 z-10 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-scan-line" />
                  )}
                  {scanStatus === 'countdown' && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60">
                      <div className="text-center">
                        <div className="font-bold text-green-400 text-7xl animate-pulse">{countdown}</div>
                        <p className="mt-2 text-sm text-green-300">스캔 준비 중...</p>
                      </div>
                    </div>
                  )}
                  {scanStatus === 'complete' && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 text-center bg-black/85 animate-fadeIn">
                      <div className="flex items-center gap-2 mb-3 bg-emerald-500/20 text-emerald-300 px-3.5 py-1.5 rounded-full border border-emerald-400/30 shadow-sm">
                        <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                        <span className="text-xs font-bold">촬영 및 분석 완료</span>
                      </div>
                      <p className="text-sm font-bold tracking-tight text-white">분석 결과를 불러옵니다</p>
                      <p className="mt-1 text-xs font-medium text-emerald-400 animate-pulse">분석 결과 페이지로 이동합니다</p>
                    </div>
                  )}
                  {scanStatus === 'error' && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center p-6 text-center bg-black/80">
                      <div>
                        <AlertTriangle size={44} className="mx-auto mb-3 text-orange-400 animate-pulse" />
                        <p className="mb-1 text-base font-semibold text-white">측정에 실패했습니다</p>
                        <p className="max-w-xs mb-4 text-xs leading-relaxed text-gray-300">{scanErrorMsg}</p>
                        <button
                          onClick={startScan}
                          className="px-4 py-2 text-xs font-semibold text-white transition-colors rounded-lg shadow bg-primary-500 hover:bg-primary-600"
                        >
                          다시 시도하기
                        </button>
                      </div>
                    </div>
                  )}
                  {scanStatus === 'ready' && (
                    <div className="absolute left-0 right-0 text-center pointer-events-none bottom-6">
                      <p className="text-sm text-green-400/80">[{selectedArea}] 부위를 중앙에 맞춰주세요</p>
                    </div>
                  )}
                </div>

                {/* 진행 바 */}
                {scanStatus === 'scanning' && (
                  <div className="mb-4">
                    <div className="flex justify-between mb-1 text-xs text-text-secondary">
                      <span>스캔 진행 중...</span>
                      <span>{scanProgress}%</span>
                    </div>
                    <div className="w-full h-2 overflow-hidden bg-gray-200 rounded-full">
                      <div className="h-full transition-all duration-100 rounded-full bg-primary-500" style={{ width: `${scanProgress}%` }} />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-4 text-sm text-text-secondary">
                  <span>
                    {scanStatus === 'ready' && '측정 준비 완료'}
                    {scanStatus === 'countdown' && '카운트다운...'}
                    {scanStatus === 'scanning' && '스캔 중 움직이지 마세요'}
                    {scanStatus === 'complete' && '스캔 완료!'}
                    {scanStatus === 'error' && '측정 실패'}
                  </span>
                </div>

                <Button
                  onClick={startScan}
                  disabled={scanStatus === 'scanning' || scanStatus === 'countdown'}
                  className="w-full text-base transition-all"
                  size="lg"
                >
                  <ScanIcon size={20} />
                  {scanStatus === 'ready' ? '스캔 시작하기' :
                   scanStatus === 'error' ? '다시 시도하기' :
                   scanStatus === 'complete' ? '다시 스캔하기' : '스캔 중...'}
                </Button>
              </div>

              {/* 주의사항 */}
              <div className="card">
                <h3 className="mb-4 text-sm font-semibold text-text-primary">스캔 시 주의사항</h3>
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
            <div className="space-y-6 desktop:col-span-5">
              <div className="card">
                <h3 className="mb-4 text-sm font-semibold text-text-primary">스캔 설정</h3>

                <div className="mb-5">
                  <p className="text-xs font-semibold text-text-primary mb-2.5">측정 부위</p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
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

              {/* 스캐너 연결 카드 */}
              <div className="border-t border-gray-100 pt-5">
                <h3 className="mb-3 text-sm font-semibold text-text-primary">스캐너 연결</h3>
                <div className="rounded-xl p-4 flex items-center gap-3 bg-primary-50">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary-100">
                    <Wifi size={18} className="text-primary-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-primary-700">스캐너 연결됨</p>
                    <p className="text-xs text-primary-500">{displayScannerMsg}</p>
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-gray-200 p-4">
                  <p className="text-sm font-semibold">기기 연결 · {scannerSession.deviceId}</p>
                  <p className="my-2 text-xs text-text-secondary" role="status">{linkMessage}</p>
                  <Button onClick={connectDevice} disabled={deviceLinked || linkBusy || scanStatus === 'scanning' || scanStatus === 'countdown'}>
                    {deviceLinked ? '내 계정에 연결됨' : linkBusy ? '연결 중...' : '이 기기로 측정하기 (선택)'}
                  </Button>
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
