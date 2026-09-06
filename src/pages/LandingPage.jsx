import { Link } from 'react-router-dom';
import {
  Scan, ArrowRight, Droplets, Sun, Thermometer,
  ShieldCheck, Cpu, Brain, BarChart3, CheckCircle2,
  Camera, Sparkles
} from 'lucide-react';
import useWeather from '../hooks/useWeather';
import { UV_LEVELS } from '../utils/constants';

const LandingPage = () => {
  const { weather } = useWeather();
  const uvInfo = UV_LEVELS[weather?.uv] || UV_LEVELS.moderate;

  const steps = [
    {
      step: '01',
      title: 'IoT 듀얼 LED 정밀 촬영',
      desc: '백색광(5500K) 반사 측정과 395nm UV 형광 촬영으로 표면 피부결과 잠재 색소침착을 4초 만에 자동 측정합니다.',
      icon: Camera,
      tag: 'ESP32-CAM 듀얼광',
    },
    {
      step: '02',
      title: 'AI 딥러닝 12개 지표 분석',
      desc: 'ResNet-50 멀티태스크 모델이 단일 이미지로 수분·유분·탄력·모공·색소침착 등 12개 세부 지표를 정밀 추정합니다.',
      icon: Brain,
      tag: 'ResNet-50 Multi-Task',
    },
    {
      step: '03',
      title: '14만 전성분 맞춤 처방',
      desc: '분석된 피부 타입과 고민, 현재 외출 환경(날씨·자외선)을 종합하여 가장 안전하고 효과적인 화장품을 큐레이션합니다.',
      icon: Sparkles,
      tag: '초개인화 큐레이션',
    },
  ];

  const features = [
    {
      icon: Camera,
      title: 'White & UV 듀얼 광원 스캔',
      desc: '육안으로 보이는 피부결뿐 아니라 피부 속 잠재 피지(포르피린)와 멜라닌 색소까지 정밀 감지합니다.',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
    },
    {
      icon: Cpu,
      title: 'FDC2112 정밀 수분 센싱',
      desc: '정전용량 방식 표피 수분 센서와 VEML7700 조도 센서로 환경 오차를 실시간 보정합니다.',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
    },
    {
      icon: BarChart3,
      title: '5각형 레이더 & 시계열 추적',
      desc: '과거 측정 이력과 비교하여 내 피부의 개선 추이를 한눈에 파악하고 PDF 리포트로 출력합니다.',
      bg: 'bg-purple-50',
      text: 'text-purple-600',
    },
    {
      icon: Sun,
      title: '실시간 날씨 & UV 피부 방어',
      desc: '기상청 실시간 온·습도 및 자외선 지수를 반영하여 외출 전 즉각적인 피부 보호 가이드를 제공합니다.',
      bg: 'bg-amber-50',
      text: 'text-amber-600',
    },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf8] text-text-primary">
      {/* ── 상단 네비게이션 ── */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary-500"></span>
            <span className="text-xl font-bold text-text-primary">담다</span>
          </Link>

          <nav className="hidden tablet:flex items-center gap-8 text-xs font-semibold text-text-secondary">
            <a href="#how-it-works" className="hover:text-primary-600 transition-colors">측정 원리</a>
            <a href="#features" className="hover:text-primary-600 transition-colors">핵심 기술</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs font-bold text-text-secondary hover:text-text-primary px-3 py-2 transition-colors"
            >
              로그인
            </Link>
            <Link
              to="/login"
              className="btn-primary text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-sm"
            >
              <span>시작하기</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── 1. 메인 히어로 섹션 ── */}
      <section className="relative overflow-hidden pt-8 pb-16 tablet:py-20">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 desktop:grid-cols-12 gap-10 items-center">
            {/* 좌측: 타이포그래피 & 핵심 가치 */}
            <div className="desktop:col-span-6 space-y-6 text-center desktop:text-left">
              <h1 className="text-3xl sm:text-4xl tablet:text-5xl font-black text-text-primary tracking-normal leading-[1.35] tablet:leading-[1.45]">
                내 피부를 정확하게<br />
                <span className="inline-block mt-2.5 sm:mt-3 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  분석하고 관리하세요
                </span>
              </h1>

              <p className="text-sm tablet:text-base text-text-secondary leading-relaxed max-w-xl mx-auto desktop:mx-0 font-normal pt-1">
                IoT 스캐너와 AI 딥러닝 분석으로<br />
                수분·유분·모공·색소침착을 정밀하게 측정하고<br />
                나만의 스킨케어 루틴을 제안받으세요.
              </p>

              <div className="flex flex-col sm:flex-row gap-3.5 justify-center desktop:justify-start pt-2">
                <Link
                  to="/login"
                  className="btn-primary text-sm px-7 py-3.5 rounded-2xl font-bold inline-flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 hover:shadow-xl transition-all"
                >
                  <Scan size={18} />
                  <span>피부 스캔 시작하기</span>
                  <ArrowRight size={16} />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="btn-outline text-sm px-6 py-3.5 rounded-2xl font-bold inline-flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-100 transition-all cursor-pointer"
                >
                  <span>서비스 알아보기</span>
                </button>
              </div>

              {/* 신뢰도 뱃지 칩 */}
              <div className="flex items-center justify-center desktop:justify-start gap-4 pt-4 text-xs text-text-secondary font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-500" />
                  <span>14만 제품 전성분 매칭</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-500" />
                  <span>12개 지표 다중 추정</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-500" />
                  <span>비침습 정밀 스캔</span>
                </div>
              </div>
            </div>

            {/* 우측: 정갈한 실시간 날씨 & 환경 카드 */}
            <div className="desktop:col-span-6 w-full max-w-md mx-auto">
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-7 sm:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-text-primary">
                    오늘의 실시간 날씨
                  </h3>
                  <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-3 py-1 rounded-full border border-primary-100">
                    📍 {weather?.region || '현재 위치'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3.5">
                  {/* 기온 */}
                  <div className="text-center p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2 shadow-sm">
                      <Thermometer size={20} />
                    </div>
                    <p className="text-xl font-extrabold text-blue-900">{weather?.temp ?? 22}°C</p>
                    <span className="text-[11px] text-text-secondary font-medium">기온</span>
                  </div>

                  {/* 습도 */}
                  <div className="text-center p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2 shadow-sm">
                      <Droplets size={20} />
                    </div>
                    <p className="text-xl font-extrabold text-emerald-900">{weather?.humidity ?? 45}%</p>
                    <span className="text-[11px] text-text-secondary font-medium">습도</span>
                  </div>

                  {/* 자외선 */}
                  <div className={`text-center p-3.5 rounded-2xl border ${uvInfo.bg} ${uvInfo.border || 'border-amber-200'}`}>
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-2 shadow-sm">
                      <Sun size={20} />
                    </div>
                    <p className={`text-lg font-extrabold ${uvInfo.color} mt-0.5`}>
                      {uvInfo.label}
                    </p>
                    <span className="text-[11px] text-text-secondary font-medium">자외선</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-emerald-50/90 to-primary-50/70 rounded-2xl p-4 border border-emerald-100/70 flex items-start gap-3">
                  <ShieldCheck size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                    {weather?.advice || '무난한 날씨예요. 기본 보습과 자외선 차단을 유지하세요.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. 핵심 지표 카운터 바 ── */}
      <section className="bg-white border-y border-gray-200/80 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 tablet:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl tablet:text-3xl font-black text-primary-600">140,000+</p>
              <p className="text-xs text-text-secondary mt-1 font-medium">안전성 검증 화장품 풀</p>
            </div>
            <div>
              <p className="text-2xl tablet:text-3xl font-black text-emerald-600">12개 지표</p>
              <p className="text-xs text-text-secondary mt-1 font-medium">회귀·분류 멀티태스크 AI</p>
            </div>
            <div>
              <p className="text-2xl tablet:text-3xl font-black text-primary-600">4초</p>
              <p className="text-xs text-text-secondary mt-1 font-medium">듀얼 LED 자동 스캔 시퀀스</p>
            </div>
            <div>
              <p className="text-2xl tablet:text-3xl font-black text-purple-600">395nm</p>
              <p className="text-xs text-text-secondary mt-1 font-medium">피지 포르피린 형광 검지</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. 3-Step 측정 프로세스 (How It Works) ── */}
      <section id="how-it-works" className="py-16 tablet:py-24 bg-[#fafaf8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-primary-600 uppercase tracking-wider bg-primary-50 px-3 py-1 rounded-full border border-primary-100">
              Process
            </span>
            <h2 className="text-2xl tablet:text-3xl font-extrabold text-text-primary mt-3">
              스캔부터 처방까지, 단 3단계로 완성
            </h2>
            <p className="text-xs tablet:text-sm text-text-secondary mt-2">
              가정에서 간편하게 정밀 측정하고 과학적 데이터 근거로 스킨케어를 관리하세요.
            </p>
          </div>

          <div className="grid grid-cols-1 tablet:grid-cols-3 gap-6">
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.step}
                  className="bg-white rounded-3xl p-7 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-3xl font-black text-primary-200">{s.step}</span>
                      <span className="text-[10px] font-bold bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full">
                        {s.tag}
                      </span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
                      <Icon size={22} />
                    </div>
                    <h3 className="text-base font-bold text-text-primary mb-2">
                      {s.title}
                    </h3>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 4. 담다(DAMDA) 핵심 기술 & 특장점 그리드 ── */}
      <section id="features" className="py-16 tablet:py-24 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-primary-600 uppercase tracking-wider bg-primary-50 px-3 py-1 rounded-full border border-primary-100">
              Technology
            </span>
            <h2 className="text-2xl tablet:text-3xl font-extrabold text-text-primary mt-3">
              하드웨어와 AI의 유기적 결합
            </h2>
            <p className="text-xs tablet:text-sm text-text-secondary mt-2">
              자체 제작 IoT 디바이스와 서버 인공지능이 엔드투엔드(End-to-End)로 연동됩니다.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 desktop:grid-cols-4 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-3xl p-6 bg-[#fbfbf9] border border-gray-100 hover:border-primary-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className={`w-12 h-12 rounded-2xl ${f.bg} ${f.text} flex items-center justify-center mb-4 shadow-inner`}>
                      <Icon size={22} />
                    </div>
                    <h3 className="text-sm font-bold text-text-primary mb-2">
                      {f.title}
                    </h3>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 푸터 ── */}
      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-secondary">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-500" />
            <span className="font-bold text-text-primary">담다 (DAMDA)</span>
            <span>| AI기반 정밀 피부 진단과 IoT 연동 솔루션</span>
          </div>
          <p>© 2026 DAMDA. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
