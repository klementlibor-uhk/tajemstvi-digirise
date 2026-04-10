
const goals = [
  "Vím, co chci zjistit.",
  "Umím získat a zapsat data.",
  "Přečtu data z obrázku a tabulky.",
  "Řeknu, co jsem z dat zjistil/a.",
  "Své rozhodnutí ukážu v datech."
];

const levels = [
  { label: "Ještě ne", short: "J", value: 0 },
  { label: "Částečně", short: "Č", value: 1 },
  { label: "Téměř", short: "T", value: 2 },
  { label: "Úplně", short: "Ú", value: 3 }
];

const STORAGE_KEY = "udoli-dat-demo-v1";

function defaultState() {
  return {
    studentName: "",
    notes: Array(goals.length).fill(""),
    answers: Array(goals.length).fill(null)
  };
}

let state = defaultState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    state = {
      ...defaultState(),
      ...parsed,
      notes: Array.isArray(parsed.notes) ? parsed.notes : Array(goals.length).fill(""),
      answers: Array.isArray(parsed.answers) ? parsed.answers : Array(goals.length).fill(null)
    };
  } catch (e) {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function levelText(totalScore) {
  if (totalScore <= 3) return "Začínám";
  if (totalScore <= 8) return "Učím se";
  if (totalScore <= 12) return "Jde mi to";
  return "Skvělé";
}

function updateProgress() {
  const completedCount = state.answers.filter(v => v !== null).length;
  const totalScore = state.answers.reduce((sum, item) => sum + (item ?? 0), 0);
  const progress = Math.round((completedCount / goals.length) * 100);

  const completed = document.getElementById("completedCount");
  const fill = document.getElementById("progressFill");
  const level = document.getElementById("levelText");
  if (completed) completed.textContent = completedCount;
  if (fill) fill.style.width = progress + "%";
  if (level) level.textContent = levelText(totalScore);
}

function showSavedMessage() {
  const box = document.getElementById("statusBox");
  if (!box) return;
  box.style.display = "block";
  clearTimeout(showSavedMessage.timer);
  showSavedMessage.timer = setTimeout(() => {
    box.style.display = "none";
  }, 1700);
}

function createGoalCard(goal, index) {
  const card = document.createElement("div");
  card.className = "goal-card";

  const head = document.createElement("div");
  head.className = "goal-head";

  const num = document.createElement("div");
  num.className = "goal-number";
  num.textContent = index + 1;

  const text = document.createElement("div");
  text.className = "goal-text";
  text.textContent = goal;

  head.appendChild(num);
  head.appendChild(text);
  card.appendChild(head);

  const ratingGroup = document.createElement("div");
  ratingGroup.className = "rating-group";

  levels.forEach(level => {
    const label = document.createElement("label");
    label.className = "rating";
    if (state.answers[index] === level.value) label.classList.add("active");

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "goal-" + index;
    input.value = String(level.value);
    if (state.answers[index] === level.value) input.checked = true;

    input.addEventListener("change", () => {
      state.answers[index] = level.value;
      renderGoals();
      updateProgress();
    });

    const letter = document.createElement("span");
    letter.className = "letter";
    letter.textContent = level.short;

    const caption = document.createElement("span");
    caption.textContent = level.label;

    label.appendChild(input);
    label.appendChild(letter);
    label.appendChild(caption);
    ratingGroup.appendChild(label);
  });

  card.appendChild(ratingGroup);

  const note = document.createElement("textarea");
  note.className = "note";
  note.placeholder = "Moje poznámka nebo příklad…";
  note.value = state.notes[index] || "";
  note.addEventListener("input", (e) => {
    state.notes[index] = e.target.value;
  });

  card.appendChild(note);
  return card;
}

function renderGoals() {
  const container = document.getElementById("goalsContainer");
  if (!container) return;
  container.innerHTML = "";
  goals.forEach((goal, index) => {
    container.appendChild(createGoalCard(goal, index));
  });
}

function bindTopPanel() {
  const studentName = document.getElementById("studentName");
  if (studentName) {
    studentName.value = state.studentName || "";
    studentName.addEventListener("input", (e) => {
      state.studentName = e.target.value;
    });
  }

  const saveBtn = document.getElementById("saveBtn");
  const resetBtn = document.getElementById("resetBtn");
  const printBtn = document.getElementById("printBtn");

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      saveState();
      showSavedMessage();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      const ok = window.confirm("Opravdu chceš smazat všechen uložený pokrok na této stránce?");
      if (!ok) return;
      state = defaultState();
      localStorage.removeItem(STORAGE_KEY);
      if (studentName) studentName.value = "";
      renderGoals();
      updateProgress();
      const box = document.getElementById("statusBox");
      if (box) box.style.display = "none";
    });
  }

  if (printBtn) {
    printBtn.addEventListener("click", () => {
      window.print();
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("goalsContainer")) return;
  loadState();
  bindTopPanel();
  renderGoals();
  updateProgress();
});
