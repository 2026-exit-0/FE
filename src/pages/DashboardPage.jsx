import { Link } from 'react-router-dom';
import {
  Scan, BarChart3, ShoppingBag, BookOpen,
  Thermometer, Droplets, Sun, ArrowRight,
  Wifi, WifiOff,
} from 'lucide-react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import BottomNav from '../components/common/BottomNav';
import useAuth from '../hooks/useAuth';
import useWeather from '../hooks/useWeather';
import { UV_LEVELS } from '../utils/constants';

const DashboardPage = () => {
  const { user } = useAuth(true);
  const { weather } = useWeather();

  const hasScanData = user?.scanCount > 0;
  const uvInfo = UV_LEVELS[weather?.uv] || UV_LEVELS.moderate;

  const quickAccess = [
    {
      icon: Scan,
      title: '정밀 피부 스캔',
      desc: '수분·유분·모공·탄력을 한 번에 측정',
      path: '/scan',
      color: 'text-primary-500',
      bg: 'bg-primary-50',
    },
    {
      icon: BarChart3,
      title: '시계열 분석',
      desc: '측정 데이터를 통한 피부 변화 추적',
      path: '/analysis',
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      icon: ShoppingBag,
      title: '제품 추천',
      desc: '내 피부 궁합에 맞는 화장품 추천',
      path: '/products',
      color: 'text-rose-500',
      bg: 'bg-rose-50',
    },
    {
      icon: BookOpen,
      title: '케어 루틴 제안',
      desc: '환경 데이터 연동 맞춤 스킨케어',
      path: '#',
      color: 'text-amber-500',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="min-h-screen bg-background-gray">
      <Header variant="dashboard" />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-4 tablet:p-6 desktop:p-8 pb-24 desktop:pb-8 max-w-5xl">
          {/* Welcome Card */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-400 rounded-2xl p-6 tablet:p-8 mb-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="flex flex-col tablet:flex-row tablet:items-center justify-between gap-4">
              <div>
                <p className="text-primary-100 text-sm mb-1">담다에 오신 걸 환영해요!</p>
                <h1 className="text-2xl font-bold mb-2">
                  {user?.nickname || '사용자'}님, 안녕하세요
                </h1>
                <p className="text-primary-100 text-sm">
                  {hasScanData
                    ? 'AI가 내 피부를 정밀하게 분석해드릴게요.'
                    : '첫 피부 스캔을 시작해보세요.\nAI가 내 피부를 정밀하게 분석해드릴게요.'}
                </p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center min-w-[120px]">
                <p className="text-xs text-primary-100 mb-1">첫 스캔까지</p>
                <p className="text-3xl font-bold">1</p>
                <p className="text-xs text-primary-100">단계 남았어요</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 tablet:grid-cols-2 gap-6 mb-6">
            {/* First Scan Card */}
            {!hasScanData && (
              <div className="card flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mb-4">
                  <Scan size={32} className="text-primary-500" />
                </div>
                <h2 className="text-xl font-bold text-text-primary mb-2">첫 피부 스캔하기</h2>
                <p className="text-sm text-text-secondary mb-6">
                  스캐너를 연결하고 피부를 측정하세요
                </p>
                <Link
                  to="/scan"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  스캔 시작하기
                  <ArrowRight size={16} />
                </Link>
              </div>
            )}

            {/* Scanner Status + Environment */}
            <div className="space-y-6">
              {/* Scanner Connection */}
              <div className="card">
                <h3 className="text-sm font-semibold text-text-primary mb-3">스캐너 연결 상태</h3>
                <div className="bg-orange-50 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <WifiOff size={18} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orange-700">스캐너 미연결</p>
                    <p className="text-xs text-orange-500">ESP32 기기를 Wi-Fi에 연결해주세요</p>
                  </div>
                </div>
              </div>

              {/* Environment Info */}
              <div className="card">
                <h3 className="text-sm font-semibold text-text-primary mb-4">오늘의 환경 정보</h3>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3 bg-background-gray rounded-xl">
                    <Thermometer size={18} className="mx-auto text-blue-500 mb-1" />
                    <p className="text-lg font-bold text-text-primary">{weather?.temp || 22}°C</p>
                    <p className="text-[10px] text-text-secondary">기온</p>
                  </div>
                  <div className="text-center p-3 bg-background-gray rounded-xl">
                    <Droplets size={18} className="mx-auto text-blue-400 mb-1" />
                    <p className="text-lg font-bold text-text-primary">{weather?.humidity || 58}%</p>
                    <p className="text-[10px] text-text-secondary">습도</p>
                  </div>
                  <div className={`text-center p-3 rounded-xl ${uvInfo.bg}`}>
                    <Sun size={18} className={`mx-auto ${uvInfo.color} mb-1`} />
                    <p className={`text-lg font-bold ${uvInfo.color}`}>{uvInfo.label}</p>
                    <p className="text-[10px] text-text-secondary">자외선</p>
                  </div>
                </div>
                <div className="bg-primary-50 rounded-xl p-3">
                  <p className="text-xs text-primary-700">
                    🌞 오늘 자외선이 강해요. 스캔 후 선크림 추천 결과를 꼭 확인하세요.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Access */}
          <div className="mb-6">
            <h2 className="text-base font-bold text-text-primary mb-4">담다로 할 수 있는 것</h2>
            <div className="grid grid-cols-2 tablet:grid-cols-4 gap-4">
              {quickAccess.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.title}
                    to={item.path}
                    className="card flex flex-col items-center text-center p-5 hover:border-primary-200 group"
                  >
                    <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <Icon size={22} className={item.color} />
                    </div>
                    <h3 className="text-sm font-semibold text-text-primary mb-1">{item.title}</h3>
                    <p className="text-[11px] text-text-secondary leading-relaxed">{item.desc}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
};

export default DashboardPage;
