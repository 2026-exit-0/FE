import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Mail, Lock, Eye, EyeOff, User, ChevronRight, ChevronLeft,
  Check, AlertCircle,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import Button from '../components/common/Button';
import { SKIN_TYPES, SKIN_CONCERNS, COSMETIC_INTERESTS, AGE_GROUPS } from '../utils/constants';

const SignupPage = () => {
  const navigate = useNavigate();
  const { signup } = useAuthStore();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm({
    mode: 'onChange',
  });

  const password = watch('password');

  const handleNext = async () => {
    const valid = await trigger(['email', 'password', 'confirmPassword']);
    if (valid) {
      setStep(2);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');

    await new Promise((r) => setTimeout(r, 800));

    const { confirmPassword, ...userData } = data;
    const result = await signup(userData);

    if (result.success) {
      setToast(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  // Password strength indicator
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { level: 0, label: '', color: '' };
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-zA-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;

    const levels = [
      { level: 0, label: '', color: '' },
      { level: 1, label: '약함', color: 'bg-red-400' },
      { level: 2, label: '보통', color: 'bg-yellow-400' },
      { level: 3, label: '강함', color: 'bg-green-400' },
      { level: 4, label: '매우 강함', color: 'bg-primary-500' },
    ];
    return levels[strength];
  };

  const pwdStrength = getPasswordStrength(watch('password'));

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-green-50 flex items-center justify-center px-4 py-8">
      {/* Toast */}
      {toast && (
        <div className="toast flex items-center gap-2">
          <Check size={18} />
          회원가입 완료!
        </div>
      )}

      <div className="w-full max-w-md animate-fadeIn">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <span className="w-3 h-3 rounded-full bg-primary-500"></span>
            <span className="text-2xl font-bold text-text-primary">담다</span>
          </Link>
          <p className="text-text-secondary text-sm">회원가입</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
            step === 1 ? 'bg-primary-500 text-white' : 'bg-primary-100 text-primary-600'
          }`}>
            {step > 1 ? <Check size={14} /> : <span>1</span>}
            <span>계정 정보</span>
          </div>
          <div className="w-8 h-px bg-gray-300"></div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
            step === 2 ? 'bg-primary-500 text-white' : 'bg-gray-100 text-text-secondary'
          }`}>
            <span>2</span>
            <span>프로필</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 flex items-center gap-3 animate-fadeIn">
              <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Account */}
            {step === 1 && (
              <div className="space-y-5 animate-fadeIn">
                <h3 className="text-lg font-bold text-text-primary mb-1">계정 정보 입력</h3>
                <p className="text-sm text-text-secondary mb-4">이메일과 비밀번호를 설정해주세요.</p>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">이메일 *</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      placeholder="email@example.com"
                      className={`input-field pl-11 ${errors.email ? 'border-red-300' : ''}`}
                      {...register('email', {
                        required: '이메일을 입력해주세요.',
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: '올바른 이메일 형식이 아닙니다.',
                        },
                      })}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">비밀번호 *</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="8자 이상, 영문+숫자"
                      className={`input-field pl-11 pr-11 ${errors.password ? 'border-red-300' : ''}`}
                      {...register('password', {
                        required: '비밀번호를 입력해주세요.',
                        minLength: { value: 8, message: '최소 8자 이상이어야 합니다.' },
                        pattern: {
                          value: /^(?=.*[a-zA-Z])(?=.*[0-9])/,
                          message: '영문과 숫자를 모두 포함해야 합니다.',
                        },
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
                  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}

                  {/* Strength bars */}
                  {watch('password') && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex gap-1 flex-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                              i <= pwdStrength.level ? pwdStrength.color : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-text-secondary">{pwdStrength.label}</span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">비밀번호 확인 *</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="비밀번호를 다시 입력하세요"
                      className={`input-field pl-11 pr-11 ${errors.confirmPassword ? 'border-red-300' : ''}`}
                      {...register('confirmPassword', {
                        required: '비밀번호 확인을 입력해주세요.',
                        validate: (value) =>
                          value === password || '비밀번호가 일치하지 않습니다.',
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
                </div>

                <Button
                  type="button"
                  onClick={handleNext}
                  className="w-full text-base"
                >
                  다음
                  <ChevronRight size={18} />
                </Button>
              </div>
            )}

            {/* Step 2: Profile */}
            {step === 2 && (
              <div className="space-y-5 animate-fadeIn">
                <h3 className="text-lg font-bold text-text-primary mb-1">프로필 정보</h3>
                <p className="text-sm text-text-secondary mb-4">선택 사항이지만 더 정확한 분석에 도움됩니다.</p>

                {/* Nickname */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">닉네임 *</label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="닉네임을 입력하세요"
                      className={`input-field pl-11 ${errors.nickname ? 'border-red-300' : ''}`}
                      {...register('nickname', {
                        required: '닉네임을 입력해주세요.',
                      })}
                    />
                  </div>
                  {errors.nickname && <p className="text-xs text-red-500 mt-1">{errors.nickname.message}</p>}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">성별 *</label>
                  <div className="flex gap-3">
                    {['남', '여', '선택 안 함'].map((g) => (
                      <label key={g} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value={g}
                          className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                          {...register('gender', { required: '성별을 선택해주세요.' })}
                        />
                        <span className="text-sm text-text-secondary">{g}</span>
                      </label>
                    ))}
                  </div>
                  {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender.message}</p>}
                </div>

                {/* Age Group */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">연령대 *</label>
                  <select
                    className={`input-field text-sm ${errors.ageGroup ? 'border-red-300' : ''}`}
                    {...register('ageGroup', { required: '연령대를 선택해주세요.' })}
                  >
                    <option value="">선택해주세요</option>
                    {AGE_GROUPS.map((age) => (
                      <option key={age} value={age}>{age}</option>
                    ))}
                  </select>
                  {errors.ageGroup && <p className="text-xs text-red-500 mt-1">{errors.ageGroup.message}</p>}
                </div>

                {/* Skin Type */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">피부 타입 *</label>
                  <div className="flex flex-wrap gap-2">
                    {SKIN_TYPES.map((type) => (
                      <label key={type} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition-colors has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50">
                        <input
                          type="checkbox"
                          value={type}
                          className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500"
                          {...register('skinType', { required: '최소 1개 이상의 피부 타입을 선택해주세요.' })}
                        />
                        <span className="text-sm">{type}</span>
                      </label>
                    ))}
                  </div>
                  {errors.skinType && <p className="text-xs text-red-500 mt-1">{errors.skinType.message}</p>}
                </div>

                {/* Skin Concerns */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">현재 피부 고민</label>
                  <div className="flex flex-wrap gap-2">
                    {SKIN_CONCERNS.map((concern) => (
                      <label key={concern} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition-colors has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50">
                        <input
                          type="checkbox"
                          value={concern}
                          className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500"
                          {...register('skinConcerns')}
                        />
                        <span className="text-sm">{concern}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Cosmetic Interests */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">관심 화장품</label>
                  <div className="flex flex-wrap gap-2">
                    {COSMETIC_INTERESTS.map((item) => (
                      <label key={item} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition-colors has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50">
                        <input
                          type="checkbox"
                          value={item}
                          className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500"
                          {...register('cosmeticInterests')}
                        />
                        <span className="text-sm">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    <ChevronLeft size={18} />
                    이전
                  </Button>
                  <Button
                    type="submit"
                    loading={loading}
                    className="flex-1"
                  >
                    가입 완료
                  </Button>
                </div>
              </div>
            )}
          </form>

          {/* Login Link */}
          <p className="text-center text-sm text-text-secondary mt-6">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="text-primary-500 font-medium hover:text-primary-600 transition-colors">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
