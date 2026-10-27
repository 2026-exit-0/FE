import { buildExampleCare } from '../utils/exampleCare';
import { ROUTINE_TEMPLATES } from '../utils/careTemplates';
import { scoreColor } from '../utils/scoreColor';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Sun, Moon, Calendar, Info, CheckCircle,
  Thermometer, Droplets, Wind, AlertTriangle, ArrowRight,
  Sparkles, Eye
} from 'lucide-react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import BottomNav from '../components/common/BottomNav';
import Button from '../components/common/Button';
import useAuthStore from '../store/authStore';
import useScanStore from '../store/scanStore';
import useWeather from '../hooks/useWeather';
import { loadAnalysisCare, loadAnalysisDetail } from '../api/analysisDetail';

// ─── 루틴 데이터 맵 정의 (피부 타입별 맞춤 케어 루틴) ───
// ─── BE 구조화 리포트 렌더 (데모·실제 공통) ───
const BAND_STYLE = {
  '좋음': { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  '보통': { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
  '주의': { dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-600 border-rose-200' },
};

const SkinReport = ({ report }) => {
  if (!report) return null;
  const metrics = report.metrics || [];
  const score = report.overall_score;
  return (
    <section className="space-y-5" aria-label="피부 분석 리포트">
      {/* 종합 소견 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary-600 mb-1">종합 소견</p>
            <h2 className="text-lg font-bold text-text-primary">
              {report.scan_area} 측정 · <span className="text-primary-600">{report.skin_type}</span> 피부
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed mt-2 max-w-2xl">{report.summary}</p>
          </div>
          {score != null && (
            <div className="flex flex-col items-center justify-center bg-primary-50 rounded-2xl px-5 py-3 flex-shrink-0">
              <span className="text-[10px] font-bold text-primary-600 uppercase">종합 점수</span>
              <span style={{ color: scoreColor(score) }} className="text-3xl font-extrabold leading-tight">{score}</span>
              <span className="text-[10px] text-text-secondary">/ 100</span>
            </div>
          )}
        </div>
      </div>

      {/* 지표별 상세 */}
      <div>
        <h3 className="text-sm font-bold text-text-primary mb-3 px-1">지표별 상세 분석</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics.map((m) => {
            const st = BAND_STYLE[m.band] || BAND_STYLE['보통'];
            return (
              <div key={m.key} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${st.dot}`} />
                    <h4 className="text-sm font-bold text-text-primary">{m.label}</h4>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${st.chip}`}>{m.band}</span>
                </div>
                <p className="text-xs text-text-secondary mb-2">측정값: <strong className="text-text-primary">{m.sensor}</strong></p>
                <p className="text-sm text-text-primary leading-relaxed">{m.meaning}</p>
                <p className="text-xs text-text-secondary leading-relaxed mt-1.5"><span className="font-semibold">추정 원인 ·</span> {m.cause}</p>
                <div className="mt-2.5 bg-primary-50/60 rounded-lg px-3 py-2 text-xs text-primary-800 leading-relaxed">
                  <span className="font-bold">관리법 ·</span> {m.care}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 부위 소견 + 생활 수칙 + 추천 근거 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-text-primary mb-2">부위 소견</h3>
          <p className="text-sm text-text-secondary leading-relaxed">{report.region_note}</p>
          {report.recommend_basis && (
            <>
              <h3 className="text-sm font-bold text-text-primary mt-4 mb-2">제품 추천 기준</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{report.recommend_basis}</p>
            </>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-text-primary mb-2">생활 수칙</h3>
          <ul className="space-y-1.5">
            {(report.lifestyle || []).map((t, i) => (
              <li key={i} className="flex gap-2 text-sm text-text-secondary leading-relaxed">
                <CheckCircle size={15} className="text-primary-500 mt-0.5 flex-shrink-0" /> {t}
              </li>
            ))}
          </ul>
          {report.next_scan_days != null && (
            <p className="text-xs text-text-secondary mt-3 flex items-center gap-1.5">
              <Calendar size={13} /> 다음 측정 권장: 약 {report.next_scan_days}일 후
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

const CareGuidePage = () => {
  const { survey, fetchSurvey, user } = useAuthStore();
  const { currentScan, initializeIfNeeded } = useScanStore();
  const sessionId = currentScan?.sessionId || currentScan?.session_id;
  const token = localStorage.getItem('damda_token');
  const careKey = JSON.stringify([user?.user_id, token, sessionId]);
  const [careState, setCareState] = useState(null);
  const [retry, setRetry] = useState(0);
  const [initializing, setInitializing] = useState(true);
  const care = careState?.key === careKey ? careState : null;

  useEffect(() => {
    let active = true;
    setInitializing(true);
    initializeIfNeeded().finally(() => { if (active) setInitializing(false); });
    return () => { active = false; };
  }, [initializeIfNeeded, user?.user_id]);

  useEffect(() => {
    setSelectedStep(null);
    if (!sessionId) return;
    if (currentScan?.is_mock) {
      setCareState({ key: careKey, ...buildExampleCare(currentScan) });
      return;
    }
    let active = true;
    const controller = new AbortController();
    setCareState({ key: careKey, loading: true });
    loadAnalysisDetail(sessionId, currentScan, controller.signal)
      .then(scan => loadAnalysisCare(sessionId, controller.signal, scan))
      .then(data => {
      if (active && token === localStorage.getItem('damda_token')) setCareState({ key: careKey, ...data });
    }).catch(() => {
      if (active && !controller.signal.aborted && token === localStorage.getItem('damda_token')) {
        setCareState({ key: careKey, careMessage: '촬영 결과를 불러오지 못했습니다. 다시 조회해 주세요.' });
      }
    });
    return () => { active = false; controller.abort(); };
  }, [careKey, retry]);
  const { weather } = useWeather();

  const [activeTab, setActiveTab] = useState('morning'); // morning, night, weekly
  const [selectedStep, setSelectedStep] = useState(null); // 모달 상세 정보용

  // 피부 타입 알아내기 (1순위: 스캔 결과 예측값, 2순위: 내 피부 설문 결과, 3순위: null)
  const userSkinType = currentScan?.skinType?.replace(' 피부', '')?.replace(' 경향', '') || survey?.skin_type || null;
  const routine = userSkinType ? (ROUTINE_TEMPLATES[userSkinType] || ROUTINE_TEMPLATES['복합성']) : null;
  const report = care?.report || null;

  useEffect(() => {
    fetchSurvey();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 오늘의 기상 결합 케어팁 (K.3)
  const getCareTip = () => {
    if (!weather) return '🌞 자외선 차단제를 바르고 외출하여 피부 노화를 예방해 주세요.';
    const hum = weather.humidity || 50;
    const uv = weather.uv || 'moderate';

    if (hum < 40) {
      return '🍂 대기가 건조한 날입니다. 보습 크림을 한 번 더 레이어링하고, 충분한 물을 섭취하세요!';
    }
    if (uv === 'high' || uv === 'very-high') {
      return '☀️ 오늘 자외선 지수가 매우 높습니다! 실내외 불문 SPF 50+ / PA++++ 선크림을 필수로 발라주세요.';
    }
    if (hum > 75) {
      return '🌧️ 대기 습도가 높습니다. 리치한 수분크림보다는 유분기 없는 산뜻한 젤 로션 제안 루틴을 따라보세요.';
    }
    return '✨ 쾌적한 날씨입니다. 가벼운 보습 및 장벽 관리 루틴을 통해 유수분 밸런스를 유지하세요.';
  };

  const currentSteps = routine ? (routine[activeTab] || []) : [];

  return (
    <div className="min-h-screen bg-background-gray">
      <Header variant="dashboard" />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-4 tablet:p-6 desktop:p-8 pb-28 desktop:pb-8 max-w-5xl">
          {/* 타이틀 및 케어 팁 */}
          <div className="flex flex-col tablet:flex-row items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl font-bold text-text-primary">맞춤 케어 가이드</h1>
              <p className="text-sm text-text-secondary">피부 분석 및 라이프스타일 기반 맞춤 루틴</p>
            </div>
            
            {/* 피부타입 배지 (데모·실제 동일 표기) */}
            {userSkinType && (
              <div className="bg-gradient-to-r from-primary-50 to-emerald-50 text-primary-700 px-4 py-2 rounded-xl text-xs font-bold border border-primary-100 flex items-center gap-1.5 shadow-sm">
                <Sparkles size={14} className="text-primary-500 flex-shrink-0" />
                예상 피부 타입: <span className="underline font-extrabold">{userSkinType}</span>
              </div>
            )}
          </div>

          {/* 실시간 날씨 연동 케어팁 카드 (K.3) */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6 flex flex-col tablet:flex-row items-center gap-4">
            <div className="w-12 h-12 bg-primary-50 text-primary-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sun size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-text-primary mb-1 uppercase tracking-wider">오늘의 날씨 참고 팁</h4>
              <p className="text-sm text-text-secondary leading-relaxed">{getCareTip()}</p>
            </div>
            {weather && (
              <div className="flex gap-4 text-xs font-medium text-text-secondary border-t tablet:border-t-0 tablet:border-l border-gray-100 pt-3 tablet:pt-0 tablet:pl-4 w-full tablet:w-auto justify-around tablet:justify-start">
                <span className="flex items-center gap-1"><Thermometer size={14} /> {weather.temp || 22}°C</span>
                <span className="flex items-center gap-1"><Droplets size={14} /> {weather.humidity || 55}%</span>
                <span className="flex items-center gap-1"><Wind size={14} /> {weather.uv === 'high' ? '자외선 강함' : '자외선 보통'}</span>
              </div>
            )}
          </div>

          {/* BE 구조화 리포트 (데모·실제 공통) */}
          {report && <SkinReport report={report} />}

          {/* 리포트 없을 때: 로딩 / 빈 상태 / 에러 안내 */}
          {!report && (initializing || (sessionId && (!care || care.loading))) ? (
            <p role="status" className="rounded-xl bg-white p-6">케어 가이드를 불러오는 중입니다.</p>
          ) : !report && !sessionId && !userSkinType ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
              <div className="w-16 h-16 bg-primary-50 text-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen size={32} />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">아직 등록된 피부 진단 정보가 없습니다</h3>
              <p className="text-sm text-text-secondary max-w-md mx-auto mb-6 leading-relaxed">
                피부 스캔이나 자가진단 설문을 먼저 진행하시면 내 피부 타입에 최적화된 맞춤 케어 가이드를 받으실 수 있습니다.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link to="/scan">
                  <Button icon={ArrowRight}>피부 스캔하러 가기</Button>
                </Link>
                <Link to="/skin-check">
                  <Button variant="outline" icon={Sparkles}>자가진단 설문하기</Button>
                </Link>
              </div>
            </div>
          ) : !report && care?.careMessage ? (
            <div className="rounded-xl bg-white p-6" role="status">
              <p>{care.careMessage}</p>
              <button className="btn-primary mt-3" onClick={() => setRetry(n => n + 1)}>다시 조회</button>
            </div>
          ) : null}

          {/* 맞춤 제품 루틴 (피부 타입 기반, 데모·실제 공통) */}
          {routine && (
            <div className="space-y-6 mt-8">
              <h3 className="text-sm font-bold text-text-primary px-1">맞춤 제품 루틴</h3>
              {/* 탭 네비게이션 */}
              <div className="flex bg-white rounded-xl shadow-sm p-1 border border-gray-100 mb-6">
                <button
                  onClick={() => setActiveTab('morning')}
                  className={`flex-1 py-3 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors ${
                    activeTab === 'morning' ? 'bg-primary-500 text-white font-semibold shadow' : 'text-text-secondary hover:bg-gray-50'
                  }`}
                >
                  <Sun size={16} /> 아침 루틴
                </button>
                <button
                  onClick={() => setActiveTab('night')}
                  className={`flex-1 py-3 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors ${
                    activeTab === 'night' ? 'bg-primary-500 text-white font-semibold shadow' : 'text-text-secondary hover:bg-gray-50'
                  }`}
                >
                  <Moon size={16} /> 저녁 루틴
                </button>
                <button
                  onClick={() => setActiveTab('weekly')}
                  className={`flex-1 py-3 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors ${
                    activeTab === 'weekly' ? 'bg-primary-500 text-white font-semibold shadow' : 'text-text-secondary hover:bg-gray-50'
                  }`}
                >
                  <Calendar size={16} /> 주간 맞춤 케어
                </button>
              </div>

              {/* 루틴 카드 리스트 */}
              <div className="space-y-4">
                {currentSteps.map((stepItem, index) => (
                  <div
                    key={stepItem.step}
                    onClick={() => setSelectedStep(stepItem)}
                    className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-start gap-4 cursor-pointer hover:border-primary-300 hover:shadow-md transition-all group animate-fadeIn"
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    {/* 단계 배지 */}
                    <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex flex-col items-center justify-center flex-shrink-0 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                      <span className="text-[10px] uppercase font-bold leading-none mb-0.5">Step</span>
                      <span className="text-sm font-extrabold leading-none">{stepItem.step}</span>
                    </div>

                    {/* 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold text-primary-500 bg-primary-50 border border-primary-100 px-2 py-0.5 rounded">
                          {stepItem.type}
                        </span>
                        <h3 className="text-sm font-extrabold text-text-primary group-hover:text-primary-500 transition-colors leading-none truncate">
                          {stepItem.name}
                        </h3>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{stepItem.desc}</p>
                    </div>

                    {/* 화살표/보기 */}
                    <div className="flex items-center gap-1.5 text-text-secondary group-hover:text-primary-500 text-xs font-semibold self-center flex-shrink-0 transition-colors">
                      상세 정보 <Eye size={14} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      <BottomNav />

      {/* 루틴 단계 상세 팝업 모달 (K.2) */}
      {selectedStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedStep(null)} />
          <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-slideUp">
            
            {/* 헤더 */}
            <div className="bg-primary-50 px-5 py-4 border-b border-primary-100">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold bg-primary-500 text-white px-2 py-0.5 rounded">
                  Step {selectedStep.step}
                </span>
                <span className="text-xs font-semibold text-primary-600">{selectedStep.type}</span>
              </div>
              <h2 className="text-base font-bold text-text-primary mt-2">{selectedStep.name}</h2>
            </div>

            {/* 본문 */}
            <div className="p-5 space-y-4">
              {/* 설명 */}
              <div>
                <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-1">상세 설명</p>
                <p className="text-sm text-text-primary leading-relaxed">{selectedStep.desc}</p>
              </div>

              {/* 사용법 */}
              <div className="bg-gray-50 rounded-xl p-3 flex gap-2.5 items-start">
                <Info size={16} className="text-primary-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">사용 가이드</p>
                  <p className="text-xs text-text-primary leading-relaxed mt-0.5">{selectedStep.usage}</p>
                </div>
              </div>

              {/* 추천 성분 */}
              {selectedStep.good?.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-1 flex items-center gap-1 text-primary-600">
                    <CheckCircle size={12} /> 추천 유효 성분
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStep.good.map((ing) => (
                      <span key={ing} className="text-xs bg-primary-50 text-primary-600 px-2 py-1 rounded">
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 피해야 할 성분 */}
              {selectedStep.bad?.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-1 flex items-center gap-1 text-red-500">
                    <AlertTriangle size={12} /> 피해야 할 주의 성분
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStep.bad.map((ing) => (
                      <span key={ing} className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded">
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 닫기 */}
            <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-100 text-right">
              <button
                onClick={() => setSelectedStep(null)}
                className="btn-primary text-xs py-2 px-4"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareGuidePage;
