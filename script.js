// damda frontend — 단일 페이지 흐름 제어
//
// Step 전환: 1 (선택) → 2A (직접 입력) / 2B (자가진단) → 3 (측정) → 4 (결과)
// 백엔드 API: 기본 /api/* (같은 origin), 다른 host 면 API_BASE 변경

const API_BASE = "";  // 같은 origin (FastAPI 가 /static 서빙). 분리 배포 시 'http://localhost:8000'

// ===== 전역 상태 =====
const state = {
  user_inputs: {},   // {skin_type, sensitivity, aging_score, age, gender, lifestyle_flags}
};

// ===== 유틸: Step 전환 =====
function goToStep(stepId) {
  document.querySelectorAll(".step").forEach((s) => s.classList.remove("active"));
  document.getElementById(stepId).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ===== Step 1: 선택 카드 =====
document.querySelectorAll("[data-target]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.target;
    if (target === "direct") {
      goToStep("step-2-direct");
    } else if (target === "questionnaire") {
      loadQuestionnaire().then(() => goToStep("step-2-questionnaire"));
    }
  });
});

// ===== 이전 버튼 =====
document.querySelectorAll("[data-back]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const back = btn.dataset.back;
    if (back === "1") goToStep("step-1");
  });
});

// ===== Range slider 값 실시간 표시 =====
document.querySelectorAll('input[type="range"]').forEach((inp) => {
  const display = document.querySelector(`.range-value[data-target="${inp.name}"]`);
  if (display) {
    inp.addEventListener("input", () => {
      display.textContent = inp.value;
    });
  }
});

// ===== Step 2A: 직접 입력 form =====
document.getElementById("direct-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  state.user_inputs = {
    skin_type: fd.get("skin_type"),
    sensitivity: parseInt(fd.get("sensitivity")),
    aging_score: parseInt(fd.get("aging_score")),
    age: fd.get("age") ? parseInt(fd.get("age")) : null,
    gender: fd.get("gender") || null,
  };
  goToStep("step-3");
});

// ===== Step 2B: 자가진단 =====
async function loadQuestionnaire() {
  try {
    const res = await fetch(`${API_BASE}/api/questionnaire`);
    const data = await res.json();
    renderQuestionnaire(data.questions);
  } catch (err) {
    alert("질문지 로드 실패: " + err.message);
  }
}

function renderQuestionnaire(questions) {
  const container = document.getElementById("questionnaire-list");
  container.innerHTML = "";
  const sectionLabels = {
    skin_type: "피부 타입",
    sensitivity: "민감도",
    aging: "노화",
    lifestyle: "라이프스타일",
  };
  questions.forEach((q, idx) => {
    const item = document.createElement("div");
    item.className = "q-item";
    item.dataset.qid = q.id;
    item.innerHTML = `
      <div class="q-section">${sectionLabels[q.section] || q.section}</div>
      <div class="q-text">${idx + 1}. ${q.text}</div>
      <div class="q-options">
        ${q.options
          .map(
            (opt, oIdx) => `
            <label class="q-option">
              <input type="radio" name="q-${q.id}" value="${oIdx}" />
              <span>${opt.label}</span>
            </label>`
          )
          .join("")}
      </div>
    `;
    container.appendChild(item);

    // option 클릭 시 progress 업데이트
    item.querySelectorAll('input[type="radio"]').forEach((inp) => {
      inp.addEventListener("change", updateProgress);
    });
  });
  updateProgress();
}

function updateProgress() {
  const items = document.querySelectorAll("#questionnaire-list .q-item");
  const total = items.length;
  let answered = 0;
  items.forEach((it) => {
    if (it.querySelector('input[type="radio"]:checked')) answered++;
  });
  const pct = total > 0 ? (answered / total) * 100 : 0;
  document.querySelector("#questionnaire-progress .progress-fill").style.width = `${pct}%`;
}

document.getElementById("btn-submit-questionnaire").addEventListener("click", async () => {
  // 답변 수집
  const answers = {};
  document.querySelectorAll("#questionnaire-list .q-item").forEach((item) => {
    const qid = item.dataset.qid;
    const checked = item.querySelector('input[type="radio"]:checked');
    if (checked) answers[qid] = parseInt(checked.value);
  });

  // 백엔드에 채점 요청
  try {
    const res = await fetch(`${API_BASE}/api/questionnaire/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    const result = await res.json();

    if (result.incomplete && result.incomplete.length > 0) {
      const proceed = confirm(
        `답변하지 않은 질문이 ${result.incomplete.length}개 있습니다 (${result.incomplete.join(", ")}). 그래도 진행할까요?`
      );
      if (!proceed) return;
    }

    state.user_inputs = {
      skin_type: result.skin_type,
      sensitivity: result.sensitivity,
      aging_score: result.aging_score,
      lifestyle_flags: result.lifestyle_flags,
    };

    goToStep("step-3");
  } catch (err) {
    alert("채점 실패: " + err.message);
  }
});

// ===== Step 3: 측정 form =====
document.getElementById("btn-back-to-step2").addEventListener("click", () => {
  // 직접 입력이었으면 step-2-direct, 자가진단이었으면 step-2-questionnaire
  if (state.user_inputs.lifestyle_flags !== undefined) {
    goToStep("step-2-questionnaire");
  } else {
    goToStep("step-2-direct");
  }
});

document.getElementById("measure-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  goToStep("step-4");
  document.getElementById("loading").style.display = "block";
  document.getElementById("result-content").hidden = true;

  const formEl = e.target;
  const fd = new FormData();
  fd.append("image", formEl.elements.image.files[0]);
  fd.append("region", formEl.elements.region.value);

  // 사용자 입력 추가
  const u = state.user_inputs;
  if (u.skin_type) fd.append("skin_type", u.skin_type);
  if (u.sensitivity != null) fd.append("sensitivity", u.sensitivity);
  if (u.aging_score != null) fd.append("aging_score", u.aging_score);
  if (u.age != null) fd.append("age", u.age);
  if (u.gender) fd.append("gender", u.gender);
  if (u.lifestyle_flags) {
    if (u.lifestyle_flags.sleep) fd.append("sleep_flag", u.lifestyle_flags.sleep);
    if (u.lifestyle_flags.sunscreen) fd.append("sunscreen_flag", u.lifestyle_flags.sunscreen);
  }

  // 센서 값
  const moistureVal = formEl.elements.moisture.value;
  if (moistureVal) fd.append("moisture", moistureVal);
  const illuminanceVal = formEl.elements.illuminance.value;
  if (illuminanceVal) fd.append("illuminance", illuminanceVal);

  try {
    const res = await fetch(`${API_BASE}/api/predict`, {
      method: "POST",
      body: fd,
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`서버 오류 (${res.status}): ${errText}`);
    }
    const result = await res.json();
    renderResult(result);
  } catch (err) {
    document.getElementById("loading").textContent = "분석 실패: " + err.message;
  }
});

// ===== Step 4: 결과 렌더링 =====
function renderResult(result) {
  document.getElementById("loading").style.display = "none";
  document.getElementById("result-content").hidden = false;

  const n = result.narrative;

  // 종합 점수
  document.getElementById("overall-number").textContent = n.overall_score;
  document.getElementById("overall-summary").textContent = n.summary;

  // 세부 측정값
  const metricList = document.getElementById("metric-list");
  metricList.innerHTML = "";
  n.per_metric.forEach((m) => {
    const div = document.createElement("div");
    div.className = `metric-item ${m.rating}`;
    div.innerHTML = `
      <div class="metric-name">${m.name}</div>
      <div class="metric-value">${m.value}</div>
      <div class="metric-rating">${m.rating_text}</div>
    `;
    metricList.appendChild(div);
  });

  // 케어 팁
  const tipsList = document.getElementById("tips-list");
  tipsList.innerHTML = "";
  if (n.tips && n.tips.length > 0) {
    n.tips.forEach((t) => {
      const li = document.createElement("li");
      li.textContent = t;
      tipsList.appendChild(li);
    });
  } else {
    tipsList.innerHTML = "<li>특별한 케어 권장 사항 없음 — 현재 루틴을 유지하세요</li>";
  }

  // 메타 정보
  const meta = result.meta;
  const metaInfo = document.getElementById("meta-info");
  metaInfo.innerHTML = `
    <dt>측정 부위</dt><dd>${meta.region}</dd>
    <dt>모델 epoch</dt><dd>${meta.ckpt_epoch}</dd>
    <dt>센서 입력</dt><dd>${meta.sensor_inputs_used.length > 0 ? meta.sensor_inputs_used.join(", ") : "없음"}</dd>
  `;
}

// ===== 처음으로 =====
document.getElementById("btn-restart").addEventListener("click", () => {
  state.user_inputs = {};
  document.getElementById("direct-form").reset();
  document.getElementById("measure-form").reset();
  document.querySelectorAll('input[type="radio"]').forEach((r) => (r.checked = false));
  goToStep("step-1");
});
