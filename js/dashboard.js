import { getHistory } from "./storage.js";

let scoreChart = null;

function formatDate(date) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);

  const remaining = seconds % 60;

  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

// ========================================
// DASHBOARD
// ========================================

export function renderDashboard() {
  const history = getHistory();

  const total = history.length;

  const scores = history.map((item) => Number(item.score) || 0);

  const best = total ? Math.max(...scores) : 0;

  const average = total
    ? Math.round(scores.reduce((a, b) => a + b, 0) / total)
    : 0;

  const totalDuration = history.reduce(
    (sum, item) => sum + (Number(item.duration) || 0),
    0,
  );

  document.getElementById("totalPractice").textContent = total;

  document.getElementById("bestScore").innerHTML =
    `${best}<span class="small-unit">/100</span>`;

  document.getElementById("avgScore").textContent = average;

  document.getElementById("totalDuration").innerHTML =
    `${Math.floor(totalDuration / 60)}<span class="small-unit">min</span>`;

  renderRecent(history);

  renderAchievements(history);

  renderChart(history);
}

// ========================================
// RECENT HISTORY
// ========================================

function renderRecent(history) {
  const tbody = document.getElementById("recentTable");

  const empty = document.getElementById("recentEmpty");

  tbody.innerHTML = "";

  if (history.length === 0) {
    empty.style.display = "block";

    return;
  }

  empty.style.display = "none";

  history
    .slice(-5)
    .reverse()
    .forEach((item, index) => {
      const row = document.createElement("tr");

      const values = [
        `#${history.length - index}`,

        formatDate(item.date),

        item.score,

        `${item.accuracy}%`,

        item.wpm,
      ];

      values.forEach((value, column) => {
        const cell = document.createElement("td");

        if (column === 2) {
          const badge = document.createElement("span");

          badge.className = "score-pill";

          badge.textContent = value;

          cell.appendChild(badge);
        } else {
          cell.textContent = value;
        }

        row.appendChild(cell);
      });

      tbody.appendChild(row);
    });
}

// ========================================
// ACHIEVEMENTS
// ========================================

function renderAchievements(history) {
  const container = document.getElementById("achievementList");

  const achievements = [
    {
      title: "First Steps",
      description: "Complete your first practice session.",
      icon: "✳",
      unlocked: history.length >= 1,
    },

    {
      title: "Consistent Speaker",
      description: "Complete 5 practice sessions.",
      icon: "◷",
      unlocked: history.length >= 5,
    },

    {
      title: "Dedicated Speaker",
      description: "Complete 10 practice sessions.",
      icon: "◎",
      unlocked: history.length >= 10,
    },

    {
      title: "Excellent Speaker",
      description: "Achieve a score of 90 or higher.",
      icon: "★",
      unlocked: history.some((item) => item.score >= 90),
    },

    {
      title: "Perfect Accuracy",
      description: "Achieve 100% transcription accuracy.",
      icon: "✓",
      unlocked: history.some((item) => item.accuracy === 100),
    },
  ];

  container.innerHTML = "";

  achievements.forEach((item) => {
    const element = document.createElement("div");

    element.className = "achievement-item" + (item.unlocked ? "" : " locked");

    const icon = document.createElement("div");

    icon.className = "achievement-icon";

    icon.textContent = item.icon;

    const content = document.createElement("div");

    const title = document.createElement("strong");

    title.textContent = item.title;

    const description = document.createElement("p");

    description.textContent = item.description;

    content.append(title, description);

    element.append(icon, content);

    container.appendChild(element);
  });
}

// ========================================
// CHART
// ========================================

export function renderChart(history = getHistory()) {
  const canvas = document.getElementById("scoreChart");

  const empty = document.getElementById("chartEmpty");

  if (!window.Chart) {
    empty.style.display = "block";

    empty.textContent =
      "Chart library unavailable. Check your internet connection.";

    return;
  }

  if (scoreChart) {
    scoreChart.destroy();
  }

  if (history.length === 0) {
    empty.style.display = "block";
  } else {
    empty.style.display = "none";
  }

  const labels = history.map((_, index) => `#${index + 1}`);

  const scores = history.map((item) => Number(item.score) || 0);

  scoreChart = new Chart(canvas, {
    type: "line",

    data: {
      labels,

      datasets: [
        {
          label: "Practice Score",

          data: scores,

          borderColor: "#6d5ce7",

          backgroundColor: "rgba(109,92,231,0.08)",

          borderWidth: 2.5,

          pointRadius: 4,

          pointBackgroundColor: "#6d5ce7",

          pointBorderWidth: 0,

          fill: true,

          tension: 0.3,
        },
      ],
    },

    options: {
      responsive: true,

      maintainAspectRatio: false,

      plugins: {
        legend: {
          display: false,
        },

        tooltip: {
          backgroundColor: "#20201f",

          padding: 12,

          displayColors: false,
        },
      },

      scales: {
        y: {
          min: 0,

          max: 100,

          ticks: {
            stepSize: 20,

            color: "#999990",

            font: {
              size: 10,
            },
          },

          grid: {
            color: "#eeeeea",
          },
        },

        x: {
          ticks: {
            color: "#999990",

            font: {
              size: 10,
            },
          },

          grid: {
            display: false,
          },
        },
      },
    },
  });
}

// ========================================
// FULL HISTORY
// ========================================

export function renderHistory() {
  const history = getHistory();

  const tbody = document.getElementById("historyTable");

  const empty = document.getElementById("historyEmpty");

  const count = document.getElementById("historyCount");

  tbody.innerHTML = "";

  count.textContent = `${history.length} SESSIONS`;

  if (history.length === 0) {
    empty.style.display = "block";

    return;
  }

  empty.style.display = "none";

  history
    .slice()
    .reverse()
    .forEach((item, index) => {
      const row = document.createElement("tr");

      const values = [
        `#${history.length - index}`,

        formatDate(item.date),

        item.level,

        item.score,

        `${item.accuracy}%`,

        item.fillerCount,

        item.wpm,

        formatDuration(item.duration),
      ];

      values.forEach((value) => {
        const cell = document.createElement("td");

        cell.textContent = value;

        row.appendChild(cell);
      });

      tbody.appendChild(row);
    });
}
