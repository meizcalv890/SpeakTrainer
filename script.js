// =======================
// ELEMENT
// =======================

const targetText = document.getElementById("targetText");
const transcriptDiv = document.getElementById("transcript");
const comparisonDiv = document.getElementById("comparison");
const resultDiv = document.getElementById("result");
const achievementDiv = document.getElementById("achievement");

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

const levelSelect = document.getElementById("levelSelect");
const themeBtn = document.getElementById("themeBtn");

const durationEl = document.getElementById("duration");
const wordCountEl = document.getElementById("wordCount");

const totalPracticeEl = document.getElementById("totalPractice");
const bestScoreEl = document.getElementById("bestScore");
const avgScoreEl = document.getElementById("avgScore");

const historyTable = document.getElementById("historyTable");

// =======================
// TEXT LEVELS
// =======================

const texts = {

    easy:
    "Public speaking adalah kemampuan menyampaikan informasi kepada audiens dengan jelas dan percaya diri.",

    medium:
    "Kemampuan berbicara di depan umum sangat penting karena membantu seseorang menyampaikan ide, memengaruhi audiens, dan membangun kepercayaan diri dalam berbagai situasi.",

    hard:
    "Public speaking merupakan keterampilan komunikasi yang memungkinkan seseorang menyampaikan gagasan secara efektif, membangun hubungan dengan audiens, serta meningkatkan kemampuan kepemimpinan dan profesionalisme dalam berbagai bidang kehidupan."

};

// =======================
// SET DEFAULT TEXT
// =======================

targetText.innerText = texts.easy;

// =======================
// CHANGE LEVEL
// =======================

levelSelect.addEventListener("change", () => {

    targetText.innerText =
    texts[levelSelect.value];

});

// =======================
// DARK MODE
// =======================

themeBtn.addEventListener("click", () => {

    document.body.classList.toggle("dark");

    if(document.body.classList.contains("dark")){
        themeBtn.innerText =
        "☀ Light Mode";
    }
    else{
        themeBtn.innerText =
        "🌙 Dark Mode";
    }

});

// =======================
// SPEECH RECOGNITION
// =======================

const SpeechRecognition =
window.SpeechRecognition ||
window.webkitSpeechRecognition;

let recognition;

let transcriptText = "";
let startTime = 0;
let timer;

if(SpeechRecognition){

    recognition =
    new SpeechRecognition();

    recognition.lang = "id-ID";

    recognition.continuous = true;

    recognition.interimResults = true;

}

else{

    alert(
        "Browser tidak mendukung Speech Recognition"
    );

}

// =======================
// FILLER WORDS
// =======================

const fillers = [

    "eh",
    "emm",
    "hmm",
    "eee",
    "anu",
    "haa",
    "kayak",
    "gitu",
    "jadi"

];

// =======================
// START
// =======================

startBtn.addEventListener("click", () => {

    transcriptText = "";

    transcriptDiv.innerHTML = "";

    startTime = Date.now();

    durationEl.innerText = "0";

    wordCountEl.innerText = "0";

    timer = setInterval(() => {

        let seconds = Math.floor(
            (Date.now() - startTime)/1000
        );

        durationEl.innerText =
        seconds;

    },1000);

    recognition.start();

    startBtn.disabled = true;
    stopBtn.disabled = false;

});

// =======================
// RESULT EVENT
// =======================

recognition.onresult = (event) => {

    let text = "";

    for(
        let i = 0;
        i < event.results.length;
        i++
    ){

        text +=
        event.results[i][0].transcript + " ";

    }

    transcriptText =
    text.toLowerCase();

    transcriptDiv.innerText =
    transcriptText;

    wordCountEl.innerText =
    transcriptText
    .trim()
    .split(/\s+/)
    .filter(word => word !== "")
    .length;

};

// =======================
// STOP
// =======================

stopBtn.addEventListener("click", () => {

    recognition.stop();

    clearInterval(timer);

    startBtn.disabled = false;
    stopBtn.disabled = true;

    analyzeSpeech();

});

// =======================
// ANALYZE
// =======================

function analyzeSpeech(){

    const targetWords =
    targetText.innerText
    .toLowerCase()
    .split(/\s+/);

    const spokenWords =
    transcriptText
    .trim()
    .split(/\s+/);

    let correct = 0;

    let errors = 0;

    let comparisonHTML = "";

    const maxLength =
    Math.max(
        targetWords.length,
        spokenWords.length
    );

    for(
        let i=0;
        i<maxLength;
        i++
    ){

        const target =
        targetWords[i];

        const spoken =
        spokenWords[i];

        if(target === spoken){

            correct++;

            comparisonHTML +=
            `<span class="correct">${spoken}</span> `;

        }

        else{

            errors++;

            comparisonHTML +=
            `<span class="wrong">${spoken || "___"}</span> `;

        }

    }

    comparisonDiv.innerHTML =
    comparisonHTML;

    // Accuracy

    const accuracy =
    Math.max(
        0,
        Math.round(
            (correct / targetWords.length)*100
        )
    );

    // Filler Count

    let fillerCount = 0;

    spokenWords.forEach(word => {

        if(
            fillers.includes(word)
        ){

            fillerCount++;

        }

    });

    // Duration

    const duration =
    Math.max(
        1,
        Math.floor(
            (Date.now()-startTime)/1000
        )
    );

    // WPM

    const wpm =
    Math.round(
        (spokenWords.length/duration)*60
    );

    // Score

    let score =
    accuracy
    - (fillerCount*2)
    - (errors);

    score =
    Math.max(0,score);

    // Feedback

    let feedback = "";

    if(score >= 90){

        feedback =
        "Sangat baik. Penyampaian sudah jelas.";

    }
    else if(score >= 75){

        feedback =
        "Cukup baik. Masih bisa ditingkatkan.";

    }
    else{

        feedback =
        "Perlu lebih banyak latihan.";

    }

    resultDiv.innerHTML = `

        <p><b>Skor :</b> ${score}</p>

        <p><b>Akurasi :</b> ${accuracy}%</p>

        <p><b>Kesalahan Kata :</b> ${errors}</p>

        <p><b>Filler Word :</b> ${fillerCount}</p>

        <p><b>Kecepatan :</b> ${wpm} WPM</p>

        <p><b>Durasi :</b> ${duration} detik</p>

        <p><b>Analisis :</b> ${feedback}</p>

    `;

    createAchievement(score);

    saveHistory(
        score,
        accuracy,
        wpm
    );

    loadDashboard();

    renderChart();

}

// =======================
// ACHIEVEMENT
// =======================

function createAchievement(score){

    if(score >= 90){

        achievementDiv.innerHTML =
        `<span class="badge gold">
        🏆 Excellent Speaker
        </span>`;

    }

    else if(score >= 75){

        achievementDiv.innerHTML =
        `<span class="badge silver">
        🎖 Good Speaker
        </span>`;

    }

    else{

        achievementDiv.innerHTML =
        `<span class="badge bronze">
        📖 Keep Practicing
        </span>`;

    }

}

// =======================
// STORAGE
// =======================

function saveHistory(
    score,
    accuracy,
    wpm
){

    let history =

    JSON.parse(
        localStorage.getItem(
            "speakHistory"
        )
    ) || [];

    history.push({

        date:
        new Date()
        .toLocaleDateString(),

        score,
        accuracy,
        wpm

    });

    localStorage.setItem(

        "speakHistory",

        JSON.stringify(history)

    );

    loadHistory();

}

// =======================
// HISTORY
// =======================

function loadHistory(){

    let history =

    JSON.parse(
        localStorage.getItem(
            "speakHistory"
        )
    ) || [];

    historyTable.innerHTML = "";

    history.forEach(item => {

        historyTable.innerHTML += `

        <tr>

            <td>${item.date}</td>

            <td>${item.score}</td>

            <td>${item.accuracy}%</td>

            <td>${item.wpm}</td>

        </tr>

        `;

    });

}

// =======================
// DASHBOARD
// =======================

function loadDashboard(){

    let history =

    JSON.parse(
        localStorage.getItem(
            "speakHistory"
        )
    ) || [];

    totalPracticeEl.innerText =
    history.length;

    if(history.length === 0){

        bestScoreEl.innerText = 0;
        avgScoreEl.innerText = 0;

        return;

    }

    let scores =
    history.map(h => h.score);

    let best =
    Math.max(...scores);

    let avg =
    Math.round(

        scores.reduce(
            (a,b)=>a+b,
            0
        ) / scores.length

    );

    bestScoreEl.innerText =
    best;

    avgScoreEl.innerText =
    avg;

}

// =======================
// CHART
// =======================

let chart;

function renderChart(){

    let history =

    JSON.parse(
        localStorage.getItem(
            "speakHistory"
        )
    ) || [];

    const labels =
    history.map(
        (_,index)=>`#${index+1}`
    );

    const scores =
    history.map(
        item=>item.score
    );

    const ctx =
    document
    .getElementById("scoreChart");

    if(chart){

        chart.destroy();

    }

    chart = new Chart(ctx,{

        type:"line",

        data:{

            labels,

            datasets:[{

                label:"Skor",

                data:scores,

                borderWidth:3,

                tension:0.3

            }]

        },

        options:{

            responsive:true

        }

    });

}

// =======================
// INIT
// =======================

loadHistory();

loadDashboard();

renderChart();