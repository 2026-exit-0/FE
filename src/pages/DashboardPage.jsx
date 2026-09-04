import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Scan, BarChart3, ShoppingBag, BookOpen,
  Thermometer, Droplets, Sun, ArrowRight,
  Wifi, Sparkles, BatteryCharging,
  Heart, ShieldCheck, Clock, Award, ChevronRight, Moon, Check
} from 'lucide-react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import BottomNav from '../components/common/BottomNav';
import useAuth from '../hooks/useAuth';
import useWeather from '../hooks/useWeather';
import useScanStore from '../store/scanStore';
import { UV_LEVELS } from '../utils/constants';

const DashboardPage = () => {
  const { user } = useAuth(true);
  const { weather } = useWeather();
  const { scans, currentScan, initializeIfNeeded } = useScanStore();

  useEffect(() => {
    initializeIfNeeded();
  }, [initializeIfNeeded]);

  const hasScanData = scans.length > 0 || !!currentScan;
  const scanCount = scans.length;
  const uvInfo = UV_LEVELS[weather?.uv] || UV_LEVELS.moderate;

  // 대표 점수 및 지표
  const latestScore = currentScan?.overallScore || scans[0]?.overallScore || 84;
  const userSkinType = currentScan?.skinType || scans[0]?.skinType || '복합성 피부';

  // 퀵 서비스 4대 기능
  const quickAccess = [
    {
      icon: Scan,
      title: '정밀 피부 스캔',
      desc: '4초 듀얼 LED 수분·유분·모공 측정',
      tag: 'NEW 듀얼광',
      path: '/skin-check',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'hover:border-emerald-300',
    },
    {
      icon: ShoppingBag,
      title: '맞춤 화장품 추천',
      desc: '피부 타입 호환도 기반 14만 풀 매칭',
      tag: '성분 분석',
      path: '/products',
      color: 'text-rose-500',
      bg: 'bg-rose-50',
      border: 'hover:border-rose-300',
    },
    {
      icon: BarChart3,
      title: '시계열 리포트',
      desc: '5대 지표 레이더 차트 및 PDF 출력',
      tag: '변화 추적',
      path: '/analysis',
      color: 'text-blue-500',
      bg: 'bg-blue-50',
      border: 'hover:border-blue-300',
    },
    {
      icon: BookOpen,
      title: '1:1 케어 가이드',
      desc: '날씨·자외선 연동 데일리 루틴 처방',
      tag: '닥터 코칭',
      path: '/care-guide',
      color: 'text-amber-500',
      bg: 'bg-amber-50',
      border: 'hover:border-amber-300',
    },
  ];

  // 추천 제품 큐레이션 (알차/서울패스 카드형)
  const curatedProducts = [
    {
      id: 'p1',
      brand: '토리든',
      name: '다이브인 저분자 히알루론산 세럼',
      score: 98,
      effect: '속당김 즉각 해소 · 저자극 수분 충전',
      tag: '수분 1위',
      price: '18,000원',
      emoji: '💧',
    },
    {
      id: 'p2',
      brand: '아누아',
      name: '어성초 77 진정 클리어 패드',
      score: 95,
      effect: 'T존 유분 컨트롤 · 모공 결 정돈',
      tag: '모공 케어',
      price: '21,000원',
      emoji: '🌿',
    },
    {
      id: 'p3',
      brand: '에스트라',
      name: '아토베리어 365 세라마이드 크림',
      score: 92,
      effect: '무너진 피부 장벽 강화 · 100시간 보습',
      tag: '장벽 강화',
      price: '31,000원',
      emoji: '🛡️',
    },
    {
      id: 'p4',
      brand: '라운드랩',
      name: '자작나무 수분 선크림 SPF 50+',
      score: 91,
      effect: '백탁 없는 수분 에센스 텍스처',
      tag: 'UV 방어',
      price: '17,500원',
      emoji: '☀️',
    },
  ];

  // 주간 스킨케어 챌린지 (월~일)
  const weekDays = [
    { day: '월', done: true, score: 81 },
    { day: '화', done: true, score: 82 },
    { day: '수', done: true, score: 84 },
    { day: '목', done: false, score: null, today: true },
    { day: '금', done: false, score: null },
    { day: '토', done: false, score: null },
    { day: '일', done: false, score: null },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <Header variant="dashboard" />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-4 tablet:p-6 desktop:p-8 pb-28 desktop:pb-12 max-w-6xl mx-auto space-y-7 animate-fadeIn">
          
          {/* ── 1. 에디토리얼 프리미엄 히어로 배너 (Radiant Skin & NŪMA 감성) ── */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-800 via-primary-700 to-teal-900 text-white p-6 tablet:p-9 shadow-xl border border-emerald-600/30">
            {/* 감성적인 유기적 배경 블러 오버레이 */}
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-teal-300/15 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col desktop:flex-row desktop:items-center justify-between gap-8">
              {/* 좌측: 타이포 & 데일리 처방 헤드라인 */}
              <div className="max-w-xl space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-200 text-xs font-semibold border border-white/10">
                    <Sparkles size={13} className="text-emerald-300" />
                    AI DAILY PRESCRIPTION
                  </span>
                  <span className="text-xs text-emerald-200/80 font-medium">
                    오늘의 맞춤 피부 처방
                  </span>
                </div>

                <h1 className="text-2xl tablet:text-3xl font-extrabold tracking-tight leading-tight">
                  {user?.nickname || '회원'}님, 오늘 피부는<br />
                  <span className="text-emerald-300 underline decoration-emerald-400/50 decoration-wavy decoration-2 underline-offset-4">
                    T존 피지 밸런싱
                  </span>에 집중할 타이밍이에요.
                </h1>

                <p className="text-sm text-emerald-100/90 leading-relaxed font-normal">
                  현재 야외 자외선 수치가 상승 중입니다. 가벼운 수분 젤 에센스를 도포하고 외출 20분 전 자외선 차단제를 잊지 마세요.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link
                    to="/skin-check"
                    className="inline-flex items-center gap-2 bg-white text-emerald-900 hover:bg-emerald-50 px-6 py-3 rounded-2xl font-bold text-sm shadow-lg hover:shadow-xl transition-all group"
                  >
                    <Scan size={18} className="text-emerald-700 group-hover:rotate-12 transition-transform" />
                    지금 4초 정밀 스캔하기
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 text-xs font-medium text-emerald-100">
                    <Clock size={14} className="text-emerald-300" />
                    <span>최근 측정: {currentScan?.date || '오늘 오전'}</span>
                  </div>
                </div>
              </div>

              {/* 우측: 종합 피부 점수 링 카드 & AI 부위별 매핑 뷰 */}
              <div className="flex flex-col sm:flex-row items-center gap-5 bg-white/10 backdrop-blur-lg border border-white/20 p-5 tablet:p-6 rounded-3xl shadow-inner flex-shrink-0">
                {/* 종합 점수 게이지 */}
                <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="42" fill="none" stroke="#6ee7b7" strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={264} strokeDashoffset={264 - (264 * latestScore) / 100}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] text-emerald-200 uppercase font-semibold">피부 점수</span>
                    <span className="text-3xl font-black text-white leading-none">{latestScore}</span>
                    <span className="text-[9px] text-emerald-300 font-medium">/ 100점</span>
                  </div>
                </div>

                {/* 피부 타입 & 3대 핵심 지표 */}
                <div className="space-y-2 text-center sm:text-left">
                  <div className="inline-block bg-emerald-400 text-emerald-950 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                    {userSkinType}
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="bg-black/20 rounded-xl px-2.5 py-1.5 text-center">
                      <span className="text-[10px] text-emerald-200 block">수분</span>
                      <span className="text-xs font-bold text-white">74%</span>
                    </div>
                    <div className="bg-black/20 rounded-xl px-2.5 py-1.5 text-center">
                      <span className="text-[10px] text-emerald-200 block">유분</span>
                      <span className="text-xs font-bold text-white">42%</span>
                    </div>
                    <div className="bg-black/20 rounded-xl px-2.5 py-1.5 text-center">
                      <span className="text-[10px] text-emerald-200 block">탄력</span>
                      <span className="text-xs font-bold text-white">79%</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-emerald-200/90 pt-1">
                    전체 사용자 상위 <strong>12%</strong>의 양호한 피부결
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── 2. 스마트 IoT 스캐너 독 (Smart Device Dock) ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 w-full md:w-auto">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm border border-emerald-100">
                <Wifi size={22} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <h3 className="text-sm font-bold text-text-primary">
                    DAMDA Dual-LED IoT Scanner v1.2
                  </h3>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                    연결됨 (Online)
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">
                  ESP32-CAM 듀얼 광원(White 5500K / UV 395nm) 및 FDC2112 수분 센서 준비 완료
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-text-secondary w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
              <div className="flex items-center gap-1.5 font-medium text-emerald-700 bg-emerald-50/70 px-3 py-1.5 rounded-xl">
                <BatteryCharging size={15} />
                <span>배터리 88%</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl">
                <Sparkles size={14} />
                <span>UV 395nm 대기</span>
              </div>
              <Link
                to="/scan"
                className="btn-primary text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-sm"
              >
                측정하기 <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* ── 3. 퀵 서비스 그리드 (4대 핵심 기능) ── */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-sm font-bold text-text-primary tracking-tight">
                스마트 스킨케어 핵심 서비스
              </h2>
              <span className="text-xs text-text-secondary">담다 올인원 솔루션</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 desktop:grid-cols-4 gap-4">
              {quickAccess.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.title}
                    to={item.path}
                    className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between ${item.border}`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-12 h-12 ${item.bg} rounded-2xl flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform shadow-inner`}>
                          <Icon size={22} />
                        </div>
                        <span className="text-[10px] font-bold text-text-secondary bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                          {item.tag}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-text-primary group-hover:text-primary-600 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs font-bold text-primary-600">
                      <span>바로가기</span>
                      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ── 4. 2열 복합 섹션: [주간 스킨 스트릭] & [실시간 환경 연동 방어] ── */}
          <div className="grid grid-cols-1 desktop:grid-cols-2 gap-6">
            
            {/* 좌: 7일간의 데일리 스킨 스트릭 위젯 */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Award size={18} className="text-amber-500" />
                    <h3 className="text-sm font-bold text-text-primary">
                      이번 주 스킨케어 챌린지
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full">
                    3일 연속 달성 💧
                  </span>
                </div>

                <p className="text-xs text-text-secondary mb-5">
                  매일 아침 4초 스캔으로 피부 밸런스를 측정하고 맞춤 루틴을 완성해 보세요.
                </p>

                {/* 요일별 원형 체크 뱃지 */}
                <div className="grid grid-cols-7 gap-2 text-center">
                  {weekDays.map((w) => (
                    <div
                      key={w.day}
                      className={`flex flex-col items-center p-2.5 rounded-xl transition-all ${
                        w.done
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                          : w.today
                          ? 'bg-primary-500 text-white shadow-sm ring-2 ring-primary-300'
                          : 'bg-gray-50 border border-gray-100 text-text-secondary'
                      }`}
                    >
                      <span className="text-[11px] font-semibold mb-1">{w.day}</span>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        w.done ? 'bg-emerald-500 text-white' : w.today ? 'bg-white text-primary-600' : 'bg-gray-200 text-gray-400'
                      }`}>
                        {w.done ? <Check size={12} strokeWidth={3} /> : w.today ? '오늘' : '-'}
                      </div>
                      <span className="text-[10px] mt-1 font-bold">
                        {w.score ? `${w.score}점` : '-'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-text-secondary">누적 완료 스캔: <strong className="text-text-primary">{scanCount || 3}회</strong></span>
                <Link to="/analysis" className="font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                  리포트 상세 <ArrowRight size={12} />
                </Link>
              </div>
            </div>

            {/* 우: 실시간 기상/환경 데이터 & 피부 방어 가이드 */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sun size={18} className="text-amber-500" />
                    <h3 className="text-sm font-bold text-text-primary">
                      오늘의 환경 & 피부 방어 가이드
                    </h3>
                  </div>
                  <span className="text-xs text-text-secondary font-medium">
                    {weather?.region || '서울'} 기준
                  </span>
                </div>

                {/* 3개 온/습/UV 카드 */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3.5 bg-[#f8fafc] rounded-xl border border-gray-100">
                    <Thermometer size={20} className="mx-auto text-blue-500 mb-1" />
                    <p className="text-lg font-extrabold text-text-primary">{weather?.temp ?? 23}°C</p>
                    <p className="text-[10px] text-text-secondary font-medium">외기 기온</p>
                  </div>

                  <div className="text-center p-3.5 bg-[#f8fafc] rounded-xl border border-gray-100">
                    <Droplets size={20} className="mx-auto text-cyan-500 mb-1" />
                    <p className="text-lg font-extrabold text-text-primary">{weather?.humidity ?? 55}%</p>
                    <p className="text-[10px] text-text-secondary font-medium">대기 습도</p>
                  </div>

                  <div className={`text-center p-3.5 rounded-xl border ${uvInfo.bg} ${uvInfo.border || 'border-amber-200'}`}>
                    <Sun size={20} className={`mx-auto ${uvInfo.color} mb-1`} />
                    <p className={`text-lg font-extrabold ${uvInfo.color}`}>{uvInfo.label}</p>
                    <p className="text-[10px] text-text-secondary font-medium">자외선 지수</p>
                  </div>
                </div>

                {/* 피부 방어 솔루션 알림 */}
                <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl p-3.5 flex items-start gap-2.5">
                  <ShieldCheck size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-900 leading-relaxed">
                    자외선과 건조한 공기가 피부 장벽을 자극할 수 있습니다. <strong>SPF 50+ 무기자차 선크림</strong>과 <strong>수분 진정 미스트</strong> 휴대를 권장합니다.
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-text-secondary">기상청 실시간 API 연동</span>
                <Link to="/care-guide" className="font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1">
                  환경 맞춤 케어법 <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>

          {/* ── 5. 내 피부 맞춤 화장품 큐레이션 (알차 & 서울패스 카드형) ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-500" />
                  <h3 className="text-base font-bold text-text-primary">
                    {userSkinType} 맞춤 추천 화장품 Top 4
                  </h3>
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  14만 개 전성분 데이터베이스에서 {user?.nickname || '회원'}님의 피부 점수와 성분 안전성을 교차 검증했습니다.
                </p>
              </div>

              <Link
                to="/products"
                className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 bg-primary-50 px-3 py-1.5 rounded-full transition-colors"
              >
                전체보기 <ArrowRight size={12} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 desktop:grid-cols-4 gap-4">
              {curatedProducts.map((p) => (
                <Link
                  key={p.id}
                  to="/products"
                  className="bg-background-gray rounded-2xl p-4 border border-gray-100 hover:border-primary-300 hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div>
                    {/* 상단 썸네일 & 뱃지 */}
                    <div className="aspect-square bg-white rounded-xl flex items-center justify-center text-4xl mb-3 shadow-inner relative overflow-hidden border border-gray-100">
                      <span>{p.emoji}</span>
                      <span className="absolute top-2 left-2 text-[10px] font-bold bg-gradient-to-r from-emerald-500 to-green-600 text-white px-2 py-0.5 rounded-lg shadow-sm">
                        {p.score}점
                      </span>
                      <span className="absolute top-2 right-2 text-[9px] bg-primary-50 text-primary-700 font-semibold px-1.5 py-0.5 rounded-md">
                        {p.tag}
                      </span>
                    </div>

                    <p className="text-[11px] font-medium text-text-secondary">{p.brand}</p>
                    <h4 className="text-xs font-bold text-text-primary mt-0.5 line-clamp-1 group-hover:text-primary-600 transition-colors">
                      {p.name}
                    </h4>
                    <p className="text-[11px] text-text-secondary mt-1.5 line-clamp-2 bg-white/70 rounded-lg p-1.5 border border-gray-100">
                      {p.effect}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-gray-200/60 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-text-primary">{p.price}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      className="p-1 rounded-full text-gray-400 hover:text-rose-500 transition-colors"
                      title="찜하기"
                    >
                      <Heart size={15} />
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ── 6. 닥터 담다의 모닝 & 나이트 스킨케어 매거진 ── */}
          <div className="bg-gradient-to-r from-stone-900 via-zinc-900 to-neutral-900 rounded-3xl p-6 tablet:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-amber-400" />
                <span className="text-xs font-bold text-amber-300 tracking-wider uppercase">
                  Skincare Editorial Magazine
                </span>
              </div>
              <h3 className="text-lg tablet:text-xl font-extrabold mb-5">
                건강한 피부를 완성하는 닥터 담다의 2-Step 데일리 루틴
              </h3>

              <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4">
                {/* Day Routine */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center flex-shrink-0 text-xl font-bold">
                    <Sun size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase bg-amber-400/30 text-amber-200 px-2 py-0.5 rounded-full">Day Care</span>
                      <h4 className="text-sm font-bold text-white">모닝 항산화 & 수분 락킹</h4>
                    </div>
                    <p className="text-xs text-stone-300 mt-1.5 leading-relaxed">
                      약산성 폼으로 부드럽게 세안 후, 비타민C 앰플을 얇게 펴 바르고 무기자차 선크림으로 피부 외벽을 쉴드하세요.
                    </p>
                  </div>
                </div>

                {/* Night Routine */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-400/20 text-indigo-300 flex items-center justify-center flex-shrink-0 text-xl font-bold">
                    <Moon size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase bg-indigo-400/30 text-indigo-200 px-2 py-0.5 rounded-full">Night Care</span>
                      <h4 className="text-sm font-bold text-white">나이트 장벽 진정 & 수면 팩</h4>
                    </div>
                    <p className="text-xs text-stone-300 mt-1.5 leading-relaxed">
                      하루 동안 쌓인 노폐물을 이중 세안으로 제거하고, 세라마이드 수분 진정 크림을 도톰하게 얹어 밤사이 피부를 회복시킵니다.
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

export default DashboardPage;
