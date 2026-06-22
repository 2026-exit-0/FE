import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Check, ClipboardList, Pencil } from 'lucide-react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import BottomNav from '../components/common/BottomNav';
import useAuth from '../hooks/useAuth';
import useScanStore from '../store/scanStore';
import { getQuestionnaire, scoreQuestionnaire } from '../api/products';

// ─── 상수 ──────────────────────────────────────────────────
const SKIN_TYPES = [
  { value: '건성', label: '건성', desc: '당기고 건조한 편' },
  { value: '지성', label: '지성', desc: '번들거리고 피지가 많음' },
  { value: '복합성', label: '복합성', desc: 'T존 지성, 나머지 건성' },
  { value: '민감성', label: '민감성', desc: '자극에 쉽게 반응함' },
  { value: '중성', label: '중성', desc: '균형잡힌 피부' },
];

const STEP_LABELS = ['방법 선택', '정보 입력', '완료'];

// ─── 진행 바 ────────────────────────────────────────────────
const StepIndicator = ({ step }) => (
  <div className="flex items-center gap-2 mb-8">
    {STEP_LABELS.map((label, i) => {
      const idx = i + 1;
      const done = step > idx;
      const active = step === idx;
      return (
        <div key={label} className="flex items-center">
          <div className="flex items-center gap-1.5">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              done ? 'bg-primary-500 text-white' :
              active ? 'bg-primary-100 text-primary-600 ring-2 ring-primary-300' :
              'bg-gray-100 text-gray-400'
            }`}>
              {done ? <Check size={12} /> : idx}
            </span>
            <span className={`text-xs font-medium hidden tablet:block ${active ? 'text-primary-600' : 'text-text-secondary'}`}>
              {label}
            </span>
          </div>
          {i < STEP_LABELS.length - 1 && (
            <div className={`w-8 h-px mx-2 ${step > idx ? 'bg-primary-400' : 'bg-gray-200'}`} />
          )}
        </div>
      );
    })}
  </div>
);

// ─── Step 1: 방법 선택 ──────────────────────────────────────
const ChooseMethod = ({ onSelect }) => (
  <div className="animate-fadeIn">
    <h2 className="text-xl font-bold text-text-primary mb-2">본인 피부 정보를 알고 계신가요?</h2>
    <p className="text-sm text-text-secondary mb-8">
      스캔 결과를 더 정확하게 분석하기 위해 피부 정보가 필요해요.
    </p>
    <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4">
      <button
        onClick={() => onSelect('direct')}
        className="group bg-white border-2 border-gray-100 hover:border-primary-400 rounded-2xl p-6 text-left transition-all hover:shadow-md"
      >
        <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
          <Pencil size={22} className="text-primary-500" />
        </div>
        <h3 className="text-base font-bold text-text-primary mb-1">알고 있어요</h3>
        <p className="text-sm text-text-secondary">피부 타입과 민감도를 직접 선택합니다</p>
        <div className="flex items-center gap-1 mt-4 text-primary-500 text-xs font-semibold">
          바로 입력 <ChevronRight size={14} />
        </div>
      </button>

      <button
        onClick={() => onSelect('questionnaire')}
        className="group bg-white border-2 border-gray-100 hover:border-primary-400 rounded-2xl p-6 text-left transition-all hover:shadow-md"
      >
        <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
          <ClipboardList size={22} className="text-purple-500" />
        </div>
        <h3 className="text-base font-bold text-text-primary mb-1">잘 모르겠어요</h3>
        <p className="text-sm text-text-secondary">간단한 질문으로 내 피부 타입을 파악해요</p>
        <div className="flex items-center gap-1 mt-4 text-purple-500 text-xs font-semibold">
          자가진단 시작 <ChevronRight size={14} />
        </div>
      </button>
    </div>
  </div>
);

// ─── Step 2A: 직접 입력 ─────────────────────────────────────
const DirectInput = ({ onBack, onDone }) => {
  const [form, setForm] = useState({
    skin_type: '',
    sensitivity: 3,
    aging_score: 2,
    age: '',
    gender: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.skin_type) return;
    onDone({
      skin_type: form.skin_type,
      sensitivity: form.sensitivity,
      aging_score: form.aging_score,
      age: form.age ? parseInt(form.age) : null,
      gender: form.gender || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fadeIn">
      <h2 className="text-xl font-bold text-text-primary mb-6">피부 정보 입력</h2>

      {/* 피부 타입 */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-text-primary mb-3">
          피부 타입 <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 tablet:grid-cols-3 gap-2">
          {SKIN_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, skin_type: t.value }))}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                form.skin_type === t.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-100 bg-white hover:border-primary-200'
              }`}
            >
              <p className={`text-sm font-bold ${form.skin_type === t.value ? 'text-primary-600' : 'text-text-primary'}`}>
                {t.label}
              </p>
              <p className="text-[11px] text-text-secondary mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>
        {!form.skin_type && (
          <p className="text-xs text-text-secondary mt-1.5">피부 타입을 선택해주세요</p>
        )}
      </div>

      {/* 민감도 */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-text-primary mb-3">
          피부 민감도
          <span className="ml-2 text-primary-500 font-bold">{form.sensitivity}</span>
          <span className="text-xs text-text-secondary font-normal ml-1">(1 낮음 ~ 5 높음)</span>
        </label>
        <input
          type="range" min="1" max="5" value={form.sensitivity}
          onChange={(e) => setForm((f) => ({ ...f, sensitivity: parseInt(e.target.value) }))}
          className="w-full accent-primary-500"
        />
        <div className="flex justify-between text-xs text-text-secondary mt-1">
          <span>거의 민감하지 않음</span>
          <span>매우 민감함</span>
        </div>
      </div>

      {/* 노화 점수 */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-text-primary mb-3">
          주름 / 탄력 상태
          <span className="ml-2 text-primary-500 font-bold">{form.aging_score}</span>
          <span className="text-xs text-text-secondary font-normal ml-1">(1 좋음 ~ 5 관리 필요)</span>
        </label>
        <input
          type="range" min="1" max="5" value={form.aging_score}
          onChange={(e) => setForm((f) => ({ ...f, aging_score: parseInt(e.target.value) }))}
          className="w-full accent-primary-500"
        />
        <div className="flex justify-between text-xs text-text-secondary mt-1">
          <span>탄력 있음</span>
          <span>주름 / 처짐 있음</span>
        </div>
      </div>

      {/* 선택 항목 */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">나이 (선택)</label>
          <input
            type="number" min="10" max="90" placeholder="예: 28"
            value={form.age}
            onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">성별 (선택)</label>
          <select
            value={form.gender}
            onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
            className="input-field"
          >
            <option value="">선택 안 함</option>
            <option value="F">여성</option>
            <option value="M">남성</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-text-secondary hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft size={16} /> 이전
        </button>
        <button type="submit" disabled={!form.skin_type}
          className="flex-1 bg-primary-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          스캔하러 가기 →
        </button>
      </div>
    </form>
  );
};

// ─── Step 2B: 자가진단 ──────────────────────────────────────
const Questionnaire = ({ onBack, onDone }) => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getQuestionnaire().then((data) => {
      setQuestions(data.questions || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const answered = Object.keys(answers).length;
  const total = questions.length;
  const progress = total > 0 ? (answered / total) * 100 : 0;

  const sectionLabel = { skin_type: '피부 타입', sensitivity: '민감도', aging: '노화', lifestyle: '생활습관' };

  const handleSubmit = async () => {
    const unanswered = questions.filter((q) => answers[q.id] === undefined);
    if (unanswered.length > 0) {
      const ok = window.confirm(`${unanswered.length}개 질문에 답변하지 않았어요. 그래도 진행할까요?`);
      if (!ok) return;
    }
    setSubmitting(true);
    try {
      const result = await scoreQuestionnaire(answers);
      onDone({
        skin_type: result.skin_type,
        sensitivity: result.sensitivity,
        aging_score: result.aging_score,
        lifestyle_flags: result.lifestyle_flags,
      });
    } catch (err) {
      alert('채점 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-2 border-primary-300 border-t-primary-500 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-text-secondary">질문지를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-text-primary">자가진단</h2>
        <span className="text-sm text-text-secondary">{answered} / {total}</span>
      </div>

      {/* 진행 바 */}
      <div className="h-1.5 bg-gray-100 rounded-full mb-6 overflow-hidden">
        <div className="h-full bg-primary-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className="space-y-4 mb-6">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-semibold text-text-secondary bg-gray-100 px-2 py-0.5 rounded-full">
                {sectionLabel[q.section] || q.section}
              </span>
              {answers[q.id] !== undefined && (
                <Check size={12} className="text-primary-500" />
              )}
            </div>
            <p className="text-sm font-medium text-text-primary mb-3">
              {idx + 1}. {q.text}
            </p>
            <div className="flex flex-col gap-1.5">
              {q.options.map((opt, oIdx) => (
                <button
                  key={oIdx}
                  type="button"
                  onClick={() => setAnswers((a) => ({ ...a, [q.id]: oIdx }))}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${
                    answers[q.id] === oIdx
                      ? 'border-primary-400 bg-primary-50 text-primary-700 font-medium'
                      : 'border-gray-100 hover:border-primary-200 text-text-secondary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-text-secondary hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft size={16} /> 이전
        </button>
        <button onClick={handleSubmit} disabled={submitting}
          className="flex-1 bg-primary-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
        >
          {submitting ? '분석 중...' : `진단 완료 → 스캔하러 가기`}
        </button>
      </div>
    </div>
  );
};

// ─── SkinCheckPage 메인 ─────────────────────────────────────
const SkinCheckPage = () => {
  const navigate = useNavigate();
  useAuth(true);
  const { setUserInputs } = useScanStore();

  // step: 1 = 방법 선택, 2 = 입력(직접/자가진단), 3 = 완료 후 redirect
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState(null); // 'direct' | 'questionnaire'

  const handleChoose = (chosen) => {
    setMethod(chosen);
    setStep(2);
  };

  const handleDone = (inputs) => {
    setUserInputs(inputs);
    // 완료 후 바로 스캔 페이지로
    navigate('/scan');
  };

  return (
    <div className="min-h-screen bg-background-gray">
      <Header variant="dashboard" />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-4 tablet:p-6 desktop:p-8 pb-24 desktop:pb-8">
          <div className="max-w-2xl mx-auto">
            <StepIndicator step={step} />

            {step === 1 && <ChooseMethod onSelect={handleChoose} />}

            {step === 2 && method === 'direct' && (
              <DirectInput
                onBack={() => setStep(1)}
                onDone={handleDone}
              />
            )}

            {step === 2 && method === 'questionnaire' && (
              <Questionnaire
                onBack={() => setStep(1)}
                onDone={handleDone}
              />
            )}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
};

export default SkinCheckPage;
