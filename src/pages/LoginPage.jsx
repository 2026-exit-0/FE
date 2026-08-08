import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';
import Button from '../components/common/Button';
import { isMock } from '../api/client';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');

    const result = await login(data.email, data.password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-green-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fadeIn">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <span className="w-3 h-3 rounded-full bg-primary-500"></span>
            <span className="text-2xl font-bold text-text-primary">담다</span>
          </Link>
          {isMock && (
            <p className="text-[11px] text-amber-600 bg-amber-50 px-3 py-1 rounded-full mt-1">개발 모드 — 회원가입 후 로그인 가능</p>
          )}
          <p className="text-text-secondary text-sm">AI 기반 피부 분석 서비스</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-text-primary mb-6 text-center">로그인</h2>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 flex items-center gap-3 animate-fadeIn">
              <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">이메일</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  placeholder="email@example.com"
                  className={`input-field pl-11 ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : ''}`}
                  {...register('email', {
                    required: '이메일을 입력해주세요.',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: '올바른 이메일 형식이 아닙니다.',
                    },
                  })}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">비밀번호</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="비밀번호를 입력하세요"
                  className={`input-field pl-11 pr-11 ${errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : ''}`}
                  {...register('password', {
                    required: '비밀번호를 입력해주세요.',
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500" />
                <span className="text-sm text-text-secondary">로그인 유지</span>
              </label>
              <button type="button" className="text-sm text-text-secondary hover:text-primary-500 transition-colors">
                비밀번호 찾기
              </button>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              loading={loading}
              className="w-full text-base"
            >
              로그인
            </Button>
          </form>

          {/* Social Login */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-4 text-text-secondary">또는</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => {
                  alert('구글 로그인 연동 중: 백엔드 env(GOOGLE_CLIENT_ID) 설정 후 인가 코드를 GET /auth/google로 전달합니다.');
                }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium text-text-primary hover:bg-gray-50 transition-colors shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google로 계속하기
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('카카오 로그인 연동 중: 백엔드 env(KAKAO_CLIENT_ID) 설정 후 인가 코드를 GET /auth/kakao로 전달합니다.');
                }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-yellow-200 bg-[#FEE500] rounded-lg text-sm font-medium text-[#191919] hover:bg-[#FDD835] transition-colors shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#000000">
                  <path d="M12 3C6.48 3 2 6.69 2 11.2c0 2.89 1.92 5.42 4.8 6.86-.21.79-.77 2.87-.89 3.31-.14.55.2.54.42.39.18-.12 2.82-1.92 3.96-2.7.55.08 1.12.14 1.71.14 5.52 0 10-3.69 10-8.2S17.52 3 12 3z"/>
                </svg>
                카카오로 계속하기
              </button>
            </div>
          </div>

          {/* Signup Link */}
          <p className="text-center text-sm text-text-secondary mt-6">
            아직 계정이 없으신가요?{' '}
            <Link to="/signup" className="text-primary-500 font-medium hover:text-primary-600 transition-colors">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
