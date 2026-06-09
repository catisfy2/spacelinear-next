"use client";

import { useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { StudyModeTimer } from "./StudyModeTimer";
import { StudyModeChat } from "./StudyModeChat";

interface StudyModeOverlayProps {
  minutes: number;
  onClose: () => void;
}

export function StudyModeOverlay({ minutes, onClose }: StudyModeOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const handleTimeUp = useCallback(() => {
    setTimeout(() => onClose(), 3000);
  }, [onClose]);

  const overlay = (
    <div
      ref={overlayRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 2147483647,
        overflow: "hidden",
        background: "#000",
      }}
    >
      {/* Background image - fills the entire viewport */}
      <img
        alt=""
        src="/concentrate.jpeg"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
        }}
      />

      {/* Dark overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.65)",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Exit button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            left: 24,
            top: 24,
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            background: "rgba(0,0,0,0.4)",
            color: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "none",
            cursor: "pointer",
          }}
          aria-label="Exit study mode"
        >
          <X style={{ width: 18, height: 18 }} />
        </button>

        {/* Timer */}
        <div style={{ marginBottom: 20 }}>
          <StudyModeTimer initialMinutes={minutes} onTimeUp={handleTimeUp} />
        </div>

        {/* Motivational text */}
        <p
          style={{
            textAlign: "center",
            fontSize: 15,
            fontWeight: 300,
            letterSpacing: "0.025em",
            color: "rgba(255,255,255,0.85)",
            textShadow: "0 2px 8px rgba(0,0,0,0.5)",
          }}
        >
          Focus. Breathe. You&rsquo;ve got this.
        </p>
      </div>

      {/* Floating chat */}
      <div
        style={{
          position: "fixed",
          bottom: 32,
          right: 32,
          zIndex: 2147483647,
        }}
      >
        <StudyModeChat />
      </div>
    </div>
  );

  if (typeof window === "undefined") return null;
  return createPortal(overlay, document.body);
}
