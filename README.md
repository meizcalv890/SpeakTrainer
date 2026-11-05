# SpeakTrainer

**A personal public speaking practice application.**

SpeakTrainer is a browser-based application designed to help users practice public speaking, improve speech delivery, and track their practice progress.

Users can practice with built-in reading materials or create their own materials by writing text or importing documents.

## Features

### Speech Practice
- Speech recognition using the browser's Web Speech API.
- Indonesian speech recognition support.
- Live speech transcription.
- Practice duration and word counter.
- Comparison between target text and spoken transcript.

### Speech Analysis
- Text accuracy calculation.
- Correct, incorrect, missed, and additional word identification.
- Filler word detection.
- Speaking pace estimation (WPM).
- Practice score and improvement suggestions.

### Custom Practice Materials
- Create personal reading materials.
- Edit, duplicate, and delete saved materials.
- Organize materials by difficulty level.
- Import TXT, DOCX, and PDF documents.
- Export materials to TXT, DOCX, and PDF.
- Estimate word count and reading duration.

### Dashboard and Progress
- Total practice sessions.
- Best practice score.
- Average score.
- Total practice duration.
- Practice history.
- Score progression chart.
- Achievement system.

### Application Settings
- Light and dark themes.
- Speech recognition language settings.
- Local browser storage.

## Technology Stack

- HTML5
- CSS3
- JavaScript ES Modules
- Web Speech API
- LocalStorage
- Chart.js
- Mammoth.js
- PDF.js
- docx
- jsPDF

## Project Structure

```text
speaktrainer/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── storage.js
│   ├── speech.js
│   ├── analyzer.js
│   ├── dashboard.js
│   └── materials.js
├── assets/
└── README.md
```

## Getting Started

### Requirements

- A modern browser such as Google Chrome or Microsoft Edge.
- Visual Studio Code.
- Live Server extension for local development.
- Microphone access for speech practice.
- Internet connection for external libraries and browser speech recognition services.

### Run Locally

1. Clone this repository:

   ```bash
   git clone https://github.com/meizcalv890/SpeakTrainer
   ```

2. Open the project folder in Visual Studio Code.

3. Install or enable the Live Server extension.

4. Right-click `index.html`.

5. Select **Open with Live Server**.

6. Allow microphone access when prompted.

## Data Storage

SpeakTrainer stores practice history, application settings, and custom practice materials locally in the browser.

Data is not automatically synchronized between devices or browsers.

Clearing browser site data may remove locally stored application information.

## Limitations

- Speech recognition depends on browser support and available recognition services.
- Speech transcription may not perfectly match actual spoken words.
- PDF import extracts selectable text and does not include OCR for scanned documents.
- Imported DOCX documents are converted to plain text; original formatting is not preserved.
- External libraries may require an internet connection.

## Project Status

**Version:** 1.1 — Complete Rebuild

SpeakTrainer is an ongoing personal project focused on public speaking practice, speech analysis, and personal learning progress.

## License

This project is currently maintained as a personal learning project. Add a license if you intend to specify permissions for reuse and distribution.
