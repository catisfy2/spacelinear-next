"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface SpeechToTextOptions {
  /** Language tag (e.g. "en-US", "fr-FR"). Defaults to browser locale. */
  lang?: string;
  /** Whether to return interim (partial) results. */
  interimResults?: boolean;
  /** Whether to continue listening after a result. */
  continuous?: boolean;
}

interface SpeechToTextState {
  /** Whether the browser supports the Web Speech API. */
  isSupported: boolean;
  /** Whether the microphone is currently listening. */
  isListening: boolean;
  /** Whether speech recognition is currently processing. */
  isProcessing: boolean;
  /** An error message if something went wrong. */
  error: string | null;
  /** The most recent transcript (final + interim). */
  transcript: string;
  /** The final transcript (committed results only). */
  finalTranscript: string;
}

interface SpeechToTextActions {
  /** Start listening. Request microphone permission if needed. */
  startListening: () => void;
  /** Stop listening and finalize the transcript. */
  stopListening: () => void;
  /** Toggle listening on/off. */
  toggleListening: () => void;
  /** Reset transcript state. */
  resetTranscript: () => void;
}

type SpeechToTextResult = SpeechToTextState & SpeechToTextActions;

/**
 * A hook that wraps the Web Speech API (SpeechRecognition) for speech-to-text.
 * Falls back gracefully when the API is unavailable.
 */
export function useSpeechToText(
  options: SpeechToTextOptions = {},
): SpeechToTextResult {
  const { lang, interimResults = true, continuous = true } = options;

  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalRef = useRef("");

  // Detect browser support
  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // Initialize recognition instance
  const initRecognition = useCallback(() => {
    if (!isSupported) return null;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = lang ?? navigator.language ?? "en-US";
    recognition.interimResults = interimResults;
    recognition.continuous = continuous;
    recognition.maxAlternatives = 1;

    return recognition;
  }, [isSupported, lang, interimResults, continuous]);

  const startListening = useCallback(() => {
    setError(null);

    if (!isSupported) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    // Don't start if already listening
    if (recognitionRef.current) {
      return;
    }

    const recognition = initRecognition();
    if (!recognition) return;

    recognition.onstart = () => {
      setIsListening(true);
      setIsProcessing(false);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      setIsProcessing(true);
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        finalRef.current += final;
        setFinalTranscript(finalRef.current);
      }

      setTranscript(finalRef.current + interim);
      setIsProcessing(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);

      switch (event.error) {
        case "not-allowed":
          setError("Microphone access denied. Please allow microphone permissions.");
          break;
        case "no-speech":
          setError("No speech detected. Please try again.");
          break;
        case "aborted":
          // User aborted — not an error
          break;
        case "audio-capture":
          setError("No microphone found. Please connect a microphone.");
          break;
        case "network":
          setError("Network error occurred during speech recognition.");
          break;
        case "service-not-allowed":
          setError("Speech recognition service is not allowed.");
          break;
        default:
          setError(`Speech recognition error: ${event.error}`);
      }

      setIsListening(false);
      setIsProcessing(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      setIsProcessing(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setError("Failed to start speech recognition.");
    }
  }, [isSupported, initRecognition]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore errors on stop
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setIsProcessing(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setFinalTranscript("");
    finalRef.current = "";
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    isProcessing,
    error,
    transcript,
    finalTranscript,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
  };
}
