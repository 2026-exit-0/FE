import { useEffect,useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Scan, BarChart3, ShoppingBag, BookOpen,
  Thermometer, Droplets, Sun, ArrowRight,
  Wifi, Sparkles,
  Heart, ShieldCheck, Clock, ChevronRight, Moon
} from 'lucide-react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import BottomNav from '../components/common/BottomNav';
import useAuth from '../hooks/useAuth';
import useWeather from '../hooks/useWeather';
import useScanStore from '../store/scanStore';
import useAuthStore from '../store/authStore';
import { UV_LEVELS } from '../utils/constants';
import { useModeStore } from '../store/modeStore';
import { dashboardData } from '../utils/dashboardData';
import { getRecommendations } from '../api/products';
import { productPriceLabel } from '../utils/productPrice';
import { productScore } from '../utils/productScore';

const DashboardPage = () => {
  const { mode } = useModeStore();
  const { user } = useAuth(true);
  const { weather } = useWeather();
  const { scans, currentScan, initializeIfNeeded } = useScanStore();
  const { wishlist, toggleWish } = useAuthStore();

  useEffect(() => {
    initializeIfNeeded();
  }, [initializeIfNeeded]);

  const dashboard = dashboardData(scans, currentScan, mode);
  const hasScanData = dashboard.hasScanData;
  const uvInfo = UV_LEVELS[weather?.uv] || UV_LEVELS.moderate;

  // 대표 점수 및 지표
  const latestScore = dashboard.score;
  const userSkinType = dashboard.skinType || '피부 타입 정보 없음';

  // 퀵 서비스 4대 기능
  const quickAccess = [
    {
      icon: Scan,
      title: '정밀 피부 스캔',
      desc: '7초 듀얼 LED 수분·유분·모공 측정',
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

  // 추천 제품: 스캔 세션의 설문 측정 기반 추천(백엔드)에서 상위 4개
  const sessionId = currentScan?.sessionId;
  const [curatedProducts, setCuratedProducts] = useState([]);
  useEffect(() => {
    if (!currentScan) { setCuratedProducts([]); return; }
    let active = true;
    const body = {
      measurement: { moisture: currentScan.moisture, oil: currentScan.oil, elasticity: currentScan.elasticity },
      user_inputs: { skin_type: currentScan.skinType },
      top_k: 4,
    };
    getRecommendations(body, sessionId)
      .then((data) => {
        if (!active) return;
        const list = (data.recommended_products || [])
          .map((p) => ({ ...p, id: p.id || p.product_id, name: p.name || p.name_kr }))
          .sort((a, b) => (productScore(b) ?? 0) - (productScore(a) ?? 0))
          .slice(0, 4);
        setCuratedProducts(list);
      })
      .catch(() => { if (active) setCuratedProducts([]); });
    return () => { active = false; };
  }, [sessionId]);
  

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <Header variant="dashboard" />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-4 tablet:p-6 desktop:p-8 pb-28 tablet:pb-28 desktop:pb-12 max-w-6xl mx-auto space-y-7 animate-fadeIn">
          
          {/* ── 1. 히어로 배너 ── */}
          <div className="rounded-3xl bg-gradient-to-br from-primary-700 to-primary-900 text-white p-6 tablet:p-9 shadow-lg">
            <div className="flex flex-col desktop:flex-row desktop:items-center justify-between gap-8">
              <div className="max-w-xl space-y-3">
                <p className="text-sm text-white/80">
                  {hasScanData
                    ? `마지막 측정 · ${dashboard.date || '측정일 정보 없음'}`
                    : '아직 측정 기록이 없어요'}
                </p>

                <h1 className="text-2xl tablet:text-[34px] font-extrabold tracking-tight leading-snug">
                  {user?.nickname || '회원'}님,<br />
                  {latestScore != null ? (
                    <>최근 피부 점수는 <span className="text-emerald-300">{latestScore}점</span>이에요</>
                  ) : hasScanData ? (
                    <><span className="text-emerald-300">최근 피부 측정 기록</span>을 확인해 보세요</>
                  ) : (
                    <><span className="text-emerald-300">첫 피부 측정</span>을 시작해 보세요</>
                  )}
                </h1>

                <p className="text-sm tablet:text-[15px] text-white/90 leading-relaxed">
                  {hasScanData
                    ? '측정값과 촬영 사진은 분석 결과에서 자세히 볼 수 있어요.'
                    : '7초 스캔으로 수분·유분·탄력과 피부 점수를 바로 확인할 수 있어요.'}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-3">
                  <Link
                    to="/skin-check"
                    className="inline-flex items-center gap-2 bg-white text-primary-900 hover:bg-primary-50 h-[50px] px-6 rounded-2xl font-bold text-sm shadow-md transition-colors group"
                  >
                    <Scan size={18} className="text-primary-800 group-hover:rotate-12 transition-transform" />
                    {hasScanData ? '지금 7초 정밀 스캔하기' : '첫 스캔 시작하기'}
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to={hasScanData ? '/analysis' : '/guide'}
                    className="inline-flex items-center h-[50px] px-5 rounded-2xl border border-white/45 text-white font-bold text-sm hover:bg-white/10 transition-colors"
                  >
                    {hasScanData ? '분석 결과 보기' : '사용 방법 보기'}
                  </Link>
                </div>
              </div>

              {/* 오른쪽: 점수 링 + 수치 카드 */}
              <div className="flex flex-col sm:flex-row items-center gap-6 bg-white/10 border border-white/20 p-5 tablet:p-6 rounded-3xl flex-shrink-0">
                <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="42" fill="none" stroke="#6ee7b7" strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={264} strokeDashoffset={264 - (264 * Math.max(0, Math.min(100, latestScore ?? 0))) / 100}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] text-emerald-200 font-semibold">피부 점수</span>
                    <span className="text-4xl font-black leading-none">{latestScore ?? '—'}</span>
                    <span className="text-[11px] text-emerald-300 font-medium mt-0.5">/ 100점</span>
                  </div>
                </div>

                <div className="space-y-2.5 text-center sm:text-left">
                  <span className="inline-block bg-emerald-400 text-emerald-950 text-xs font-bold px-3 py-1 rounded-full">
                    {dashboard.skinType || '측정 전'}
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      ['수분', dashboard.moisture],
                      ['유분', dashboard.oil],
                      ['탄력', dashboard.elasticity],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-black/20 rounded-2xl px-3 py-3 text-center min-w-[80px]">
                        <span className="text-xs text-emerald-200 block mb-1">{label}</span>
                        <span className="text-lg tablet:text-xl font-bold">{value == null ? '—' : `${value}%`}</span>
                      </div>
                    ))}
                  </div>
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
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                  <h3 className="text-sm font-bold text-text-primary">
                    DAMDA Dual-LED IoT Scanner v1.2
                  </h3>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                    기기 연결 확인 필요
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">
                  스캔 화면에서 기기 등록 상태를 확인한 뒤 촬영할 수 있습니다.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
              <Link
                to="/scan"
                className="btn-primary text-xs px-5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 shadow-sm hover:shadow transition-all"
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

          {/* ── 4. 실시간 환경 연동 & 데일리 피부 방어 솔루션 ── */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 tablet:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <Sun size={20} className="text-amber-500" />
                  <h3 className="text-base font-bold text-text-primary">
                    오늘의 환경 & 피부 방어 솔루션
                  </h3>
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  기상청 실시간 API를 통해 사용자의 현재 위치 환경을 분석하여 즉각적인 스킨케어 가이드를 제공합니다.
                </p>
              </div>
              <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-3.5 py-1.5 rounded-full w-fit border border-primary-100">
                📍 {weather?.region || '서울'} 기준 환경 동기화
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50/60 border border-blue-100/80">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Thermometer size={22} />
                </div>
                <div>
                  <span className="text-xs text-text-secondary font-medium">현재 기온</span>
                  <p className="text-xl font-black text-blue-900">{weather?.temp ?? 23}°C</p>
                  <span className="text-[10px] text-blue-600 font-medium">피부 유분 분비 보통</span>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-cyan-50/60 border border-cyan-100/80">
                <div className="w-12 h-12 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Droplets size={22} />
                </div>
                <div>
                  <span className="text-xs text-text-secondary font-medium">대기 습도</span>
                  <p className="text-xl font-black text-cyan-900">{weather?.humidity ?? 55}%</p>
                  <span className="text-[10px] text-cyan-600 font-medium">수분 증발 보통</span>
                </div>
              </div>

              <div className={`flex items-center gap-4 p-4 rounded-2xl border ${uvInfo.bg} ${uvInfo.border || 'border-amber-200'}`}>
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Sun size={22} />
                </div>
                <div>
                  <span className="text-xs text-text-secondary font-medium">자외선 지수 (UV)</span>
                  <p className={`text-xl font-black ${uvInfo.color}`}>{uvInfo.label}</p>
                  <span className="text-[10px] text-amber-700 font-medium">외출 전 차단 필수</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-50/90 to-primary-50/70 border border-amber-200/70 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-950 mb-0.5">닥터 담다의 실시간 피부 방어 코멘트</h4>
                  <p className="text-xs text-amber-900 leading-relaxed font-normal">
                    자외선과 건조한 공기가 피부 장벽을 자극하기 쉬운 환경입니다. <strong>SPF 50+ 무기자차 선크림</strong> 도포와 <strong>수분 진정 미스트</strong> 수시 사용을 권장합니다.
                  </p>
                </div>
              </div>
              <Link to="/care-guide" className="btn-primary text-xs px-4 py-2.5 rounded-xl font-bold whitespace-nowrap self-end sm:self-auto shadow-sm flex items-center gap-1.5 flex-shrink-0">
                맞춤 케어법 전체보기 <ArrowRight size={13} />
              </Link>
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

              {curatedProducts.length === 0 && (
              <p className="text-xs text-text-secondary bg-background-gray rounded-xl p-4">
                피부 스캔을 하면 설문과 측정 결과에 맞춘 추천 화장품이 여기에 표시돼요.
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 desktop:grid-cols-4 gap-4"></div>

            <div className="grid grid-cols-1 sm:grid-cols-2 desktop:grid-cols-4 gap-4">
              {curatedProducts.map((p) => (
                <Link
                  key={p.id}
                  to="/products"
                  className="bg-background-gray rounded-2xl p-4 border border-gray-100 hover:border-primary-300 hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-square bg-white rounded-xl flex items-center justify-center text-4xl mb-3 shadow-inner relative overflow-hidden border border-gray-100">
                      <ShoppingBag size={36} className="text-gray-300" />
                      {p.image_url && (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          loading="lazy"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          className="absolute inset-0 w-full h-full object-contain p-3 bg-white"
                        />
                      )}
                      <span className="absolute top-2 left-2 z-10 text-[10px] font-bold bg-gradient-to-r from-emerald-500 to-green-600 text-white px-2 py-0.5 rounded-lg shadow-sm">
                        {Math.round(productScore(p) ?? 0)}점
                      </span>
                      <span className="absolute top-2 right-2 z-10 max-w-[60%] truncate text-[9px] bg-primary-50 text-primary-700 font-semibold px-1.5 py-0.5 rounded-md">
                        {p.efficacy?.[0] || p.category?.[0] || '맞춤 추천'}
                      </span>
                    </div>

                    <p className="text-[11px] font-medium text-text-secondary">{p.brand}</p>
                    <h4 className="text-xs font-bold text-text-primary mt-0.5 line-clamp-1 group-hover:text-primary-600 transition-colors">
                      {p.name}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-gray-200/60 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-text-primary">{productPriceLabel(p)}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWish(p); }}
                      className="p-1 rounded-full text-gray-400 hover:text-rose-500 transition-colors"
                      aria-label="찜하기"
                      title="찜하기"
                    >
                      <Heart
                        size={15}
                        className={(wishlist || []).some((w) => String(w.id) === String(p.id)) ? 'fill-rose-500 text-rose-500' : ''}
                      />
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
