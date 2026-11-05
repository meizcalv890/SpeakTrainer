const HISTORY_KEY = "speaktrainer_history_v1";
const SETTINGS_KEY = "speaktrainer_settings_v1";
const MATERIALS_KEY = "speaktrainer_materials_v1";

// ========================================
// SAFE STORAGE
// ========================================

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);

    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error(`Storage read error: ${key}`, error);

    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));

    return true;
  } catch (error) {
    console.error(`Storage write error: ${key}`, error);

    if (error.name === "QuotaExceededError") {
      throw new Error("Browser storage is full. Remove some saved data.");
    }

    throw error;
  }
}

// ========================================
// HISTORY
// ========================================

export function getHistory() {
  let history = readJSON(HISTORY_KEY, null);

  // Migrate data from original SpeakTrainer version.

  if (!history) {
    const legacy = readJSON("speakHistory", []);

    history = legacy.map((item, index) => ({
      id: `legacy-${index}-${Date.now()}`,

      date: item.date || new Date().toISOString(),

      level: "easy",

      material: "Legacy practice",

      score: Number(item.score) || 0,

      accuracy: Number(item.accuracy) || 0,

      correct: 0,

      errors: 0,

      missed: 0,

      extra: 0,

      fillerCount: 0,

      wpm: Number(item.wpm) || 0,

      duration: 0,

      transcript: "",
    }));

    writeJSON(HISTORY_KEY, history);
  }

  if (!Array.isArray(history)) {
    return [];
  }

  return history;
}

export function saveSession(session) {
  if (!session || typeof session !== "object") {
    throw new Error("Invalid practice session.");
  }

  const history = getHistory();

  history.push(session);

  writeJSON(HISTORY_KEY, history);

  return session;
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);

  // Clear the old storage key as well.

  localStorage.removeItem("speakHistory");
}

// ========================================
// MATERIALS
// ========================================

export function getMaterials() {
  const materials = readJSON(MATERIALS_KEY, []);

  return Array.isArray(materials) ? materials : [];
}

export function getMaterialById(id) {
  return getMaterials().find((material) => material.id === id) || null;
}

export function saveMaterial(material) {
  if (!material || !material.title?.trim()) {
    throw new Error("Material title is required.");
  }

  if (!material.content?.trim()) {
    throw new Error("Material content is required.");
  }

  const materials = getMaterials();

  const now = new Date().toISOString();

  const existingIndex = materials.findIndex((item) => item.id === material.id);

  const savedMaterial = {
    ...material,

    title: material.title.trim(),

    content: material.content.trim(),

    level: material.level || "easy",

    createdAt: existingIndex >= 0 ? materials[existingIndex].createdAt : now,

    updatedAt: now,
  };

  if (existingIndex >= 0) {
    materials[existingIndex] = savedMaterial;
  } else {
    materials.push(savedMaterial);
  }

  writeJSON(MATERIALS_KEY, materials);

  return savedMaterial;
}

export function deleteMaterial(id) {
  const materials = getMaterials();

  const filtered = materials.filter((item) => item.id !== id);

  writeJSON(MATERIALS_KEY, filtered);
}

export function duplicateMaterial(id) {
  const original = getMaterialById(id);

  if (!original) {
    throw new Error("Material not found.");
  }

  return saveMaterial({
    id: crypto.randomUUID(),

    title: `${original.title} (Copy)`,

    content: original.content,

    level: original.level,
  });
}

// ========================================
// SETTINGS
// ========================================

export function getSettings() {
  return readJSON(SETTINGS_KEY, {
    language: "id-ID",

    theme: "light",
  });
}

export function saveSettings(updates) {
  const current = getSettings();

  const updated = {
    ...current,

    ...updates,
  };

  writeJSON(SETTINGS_KEY, updated);

  return updated;
}
