import { Link } from 'react-router-dom';
import { ArrowRight, Cpu, Brain, BarChart3, Clock, Droplets, Wind, Sun } from 'lucide-react';
import Header from '../components/common/Header';
import useWeather from '../hooks/useWeather';

const LandingPage = () => {
  const { weather, loading } = useWeather();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white">
      <div>
        <Header variant="landing" />

        {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 via-green-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 tablet:py-24">
          <div className="flex flex-col desktop:flex-row items-center gap-12 desktop:gap-16">
            {/* Left Content */}
            <div className="flex-1 text-center desktop:text-left animate-fadeIn">
              <span className="badge-green text-sm mb-6 inline-block">
                AI 기반 정밀 피부 분석 솔루션
              </span>
              <h1 className="text-3xl tablet:text-4xl desktop:text-5xl font-bold text-text-primary leading-tight mb-6">
                내 피부를 정확하게
                <br />
                분석하고 관리하세요
              </h1>
              <p className="text-text-secondary text-base tablet:text-lg leading-relaxed mb-8 max-w-lg mx-auto desktop:mx-0">
                IoT 스캐너와 AI 딥러닝 분석으로
                <br />
                수분·유분·모공·색소침착을 정밀하게 측정하고
                <br />
                나만의 스킨케어 루틴을 제안받으세요.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center desktop:justify-start">
                <Link
                  to="/login"
                  className="btn-primary inline-flex items-center justify-center gap-2 text-base"
                >
                  피부 스캔 시작하기
                  <ArrowRight size={18} />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="btn-outline inline-flex items-center justify-center gap-2 text-base cursor-pointer"
                >
                  서비스 알아보기
                </button>
              </div>
            </div>

            {/* Right - Weather Card */}
            <div className="flex-1 w-full max-w-md animate-slideUp" style={{ animationDelay: '0.2s' }}>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-text-primary">
                    오늘의 실시간 날씨
                  </h3>
                  <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                    {weather?.region || '현재 위치'}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {/* Temperature */}
                  <div className="text-center p-3 rounded-2xl bg-blue-50/70 border border-blue-100">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2">
                      <Droplets size={20} />
                    </div>
                    <p className="text-xl font-extrabold text-blue-700">{weather?.temp ?? 22}°C</p>
                    <span className="text-[11px] text-text-secondary font-medium">기온</span>
                  </div>
                  
                  {/* Humidity */}
                  <div className="text-center p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                      <Droplets size={20} />
                    </div>
                    <p className="text-xl font-extrabold text-emerald-700">{weather?.humidity ?? 55}%</p>
                    <span className="text-[11px] text-text-secondary font-medium">습도</span>
                  </div>
                  
                  {/* UV Index */}
                  <div className="text-center p-3 rounded-2xl bg-amber-50/70 border border-amber-100">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-2">
                      <Sun size={20} />
                    </div>
                    <p className="text-base font-extrabold text-amber-700 mt-1">
                      {weather?.uv === 'high' ? '높음' : weather?.uv === 'very-high' ? '매우높음' : '보통'}
                    </p>
                    <span className="text-[11px] text-text-secondary font-medium">자외선</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-primary-50 to-emerald-50 rounded-xl p-4 border border-primary-100/60">
                  <p className="text-xs text-primary-800 leading-relaxed font-medium">
                    ✨ {weather?.advice || '오늘 날씨에 알맞은 피부 보습 케어를 잊지 마세요!'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack & Service Features Section */}
      <section id="features" className="border-t border-gray-100 bg-white py-16 scroll-mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl font-bold text-text-primary mb-2">담다(DAMDA) 핵심 기술 & 서비스</h2>
            <p className="text-xs text-text-secondary">하드웨어 정밀 센서부터 AI 맞춤 솔루션까지 한 번에 경험해보세요.</p>
          </div>

          <div className="grid grid-cols-2 tablet:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-100 transition-colors duration-300">
                <Cpu size={24} className="text-primary-500" />
              </div>
              <h3 className="text-lg font-bold text-primary-600 mb-1">ESP32 IoT</h3>
              <p className="text-xs font-semibold text-text-primary mb-1">정밀 피부 스캐너</p>
              <p className="text-[11px] text-text-secondary">FDC2112 & VEML7700 센서 연동</p>
            </div>
            
            <div className="text-center group">
              <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-100 transition-colors duration-300">
                <Brain size={24} className="text-primary-500" />
              </div>
              <h3 className="text-lg font-bold text-primary-600 mb-1">EfficientNet</h3>
              <p className="text-xs font-semibold text-text-primary mb-1">딥러닝 분석 엔진</p>
              <p className="text-[11px] text-text-secondary">파이토치 AI 모델 기반 정밀 추론</p>
            </div>
            
            <div className="text-center group">
              <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-100 transition-colors duration-300">
                <BarChart3 size={24} className="text-primary-500" />
              </div>
              <h3 className="text-lg font-bold text-primary-600 mb-1">5가지</h3>
              <p className="text-xs font-semibold text-text-primary mb-1">피부 지표 측정</p>
              <p className="text-[11px] text-text-secondary">수분·유분·탄력·모공·색소침착 분석</p>
            </div>
            
            <div className="text-center group">
              <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-100 transition-colors duration-300">
                <Clock size={24} className="text-primary-500" />
              </div>
              <h3 className="text-lg font-bold text-primary-600 mb-1">실시간</h3>
              <p className="text-xs font-semibold text-text-primary mb-1">맞춤 루틴 제안</p>
              <p className="text-[11px] text-text-secondary">위치 날씨 기반 스킨케어 가이드</p>
            </div>
          </div>
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

export default LandingPage;
