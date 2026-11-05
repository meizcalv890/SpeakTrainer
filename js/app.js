import { SpeechController } from "./speech.js";

import { analyzeSpeech, renderComparison } from "./analyzer.js";

import {
  getHistory,
  saveSession,
  clearHistory,
  getSettings,
  saveSettings,
  getMaterials,
} from "./storage.js";

import { renderDashboard, renderHistory } from "./dashboard.js";

import {
  openMaterialEditor,
  closeMaterialEditor,
  handleSaveMaterial,
  importMaterialFile,
  renderMaterials,
  findMaterial,
} from "./materials.js";

// ========================================
// DOM
// ========================================

const $ = (id) => document.getElementById(id);

const startBtn = $("startBtn");

const stopBtn = $("stopBtn");

const targetText = $("targetText");

const transcriptDiv = $("transcript");

const comparisonDiv = $("comparison");

const resultDiv = $("result");

const durationEl = $("duration");

const wordCountEl = $("wordCount");

const levelSelect = $("levelSelect");

const textSelect = $("textSelect");

const languageSelect = $("languageSelect");

const speechStatus = $("speechStatus");

const micCircle = $("micCircle");

const micMessage = $("micMessage");

const recordingLabel = $("recordingLabel");

const sessionStatus = $("sessionStatus");

const toastElement = $("toast");

// ========================================
// PRACTICE MATERIALS
// ========================================

const materials = {
  easy: [
    {
      title: "Introduction to Public Speaking",

      text: "Public speaking adalah kemampuan menyampaikan informasi kepada audiens dengan jelas dan percaya diri.",
    },

    {
      title: "My Daily Routine",

      text: "Setiap hari saya berusaha menjadi pribadi yang lebih baik. Saya belajar hal baru dan mengembangkan kemampuan diri.",
    },

    {
      title: "The Importance of Learning",

      text: "Belajar merupakan proses penting untuk mengembangkan pengetahuan, keterampilan, dan kemampuan berpikir seseorang.",
    },
  ],

  medium: [
    {
      title: "Communication Skills",

      text: "Kemampuan berbicara di depan umum sangat penting karena membantu seseorang menyampaikan ide, memengaruhi audiens, dan membangun kepercayaan diri dalam berbagai situasi.",
    },

    {
      title: "Technology and Society",

      text: "Perkembangan teknologi telah mengubah cara manusia bekerja, belajar, dan berkomunikasi. Oleh karena itu, kita perlu menggunakan teknologi secara bijaksana.",
    },

    {
      title: "Building Confidence",

      text: "Kepercayaan diri tidak muncul secara instan. Seseorang perlu membangun kebiasaan positif, berani mencoba hal baru, dan belajar dari setiap pengalaman.",
    },
  ],

  hard: [
    {
      title: "Leadership and Professionalism",

      text: "Public speaking merupakan keterampilan komunikasi yang memungkinkan seseorang menyampaikan gagasan secara efektif, membangun hubungan dengan audiens, serta meningkatkan kemampuan kepemimpinan dan profesionalisme dalam berbagai bidang kehidupan.",
    },

    {
      title: "Critical Thinking",

      text: "Kemampuan berpikir kritis memungkinkan seseorang mengevaluasi informasi secara objektif, mengidentifikasi berbagai sudut pandang, serta mengambil keputusan berdasarkan pertimbangan yang rasional dan bertanggung jawab.",
    },

    {
      title: "The Future of Innovation",

      text: "Inovasi bukan sekadar menciptakan sesuatu yang baru, melainkan mengembangkan solusi yang mampu memberikan manfaat nyata bagi masyarakat melalui kreativitas, kolaborasi, dan pemanfaatan teknologi.",
    },
  ],
};

// ========================================
// STATE
// ========================================

const speech = new SpeechController();

let transcriptText = "";

let startTime = 0;

let timer = null;

let elapsedSeconds = 0;

let sessionActive = false;

let sessionFinalized = false;

let toastTimer = null;

let selectedCustomMaterial = null;

// ========================================
// HELPERS
// ========================================

function createId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);

  const remaining = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

function escapeHTML(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",

        "<": "&lt;",

        ">": "&gt;",

        '"': "&quot;",

        "'": "&#039;",
      })[character],
  );
}

// ========================================
// TOAST
// ========================================

function showToast(message) {
  toastElement.textContent = message;

  toastElement.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toastElement.classList.remove("show");
  }, 3000);
}

// ========================================
// NAVIGATION
// ========================================

function navigate(viewName) {
  if (sessionActive && viewName !== "practice") {
    showToast("Finish your current practice before leaving.");

    return;
  }

  document.querySelectorAll("[data-view-panel]").forEach((panel) => {
    panel.classList.toggle(
      "active",

      panel.dataset.viewPanel === viewName,
    );
  });

  document.querySelectorAll(".nav-item[data-view]").forEach((button) => {
    button.classList.toggle(
      "active",

      button.dataset.view === viewName,
    );
  });

  const titles = {
    dashboard: "Dashboard",

    practice: "Practice Studio",

    materials: "My Materials",

    history: "Practice History",

    settings: "Settings",
  };

  $("pageTitle").textContent = titles[viewName] || "Dashboard";

  if (viewName === "dashboard") {
    renderDashboard();
  }

  if (viewName === "materials") {
    renderMaterials();
  }

  if (viewName === "history") {
    renderHistory();
  }

  $("sidebar").classList.remove("open");

  $("sidebarOverlay").classList.remove("show");
}

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();

    navigate(button.dataset.view);
  });
});

document.querySelectorAll("[data-go]").forEach((button) => {
  button.addEventListener("click", () => {
    navigate(button.dataset.go);
  });
});

// ========================================
// MOBILE MENU
// ========================================

$("menuBtn").addEventListener("click", () => {
  $("sidebar").classList.toggle("open");

  $("sidebarOverlay").classList.toggle("show");
});

$("sidebarOverlay").addEventListener("click", () => {
  $("sidebar").classList.remove("open");

  $("sidebarOverlay").classList.remove("show");
});

// ========================================
// MATERIAL SELECTION
// ========================================

function populateMaterials() {
  const level = levelSelect.value;

  const builtIn = materials[level];

  textSelect.innerHTML = "";

  // Built-in materials.

  const builtInGroup = document.createElement("optgroup");

  builtInGroup.label = "Built-in materials";

  builtIn.forEach((item, index) => {
    const option = document.createElement("option");

    option.value = `builtin-${index}`;

    option.textContent = item.title;

    builtInGroup.appendChild(option);
  });

  textSelect.appendChild(builtInGroup);

  // User materials.

  const customMaterials = getMaterials();

  if (customMaterials.length) {
    const customGroup = document.createElement("optgroup");

    customGroup.label = "My materials";

    customMaterials.forEach((item) => {
      const option = document.createElement("option");

      option.value = `custom-${item.id}`;

      option.textContent = item.title;

      customGroup.appendChild(option);
    });

    textSelect.appendChild(customGroup);
  }

  // Preserve selected custom material when possible.

  if (
    selectedCustomMaterial &&
    customMaterials.some((item) => item.id === selectedCustomMaterial.id)
  ) {
    textSelect.value = `custom-${selectedCustomMaterial.id}`;
  } else {
    textSelect.value = "builtin-0";
  }

  updateTargetText();
}

function updateTargetText() {
  const value = textSelect.value;

  if (value.startsWith("custom-")) {
    const id = value.slice(7);

    const material = findMaterial(id);

    if (!material) {
      selectedCustomMaterial = null;

      return;
    }

    selectedCustomMaterial = material;

    targetText.textContent = material.content;
  } else {
    selectedCustomMaterial = null;

    const index = Number(value.replace("builtin-", ""));

    const selected =
      materials[levelSelect.value][index] || materials[levelSelect.value][0];

    targetText.textContent = selected.text;
  }

  const words = countWords(targetText.textContent);

  $("promptWordCount").textContent = `${words} WORDS`;

  resetAnalysis();
}

levelSelect.addEventListener("change", populateMaterials);

textSelect.addEventListener("change", updateTargetText);

// ========================================
// RESET ANALYSIS
// ========================================

function resetAnalysis() {
  transcriptText = "";

  transcriptDiv.textContent = "Your speech transcript will appear here.";

  comparisonDiv.textContent = "Complete a session to compare your speech.";

  resultDiv.textContent =
    "Complete a practice session to generate your report.";

  wordCountEl.textContent = "0";

  durationEl.textContent = "00:00";
}

// ========================================
// CUSTOM MATERIAL EVENT
// ========================================

window.addEventListener("speaktrainer:use-material", (event) => {
  const material = event.detail;

  if (!material) {
    return;
  }

  selectedCustomMaterial = material;

  levelSelect.value = material.level;

  populateMaterials();

  textSelect.value = `custom-${material.id}`;

  updateTargetText();

  navigate("practice");

  showToast(`"${material.title}" selected for practice.`);
});

// ========================================
// MATERIAL BUTTONS
// ========================================

$("newMaterialBtn").addEventListener("click", () => {
  openMaterialEditor();
});

$("closeEditorBtn").addEventListener("click", () => {
  closeMaterialEditor();
});

$("cancelMaterialBtn").addEventListener("click", () => {
  closeMaterialEditor();
});

$("saveMaterialBtn").addEventListener("click", () => {
  try {
    const saved = handleSaveMaterial();

    selectedCustomMaterial = saved;

    populateMaterials();

    renderMaterials();

    showToast("Material saved successfully.");
  } catch (error) {
    showToast(error.message);
  }
});

document
  .querySelector('[data-action="new-material"]')
  .addEventListener("click", () => {
    openMaterialEditor();
  });

// ========================================
// IMPORT DOCUMENT
// ========================================

$("materialFile").addEventListener("change", async (event) => {
  const file = event.target.files[0];

  if (!file) {
    return;
  }

  showToast("Reading document...");

  try {
    const result = await importMaterialFile(file);

    if (result) {
      showToast(`Document imported: ${result.wordCount} words.`);
    }
  } catch (error) {
    console.error(error);

    showToast(error.message);
  } finally {
    event.target.value = "";
  }
});

// ========================================
// TIMER
// ========================================

function startTimer() {
  startTime = Date.now();

  elapsedSeconds = 0;

  clearInterval(timer);

  timer = setInterval(() => {
    elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);

    durationEl.textContent = formatTime(elapsedSeconds);
  }, 250);
}

function stopTimer() {
  clearInterval(timer);

  elapsedSeconds = Math.max(
    1,

    Math.floor((Date.now() - startTime) / 1000),
  );

  durationEl.textContent = formatTime(elapsedSeconds);
}

// ========================================
// RECORDING UI
// ========================================

function setRecordingUI(active) {
  startBtn.disabled = active;

  stopBtn.disabled = !active;

  micCircle.classList.toggle("recording", active);

  recordingLabel.classList.toggle("recording", active);

  sessionStatus.classList.toggle("recording", active);

  if (active) {
    micMessage.textContent = "Listening... speak naturally.";

    recordingLabel.textContent = "RECORDING";

    speechStatus.textContent = "Active";

    sessionStatus.innerHTML =
      '<span class="status-dot"></span> Session in progress';
  } else {
    micMessage.textContent = "Your microphone is ready.";

    recordingLabel.textContent = "STANDBY";

    speechStatus.textContent = "Ready";

    sessionStatus.innerHTML =
      '<span class="status-dot"></span> Ready to practice';
  }
}

// ========================================
// START PRACTICE
// ========================================

startBtn.addEventListener("click", () => {
  if (!speech.supported) {
    showToast("Speech Recognition is not supported in this browser.");

    return;
  }

  if (!targetText.textContent.trim()) {
    showToast("Select a valid practice material.");

    return;
  }

  transcriptText = "";

  elapsedSeconds = 0;

  sessionFinalized = false;

  sessionActive = true;

  transcriptDiv.textContent = "Listening for your speech...";

  comparisonDiv.textContent = "Analysis will appear after the session.";

  resultDiv.textContent = "Waiting for the session to finish.";

  const started = speech.start({
    language: languageSelect.value,

    onUpdate: (data) => {
      transcriptText = data.transcript;

      transcriptDiv.textContent = transcriptText || "Listening...";

      wordCountEl.textContent = countWords(transcriptText);
    },

    onStatus: (status) => {
      if (status === "recording") {
        setRecordingUI(true);
      }
    },

    onError: (message) => {
      showToast(message);
    },

    onStopped: () => {
      finishSession();
    },
  });

  if (!started) {
    sessionActive = false;

    setRecordingUI(false);

    return;
  }

  setRecordingUI(true);

  startTimer();

  showToast("Practice session started.");
});

// ========================================
// STOP PRACTICE
// ========================================

stopBtn.addEventListener("click", () => {
  if (!sessionActive) {
    return;
  }

  stopBtn.disabled = true;

  speech.stop();
});

// ========================================
// FINISH SESSION
// ========================================

function finishSession() {
  if (!sessionActive || sessionFinalized) {
    return;
  }

  sessionFinalized = true;

  sessionActive = false;

  stopTimer();

  setRecordingUI(false);

  if (!transcriptText.trim()) {
    showToast("No speech was detected. This session was not saved.");

    return;
  }

  let analysis;

  try {
    analysis = analyzeSpeech(
      targetText.textContent,

      transcriptText,

      elapsedSeconds,
    );
  } catch (error) {
    showToast(error.message);

    return;
  }

  displayAnalysis(analysis);

  const selectedValue = textSelect.value;

  let materialName = "Built-in material";

  if (selectedValue.startsWith("custom-")) {
    const material = findMaterial(selectedValue.slice(7));

    materialName = material?.title || "Custom material";
  } else {
    const index = Number(selectedValue.replace("builtin-", ""));

    materialName =
      materials[levelSelect.value][index]?.title || "Built-in material";
  }

  const session = {
    id: createId(),

    date: new Date().toISOString(),

    level: levelSelect.value,

    material: materialName,

    score: analysis.score,

    accuracy: analysis.accuracy,

    correct: analysis.correct,

    errors: analysis.errors,

    missed: analysis.missed,

    extra: analysis.extra,

    fillerCount: analysis.fillerCount,

    wpm: analysis.wpm,

    duration: analysis.duration,

    transcript: transcriptText,
  };

  try {
    saveSession(session);
  } catch (error) {
    showToast(`Analysis completed, but saving failed: ${error.message}`);

    return;
  }

  renderDashboard();

  renderHistory();

  showToast("Practice completed and saved.");
}

// ========================================
// DISPLAY ANALYSIS
// ========================================

function displayAnalysis(data) {
  let title = "";

  if (data.score >= 90) {
    title = "Excellent Speaker";
  } else if (data.score >= 75) {
    title = "Good Progress";
  } else if (data.score >= 50) {
    title = "Keep Improving";
  } else {
    title = "Practice Makes Progress";
  }

  resultDiv.innerHTML = `

        <div class="result-header">

            <div class="result-score">
                ${data.score}<small>/100</small>
            </div>

            <div>
                <h3>${title}</h3>
                <p>${escapeHTML(data.feedback)}</p>
            </div>

        </div>


        <div class="result-metrics">

            <div class="result-metric">
                <span>Accuracy</span>
                <strong>${data.accuracy}%</strong>
            </div>

            <div class="result-metric">
                <span>Filler Words</span>
                <strong>${data.fillerCount}</strong>
            </div>

            <div class="result-metric">
                <span>Speaking Pace</span>
                <strong>${data.wpm}</strong>
            </div>

            <div class="result-metric">
                <span>Correct Words</span>
                <strong>${data.correct}</strong>
            </div>

            <div class="result-metric">
                <span>Missed Words</span>
                <strong>${data.missed}</strong>
            </div>

            <div class="result-metric">
                <span>Duration</span>
                <strong>${formatTime(data.duration)}</strong>
            </div>

        </div>


        <div class="eyebrow">SCORE BREAKDOWN</div>

        <div class="score-breakdown">

            <div class="breakdown-item">
                <span>Text accuracy (60%)</span>
                <strong>${data.accuracyScore}/60</strong>
            </div>

            <div class="breakdown-item">
                <span>Filler word control (20%)</span>
                <strong>${data.fillerScore}/20</strong>
            </div>

            <div class="breakdown-item">
                <span>Speaking pace (20%)</span>
                <strong>${data.paceScore}/20</strong>
            </div>

        </div>


        <div class="comparison-section">

            <h3>Improvement suggestions</h3>

            <ul style="padding-left:18px;line-height:2;color:var(--text-secondary);font-size:11px;">

                ${data.suggestions
                  .map((suggestion) => `<li>${escapeHTML(suggestion)}</li>`)
                  .join("")}

            </ul>

        </div>

    `;

  comparisonDiv.innerHTML = renderComparison(data.alignment);
}

// ========================================
// HISTORY MANAGEMENT
// ========================================

function handleClearHistory() {
  if (getHistory().length === 0) {
    showToast("There is no history to delete.");

    return;
  }

  const confirmed = confirm(
    "Delete all practice history? Your saved materials will remain.",
  );

  if (!confirmed) {
    return;
  }

  clearHistory();

  renderDashboard();

  renderHistory();

  showToast("Practice history deleted.");
}

$("clearHistoryBtn").addEventListener(
  "click",

  handleClearHistory,
);

$("settingsClearBtn").addEventListener(
  "click",

  handleClearHistory,
);

// ========================================
// SETTINGS
// ========================================

function initializeSettings() {
  const settings = getSettings();

  languageSelect.value = settings.language || "id-ID";

  $("settingsLanguage").value = settings.language || "id-ID";

  if (settings.theme === "dark") {
    document.body.classList.add("dark");

    $("themeBtn").textContent = "Enable light mode";
  } else {
    document.body.classList.remove("dark");

    $("themeBtn").textContent = "Enable dark mode";
  }
}

function updateLanguage(language) {
  languageSelect.value = language;

  $("settingsLanguage").value = language;

  saveSettings({
    language,
  });

  showToast("Language preference saved.");
}

languageSelect.addEventListener("change", () => {
  updateLanguage(languageSelect.value);
});

$("settingsLanguage").addEventListener("change", () => {
  updateLanguage($("settingsLanguage").value);
});

// ========================================
// THEME
// ========================================

function toggleTheme() {
  const dark = document.body.classList.toggle("dark");

  saveSettings({
    theme: dark ? "dark" : "light",
  });

  $("themeBtn").textContent = dark ? "Enable light mode" : "Enable dark mode";
}

$("themeBtn").addEventListener("click", toggleTheme);

// ========================================
// INITIALIZATION
// ========================================

function initializeApp() {
  initializeSettings();

  populateMaterials();

  renderMaterials();

  renderDashboard();

  renderHistory();

  if (!speech.supported) {
    showToast("Speech Recognition is unavailable in this browser.");
  }

  console.log("SpeakTrainer initialized successfully.");
}

initializeApp();
