
"use client";

import { useEffect, useState } from "react";
import { Code2, Heart, Sparkles, X } from "lucide-react";
import "./developer-welcome-popup.css";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function DeveloperWelcomePopup({ open, onClose }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      return;
    }

    const timer = window.setTimeout(() => setVisible(true), 5000);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!visible) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      className="developer-popup-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="developer-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="developer-popup-title"
      >
        <button
          type="button"
          className="developer-popup-close"
          onClick={onClose}
          aria-label="Close introduction"
        >
          <X size={19} />
        </button>

        <div className="developer-popup-icon">
          <Code2 size={30} />
          <span>✦</span>
        </div>

        <p className="developer-popup-eyebrow">
          <Sparkles size={14} /> A LITTLE INTRO
        </p>

        <h2 id="developer-popup-title">
          Behind the <span>Whispr.</span>
        </h2>

        <p className="developer-popup-description">
          Your little corner to ask, share, and be yourself was built with care by
        </p>

        <div className="developer-popup-name">
          Gyanam <Heart size={17} fill="currentColor" />
        </div>

        <p className="developer-popup-role">
          Developer · Builder · Dreamer
        </p>

        <button
          type="button"
          className="developer-popup-continue"
          onClick={onClose}
        >
          Let&apos;s go ✨
        </button>

        <p className="developer-popup-footnote">
          Thanks for being part of Whispr.
        </p>
      </section>
    </div>
  );
}
