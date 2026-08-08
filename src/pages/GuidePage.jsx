import { Link } from 'react-router-dom';
import { Scan, FileText, Sparkles, ShoppingBag, ArrowRight, ChevronRight, CheckCircle2 } from 'lucide-react';
import Header from '../components/common/Header';

const steps = [
  {
    step: '01',
    title: '정밀 피부 스캔하기',
    desc: 'IoT 스캐너 장비를 연결하거나 직접 입력 방식으로 수분, 유분, 모공, 탄력, 색소침착을 정밀 측정합니다.',
    icon: Scan,
    color: 'from-blue-500 to-emerald-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    badge: '1단계: 스캔',
    details: ['IoT 스캐너 자동 감지', '자가진단 설문 병행', '5대 피부 지표 수집'],
  },
  {
    step: '02',
    title: '분석 리포트 확인하기',
    desc: '수집된 데이터를 바탕으로 피부 타입, 종합 점수, 얼굴 부위별 히트맵 분포를 시각적으로 진단받습니다.',
    icon: FileText,
    color: 'from-emerald-500 to-green-500',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    badge: '2단계: 리포트',
    details: ['종합 피부 점수 산출', '얼굴 부위별 히트맵', 'PDF 진단서 다운로드'],
  },
  {
    step: '03',
    title: 'AI 맞춤 팁 받아보기',
    desc: '나의 피부 진단 결과와 현재 거주 지역의 실시간 날씨(온도·습도·자외선)를 조합한 맞춤 팁을 제공합니다.',
    icon: Sparkles,
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600',
    badge: '3단계: AI 케어',
    details: ['실시간 날씨 자동 연동', '아침·저녁 맞춤 루틴', '주의 성분 세부 가이드'],
  },
  {
    step: '04',
    title: '맞춤 화장품 추천받기',
    desc: '내 피부 매칭율이 높고 자극이 적은 스킨케어 제품을 추천받아 나만의 뷰티 찜 목록에 담아 관리합니다.',
    icon: ShoppingBag,
    color: 'from-rose-500 to-pink-500',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-600',
    badge: '4단계: 제품 추천',
    details: ['피부 궁합 매칭율 계산', '카테고리별 추천 필터', '찜하기 5초 되돌리기 기능'],
  },
];

const GuidePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 flex flex-col justify-between">
      <div>
        <Header variant="landing" />

        {/* Hero Section */}
        <section className="py-12 tablet:py-16 text-center max-w-3xl mx-auto px-4">
          <span className="inline-block bg-primary-100 text-primary-700 text-xs font-bold px-3.5 py-1.5 rounded-full mb-4">
            담다(DAMDA) 이용 가이드
          </span>
          <h1 className="text-3xl tablet:text-4xl font-extrabold text-text-primary mb-4 leading-tight">
            스캔부터 AI 화장품 추천까지<br />
            <span className="text-primary-500">4단계로 완성하는 피부 케어</span>
          </h1>
          <p className="text-text-secondary text-sm tablet:text-base leading-relaxed">
            담다 서비스를 쉽고 효과적으로 활용할 수 있도록 주요 이용 순서를 안내해 드립니다.
          </p>
        </section>

        {/* Steps Grid Section */}
        <section className="max-w-5xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 tablet:grid-cols-2 gap-6 tablet:gap-8">
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <div 
                  key={s.step}
                  className="bg-white rounded-3xl border border-gray-100 p-7 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group flex flex-col justify-between"
                >
                  {/* Step Badge */}
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${s.bgColor} ${s.textColor}`}>
                        {s.badge}
                      </span>
                      <span className="text-2xl font-black text-gray-200 group-hover:text-primary-300 transition-colors">
                        STEP {s.step}
                      </span>
                    </div>

                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-2xl ${s.bgColor} ${s.textColor} flex items-center justify-center flex-shrink-0 shadow-inner`}>
                        <Icon size={24} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-text-primary mb-1">{s.title}</h2>
                        <p className="text-xs text-text-secondary leading-relaxed">{s.desc}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bullet Checklist */}
                  <div className="mt-6 pt-5 border-t border-gray-100/80 bg-gray-50/50 -mx-7 -mb-7 p-6 rounded-b-3xl">
                    <ul className="space-y-2">
                      {s.details.map((detail, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs font-medium text-text-secondary">
                          <CheckCircle2 size={14} className="text-primary-500 flex-shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom CTA */}
          <div className="mt-14 text-center pb-4">
            <h3 className="text-xl font-bold text-text-primary mb-2">지금 바로 내 피부 상태를 분석해보세요!</h3>
            <p className="text-xs text-text-secondary mb-6">로그인 후 바로 피부 스캔을 시작할 수 있어요.</p>
            <Link
              to="/login"
              className="btn-primary inline-flex items-center gap-2 text-sm px-8 py-3"
            >
              피부 분석 시작하기 <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-primary-500"></span>
            <span className="text-sm font-semibold text-text-primary">AI-SkinLab</span>
          </div>
          <p className="text-xs text-text-secondary">© 2026 AI-SkinLab. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default GuidePage;
