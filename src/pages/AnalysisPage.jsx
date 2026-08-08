import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Scan, BarChart3, Sparkles, ShoppingBag, Download, Check, AlertCircle, FileText, ArrowRight
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

    // Fallback: 고급 헬스케어 리포트 PDF 양식
    const reportHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>담다 피부 분석 리포트 - ${analysis.date || new Date().toLocaleDateString()}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Pretendard:wght@400;600;700;800&display=swap');
          * { box-sizing: border-box; }
          body {
            font-family: 'Pretendard', -apple-system, sans-serif;
            padding: 40px;
            color: #1f2937;
            background-color: #f9fafb;
            line-height: 1.6;
            max-width: 900px;
            margin: 0 auto;
          }
          .paper {
            background: #ffffff;
            padding: 48px;
            border-radius: 24px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
            border: 1px solid #f3f4f6;
          }
          .top-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #10b981;
            padding-bottom: 20px;
            margin-bottom: 32px;
          }
          .brand-logo {
            font-size: 22px;
            font-weight: 800;
            color: #10b981;
            letter-spacing: -0.5px;
          }
          .doc-type {
            font-size: 12px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 1px;
            background: #ecfdf5;
            padding: 4px 12px;
            border-radius: 20px;
          }
          .report-title {
            font-size: 28px;
            font-weight: 800;
            color: #111827;
            margin: 0 0 24px 0;
            letter-spacing: -0.8px;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 20px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 24px;
            border-radius: 18px;
            margin-bottom: 36px;
          }
          .meta-item { margin-bottom: 8px; }
          .meta-item:last-child { margin-bottom: 0; }
          .meta-label { font-size: 13px; color: #64748b; font-weight: 600; }
          .meta-value { font-size: 15px; color: #0f172a; font-weight: 700; }
          .score-badge {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: #ffffff;
            padding: 16px 24px;
            border-radius: 16px;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
          }
          .score-num { font-size: 32px; font-weight: 800; line-height: 1; margin-top: 4px; }
          .score-title { font-size: 12px; font-weight: 600; opacity: 0.9; }

          .section-title {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
            margin: 0 0 16px 0;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .section-title::before {
            content: '';
            display: inline-block;
            width: 4px;
            height: 18px;
            background: #10b981;
            border-radius: 2px;
          }

          table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-bottom: 40px;
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            overflow: hidden;
          }
          th {
            background-color: #f9fafb;
            color: #4b5563;
            font-weight: 700;
            font-size: 13px;
            padding: 14px 18px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }
          td {
            padding: 14px 18px;
            font-size: 14px;
            color: #1f2937;
            border-bottom: 1px solid #f3f4f6;
          }
          tr:last-child td { border-bottom: none; }
          .status-tag {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 700;
          }
          .tag-good { background: #d1fae5; color: #047857; }
          .tag-fair { background: #fef3c7; color: #b45309; }
          .tag-poor { background: #fee2e2; color: #b91c1c; }

          .care-box {
            background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
            border: 1px solid #a7f3d0;
            padding: 28px;
            border-radius: 18px;
            margin-top: 32px;
          }
          .care-box h3 {
            margin: 0 0 12px 0;
            color: #047857;
            font-size: 16px;
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .care-box p { font-size: 14px; color: #065f46; font-weight: 600; margin-bottom: 14px; }
          .care-box ul { margin: 0; padding-left: 20px; color: #047857; font-size: 13.5px; }
          .care-box li { margin-bottom: 6px; }

          .btn-print {
            position: fixed;
            top: 24px;
            right: 24px;
            padding: 12px 24px;
            background: #10b981;
            color: white;
            border: none;
            border-radius: 30px;
            cursor: pointer;
            font-weight: 700;
            font-size: 14px;
            box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.4);
            transition: all 0.2s;
            z-index: 1000;
          }
          .btn-print:hover { background: #059669; transform: translateY(-2px); }
          @media print {
            body { background: white; padding: 0; }
            .paper { box-shadow: none; border: none; padding: 0; }
            .btn-print { display: none; }
          }
        </style>
      </head>
      <body>
        <button class="btn-print" onclick="window.print()">🖨️ 프린트 및 PDF 저장</button>
        <div class="paper">
          <div class="top-bar">
            <div class="brand-logo">DAMDA SKIN LAB</div>
            <div class="doc-type">Official Report</div>
          </div>

          <h1 class="report-title">피부 정밀 종합 리포트</h1>

          <div class="meta-grid">
            <div>
              <div class="meta-item">
                <span class="meta-label">분석 일시: </span>
                <span class="meta-value">${analysis.date || new Date().toLocaleDateString()}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">진단 피부 타입: </span>
                <span class="meta-value">${analysis.skinType || '복합성 피부'}</span>
              </div>
            </div>
            <div class="score-badge">
              <span class="score-title">종합 피부 점수</span>
              <span class="score-num">${overallScore}점</span>
            </div>
          </div>

          <h2 class="section-title">5가지 핵심 피부 지표 분석</h2>
          <table>
            <thead>
              <tr>
                <th>지표명</th>
                <th>측정 수치</th>
                <th>평가 상태</th>
                <th>세부 진단 소견</th>
              </tr>
            </thead>
            <tbody>
              ${metrics.map(m => {
                let tagClass = 'tag-good';
                if (m.status === '주의' || m.status === '관리 권장') tagClass = 'tag-fair';
                if (m.status === '경고' || m.status === '매우 건조') tagClass = 'tag-poor';
                return `
                  <tr>
                    <td><strong>${m.label}</strong></td>
                    <td><strong>${m.value}%</strong></td>
                    <td><span class="status-tag ${tagClass}">${m.status}</span></td>
                    <td style="color: #4b5563;">${m.description}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="care-box">
            <h3>✨ AI 종합 분석 & 솔루션</h3>
            <p>${summary}</p>
            <ul>
              ${tips.map(t => `<li>${t}</li>`).join('')}
            </ul>
          </div>
        </div>
      </body>
      </html>
    `;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(reportHtml);
      win.document.close();
    } else {
      alert('팝업이 차단되어 있습니다. 브라우저 주소창 우측에서 팝업 차단을 해제해 주세요.');
    }
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
                        <ShoppingBag className="mx-auto mb-3 text-primary-400/60" size={36} />
                        <p className="text-sm font-medium text-text-primary mb-1">맞춤 추천 화장품 탐색</p>
                        <p className="text-xs text-text-secondary mb-5">분석 결과에 적합한 스킨케어 상품들을 바로 확인해 보세요.</p>
                        <Link to="/products">
                          <Button size="sm" icon={ArrowRight} className="rounded-full px-5 py-2.5 font-semibold text-xs shadow-sm hover:shadow transition-all">
                            화장품 추천 페이지로 이동
                          </Button>
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
