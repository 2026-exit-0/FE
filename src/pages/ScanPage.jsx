import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scan as ScanIcon, CheckCircle, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import BottomNav from '../components/common/BottomNav';
import Button from '../components/common/Button';
import useAuth from '../hooks/useAuth';
import useScanStore from '../store/scanStore';
import { getScannerHealth, measureWithScanner } from '../api/scan';
import { SCAN_AREAS, MEASUREMENT_ITEMS } from '../utils/constants';

// 하드웨어 실시간 스트림 엔드포인트 (하드웨어 팀에서 URL 확정 시 여기에 입력하거나 .env의 VITE_SCANNER_STREAM_URL 사용)
const SCANNER_STREAM_URL = import.meta.env.VITE_SCANNER_STREAM_URL || '';

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

  const [scanStatus, setScanStatus] = useState('ready');
  const [scanErrorMsg, setScanErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [scanProgress, setScanProgress] = useState(0);
  const [selectedArea, setSelectedArea] = useState('이마');
  const [scannerStatus, setScannerStatus] = useState('checking');
  const [scannerMsg, setScannerMsg] = useState('스캐너 상태 확인 중...');
  const [isStreamLoaded, setIsStreamLoaded] = useState(false);
  const [measurements, setMeasurements] = useState(
    MEASUREMENT_ITEMS.reduce((acc, item) => ({ ...acc, [item.id]: item.default }), {})
  );

  const isSubmittingRef = useRef(false);

  useEffect(() => { initializeIfNeeded(); }, [initializeIfNeeded]);

  // 스캐너 상태 확인
  useEffect(() => {
    let cancelled = false;
    getScannerHealth().then((data) => {
      if (cancelled) return;
      if (data.status === 'ok') {
        setScannerStatus('ok');
        setScannerMsg(`스캐너 연결됨 (상태: ${data.esp32_data?.state || '대기 중'})`);
      } else {
        setScannerStatus('unreachable');
        setScannerMsg(data.message || '스캐너 미연결 — Wi-Fi 확인');
      }
    }).catch(() => {
      if (!cancelled) {
        setScannerStatus('unreachable');
        setScannerMsg('서버 응답 없음');
      }
    });
    return () => { cancelled = true; };
  }, []);

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

  // 스캔 진행 (mock: 프로그레스 바, real: API 응답 대기)
  useEffect(() => {
    if (scanStatus !== 'scanning') return;

    if (scanProgress < 100) {
      const t = setTimeout(() => setScanProgress((p) => Math.min(p + 2, 100)), 100);
      return () => clearTimeout(t);
    }

    // 진행바 완료 → 실제 API 호출 (중복 호출 방지)
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
        setTimeout(() => navigate('/analysis'), 1200);
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
  }, [scanStatus, scanProgress, navigate, selectedArea, addScan, userInputs]);

  const startScan = useCallback(() => {
    if (scanStatus === 'scanning' || scanStatus === 'countdown' || isSubmittingRef.current) return;
    isSubmittingRef.current = false;
    setScanStatus('countdown');
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
          <div className="grid grid-cols-1 desktop:grid-cols-12 gap-6">

            {/* 스캔 인터페이스 */}
            <div className="desktop:col-span-7 space-y-6">
              <div className="card overflow-hidden">
                {/* 스캐너 연결 상태 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full transition-colors ${
                      scannerStatus === 'ok' ? 'bg-green-500' :
                      scannerStatus === 'checking' ? 'bg-yellow-400 animate-pulse' :
                      'bg-orange-400'
                    }`} />
                    <span className="text-sm text-text-secondary">{scannerMsg}</span>
                  </div>
                  <span className="text-xs text-text-secondary">UV 모드</span>
                </div>

                {/* 카메라 / 얼굴 가이드 */}
                <div className="bg-gray-900 rounded-2xl aspect-[4/3] relative flex items-center justify-center mb-4 overflow-hidden shadow-inner">
                  {/* 하드웨어 실시간 MJPEG 스트림 (URL이 있고 연결 성공 시 표시) */}
                  {SCANNER_STREAM_URL && (
                    <img
                      src={SCANNER_STREAM_URL}
                      alt="실시간 스캐너 화면"
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                        isStreamLoaded ? 'opacity-100' : 'opacity-0 pointer-events-none'
                      }`}
                      onLoad={() => setIsStreamLoaded(true)}
                      onError={() => setIsStreamLoaded(false)}
                    />
                  )}

                  {/* 스트림 상태 뱃지 (실시간 스트림 연결 시 표시) */}
                  {isStreamLoaded && (
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-full text-[11px] text-white font-medium border border-white/10">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      <span className="text-red-400 font-bold">LIVE</span>
                      <span className="text-gray-300">스캐너 화면</span>
                    </div>
                  )}

                  {/* 격자 및 가이드 라인 오버레이 */}
                  <div className={`absolute inset-0 transition-opacity duration-300 ${isStreamLoaded ? 'opacity-20 pointer-events-none' : 'opacity-10'}`}>
                    {[...Array(10)].map((_, i) => (
                      <div key={`h${i}`} className="absolute w-full h-px bg-green-400" style={{ top: `${i * 10}%` }} />
                    ))}
                    {[...Array(10)].map((_, i) => (
                      <div key={`v${i}`} className="absolute h-full w-px bg-green-400" style={{ left: `${i * 10}%` }} />
                    ))}
                  </div>

                  {/* 얼굴 윤곽 가이드 SVG */}
                  <svg viewBox="0 0 200 280" className={`h-[80%] w-auto pointer-events-none transition-opacity duration-300 ${isStreamLoaded ? 'opacity-30' : 'opacity-40'}`} fill="none" stroke="#4CAF50" strokeWidth="1.5">
                    <ellipse cx="100" cy="130" rx="70" ry="90" />
                    <ellipse cx="70" cy="115" rx="12" ry="8" />
                    <ellipse cx="130" cy="115" rx="12" ry="8" />
                    <ellipse cx="100" cy="145" rx="8" ry="10" />
                    <path d="M85 175 Q100 185 115 175" />
                  </svg>

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
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
                      <div className="text-center">
                        <CheckCircle size={48} className="text-green-400 mx-auto mb-3" />
                        <p className="text-green-300 text-lg font-semibold">스캔 완료!</p>
                        <p className="text-green-400/60 text-sm mt-1">분석 페이지로 이동 중...</p>
                      </div>
                    </div>
                  )}
                  {scanStatus === 'error' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6 text-center z-30">
                      <div>
                        <AlertTriangle size={44} className="text-orange-400 mx-auto mb-3 animate-pulse" />
                        <p className="text-white text-base font-semibold mb-1">측정에 실패했습니다</p>
                        <p className="text-gray-300 text-xs mb-4 leading-relaxed max-w-xs">{scanErrorMsg}</p>
                        <button
                          onClick={startScan}
                          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold rounded-lg transition-colors shadow"
                        >
                          다시 시도하기
                        </button>
                      </div>
                    </div>
                  )}
                  {scanStatus === 'ready' && !isStreamLoaded && (
                    <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
                      <p className="text-green-400/80 text-sm">스캔 부위를 중앙에 맞춰주세요</p>
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
                  disabled={scanStatus === 'scanning' || scanStatus === 'countdown'}
                  className="w-full text-base"
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

                <div className="mb-5">
                  <p className="text-xs font-medium text-text-secondary mb-2">측정 부위</p>
                  <div className="flex flex-wrap gap-2">
                    {SCAN_AREAS.map((area) => (
                      <button
                        key={area}
                        disabled={scanStatus === 'scanning' || scanStatus === 'countdown'}
                        onClick={() => setSelectedArea(area)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          selectedArea === area
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                        }`}
                      >
                        {area}
                      </button>
                    ))}
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
                  scannerStatus === 'ok' ? 'bg-primary-50' : 'bg-orange-50'
                }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    scannerStatus === 'ok' ? 'bg-primary-100' : 'bg-orange-100'
                  }`}>
                    {scannerStatus === 'ok'
                      ? <Wifi size={18} className="text-primary-500" />
                      : <WifiOff size={18} className="text-orange-500" />
                    }
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${scannerStatus === 'ok' ? 'text-primary-700' : 'text-orange-700'}`}>
                      {scannerStatus === 'ok' ? '스캐너 연결됨' : '스캐너 미연결'}
                    </p>
                    <p className={`text-xs ${scannerStatus === 'ok' ? 'text-primary-500' : 'text-orange-500'}`}>
                      {scannerMsg}
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
