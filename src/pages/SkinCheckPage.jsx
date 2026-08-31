import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Check, ClipboardList, Pencil, Sparkles } from 'lucide-react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import BottomNav from '../components/common/BottomNav';
import useAuth from '../hooks/useAuth';
import useScanStore from '../store/scanStore';
import useAuthStore from '../store/authStore';
import { getQuestionnaire } from '../api/products';

// ─── 상수 ──────────────────────────────────────────────────
const SKIN_TYPES = [
  { value: '건성', label: '건성', desc: '당기고 건조한 편' },
  { value: '지성', label: '지성', desc: '번들거리고 피지가 많음' },
  { value: '복합성', label: '복합성', desc: 'T존 지성, 나머지 건성' },
  { value: '민감성', label: '민감성', desc: '자극에 쉽게 반응함' },
  { value: '중성', label: '중성', desc: '균형잡힌 피부' },
];

const STEP_LABELS = ['진단 방식 선택', '피부 정보 입력', '완료'];

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

// ─── Step 1: 방식 선택 ──────────────────────────────────────
const ChooseMethod = ({ onSelect, existingInfo, onUseExisting }) => (
  <div className="animate-fadeIn">
    <h2 className="text-xl font-bold text-text-primary mb-2">본인 피부 정보를 알고 계신가요?</h2>
    <p className="text-sm text-text-secondary mb-6">
      스캔 결과를 더 정확하게 분석하기 위해 피부 정보가 필요해요.
    </p>

    {/* 이미 피부 정보가 등록된 경우 즉시 스킵 숏컷 카드 */}
    {existingInfo && (
      <div className="bg-gradient-to-r from-emerald-50 to-primary-50 border-2 border-primary-200 rounded-2xl p-5 mb-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-[10px] bg-primary-500 text-white font-bold px-2 py-0.5 rounded-full inline-block mb-1">
            이전 진단 정보 보유
          </span>
          <h3 className="text-base font-bold text-text-primary">
            등록된 피부 타입: <span className="text-primary-600 font-extrabold">{existingInfo.skin_type || '복합성'}</span>
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            이전 피부 설문/스캔 정보를 그대로 사용하여 즉시 스캔할 수 있어요.
          </p>
        </div>
        <button
          onClick={onUseExisting}
          className="w-full sm:w-auto bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow flex items-center justify-center gap-1.5 flex-shrink-0"
        >
          기존 정보로 바로 스캔 <ChevronRight size={14} />
        </button>
      </div>
    )}

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

      <div className="flex gap-3 pt-4 pb-20">
        <button type="button" onClick={onBack}
          className="flex items-center gap-1.5 px-5 py-3 border border-gray-200 bg-white rounded-xl text-sm font-medium text-text-secondary hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ChevronLeft size={16} /> 이전
        </button>
        <button type="submit" disabled={!form.skin_type}
          className="flex-1 bg-primary-500 text-white py-3 rounded-xl text-sm font-bold hover:bg-primary-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
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
      onDone({
        skin_type: '복합성',
        sensitivity: answers['q3'] !== undefined ? answers['q3'] + 1 : 3,
        aging_score: answers['q5'] !== undefined ? answers['q5'] + 1 : 2,
        lifestyle_flags: {
          sleep: answers['q6'] ?? 0,
          sunscreen: answers['q7'] ?? 0,
        },
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-text-secondary">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        질문지를 불러오는 중...
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-text-primary">자가진단 설문</h2>
        <span className="text-xs font-semibold text-primary-600">{answered} / {total} 완료</span>
      </div>

      {/* 진행바 */}
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-6">
        <div className="h-full bg-primary-500 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className="space-y-6 mb-8">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                {sectionLabel[q.section] || q.section}
              </span>
              <span className="text-xs font-medium text-text-secondary">Q{idx + 1}</span>
            </div>
            <p className="text-sm font-bold text-text-primary mb-4">{q.text}</p>

            <div className="space-y-2">
              {q.options.map((opt, oIdx) => (
                <button
                  key={oIdx}
                  type="button"
                  onClick={() => setAnswers((a) => ({ ...a, [q.id]: oIdx }))}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs tablet:text-sm transition-all ${
                    answers[q.id] === oIdx
                      ? 'border-primary-400 bg-primary-50 text-primary-700 font-bold shadow-sm'
                      : 'border-gray-100 bg-white hover:border-primary-200 text-text-secondary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-4 pb-20">
        <button type="button" onClick={onBack}
          className="flex items-center gap-1.5 px-5 py-3 border border-gray-200 bg-white rounded-xl text-sm font-medium text-text-secondary hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ChevronLeft size={16} /> 이전
        </button>
        <button onClick={handleSubmit} disabled={submitting}
          className="flex-1 bg-primary-500 text-white py-3 rounded-xl text-sm font-bold hover:bg-primary-600 transition-colors disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
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
  const { setUserInputs, currentScan } = useScanStore();
  const { survey, saveSurvey, fetchSurvey } = useAuthStore();

  // step: 1 = 방식 선택, 2 = 입력(직접/자가진단), 3 = 완료 후 redirect
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState(null); // 'direct' | 'questionnaire'

  useEffect(() => {
    fetchSurvey();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const existingInfo = (survey?.skin_type ? survey : null) || (currentScan?.skinType ? { skin_type: currentScan.skinType } : null);

  const handleUseExisting = () => {
    if (existingInfo) {
      setUserInputs({ skin_type: existingInfo.skin_type, sensitivity: 3 });
    }
    navigate('/scan');
  };

  const handleChoose = (chosen) => {
    setMethod(chosen);
    setStep(2);
  };

  const handleDone = async (inputs) => {
    setUserInputs(inputs);

    // BE /surveys/me 에 피부 설문 저장 (백그라운드 — 실패해도 스캔은 진행)
    try {
      const surveyPayload = {
        skin_type: inputs.skin_type || '',
        concerns: inputs.concerns || [],
        allergies: inputs.allergies || [],
        preferred_categories: inputs.preferred_categories || [],
        budget: inputs.budget || null,
      };
      await saveSurvey(surveyPayload);
    } catch (e) {
      console.warn('[SkinCheck] survey 저장 실패 (무시):', e.message);
    }

    navigate('/scan');
  };

  return (
    <div className="min-h-screen bg-background-gray">
      <Header variant="dashboard" />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-4 tablet:p-6 desktop:p-8 pb-56 desktop:pb-16 max-w-3xl mx-auto">
          <StepIndicator step={step} />

          {step === 1 && (
            <ChooseMethod
              onSelect={handleChoose}
              existingInfo={existingInfo}
              onUseExisting={handleUseExisting}
            />
          )}

          {step === 2 && method === 'direct' && (
            <DirectInput onBack={() => setStep(1)} onDone={handleDone} />
          )}

          {step === 2 && method === 'questionnaire' && (
            <Questionnaire onBack={() => setStep(1)} onDone={handleDone} />
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
};

export default SkinCheckPage;
