export class SpeechController {
  constructor() {
    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    this.supported = Boolean(Recognition);

    this.recognition = null;

    this.active = false;

    this.shouldStop = false;

    this.callbacks = {};

    this.finalTranscript = "";

    this.interimTranscript = "";

    if (!this.supported) {
      return;
    }

    this.recognition = new Recognition();

    this.recognition.lang = "id-ID";

    this.recognition.continuous = true;

    this.recognition.interimResults = true;

    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      this.active = true;

      this.callbacks.onStatus?.("recording");
    };

    this.recognition.onresult = (event) => {
      this.interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];

        const transcript = result[0].transcript.trim();

        if (result.isFinal) {
          this.finalTranscript +=
            (this.finalTranscript ? " " : "") + transcript;
        } else {
          this.interimTranscript +=
            (this.interimTranscript ? " " : "") + transcript;
        }
      }

      const transcript = this.getTranscript();

      this.callbacks.onUpdate?.({
        transcript,

        finalTranscript: this.finalTranscript,

        interimTranscript: this.interimTranscript,
      });
    };

    this.recognition.onerror = (event) => {
      const ignored = ["no-speech", "aborted"];

      if (!ignored.includes(event.error)) {
        this.callbacks.onError?.(this.getErrorMessage(event.error));
      }
    };

    this.recognition.onend = () => {
      if (this.active && !this.shouldStop) {
        try {
          this.recognition.start();

          return;
        } catch (error) {
          console.warn("Recognition restart failed:", error);
        }
      }

      this.active = false;

      this.shouldStop = false;

      this.callbacks.onUpdate?.({
        transcript: this.getTranscript(),

        finalTranscript: this.finalTranscript,

        interimTranscript: "",
      });

      this.callbacks.onStatus?.("stopped");

      this.callbacks.onStopped?.();
    };
  }

  // ========================================
  // START
  // ========================================

  start(options = {}) {
    if (!this.supported) {
      options.onError?.("Your browser does not support Speech Recognition.");

      return false;
    }

    if (this.active) {
      return false;
    }

    this.callbacks = options;

    this.finalTranscript = "";

    this.interimTranscript = "";

    this.shouldStop = false;

    this.recognition.lang = options.language || "id-ID";

    try {
      this.recognition.start();

      return true;
    } catch (error) {
      console.error(error);

      options.onError?.("Unable to start microphone recognition. Try again.");

      return false;
    }
  }

  // ========================================
  // STOP
  // ========================================

  stop() {
    if (!this.recognition || !this.active) {
      return;
    }

    this.shouldStop = true;

    this.recognition.stop();
  }

  // ========================================
  // TRANSCRIPT
  // ========================================

  getTranscript() {
    return [this.finalTranscript, this.interimTranscript]

      .filter(Boolean)

      .join(" ");
  }

  // ========================================
  // ERROR MESSAGE
  // ========================================

  getErrorMessage(error) {
    const messages = {
      "not-allowed": "Microphone permission was denied.",

      "service-not-allowed": "Speech recognition service is unavailable.",

      "audio-capture": "No microphone was detected.",

      network: "A network error interrupted speech recognition.",

      "language-not-supported":
        "The selected recognition language is unavailable.",
    };

    return messages[error] || `Speech recognition error: ${error}`;
  }
}
