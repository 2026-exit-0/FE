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

// ─── 루틴 데이터 맵 정의 (피부 타입별 맞춤 케어 루틴) ───
const ROUTINE_TEMPLATES = {
  건성: {
    morning: [
      { step: 1, type: '클렌징', name: '약산성 보습 젤 클렌저', desc: '유분막을 지키고 건조함을 방지하는 저자극 세안', usage: '미온수로 가볍게 롤링 후 씻어냅니다.', good: ['글리세린', '세라마이드'], bad: ['소듐라우릴설페이트(SLS)', '에탄올'] },
      { step: 2, type: '토너', name: '고보습 히알루론산 토너', desc: '세안 직후 메마른 피부에 수분 길을 열어주는 단계', usage: '손에 덜어 톡톡 두드리며 흡수시킵니다.', good: ['히알루론산', '판테놀'], bad: ['알코올데나트', '멘톨'] },
      { step: 3, type: '세럼', name: '프로폴리스 영양 앰플', desc: '풍부한 영양 공급과 피부 속건조를 잡는 세럼', usage: '3~4방울 떨어뜨려 지긋이 눌러줍니다.', good: ['프로폴리스', '로얄젤리'], bad: ['에센셜 오일'] },
      { step: 4, type: '크림', name: '인텐시브 세라마이드 리치 크림', desc: '밤새 날아가지 않는 강력한 오일막 잠금 장치', usage: '손끝의 열로 녹여 얼굴 전체에 감싸주듯 바릅니다.', good: ['세라마이드 NP', '시어버터'], bad: ['미네랄 오일'] },
      { step: 5, type: '선케어', name: '수분 에센스 선크림 SPF50+', desc: '백탁 없이 촉촉한 에센스 타입의 자외선 차단', usage: '외출 20분 전 넉넉한 양을 펴 바릅니다.', good: ['유기자차 성분', '병풀추출물'], bad: ['에탄올'] }
    ],
    night: [
      { step: 1, type: '클렌징', name: '호호바 클렌징 오일 & 폼', desc: '메이크업과 모공 노폐물을 자극 없이 지우는 2중 세안', usage: '마른 얼굴에 오일로 롤링 후 물을 묻혀 유화시킨 뒤 헹굽니다.', good: ['호호바씨오일', '살구씨오일'], bad: ['합성 향료'] },
      { step: 2, type: '토너', name: '스킨 팩용 진정 코튼 토너', desc: '피부 결을 정돈하고 스킨 팩으로 진정 효과 극대화', usage: '화장솜에 듬뿍 적셔 5분간 이마와 볼에 얹어둡니다.', good: ['베타글루칸', '알란토인'], bad: ['살리실산(BHA)'] },
      { step: 3, type: '세럼', name: '피토 스쿠알란 보습 앰플', desc: '장벽을 강화하고 피부결을 유연하게 만드는 앰플', usage: '크림 전 단계에서 충분히 흡수시킵니다.', good: ['스쿠알란', '토코페롤'], bad: [] },
      { step: 4, type: '크림', name: '나이트 리커버리 밤 크림', desc: '수면 중 피부 회복과 수분 유실 방지를 돕는 수면 밤', usage: '평소보다 1.5배 도톰하게 슬리핑 팩처럼 얹어줍니다.', good: ['판테놀 5%', '마데카소사이드'], bad: ['이소프로필미리스테이트'] }
    ],
    weekly: [
      { step: 1, type: '각질제거', name: '마일드 PHA 필링 젤', desc: '피부 자극 없이 묵은 각질만 녹여내는 수분 필링', usage: '주 1회, 젖은 상태에서 부드럽게 밀어낸 후 씻어냅니다.', good: ['글루코노락톤(PHA)'], bad: ['스크럽 알갱이', 'AHA 고농도'] },
      { step: 2, type: '스페셜케어', name: '세라마이드 집중 수분 마스크 팩', desc: '고농축 세라마이드 에센스로 속건조 응급 처치', usage: '주 2회, 토너 정리 후 15분간 부착합니다.', good: ['세라마이드', '콜라겐'], bad: ['파라벤'] }
    ]
  },
  지성: {
    morning: [
      { step: 1, type: '클렌징', name: '피지 컨트롤 약산성 폼', desc: '밤샘 분비된 과도한 피지를 깔끔하게 씻어내는 세안', usage: '거품을 풍성하게 내어 T존 위주로 롤링합니다.', good: ['티트리 추출물', '살리실산'], bad: ['코코넛 오일'] },
      { step: 2, type: '토너', name: 'BHA 데일리 각질 토너', desc: '과다 피지를 조절하고 번들거림을 잡는 단계', usage: '화장솜에 적셔 안쪽에서 바깥쪽으로 가볍게 닦아냅니다.', good: ['베타인살리실레이트(BHA)', '징크PCA'], bad: ['시어버터', '스테아릭애씨드'] },
      { step: 3, type: '세럼', name: '나이아신아마이드 모공 세럼', desc: '늘어진 모공을 촘촘히 좁히고 과다 피지 분비를 방지하는 세럼', usage: '피지 고민 부위에 집중적으로 펴 바릅니다.', good: ['나이아신아마이드 5%', '징크옥사이드'], bad: ['합성 오일'] },
      { step: 4, type: '크림', name: '오일 프리 워터풀 젤 로션', desc: '유분기 없이 수분으로만 꽉 채우는 산뜻한 오일프리 젤', usage: '얇게 펴 바르고 톡톡 두드려 완전히 흡수시킵니다.', good: ['알로에베라', '부틸렌글라이콜'], bad: ['미리스틸미리스테이트'] },
      { step: 5, type: '선케어', name: '노세범 무기자차 선스크린 SPF50+', desc: '보송하게 하루 종일 유분기를 잡아주는 물리 차단', usage: 'T존과 외곽 라인까지 꼼꼼히 흡수시킵니다.', good: ['징크옥사이드', '실리카'], bad: ['이소프로필팔미테이트'] }
    ],
    night: [
      { step: 1, type: '클렌징', name: '가벼운 미셀라 클렌징 워터 & 젤 폼', desc: '잔여 오일막 없는 산뜻한 세안 단계', usage: '워터로 1차 닦아낸 후, 약산성 젤 폼으로 2차 세안합니다.', good: ['병풀추출물', '글리세린'], bad: ['팔미틱애씨드'] },
      { step: 2, type: '토너', name: '티트리 진정 토너', desc: '트러블 진정과 붉은 기 완화를 돕는 닦토', usage: '피부 결 방향대로 닦아내어 청량감을 줍니다.', good: ['티트리잎수', '어성초추출물'], bad: ['미네랄오일'] },
      { step: 3, type: '세럼', name: '레티놀 모공 리페어 앰플', desc: '피지 배출을 돕고 모공 벽 탄력을 개선하는 밤 전용 앰플', usage: '토너 흡수 후 소량을 고르게 펴 바릅니다.', good: ['레티놀', '아데노신'], bad: ['고농도 AHA/BHA (동시 사용 주의)'] },
      { step: 4, type: '크림', name: '약산성 스딩 수딩 젤 크림', desc: '모공 차단 성분이 없는 산뜻한 수분 보호막', usage: '답답하지 않게 소량만 밀착해 펴 발라줍니다.', good: ['센텔라아시아티카', '히알루론산'], bad: ['코코넛 버터', '왁스 계열'] }
    ],
    weekly: [
      { step: 1, type: '모공케어', name: '포어 클레이 마스크 팩', desc: '모공 속 굳은 피지와 블랙헤드를 흡착하는 클레이 팩', usage: '주 2회, 얼굴 전체 도포 후 10분 뒤 미온수로 씻어냅니다.', good: ['카올린', '벤토나이트'], bad: ['알코올 고함량'] },
      { step: 2, type: '각질제거', name: '살리실산(BHA) 필링 리퀴드', desc: '모공 속 깊숙이 침투하여 면포를 정돈하는 화학적 필링', usage: '주 1회, 저녁 토너 단계에서 사용합니다.', good: ['살리실산 2%'], bad: ['거친 스크럽 물리 필링'] }
    ]
  },
  민감성: {
    morning: [
      { step: 1, type: '클렌징', name: '초저자극 약산성 버블 폼', desc: '손 마찰조차 최소화하는 부드러운 거품 세안', usage: '거품을 올린 뒤 마찰 없이 가볍게 누르며 씻어냅니다.', good: ['아미노산계 계면활성제', '녹차수'], bad: ['향료', '합성방부제'] },
      { step: 2, type: '토너', name: '무알콜 어성초 진정 스킨', desc: '홍조와 열감을 빠르게 식혀주는 진정 물토너', usage: '화장솜 대신 손으로 여러 번 덧발라 레이어링합니다.', good: ['어성초추출물(약모밀)', '알란토인'], bad: ['에탄올', '페녹시에탄올'] },
      { step: 3, type: '세럼', name: '판테놀 모이스처 배리어 세럼', desc: '피부 본연의 기초 체력(장벽)을 다지는 앰플 세럼', usage: '두드리지 않고 손바닥으로 감싸 흡수시킵니다.', good: ['판테놀 5%', '마데카소사이드'], bad: ['로즈마리 오일', '에센셜 아로마'] },
      { step: 4, type: '크림', name: '더마 리커버리 시카 크림', desc: '자극받은 피부 장벽을 편안하게 덮어주는 진정 밤크림', usage: '홍조 부위에 도톰히 얹듯 펴 바릅니다.', good: ['마데카식애씨드', '피토스테롤'], bad: ['피이지(PEG) 계열'] },
      { step: 5, type: '선케어', name: '무기 100% 논나노 진정 선크림 SPF50+', desc: '민감 피부에 화학 반응 없는 무기자차 자외선 차단', usage: '꼼꼼히 펴 바르고 외출합니다.', good: ['징크옥사이드', '티타늄디옥사이드'], bad: ['에틸헥실메톡시신나메이트'] }
    ],
    night: [
      { step: 1, type: '클렌징', name: '약산성 더마 클렌징 밀크', desc: '오일보다 잔여 자극이 적고 촉촉한 로션 세안', usage: '로션으로 롤링 후 해면이나 화장솜으로 가볍게 닦고 미온수 세안합니다.', good: ['해바라기씨오일', '판테놀'], bad: ['소듐라우릴설페이트'] },
      { step: 2, type: '토너', name: '어성초 약산성 보습 토너', desc: '세안 직후 진정과 속수분 공급 단계', usage: '손으로 꾹꾹 누르듯이 도포합니다.', good: ['약모밀추출물', '병풀잎추출물'], bad: ['티트리오일 고함량'] },
      { step: 3, type: '세럼', name: '아줄렌 리페어 시카 앰플', desc: '극강의 붉은기 완화 및 자극 완화 앰플', usage: '스포이드로 도포 후 넓게 지긋이 흡수시킵니다.', good: ['구아이아줄렌', '피토스핑고신'], bad: ['비타민C 고농도'] },
      { step: 4, type: '크림', name: '베리어 세라밤 리페어 크림', desc: '외부 자극으로부터 피부를 완전 격리시켜주는 슬리핑 배리어', usage: '얼굴 전체에 적당량 펴 바르고 잠자리에 듭니다.', good: ['세라마이드 NP', '스쿠알란'], bad: ['살리실산', '레티놀'] }
    ],
    weekly: [
      { step: 1, type: '스페셜케어', name: '순면 시카 보습 밀착 팩', desc: '표백 처리가 없는 순면 시트로 홍조 진정', usage: '주 1회, 달아오른 부위에 10분간만 얹어둡니다.', good: ['병풀추출물', '아시아티코사이드'], bad: ['티트리', '알코올'] }
    ]
  },
  복합성: {
    morning: [
      { step: 1, type: '클렌징', name: '순한 아침 약산성 젤 폼', desc: 'T존 피지는 없애고 U존 수분은 남기는 적당한 세안', usage: '거품을 T존 먼저 바르고 가볍게 러빙 후 헹굽니다.', good: ['데실글루코사이드', '녹차추출물'], bad: ['강한 알칼리 세안제'] },
      { step: 2, type: '토너', name: '수분 밸런싱 모공 케어 토너', desc: '이마/코 모공 수렴과 양볼 보습을 조화시키는 단계', usage: '화장솜으로 T존은 가볍게 닦고, U존은 톡톡 두드려 흡수시킵니다.', good: ['위치하젤추출물', '히알루론산'], bad: ['고농도 에탄올'] },
      { step: 3, type: '세럼', name: '수분 앰플 & 수딩 세럼', desc: '유수분 밸런스 균형을 유지해 주는 복합 세럼', usage: '얼굴 전체에 부드럽게 펴 발라 줍니다.', good: ['베타-글루칸', '판테놀'], bad: ['미네랄 오일'] },
      { step: 4, type: '크림', name: '히알루론산 수분 젤 크림', desc: '산뜻함과 촉촉함을 고루 지닌 젤 타입 제형', usage: '양 볼에는 레이어링하여 조금 더 도톰하게 바릅니다.', good: ['소듐하이알루로네이트', '녹차씨추출물'], bad: ['스테아릭애씨드'] },
      { step: 5, type: '선케어', name: '에센셜 데일리 에어리 선 스크린 SPF50+', desc: '얇고 가벼운 밀착감의 수분 차단막', usage: '얼굴 중앙부에서 바깥 방향으로 골고루 펴 바릅니다.', good: ['징크옥사이드', '판테놀'], bad: ['파라벤'] }
    ],
    night: [
      { step: 1, type: '클렌징', name: '마일드 클렌징 밀크 & 버블 폼', desc: 'U존은 촉촉하게 유지하고 T존 유분은 세정하는 약산성 버블 클렌징', usage: '밀크로 롤링 후 물세안 하고, 거품 폼으로 가볍게 마무리합니다.', good: ['글리세린', '올리브오일'], bad: ['이소프로필팔미테이트'] },
      { step: 2, type: '토너', name: '아하(AHA)/바하(BHA) 밸런싱 스킨', desc: 'T존 요철과 U존 각질을 케어하는 밸런싱 스킨', usage: '주 3~4회 저녁, 화장솜에 적셔 부드럽게 닦아줍니다.', good: ['살리실산(BHA)', '글라이콜릭애씨드(AHA)'], bad: ['스크럽 알갱이'] },
      { step: 3, type: '세럼', name: '비타민 펩타이드 밸런스 앰플', desc: '피부 톤 개선과 영양 균형 밸런싱 앰플', usage: '양볼과 이마에 도포 후 가볍게 흡수시킵니다.', good: ['펩타이드', '나이아신아마이드'], bad: [] },
      { step: 4, type: '크림', name: '유수분 밸런싱 하이브리드 수분 크림', desc: 'T존은 번들거림 방지, U존은 밤새 수분 공급', usage: '양 볼 U존 위주로 크림을 바르고, 남은 소량만 T존에 도포합니다.', good: ['스쿠알란', '알란토인'], bad: ['코코넛 야자오일'] }
    ],
    weekly: [
      { step: 1, type: '멀티케어', name: 'T존 클레이 & U존 수분 듀얼 팩', desc: 'T존 모공 흡착과 U존 수분 탄력 멀티 팩', usage: '주 1~2회, 이마/코에는 회색 클레이 팩을, 볼에는 핑크색 수분 팩을 발라 10분 후 세안합니다.', good: ['클레이', '히알루론산'], bad: [] }
    ]
  }
};

ROUTINE_TEMPLATES['중성'] = ROUTINE_TEMPLATES['복합성'];

const CareGuidePage = () => {
  const { survey, fetchSurvey } = useAuthStore();
  const { currentScan } = useScanStore();
  const { weather } = useWeather();

  const [activeTab, setActiveTab] = useState('morning'); // morning, night, weekly
  const [selectedStep, setSelectedStep] = useState(null); // 모달 상세 정보용

  // 피부 타입 알아내기 (1순위: 스캔 결과 예측값, 2순위: 내 피부 설문 결과, 3순위: null)
  const userSkinType = currentScan?.skinType?.replace(' 피부', '')?.replace(' 경향', '') || survey?.skin_type || null;
  const routine = userSkinType ? (ROUTINE_TEMPLATES[userSkinType] || ROUTINE_TEMPLATES['복합성']) : null;

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

        <main className="flex-1 p-4 tablet:p-6 desktop:p-8 pb-24 desktop:pb-8 max-w-5xl">
          {/* 타이틀 및 케어 팁 */}
          <div className="flex flex-col tablet:flex-row items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl font-bold text-text-primary">맞춤 케어 가이드</h1>
              <p className="text-sm text-text-secondary">피부 분석 및 라이프스타일 기반 맞춤 루틴</p>
            </div>
            
            {/* 피부타입 배지 */}
            {userSkinType && (
              <div className="bg-gradient-to-r from-primary-50 to-emerald-50 text-primary-700 px-4 py-2 rounded-xl text-xs font-bold border border-primary-100 flex items-center gap-1.5 shadow-sm">
                <Sparkles size={14} className="text-primary-500 flex-shrink-0" />
                진단 피부 타입: <span className="underline font-extrabold">{userSkinType}</span>
              </div>
            )}
          </div>

          {/* 실시간 날씨 연동 케어팁 카드 (K.3) */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6 flex flex-col tablet:flex-row items-center gap-4">
            <div className="w-12 h-12 bg-primary-50 text-primary-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sun size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-text-primary mb-1 uppercase tracking-wider">오늘의 날씨 맞춤 팁</h4>
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

          {/* 피부 데이터 부재 시 비활성화 안내 카드 */}
          {!userSkinType ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
              <div className="w-16 h-16 bg-primary-50 text-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen size={32} />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">아직 등록된 피부 진단 정보가 없습니다</h3>
              <p className="text-sm text-text-secondary max-w-md mx-auto mb-6 leading-relaxed">
                피부 스캔이나 자가진단 설문을 먼저 진행하시면 내 피부 타입에 최적화된 아침/저녁 맞춤 케어 가이드를 받으실 수 있습니다.
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
          ) : (
            <div className="space-y-6">
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
