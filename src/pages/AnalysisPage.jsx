import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Scan, BarChart3, Sparkles, ShoppingBag, Download,
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Legend,
} from 'recharts';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import BottomNav from '../components/common/BottomNav';
import Button from '../components/common/Button';
import useAuth from '../hooks/useAuth';
import useScanStore from '../store/scanStore';

// narrative.per_metric[] 또는 flat 필드에서 지표 배열 추출
function extractMetrics(scan) {
  if (scan?.narrative?.per_metric?.length > 0) {
    return scan.narrative.per_metric.map((m) => ({
      label: m.name,
      value: parseFloat(m.value) || 0,
      rating: m.rating,
      status: m.rating_text,
      statusColor: ratingToColor(m.rating),
      description: m.description || '',
      note: m.personalized_note || null,
    }));
  }
  // flat 구조 fallback
  return [
    { label: '수분도', value: scan?.moisture ?? 0, ...ratingFromValue(scan?.moisture ?? 0), description: '정상 범위 (60-90%)' },
    { label: '유분도', value: scan?.oil ?? 0, ...ratingFromValue(100 - (scan?.oil ?? 0)), description: 'T존 유분 분포' },
    { label: '탄력', value: scan?.elasticity ?? 0, ...ratingFromValue(scan?.elasticity ?? 0), description: '볼 부위 탄력 지수' },
    { label: '모공', value: scan?.spots ?? 0, ...ratingFromValue(scan?.spots ?? 0), description: '코 주변 모공 상태' },
    { label: '색소침착', value: scan?.pigmentation ?? 0, ...ratingFromValue(100 - (scan?.pigmentation ?? 0)), description: '이마·볼 상단 색소' },
  ];
}

function ratingToColor(rating) {
  if (rating === 'good') return 'green';
  if (rating === 'fair') return 'yellow';
  return 'orange';
}

function ratingFromValue(val) {
  if (val >= 60) return { rating: 'good', status: '정상', statusColor: 'green' };
  if (val >= 40) return { rating: 'fair', status: '보통', statusColor: 'yellow' };
  return { rating: 'poor', status: '주의', statusColor: 'orange' };
}

const statusColorMap = {
  green: { bg: 'bg-primary-50', text: 'text-primary-600' },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
};

// 종합 점수 원형
const ScoreCircle = ({ score }) => {
  const color = score >= 70 ? '#4CAF50' : score >= 50 ? '#EAB308' : '#F97316';
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-28 h-28">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="none" stroke="#E5E7EB" strokeWidth="8" />
        <circle
          cx="60" cy="60" r="52" fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] text-text-secondary">종합 피부 점수</span>
        <span className="text-4xl font-bold" style={{ color }}>{score}</span>
        <span className="text-[10px] text-text-secondary">/100</span>
      </div>
    </div>
  );
};

const AnalysisPage = () => {
  useAuth(true);
  const { currentScan, initializeIfNeeded } = useScanStore();
  const [activeMenu, setActiveMenu] = useState('overview');

  useEffect(() => { initializeIfNeeded(); }, [initializeIfNeeded]);

  const analysis = currentScan;
  const hasScanData = !!currentScan;

  // Empty state
  if (!hasScanData) {
    return (
      <div className="min-h-screen bg-background-gray">
        <Header variant="dashboard" />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-4 tablet:p-6 desktop:p-8 pb-24 desktop:pb-8">
            <div className="max-w-lg mx-auto text-center py-20 animate-fadeIn">
              <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <BarChart3 size={36} className="text-primary-300" />
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-3">아직 스캔 데이터가 없습니다</h2>
              <p className="text-text-secondary mb-8">첫 스캔을 완료하면 피부 분석 결과를 확인할 수 있습니다.</p>
              <Link to="/scan"><Button icon={Scan}>스캔하러 가기</Button></Link>
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
    );
  }

  const metrics = extractMetrics(analysis);
  const overallScore = analysis.narrative?.overall_score ?? analysis.overallScore ?? 0;
  const summary = analysis.narrative?.summary ?? '';
  const tips = analysis.narrative?.tips ?? [];
  const userContextApplied = analysis.narrative?.user_context?.applied ?? false;

  const radarData = metrics.map((m, i) => ({
    subject: m.label,
    current: m.value,
    previous: Math.max(m.value - (i % 2 === 0 ? 8 : -5), 25),
  }));

  const sideMenuItems = [
    { id: 'overview', label: '종합 분석', icon: BarChart3 },
    { id: 'ai-care', label: 'AI 케어 조언', icon: Sparkles },
    { id: 'products', label: '제품 추천', icon: ShoppingBag },
    { id: 'export', label: '결과 내보내기', icon: Download },
  ];

  return (
    <div className="min-h-screen bg-background-gray">
      <Header variant="dashboard" />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-4 tablet:p-6 desktop:p-8 pb-24 desktop:pb-8 animate-fadeIn">
          <div className="max-w-6xl mx-auto">

            {/* 상단: 종합 점수 + 지표 배지 */}
            <div className="flex flex-col tablet:flex-row items-center gap-5 mb-5">
              <div className="bg-primary-50 border border-primary-100 rounded-2xl p-5 flex flex-col items-center">
                <ScoreCircle score={overallScore} />
                <span className="mt-2 inline-block bg-primary-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  {analysis.skinType || '복합성 피부'}
                </span>
              </div>

              <div className="flex flex-wrap gap-3 justify-center tablet:justify-start flex-1">
                {metrics.map((m) => {
                  const style = statusColorMap[m.statusColor];
                  return (
                    <div key={m.label} className={`flex flex-col items-center px-5 py-3 rounded-2xl border ${style.bg} min-w-[90px]`}>
                      <span className={`text-2xl font-bold ${style.text}`}>{m.value}%</span>
                      <span className="text-[11px] text-text-secondary mt-0.5">{m.label}</span>
                      <span className={`text-[10px] font-semibold mt-1 px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                        {m.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI 안내 배너 */}
            {summary && (
              <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Sparkles size={18} className="text-primary-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-primary-700 leading-relaxed">{summary}</p>
                    {userContextApplied && (
                      <span className="inline-flex items-center gap-1 mt-2 text-[11px] bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">
                        ✨ 사용자 정보 반영됨
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 본문: 사이드 메뉴 + 메인 콘텐츠 */}
            <div className="flex gap-6">
              {/* 사이드 메뉴 */}
              <div className="hidden desktop:block w-44 flex-shrink-0">
                <nav className="flex flex-col gap-0.5">
                  {sideMenuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveMenu(item.id)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left w-full ${
                          activeMenu === item.id
                            ? 'bg-primary-50 text-primary-600 font-semibold'
                            : 'text-text-secondary hover:bg-gray-50 hover:text-text-primary'
                        }`}
                      >
                        <Icon size={15} className={activeMenu === item.id ? 'text-primary-400' : 'text-gray-400'} />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* 메인 콘텐츠 */}
              <div className="flex-1 min-w-0">
                <div className="grid grid-cols-1 desktop:grid-cols-2 gap-6">

                  {/* 레이더 차트 */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="text-sm font-semibold text-text-primary mb-2">피부 상태 레이더 차트</h3>
                    <div className="h-72 tablet:h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                          <PolarGrid stroke="#E5E7EB" />
                          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#757575', fontWeight: 500 }} />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: '#9CA3AF' }} tickCount={5} axisLine={false} />
                          <Radar name="지난 측정" dataKey="previous" stroke="#BDBDBD" fill="#E0E0E0" fillOpacity={0.25} strokeWidth={1.5} strokeDasharray="4 4" />
                          <Radar name="오늘 측정" dataKey="current" stroke="#4CAF50" fill="#4CAF50" fillOpacity={0.2} strokeWidth={2} dot={{ r: 4, fill: '#4CAF50', stroke: '#fff', strokeWidth: 2 }} />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} iconType="circle" iconSize={8} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[11px] text-text-secondary text-center mt-1">꼭짓점이 바깥일수록<br />해당 지표가 높아요</p>
                  </div>

                  {/* 지표별 상세 */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="text-sm font-semibold text-text-primary mb-4">지표별 상세 분석</h3>
                    <div className="space-y-5">
                      {metrics.map((m) => {
                        const style = statusColorMap[m.statusColor];
                        return (
                          <div key={m.label}>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-xs font-semibold text-text-primary w-14 flex-shrink-0">{m.label}</span>
                              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-1000 ease-out"
                                  style={{
                                    width: `${m.value}%`,
                                    backgroundColor: m.statusColor === 'green' ? '#4CAF50' : m.statusColor === 'yellow' ? '#EAB308' : '#F97316',
                                  }}
                                />
                              </div>
                              <span className="text-sm font-bold text-text-primary w-10 text-right">{m.value}%</span>
                            </div>
                            <div className="flex items-start gap-2 ml-[68px]">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${style.bg} ${style.text}`}>
                                {m.status}
                              </span>
                              <p className="text-[11px] text-text-secondary leading-relaxed">{m.description}</p>
                            </div>
                            {m.note && (
                              <p className="text-[11px] text-amber-600 ml-[68px] mt-1">💡 {m.note}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 케어 팁 */}
                {tips.length > 0 && (
                  <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="text-sm font-semibold text-text-primary mb-4">케어 팁</h3>
                    <ul className="space-y-2">
                      {tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-text-secondary">
                          <span className="text-primary-400 mt-0.5 flex-shrink-0">💡</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
};

export default AnalysisPage;
