const fillers = new Set([
  "eh",
  "emm",
  "hmm",
  "eee",
  "anu",
  "haa",
  "kayak",
  "gitu",
  "jadi",
  "apa",
  "apa ya",
  "well",
  "um",
  "uh",
  "like",
]);

// ========================================
// NORMALIZE
// ========================================

function normalizeWord(word) {
  return word

    .toLocaleLowerCase("id-ID")

    .replace(/[.,!?;:"()[\]{}]/g, "")

    .trim();
}

function tokenize(text) {
  return text

    .trim()

    .split(/\s+/)

    .map(normalizeWord)

    .filter(Boolean);
}

// ========================================
// ALIGNMENT
// ========================================

function alignWords(targetWords, spokenWords) {
  const n = targetWords.length;

  const m = spokenWords.length;

  // Prevent excessive memory use.

  if (n * m > 1000000) {
    throw new Error(
      "Text is too long to compare safely. Use a shorter material.",
    );
  }

  const dp = Array.from(
    { length: n + 1 },

    () => new Uint32Array(m + 1),
  );

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (targetWords[i] === spokenWords[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(
          dp[i + 1][j],

          dp[i][j + 1],
        );
      }
    }
  }

  const alignment = [];

  let i = 0;

  let j = 0;

  while (i < n && j < m) {
    if (targetWords[i] === spokenWords[j]) {
      alignment.push({
        type: "correct",

        target: targetWords[i],

        spoken: spokenWords[j],
      });

      i++;

      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      alignment.push({
        type: "missed",

        target: targetWords[i],

        spoken: "",
      });

      i++;
    } else {
      alignment.push({
        type: "extra",

        target: "",

        spoken: spokenWords[j],
      });

      j++;
    }
  }

  while (i < n) {
    alignment.push({
      type: "missed",

      target: targetWords[i],

      spoken: "",
    });

    i++;
  }

  while (j < m) {
    alignment.push({
      type: "extra",

      target: "",

      spoken: spokenWords[j],
    });

    j++;
  }

  // Reclassify unmatched words as substitutions where possible.

  for (let index = 0; index < alignment.length - 1; index++) {
    const current = alignment[index];

    const next = alignment[index + 1];

    if (current.type === "missed" && next.type === "extra") {
      current.type = "wrong";

      current.spoken = next.spoken;

      alignment.splice(index + 1, 1);
    }
  }

  return alignment;
}

// ========================================
// FILLER COUNT
// ========================================

function countFillers(words) {
  let count = 0;

  words.forEach((word) => {
    if (fillers.has(word)) {
      count++;
    }
  });

  return count;
}

// ========================================
// PACE SCORE
// ========================================

function calculatePaceScore(wpm) {
  // Practice target: approximately 120–160 WPM.

  if (wpm >= 120 && wpm <= 160) {
    return 20;
  }

  if (wpm >= 100 && wpm < 120) {
    return 16;
  }

  if (wpm > 160 && wpm <= 180) {
    return 16;
  }

  if (wpm >= 80 && wpm < 100) {
    return 12;
  }

  if (wpm > 180 && wpm <= 200) {
    return 12;
  }

  if (wpm > 0) {
    return 8;
  }

  return 0;
}

// ========================================
// SUGGESTIONS
// ========================================

function generateSuggestions(data) {
  const suggestions = [];

  if (data.accuracy < 70) {
    suggestions.push(
      "Read the material in shorter sections and focus on clear pronunciation.",
    );
  } else {
    suggestions.push(
      "Your text delivery is developing well. Continue maintaining clarity.",
    );
  }

  if (data.fillerCount >= 5) {
    suggestions.push(
      "Try replacing filler words with short, intentional pauses.",
    );
  } else {
    suggestions.push(
      "Continue keeping unnecessary filler words under control.",
    );
  }

  if (data.wpm < 100) {
    suggestions.push(
      "Try increasing your speaking pace gradually while maintaining clarity.",
    );
  } else if (data.wpm > 180) {
    suggestions.push(
      "Slow down slightly and give your audience time to process each idea.",
    );
  } else {
    suggestions.push("Maintain a comfortable speaking pace.");
  }

  if (data.missed > 0) {
    suggestions.push(
      "Pay attention to words that were missed during the reading.",
    );
  }

  return suggestions;
}

// ========================================
// ANALYZE SPEECH
// ========================================

export function analyzeSpeech(targetText, spokenText, duration) {
  if (!targetText?.trim()) {
    throw new Error("Practice material is empty.");
  }

  if (!spokenText?.trim()) {
    throw new Error("No speech was detected.");
  }

  const targetWords = tokenize(targetText);

  const spokenWords = tokenize(spokenText);

  if (!targetWords.length || !spokenWords.length) {
    throw new Error("Unable to analyze the provided text.");
  }

  const alignment = alignWords(
    targetWords,

    spokenWords,
  );

  const correct = alignment.filter((item) => item.type === "correct").length;

  const errors = alignment.filter((item) => item.type === "wrong").length;

  const missed = alignment.filter((item) => item.type === "missed").length;

  const extra = alignment.filter((item) => item.type === "extra").length;

  const accuracy = Math.round((correct / targetWords.length) * 100);

  const fillerCount = countFillers(spokenWords);

  const safeDuration = Math.max(
    1,

    Math.floor(Number(duration) || 1),
  );

  const wpm = Math.round((spokenWords.length / safeDuration) * 60);

  // ====================================
  // SCORE
  // ====================================

  const accuracyScore = Math.round((accuracy / 100) * 60);

  const fillerScore = Math.max(
    0,

    20 - fillerCount * 2,
  );

  const paceScore = calculatePaceScore(wpm);

  const score = Math.min(
    100,

    Math.max(
      0,

      accuracyScore + fillerScore + paceScore,
    ),
  );

  let feedback;

  if (score >= 90) {
    feedback = "Excellent progress. Your practice performance is very strong.";
  } else if (score >= 75) {
    feedback = "Good progress. Keep improving your delivery.";
  } else if (score >= 50) {
    feedback = "You are making progress. Focus on clarity and consistency.";
  } else {
    feedback = "Keep practicing. Break the material into smaller sections.";
  }

  const result = {
    score,

    accuracy,

    correct,

    errors,

    missed,

    extra,

    fillerCount,

    wpm,

    duration: safeDuration,

    accuracyScore,

    fillerScore,

    paceScore,

    alignment,

    feedback,
  };

  result.suggestions = generateSuggestions(result);

  return result;
}

// ========================================
// COMPARISON HTML
// ========================================

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

export function renderComparison(alignment) {
  if (!alignment?.length) {
    return "No comparison available.";
  }

  return alignment
    .map((item) => {
      if (item.type === "correct") {
        return `<span class="correct" title="Correct">${escapeHTML(item.spoken)}</span>`;
      }

      if (item.type === "wrong") {
        return `<span class="wrong" title="Expected: ${escapeHTML(item.target)}">${escapeHTML(item.spoken)}</span>`;
      }

      if (item.type === "missed") {
        return `<span class="missed" title="Missed: ${escapeHTML(item.target)}">[${escapeHTML(item.target)}]</span>`;
      }

      return `<span class="extra" title="Extra word">${escapeHTML(item.spoken)}</span>`;
    })
    .join(" ");
}
