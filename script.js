
(function(){
  const STATUS = {
    J: { label: "Ještě ne", color: "var(--status-j)" },
    C: { label: "Částečně", color: "var(--status-c)" },
    T: { label: "Téměř", color: "var(--status-t)" },
    U: { label: "Úplně", color: "var(--status-u)" }
  };
  const AREA_ORDER = window.DIGIRISE_AREAS || [];
  const STORAGE_KEY = "digirise-progress-v4";
  const NOTE_KEYS = ["note","success"];
  const MAIN_ICONS = {
    "udoli-dat":"📊","mesto-modelu":"🗺️","chram-symbolu":"🔣","jeskyne-ukolu":"🪜",
    "roboticka-laborator":"🤖","informacni-citadela":"🏛️","datove-trziste":"🧺",
    "komnata-technomagu":"🪄","sitova-pevnost":"🛡️","plan":"📘"
  };

  function createEmptyArea(area){
    return {
      statuses: area.steps.map(() => ""),
      dates: area.steps.map(() => ""),
      note: "",
      success: ""
    };
  }

  function createDefaultState(){
    const areas = {};
    AREA_ORDER.forEach(area => { areas[area.id] = createEmptyArea(area); });
    return { studentName: "", areas };
  }

  function getState(){
    try{
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if(!parsed) return createDefaultState();
      const base = createDefaultState();
      base.studentName = parsed.studentName || "";
      AREA_ORDER.forEach(area => {
        if(parsed.areas && parsed.areas[area.id]){
          const a = parsed.areas[area.id];
          base.areas[area.id].statuses = area.steps.map((_,i)=> (a.statuses && a.statuses[i]) || "");
          base.areas[area.id].dates = area.steps.map((_,i)=> (a.dates && a.dates[i]) || "");
          base.areas[area.id].note = a.note || "";
          base.areas[area.id].success = a.success || "";
        }
      });
      return base;
    }catch(e){
      return createDefaultState();
    }
  }

  function saveState(state){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function formatDate(){
    return new Date().toLocaleDateString("cs-CZ");
  }

  function setStudentName(value){
    const state = getState();
    state.studentName = value;
    saveState(state);
  }

  function resetArea(areaId){
    const state = getState();
    const area = AREA_ORDER.find(a => a.id === areaId);
    state.areas[areaId] = createEmptyArea(area);
    saveState(state);
  }

  function resetAll(){
    localStorage.removeItem(STORAGE_KEY);
  }

  function getAreaProgress(areaId){
    const state = getState();
    const statuses = state.areas[areaId].statuses;
    return statuses.filter(Boolean).length;
  }

  function getTotalProgress(){
    const state = getState();
    let filled = 0;
    AREA_ORDER.forEach(area => {
      filled += state.areas[area.id].statuses.filter(Boolean).length;
    });
    return filled;
  }

  function countsByStatus(){
    const state = getState();
    const counts = {J:0,C:0,T:0,U:0, empty:0};
    AREA_ORDER.forEach(area => {
      state.areas[area.id].statuses.forEach(status => {
        if(status && counts[status] !== undefined){ counts[status] += 1; }
        else { counts.empty += 1; }
      });
    });
    return counts;
  }

  function recentUpdates(limit){
    const state = getState();
    const items = [];
    AREA_ORDER.forEach(area => {
      const record = state.areas[area.id];
      area.steps.forEach((step, index) => {
        if(record.statuses[index]){
          items.push({
            areaId: area.id,
            areaTitle: area.title,
            step,
            stepIndex: index + 1,
            status: record.statuses[index],
            date: record.dates[index] || ""
          });
        }
      });
    });
    items.sort((a,b) => (b.date || "").localeCompare(a.date || ""));
    return items.slice(0, limit);
  }

  function renderNameFields(){
    const state = getState();
    document.querySelectorAll('[data-student-name]').forEach(input => {
      input.value = state.studentName || "";
      input.addEventListener("input", e => {
        setStudentName(e.target.value);
      });
    });
  }

  function renderMainPage(){
    const cards = document.getElementById("cardsGrid");
    if(!cards) return;
    const total = getTotalProgress();
    const counts = countsByStatus();

    const planCard = `
      <a href="plan-meho-postupu.html" class="card-link">
        <article class="place-card plan-card">
          <div class="bg" style="background: linear-gradient(180deg,#ebf6ff 0%, #dff1ff 55%, #f7fbff 100%);"></div>
          <div class="wash"></div>
          <div class="content">
            <div class="card-top">
              <div class="icon-bubble">${MAIN_ICONS.plan}</div>
              <span class="card-badge">Souhrnná karta</span>
            </div>
            <div>
              <h3>Plán mého postupu</h3>
              <div class="subtitle">Souhrn celé hry</div>
            </div>
            <div class="plan-stats-mini">
              <div class="mini-stat">Vyplněno<br><strong>${total} z 45</strong></div>
              <div class="mini-stat">J: ${counts.J} · Č: ${counts.C}<br><strong>T: ${counts.T} · Ú: ${counts.U}</strong></div>
            </div>
            <div class="card-footer">
              <span class="area-progress">Otevřít</span>
              <span>→</span>
            </div>
          </div>
        </article>
      </a>`;

    const areaCards = AREA_ORDER.map(area => {
      const progress = getAreaProgress(area.id);
      const badge = area.badge ? `<span class="card-badge">${area.badge}</span>` : `<span class="card-badge">Oblast Digiříše</span>`;
      return `
        <a href="${area.file}" class="card-link">
          <article class="place-card">
            <div class="bg" style="background-image:url('assets/${area.image}')"></div>
            <div class="wash"></div>
            <div class="content">
              <div class="card-top">
                <div class="icon-bubble">${MAIN_ICONS[area.id] || "✨"}</div>
                ${badge}
              </div>
              <div>
                <h3>${area.title}</h3>
                <div class="subtitle">${area.subtitle}</div>
              </div>
              <div class="desc">${area.description}</div>
              <div class="card-footer">
                <span class="area-progress">Vyplněno ${progress} z 5</span>
                <span>Otevřít →</span>
              </div>
            </div>
          </article>
        </a>`;
    }).join("");

    cards.innerHTML = planCard + areaCards;

    const totalEl = document.getElementById("mainTotalProgress");
    if(totalEl) totalEl.textContent = `${total} z 45`;
  }

  function createLegendRow(){
    return `
      <div class="legend-row">
        ${["J","C","T","U"].map(key => `
          <div class="legend-chip"><span class="legend-dot" style="background:${STATUS[key].color}"></span>${key} = ${STATUS[key].label}</div>
        `).join("")}
      </div>`;
  }

  function renderAreaPage(){
    const page = document.body.dataset.page;
    if(page !== "area") return;
    const areaId = document.body.dataset.area;
    const area = AREA_ORDER.find(a => a.id === areaId);
    if(!area) return;
    const state = getState();
    const areaState = state.areas[areaId];
    const titleEl = document.getElementById("areaPageTitle");
    const heroTitle = document.getElementById("heroTitle");
    const heroDesc = document.getElementById("heroDesc");
    const heroVisual = document.getElementById("heroVisual");
    if(titleEl) titleEl.textContent = area.title;
    if(heroTitle) heroTitle.textContent = area.title;
    if(heroDesc) heroDesc.textContent = area.description;
    if(heroVisual) heroVisual.style.backgroundImage = `url('assets/${area.image}')`;
    const miniProgress = document.getElementById("areaProgress");
    if(miniProgress) miniProgress.textContent = `${areaState.statuses.filter(Boolean).length} z 5`;
    const legendTarget = document.getElementById("legendTarget");
    if(legendTarget) legendTarget.innerHTML = createLegendRow();

    const stepsTarget = document.getElementById("stepsTarget");
    if(stepsTarget){
      stepsTarget.innerHTML = area.steps.map((step, index) => `
        <article class="step-card">
          <div class="step-num">${index + 1}</div>
          <div class="step-text">
            <strong>${step}</strong>
            <div class="step-date">Datum zápisu: ${areaState.dates[index] || "—"}</div>
          </div>
          <div class="status-buttons">
            ${["J","C","T","U"].map(status => `
              <button class="status-btn ${areaState.statuses[index] === status ? "active" : ""}" data-status="${status}" data-step-index="${index}" title="${STATUS[status].label}">
                ${status}
              </button>
            `).join("")}
          </div>
        </article>
      `).join("");
      stepsTarget.querySelectorAll(".status-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const stepIndex = Number(btn.dataset.stepIndex);
          const stateNow = getState();
          stateNow.areas[areaId].statuses[stepIndex] = btn.dataset.status;
          stateNow.areas[areaId].dates[stepIndex] = formatDate();
          saveState(stateNow);
          renderAreaPage();
        });
      });
    }

    const note = document.getElementById("areaNote");
    const success = document.getElementById("areaSuccess");
    if(note){
      note.value = areaState.note || "";
      note.addEventListener("input", e => {
        const s = getState();
        s.areas[areaId].note = e.target.value;
        saveState(s);
      });
    }
    if(success){
      success.value = areaState.success || "";
      success.addEventListener("input", e => {
        const s = getState();
        s.areas[areaId].success = e.target.value;
        saveState(s);
      });
    }

    const resetBtn = document.getElementById("resetAreaBtn");
    if(resetBtn){
      resetBtn.onclick = () => {
        if(confirm(`Vymazat postup v oblasti „${area.title}“?`)){
          resetArea(areaId);
          renderAreaPage();
          renderNameFields();
        }
      };
    }
  }

  function renderPlanPage(){
    const page = document.body.dataset.page;
    if(page !== "plan") return;
    const planTotals = document.querySelectorAll("[data-plan-total]");
    const counts = countsByStatus();
    const total = getTotalProgress();
    planTotals.forEach(el => el.textContent = `${total} z 45`);
    const overallPct = document.getElementById("overallPct");
    if(overallPct) overallPct.textContent = `${Math.round((total/45)*100)} %`;

    ["J","C","T","U"].forEach(key => {
      const el = document.getElementById(`count-${key}`);
      if(el) el.textContent = counts[key];
    });

    const chart = document.getElementById("chartBars");
    if(chart){
      const max = Math.max(1, counts.J, counts.C, counts.T, counts.U);
      chart.innerHTML = ["J","C","T","U"].map(key => {
        const h = Math.round((counts[key]/max)*100);
        return `
          <div class="chart-col">
            <div class="chart-track">
              <div class="chart-fill" style="height:${h}%; background:${STATUS[key].color};"></div>
            </div>
            <div class="chart-value">${counts[key]}</div>
            <div class="chart-label">${key}</div>
          </div>`;
      }).join("");
    }

    const cells = document.getElementById("planGrid");
    if(cells){
      const state = getState();
      const all = [];
      AREA_ORDER.forEach(area => {
        area.steps.forEach((step, index) => {
          const status = state.areas[area.id].statuses[index];
          const date = state.areas[area.id].dates[index];
          all.push({area, step, index, status, date});
        });
      });
      cells.innerHTML = all.map((item, i) => {
        const cls = item.status ? `status-${item.status}` : "empty";
        const title = `${item.area.title} • ${item.step} • ${item.status ? STATUS[item.status].label : "Nevyplněno"}${item.date ? " • " + item.date : ""}`;
        return `<div class="plan-cell ${cls}" title="${title}">${i+1}</div>`;
      }).join("");
    }

    const areasList = document.getElementById("areasList");
    if(areasList){
      areasList.innerHTML = AREA_ORDER.map(area => {
        const done = getAreaProgress(area.id);
        return `<div class="area-row"><strong>${area.title}</strong><span>${done} z 5</span></div>`;
      }).join("");
    }

    const recent = document.getElementById("recentList");
    if(recent){
      const items = recentUpdates(8);
      recent.innerHTML = items.length ? items.map(item => `
        <div class="recent-item">
          <div><strong>${item.areaTitle}</strong><div class="note">Krok ${item.stepIndex}: ${item.step}</div></div>
          <div>${item.date || "—"}</div>
        </div>
      `).join("") : `<div class="card-hint">Zatím tu nejsou žádné záznamy. Otevři některou kartu a označ svůj postup.</div>`;
    }

    const resetAllBtn = document.getElementById("resetAllBtn");
    if(resetAllBtn){
      resetAllBtn.onclick = () => {
        if(confirm("Vymazat úplně všechno v celé Digiříši?")){
          resetAll();
          location.reload();
        }
      };
    }
  }

  function initCommon(){
    renderNameFields();
    const nameHeadline = document.getElementById("studentNameLabel");
    if(nameHeadline){
      nameHeadline.textContent = getState().studentName || "bez jména";
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    initCommon();
    renderMainPage();
    renderAreaPage();
    renderPlanPage();
  });
})();
