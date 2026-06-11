/* Grade 10 Mastery Tower
   Firestore leaderboard + progress submission.
   Question bank is loaded from data/questions.js as window.QUESTION_BANK.
*/

// =========================
// FIREBASE CONFIG SECTION
// =========================
  const firebaseConfig = {
    apiKey: "AIzaSyCluy1jxsJ-0CO5jMXJJSsCiNUOQuc_neM",
    authDomain: "grade-10-math-tower-master.firebaseapp.com",
    projectId: "grade-10-math-tower-master",
    storageBucket: "grade-10-math-tower-master.firebasestorage.app",
    messagingSenderId: "638118300460",
    appId: "1:638118300460:web:93a849fa6aeeaf4dbbba89",
    measurementId: "G-HRWGW2SVF1"
  };

let db = null;
let firebaseReady = false;

// One Firestore collection is used for all submitted scores.
// The website will read the same collection in two ways:
// 1. All-Time Leaderboard = best records from all submissions
// 2. Weekly Leaderboard = best records from submissions with the current weekId
const LEADERBOARD_COLLECTION = "leaderboard";

function initializeFirebase() {
  try {
    const hasConfig = firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("PASTE_");
    if (!hasConfig || typeof firebase === "undefined") {
      console.warn("Firebase is not configured yet. The game will run, but Firestore submissions are disabled.");
      return;
    }
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
    firebaseReady = true;
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

initializeFirebase();

// =========================
// GAME CONSTANTS AND STATE
// =========================

const SUBLEVELS_PER_FLOOR = 12;
const HEARTS_PER_FLOOR = 3;
const DEFAULT_TOWER_ID = "bigTower";

const BOW_WEEKS = [
  {
    "termId": "firstTerm",
    "term": "First Term",
    "weekNumber": 1,
    "globalWeek": 1,
    "domain": "Measurement and Geometry",
    "coverage": "Law of Sines and solving oblique triangles",
    "weeks": "Week 1"
  },
  {
    "termId": "firstTerm",
    "term": "First Term",
    "weekNumber": 2,
    "globalWeek": 2,
    "domain": "Measurement and Geometry",
    "coverage": "Law of Cosines and solving oblique triangles",
    "weeks": "Week 2"
  },
  {
    "termId": "firstTerm",
    "term": "First Term",
    "weekNumber": 3,
    "globalWeek": 3,
    "domain": "Measurement and Geometry",
    "coverage": "Cartesian plane and coordinate transformations",
    "weeks": "Week 3"
  },
  {
    "termId": "firstTerm",
    "term": "First Term",
    "weekNumber": 4,
    "globalWeek": 4,
    "domain": "Measurement and Geometry",
    "coverage": "Problem solving with Laws of Sines/Cosines and bearings",
    "weeks": "Week 4"
  },
  {
    "termId": "firstTerm",
    "term": "First Term",
    "weekNumber": 5,
    "globalWeek": 5,
    "domain": "Number and Algebra",
    "coverage": "Quadratic inequalities in one variable and solution notation",
    "weeks": "Week 5"
  },
  {
    "termId": "firstTerm",
    "term": "First Term",
    "weekNumber": 6,
    "globalWeek": 6,
    "domain": "Number and Algebra",
    "coverage": "Quadratic inequalities and interval/set-builder notation",
    "weeks": "Week 6"
  },
  {
    "termId": "firstTerm",
    "term": "First Term",
    "weekNumber": 7,
    "globalWeek": 7,
    "domain": "Number and Algebra",
    "coverage": "Linear/quadratic inequalities in two variables and absolute value equations",
    "weeks": "Week 7"
  },
  {
    "termId": "firstTerm",
    "term": "First Term",
    "weekNumber": 8,
    "globalWeek": 8,
    "domain": "Number and Algebra / Data and Probability",
    "coverage": "Absolute value inequalities and measures of position",
    "weeks": "Week 8"
  },
  {
    "termId": "firstTerm",
    "term": "First Term",
    "weekNumber": 9,
    "globalWeek": 9,
    "domain": "Data and Probability",
    "coverage": "Box-and-whisker plots, cumulative displays, IQR, and outliers",
    "weeks": "Week 9"
  },
  {
    "termId": "firstTerm",
    "term": "First Term",
    "weekNumber": 10,
    "globalWeek": 10,
    "domain": "Data and Probability",
    "coverage": "Percentile rank and interpretation of statistical data",
    "weeks": "Week 10"
  },
  {
    "termId": "secondTerm",
    "term": "Second Term",
    "weekNumber": 1,
    "globalWeek": 11,
    "domain": "Number and Algebra",
    "coverage": "Rational exponents and simplifying radical expressions",
    "weeks": "Week 1"
  },
  {
    "termId": "secondTerm",
    "term": "Second Term",
    "weekNumber": 2,
    "globalWeek": 12,
    "domain": "Number and Algebra",
    "coverage": "Operations on radicals and rationalizing denominators",
    "weeks": "Week 2"
  },
  {
    "termId": "secondTerm",
    "term": "Second Term",
    "weekNumber": 3,
    "globalWeek": 13,
    "domain": "Number and Algebra",
    "coverage": "Discriminant and nature of roots of quadratic equations",
    "weeks": "Week 3"
  },
  {
    "termId": "secondTerm",
    "term": "Second Term",
    "weekNumber": 4,
    "globalWeek": 14,
    "domain": "Number and Algebra",
    "coverage": "Quadratic functions from tables, graphs, and zeros",
    "weeks": "Week 4"
  },
  {
    "termId": "secondTerm",
    "term": "Second Term",
    "weekNumber": 5,
    "globalWeek": 15,
    "domain": "Number and Algebra",
    "coverage": "Problem solving involving quadratic functions",
    "weeks": "Week 5"
  },
  {
    "termId": "secondTerm",
    "term": "Second Term",
    "weekNumber": 6,
    "globalWeek": 16,
    "domain": "Number and Algebra",
    "coverage": "Radical equations and circle equations in center-radius/general form",
    "weeks": "Week 6"
  },
  {
    "termId": "secondTerm",
    "term": "Second Term",
    "weekNumber": 7,
    "globalWeek": 17,
    "domain": "Number and Algebra",
    "coverage": "Center and radius of a circle from equation",
    "weeks": "Week 7"
  },
  {
    "termId": "secondTerm",
    "term": "Second Term",
    "weekNumber": 8,
    "globalWeek": 18,
    "domain": "Number and Algebra",
    "coverage": "Graphing and sketching circles from equations",
    "weeks": "Week 8"
  },
  {
    "termId": "secondTerm",
    "term": "Second Term",
    "weekNumber": 9,
    "globalWeek": 19,
    "domain": "Number and Algebra",
    "coverage": "Equation of a circle from given conditions or diameter endpoints",
    "weeks": "Week 9"
  },
  {
    "termId": "secondTerm",
    "term": "Second Term",
    "weekNumber": 10,
    "globalWeek": 20,
    "domain": "Number and Algebra",
    "coverage": "Geometric figures on the Cartesian plane and coordinate geometry problems",
    "weeks": "Week 10"
  },
  {
    "termId": "thirdTerm",
    "term": "Third Term",
    "weekNumber": 1,
    "globalWeek": 21,
    "domain": "Data and Probability",
    "coverage": "Evaluating statistical reports and mutually exclusive events",
    "weeks": "Week 1"
  },
  {
    "termId": "thirdTerm",
    "term": "Third Term",
    "weekNumber": 2,
    "globalWeek": 22,
    "domain": "Data and Probability",
    "coverage": "Complementary events, union/intersection, and probability rules",
    "weeks": "Week 2"
  },
  {
    "termId": "thirdTerm",
    "term": "Third Term",
    "weekNumber": 3,
    "globalWeek": 23,
    "domain": "Data and Probability / Number and Algebra",
    "coverage": "Dependent/independent events, conditional probability, and interest concepts",
    "weeks": "Week 3"
  },
  {
    "termId": "thirdTerm",
    "term": "Third Term",
    "weekNumber": 4,
    "globalWeek": 24,
    "domain": "Number and Algebra",
    "coverage": "Compound interest by repeated applications of simple interest",
    "weeks": "Week 4"
  },
  {
    "termId": "thirdTerm",
    "term": "Third Term",
    "weekNumber": 5,
    "globalWeek": 25,
    "domain": "Number and Algebra",
    "coverage": "Compound interest and depreciation formulas",
    "weeks": "Week 5"
  },
  {
    "termId": "thirdTerm",
    "term": "Third Term",
    "weekNumber": 6,
    "globalWeek": 26,
    "domain": "Number and Algebra",
    "coverage": "Real-life problems involving compound interest and depreciation",
    "weeks": "Week 6"
  },
  {
    "termId": "thirdTerm",
    "term": "Third Term",
    "weekNumber": 7,
    "globalWeek": 27,
    "domain": "Measurement and Geometry",
    "coverage": "Central angles, inscribed angles, secants, and tangents",
    "weeks": "Week 7"
  },
  {
    "termId": "thirdTerm",
    "term": "Third Term",
    "weekNumber": 8,
    "globalWeek": 28,
    "domain": "Measurement and Geometry",
    "coverage": "Angles and properties of chords, secants, and tangents",
    "weeks": "Week 8"
  },
  {
    "termId": "thirdTerm",
    "term": "Third Term",
    "weekNumber": 9,
    "globalWeek": 29,
    "domain": "Measurement and Geometry",
    "coverage": "Lengths of chords/secants/tangents and sectors/segments",
    "weeks": "Week 9"
  },
  {
    "termId": "thirdTerm",
    "term": "Third Term",
    "weekNumber": 10,
    "globalWeek": 30,
    "domain": "Measurement and Geometry",
    "coverage": "Area of sectors, area of segments, and shaded regions",
    "weeks": "Week 10"
  }
];

const TERM_TOWER_MAP = {
  term1Tower: "firstTerm",
  term2Tower: "secondTerm",
  term3Tower: "thirdTerm"
};

const TERM_NAMES = {
  firstTerm: "First Term",
  secondTerm: "Second Term",
  thirdTerm: "Third Term"
};

function cloneFloorInfo(weekInfo) {
  return {
    termId: weekInfo.termId,
    term: weekInfo.term,
    weekNumber: weekInfo.weekNumber,
    globalWeek: weekInfo.globalWeek,
    domain: weekInfo.domain,
    coverage: weekInfo.coverage,
    weeks: weekInfo.weeks,
    bowLabel: `${weekInfo.term} ${weekInfo.weeks}`
  };
}

function buildGrandFloorScheme() {
  const scheme = {};
  BOW_WEEKS.forEach((weekInfo, index) => {
    scheme[index + 1] = cloneFloorInfo(weekInfo);
  });
  return scheme;
}

function buildTermFloorScheme(termId) {
  const scheme = {};
  BOW_WEEKS
    .filter((weekInfo) => weekInfo.termId === termId)
    .forEach((weekInfo, index) => {
      scheme[index + 1] = cloneFloorInfo(weekInfo);
    });
  return scheme;
}

const TOWER_CONFIG = {
  bigTower: {
    id: "bigTower",
    name: "Grand Mastery Tower",
    shortName: "Grand Tower",
    maxFloors: 30,
    description: "Complete the full 30-week Grade 10 Mathematics BOW.",
    floorScheme: buildGrandFloorScheme()
  },
  term1Tower: {
    id: "term1Tower",
    name: "First Term Trial Tower",
    shortName: "Term 1 Trial Tower",
    maxFloors: 10,
    description: "Focused 10-week challenge for First Term competencies.",
    floorScheme: buildTermFloorScheme("firstTerm")
  },
  term2Tower: {
    id: "term2Tower",
    name: "Second Term Challenge Tower",
    shortName: "Term 2 Challenge Tower",
    maxFloors: 10,
    description: "Focused 10-week challenge for Second Term competencies.",
    floorScheme: buildTermFloorScheme("secondTerm")
  },
  term3Tower: {
    id: "term3Tower",
    name: "Third Term Mastery Tower",
    shortName: "Term 3 Mastery Tower",
    maxFloors: 10,
    description: "Focused 10-week challenge for Third Term competencies.",
    floorScheme: buildTermFloorScheme("thirdTerm")
  }
};

const QUESTIONS_PER_FLOOR_BANK = SUBLEVELS_PER_FLOOR;

let selectedLeaderboardTowerId = DEFAULT_TOWER_ID;
let state = getFreshState();
let practiceState = getFreshPracticeState();

function getFreshState() {
  return {
    player: {
      name: "",
      section: "",
      school: ""
    },
    selectedTowerId: DEFAULT_TOWER_ID,
    currentFloor: 1,
    currentSublevel: 0,
    highestFloor: 1,
    highestSublevel: 0,
    highestScore: 0,
    totalCorrectAnswers: 0,
    heartsRemaining: HEARTS_PER_FLOOR,
    floorMistakes: 0,
    lastMissedQuestion: null,
    status: "Active",
    runId: "",
    startedAt: null,
    timerInterval: null,
    elapsedSeconds: 0,
    currentQuestion: null,
    floorAttemptQuestions: {},
    usedQuestionIdsByFloor: {},
    submittedKeys: new Set()
  };
}

function getFreshPracticeState() {
  return {
    termId: "firstTerm",
    weekNumber: 1,
    weekInfo: null,
    questions: [],
    currentIndex: 0,
    score: 0,
    missed: [],
    answered: false,
    currentQuestion: null
  };
}

const screens = {
  homeScreen: document.getElementById("homeScreen"),
  entryScreen: document.getElementById("entryScreen"),
  practiceSetupScreen: document.getElementById("practiceSetupScreen"),
  practiceScreen: document.getElementById("practiceScreen"),
  practiceResultScreen: document.getElementById("practiceResultScreen"),
  gameScreen: document.getElementById("gameScreen"),
  gameOverScreen: document.getElementById("gameOverScreen"),
  quitScreen: document.getElementById("quitScreen"),
  completeScreen: document.getElementById("completeScreen"),
  leaderboardScreen: document.getElementById("leaderboardScreen"),
  howScreen: document.getElementById("howScreen")
};

const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", () => {
  buildTower("homeTower", 1, { decorative: true, maxFloors: 10 });
  bindEvents();
  validateQuestionBank();
  updateTopbar();
  setBodyScreenClass("homeScreen");
  updateTimerVisibility();
  updatePracticeTopicPreview();
  loadHomepageChampions();
});

function bindEvents() {
  const startBtn = $("startBtn");
  if (startBtn) startBtn.addEventListener("click", () => selectTowerAndShowEntry(DEFAULT_TOWER_ID));

  document.querySelectorAll("[data-start-tower]").forEach((button) => {
    button.addEventListener("click", () => selectTowerAndShowEntry(button.dataset.startTower || DEFAULT_TOWER_ID));
  });

  const leaderboardBtn = $("leaderboardBtn");
  if (leaderboardBtn) {
    leaderboardBtn.addEventListener("click", () => {
      showScreen("leaderboardScreen");
      updateLeaderboardTowerControls();
      loadLeaderboard();
    });
  }

  const leaderboardTowerSelect = $("leaderboardTowerSelect");
  if (leaderboardTowerSelect) {
    leaderboardTowerSelect.value = selectedLeaderboardTowerId;
    leaderboardTowerSelect.addEventListener("change", () => {
      selectedLeaderboardTowerId = leaderboardTowerSelect.value || DEFAULT_TOWER_ID;
      updateLeaderboardTowerControls();
      loadLeaderboard();
    });
  }

  const practiceBtn = $("practiceBtn");
  if (practiceBtn) practiceBtn.addEventListener("click", () => showScreen("practiceSetupScreen"));

  const practiceTermSelect = $("practiceTermSelect");
  if (practiceTermSelect) practiceTermSelect.addEventListener("change", updatePracticeTopicPreview);

  const practiceWeekSelect = $("practiceWeekSelect");
  if (practiceWeekSelect) practiceWeekSelect.addEventListener("change", updatePracticeTopicPreview);

  const startPracticeBtn = $("startPracticeBtn");
  if (startPracticeBtn) startPracticeBtn.addEventListener("click", startPracticeSession);

  const practiceNextBtn = $("practiceNextBtn");
  if (practiceNextBtn) practiceNextBtn.addEventListener("click", goToNextPracticeQuestion);

  const practiceAgainBtn = $("practiceAgainBtn");
  if (practiceAgainBtn) practiceAgainBtn.addEventListener("click", startPracticeSession);

  $("howBtn").addEventListener("click", () => showScreen("howScreen"));
  $("beginRunBtn").addEventListener("click", startRun);
  $("restartBtn").addEventListener("click", restartAfterGameOver);
  $("restartFromQuitBtn").addEventListener("click", restartAfterGameOver);
  $("quitBtn").addEventListener("click", quitRun);

  $("submitProgressBtn").addEventListener("click", () => submitProgress("submitMessage"));
  $("submitGameOverBtn").addEventListener("click", () => submitProgress("gameOverSubmitMessage"));
  $("submitQuitBtn").addEventListener("click", () => submitProgress("quitSubmitMessage"));
  $("submitCompleteBtn").addEventListener("click", () => submitProgress("completeSubmitMessage"));

  document.querySelectorAll("[data-go]").forEach((button) => {
    button.addEventListener("click", () => {
      showScreen(button.dataset.go);
      if (button.dataset.go === "leaderboardScreen") {
        updateLeaderboardTowerControls();
        loadLeaderboard();
      }
    });
  });
}

function selectTowerAndShowEntry(towerId) {
  state.selectedTowerId = TOWER_CONFIG[towerId] ? towerId : DEFAULT_TOWER_ID;
  selectedLeaderboardTowerId = state.selectedTowerId;
  updateSelectedTowerLabels();
  showScreen("entryScreen");
}

function getSelectedTowerConfig() {
  return TOWER_CONFIG[state.selectedTowerId] || TOWER_CONFIG[DEFAULT_TOWER_ID];
}

function getLeaderboardTowerConfig() {
  return TOWER_CONFIG[selectedLeaderboardTowerId] || TOWER_CONFIG[DEFAULT_TOWER_ID];
}

function getTowerMaxFloors(towerId = state.selectedTowerId) {
  return (TOWER_CONFIG[towerId] || TOWER_CONFIG[DEFAULT_TOWER_ID]).maxFloors;
}

function getTowerTotalScore(towerId = state.selectedTowerId) {
  return getTowerMaxFloors(towerId) * SUBLEVELS_PER_FLOOR;
}

function getWeekReferenceForTowerFloor(towerId = state.selectedTowerId, floor = state.currentFloor) {
  const safeTowerId = TOWER_CONFIG[towerId] ? towerId : DEFAULT_TOWER_ID;
  const safeFloor = Math.max(1, Number(floor) || 1);
  const config = TOWER_CONFIG[safeTowerId] || TOWER_CONFIG[DEFAULT_TOWER_ID];
  const floorInfo = config.floorScheme[safeFloor];

  if (floorInfo) {
    return {
      ...floorInfo,
      towerId: safeTowerId,
      towerFloor: safeFloor,
      questionBankKey: `${floorInfo.termId}.week${floorInfo.weekNumber}`
    };
  }

  const fallback = BOW_WEEKS[0];
  return {
    ...fallback,
    towerId: safeTowerId,
    towerFloor: safeFloor,
    questionBankKey: `${fallback.termId}.week${fallback.weekNumber}`
  };
}

function getSharedWeekQuestionBank(termId, weekNumber) {
  if (!window.QUESTION_BANK) return [];
  const termBank = window.QUESTION_BANK[termId] || {};
  return termBank[`week${weekNumber}`] || [];
}

function getQuestionsForTowerFloor(towerId = state.selectedTowerId, floor = state.currentFloor) {
  const weekRef = getWeekReferenceForTowerFloor(towerId, floor);
  return getSharedWeekQuestionBank(weekRef.termId, weekRef.weekNumber);
}

function getTowerQuestionBank(towerId = state.selectedTowerId) {
  const config = TOWER_CONFIG[towerId] || TOWER_CONFIG[DEFAULT_TOWER_ID];
  const bank = {};

  for (let floor = 1; floor <= config.maxFloors; floor++) {
    bank[`floor${floor}`] = getQuestionsForTowerFloor(config.id, floor);
  }

  return bank;
}

function getPracticeWeekInfo(termId, weekNumber) {
  return BOW_WEEKS.find((week) => week.termId === termId && Number(week.weekNumber) === Number(weekNumber)) || BOW_WEEKS[0];
}

function updatePracticeTopicPreview() {
  const termSelect = $("practiceTermSelect");
  const weekSelect = $("practiceWeekSelect");
  if (!termSelect || !weekSelect) return;

  const termId = termSelect.value || "firstTerm";
  const weekNumber = Number(weekSelect.value || 1);
  const weekInfo = getPracticeWeekInfo(termId, weekNumber);

  const weekLabel = $("practiceWeekLabel");
  const topicPreview = $("practiceTopicPreview");

  if (weekLabel) weekLabel.textContent = `${weekInfo.term} - ${weekInfo.weeks}`;
  if (topicPreview) topicPreview.textContent = weekInfo.coverage || "Grade 10 Mathematics";
}

function buildPracticeQuestionSet(weekInfo, questions) {
  const difficultyPlan = [
    ...Array(4).fill("Easy"),
    ...Array(3).fill("Average"),
    ...Array(2).fill("Difficult"),
    "Boss"
  ];

  const selected = [];
  const usedIds = new Set();

  difficultyPlan.forEach((difficulty) => {
    const pool = questions.filter((question) => normalizeDifficulty(question.difficulty) === difficulty);
    let available = pool.filter((question) => !usedIds.has(question.id));

    if (!available.length) {
      available = questions.filter((question) => !usedIds.has(question.id));
    }

    if (!available.length) {
      available = questions;
    }

    const chosen = shuffleArray(available)[0];
    if (chosen?.id) usedIds.add(chosen.id);

    selected.push({
      ...chosen,
      termId: weekInfo.termId,
      term: chosen.term || weekInfo.term,
      weekNumber: weekInfo.weekNumber,
      week: chosen.week || weekInfo.weeks,
      globalWeek: weekInfo.globalWeek,
      domain: chosen.domain || weekInfo.domain,
      topic: chosen.topic || weekInfo.coverage,
      practiceDifficulty: difficulty
    });
  });

  return selected;
}

function startPracticeSession() {
  const termSelect = $("practiceTermSelect");
  const weekSelect = $("practiceWeekSelect");
  const setupMessage = $("practiceSetupMessage");

  if (setupMessage) setupMessage.textContent = "";

  const termId = termSelect?.value || "firstTerm";
  const weekNumber = Number(weekSelect?.value || 1);
  const weekInfo = getPracticeWeekInfo(termId, weekNumber);
  const questions = getSharedWeekQuestionBank(termId, weekNumber);

  if (!Array.isArray(questions) || !questions.length) {
    if (setupMessage) setupMessage.textContent = `No questions found for ${weekInfo.term} ${weekInfo.weeks}. Please check data/questions.js.`;
    return;
  }

  practiceState = {
    ...getFreshPracticeState(),
    termId,
    weekNumber,
    weekInfo,
    questions: buildPracticeQuestionSet(weekInfo, questions)
  };

  showScreen("practiceScreen");
  renderPracticeQuestion();
}

function renderPracticeQuestion() {
  const question = practiceState.questions[practiceState.currentIndex];
  if (!question) {
    showPracticeResult();
    return;
  }

  practiceState.answered = false;
  practiceState.currentQuestion = prepareQuestionForDisplay(question);

  const topicLabel = $("practiceTopicLabel");
  const progressLabel = $("practiceProgressLabel");
  const scoreLabel = $("practiceScoreLabel");
  const questionText = $("practiceQuestionText");
  const choicesBox = $("practiceChoicesBox");
  const feedbackBox = $("practiceFeedbackBox");
  const nextBtn = $("practiceNextBtn");

  if (topicLabel) topicLabel.textContent = `${practiceState.weekInfo.term} • ${practiceState.weekInfo.weeks} • ${practiceState.weekInfo.coverage}`;
  if (progressLabel) progressLabel.textContent = `${practiceState.currentIndex + 1}/10`;
  if (scoreLabel) scoreLabel.textContent = `${practiceState.score}/10`;
  if (questionText) questionText.textContent = practiceState.currentQuestion.question;
  if (feedbackBox) feedbackBox.innerHTML = "";
  if (nextBtn) {
    nextBtn.disabled = true;
    nextBtn.textContent = practiceState.currentIndex === practiceState.questions.length - 1 ? "Show Results" : "Next Question";
  }

  if (!choicesBox) return;
  choicesBox.innerHTML = "";

  const displayChoices = Array.isArray(practiceState.currentQuestion.shuffledChoices)
    ? practiceState.currentQuestion.shuffledChoices
    : [];

  displayChoices.forEach((item, index) => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = `${String.fromCharCode(65 + index)}. ${item.choice}`;
    btn.addEventListener("click", () => checkPracticeAnswer(item.originalIndex, item.choice));
    choicesBox.appendChild(btn);
  });
}

function checkPracticeAnswer(selectedIndex, selectedChoice) {
  if (practiceState.answered || !practiceState.currentQuestion) return;

  practiceState.answered = true;
  const question = practiceState.currentQuestion;
  const isCorrect = Number(selectedIndex) === Number(question.answer);
  const correctChoice = question.choices?.[question.answer] ?? "Not available";

  document.querySelectorAll("#practiceChoicesBox .choice-btn").forEach((button) => {
    button.disabled = true;
  });

  if (isCorrect) {
    practiceState.score += 1;
  } else {
    practiceState.missed.push({
      question: question.question,
      selectedAnswer: selectedChoice || "No answer selected",
      correctAnswer: correctChoice,
      explanation: question.explanation || "No explanation provided."
    });
  }

  const scoreLabel = $("practiceScoreLabel");
  if (scoreLabel) scoreLabel.textContent = `${practiceState.score}/10`;

  const feedbackBox = $("practiceFeedbackBox");
  if (feedbackBox) {
    feedbackBox.innerHTML = `
      <div class="${isCorrect ? "practice-feedback correct" : "practice-feedback incorrect"}">
        <h3>${isCorrect ? "Correct! Great work." : "Good try! Review the solution and continue."}</h3>
        <p><strong>Correct Answer:</strong> ${escapeHtml(correctChoice)}</p>
        <p><strong>Explanation:</strong> ${escapeHtml(question.explanation || "No explanation provided.")}</p>
        <p>${isCorrect ? "Keep going!" : "Mistakes are part of mastery."}</p>
      </div>
    `;
  }

  const nextBtn = $("practiceNextBtn");
  if (nextBtn) nextBtn.disabled = false;
}

function goToNextPracticeQuestion() {
  if (!practiceState.answered) return;

  if (practiceState.currentIndex >= practiceState.questions.length - 1) {
    showPracticeResult();
    return;
  }

  practiceState.currentIndex += 1;
  renderPracticeQuestion();
}

function showPracticeResult() {
  const weekInfo = practiceState.weekInfo || getPracticeWeekInfo(practiceState.termId, practiceState.weekNumber);
  const wrongCount = practiceState.questions.length - practiceState.score;

  const resultTitle = $("practiceResultTitle");
  const resultMessage = $("practiceResultMessage");
  const resultTerm = $("practiceResultTerm");
  const resultWeek = $("practiceResultWeek");
  const resultTopic = $("practiceResultTopic");
  const resultScore = $("practiceResultScore");
  const resultWrong = $("practiceResultWrong");
  const reviewList = $("practiceReviewList");

  if (resultTitle) resultTitle.textContent = `Practice Score: ${practiceState.score}/10`;
  if (resultMessage) {
    if (practiceState.score === 10) {
      resultMessage.textContent = "Excellent! You answered all practice questions correctly.";
    } else if (practiceState.score >= 7) {
      resultMessage.textContent = "Nice work! Review your missed questions, then try again for mastery.";
    } else {
      resultMessage.textContent = "Good effort. Review the solutions and practice again. Mistakes are part of mastery.";
    }
  }

  if (resultTerm) resultTerm.textContent = weekInfo.term;
  if (resultWeek) resultWeek.textContent = weekInfo.weeks;
  if (resultTopic) resultTopic.textContent = weekInfo.coverage || "Grade 10 Mathematics";
  if (resultScore) resultScore.textContent = `${practiceState.score}/10`;
  if (resultWrong) resultWrong.textContent = `${wrongCount}`;

  if (reviewList) {
    if (!practiceState.missed.length) {
      reviewList.innerHTML = `<div class="practice-review-card success-review">Excellent! You answered all practice questions correctly.</div>`;
    } else {
      reviewList.innerHTML = practiceState.missed.map((item, index) => `
        <article class="practice-review-card">
          <h3>Missed Question ${index + 1}</h3>
          <p><strong>Question:</strong> ${escapeHtml(item.question)}</p>
          <p><strong>Your Answer:</strong> ${escapeHtml(item.selectedAnswer)}</p>
          <p><strong>Correct Answer:</strong> ${escapeHtml(item.correctAnswer)}</p>
          <p><strong>Explanation:</strong> ${escapeHtml(item.explanation)}</p>
        </article>
      `).join("");
    }
  }

  showScreen("practiceResultScreen");
}


function getRequiredDifficulty(sublevelIndex = state.currentSublevel) {
  const index = Math.max(0, Number(sublevelIndex) || 0);
  if (index <= 3) return "Easy";
  if (index <= 7) return "Average";
  if (index <= 10) return "Difficult";
  return "Boss";
}

function getDifficultyPlan() {
  return Array.from({ length: SUBLEVELS_PER_FLOOR }, (_, index) => getRequiredDifficulty(index));
}

function normalizeDifficulty(value) {
  const difficulty = String(value || "").trim();
  if (["Easy", "Average", "Difficult", "Boss"].includes(difficulty)) return difficulty;
  if (difficulty.toLowerCase() === "medium") return "Average";
  if (difficulty.toLowerCase() === "hard") return "Difficult";
  return "Easy";
}

function getUsedQuestionMap() {
  if (!state.usedQuestionIdsByFloor) state.usedQuestionIdsByFloor = {};
  if (!state.usedQuestionIdsByFloor.global) state.usedQuestionIdsByFloor.global = {};
  return state.usedQuestionIdsByFloor.global;
}

function markQuestionUsed(question) {
  if (!question || !question.id) return;
  const usedMap = getUsedQuestionMap();
  usedMap[question.id] = true;
}

function hasQuestionBeenUsed(question) {
  if (!question || !question.id) return false;
  const usedMap = getUsedQuestionMap();
  return Boolean(usedMap[question.id]);
}

function updateSelectedTowerLabels() {
  const config = getSelectedTowerConfig();
  const label = $("selectedTowerLabel");
  if (label) label.textContent = `Selected Tower: ${config.name} • ${config.maxFloors} Floors • ${getTowerTotalScore(config.id)} Points`;
  const beginBtn = $("beginRunBtn");
  if (beginBtn) beginBtn.textContent = `Begin ${config.shortName || config.name}`;
}

function updateLeaderboardTowerControls() {
  const config = getLeaderboardTowerConfig();
  const select = $("leaderboardTowerSelect");
  if (select) select.value = config.id;
  const weeklyTitle = $("weeklyLeaderboardTitle");
  const allTimeTitle = $("allTimeLeaderboardTitle");
  const leaderboardContext = $("leaderboardTowerContext");
  if (weeklyTitle) weeklyTitle.textContent = `${config.name} Weekly Leaderboard`;
  if (allTimeTitle) allTimeTitle.textContent = `${config.name} All-Time Leaderboard`;
  if (leaderboardContext) leaderboardContext.textContent = `Showing records for ${config.name} only.`;
}

function showScreen(id) {
  Object.values(screens).forEach((screen) => {
    if (screen) screen.classList.remove("active");
  });
  if (screens[id]) screens[id].classList.add("active");
  setBodyScreenClass(id);
  updateTimerVisibility();
  if (id === "entryScreen") updateSelectedTowerLabels();
  if (id === "practiceSetupScreen") updatePracticeTopicPreview();
  if (id === "leaderboardScreen") {
    updateLeaderboardTowerControls();
    loadHomepageChampions();
  }
  if (id === "homeScreen") loadHomepageChampions();
}

function setBodyScreenClass(id) {
  document.body.classList.toggle("home-active", id === "homeScreen");
  document.body.classList.remove(...Array.from(document.body.classList).filter((className) => className.startsWith("screen-")));
  document.body.classList.add(`screen-${id}`);
}

function startRun() {
  const name = $("playerName").value.trim();
  const section = $("playerSection").value.trim();
  const school = $("playerSchool").value.trim();
  const selectedTowerId = state.selectedTowerId || DEFAULT_TOWER_ID;

  if (!name || !section || !school) {
    $("entryMessage").textContent = "Please enter your name, section, and school before starting.";
    return;
  }

  state = {
    ...getFreshState(),
    selectedTowerId,
    player: { name, section, school },
    status: "Active",
    runId: createRunId(),
    startedAt: Date.now(),
    heartsRemaining: HEARTS_PER_FLOOR,
    floorMistakes: 0,
    totalCorrectAnswers: 0,
    highestScore: 0,
    lastMissedQuestion: null
  };

  resetSubmitMessages();
  startTimer();
  showScreen("gameScreen");
  updateGameDisplay();
  loadNextQuestion();
}

function restartAfterGameOver() {
  const selectedTowerId = state.selectedTowerId || DEFAULT_TOWER_ID;

  state = {
    ...getFreshState(),
    selectedTowerId,
    player: { ...state.player },
    status: "Active",
    runId: createRunId(),
    startedAt: Date.now()
  };

  resetSubmitMessages();
  startTimer();
  showScreen("gameScreen");
  updateGameDisplay();
  loadNextQuestion();
}

function quitRun() {
  const confirmed = window.confirm("Are you sure you want to quit this run? Your current progress will stop here.");
  if (!confirmed) return;

  updateHighestProgress();
  state.status = "Quit";
  state.currentQuestion = null;
  stopTimer();

  const reached = getReachedProgress();
  $("quitFloor").textContent = reached.floor;
  $("quitSublevel").textContent = reached.sublevel;
  $("quitScore").textContent = `${reached.score}/${getTowerTotalScore()}`;
  $("quitTime").textContent = formatTime(state.elapsedSeconds);

  markProgressChanged();
  showScreen("quitScreen");
}

function startTimer() {
  stopTimer();
  state.timerInterval = setInterval(() => {
    state.elapsedSeconds++;
    updateTimerLabels();
  }, 1000);
  updateTimerLabels();
  updateTimerVisibility();
}

function stopTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
  updateTimerVisibility();
}

function updateTimerLabels() {
  const formatted = formatTime(state.elapsedSeconds);
  const topTimer = $("topTimer");
  if (topTimer) topTimer.textContent = `Time: ${formatted}`;
}

function isGameScreenActive() {
  return Boolean(screens.gameScreen && screens.gameScreen.classList.contains("active"));
}

function isRunActivelyAnswering() {
  return state.status === "Active" && Boolean(state.timerInterval) && Boolean(state.currentQuestion);
}

function updateTimerVisibility() {
  const topTimer = $("topTimer");
  const shouldShowTimer = isGameScreenActive() && isRunActivelyAnswering();

  if (topTimer) {
    topTimer.hidden = !shouldShowTimer;
    topTimer.setAttribute("aria-hidden", String(!shouldShowTimer));
  }

  document.body.classList.toggle("run-active", shouldShowTimer);
}

function updateTopbar() {
  const topFloor = $("topFloor");
  const topScore = $("topScore");
  if (topFloor) topFloor.textContent = `Floor ${state.currentFloor}`;
  if (topScore) topScore.textContent = `${getTotalScore()}/${getTowerTotalScore()}`;
  updateTimerLabels();
  updateTimerVisibility();
}

function updateGameDisplay() {
  const score = getTotalScore();
  const currentSublevel = Math.max(0, Math.min(SUBLEVELS_PER_FLOOR, state.currentSublevel));

  const positionLabel = $("positionLabel");
  const sublevelProgressLabel = $("sublevelProgressLabel");

  if (positionLabel) positionLabel.textContent = `${state.currentFloor}`;
  const topFloor = $("topFloor");
  const topScore = $("topScore");
  if (topFloor) topFloor.textContent = `Floor ${state.currentFloor}`;
  if (topScore) topScore.textContent = `${score}/${getTowerTotalScore()}`;
  if (sublevelProgressLabel) sublevelProgressLabel.textContent = `${currentSublevel}/${SUBLEVELS_PER_FLOOR}`;

  renderSublevelDots(currentSublevel);
  updateHeartsDisplay();
}

function getProgressMessage(sublevel) {
  if (sublevel >= SUBLEVELS_PER_FLOOR) return "Floor cleared! Keep climbing!";
  if (sublevel >= 10) return "Almost there!";
  if (sublevel >= 6) return "Great climb!";
  if (sublevel >= 3) return "Keep going!";
  return "Keep climbing!";
}

function renderSublevelDots(filledCount) {
  const container = $("sublevelDots");
  if (!container) return;
  container.innerHTML = "";

  for (let i = 1; i <= SUBLEVELS_PER_FLOOR; i++) {
    const dot = document.createElement("span");
    dot.className = "sublevel-dot";
    if (i <= filledCount) dot.classList.add("filled");
    dot.setAttribute("aria-label", `Sublevel ${i}${i <= filledCount ? " completed" : " remaining"}`);
    container.appendChild(dot);
  }
}

function resetFloorHearts() {
  state.heartsRemaining = HEARTS_PER_FLOOR;
  state.floorMistakes = 0;
}

function getHeartsDisplay() {
  const filled = Math.max(0, Math.min(HEARTS_PER_FLOOR, Number(state.heartsRemaining ?? HEARTS_PER_FLOOR)));
  return "❤️".repeat(filled) + "🤍".repeat(HEARTS_PER_FLOOR - filled);
}

function updateHeartsDisplay() {
  const heartsLabel = $("heartsLabel");
  const heartsHelpText = $("heartsHelpText");
  if (heartsLabel) heartsLabel.textContent = getHeartsDisplay();
  if (heartsHelpText) {
    const remaining = Math.max(0, Number(state.heartsRemaining ?? HEARTS_PER_FLOOR));
    heartsHelpText.textContent = `${remaining}/${HEARTS_PER_FLOOR} hearts left on this floor`;
  }
}

function clearMistakeFeedback() {
  const feedback = $("mistakeFeedback");
  if (feedback) {
    feedback.textContent = "";
    feedback.classList.remove("warning-feedback", "success-feedback");
  }
}

function showMistakeFeedback(question) {
  const feedback = $("mistakeFeedback");
  if (!feedback) return;

  const correctChoice = question?.choices?.[question.answer] ?? "the correct answer";
  feedback.classList.add("warning-feedback");
  feedback.textContent = `Not quite. You lost 1 heart, but you can continue. Correct answer: ${correctChoice}. Mistakes are part of mastery.`;
}

function disableChoiceButtons() {
  document.querySelectorAll("#choicesBox .choice-btn").forEach((button) => {
    button.disabled = true;
  });
}

function shouldContinueCurrentRun(runIdSnapshot) {
  return state.status === "Active" && state.runId === runIdSnapshot && screens.gameScreen?.classList.contains("active");
}

function advanceRunPositionAfterAnswer() {
  const maxFloors = getTowerMaxFloors();

  if (state.currentFloor === maxFloors && state.currentSublevel >= SUBLEVELS_PER_FLOOR) {
    state.currentSublevel = SUBLEVELS_PER_FLOOR;
    state.highestFloor = maxFloors;
    state.highestSublevel = SUBLEVELS_PER_FLOOR;
    state.highestScore = Math.max(Number(state.highestScore || 0), getTotalScore());
    state.status = "Tower Completed";
    state.currentQuestion = null;
    stopTimer();
    showCompletion();
    return "completed";
  }

  if (state.currentSublevel >= SUBLEVELS_PER_FLOOR) {
    state.currentFloor++;
    state.currentSublevel = 0;
    resetFloorHearts();
  }

  return "continue";
}

function showGameOverFromMiss(question) {
  state.status = "Game Over";
  state.currentQuestion = null;
  stopTimer();

  const reached = getReachedProgress();
  $("overFloor").textContent = reached.floor;
  $("overSublevel").textContent = reached.sublevel;
  $("overScore").textContent = `${reached.score}/${getTowerTotalScore()}`;
  $("overTime").textContent = formatTime(state.elapsedSeconds);

  const correctChoice = question?.choices?.[question.answer] ?? "Not available";
  $("correctAnswerLabel").textContent = correctChoice;
  $("explanationLabel").textContent = question?.explanation || "No explanation provided.";

  markProgressChanged();
  showScreen("gameOverScreen");
}


function getTotalScore() {
  return Number(state.totalCorrectAnswers || 0);
}

function getHighestScore() {
  return Number(state.highestScore ?? state.totalCorrectAnswers ?? 0);
}

function getReachedProgress() {
  if (state.status === "Game Over" || state.status === "Quit") {
    return {
      floor: state.highestFloor,
      sublevel: state.highestSublevel,
      score: getHighestScore()
    };
  }

  return {
    floor: state.currentFloor,
    sublevel: state.currentSublevel,
    score: getTotalScore()
  };
}

function validateQuestionBank() {
  if (!window.QUESTION_BANK) {
    console.error("QUESTION_BANK is missing. Make sure data/questions.js loads before script.js.");
    return false;
  }

  const warnings = [];
  const requiredCounts = { Easy: 20, Average: 20, Difficult: 15, Boss: 5 };

  BOW_WEEKS.forEach((weekInfo) => {
    const questions = getSharedWeekQuestionBank(weekInfo.termId, weekInfo.weekNumber);

    if (!Array.isArray(questions) || questions.length === 0) {
      warnings.push(`${weekInfo.term} ${weekInfo.weeks} is missing or empty`);
      return;
    }

    if (questions.length < 60) {
      warnings.push(`${weekInfo.term} ${weekInfo.weeks} should contain 60 questions, but found ${questions.length}`);
    }

    Object.entries(requiredCounts).forEach(([difficulty, expectedCount]) => {
      const count = questions.filter((question) => normalizeDifficulty(question.difficulty) === difficulty).length;
      if (count < expectedCount) {
        warnings.push(`${weekInfo.term} ${weekInfo.weeks} has only ${count} ${difficulty} question(s); expected ${expectedCount}`);
      }
    });

    const missingCompetency = questions.filter((q) => !q.competency).length;
    if (missingCompetency > 0) {
      warnings.push(`${weekInfo.term} ${weekInfo.weeks} contains ${missingCompetency} question(s) without a competency field`);
    }

    const answersNotFirst = questions.filter((q) => Number(q.answer) !== 0).length;
    if (answersNotFirst > 0) {
      warnings.push(`${weekInfo.term} ${weekInfo.weeks} contains ${answersNotFirst} question(s) where answer is not 0`);
    }
  });

  if (warnings.length) {
    console.warn("Shared BOW question bank warnings:", warnings.join("; "));
  }

  return warnings.length === 0;
}

function loadNextQuestion() {
  clearMistakeFeedback();
  const weekRef = getWeekReferenceForTowerFloor(state.selectedTowerId, state.currentFloor);
  const questions = getQuestionsForTowerFloor(state.selectedTowerId, state.currentFloor);
  const floorKey = `floor${state.currentFloor}`;

  if (!Array.isArray(questions) || !questions.length) {
    showQuestionBankError(weekRef);
    return;
  }

  const attemptKey = `${state.selectedTowerId}_${floorKey}_${weekRef.termId}_week${weekRef.weekNumber}`;
  if (!state.floorAttemptQuestions[attemptKey] || state.floorAttemptQuestions[attemptKey].length !== SUBLEVELS_PER_FLOOR) {
    state.floorAttemptQuestions[attemptKey] = buildFloorAttemptQuestions(weekRef, questions);
  }

  const selected = state.floorAttemptQuestions[attemptKey][state.currentSublevel];

  if (!selected) {
    showQuestionBankError(weekRef);
    console.error(`No selected question found for ${weekRef.term} ${weekRef.weeks}, ${floorKey}, sublevel ${state.currentSublevel}.`);
    return;
  }

  state.currentQuestion = prepareQuestionForDisplay(selected);
  renderQuestion(state.currentQuestion);
  updateTimerVisibility();
}

function buildFloorAttemptQuestions(weekRef, questions) {
  const towerConfig = getSelectedTowerConfig();
  const difficultyPlan = getDifficultyPlan();

  return difficultyPlan.map((difficulty, sublevelIndex) => {
    const pool = questions.filter((question) => normalizeDifficulty(question.difficulty) === difficulty);
    let availablePool = pool.filter((question) => !hasQuestionBeenUsed(question));

    if (!availablePool.length) {
      console.warn(`${weekRef.term} ${weekRef.weeks} has no unused ${difficulty} question for sublevel ${sublevelIndex + 1}. Using fallback pool.`);
      availablePool = questions.filter((question) => !hasQuestionBeenUsed(question));
    }

    if (!availablePool.length) {
      console.warn(`${weekRef.term} ${weekRef.weeks} has no unused question available. Reuse may occur.`);
      availablePool = pool.length ? pool : questions;
    }

    const selected = shuffleArray(availablePool)[0];
    markQuestionUsed(selected);

    return {
      ...selected,
      tower: towerConfig.id,
      towerName: towerConfig.name,
      floor: state.currentFloor,
      towerFloor: state.currentFloor,
      termId: weekRef.termId,
      term: weekRef.term,
      weekNumber: weekRef.weekNumber,
      week: weekRef.weeks,
      globalWeek: weekRef.globalWeek,
      domain: selected.domain || weekRef.domain,
      topic: selected.topic || weekRef.coverage,
      floorCoverage: weekRef.coverage,
      floorWeeks: weekRef.weeks,
      requiredDifficulty: difficulty,
      difficulty
    };
  });
}

function getGroupForTopic(topic) {
  return "Grade 10 BOW";
}

function formatTosLabel(value) {
  return typeof value === "string" ? value : String(value || "");
}

function showQuestionBankError(weekRefOrLabel) {
  state.currentQuestion = null;
  updateTimerVisibility();

  const label = typeof weekRefOrLabel === "string"
    ? weekRefOrLabel
    : `${weekRefOrLabel.term} ${weekRefOrLabel.weeks}`;

  $("floorTopic").textContent = `Missing ${label}`;
  const questionText = $("questionText");
  if (questionText) questionText.textContent = `No questions found for ${label}. Please check data/questions.js and confirm that the shared BOW question bank contains this term and week.`;
  $("choicesBox").innerHTML = "";
}

function prepareQuestionForDisplay(question) {
  const choices = Array.isArray(question.choices) ? question.choices : [];
  const shuffledChoices = shuffleArray(choices.map((choice, originalIndex) => ({ choice, originalIndex })));
  return {
    ...question,
    shuffledChoices
  };
}

function shuffleArray(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function renderQuestion(question) {
  const floorTopic = $("floorTopic");
  if (floorTopic) floorTopic.textContent = "";
  const topicLabel = $("topicLabel");
  if (topicLabel) {
    const termText = question.term ? `${question.term} • ` : "";
    const weekText = question.week ? `${question.week} • ` : "";
    topicLabel.textContent = `${termText}${weekText}${question.topic || "Grade 10 Mathematics"}`;
  }
  $("questionText").textContent = question.question;

  const choicesBox = $("choicesBox");
  choicesBox.innerHTML = "";

  if (!Array.isArray(question.choices)) {
    choicesBox.innerHTML = "<p class='message'>This question has invalid choices.</p>";
    return;
  }

  const displayChoices = Array.isArray(question.shuffledChoices) ? question.shuffledChoices : [];

  displayChoices.forEach((item, index) => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = `${String.fromCharCode(65 + index)}. ${item.choice}`;
    btn.addEventListener("click", () => checkAnswer(item.originalIndex));
    choicesBox.appendChild(btn);
  });
}

function checkAnswer(selectedIndex) {
  const question = state.currentQuestion;
  if (!question) return;

  disableChoiceButtons();

  const isCorrect = selectedIndex === question.answer;
  if (isCorrect) {
    handleCorrectAnswer();
  } else {
    handleWrongAnswer(question);
  }
}

function handleCorrectAnswer() {
  state.totalCorrectAnswers = Number(state.totalCorrectAnswers || 0) + 1;
  state.currentSublevel++;
  clearMistakeFeedback();

  const progressStatus = advanceRunPositionAfterAnswer();
  updateHighestProgress();

  if (progressStatus === "completed") {
    markProgressChanged();
    return;
  }

  updateGameDisplay();
  markProgressChanged();
  loadNextQuestion();
}

function handleWrongAnswer(question) {
  state.lastMissedQuestion = question;
  state.floorMistakes = Number(state.floorMistakes || 0) + 1;
  state.heartsRemaining = Math.max(0, HEARTS_PER_FLOOR - state.floorMistakes);
  state.currentSublevel++;

  updateGameDisplay();
  markProgressChanged();

  if (state.heartsRemaining <= 0) {
    updateHighestProgress();
    showGameOverFromMiss(question);
    return;
  }

  const progressStatus = advanceRunPositionAfterAnswer();
  updateHighestProgress();

  if (progressStatus === "completed") {
    markProgressChanged();
    return;
  }

  updateGameDisplay();
  showMistakeFeedback(question);

  const runIdSnapshot = state.runId;
  state.currentQuestion = null;

  window.setTimeout(() => {
    if (shouldContinueCurrentRun(runIdSnapshot)) {
      loadNextQuestion();
    }
  }, 1600);
}

function showCompletion() {
  const finalScore = getTotalScore();
  const totalScore = getTowerTotalScore();
  const completeScore = $("completeScore");
  const completeSummary = $("completeSummary");
  if (completeScore) completeScore.textContent = `${finalScore}/${totalScore}`;
  if (completeSummary) completeSummary.textContent = `You completed the tower with ${finalScore} correct answer(s) out of ${totalScore}.`;
  $("completeTime").textContent = formatTime(state.elapsedSeconds);
  $("badgeBox").innerHTML = getBadges(finalScore).map((badge) => `<span class="badge">${badge}</span>`).join("");
  markProgressChanged();
  showScreen("completeScreen");
}

function updateHighestProgress() {
  const currentScore = getTotalScore();
  const currentFloor = Number(state.currentFloor || 1);
  const currentSublevel = Number(state.currentSublevel || 0);
  const highestFloor = Number(state.highestFloor || 1);
  const highestSublevel = Number(state.highestSublevel || 0);
  const highestScore = Number(state.highestScore || 0);

  const isAhead =
    currentFloor > highestFloor ||
    (currentFloor === highestFloor && currentSublevel > highestSublevel) ||
    (currentFloor === highestFloor && currentSublevel === highestSublevel && currentScore > highestScore);

  if (isAhead) {
    state.highestFloor = currentFloor;
    state.highestSublevel = currentSublevel;
    state.highestScore = currentScore;
  }
}

function getBadges(score) {
  const badges = [];
  const total = getTowerTotalScore();

  if (score >= 12) badges.push("First Climb");
  if (score >= Math.ceil(total * 0.25)) badges.push("Focused Solver");
  if (score >= Math.ceil(total * 0.40)) badges.push("Math Climber");
  if (score >= Math.ceil(total * 0.70)) badges.push("Elite Climber");
  if (score >= Math.ceil(total * 0.90)) badges.push("Tower Master");
  if (score >= total) badges.push("Perfect Legend");
  if (score >= Math.ceil(total * 0.50) && state.elapsedSeconds <= 600) badges.push("Fast Climber");
  return badges;
}

function markProgressChanged() {
  ["submitProgressBtn", "submitGameOverBtn", "submitQuitBtn", "submitCompleteBtn"].forEach((id) => {
    const button = $(id);
    if (button) {
      button.disabled = false;
      button.textContent = "Submit Progress";
    }
  });
}

function resetSubmitMessages() {
  ["submitMessage", "gameOverSubmitMessage", "quitSubmitMessage", "completeSubmitMessage", "entryMessage"].forEach((id) => {
    const element = $(id);
    if (element) element.textContent = "";
  });
}

async function submitProgress(messageElementId) {
  const msg = $(messageElementId);
  msg.textContent = "";

  if (!state.player.name || !state.player.section || !state.player.school) {
    msg.textContent = "Please enter your name, section, and school first.";
    return;
  }

  const progress = buildProgressRecord();
  const studentKey = makeStudentDocId(progress.name, progress.section, progress.school, progress.towerId);
  progress.studentKey = studentKey;

  if (state.submittedKeys.has(progress.progressKey)) {
    msg.textContent = "This exact progress has already been submitted.";
    return;
  }

  if (!firebaseReady || !db) {
    msg.textContent = "Submission failed. Firebase is not configured yet.";
    return;
  }

  try {
    const studentRef = db.collection(LEADERBOARD_COLLECTION).doc(studentKey);
    const now = firebase.firestore.FieldValue.serverTimestamp();

    await db.runTransaction(async (transaction) => {
      const existingDoc = await transaction.get(studentRef);
      const existingData = existingDoc.exists ? existingDoc.data() : null;
      const existingBest = existingData ? normalizeLeaderboardRecord(existingData) : null;
      const submittedRecord = {
        ...progress,
        submittedAt: now,
        updatedAt: now,
        timestamp: now,
        latestFloor: progress.currentFloor,
        latestSublevel: progress.currentSublevel,
        latestScore: progress.totalScore,
        latestTimeSeconds: progress.timeUsedSeconds,
        latestTimeFormatted: progress.timeUsedFormatted
      };

      let bestRecord = {
        bestFloor: progress.currentFloor,
        bestSublevel: progress.currentSublevel,
        bestScore: progress.totalScore,
        bestTimeSeconds: progress.timeUsedSeconds,
        bestTimeFormatted: progress.timeUsedFormatted,
        bestStatus: progress.status,
        bestWeekId: progress.weekId,
        bestMonthId: progress.monthId,
        bestRunId: progress.runId,
        bestProgressKey: progress.progressKey,
        bestTowerId: progress.towerId,
        bestTowerName: progress.towerName
      };

      if (existingBest && !isNewSubmissionBetter(progress, existingBest)) {
        bestRecord = {
          bestFloor: existingBest.bestFloor,
          bestSublevel: existingBest.bestSublevel,
          bestScore: existingBest.bestScore,
          bestTimeSeconds: existingBest.bestTimeSeconds,
          bestTimeFormatted: existingBest.bestTimeFormatted,
          bestStatus: existingData.bestStatus || existingBest.status || existingData.status || "Submitted",
          bestWeekId: existingData.bestWeekId || existingData.weekId || "",
          bestMonthId: existingData.bestMonthId || existingData.monthId || "",
          bestRunId: existingData.bestRunId || existingData.runId || "",
          bestProgressKey: existingData.bestProgressKey || existingData.progressKey || "",
          bestTowerId: existingData.bestTowerId || existingData.towerId || progress.towerId,
          bestTowerName: existingData.bestTowerName || existingData.towerName || progress.towerName
        };
      }

      const finalRecord = {
        ...submittedRecord,
        ...bestRecord,
        createdAt: existingData?.createdAt || now,
        submissionCount: (Number(existingData?.submissionCount || 0) + 1)
      };

      transaction.set(studentRef, finalRecord);
    });

    state.submittedKeys.add(progress.progressKey);
    await loadHomepageChampions();
    msg.textContent = "Progress submitted successfully.";
    disableSubmitButtonForCurrentScreen();
  } catch (error) {
    console.error("Submission failed:", error);
    msg.textContent = "Submission failed. Please check your internet connection, Firestore rules, or tell your teacher.";
  }
}

function isNewSubmissionBetter(progress, existingBest) {
  const newRecord = {
    bestFloor: Number(progress.currentFloor || progress.floor || 1),
    bestSublevel: Number(progress.currentSublevel || progress.sublevel || 0),
    bestScore: Number(progress.totalScore || progress.score || 0),
    bestTimeSeconds: Number(progress.timeUsedSeconds || progress.timeUsed || 0)
  };

  return isBetterRecord(newRecord, existingBest);
}

function disableSubmitButtonForCurrentScreen() {
  const activeScreen = document.querySelector(".screen.active");
  if (!activeScreen) return;

  const button = activeScreen.querySelector(".submit-btn");
  if (button) {
    button.disabled = true;
    button.textContent = "Submitted ✓";
  }
}

function buildProgressRecord() {
  const reached = getReachedProgress();
  const cleanName = normalizeText(state.player.name);
  const cleanSection = normalizeText(state.player.section);
  const cleanSchool = normalizeText(state.player.school);
  const towerConfig = getSelectedTowerConfig();
  const totalPossibleScore = getTowerTotalScore(towerConfig.id);
  const progressKey = `${towerConfig.id}_${state.runId}_${reached.floor}_${reached.sublevel}_${reached.score}_${state.status}_${state.elapsedSeconds}`;
  const studentKey = makeStudentDocId(cleanName, cleanSection, cleanSchool, towerConfig.id);

  return {
    // Student information
    name: cleanName,
    section: cleanSection,
    school: cleanSchool,
    studentKey,

    // Tower information
    towerId: towerConfig.id,
    towerName: towerConfig.name,
    maxFloors: towerConfig.maxFloors,
    totalPossibleScore,

    // Progress fields used by the Grade 10 Mastery Tower
    currentFloor: reached.floor,
    currentSublevel: reached.sublevel,
    totalScore: reached.score,
    timeUsedSeconds: state.elapsedSeconds,
    timeUsedFormatted: formatTime(state.elapsedSeconds),
    status: state.status,
    heartsPerFloor: HEARTS_PER_FLOOR,
    heartsRemaining: Number(state.heartsRemaining ?? HEARTS_PER_FLOOR),
    floorMistakes: Number(state.floorMistakes || 0),
    totalCorrectAnswers: Number(state.totalCorrectAnswers || 0),

    // Simple aliases for easier Firestore reading and future rules
    floor: reached.floor,
    sublevel: reached.sublevel,
    score: reached.score,
    timeUsed: state.elapsedSeconds,

    // Weekly leaderboard support
    // The weekId changes every Sunday at 8:00 PM Philippine Time.
    weekId: getWeekId(),

    // Monthly champion support
    // The monthId changes every 1st day of the month at 12:00 AM Philippine Time.
    monthId: getMonthId(),

    // Submission identity
    runId: state.runId,
    progressKey
  };
}

// Kept for compatibility with older versions of the file.
// The revised setup no longer writes to a separate all-time collection.
// All leaderboard views now come from the single "leaderboard" collection.
async function updateLeaderboard(progress) {
  return progress;
}

function isBetterRecord(newRecord, oldRecord) {
  if ((newRecord.bestFloor || 0) > (oldRecord.bestFloor || 0)) return true;
  if ((newRecord.bestFloor || 0) < (oldRecord.bestFloor || 0)) return false;

  if ((newRecord.bestSublevel || 0) > (oldRecord.bestSublevel || 0)) return true;
  if ((newRecord.bestSublevel || 0) < (oldRecord.bestSublevel || 0)) return false;

  if ((newRecord.bestScore || 0) > (oldRecord.bestScore || 0)) return true;
  if ((newRecord.bestScore || 0) < (oldRecord.bestScore || 0)) return false;

  return (newRecord.bestTimeSeconds || Infinity) < (oldRecord.bestTimeSeconds || Infinity);
}

async function loadLeaderboard() {
  const weeklyBody = $("weeklyLeaderboardBody");
  const allTimeBody = $("allTimeLeaderboardBody");
  const weeklyMsg = $("weeklyLeaderboardMessage");
  const allTimeMsg = $("allTimeLeaderboardMessage");
  const msg = $("leaderboardMessage");

  if (weeklyBody) weeklyBody.innerHTML = "";
  if (allTimeBody) allTimeBody.innerHTML = "";
  if (weeklyMsg) weeklyMsg.textContent = "";
  if (allTimeMsg) allTimeMsg.textContent = "";
  if (msg) msg.textContent = "";

  if (!firebaseReady || !db) {
    if (msg) msg.textContent = "Leaderboards unavailable. Paste your Firebase config in script.js first.";
    return;
  }

  try {
    const [allTimeRecords, weeklyRecords] = await Promise.all([
      getAllTimeLeaderboardRecords(),
      getWeeklyLeaderboardRecords()
    ]);

    renderLeaderboardRows(allTimeBody, allTimeRecords, getTowerChampionTitle(selectedLeaderboardTowerId));
    renderLeaderboardRows(weeklyBody, weeklyRecords, "Current Weekly Leader");

    if (!allTimeRecords.length && allTimeMsg) allTimeMsg.textContent = "No all-time leaderboard records yet.";
    if (!weeklyRecords.length && weeklyMsg) weeklyMsg.textContent = "No weekly leaderboard records yet.";
  } catch (error) {
    console.error("Leaderboard loading failed:", error);
    if (msg) msg.textContent = "Leaderboard loading failed. Please check your Firebase setup or internet connection.";
  }
}

async function getAllTimeLeaderboardRecords(towerId = selectedLeaderboardTowerId) {
  const snapshot = await db.collection(LEADERBOARD_COLLECTION).get();
  const bestByStudent = new Map();

  snapshot.forEach((doc) => {
    const record = normalizeLeaderboardRecord(doc.data());
    if (!record.name || !record.section) return;
    if ((record.towerId || DEFAULT_TOWER_ID) !== towerId) return;

    const key = makeStudentDocId(record.name, record.section, record.school, record.towerId);
    const existing = bestByStudent.get(key);

    if (!existing || isBetterRecord(record, existing)) {
      bestByStudent.set(key, record);
    }
  });

  return sortLeaderboardRecords([...bestByStudent.values()]).slice(0, 10);
}

async function getWeeklyLeaderboardRecords(towerId = selectedLeaderboardTowerId) {
  return getLeaderboardRecordsByWeekId(getWeekId(), towerId);
}

async function getPreviousWeekLeaderboardRecords(towerId = DEFAULT_TOWER_ID) {
  return getLeaderboardRecordsByWeekId(getPreviousWeekId(), towerId);
}

async function getPreviousMonthLeaderboardRecords(towerId = DEFAULT_TOWER_ID) {
  const previousMonth = getPreviousMonthPeriod();
  const previousMonthId = formatLeaderboardMonthId(previousMonth.year, previousMonth.month);

  const snapshot = await db.collection(LEADERBOARD_COLLECTION).get();
  const bestByStudent = new Map();

  snapshot.forEach((doc) => {
    const rawRecord = doc.data();
    const record = normalizeLeaderboardRecord(rawRecord);
    if (!record.name || !record.section) return;
    if ((record.towerId || DEFAULT_TOWER_ID) !== towerId) return;

    const submittedAt = getRecordDate(rawRecord.timestamp || rawRecord.createdAt);
    const matchesMonthId = rawRecord.monthId === previousMonthId || rawRecord.bestMonthId === previousMonthId;
    const matchesDateRange = submittedAt && isDateInPhtMonth(submittedAt, previousMonth.year, previousMonth.month);

    if (!matchesMonthId && !matchesDateRange) return;

    const key = makeStudentDocId(record.name, record.section, record.school, record.towerId);
    const existing = bestByStudent.get(key);

    if (!existing || isBetterRecord(record, existing)) {
      bestByStudent.set(key, record);
    }
  });

  return sortLeaderboardRecords([...bestByStudent.values()]).slice(0, 10);
}

async function getCurrentMonthLeaderboardRecords(towerId = DEFAULT_TOWER_ID) {
  const currentMonthId = getMonthId();
  const currentPht = getPhtDateParts(new Date());

  const snapshot = await db.collection(LEADERBOARD_COLLECTION).get();
  const bestByStudent = new Map();

  snapshot.forEach((doc) => {
    const rawRecord = doc.data();
    const record = normalizeLeaderboardRecord(rawRecord);
    if (!record.name || !record.section) return;
    if ((record.towerId || DEFAULT_TOWER_ID) !== towerId) return;

    const submittedAt = getRecordDate(rawRecord.timestamp || rawRecord.createdAt);
    const matchesMonthId = rawRecord.monthId === currentMonthId || rawRecord.bestMonthId === currentMonthId;
    const matchesDateRange = submittedAt && isDateInPhtMonth(submittedAt, currentPht.year, currentPht.month);

    if (!matchesMonthId && !matchesDateRange) return;

    const key = makeStudentDocId(record.name, record.section, record.school, record.towerId);
    const existing = bestByStudent.get(key);

    if (!existing || isBetterRecord(record, existing)) {
      bestByStudent.set(key, record);
    }
  });

  return sortLeaderboardRecords([...bestByStudent.values()]).slice(0, 10);
}

async function getLeaderboardRecordsByWeekId(weekId, towerId = selectedLeaderboardTowerId) {
  const snapshot = await db.collection(LEADERBOARD_COLLECTION).get();
  const bestByStudent = new Map();

  snapshot.forEach((doc) => {
    const rawRecord = doc.data();
    const record = normalizeLeaderboardRecord(rawRecord);
    if (!record.name || !record.section) return;
    if ((record.towerId || DEFAULT_TOWER_ID) !== towerId) return;

    const matchesWeek = rawRecord.weekId === weekId || rawRecord.bestWeekId === weekId;
    if (!matchesWeek) return;

    const key = makeStudentDocId(record.name, record.section, record.school, record.towerId);
    const existing = bestByStudent.get(key);

    if (!existing || isBetterRecord(record, existing)) {
      bestByStudent.set(key, record);
    }
  });

  return sortLeaderboardRecords([...bestByStudent.values()]).slice(0, 10);
}

function normalizeLeaderboardRecord(record) {
  const towerId = record.towerId || DEFAULT_TOWER_ID;
  const towerConfig = TOWER_CONFIG[towerId] || TOWER_CONFIG[DEFAULT_TOWER_ID];

  return {
    name: record.name,
    section: record.section,
    school: record.school || record.gradeLevel || "",
    studentKey: record.studentKey || makeStudentDocId(record.name, record.section, record.school || record.gradeLevel || "", towerId),
    towerId,
    towerName: record.towerName || towerConfig.name,
    maxFloors: Number(record.maxFloors ?? towerConfig.maxFloors),
    totalPossibleScore: Number(record.totalPossibleScore ?? getTowerTotalScore(towerId)),
    bestFloor: Number(record.bestFloor ?? record.currentFloor ?? record.floor ?? 1),
    bestSublevel: Number(record.bestSublevel ?? record.currentSublevel ?? record.sublevel ?? 0),
    bestScore: Number(record.bestScore ?? record.totalScore ?? record.score ?? 0),
    bestTimeSeconds: Number(record.bestTimeSeconds ?? record.timeUsedSeconds ?? record.timeUsed ?? 0),
    bestTimeFormatted: record.bestTimeFormatted || record.timeUsedFormatted || formatTime(record.bestTimeSeconds ?? record.timeUsedSeconds ?? record.timeUsed ?? 0),
    heartsPerFloor: Number(record.heartsPerFloor ?? HEARTS_PER_FLOOR),
    heartsRemaining: Number(record.heartsRemaining ?? HEARTS_PER_FLOOR),
    floorMistakes: Number(record.floorMistakes ?? 0),
    status: record.bestStatus || record.status || "Submitted",
    weekId: record.weekId,
    monthId: record.monthId,
    bestWeekId: record.bestWeekId || record.weekId,
    bestMonthId: record.bestMonthId || record.monthId
  };
}

function sortLeaderboardRecords(records) {
  return [...records].sort((a, b) => {
    if ((b.bestFloor || 0) !== (a.bestFloor || 0)) return (b.bestFloor || 0) - (a.bestFloor || 0);
    if ((b.bestSublevel || 0) !== (a.bestSublevel || 0)) return (b.bestSublevel || 0) - (a.bestSublevel || 0);
    if ((b.bestScore || 0) !== (a.bestScore || 0)) return (b.bestScore || 0) - (a.bestScore || 0);
    return (a.bestTimeSeconds || Infinity) - (b.bestTimeSeconds || Infinity);
  });
}

function getTowerChampionTitle(towerId) {
  if (towerId === "bigTower") return "Grand Tower Master";
  if (towerId === "term1Tower") return "First Term Tower Master";
  if (towerId === "term2Tower") return "Second Term Tower Master";
  if (towerId === "term3Tower") return "Third Term Tower Master";
  return "Tower Master";
}

function renderLeaderboardRows(body, records, topTitle) {
  if (!body) return;
  body.innerHTML = records.map((record, index) => {
    const rankLabel = index === 0 ? `1 — ${topTitle}` : `${index + 1}`;
    return `
      <tr class="${index === 0 ? "top-rank" : ""}">
        <td>${rankLabel}</td>
        <td>${escapeHtml(record.name || "")}</td>
        <td>${escapeHtml(record.section || "")}</td>
        <td>${escapeHtml(record.school || "")}</td>
        <td>${record.bestFloor || 1}</td>
        <td>${record.bestSublevel || 0}</td>
        <td>${record.bestScore || 0}/${record.totalPossibleScore || getTowerTotalScore(record.towerId || selectedLeaderboardTowerId)}</td>
        <td>${record.bestTimeFormatted || formatTime(record.bestTimeSeconds || 0)}</td>
      </tr>
    `;
  }).join("");
}

async function loadHomepageChampions() {
  const championTargets = {
    grand: [
      [$("grandTowerMasterName"), $("grandTowerMasterMeta")],
      [$("lbGrandTowerMasterName"), $("lbGrandTowerMasterMeta")]
    ],
    weekly: [
      [$("weeklyGrandChampionName"), $("weeklyGrandChampionMeta")],
      [$("lbWeeklyGrandChampionName"), $("lbWeeklyGrandChampionMeta")]
    ],
    monthly: [
      [$("monthlyGrandChampionName"), $("monthlyGrandChampionMeta")],
      [$("lbMonthlyGrandChampionName"), $("lbMonthlyGrandChampionMeta")]
    ],
    term1: [
      [$("term1TowerMasterName"), $("term1TowerMasterMeta")]
    ],
    term2: [
      [$("term2TowerMasterName"), $("term2TowerMasterMeta")]
    ],
    term3: [
      [$("term3TowerMasterName"), $("term3TowerMasterMeta")]
    ]
  };

  const weeklyTopContenders = $("weeklyTopContenders");
  const monthlyTopContenders = $("monthlyTopContenders");

  const hasChampionTarget = Object.values(championTargets)
    .flat()
    .some(([nameElement]) => Boolean(nameElement));

  if (!hasChampionTarget && !weeklyTopContenders && !monthlyTopContenders) return;

  if (!firebaseReady || !db) {
    updateChampionTargetGroup(championTargets.grand, null, "No champion yet", "Connect Firebase to load champion");
    updateChampionTargetGroup(championTargets.weekly, null, "No weekly champion yet", "Connect Firebase to load weekly champion");
    updateChampionTargetGroup(championTargets.monthly, null, "No monthly champion yet", "Connect Firebase to load monthly champion");
    updateChampionTargetGroup(championTargets.term1, null, "No champion yet", "Connect Firebase to load champion");
    updateChampionTargetGroup(championTargets.term2, null, "No champion yet", "Connect Firebase to load champion");
    updateChampionTargetGroup(championTargets.term3, null, "No champion yet", "Connect Firebase to load champion");
    renderContenderRows(weeklyTopContenders, [], "weekly");
    renderContenderRows(monthlyTopContenders, [], "monthly");
    return;
  }

  try {
    const [
      grandAllTime,
      previousWeekRecords,
      previousMonthRecords,
      term1AllTime,
      term2AllTime,
      term3AllTime,
      currentWeeklyRecords,
      currentMonthlyRecords
    ] = await Promise.all([
      getAllTimeLeaderboardRecords(DEFAULT_TOWER_ID),
      getPreviousWeekLeaderboardRecords(DEFAULT_TOWER_ID),
      getPreviousMonthLeaderboardRecords(DEFAULT_TOWER_ID),
      getAllTimeLeaderboardRecords("term1Tower"),
      getAllTimeLeaderboardRecords("term2Tower"),
      getAllTimeLeaderboardRecords("term3Tower"),
      getWeeklyLeaderboardRecords(DEFAULT_TOWER_ID),
      getCurrentMonthLeaderboardRecords(DEFAULT_TOWER_ID)
    ]);

    updateChampionTargetGroup(
      championTargets.grand,
      grandAllTime[0],
      "No champion yet",
      "All-Time Top 1 of the Grand Mastery Tower"
    );

    updateChampionTargetGroup(
      championTargets.weekly,
      previousWeekRecords[0],
      "No weekly champion yet",
      "Winner from the previous completed week"
    );

    updateChampionTargetGroup(
      championTargets.monthly,
      previousMonthRecords[0],
      "No monthly champion yet",
      "Winner from the previous completed month"
    );

    updateChampionTargetGroup(
      championTargets.term1,
      term1AllTime[0],
      "No champion yet",
      "All-Time Top 1 of the First Term Trial Tower"
    );

    updateChampionTargetGroup(
      championTargets.term2,
      term2AllTime[0],
      "No champion yet",
      "All-Time Top 1 of the Second Term Challenge Tower"
    );

    updateChampionTargetGroup(
      championTargets.term3,
      term3AllTime[0],
      "No champion yet",
      "All-Time Top 1 of the Third Term Mastery Tower"
    );

    renderContenderRows(weeklyTopContenders, currentWeeklyRecords.slice(0, 1), "weekly");
    renderContenderRows(monthlyTopContenders, currentMonthlyRecords.slice(0, 1), "monthly");
  } catch (error) {
    console.error("Champion loading failed:", error);
  }
}

function updateChampionTargetGroup(targets, record, emptyText, defaultMeta) {
  targets.forEach(([nameElement, metaElement]) => {
    updateChampionCard(nameElement, metaElement, record, emptyText, defaultMeta);
  });
}

function setChampionEmpty(nameElement, metaElement, emptyText, metaText) {
  if (nameElement) nameElement.textContent = emptyText;
  if (metaElement) metaElement.textContent = metaText;
}

function updateChampionCard(nameElement, metaElement, record, emptyText, defaultMeta) {
  if (!nameElement || !metaElement) return;

  if (!record) {
    nameElement.textContent = emptyText;
    metaElement.textContent = defaultMeta;
    return;
  }

  nameElement.textContent = record.name || emptyText;
  metaElement.textContent = formatRecordMeta(record);
}

function formatRecordMeta(record) {
  const schoolText = record.school ? `, ${record.school}` : "";
  return `${record.section || "No section"}${schoolText} • Floor ${record.bestFloor || 1}, Sublevel ${record.bestSublevel || 0} • ${record.bestTimeFormatted || formatTime(record.bestTimeSeconds || 0)}`;
}

function renderContenderRows(listElement, records, periodType) {
  if (!listElement) return;

  if (!records.length) {
    listElement.innerHTML = `<li>No current ${periodType} top contender yet.</li>`;
    return;
  }

  listElement.innerHTML = records.map((record, index) => {
    let label = "Challenger";
    if (index === 0 && periodType === "weekly") label = "Current Weekly Leader";
    if (index === 0 && periodType === "monthly") label = "Current Monthly Leader";

    return `
      <li>
        <span class="contender-rank">#${index + 1}</span>
        <div>
          <strong>${escapeHtml(record.name || "Unknown Player")}</strong>
          <span>${escapeHtml(label)} — ${escapeHtml(formatRecordMeta(record))}</span>
        </div>
      </li>
    `;
  }).join("");
}

function getStartOfCurrentWeek() {
  return getCurrentLeaderboardPeriodStart();
}

function getWeekId(date = new Date()) {
  // Leaderboard week resets every Sunday at 8:00 PM Philippine Time.
  return formatLeaderboardWeekId(getCurrentLeaderboardPeriodStart(date));
}

function getPreviousWeekId(date = new Date()) {
  const currentStart = getCurrentLeaderboardPeriodStart(date);
  return formatLeaderboardWeekId(new Date(currentStart.getTime() - (7 * 24 * 60 * 60 * 1000)));
}

function getMonthId(date = new Date()) {
  const phtDate = getPhtDateParts(date);
  return formatLeaderboardMonthId(phtDate.year, phtDate.month);
}

function getPreviousMonthPeriod(date = new Date()) {
  const phtDate = getPhtDateParts(date);
  let year = phtDate.year;
  let month = phtDate.month - 1;

  if (month < 0) {
    month = 11;
    year -= 1;
  }

  return { year, month };
}

function formatLeaderboardMonthId(year, month) {
  return `PHT-${year}-${String(month + 1).padStart(2, "0")}`;
}

function getPhtDateParts(date = new Date()) {
  const phtOffsetMs = 8 * 60 * 60 * 1000;
  const pht = new Date(date.getTime() + phtOffsetMs);

  return {
    year: pht.getUTCFullYear(),
    month: pht.getUTCMonth(),
    day: pht.getUTCDate()
  };
}

function isDateInPhtMonth(date, year, month) {
  const phtDate = getPhtDateParts(date);
  return phtDate.year === year && phtDate.month === month;
}

function getCurrentLeaderboardPeriodStart(date = new Date()) {
  const phtOffsetMs = 8 * 60 * 60 * 1000;
  const phtNow = new Date(date.getTime() + phtOffsetMs);

  const year = phtNow.getUTCFullYear();
  const month = phtNow.getUTCMonth();
  const dayOfMonth = phtNow.getUTCDate();
  const dayOfWeek = phtNow.getUTCDay(); // Sunday = 0

  let resetPhtMs = Date.UTC(year, month, dayOfMonth - dayOfWeek, 20, 0, 0, 0);

  if (phtNow.getTime() < resetPhtMs) {
    resetPhtMs -= 7 * 24 * 60 * 60 * 1000;
  }

  return new Date(resetPhtMs - phtOffsetMs);
}

function formatLeaderboardWeekId(periodStartUtc) {
  const phtOffsetMs = 8 * 60 * 60 * 1000;
  const phtStart = new Date(periodStartUtc.getTime() + phtOffsetMs);
  const year = phtStart.getUTCFullYear();
  const month = String(phtStart.getUTCMonth() + 1).padStart(2, "0");
  const day = String(phtStart.getUTCDate()).padStart(2, "0");
  return `PHT-${year}-${month}-${day}-2000`;
}

function getRecordDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildTower(containerId, activeFloor, options = {}) {
  const container = $(containerId);
  if (!container) return;
  container.innerHTML = "";

  const maxFloors = options.maxFloors || getTowerMaxFloors(options.towerId || state.selectedTowerId || DEFAULT_TOWER_ID);

  for (let floor = 1; floor <= maxFloors; floor++) {
    const div = document.createElement("div");
    div.className = "floor-block";
    if (floor === activeFloor) div.classList.add("active");
    if (floor < activeFloor) div.classList.add("completed");
    if (floor > activeFloor) div.classList.add("locked");
    if (options.decorative) {
      div.innerHTML = "<span class='window'></span><span class='window'></span><span class='window'></span>";
      div.setAttribute("aria-hidden", "true");
    } else {
      div.innerHTML = `<span class="floor-label">Floor ${floor}</span>`;
    }
    container.appendChild(div);
  }
}

function formatTime(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safe / 60);
  const remainingSeconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function createRunId() {
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function makeStudentDocId(name, section, school = "", towerId = DEFAULT_TOWER_ID) {
  return `${name}_${section}_${school}_${towerId}`
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "unknown_student";
}

function normalizeText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
