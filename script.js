// damda frontend — 단일 페이지 흐름 제어
//
// Step 전환: 1 (선택) → 2A (직접 입력) / 2B (자가진단) → 3 (측정) → 4 (결과)
// 백엔드 API: 기본 /api/* (같은 origin), 다른 host 면 API_BASE 변경

const API_BASE = "";  // 같은 origin (FastAPI 가 /static 서빙). 분리 배포 시 'http://localhost:8000'

// ===== 전역 상태 =====
const state = {
  user_inputs: {},   // {skin_type, sensitivity, aging_score, age, gender, lifestyle_flags}
  // 추천 재호출 (필터/새로고침) 을 위한 마지막 측정 결과 캐시
  lastMeasurement: null,
  lastWeather: null,
  lastFilters: [],          // 다중 선택 카테고리 배열 (빈 배열 = 전체)
  lastSeed: null,
  // 현재 표시 중인 추천 (모달 열 때 사용)
  currentRecommendations: [],
  // 이미 본 제품 ID 누적 (재추천 시 exclude)
  shownProductIds: new Set(),
};

// ===== 유틸: Step 전환 =====
function goToStep(stepId) {
  document.querySelectorAll(".step").forEach((s) => s.classList.remove("active"));
  document.getElementById(stepId).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Step 3 진입 시 스캐너 상태 자동 체크
  if (stepId === "step-3" && typeof checkScannerStatus === "function") {
    checkScannerStatus();
  }
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

// ----- 사용자 입력 → FormData 헬퍼 -----
function appendUserInputs(fd) {
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
}

// ----- 측정 결과 처리 공통 -----
async function postMeasurement(endpoint, fd, loadingText) {
  goToStep("step-4");
  const loading = document.getElementById("loading");
  loading.style.display = "block";
  loading.textContent = loadingText;
  document.getElementById("result-content").hidden = true;

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { method: "POST", body: fd });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`서버 오류 (${res.status}): ${errText}`);
    }
    const result = await res.json();
    renderResult(result);
  } catch (err) {
    loading.textContent = "측정 실패: " + err.message;
  }
}

// ----- 사진 업로드 path (/api/predict) -----
document.getElementById("measure-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const formEl = e.target;

  const imageFile = formEl.elements.image.files[0];
  if (!imageFile) {
    alert("사진을 업로드하거나 위의 '스캐너로 측정' 버튼을 누르세요");
    return;
  }
  const region = formEl.elements.region.value;
  if (!region) {
    alert("부위를 먼저 선택해주세요");
    return;
  }

  const fd = new FormData();
  fd.append("image", imageFile);
  fd.append("region", region);
  appendUserInputs(fd);

  const moistureVal = formEl.elements.moisture.value;
  if (moistureVal) fd.append("moisture", moistureVal);
  const illuminanceVal = formEl.elements.illuminance.value;
  if (illuminanceVal) fd.append("illuminance", illuminanceVal);

  await postMeasurement("/api/predict", fd, "📷 분석 중...");
});

// ----- 스캐너 측정 path (/api/measure) -----
document.getElementById("btn-scan").addEventListener("click", async () => {
  const region = document.querySelector('select[name="region"]').value;
  if (!region) {
    alert("먼저 부위를 선택해주세요");
    return;
  }

  const fd = new FormData();
  fd.append("region", region);
  appendUserInputs(fd);

  await postMeasurement(
    "/api/measure",
    fd,
    "📡 스캐너 측정 중... (LED 점등 + 사진 + 센서, 약 6초)"
  );
});

// ----- 스캐너 상태 자동 체크 (Step 3 진입 시) -----
async function checkScannerStatus() {
  const dot = document.getElementById("scanner-dot");
  const txt = document.getElementById("scanner-status-text");
  if (!dot || !txt) return;

  dot.className = "status-dot checking";
  txt.textContent = "스캐너 상태 확인 중...";

  try {
    const res = await fetch(`${API_BASE}/api/scanner/health`);
    const data = await res.json();
    if (data.status === "ok") {
      dot.className = "status-dot ok";
      const state = data.esp32_data?.state || "?";
      txt.textContent = `스캐너 연결됨 (상태: ${state})`;
    } else {
      dot.className = "status-dot unreachable";
      txt.textContent = "스캐너 연결 안 됨 — Wi-Fi / 전원 확인 또는 사진 업로드 사용";
    }
  } catch (err) {
    dot.className = "status-dot unreachable";
    txt.textContent = "BE 서버 응답 없음";
  }
}

// ===== Step 4: 결과 렌더링 =====
function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function renderResult(result) {
  document.getElementById("loading").style.display = "none";
  document.getElementById("result-content").hidden = false;

  const n = result.narrative;

  // 종합 점수 + 개인화 적용 배지
  document.getElementById("overall-number").textContent = n.overall_score;
  let summaryHtml = escapeHtml(n.summary);
  if (n.user_context && n.user_context.applied) {
    summaryHtml += `<div class="personalization-badge">사용자 입력 반영됨</div>`;
  }
  document.getElementById("overall-summary").innerHTML = summaryHtml;

  // 세부 측정값 + hover tooltip
  const metricList = document.getElementById("metric-list");
  metricList.innerHTML = "";
  n.per_metric.forEach((m) => {
    const div = document.createElement("div");
    div.className = `metric-item ${m.rating}`;

    let tooltipHtml = "";
    if (m.description || m.personalized_note) {
      const desc = m.description
        ? `<div class="tooltip-desc">${escapeHtml(m.description)}</div>` : "";
      const note = m.personalized_note
        ? `<div class="tooltip-note">💡 ${escapeHtml(m.personalized_note)}</div>` : "";
      tooltipHtml = `<div class="metric-tooltip">${desc}${note}</div>`;
    }

    div.innerHTML = `
      <div class="metric-name">${escapeHtml(m.name)}</div>
      <div class="metric-value">${escapeHtml(m.value)}</div>
      <div class="metric-rating">${escapeHtml(m.rating_text)}</div>
      ${tooltipHtml}
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

  // 추천 제품 — 필터/새로고침 재호출용으로 측정값 캐시
  state.lastMeasurement = {
    ...(result.predictions?.regression || {}),
    ...(result.predictions?.classification || {}),
  };
  state.lastWeather = null;  // TODO: weather 통합되면 result.weather
  state.lastFilters = [];
  state.lastSeed = null;
  state.shownProductIds = new Set();
  resetFilterButtons();
  renderRecommendations(result.recommended_products || []);

  // 메타 정보
  const meta = result.meta;
  const metaInfo = document.getElementById("meta-info");
  metaInfo.innerHTML = `
    <dt>측정 부위</dt><dd>${meta.region}</dd>
    <dt>모델 epoch</dt><dd>${meta.ckpt_epoch}</dd>
    <dt>센서 입력</dt><dd>${meta.sensor_inputs_used.length > 0 ? meta.sensor_inputs_used.join(", ") : "없음"}</dd>
  `;
}

// ===== 추천 제품 렌더링 =====
function renderRecommendations(products) {
  const section = document.getElementById("recommend-section");
  const list = document.getElementById("recommend-list");
  const empty = document.getElementById("recommend-empty");

  // 현재 캐시 (모달용)
  state.currentRecommendations = products || [];

  // 결과 없을 때
  if (!products || products.length === 0) {
    const filtersActive = state.lastFilters && state.lastFilters.length > 0;
    const hasExcludes = state.shownProductIds && state.shownProductIds.size > 0;

    // 필터 적용 중이거나 재추천으로 후보 소진된 경우 → empty 메시지
    if (filtersActive || hasExcludes) {
      section.hidden = false;
      list.innerHTML = "";
      if (empty) {
        empty.hidden = false;
        empty.innerHTML = hasExcludes && !filtersActive
          ? "더 이상 추천할 새로운 제품이 없어요. <a href=\"#\" id=\"reset-recommendations\">처음부터 다시 보기</a>"
          : "해당 카테고리에 맞는 제품이 없어요. 다른 카테고리를 눌러보세요.";
        // 리셋 링크 핸들러
        const resetLink = document.getElementById("reset-recommendations");
        if (resetLink) {
          resetLink.addEventListener("click", (e) => {
            e.preventDefault();
            state.shownProductIds = new Set();
            state.lastSeed = null;
            fetchAndRenderRecommendations({ seed: null, excludeIds: [] });
          });
        }
      }
      return;
    }
    // 정말로 추천할 게 하나도 없을 때만 섹션 숨김
    section.hidden = true;
    if (empty) empty.hidden = true;
    return;
  }
  section.hidden = false;
  if (empty) empty.hidden = true;
  list.innerHTML = "";

  products.forEach((p, idx) => {
    // 본 제품 ID 누적
    if (p.id) state.shownProductIds.add(p.id);

    const card = document.createElement("div");
    card.className = "recommend-card";
    card.dataset.productIndex = idx;
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");

    // 이미지 (없으면 placeholder)
    const imgHtml = p.image_url
      ? `<img class="recommend-image" src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}" onerror="this.outerHTML='<div class=\\'recommend-image placeholder\\'>📦</div>'" />`
      : `<div class="recommend-image placeholder">📦</div>`;

    // 카테고리 배지 + 서브라벨 (성분 chip)
    const catTags = (p.category || [])
      .map((c) => `<span class="recommend-cat-tag">${escapeHtml(c)}</span>`)
      .join("");
    const subLabels = (p.sub_labels || [])
      .map((l) => `<span class="recommend-sub-label">${escapeHtml(l)}</span>`)
      .join("");

    // 메타 (무향, 가격)
    const metaItems = [];
    if (p.fragrance_free) metaItems.push(`<span class="recommend-meta-item">🌿 무향</span>`);
    if (p.price_range && p.price_range !== "?") {
      metaItems.push(`<span class="recommend-meta-item">💰 ${escapeHtml(p.price_range)}</span>`);
    }
    if (p.subcategory && p.subcategory !== "?") {
      metaItems.push(`<span class="recommend-meta-item">📋 ${escapeHtml(p.subcategory)}</span>`);
    }
    const metaHtml = metaItems.length > 0
      ? `<div class="recommend-meta">${metaItems.join("")}</div>`
      : "";

    // 주성분
    const ingHtml = p.main_ingredients && p.main_ingredients.length > 0
      ? `<div class="recommend-ingredients">${p.main_ingredients.slice(0, 3).map(escapeHtml).join(", ")}</div>`
      : "";

    // 효과 문장 ("이 제품으로 ~ 효과를 기대할 수 있어요")
    const effectHtml = p.effect
      ? `<div class="recommend-effect">${escapeHtml(p.effect)}</div>`
      : "";

    // 주의 사항 배지 (위험도별 색상)
    const warningsHtml = (p.warnings && p.warnings.length > 0)
      ? `<div class="recommend-warnings">
           <span class="recommend-warnings-label">주의</span>
           ${p.warnings.map((w) =>
             `<span class="recommend-warning recommend-warning-${escapeHtml(w.level || "low")}">${escapeHtml(w.label)}</span>`
           ).join("")}
         </div>`
      : "";

    // 구매처 버튼 (카드 클릭과 분리)
    const buyBtnHtml = p.purchase_url
      ? `<a class="recommend-buy-btn" href="${escapeHtml(p.purchase_url)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">구매처 보기 →</a>`
      : "";

    card.innerHTML = `
      ${imgHtml}
      <div class="recommend-body">
        <div class="recommend-header">
          <div class="recommend-header-text">
            <div class="recommend-brand">${escapeHtml(p.brand || "")}</div>
            <div class="recommend-name">${escapeHtml(p.name || "")}</div>
            <div class="recommend-categories">${catTags}${subLabels}</div>
          </div>
          <div class="recommend-score">${p.score ? p.score.toFixed(1) : "0"}점</div>
        </div>
        ${effectHtml}
        <div class="recommend-reason">${escapeHtml(p.reason || "범용 케어")}</div>
        ${ingHtml}
        ${metaHtml}
        ${warningsHtml}
        ${buyBtnHtml}
      </div>
    `;

    // 카드 클릭 → 상세 모달
    card.addEventListener("click", () => openProductModal(idx));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openProductModal(idx);
      }
    });

    list.appendChild(card);
  });
}

// ===== 추천 재호출 (필터/새로고침) =====
async function fetchAndRenderRecommendations(opts = {}) {
  if (!state.lastMeasurement) {
    console.warn("측정 결과가 없습니다 — 추천 재호출 불가");
    return;
  }
  const list = document.getElementById("recommend-list");
  list.style.opacity = "0.4";

  try {
    const filters = opts.filters !== undefined ? opts.filters : state.lastFilters;
    const seed = opts.seed !== undefined ? opts.seed : state.lastSeed;
    const excludeIds = opts.excludeIds !== undefined ? opts.excludeIds : null;

    const body = {
      measurement: state.lastMeasurement,
      user_inputs: state.user_inputs,
      weather: state.lastWeather,
      top_k: 5,
    };
    if (filters && filters.length > 0) body.filter_categories = filters;
    if (seed != null) body.seed = seed;
    if (excludeIds && excludeIds.length > 0) body.exclude_ids = excludeIds;

    const resp = await fetch(`${API_BASE}/api/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!resp.ok) throw new Error(`API ${resp.status}`);
    const data = await resp.json();

    state.lastFilters = filters || [];
    state.lastSeed = seed ?? null;
    renderRecommendations(data.recommended_products || []);
  } catch (e) {
    console.error("추천 재호출 실패:", e);
  } finally {
    list.style.opacity = "1";
  }
}

// ===== 필터 버튼 — 다중 선택 가능 =====
function resetFilterButtons() {
  document.querySelectorAll(".filter-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.filter === "");
  });
}

document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const f = btn.dataset.filter;
    if (f === "") {
      // "전체" — 모든 필터 해제
      document.querySelectorAll(".filter-btn").forEach((b) => {
        b.classList.toggle("active", b.dataset.filter === "");
      });
      state.shownProductIds = new Set();
      fetchAndRenderRecommendations({ filters: [], seed: null });
      return;
    }
    // 개별 카테고리 토글
    btn.classList.toggle("active");
    document.querySelector('.filter-btn[data-filter=""]')?.classList.remove("active");

    const activeFilters = Array.from(document.querySelectorAll(".filter-btn.active"))
      .map((b) => b.dataset.filter)
      .filter((f) => f);

    // 다 끄면 "전체" 활성
    if (activeFilters.length === 0) {
      document.querySelector('.filter-btn[data-filter=""]')?.classList.add("active");
    }

    state.shownProductIds = new Set();
    fetchAndRenderRecommendations({ filters: activeFilters, seed: null });
  });
});

// ===== 새로고침 — 이전 추천 제외하고 다음 풀에서 =====
document.getElementById("btn-refresh-recommend")?.addEventListener("click", () => {
  const excludeIds = Array.from(state.shownProductIds);
  const newSeed = Math.floor(Math.random() * 100000);
  fetchAndRenderRecommendations({ seed: newSeed, excludeIds });
});

// ===== 제품 상세 모달 =====
function openProductModal(idx) {
  const p = state.currentRecommendations[idx];
  if (!p) return;
  const modal = document.getElementById("product-modal");

  // 이미지
  const img = document.getElementById("modal-image");
  if (p.image_url) {
    img.src = p.image_url;
    img.alt = p.name || "";
    img.style.display = "";
    img.onerror = () => { img.style.display = "none"; };
  } else {
    img.style.display = "none";
  }

  // 헤더
  document.getElementById("modal-brand").textContent = p.brand || "";
  document.getElementById("modal-name").textContent = p.name || "";
  document.getElementById("modal-score").textContent = `${p.score ? p.score.toFixed(1) : "0"}점`;

  // 카테고리 + 서브라벨
  const catsEl = document.getElementById("modal-categories");
  const catHtml = (p.category || [])
    .map((c) => `<span class="recommend-cat-tag">${escapeHtml(c)}</span>`)
    .join("");
  const subHtml = (p.sub_labels || [])
    .map((l) => `<span class="recommend-sub-label">${escapeHtml(l)}</span>`)
    .join("");
  catsEl.innerHTML = catHtml + subHtml;

  // 효과 / 추천 이유
  document.getElementById("modal-effect").textContent = p.effect || "";
  document.getElementById("modal-reason").textContent = p.reason || "범용 케어";

  // 주의 사항
  const warnSection = document.getElementById("modal-warnings-section");
  const warnEl = document.getElementById("modal-warnings");
  if (p.warnings && p.warnings.length > 0) {
    warnSection.hidden = false;
    warnEl.innerHTML = p.warnings.map((w) =>
      `<span class="recommend-warning recommend-warning-${escapeHtml(w.level || "low")}">${escapeHtml(w.label)}</span>`
    ).join("");
  } else {
    warnSection.hidden = true;
  }

  // 전성분
  const ingEl = document.getElementById("modal-ingredients");
  const ings = p.all_ingredients && p.all_ingredients.length > 0
    ? p.all_ingredients
    : (p.main_ingredients || []);
  ingEl.innerHTML = ings.length > 0
    ? ings.map((i) => `<li>${escapeHtml(i)}</li>`).join("")
    : "<li class=\"muted\">전성분 정보 없음</li>";

  // 메타
  const metaEl = document.getElementById("modal-meta");
  const metaRows = [];
  if (p.subcategory && p.subcategory !== "?") metaRows.push(["분류", p.subcategory]);
  if (p.for_skin && p.for_skin.length > 0) metaRows.push(["적합 피부", p.for_skin.join(", ")]);
  if (p.fragrance_free) metaRows.push(["향료", "무향"]);
  if (p.alcohol_free) metaRows.push(["알코올", "무알코올"]);
  if (p.price_range && p.price_range !== "?") metaRows.push(["가격대", p.price_range]);
  metaEl.innerHTML = metaRows.length > 0
    ? metaRows.map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd>`).join("")
    : "<dt>정보 없음</dt><dd>—</dd>";

  // 구매 링크
  const buyBtn = document.getElementById("modal-buy-btn");
  if (p.purchase_url) {
    buyBtn.href = p.purchase_url;
    buyBtn.style.display = "";
  } else {
    buyBtn.style.display = "none";
  }

  modal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeProductModal() {
  document.getElementById("product-modal").hidden = true;
  document.body.style.overflow = "";
}

document.querySelectorAll("[data-close-modal]").forEach((el) => {
  el.addEventListener("click", closeProductModal);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !document.getElementById("product-modal").hidden) {
    closeProductModal();
  }
});

// ===== 처음으로 =====
document.getElementById("btn-restart").addEventListener("click", () => {
  state.user_inputs = {};
  document.getElementById("direct-form").reset();
  document.getElementById("measure-form").reset();
  document.querySelectorAll('input[type="radio"]').forEach((r) => (r.checked = false));
  goToStep("step-1");
});
