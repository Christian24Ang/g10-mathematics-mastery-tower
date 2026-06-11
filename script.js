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

const MAX_FLOORS = 10;
const SUBLEVELS_PER_FLOOR = 12;
const TOTAL_TOWER_SCORE = MAX_FLOORS * SUBLEVELS_PER_FLOOR;

const FLOOR_DIFFICULTY_BY_FLOOR = {
  1: "Very Easy",
  2: "Easy",
  3: "Easy-Average",
  4: "Average",
  5: "Average-Challenging",
  6: "Challenging",
  7: "Difficult",
  8: "Very Difficult",
  9: "Expert",
  10: "Mastery Level"
};

const FLOOR_DIFFICULTY = FLOOR_DIFFICULTY_BY_FLOOR;

const OFFICIAL_TOPICS = [
  "Patterns and Sequences",
  "Arithmetic Sequences",
  "Arithmetic Means",
  "Sum of Arithmetic Sequences",
  "Geometric Sequences",
  "Geometric Means",
  "Finite Geometric Series",
  "Infinite Geometric Series",
  "Polynomials",
  "Polynomial Division",
  "Synthetic Division",
  "Remainder Theorem",
  "Factor Theorem",
  "Rational Root Theorem",
  "Polynomial Equations",
  "Polynomial Functions",
  "Graphs of Polynomial Functions",
  "Circles",
  "Chords, Arcs, and Central Angles",
  "Inscribed Angles",
  "Tangents and Secants",
  "Sectors and Segments of Circles",
  "Circles in Coordinate Geometry",
  "Distance Formula",
  "Center-Radius Form of a Circle",
  "Permutations",
  "Combinations",
  "Probability",
  "Mutually Exclusive Events",
  "Probability of the Union of Events",
  "Measures of Position",
  "Quartiles",
  "Deciles",
  "Percentiles",
  "Interpreting Measures of Position",
  "Statistics and Mini-Research"
];

const QUESTIONS_PER_TOPIC_PER_FLOOR = 5;
const QUESTIONS_PER_FLOOR_BANK = OFFICIAL_TOPICS.length * QUESTIONS_PER_TOPIC_PER_FLOOR;

const TOPIC_GROUPS = {
  Algebra: [
    "Patterns and Sequences",
    "Arithmetic Sequences",
    "Arithmetic Means",
    "Sum of Arithmetic Sequences",
    "Geometric Sequences",
    "Geometric Means",
    "Finite Geometric Series",
    "Infinite Geometric Series",
    "Polynomials",
    "Polynomial Division",
    "Synthetic Division",
    "Remainder Theorem",
    "Factor Theorem",
    "Rational Root Theorem",
    "Polynomial Equations",
    "Polynomial Functions",
    "Graphs of Polynomial Functions"
  ],
  Geometry: [
    "Circles",
    "Chords, Arcs, and Central Angles",
    "Inscribed Angles",
    "Tangents and Secants",
    "Sectors and Segments of Circles",
    "Circles in Coordinate Geometry",
    "Distance Formula",
    "Center-Radius Form of a Circle"
  ],
  Probability: [
    "Permutations",
    "Combinations",
    "Probability",
    "Mutually Exclusive Events",
    "Probability of the Union of Events"
  ],
  Statistics: [
    "Measures of Position",
    "Quartiles",
    "Deciles",
    "Percentiles",
    "Interpreting Measures of Position",
    "Statistics and Mini-Research"
  ]
};

const QUESTIONS_PER_GROUP_PER_ATTEMPT = 3;

const TOPIC_TO_GROUP = Object.entries(TOPIC_GROUPS).reduce((lookup, [group, topics]) => {
  topics.forEach((topic) => {
    lookup[topic] = group;
  });
  return lookup;
}, {});


let state = getFreshState();

function getFreshState() {
  return {
    player: {
      name: "",
      section: "",
      school: ""
    },
    currentFloor: 1,
    currentSublevel: 0,
    highestFloor: 1,
    highestSublevel: 0,
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

const screens = {
  homeScreen: document.getElementById("homeScreen"),
  entryScreen: document.getElementById("entryScreen"),
  gameScreen: document.getElementById("gameScreen"),
  gameOverScreen: document.getElementById("gameOverScreen"),
  quitScreen: document.getElementById("quitScreen"),
  completeScreen: document.getElementById("completeScreen"),
  leaderboardScreen: document.getElementById("leaderboardScreen"),
  howScreen: document.getElementById("howScreen")
};

const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", () => {
  buildTower("homeTower", 1, { decorative: true });
  bindEvents();
  validateQuestionBank();
  updateTopbar();
  setBodyScreenClass("homeScreen");
  loadHomepageChampions();
});

function bindEvents() {
  $("startBtn").addEventListener("click", () => showScreen("entryScreen"));

  $("leaderboardBtn").addEventListener("click", () => {
    showScreen("leaderboardScreen");
    loadLeaderboard();
  });

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
      if (button.dataset.go === "leaderboardScreen") loadLeaderboard();
    });
  });
}

function showScreen(id) {
  Object.values(screens).forEach((screen) => {
    if (screen) screen.classList.remove("active");
  });
  if (screens[id]) screens[id].classList.add("active");
  setBodyScreenClass(id);
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

  if (!name || !section || !school) {
    $("entryMessage").textContent = "Please enter your name, section, and school before starting.";
    return;
  }

  state = {
    ...getFreshState(),
    player: { name, section, school },
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

function restartAfterGameOver() {
  state = {
    ...getFreshState(),
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
  stopTimer();

  const reached = getReachedProgress();
  $("quitFloor").textContent = reached.floor;
  $("quitSublevel").textContent = reached.sublevel;
  $("quitScore").textContent = `${reached.score}/${TOTAL_TOWER_SCORE}`;
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
}

function stopTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

function updateTimerLabels() {
  const formatted = formatTime(state.elapsedSeconds);
  const topTimer = $("topTimer");
  if (topTimer) topTimer.textContent = `Time: ${formatted}`;
}

function updateTopbar() {
  const topFloor = $("topFloor");
  const topScore = $("topScore");
  const topTimer = $("topTimer");
  if (topFloor) topFloor.textContent = `Floor ${state.currentFloor}`;
  if (topScore) topScore.textContent = `${getTotalScore()}/${TOTAL_TOWER_SCORE}`;
  if (topTimer) topTimer.textContent = `Time: ${formatTime(state.elapsedSeconds)}`;
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
  if (topScore) topScore.textContent = `${score}/${TOTAL_TOWER_SCORE}`;
  if (sublevelProgressLabel) sublevelProgressLabel.textContent = `${currentSublevel}/${SUBLEVELS_PER_FLOOR}`;

  renderSublevelDots(currentSublevel);
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

function getTotalScore() {
  if (state.status === "Tower Completed") return TOTAL_TOWER_SCORE;
  return ((state.currentFloor - 1) * SUBLEVELS_PER_FLOOR) + state.currentSublevel;
}

function getHighestScore() {
  if (state.status === "Tower Completed") return TOTAL_TOWER_SCORE;
  return ((state.highestFloor - 1) * SUBLEVELS_PER_FLOOR) + state.highestSublevel;
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
  const allowedGroups = Object.keys(TOPIC_GROUPS);

  for (let floor = 1; floor <= MAX_FLOORS; floor++) {
    const key = `floor${floor}`;
    const questions = window.QUESTION_BANK[key];
    const requiredDifficulty = getRequiredDifficulty(floor);

    if (!Array.isArray(questions) || questions.length === 0) {
      warnings.push(`${key} is missing or empty`);
      continue;
    }

    if (questions.length !== QUESTIONS_PER_FLOOR_BANK) {
      warnings.push(`${key} should contain ${QUESTIONS_PER_FLOOR_BANK} questions, but found ${questions.length}`);
    }

    const wrongDifficulty = questions.filter((q) => normalizeDifficulty(q.difficulty) !== requiredDifficulty).length;
    if (wrongDifficulty > 0) {
      warnings.push(`${key} contains ${wrongDifficulty} question(s) outside the assigned difficulty: ${requiredDifficulty}`);
    }

    const invalidGroups = questions.filter((q) => !allowedGroups.includes(q.group || getGroupForTopic(q.topic))).length;
    if (invalidGroups > 0) {
      warnings.push(`${key} contains ${invalidGroups} question(s) without a valid group field`);
    }

    OFFICIAL_TOPICS.forEach((topic) => {
      const topicQuestions = questions.filter((q) => q.topic === topic);
      const topicCount = topicQuestions.length;
      if (topicCount !== QUESTIONS_PER_TOPIC_PER_FLOOR) {
        warnings.push(`${key} should have ${QUESTIONS_PER_TOPIC_PER_FLOOR} question(s) for "${topic}", but found ${topicCount}`);
      }

      const expectedGroup = getGroupForTopic(topic);
      const wrongGroupCount = topicQuestions.filter((q) => (q.group || expectedGroup) !== expectedGroup).length;
      if (wrongGroupCount > 0) {
        warnings.push(`${key} has ${wrongGroupCount} question(s) for "${topic}" with the wrong group`);
      }
    });
  }

  if (warnings.length) {
    console.warn("Question bank topic/group/difficulty warnings:", warnings.join("; "));
  }

  return warnings.length === 0;
}

function loadNextQuestion() {
  const floorKey = `floor${state.currentFloor}`;
  const questions = (window.QUESTION_BANK && window.QUESTION_BANK[floorKey]) || [];

  if (!Array.isArray(questions) || !questions.length) {
    showQuestionBankError(floorKey);
    return;
  }

  if (!state.floorAttemptQuestions[floorKey] || state.floorAttemptQuestions[floorKey].length !== SUBLEVELS_PER_FLOOR) {
    state.floorAttemptQuestions[floorKey] = buildFloorAttemptQuestions(floorKey, questions);
  }

  const selected = state.floorAttemptQuestions[floorKey][state.currentSublevel];

  if (!selected) {
    showQuestionBankError(floorKey);
    console.error(`No selected question found for ${floorKey}, sublevel ${state.currentSublevel}.`);
    return;
  }

  state.currentQuestion = prepareQuestionForDisplay(selected);
  renderQuestion(state.currentQuestion);
}

function buildFloorAttemptQuestions(floorKey, questions) {
  const requiredDifficulty = getRequiredDifficulty(state.currentFloor);
  const difficultyPool = questions.filter((q) => normalizeDifficulty(q.difficulty) === requiredDifficulty);
  const sourcePool = difficultyPool.length ? difficultyPool : questions;

  if (!difficultyPool.length) {
    console.warn(`No ${requiredDifficulty} question found for ${floorKey}. Falling back to all questions for this floor.`);
  }

  const selectedQuestions = [];
  const usedTopics = new Set();

  Object.entries(TOPIC_GROUPS).forEach(([group, officialTopics]) => {
    const questionsByTopic = new Map();

    sourcePool.forEach((question) => {
      const topic = question.topic || "Grade 10 Mathematics";
      const questionGroup = question.group || getGroupForTopic(topic);
      if (questionGroup !== group) return;
      if (!officialTopics.includes(topic)) return;

      if (!questionsByTopic.has(topic)) questionsByTopic.set(topic, []);
      questionsByTopic.get(topic).push(question);
    });

    const availableTopics = shuffleArray([...questionsByTopic.keys()]);
    if (availableTopics.length < QUESTIONS_PER_GROUP_PER_ATTEMPT) {
      console.warn(`${floorKey} has only ${availableTopics.length} available ${group} topic(s). At least ${QUESTIONS_PER_GROUP_PER_ATTEMPT} are needed.`);
    }

    const selectedTopics = availableTopics.slice(0, QUESTIONS_PER_GROUP_PER_ATTEMPT);

    selectedTopics.forEach((topic) => {
      if (usedTopics.has(topic)) return;

      const topicQuestions = questionsByTopic.get(topic) || [];
      const selected = topicQuestions[Math.floor(Math.random() * topicQuestions.length)];

      if (selected) {
        usedTopics.add(topic);
        selectedQuestions.push({
          ...selected,
          group,
          requiredDifficulty
        });
      }
    });
  });

  if (selectedQuestions.length < SUBLEVELS_PER_FLOOR) {
    const fallbackQuestions = shuffleArray(sourcePool.filter((question) => {
      const topic = question.topic || "Grade 10 Mathematics";
      return !usedTopics.has(topic);
    }));

    fallbackQuestions.forEach((question) => {
      if (selectedQuestions.length >= SUBLEVELS_PER_FLOOR) return;

      const topic = question.topic || "Grade 10 Mathematics";
      if (usedTopics.has(topic)) return;

      usedTopics.add(topic);
      selectedQuestions.push({
        ...question,
        group: question.group || getGroupForTopic(topic),
        requiredDifficulty
      });
    });
  }

  if (selectedQuestions.length !== SUBLEVELS_PER_FLOOR) {
    console.warn(`${floorKey} selected ${selectedQuestions.length} question(s), but ${SUBLEVELS_PER_FLOOR} are required.`);
  }

  return shuffleArray(selectedQuestions).slice(0, SUBLEVELS_PER_FLOOR);
}

function getGroupForTopic(topic) {
  return TOPIC_TO_GROUP[topic] || "Algebra";
}

function getRequiredDifficulty(floor) {
  return FLOOR_DIFFICULTY_BY_FLOOR[floor] || "Very Easy";
}

function normalizeDifficulty(value) {
  const text = String(value || "").toLowerCase().trim();
  const labels = {
    "very easy": "Very Easy",
    "easy": "Easy",
    "easy-average": "Easy-Average",
    "easy average": "Easy-Average",
    "average": "Average",
    "average-challenging": "Average-Challenging",
    "average challenging": "Average-Challenging",
    "challenging": "Challenging",
    "difficult": "Difficult",
    "very difficult": "Very Difficult",
    "expert": "Expert",
    "mastery level": "Mastery Level",
    "mastery": "Mastery Level"
  };
  return labels[text] || value || "Very Easy";
}

function formatTosLabel(value) {
  return typeof value === "string" ? value : String(value || "");
}

function showQuestionBankError(floorKey) {
  $("floorTopic").textContent = `Missing ${floorKey}`;
  const questionText = $("questionText");
  if (questionText) questionText.textContent = `No questions found for ${floorKey}. Please check data/questions.js and confirm that window.QUESTION_BANK.${floorKey} exists.`;
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
  if (topicLabel) topicLabel.textContent = question.topic || "Grade 10 Mathematics";
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

  const isCorrect = selectedIndex === question.answer;
  if (isCorrect) {
    handleCorrectAnswer();
  } else {
    handleWrongAnswer(question);
  }
}

function handleCorrectAnswer() {
  state.currentSublevel++;

  if (state.currentFloor === MAX_FLOORS && state.currentSublevel >= SUBLEVELS_PER_FLOOR) {
    state.currentSublevel = SUBLEVELS_PER_FLOOR;
    state.highestFloor = MAX_FLOORS;
    state.highestSublevel = SUBLEVELS_PER_FLOOR;
    state.status = "Tower Completed";
    stopTimer();
    showCompletion();
    return;
  }

  if (state.currentSublevel >= SUBLEVELS_PER_FLOOR) {
    state.currentFloor++;
    state.currentSublevel = 0;
  }

  updateHighestProgress();
  updateGameDisplay();
  markProgressChanged();
  loadNextQuestion();
}

function handleWrongAnswer(question) {
  updateHighestProgress();
  state.status = "Game Over";
  stopTimer();

  const reached = getReachedProgress();
  $("overFloor").textContent = reached.floor;
  $("overSublevel").textContent = reached.sublevel;
  $("overScore").textContent = `${reached.score}/${TOTAL_TOWER_SCORE}`;
  $("overTime").textContent = formatTime(state.elapsedSeconds);

  const correctChoice = question.choices?.[question.answer] ?? "Not available";
  $("correctAnswerLabel").textContent = correctChoice;
  $("explanationLabel").textContent = question.explanation || "No explanation provided.";

  markProgressChanged();
  showScreen("gameOverScreen");
}

function showCompletion() {
  $("completeTime").textContent = formatTime(state.elapsedSeconds);
  $("badgeBox").innerHTML = getBadges(TOTAL_TOWER_SCORE).map((badge) => `<span class="badge">${badge}</span>`).join("");
  markProgressChanged();
  showScreen("completeScreen");
}

function updateHighestProgress() {
  const currentScore = getTotalScore();
  const highestScore = getHighestScore();

  if (currentScore > highestScore) {
    state.highestFloor = state.currentFloor;
    state.highestSublevel = state.currentSublevel;
  }
}

function getBadges(score) {
  const badges = [];
  if (score >= 12) badges.push("First Climb");
  if (score >= 24) badges.push("Focused Solver");
  if (score >= 48) badges.push("Math Climber");
  if (score >= 84) badges.push("Elite Climber");
  if (score >= 108) badges.push("Tower Master");
  if (score >= TOTAL_TOWER_SCORE) badges.push("Perfect Legend");
  if (score >= 60 && state.elapsedSeconds <= 600) badges.push("Fast Climber");
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
  const studentKey = makeStudentDocId(progress.name, progress.section, progress.school);
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
        bestProgressKey: progress.progressKey
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
          bestProgressKey: existingData.bestProgressKey || existingData.progressKey || ""
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
  const progressKey = `${state.runId}_${reached.floor}_${reached.sublevel}_${state.status}_${state.elapsedSeconds}`;

  return {
    // Student information
    name: cleanName,
    section: cleanSection,
    school: cleanSchool,
    studentKey: makeStudentDocId(cleanName, cleanSection, cleanSchool),

    // Progress fields used by the Grade 10 Mastery Tower
    currentFloor: reached.floor,
    currentSublevel: reached.sublevel,
    totalScore: reached.score,
    timeUsedSeconds: state.elapsedSeconds,
    timeUsedFormatted: formatTime(state.elapsedSeconds),
    status: state.status,

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

    renderLeaderboardRows(allTimeBody, allTimeRecords, "Tower Master");
    renderLeaderboardRows(weeklyBody, weeklyRecords, "Little Tower Master");

    if (!allTimeRecords.length && allTimeMsg) allTimeMsg.textContent = "No all-time leaderboard records yet.";
    if (!weeklyRecords.length && weeklyMsg) weeklyMsg.textContent = "No weekly leaderboard records yet.";
  } catch (error) {
    console.error("Leaderboard loading failed:", error);
    if (msg) msg.textContent = "Leaderboard loading failed. Please check your Firebase setup or internet connection.";
  }
}

async function getAllTimeLeaderboardRecords() {
  const snapshot = await db.collection(LEADERBOARD_COLLECTION).get();
  const bestByStudent = new Map();

  snapshot.forEach((doc) => {
    const record = normalizeLeaderboardRecord(doc.data());
    if (!record.name || !record.section) return;

    const key = makeStudentDocId(record.name, record.section, record.school);
    const existing = bestByStudent.get(key);

    if (!existing || isBetterRecord(record, existing)) {
      bestByStudent.set(key, record);
    }
  });

  return sortLeaderboardRecords([...bestByStudent.values()]).slice(0, 10);
}

async function getWeeklyLeaderboardRecords() {
  return getLeaderboardRecordsByWeekId(getWeekId());
}

async function getPreviousWeekLeaderboardRecords() {
  return getLeaderboardRecordsByWeekId(getPreviousWeekId());
}

async function getPreviousMonthLeaderboardRecords() {
  const previousMonth = getPreviousMonthPeriod();
  const previousMonthId = formatLeaderboardMonthId(previousMonth.year, previousMonth.month);

  const snapshot = await db.collection(LEADERBOARD_COLLECTION).get();
  const bestByStudent = new Map();

  snapshot.forEach((doc) => {
    const rawRecord = doc.data();
    const record = normalizeLeaderboardRecord(rawRecord);
    if (!record.name || !record.section) return;

    const submittedAt = getRecordDate(rawRecord.timestamp || rawRecord.createdAt);
    const matchesMonthId = rawRecord.monthId === previousMonthId || rawRecord.bestMonthId === previousMonthId;
    const matchesDateRange = submittedAt && isDateInPhtMonth(submittedAt, previousMonth.year, previousMonth.month);

    if (!matchesMonthId && !matchesDateRange) return;

    const key = makeStudentDocId(record.name, record.section, record.school);
    const existing = bestByStudent.get(key);

    if (!existing || isBetterRecord(record, existing)) {
      bestByStudent.set(key, record);
    }
  });

  return sortLeaderboardRecords([...bestByStudent.values()]).slice(0, 10);
}

async function getLeaderboardRecordsByWeekId(weekId) {
  const snapshot = await db.collection(LEADERBOARD_COLLECTION).get();
  const bestByStudent = new Map();

  snapshot.forEach((doc) => {
    const rawRecord = doc.data();
    const record = normalizeLeaderboardRecord(rawRecord);
    if (!record.name || !record.section) return;

    const matchesWeek = rawRecord.weekId === weekId || rawRecord.bestWeekId === weekId;
    if (!matchesWeek) return;

    const key = makeStudentDocId(record.name, record.section, record.school);
    const existing = bestByStudent.get(key);

    if (!existing || isBetterRecord(record, existing)) {
      bestByStudent.set(key, record);
    }
  });

  return sortLeaderboardRecords([...bestByStudent.values()]).slice(0, 10);
}

function normalizeLeaderboardRecord(record) {
  return {
    name: record.name,
    section: record.section,
    school: record.school || record.gradeLevel || "",
    studentKey: record.studentKey || makeStudentDocId(record.name, record.section, record.school || record.gradeLevel || ""),
    bestFloor: Number(record.bestFloor ?? record.currentFloor ?? record.floor ?? 1),
    bestSublevel: Number(record.bestSublevel ?? record.currentSublevel ?? record.sublevel ?? 0),
    bestScore: Number(record.bestScore ?? record.totalScore ?? record.score ?? 0),
    bestTimeSeconds: Number(record.bestTimeSeconds ?? record.timeUsedSeconds ?? record.timeUsed ?? 0),
    bestTimeFormatted: record.bestTimeFormatted || record.timeUsedFormatted || formatTime(record.bestTimeSeconds ?? record.timeUsedSeconds ?? record.timeUsed ?? 0),
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
    return (a.bestTimeSeconds || Infinity) - (b.bestTimeSeconds || Infinity);
  });
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
        <td>${record.bestScore || 0}/${TOTAL_TOWER_SCORE}</td>
        <td>${record.bestTimeFormatted || formatTime(record.bestTimeSeconds || 0)}</td>
      </tr>
    `;
  }).join("");
}

async function loadHomepageChampions() {
  const towerMasterName = $("towerMasterName");
  const towerMasterMeta = $("towerMasterMeta");
  const littleMasterName = $("littleTowerMasterName");
  const littleMasterMeta = $("littleTowerMasterMeta");
  const lastWeekLittleMasterName = $("lastWeekLittleMasterName");
  const lastWeekLittleMasterMeta = $("lastWeekLittleMasterMeta");
  const monthlyTowerChampionName = $("monthlyTowerChampionName");
  const monthlyTowerChampionMeta = $("monthlyTowerChampionMeta");

  if (!towerMasterName || !littleMasterName) return;

  if (!firebaseReady || !db) {
    towerMasterName.textContent = "No champion yet";
    towerMasterMeta.textContent = "Connect Firebase to load champion";
    littleMasterName.textContent = "No weekly champion yet";
    littleMasterMeta.textContent = "Connect Firebase to load champion";
    if (lastWeekLittleMasterName && lastWeekLittleMasterMeta) {
      lastWeekLittleMasterName.textContent = "No previous weekly champion yet.";
      lastWeekLittleMasterMeta.textContent = "Connect Firebase to load previous champion";
    }
    if (monthlyTowerChampionName && monthlyTowerChampionMeta) {
      monthlyTowerChampionName.textContent = "No monthly champion yet.";
      monthlyTowerChampionMeta.textContent = "Connect Firebase to load monthly champion";
    }
    return;
  }

  try {
    const [allTimeRecords, weeklyRecords, previousWeekRecords, previousMonthRecords] = await Promise.all([
      getAllTimeLeaderboardRecords(),
      getWeeklyLeaderboardRecords(),
      getPreviousWeekLeaderboardRecords(),
      getPreviousMonthLeaderboardRecords()
    ]);

    updateChampionCard(towerMasterName, towerMasterMeta, allTimeRecords[0], "No champion yet", "All-Time Leaderboard Top 1");
    updateChampionCard(littleMasterName, littleMasterMeta, weeklyRecords[0], "No weekly champion yet", "Weekly Leaderboard Top 1");

    if (lastWeekLittleMasterName && lastWeekLittleMasterMeta) {
      updateChampionCard(
        lastWeekLittleMasterName,
        lastWeekLittleMasterMeta,
        previousWeekRecords[0],
        "No previous weekly champion yet.",
        "Previous completed week’s Weekly Top 1"
      );
    }

    if (monthlyTowerChampionName && monthlyTowerChampionMeta) {
      updateChampionCard(
        monthlyTowerChampionName,
        monthlyTowerChampionMeta,
        previousMonthRecords[0],
        "No monthly champion yet.",
        "Previous completed month’s Top 1"
      );
    }
  } catch (error) {
    console.error("Champion loading failed:", error);
  }
}

function updateChampionCard(nameElement, metaElement, record, emptyText, defaultMeta) {
  if (!record) {
    nameElement.textContent = emptyText;
    metaElement.textContent = defaultMeta;
    return;
  }

  nameElement.textContent = record.name || emptyText;
  const schoolText = record.school ? `, ${record.school}` : "";
  metaElement.textContent = `${record.section || "No section"}${schoolText} • Floor ${record.bestFloor || 1}, Sublevel ${record.bestSublevel || 0} • ${record.bestTimeFormatted || formatTime(record.bestTimeSeconds || 0)}`;
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

  for (let floor = 1; floor <= MAX_FLOORS; floor++) {
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

function makeStudentDocId(name, section, school = "") {
  return `${name}_${section}_${school}`
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
