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
 * A hook that wraps speech-to-text with two backends:
 *  1. Web Speech API (`SpeechRecognition`) — primary, instant, local (Chrome, Edge, Safari)
 *  2. Groq Whisper API via MediaRecorder — fallback for Firefox/other browsers
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

  // ── Web Speech API refs ──────────────────────────────────────────────
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalRef = useRef("");

  // ── MediaRecorder (fallback) refs ────────────────────────────────────
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const isTranscribingRef = useRef(false);

  // Detect browser support for Web Speech API
  const isWebSpeechSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const isSupported = isWebSpeechSupported;

  // ── Web Speech API ───────────────────────────────────────────────────

  const initRecognition = useCallback(() => {
    if (!isWebSpeechSupported) return null;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = lang ?? navigator.language ?? "en-US";
    recognition.interimResults = interimResults;
    recognition.continuous = continuous;
    recognition.maxAlternatives = 1;

    return recognition;
  }, [isWebSpeechSupported, lang, interimResults, continuous]);

  const speechStart = useCallback(() => {
    setError(null);

    if (!isWebSpeechSupported) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    if (recognitionRef.current) return;

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
      switch (event.error) {
        case "not-allowed":
          setError(
            "Microphone access denied. Please allow microphone permissions.",
          );
          break;
        case "no-speech":
          setError("No speech detected. Please try again.");
          break;
        case "aborted":
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
  }, [isWebSpeechSupported, initRecognition]);

  const speechStop = useCallback(() => {
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

  // ── MediaRecorder + Groq Whisper API fallback ────────────────────────

  /** Send accumulated audio chunks to the transcription API. */
  const transcribeChunk = useCallback(async () => {
    if (isTranscribingRef.current) return;
    if (audioChunksRef.current.length === 0) return;

    isTranscribingRef.current = true;
    setIsProcessing(true);

    const chunks = audioChunksRef.current.splice(0);
    const mimeType = mediaRecorderRef.current?.mimeType ?? "audio/webm";
    const audioBlob = new Blob(chunks, { type: mimeType });

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const res = await fetch("/api/speech-to-text", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const msg = await res
          .json()
          .catch(() => ({ error: "Transcription failed" }));
        setError(msg.error || "Transcription failed");
        return;
      }

      const data = await res.json();
      const text = (data.text || "").trim();

      if (text) {
        finalRef.current += (finalRef.current ? " " : "") + text;
        setFinalTranscript(finalRef.current);
        setTranscript(finalRef.current);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transcription failed");
    } finally {
      isTranscribingRef.current = false;
      setIsProcessing(false);
    }
  }, []);

  const whisperStart = useCallback(async () => {
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          // Transcribe the accumulated chunk immediately
          transcribeChunk();
        }
      };

      // Send chunks every 4 seconds for near-real-time results
      mediaRecorder.start(4000);

      mediaRecorder.onstop = async () => {
        // Transcribe any remaining audio
        await transcribeChunk();

        // Cleanup
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        mediaRecorderRef.current = null;
        setIsListening(false);
        setIsProcessing(false);
      };

      setIsListening(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
      if ((err as DOMException).name === "NotAllowedError") {
        setError(
          "Microphone access denied. Please allow microphone permissions.",
        );
      } else {
        setError("Failed to access microphone.");
      }
      setIsListening(false);
    }
  }, [transcribeChunk]);

  const whisperStop = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setIsListening(false);
      setIsProcessing(false);
    }
  }, []);

  // ── Unified controls ─────────────────────────────────────────────────

  const startListening = useCallback(() => {
    setError(null);
    setTranscript("");
    setFinalTranscript("");
    finalRef.current = "";

    if (isWebSpeechSupported) {
      speechStart();
    } else {
      whisperStart();
    }
  }, [isWebSpeechSupported, speechStart, whisperStart]);

  const stopListening = useCallback(() => {
    if (isWebSpeechSupported) {
      speechStop();
    } else {
      whisperStop();
    }
  }, [isWebSpeechSupported, speechStop, whisperStop]);

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

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
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
