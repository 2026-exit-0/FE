import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Download, Scan, TrendingUp, TrendingDown,
  Droplets, Wind, Zap, BarChart3, Calendar, Minus,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import BottomNav from '../components/common/BottomNav';
import Button from '../components/common/Button';
import useAuth from '../hooks/useAuth';
import useScanStore from '../store/scanStore';
import { weeklyData, measurementHistory } from '../utils/mockData';

// ─── 기간 필터 ──────────────────────────────────────────
const periodFilters = [
  { id: 'week', label: '주간' },
  { id: 'month', label: '월간' },
  { id: '3month', label: '3개월' },
  { id: 'all', label: '전체' },
];

// ─── 지표 필터 ──────────────────────────────────────────
const metricFilters = [
  { id: 'moisture', label: '수분도', icon: Droplets },
  { id: 'oil', label: '유분도', icon: Wind },
  { id: 'pore', label: '모공', icon: BarChart3 },
  { id: 'elasticity', label: '탄력', icon: Zap },
];

// ─── 요약 카드 컴포넌트 ──────────────────────────────────
const SummaryCard = ({ title, value, isPositive, subtitle }) => {
  const isNeutral = value === '0%' || value === '-';
  const colorClass = isNeutral
    ? 'text-text-secondary'
    : isPositive
    ? 'text-primary-600'
    : 'text-red-500';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col">
      <p className="text-[11px] font-medium text-text-secondary mb-2">{title}</p>
      <p className={`text-3xl font-bold ${colorClass} mb-1`}>{value}</p>
      <div className={`flex items-center gap-1 text-xs ${colorClass}`}>
        {isNeutral ? (
          <Minus size={12} />
        ) : isPositive ? (
          <TrendingUp size={12} />
        ) : (
          <TrendingDown size={12} />
        )}
        <span>{subtitle}</span>
      </div>
    </div>
  );
};

// ─── 진행 바 컴포넌트 ────────────────────────────────────
const ProgressBar = ({ value, max = 100 }) => {
  const percent = (value / max) * 100;
  return (
    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${percent}%`,
          backgroundColor: percent >= 70 ? '#4CAF50' : percent >= 50 ? '#EAB308' : '#F97316',
        }}
      />
    </div>
  );
};

// ─── 사이드 필터 (데스크톱) ──────────────────────────────
const ReportSidebar = ({ period, onPeriod, metric, onMetric }) => {
  return (
    <div className="hidden desktop:block w-40 flex-shrink-0 mr-6">
      {/* 기간 필터 */}
      <div className="mb-6">
        <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-3 px-2">
          기간
        </p>
        <nav className="flex flex-col gap-0.5">
          {periodFilters.map((p) => (
            <button
              key={p.id}
              onClick={() => onPeriod(p.id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left ${
                period === p.id
                  ? 'bg-primary-50 text-primary-600 font-semibold'
                  : 'text-text-secondary hover:bg-gray-50 hover:text-text-primary'
              }`}
            >
              <span
                className={`w-3 h-3 rounded flex-shrink-0 ${
                  period === p.id ? 'bg-primary-400' : 'bg-gray-200'
                }`}
              />
              {p.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 지표 필터 */}
      <div>
        <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-3 px-2">
          지표
        </p>
        <nav className="flex flex-col gap-0.5">
          {metricFilters.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => onMetric(m.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left ${
                  metric === m.id
                    ? 'bg-primary-50 text-primary-600 font-semibold'
                    : 'text-text-secondary hover:bg-gray-50 hover:text-text-primary'
                }`}
              >
                <span
                  className={`w-3 h-3 rounded flex-shrink-0 ${
                    metric === m.id ? 'bg-primary-400' : 'bg-gray-200'
                  }`}
                />
                {m.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

// ─── 커스텀 바 차트 Tooltip ──────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm">
        <p className="text-text-secondary text-xs mb-1">{label}</p>
        <p className="font-bold text-primary-600">{payload[0].value}점</p>
      </div>
    );
  }
  return null;
};

// ─── ReportPage 메인 ────────────────────────────────────
const ReportPage = () => {
  useAuth(true);
  const { currentScan } = useScanStore();
  const [period, setPeriod] = useState('month');
  const [metric, setMetric] = useState('moisture');

  const hasScanData = !!currentScan;
  const scanCount = measurementHistory.length;
  const hasEnoughScans = scanCount >= 2;

  // 동적 차트 데이터 제네레이터
  const getChartData = (m, p) => {
    const baseData = {
      moisture: [68, 71, 74, 76],
      oil: [55, 50, 48, 43],
      pore: [60, 61, 63, 66],
      elasticity: [35, 36, 38, 41]
    };

    const scores = baseData[m] || baseData.moisture;

    if (p === 'week') {
      return [
        { week: '1주차', score: scores[0] },
        { week: '2주차', score: scores[1] },
        { week: '3주차', score: scores[2] },
        { week: '4주차', score: scores[3] },
      ];
    } else if (p === 'month') {
      return [
        { week: '1월', score: Math.max(scores[0] - 8, 0) },
        { week: '2월', score: Math.max(scores[1] - 4, 0) },
        { week: '3월', score: scores[2] },
        { week: '4월', score: scores[3] },
      ];
    } else if (p === '3month') {
      return [
        { week: '2월 1주', score: Math.max(scores[0] - 6, 0) },
        { week: '2월 3주', score: Math.max(scores[0] - 3, 0) },
        { week: '3월 1주', score: Math.max(scores[1] - 4, 0) },
        { week: '3월 3주', score: scores[1] },
        { week: '4월 1주', score: Math.max(scores[2] - 2, 0) },
        { week: '4월 3주', score: scores[3] },
      ];
    } else { // all
      return [
        { week: '11월', score: 55 },
        { week: '12월', score: 58 },
        { week: '1월', score: scores[0] },
        { week: '2월', score: scores[1] },
        { week: '3월', score: scores[2] },
        { week: '4월', score: scores[3] },
      ];
    }
  };

  const chartData = getChartData(metric, period);
  const metricLabel = metricFilters.find((item) => item.id === metric)?.label || '수분도';

  // PDF 내보내기 핸들러 (추후 jsPDF 연동)
  const handleExportPDF = () => {
    alert('리포트 PDF 내보내기 기능은 마이페이지 및 분석 결과 탭에서 직접 다운로드가 가능합니다. (상세 양식 연동 중)');
  };

  // ─── 스캔 데이터 없을 때 Empty State ────────────────
  if (!hasScanData) {
    return (
      <div className="min-h-screen bg-background-gray">
        <Header variant="dashboard" />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-4 tablet:p-6 desktop:p-8 pb-24 desktop:pb-8">
            <div className="max-w-lg mx-auto text-center py-20 animate-fadeIn">
              <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText size={36} className="text-primary-300" />
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-3">
                아직 리포트가 없습니다
              </h2>
              <p className="text-text-secondary mb-8">
                첫 스캔을 완료하면 분석 리포트를 확인할 수 있습니다.
              </p>
              <Link to="/scan">
                <Button icon={Scan}>스캔하러 가기</Button>
              </Link>
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-gray">
      <Header variant="dashboard" />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-4 tablet:p-6 desktop:p-8 pb-24 desktop:pb-8 animate-fadeIn">
          <div className="max-w-6xl mx-auto">
            {/* ── 상단 제목 + PDF 내보내기 ──────────────── */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-text-primary">분석 리포트</h1>
                <p className="text-sm text-text-secondary">피부 변화 추이를 확인하세요</p>
              </div>
              <button
                onClick={handleExportPDF}
                className="hidden tablet:flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-text-primary hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              >
                <Download size={16} />
                PDF 내보내기
              </button>
            </div>

            {/* ── 모바일 기간/지표 탭 ─────────────────── */}
            <div className="desktop:hidden mb-6">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-3">
                {periodFilters.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPeriod(p.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      period === p.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-white border border-gray-200 text-text-secondary hover:border-primary-300'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {metricFilters.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMetric(m.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      metric === m.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-white border border-gray-200 text-text-secondary'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── 본문: 사이드바 + 콘텐츠 ────────────── */}
            <div className="flex">
              <ReportSidebar
                period={period}
                onPeriod={setPeriod}
                metric={metric}
                onMetric={setMetric}
              />

              <div className="flex-1 min-w-0 space-y-6">
                {/* ── 요약 카드 3개 ────────────────────── */}
                <div className="grid grid-cols-1 tablet:grid-cols-3 gap-4">
                  <SummaryCard
                    title="수분 변화"
                    value="+8%"
                    isPositive={true}
                    subtitle="지난달 대비"
                  />
                  <SummaryCard
                    title="유분 변화"
                    value="-5%"
                    isPositive={false}
                    subtitle="개선됨"
                  />
                  <SummaryCard
                    title="모공 변화"
                    value="+3%"
                    isPositive={true}
                    subtitle="경미 향상"
                  />
                </div>

                {/* ── 차트 + 히스토리 (가로 배치) ──────── */}
                <div className="grid grid-cols-1 desktop:grid-cols-2 gap-6">
                  {/* 월간 수분도 변화 차트 */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="text-sm font-semibold text-text-primary mb-4">
                      {metricLabel} 변화 추이
                    </h3>
                    {hasEnoughScans ? (
                      <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} barCategoryGap="30%">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                            <XAxis
                              dataKey="week"
                              tick={{ fontSize: 11, fill: '#757575' }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              domain={[0, 100]}
                              tick={{ fontSize: 11, fill: '#757575' }}
                              axisLine={false}
                              tickLine={false}
                              width={30}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={40}>
                              {chartData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={
                                    index === chartData.length - 1
                                      ? '#4CAF50'
                                      : '#C8E6C9'
                                  }
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-52 flex flex-col items-center justify-center text-center">
                        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                          <BarChart3 size={24} className="text-gray-300" />
                        </div>
                        <p className="text-sm text-text-secondary">
                          최소 2회 스캔 후 비교 가능합니다
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 측정 히스토리 테이블 */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="text-sm font-semibold text-text-primary mb-4">
                      측정 히스토리
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left py-2.5 pr-3 text-xs font-semibold text-text-secondary">
                              날짜
                            </th>
                            <th className="text-left py-2.5 pr-3 text-xs font-semibold text-text-secondary">
                              피부 타입
                            </th>
                            <th className="text-left py-2.5 pr-3 text-xs font-semibold text-text-secondary">
                              점수
                            </th>
                            <th className="text-left py-2.5 text-xs font-semibold text-text-secondary min-w-[120px]">
                              변화
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {measurementHistory.map((item) => (
                            <tr
                              key={item.id}
                              className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                            >
                              <td className="py-3.5 pr-3 text-text-primary font-medium">
                                {item.date}
                              </td>
                              <td className="py-3.5 pr-3 text-text-secondary">
                                {item.skinType}
                              </td>
                              <td className="py-3.5 pr-3 font-bold text-text-primary">
                                {item.score}
                              </td>
                              <td className="py-3.5">
                                <div className="flex items-center gap-2">
                                  <ProgressBar value={item.score} />
                                  {item.change !== '-' && (
                                    <span
                                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                        item.trend === 'up'
                                          ? 'bg-primary-50 text-primary-600'
                                          : item.trend === 'down'
                                          ? 'bg-red-50 text-red-500'
                                          : 'bg-gray-100 text-text-secondary'
                                      }`}
                                    >
                                      {item.change}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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

export default ReportPage;
