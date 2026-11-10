import {
  getMaterials,
  saveMaterial,
  deleteMaterial,
  duplicateMaterial,
} from "./storage.js";

// ========================================
// DOM
// ========================================

const $ = (id) => document.getElementById(id);

let activeMaterial = null;

// ========================================
// HELPERS
// ========================================

function createId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function estimateReadingTime(text) {
  const words = countWords(text);

  if (!words) {
    return 0;
  }

  // Average presentation reading speed:
  // approximately 130 words per minute.

  return Math.max(1, Math.ceil(words / 130));
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",

    month: "short",

    year: "numeric",
  });
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

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  link.download = filename;

  document.body.appendChild(link);

  link.click();

  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeFilename(title) {
  return (
    title
      .trim()
      .replace(/[\\/:*?"<>|]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 80) || "speaktrainer-material"
  );
}

// ========================================
// EDITOR
// ========================================

export function openMaterialEditor(material = null) {
  activeMaterial = material;

  $("materialEditor").hidden = false;

  $("editorHeading").textContent = material
    ? "Edit material"
    : "Create new material";

  $("materialId").value = material?.id || "";

  $("materialTitle").value = material?.title || "";

  $("materialLevel").value = material?.level || "easy";

  $("materialContent").value = material?.content || "";

  updateEditorStats();

  $("materialEditor").scrollIntoView({
    behavior: "smooth",

    block: "start",
  });

  $("materialTitle").focus();
}

export function closeMaterialEditor() {
  $("materialEditor").hidden = true;

  activeMaterial = null;
}

function updateEditorStats() {
  const text = $("materialContent").value;

  const words = countWords(text);

  const readingTime = estimateReadingTime(text);

  $("editorWordCount").textContent = `${words} WORDS`;

  $("readingEstimate").textContent =
    `${readingTime} minute${readingTime === 1 ? "" : "s"}`;
}

$("materialContent").addEventListener("input", updateEditorStats);

// ========================================
// SAVE MATERIAL
// ========================================

export function handleSaveMaterial() {
  const title = $("materialTitle").value;

  const content = $("materialContent").value;

  const level = $("materialLevel").value;

  const id = $("materialId").value || createId();

  if (!title.trim()) {
    throw new Error("Please enter a material title.");
  }

  if (!content.trim()) {
    throw new Error("Please enter your speaking material.");
  }

  if (countWords(content) > 10000) {
    throw new Error("Material is too long. Maximum is 10,000 words.");
  }

  const saved = saveMaterial({
    id,

    title,

    content,

    level,
  });

  closeMaterialEditor();

  renderMaterials();

  return saved;
}

// ========================================
// IMPORT FILE
// ========================================

export async function importMaterialFile(file) {
  if (!file) {
    return null;
  }

  const extension = file.name.split(".").pop().toLowerCase();

  if (!["txt", "docx", "pdf"].includes(extension)) {
    throw new Error("Unsupported format. Use TXT, DOCX, or PDF.");
  }

  let content = "";

  // TXT

  if (extension === "txt") {
    content = await file.text();
  }

  // DOCX
  else if (extension === "docx") {
    if (!window.mammoth) {
      throw new Error(
        "DOCX reader is unavailable. Check your internet connection.",
      );
    }

    const arrayBuffer = await file.arrayBuffer();

    const result = await window.mammoth.extractRawText({
      arrayBuffer,
    });

    content = result.value;
  }

  // PDF
  else if (extension === "pdf") {
    if (!window.pdfjsLib) {
      throw new Error(
        "PDF reader is unavailable. Check your internet connection.",
      );
    }

    const arrayBuffer = await file.arrayBuffer();

    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    const pdf = await window.pdfjsLib.getDocument({
      data: arrayBuffer,
    }).promise;

    const pages = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);

      const textContent = await page.getTextContent();

      const pageText = textContent.items
        .filter((item) => typeof item.str === "string")
        .map((item) => item.str)
        .join(" ");

      pages.push(pageText);
    }

    content = pages.join("\n\n");
  }

  content = content
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!content) {
    throw new Error("No readable text found in this document.");
  }

  if (countWords(content) > 10000) {
    throw new Error("This document exceeds the 10,000-word limit.");
  }

  const title = file.name.replace(/\.[^.]+$/, "");

  openMaterialEditor({
    id: "",

    title,

    content,

    level: "easy",
  });

  return {
    title,

    wordCount: countWords(content),
  };
}

// ========================================
// EXPORT TXT
// ========================================

export function exportTXT(material) {
  const content = [
    material.title,

    "",

    `Difficulty: ${material.level}`,

    "",

    material.content,
  ].join("\n");

  const blob = new Blob(
    [content],

    { type: "text/plain;charset=utf-8" },
  );

  downloadBlob(
    blob,

    `${safeFilename(material.title)}.txt`,
  );
}

// ========================================
// EXPORT DOCX
// ========================================

export async function exportDOCX(material) {
  if (!window.docx) {
    throw new Error("DOCX export library is unavailable.");
  }

  const {
    Document,

    Packer,

    Paragraph,

    TextRun,

    HeadingLevel,
  } = window.docx;

  const paragraphs = [
    new Paragraph({
      text: material.title,

      heading: HeadingLevel.TITLE,
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: `Difficulty: ${material.level}`,

          italics: true,

          color: "777777",
        }),
      ],
    }),

    new Paragraph({
      text: "",
    }),
  ];

  const contentParagraphs = material.content.split(/\n/).map(
    (line) =>
      new Paragraph({
        children: [
          new TextRun({
            text: line || " ",
          }),
        ],
      }),
  );

  paragraphs.push(...contentParagraphs);

  const document = new Document({
    sections: [
      {
        properties: {},

        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(document);

  downloadBlob(
    blob,

    `${safeFilename(material.title)}.docx`,
  );
}

// ========================================
// EXPORT PDF
// ========================================

export function exportPDF(material) {
  if (!window.jspdf?.jsPDF) {
    throw new Error("PDF export library is unavailable.");
  }

  const { jsPDF } = window.jspdf;

  const pdf = new jsPDF({
    orientation: "portrait",

    unit: "mm",

    format: "a4",
  });

  const margin = 20;

  const pageWidth = pdf.internal.pageSize.getWidth();

  const pageHeight = pdf.internal.pageSize.getHeight();

  const usableWidth = pageWidth - margin * 2;

  let y = 24;

  pdf.setFont("helvetica", "bold");

  pdf.setFontSize(19);

  const titleLines = pdf.splitTextToSize(
    material.title,

    usableWidth,
  );

  pdf.text(titleLines, margin, y);

  y += titleLines.length * 9 + 5;

  pdf.setFont("helvetica", "normal");

  pdf.setFontSize(9);

  pdf.setTextColor(110, 110, 110);

  pdf.text(
    `Difficulty: ${material.level}`,

    margin,

    y,
  );

  y += 13;

  pdf.setDrawColor(220, 220, 220);

  pdf.line(margin, y, pageWidth - margin, y);

  y += 10;

  pdf.setFont("helvetica", "normal");

  pdf.setFontSize(11);

  pdf.setTextColor(40, 40, 40);

  const lines = pdf.splitTextToSize(
    material.content,

    usableWidth,
  );

  for (const line of lines) {
    if (y > pageHeight - margin) {
      pdf.addPage();

      y = margin;
    }

    pdf.text(line, margin, y);

    y += 6;
  }

  pdf.save(`${safeFilename(material.title)}.pdf`);
}

// ========================================
// EXPORT MENU
// ========================================

export async function exportMaterial(material, format) {
  switch (format) {
    case "txt":
      exportTXT(material);

      break;

    case "docx":
      await exportDOCX(material);

      break;

    case "pdf":
      exportPDF(material);

      break;

    default:
      throw new Error("Unknown export format.");
  }
}

// ========================================
// MATERIAL LIST
// ========================================

export function renderMaterials() {
  const materials = getMaterials();

  const container = $("materialList");

  const empty = $("materialEmpty");

  $("materialCount").textContent = `${materials.length} MATERIALS`;

  $("materialNavCount").textContent = materials.length;

  container.innerHTML = "";

  empty.hidden = materials.length > 0;

  materials
    .slice()
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .forEach((material) => {
      const words = countWords(material.content);

      if (window.lucide?.createIcons) {
        window.lucide.createIcons({
          attrs: {
            "stroke-width": 1.8,
          },
        });
      }

      const card = document.createElement("article");

      card.className = "material-card";

      card.innerHTML = `

                <div class="material-card-top">

                      <div class="material-file-icon">
                          <i data-lucide="file-text"></i>
                      </div>

                    <span class="panel-tag">
                        ${escapeHTML(material.level.toUpperCase())}
                    </span>

                </div>


                <h3>${escapeHTML(material.title)}</h3>


                <p class="material-description">
                    ${escapeHTML(material.content.slice(0, 125))}
                    ${material.content.length > 125 ? "..." : ""}
                </p>


                <div class="material-meta">

                    <span>${words} WORDS</span>

                    <span>
                        ${estimateReadingTime(material.content)} MIN READ
                    </span>

                    <span>
                        UPDATED ${formatDate(material.updatedAt)}
                    </span>

                </div>


                <div class="material-actions">

                    <button class="primary-btn"
                        data-action="use"
                        data-id="${escapeHTML(material.id)}">
                        Use for practice
                    </button>


                    <button class="secondary-btn"
                        data-action="edit"
                        data-id="${escapeHTML(material.id)}">
                        Edit
                    </button>


                    <select aria-label="Export material"
                        data-action="export"
                        data-id="${escapeHTML(material.id)}">

                        <option value="">Export ↓</option>

                        <option value="txt">TXT</option>

                        <option value="docx">DOCX</option>

                        <option value="pdf">PDF</option>

                    </select>


                    <button class="secondary-btn"
                        data-action="duplicate"
                        data-id="${escapeHTML(material.id)}">
                        Duplicate
                    </button>


                    <button class="danger-btn"
                        data-action="delete"
                        data-id="${escapeHTML(material.id)}">
                        Delete
                    </button>

                </div>

            `;

      container.appendChild(card);
    });
}

// ========================================
// MATERIAL ACTIONS
// ========================================

export function findMaterial(id) {
  return getMaterials().find((material) => material.id === id) || null;
}

export function handleDeleteMaterial(id) {
  deleteMaterial(id);

  renderMaterials();
}

export function handleDuplicateMaterial(id) {
  const duplicate = duplicateMaterial(id);

  renderMaterials();

  return duplicate;
}

// ========================================
// EVENTS
// ========================================

$("materialList").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");

  if (!button) {
    return;
  }

  const action = button.dataset.action;

  const id = button.dataset.id;

  const material = findMaterial(id);

  if (!material) {
    return;
  }

  try {
    if (action === "edit") {
      openMaterialEditor(material);
    } else if (action === "delete") {
      const confirmed = confirm(`Delete "${material.title}"?`);

      if (confirmed) {
        handleDeleteMaterial(id);
      }
    } else if (action === "duplicate") {
      handleDuplicateMaterial(id);
    } else if (action === "use") {
      window.dispatchEvent(
        new CustomEvent("speaktrainer:use-material", {
          detail: material,
        }),
      );
    }
  } catch (error) {
    console.error(error);

    alert(error.message);
  }
});

$("materialList").addEventListener("change", async (event) => {
  const select = event.target.closest('[data-action="export"]');

  if (!select || !select.value) {
    return;
  }

  const material = findMaterial(select.dataset.id);

  const format = select.value;

  select.value = "";

  try {
    await exportMaterial(material, format);
  } catch (error) {
    console.error(error);

    alert(error.message);
  }
});
