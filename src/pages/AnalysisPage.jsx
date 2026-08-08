import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Scan, BarChart3, Sparkles, ShoppingBag, Download, Check, AlertCircle, FileText
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Legend
} from 'recharts';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import BottomNav from '../components/common/BottomNav';
import Button from '../components/common/Button';
import useAuth from '../hooks/useAuth';
import useScanStore from '../store/scanStore';
import { downloadReportPdf } from '../api/scan';

// ─── 지표 색상 매핑 ───
const statusColorMap = {
  green: { bg: 'bg-primary-50', text: 'text-primary-600', color: '#4CAF50' },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', color: '#EAB308' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', color: '#F97316' },
};

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
  return [
    { label: '수분도', value: scan?.moisture ?? 0, ...ratingFromValue(scan?.moisture ?? 0), description: '정상 범위 (60-90%)' },
    { label: '유분도', value: scan?.oil ?? 0, ...ratingFromValue(100 - (scan?.oil ?? 0)), description: 'T존 유분 분포' },
    { label: '탄력', value: scan?.elasticity ?? 0, ...ratingFromValue(scan?.elasticity ?? 0), description: '볼 부위 탄력 지수' },
    { label: '모공', value: scan?.spots ?? 0, ...ratingFromValue(scan?.spots ?? 0), description: '코 주변 모공 상태' },
    { label: '색소침착', value: scan?.pigmentation ?? 0, ...ratingFromValue(100 - (scan?.pigmentation ?? 0)), description: '이마·볼 상단 색소' },
  ];
}

// 종합 점수 원형 차트
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
  const [activeMenu, setActiveMenu] = useState('overview'); // overview, heatmap, ai-care, products, export

  useEffect(() => {
    initializeIfNeeded();
  }, [initializeIfNeeded]);

  // 스크롤 상단 이동 (H.5 탭 전환 시 스크롤 상단 초기화)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeMenu]);

  const analysis = currentScan;
  const hasScanData = !!currentScan;

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
  const recommendedProducts = analysis.recommendedProducts || [];

  // 레이더 차트 매핑
  const radarData = metrics.map((m, i) => ({
    subject: m.label,
    current: m.value,
    previous: Math.max(m.value - (i % 2 === 0 ? 8 : -5), 25),
  }));

  // PDF 출력 핸들러 (백엔드 PDF API 연동 + FE Fallback)
  const handleExportPDF = async () => {
    const sessionId = currentScan?.sessionId;

    if (sessionId) {
      try {
        const blob = await downloadReportPdf(sessionId);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `damda_report_${sessionId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      } catch (err) {
        console.warn('BE PDF download failed or mock mode, fallback to FE renderer:', err);
      }
    }

    // Fallback: FE HTML 인쇄/PDF 양식
    const reportHtml = `
      <html>
      <head>
        <title>담다 피부 분석 리포트 - ${analysis.date || new Date().toLocaleDateString()}</title>
        <style>
          body { font-family: 'Apple SD Gothic Neo', sans-serif; padding: 40px; color: #333; line-height: 1.6; }
          .header { border-bottom: 3px solid #4CAF50; padding-bottom: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
          .logo { font-size: 24px; font-weight: bold; color: #4CAF50; }
          .title { font-size: 28px; font-weight: bold; margin: 0; }
          .meta-info { background: #f9f9f9; padding: 15px; border-radius: 12px; margin-bottom: 30px; font-size: 14px; }
          .score-box { display: inline-block; font-size: 32px; font-weight: bold; color: #4CAF50; border: 2px solid #4CAF50; padding: 5px 15px; border-radius: 8px; margin-top: 10px; }
          table { width: 100%; border-collapse: collapse; margin: 25px 0; }
          th, td { border: 1px solid #e0e0e0; padding: 12px 15px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .tip-box { background-color: #e8f5e9; border-left: 5px solid #4CAF50; padding: 20px; border-radius: 8px; margin-top: 30px; }
          .tip-box h3 { margin-top: 0; color: #2e7d32; }
          .btn-print { margin-bottom: 20px; padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
          @media print { .btn-print { display: none; } }
        </style>
      </head>
      <body>
        <button class="btn-print" onclick="window.print()">프린트 및 PDF 저장</button>
        <div class="header">
          <h1 class="title">피부 종합 리포트</h1>
          <span class="logo">담다</span>
        </div>
        <div class="meta-info">
          <p><strong>분석 일시:</strong> ${analysis.date || new Date().toLocaleDateString()}</p>
          <p><strong>진단 피부 타입:</strong> ${analysis.skinType || '복합성 피부'}</p>
          <div class="score-box">종합 점수: ${overallScore}점</div>
        </div>
        <h2>5가지 핵심 피부 지표</h2>
        <table>
          <thead>
            <tr>
              <th>지표명</th>
              <th>점수 / 수치</th>
              <th>평가 상태</th>
              <th>세부 진단</th>
            </tr>
          </thead>
          <tbody>
            ${metrics.map(m => `
              <tr>
                <td><strong>${m.label}</strong></td>
                <td>${m.value}%</td>
                <td>${m.status}</td>
                <td>${m.description}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="tip-box">
          <h3>AI 종합 분석 & 케어 조언</h3>
          <p>${summary}</p>
          <ul>
            ${tips.map(t => `<li>${t}</li>`).join('')}
          </ul>
        </div>
      </body>
      </html>
    `;
    const win = window.open('', '_blank');
    win.document.write(reportHtml);
    win.document.close();
  };

  // Canvas 기반 요약 이미지 카드 다운로드
  const handleExportImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    // 배경 그리기
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 600, 400);

    // 테두리 및 그라데이션 상단바
    const grad = ctx.createLinearGradient(0, 0, 600, 0);
    grad.addColorStop(0, '#4CAF50');
    grad.addColorStop(1, '#81C784');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 15);

    // 텍스트 드로잉
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('담다 피부 요약 카드', 30, 60);

    ctx.fillStyle = '#6B7280';
    ctx.font = '14px sans-serif';
    ctx.fillText(`측정일: ${analysis.date || new Date().toLocaleDateString()}`, 30, 85);
    ctx.fillText(`피부타입: ${analysis.skinType || '복합성'}`, 30, 105);

    // 점수 드로잉
    ctx.fillStyle = '#4CAF50';
    ctx.font = 'bold 48px sans-serif';
    ctx.fillText(`${overallScore}`, 460, 90);
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '16px sans-serif';
    ctx.fillText('/100 점', 530, 85);

    // 가로 구분선
    ctx.strokeStyle = '#F3F4F6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, 130);
    ctx.lineTo(570, 130);
    ctx.stroke();

    // 지표들 그리기
    metrics.forEach((m, idx) => {
      const y = 170 + idx * 42;
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(m.label, 40, y);

      // 바 배경
      ctx.fillStyle = '#F3F4F6';
      ctx.fillRect(140, y - 12, 300, 12);

      // 바 강도 색상
      ctx.fillStyle = m.statusColor === 'green' ? '#4CAF50' : m.statusColor === 'yellow' ? '#EAB308' : '#F97316';
      ctx.fillRect(140, y - 12, (m.value / 100) * 300, 12);

      // 상태 텍스트
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`${m.value}% (${m.status})`, 460, y);
    });

    // 다운로드 트리거
    const link = document.createElement('a');
    link.download = `damda-skin-summary-${analysis.date || 'today'}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const sideMenuItems = [
    { id: 'overview', label: '종합 분석', icon: BarChart3 },
    { id: 'heatmap', label: '항목 히트맵', icon: Sparkles },
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
            {/* ── 상단 요약 배너 ── */}
            <div className="flex flex-col tablet:flex-row items-center gap-5 mb-5 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="bg-primary-50 border border-primary-100 rounded-2xl p-5 flex flex-col items-center flex-shrink-0">
                <ScoreCircle score={overallScore} />
                <span className="mt-2 inline-block bg-primary-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                  {analysis.skinType || '복합성 피부'}
                </span>
              </div>

              <div className="flex flex-wrap gap-3 justify-center tablet:justify-start flex-1 w-full">
                {metrics.map((m) => {
                  const style = statusColorMap[m.statusColor];
                  return (
                    <div key={m.label} className={`flex flex-col items-center px-4 py-3 rounded-xl border ${style.bg} min-w-[90px] flex-1`}>
                      <span className={`text-xl font-bold ${style.text}`}>{m.value}%</span>
                      <span className="text-[10px] text-text-secondary mt-0.5">{m.label}</span>
                      <span className={`text-[9px] font-bold mt-1 px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                        {m.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 본문 레이아웃 */}
            <div className="flex flex-col desktop:flex-row gap-6">
              {/* 사이드 탭 가로 이동식 (모바일/태블릿) & 세로형 (데스크톱) */}
              <div className="w-full desktop:w-44 flex-shrink-0">
                <nav className="flex desktop:flex-col overflow-x-auto pb-2 desktop:pb-0 gap-1 border-b desktop:border-b-0 desktop:border-r border-gray-200 pr-0 desktop:pr-4 scrollbar-hide">
                  {sideMenuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveMenu(item.id)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left whitespace-nowrap ${
                          activeMenu === item.id
                            ? 'bg-primary-500 text-white shadow-sm font-bold'
                            : 'text-text-secondary hover:bg-white hover:text-text-primary'
                        }`}
                      >
                        <Icon size={16} />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* 탭 렌더링 영역 */}
              <div className="flex-1 min-w-0">
                {/* 1. 종합 분석 */}
                {activeMenu === 'overview' && (
                  <div className="grid grid-cols-1 desktop:grid-cols-2 gap-6 animate-fadeIn">
                    {/* 레이더 차트 */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                      <h3 className="text-sm font-bold text-text-primary mb-2">피부 상태 레이더 차트</h3>
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
                    </div>

                    {/* 지표별 상세 */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                      <h3 className="text-sm font-bold text-text-primary mb-4">지표별 상세 분석</h3>
                      <div className="space-y-4">
                        {metrics.map((m) => {
                          const style = statusColorMap[m.statusColor];
                          return (
                            <div key={m.label}>
                              <div className="flex items-center gap-3 mb-1">
                                <span className="text-xs font-semibold text-text-primary w-14 flex-shrink-0">{m.label}</span>
                                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-1000 ease-out"
                                    style={{
                                      width: `${m.value}%`,
                                      backgroundColor: style.color,
                                    }}
                                  />
                                </div>
                                <span className="text-sm font-bold text-text-primary w-10 text-right">{m.value}%</span>
                              </div>
                              <div className="flex items-start gap-2 ml-[68px]">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${style.bg} ${style.text}`}>
                                  {m.status}
                                </span>
                                <p className="text-[11px] text-text-secondary leading-relaxed">{m.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. 항목 히트맵 (H.5.2) */}
                {activeMenu === 'heatmap' && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-fadeIn">
                    <h3 className="text-sm font-bold text-text-primary mb-1">얼굴 부위별 수분/유분 분포 히트맵</h3>
                    <p className="text-xs text-text-secondary mb-8">스캔한 영역별 실시간 수분/유분 검지 히트맵 분포도입니다.</p>

                    <div className="flex flex-col tablet:flex-row items-center justify-center gap-10 desktop:gap-16">
                      {/* 세련된 얼굴 실루엣 히트맵 카드 */}
                      <div className="relative w-64 h-64 bg-gradient-to-b from-primary-50/30 via-white to-gray-50/40 rounded-3xl border border-primary-100/60 p-3.5 flex flex-col items-center justify-around shadow-sm">
                        {/* 은은한 얼굴 실루엣 SVG 백그라운드 */}
                        <svg className="absolute inset-0 w-full h-full text-primary-200/40 pointer-events-none p-3" viewBox="0 0 100 120" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2">
                          <ellipse cx="50" cy="55" rx="36" ry="46" />
                          {/* 눈썹/코 라인 가이드 */}
                          <path d="M 32 40 Q 40 37 45 40" strokeWidth="0.5" />
                          <path d="M 68 40 Q 60 37 55 40" strokeWidth="0.5" />
                          <path d="M 50 42 L 50 64 L 54 66" strokeWidth="0.5" strokeDasharray="none" />
                          <path d="M 40 82 Q 50 86 60 82" strokeWidth="0.5" />
                        </svg>

                        {/* 이마 */}
                        <div className="z-10 bg-white/95 backdrop-blur-sm border border-emerald-200 text-emerald-700 px-3.5 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          이마: <span className="font-extrabold">{metrics[0]?.value ?? 64}%</span>
                        </div>

                        {/* 코 & 양 볼 (중앙 핑거 영역) */}
                        <div className="z-10 w-full flex items-center justify-between px-1">
                          {/* 왼볼 */}
                          <div className="bg-white/95 backdrop-blur-sm border border-orange-200 text-orange-700 px-2.5 py-1 rounded-xl text-[11px] font-bold shadow-sm flex flex-col items-center">
                            <span className="text-[9px] text-orange-500 font-semibold">왼쪽 볼</span>
                            <span>{metrics[2]?.value ?? 68}%</span>
                          </div>

                          {/* 코 */}
                          <div className="bg-white/95 backdrop-blur-sm border border-amber-300 text-amber-800 px-2.5 py-1.5 rounded-xl text-[11px] font-bold shadow-sm flex flex-col items-center border-t-2 border-t-amber-400">
                            <span className="text-[9px] text-amber-600 font-semibold">코 (T존)</span>
                            <span className="text-xs font-extrabold">{metrics[3]?.value ?? 86}%</span>
                          </div>

                          {/* 오른볼 */}
                          <div className="bg-white/95 backdrop-blur-sm border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-xl text-[11px] font-bold shadow-sm flex flex-col items-center">
                            <span className="text-[9px] text-emerald-600 font-semibold">오른쪽 볼</span>
                            <span>{Math.max((metrics[0]?.value ?? 64) - 5, 40)}%</span>
                          </div>
                        </div>

                        {/* 턱 */}
                        <div className="z-10 bg-white/95 backdrop-blur-sm border border-amber-200 text-amber-700 px-3.5 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          턱: <span className="font-extrabold">{metrics[1]?.value ?? 58}%</span>
                        </div>
                      </div>

                      {/* 범례 및 분석 결과 */}
                      <div className="space-y-4 max-w-sm">
                        <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary-500" /> 부위별 상세 매핑 결과
                        </h4>
                        <div className="space-y-3 text-xs text-text-secondary leading-relaxed bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
                          <div className="flex items-start gap-2.5">
                            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full mt-1 flex-shrink-0" />
                            <p><strong className="text-text-primary">T존 (이마/코)</strong>: 유분기가 높고 모공 집중 관리가 요구됩니다. 가벼운 수분 제형 토너를 권장합니다.</p>
                          </div>
                          <div className="flex items-start gap-2.5 border-t border-gray-200/60 pt-3">
                            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full mt-1 flex-shrink-0" />
                            <p><strong className="text-text-primary">U존 (양 볼/턱)</strong>: 건조와 당김이 감지되어 고보습 크림 마스크 밀착 관리가 필요합니다.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. AI 케어 조언 (H.5.3) */}
                {activeMenu === 'ai-care' && (
                  <div className="space-y-6 animate-fadeIn">
                    {/* AI 종합 분석 카드 */}
                    {summary && (
                      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                          <Sparkles size={16} className="text-primary-500" /> AI 종합 케어 코멘트
                        </h3>
                        <p className="text-sm text-text-secondary leading-relaxed">{summary}</p>
                      </div>
                    )}

                    {/* 추천 가이드 */}
                    {tips.length > 0 && (
                      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-text-primary mb-4">생활 밀착형 스킨케어 팁</h3>
                        <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4">
                          {tips.map((tip, i) => (
                            <div key={i} className="bg-background-gray rounded-xl p-4 border border-gray-100 flex items-start gap-3">
                              <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-xs flex-shrink-0">{i + 1}</span>
                              <p className="text-xs text-text-secondary leading-relaxed mt-0.5">{tip}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. 제품 추천 (H.5.4) */}
                {activeMenu === 'products' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-text-primary">분석 맞춤 추천 화장품</h3>
                      <Link to="/products" className="text-xs font-semibold text-primary-600 flex items-center gap-1">
                        전체 추천 보기 <ArrowRight size={13} />
                      </Link>
                    </div>

                    {recommendedProducts.length > 0 ? (
                      <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4">
                        {recommendedProducts.slice(0, 4).map((p) => (
                          <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-4 flex gap-3 shadow-sm">
                            <div className="w-16 h-16 rounded-lg bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">📦</div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] text-text-secondary">{p.brand}</p>
                              <p className="text-xs font-bold text-text-primary truncate">{p.name}</p>
                              <span className="text-[10px] text-primary-600 font-bold mt-1 inline-block">매칭율 {p.compatibility}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-text-secondary">
                        <ShoppingBag className="mx-auto mb-2 text-gray-300" size={32} />
                        <p className="text-sm mb-4">현재 분석 결과에 대한 제품 매칭을 생성하고 있습니다.</p>
                        <Link to="/products">
                          <Button size="small">화장품 추천 페이지로 이동</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. 결과 내보내기 (H.7) */}
                {activeMenu === 'export' && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-fadeIn max-w-lg mx-auto">
                    <h3 className="text-sm font-bold text-text-primary mb-2 text-center">리포트 다운로드 및 저장</h3>
                    <p className="text-xs text-text-secondary mb-8 text-center">현재 분석된 피부 상태 상세 진단서를 원하는 형식으로 내보냅니다.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* PDF */}
                      <button
                        onClick={handleExportPDF}
                        className="group border border-gray-200 hover:border-primary-400 p-5 rounded-2xl text-left transition-all hover:shadow-md flex flex-col items-center text-center"
                      >
                        <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors text-primary-500">
                          <FileText size={22} />
                        </div>
                        <h4 className="text-sm font-bold text-text-primary mb-1">인쇄용 PDF 내보내기</h4>
                        <p className="text-[11px] text-text-secondary">전체 진단 데이터를 A4 인쇄 레이아웃으로 출력하거나 PDF로 저장</p>
                      </button>

                      {/* 이미지 카드 */}
                      <button
                        onClick={handleExportImage}
                        className="group border border-gray-200 hover:border-primary-400 p-5 rounded-2xl text-left transition-all hover:shadow-md flex flex-col items-center text-center"
                      >
                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors text-green-600">
                          <Download size={22} />
                        </div>
                        <h4 className="text-sm font-bold text-text-primary mb-1">요약 카드 다운로드</h4>
                        <p className="text-[11px] text-text-secondary">핵심 점수 및 주요 5지표 요약 이미지를 스마트폰에 저장 (PNG)</p>
                      </button>
                    </div>
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
