/* global QUESTION_BANK */

const state = {
  audience: "5e",
  selectedId: null,
  selectedAnswer: null,
  visibleQuestions: [],
  progress: JSON.parse(localStorage.getItem("concours-chimie-progress") || "{}"),
};

const elements = {
  audienceButtons: [...document.querySelectorAll("[data-audience]")],
  search: document.querySelector("#search"),
  theme: document.querySelector("#theme-filter"),
  year: document.querySelector("#year-filter"),
  list: document.querySelector("#question-list"),
  resultCount: document.querySelector("#result-count"),
  progressText: document.querySelector("#progress-text"),
  progressBar: document.querySelector("#progress-bar"),
  resetProgress: document.querySelector("#reset-progress"),
  badges: document.querySelector("#badges"),
  title: document.querySelector("#question-title"),
  themeText: document.querySelector("#question-theme"),
  locatorNumber: document.querySelector("#locator-number"),
  locator: document.querySelector(".locator"),
  locatorHelp: document.querySelector("#locator-help"),
  officialTitle: document.querySelector("#official-title"),
  openOfficial: document.querySelector("#open-official"),
  openAnnual: document.querySelector("#open-annual"),
  archive: document.querySelector("#archive-link"),
  answerButtons: [...document.querySelectorAll("[data-answer]")],
  checkAnswer: document.querySelector("#check-answer"),
  feedback: document.querySelector("#feedback"),
  previous: document.querySelector("#previous-question"),
  next: document.querySelector("#next-question"),
  navigator: document.querySelector(".navigator"),
  openNav: document.querySelector("#open-nav"),
  closeNav: document.querySelector("#close-nav"),
  scrim: document.querySelector("#scrim"),
};

const allQuestions = QUESTION_BANK.groups.flatMap((group, groupIndex) =>
  group.questions.map((question) => ({
    ...question,
    id: `${question.year}-Q${question.number}`,
    groupIndex,
    level: group.level,
    uaa: group.uaa,
    theme: group.theme,
    note: group.note,
  })),
);

function audienceQuestions() {
  const levels = state.audience === "5e" ? ["3e", "4e", "5e"] : ["6e"];
  return allQuestions.filter((question) => levels.includes(question.level));
}

function saveProgress() {
  localStorage.setItem("concours-chimie-progress", JSON.stringify(state.progress));
}

function populateFilters() {
  const questions = audienceQuestions();
  const groups = [...new Map(questions.map((question) => [question.groupIndex, question])).values()];
  const previousTheme = elements.theme.value;
  elements.theme.innerHTML = '<option value="all">Tous les thèmes</option>';
  groups.forEach((question) => {
    const option = document.createElement("option");
    option.value = String(question.groupIndex);
    option.textContent = `${question.uaa} · ${question.theme}`;
    elements.theme.append(option);
  });
  if ([...elements.theme.options].some((option) => option.value === previousTheme)) {
    elements.theme.value = previousTheme;
  }

  const previousYear = elements.year.value;
  const years = [...new Set(questions.map((question) => question.year))].sort((a, b) => a - b);
  elements.year.innerHTML = '<option value="all">Toutes</option>';
  years.forEach((year) => {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = year;
    elements.year.append(option);
  });
  if ([...elements.year.options].some((option) => option.value === previousYear)) {
    elements.year.value = previousYear;
  }
}

function filterQuestions() {
  const term = elements.search.value.trim().toLocaleLowerCase("fr");
  state.visibleQuestions = audienceQuestions().filter((question) => {
    const matchesTheme = elements.theme.value === "all" || Number(elements.theme.value) === question.groupIndex;
    const matchesYear = elements.year.value === "all" || Number(elements.year.value) === question.year;
    const haystack = `${question.id} ${question.year} ${question.level} ${question.uaa} ${question.theme} ${question.note}`.toLocaleLowerCase("fr");
    return matchesTheme && matchesYear && (!term || haystack.includes(term));
  });
  renderList();
}

function renderList() {
  elements.list.replaceChildren();
  elements.resultCount.textContent = `${state.visibleQuestions.length} question${state.visibleQuestions.length > 1 ? "s" : ""}`;
  let lastGroup = null;

  state.visibleQuestions.forEach((question) => {
    if (question.groupIndex !== lastGroup) {
      const heading = document.createElement("p");
      heading.className = "question-list__group";
      heading.textContent = `${question.level} · ${question.uaa}`;
      elements.list.append(heading);
      lastGroup = question.groupIndex;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = `question-link${question.id === state.selectedId ? " is-active" : ""}`;
    button.dataset.id = question.id;
    button.innerHTML = `
      <span class="question-link__number">Q${question.number}</span>
      <span class="question-link__theme">${question.year} · ${question.theme}</span>
      <span class="question-link__state" aria-label="${state.progress[question.id] ? "Question corrigée" : ""}">${state.progress[question.id] ? "✓" : ""}</span>
    `;
    button.addEventListener("click", () => selectQuestion(question.id));
    elements.list.append(button);
  });

  if (!state.visibleQuestions.length) {
    const empty = document.createElement("p");
    empty.textContent = "Aucune question ne correspond à ces filtres.";
    empty.className = "result-count";
    elements.list.append(empty);
  }
}

function selectQuestion(id) {
  const question = allQuestions.find((item) => item.id === id);
  if (!question) return;
  state.selectedId = id;
  state.selectedAnswer = null;

  elements.badges.innerHTML = `
    <span class="badge">${question.level} secondaire</span>
    <span class="badge">${question.uaa}</span>
    <span class="badge badge--year">Concours ${question.year}</span>
  `;
  elements.title.textContent = `Question ${question.number} (${question.year})`;
  elements.themeText.textContent = question.theme;
  elements.locatorNumber.textContent = `Q${question.number}`;
  elements.officialTitle.textContent = `Source de chimie ${question.year}`;
  elements.openAnnual.href = question.url;

  if (question.directUrl) {
    elements.locator.classList.remove("is-unavailable");
    elements.openOfficial.href = question.directUrl;
    elements.openOfficial.textContent = question.sourceKind === "pdf-page"
      ? "Voir la question dans le PDF ↗"
      : "Voir la question exacte ↗";
    elements.locatorHelp.textContent = question.sourceKind === "pdf-page"
      ? "Le PDF s’ouvre directement à la page de cette question. Reviens ensuite ici pour répondre."
      : "La question exacte s’ouvre dans un nouvel onglet depuis Google. Reviens ensuite ici pour répondre.";
  } else {
    elements.locator.classList.add("is-unavailable");
    elements.openOfficial.href = question.url;
    elements.openOfficial.textContent = "Voir le questionnaire annuel ↗";
    elements.locatorHelp.textContent = "Cette carte n’est plus proposée séparément dans le formulaire public actuel. Le questionnaire annuel reste accessible.";
  }

  elements.answerButtons.forEach((button) => {
    button.classList.remove("is-selected", "is-correct", "is-wrong");
    button.disabled = false;
  });
  elements.checkAnswer.disabled = true;
  elements.feedback.className = "feedback";
  elements.feedback.textContent = "";

  const index = state.visibleQuestions.findIndex((item) => item.id === id);
  elements.previous.disabled = index <= 0;
  elements.next.disabled = index < 0 || index >= state.visibleQuestions.length - 1;
  renderList();
  closeNavigator();
  document.querySelector("#question-panel").focus({ preventScroll: true });
}

function chooseAnswer(answer) {
  state.selectedAnswer = answer;
  elements.answerButtons.forEach((button) => button.classList.toggle("is-selected", button.dataset.answer === answer));
  elements.checkAnswer.disabled = false;
}

function checkAnswer() {
  const question = allQuestions.find((item) => item.id === state.selectedId);
  if (!question || !state.selectedAnswer) return;
  state.progress[question.id] = { answer: state.selectedAnswer, checkedAt: new Date().toISOString() };
  saveProgress();

  elements.answerButtons.forEach((button) => {
    button.disabled = true;
    button.classList.remove("is-selected");
    if (question.answer !== "—" && button.dataset.answer === question.answer) button.classList.add("is-correct");
    if (question.answer !== "—" && button.dataset.answer === state.selectedAnswer && state.selectedAnswer !== question.answer) button.classList.add("is-wrong");
  });
  elements.checkAnswer.disabled = true;
  elements.feedback.classList.add("is-visible");

  if (question.warning) {
    elements.feedback.classList.add("is-warning");
    elements.feedback.innerHTML = `<strong>Question neutralisée.</strong> ${question.warning}`;
  } else if (state.selectedAnswer === question.answer) {
    elements.feedback.classList.add("is-good");
    elements.feedback.innerHTML = `<strong>Bonne réponse : ${question.answer}.</strong> Note la méthode qui t’a permis de la trouver.`;
  } else {
    elements.feedback.classList.add("is-bad");
    elements.feedback.innerHTML = `<strong>La réponse attendue est ${question.answer}.</strong> Reprends le point de cours « ${question.theme} », puis retente la question plus tard.`;
  }
  updateProgress();
  renderList();
}

function updateProgress() {
  const questions = audienceQuestions();
  const done = questions.filter((question) => state.progress[question.id]).length;
  elements.progressText.textContent = `${done} / ${questions.length} questions corrigées`;
  elements.progressBar.style.width = `${questions.length ? (done / questions.length) * 100 : 0}%`;
}

function moveQuestion(offset) {
  const index = state.visibleQuestions.findIndex((question) => question.id === state.selectedId);
  const target = state.visibleQuestions[index + offset];
  if (target) selectQuestion(target.id);
}

function openNavigator() {
  elements.navigator.classList.add("is-open");
  elements.scrim.classList.add("is-visible");
}

function closeNavigator() {
  elements.navigator.classList.remove("is-open");
  elements.scrim.classList.remove("is-visible");
}

elements.audienceButtons.forEach((button) => button.addEventListener("click", () => {
  state.audience = button.dataset.audience;
  elements.audienceButtons.forEach((item) => item.classList.toggle("is-active", item === button));
  elements.search.value = "";
  elements.theme.value = "all";
  elements.year.value = "all";
  populateFilters();
  filterQuestions();
  updateProgress();
  selectQuestion(state.visibleQuestions[0]?.id);
}));

elements.search.addEventListener("input", filterQuestions);
elements.theme.addEventListener("change", filterQuestions);
elements.year.addEventListener("change", filterQuestions);
elements.answerButtons.forEach((button) => button.addEventListener("click", () => chooseAnswer(button.dataset.answer)));
elements.checkAnswer.addEventListener("click", checkAnswer);
elements.previous.addEventListener("click", () => moveQuestion(-1));
elements.next.addEventListener("click", () => moveQuestion(1));
elements.openNav.addEventListener("click", openNavigator);
elements.closeNav.addEventListener("click", closeNavigator);
elements.scrim.addEventListener("click", closeNavigator);
elements.resetProgress.addEventListener("click", () => {
  if (!window.confirm("Effacer toute la progression enregistrée sur cet appareil ?")) return;
  state.progress = {};
  saveProgress();
  updateProgress();
  renderList();
});

elements.archive.href = QUESTION_BANK.archive;
populateFilters();
filterQuestions();
updateProgress();
selectQuestion(state.visibleQuestions[0].id);
