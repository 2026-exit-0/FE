import { Link } from 'react-router-dom';
import {
  Scan, ArrowRight, Droplets, Sun, Sparkles,
  ShieldCheck, Cpu, Brain, BarChart3, CheckCircle2,
  Camera, Zap, Award, ShoppingBag, Layers, Eye
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
          <Link to="/" className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-600 to-emerald-400 flex items-center justify-center text-white font-black text-base shadow-sm">
              담
            </span>
            <div className="flex flex-col">
              <span className="text-base font-extrabold text-text-primary tracking-tight leading-none">담다</span>
              <span className="text-[10px] text-text-secondary font-medium tracking-wider uppercase">DAMDA SkinLab</span>
            </div>
          </Link>

          <nav className="hidden tablet:flex items-center gap-8 text-xs font-semibold text-text-secondary">
            <a href="#how-it-works" className="hover:text-primary-600 transition-colors">측정 원리</a>
            <a href="#features" className="hover:text-primary-600 transition-colors">핵심 기술</a>
            <a href="#showcase" className="hover:text-primary-600 transition-colors">진단 리포트</a>
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
              <span>1초 체험 시작하기</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── 1. 메인 히어로 섹션 (Editorial Hero) ── */}
      <section className="relative overflow-hidden pt-8 pb-16 tablet:py-20">
        {/* 유기적 앰비언트 배경 블러 */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 desktop:grid-cols-12 gap-10 items-center">
            {/* 좌측: 타이포그래피 & 핵심 가치 */}
            <div className="desktop:col-span-6 space-y-6 text-center desktop:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200/80 shadow-sm mx-auto desktop:mx-0">
                <Sparkles size={14} className="text-emerald-600" />
                <span>AI 기반 듀얼 LED 정밀 피부 분석 솔루션</span>
              </div>

              <h1 className="text-3xl sm:text-4xl tablet:text-5xl font-black text-text-primary tracking-tight leading-[1.2]">
                보이지 않는 피부 속까지,<br />
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  단 4초 만에 정밀하게
                </span><br />
                담아내다.
              </h1>

              <p className="text-sm tablet:text-base text-text-secondary leading-relaxed max-w-xl mx-auto desktop:mx-0 font-normal">
                ESP32-CAM 듀얼 광원(White 5500K / UV 395nm)과 ResNet-50 딥러닝 멀티태스크 AI로
                수분·유분·모공·탄력·색소침착을 정밀 진단하고, 14만 개 전성분 데이터베이스 기반 초개인화 맞춤 스킨케어를 제안합니다.
              </p>

              <div className="flex flex-col sm:flex-row gap-3.5 justify-center desktop:justify-start pt-2">
                <Link
                  to="/login"
                  className="btn-primary text-sm px-7 py-3.5 rounded-2xl font-bold inline-flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 hover:shadow-xl transition-all"
                >
                  <Scan size={18} />
                  <span>지금 무료 피부 스캔하기</span>
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/login"
                  className="btn-outline text-sm px-6 py-3.5 rounded-2xl font-bold inline-flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-100 transition-all"
                >
                  <span>✨ 1초 데모 체험하기</span>
                </Link>
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

            {/* 우측: 듀얼 스캐너 & 진단 리포트 인터페이스 쇼케이스 카드 */}
            <div className="desktop:col-span-6 w-full max-w-xl mx-auto">
              <div className="relative rounded-3xl bg-white border border-gray-200/80 p-5 sm:p-6 shadow-2xl space-y-5">
                
                {/* 상단: 스캐너 실시간 상태 바 */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-extrabold text-text-primary">DAMDA Dual-LED IoT Scanner</span>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                    Online 🟢
                  </span>
                </div>

                {/* 중앙: 듀얼 LED 촬영 사진 비교 뷰 (실제 데모 사진) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-text-primary px-1">
                    <span>듀얼 스펙트럼 촬영 결과 (Dual-Light)</span>
                    <span className="text-[10px] text-primary-600 font-semibold">동시 교차 분석</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {/* 일반광 */}
                    <div className="rounded-xl overflow-hidden border border-gray-200 bg-[#f8ede3] relative group">
                      <img src="/assets/demo_white_light.jpg" alt="일반광 피부" className="w-full aspect-[4/3] object-cover" />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[9px] text-white backdrop-blur-sm font-semibold">
                        White Light 5500K
                      </div>
                      <div className="p-2 bg-white text-[10px] text-text-secondary font-medium">
                        표면 모공 · 피부결 정밀 감지
                      </div>
                    </div>

                    {/* UV 형광 */}
                    <div className="rounded-xl overflow-hidden border border-purple-200 bg-[#090614] relative group">
                      <img src="/assets/demo_uv_light.jpg" alt="UV 피부" className="w-full aspect-[4/3] object-cover" />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-purple-950/80 text-[9px] text-purple-200 border border-purple-700/50 backdrop-blur-sm font-semibold">
                        UV 395nm 형광
                      </div>
                      <div className="p-2 bg-white text-[10px] text-text-secondary font-medium">
                        피지 포르피린 · 잠재 멜라닌 감지
                      </div>
                    </div>
                  </div>
                </div>

                {/* 하단: 실시간 종합 점수 & 실시간 환경 연동 칩 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-800 font-semibold block">종합 피부 진단</span>
                      <span className="text-lg font-black text-emerald-950">84점 (양호)</span>
                      <span className="text-[10px] text-emerald-700 block">복합성 피부 타입</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      84
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-amber-800 font-semibold block">현재 외출 환경</span>
                      <span className="text-lg font-black text-amber-950">{weather?.temp ?? 23}°C / {weather?.humidity ?? 55}%</span>
                      <span className="text-[10px] text-amber-700 block">자외선: {uvInfo.label}</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-sm">
                      <Sun size={18} />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. 핵심 지표 카운터 바 (Metrics Bar) ── */}
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

      {/* ── 5. 하단 강력한 프리미엄 CTA 섹션 ── */}
      <section className="py-16 tablet:py-20 bg-gradient-to-br from-emerald-900 via-primary-800 to-teal-950 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-200 text-xs font-semibold border border-white/10">
            <Sparkles size={13} />
            지금 바로 시작하세요
          </span>

          <h2 className="text-2xl sm:text-3xl tablet:text-4xl font-extrabold tracking-tight leading-tight">
            내 피부 상태를 정확히 알고,<br />
            근거 있는 맞춤 스킨케어를 경험하세요.
          </h2>

          <p className="text-xs sm:text-sm text-emerald-100/80 max-w-lg mx-auto font-normal leading-relaxed">
            별도의 복잡한 가입 없이 1초 간편 체험으로 모든 대시보드와 AI 진단 리포트를 둘러보실 수 있습니다.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              to="/login"
              className="w-full sm:w-auto btn-primary bg-white text-emerald-950 hover:bg-emerald-50 text-sm px-8 py-3.5 rounded-2xl font-bold shadow-xl transition-all"
            >
              1초 간편 체험으로 시작하기 ➔
            </Link>
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
