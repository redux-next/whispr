"use client";

import { useState } from "react";
import { Copy, Heart, MessageCircle, Send, Sparkles } from "lucide-react";

type ReplyStoryCardProps = {
  question: string;
  reply: string;
  username: string;
};

export default function ReplyStoryCard({
  question,
  username,
}: ReplyStoryCardProps) {
  const [notice, setNotice] = useState("");

  const cleanQuestion = question.trim() || "Someone left you a question...";
  const shareText = cleanQuestion;

  async function shareQuestion() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Anonymous question",
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        setNotice("Question copied. Ready to share ✨");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;

      setNotice("Couldn't share automatically. Try copying the question.");
    }
  }

  async function copyQuestion() {
    try {
      await navigator.clipboard.writeText(shareText);
      setNotice("Question copied to clipboard 💜");
    } catch {
      setNotice("Clipboard unavailable. Select and copy the question manually.");
    }
  }

  return (
    <section className="rz-wrap">
      <div className="rz-card">
        <div className="rz-orb rz-orb-one" aria-hidden="true" />
        <div className="rz-orb rz-orb-two" aria-hidden="true" />

        <div className="rz-topline">
          <span className="rz-brand">
            <Sparkles size={15} />
            whispr<span className="rz-brand-dot">.</span>
          </span>
          <span className="rz-badge">ANONYMOUS</span>
        </div>

        <div className="rz-center">
          <div className="rz-icon">
            <MessageCircle size={25} strokeWidth={1.8} />
          </div>

          <p className="rz-eyebrow">SOMEONE WANTS TO KNOW 👀</p>

          <h3 className="rz-question">{cleanQuestion}</h3>

          <div className="rz-divider">
            <span />
            <Heart size={13} fill="currentColor" />
            <span />
          </div>

          <p className="rz-prompt">
            What would you say? <span>💭</span>
          </p>
        </div>

        <div className="rz-bottom">
          <div className="rz-user">
            <div className="rz-avatar">
              {(username || "W").charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>@{username || "yourusername"}</strong>
              <span>drop your answer ✨</span>
            </div>
          </div>

          <span className="rz-footer-mark">W.</span>
        </div>
      </div>

      <div className="rz-actions">
        <button
          type="button"
          className="rz-share"
          onClick={shareQuestion}
        >
          <Send size={16} />
          Share question
        </button>

        <button
          type="button"
          className="rz-copy"
          onClick={copyQuestion}
          aria-label="Copy anonymous question"
          title="Copy question"
        >
          <Copy size={17} />
        </button>
      </div>

      {notice && (
        <p className="rz-notice" role="status">
          {notice}
        </p>
      )}

      <style jsx>{`
        .rz-wrap {
          width: 100%;
          max-width: 430px;
          margin: 18px auto 0;
          color: #fff;
        }

        .rz-card {
          position: relative;
          isolation: isolate;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          aspect-ratio: 9 / 16;
          min-height: 480px;
          overflow: hidden;
          padding: 25px 23px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 25px;
          background:
            radial-gradient(
              ellipse at 10% 15%,
              rgba(255, 73, 190, 0.24),
              transparent 38%
            ),
            radial-gradient(
              ellipse at 90% 80%,
              rgba(91, 90, 255, 0.32),
              transparent 40%
            ),
            linear-gradient(155deg, #151024 0%, #211536 48%, #0e1024 100%);
          box-shadow: 0 22px 60px rgba(10, 5, 25, 0.25);
        }

        .rz-orb {
          position: absolute;
          z-index: -1;
          width: 180px;
          height: 180px;
          border-radius: 50%;
          filter: blur(65px);
          opacity: 0.4;
          pointer-events: none;
        }

        .rz-orb-one {
          top: 18%;
          right: -95px;
          background: #ec4899;
        }

        .rz-orb-two {
          bottom: 10%;
          left: -100px;
          background: #6366f1;
        }

        .rz-topline,
        .rz-bottom,
        .rz-user,
        .rz-brand,
        .rz-badge,
        .rz-divider,
        .rz-actions {
          display: flex;
          align-items: center;
        }

        .rz-topline,
        .rz-bottom {
          position: relative;
          z-index: 1;
          justify-content: space-between;
          gap: 10px;
        }

        .rz-brand {
          gap: 6px;
          font-size: 20px;
          font-weight: 850;
          letter-spacing: -1px;
        }

        .rz-brand-dot {
          margin-left: -6px;
          color: #f0abfc;
        }

        .rz-badge {
          padding: 7px 10px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.07);
          color: #e9d5ff;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.2px;
        }

        .rz-center {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 25px 0;
          text-align: center;
        }

        .rz-icon {
          display: grid;
          width: 59px;
          height: 59px;
          place-items: center;
          margin-bottom: 24px;
          border: 1px solid rgba(255, 255, 255, 0.19);
          border-radius: 20px;
          background: linear-gradient(
            145deg,
            rgba(244, 114, 182, 0.25),
            rgba(129, 140, 248, 0.2)
          );
          color: #f5d0fe;
          transform: rotate(-5deg);
        }

        .rz-eyebrow {
          margin: 0 0 19px;
          color: #f0abfc;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
          line-height: 1.6;
        }

        .rz-question {
          width: 100%;
          margin: 0;
          color: #fff;
          font-size: clamp(23px, 5vw, 34px);
          font-weight: 850;
          line-height: 1.27;
          letter-spacing: -1px;
          overflow-wrap: anywhere;
          white-space: pre-wrap;
        }

        .rz-divider {
          width: 65%;
          justify-content: center;
          gap: 12px;
          margin: 27px 0 18px;
          color: #f0abfc;
        }

        .rz-divider span {
          height: 1px;
          flex: 1;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(240, 171, 252, 0.55)
          );
        }

        .rz-divider span:last-child {
          transform: rotate(180deg);
        }

        .rz-prompt {
          margin: 0;
          color: #d6cce9;
          font-size: 13px;
          font-weight: 600;
        }

        .rz-user {
          min-width: 0;
          gap: 10px;
        }

        .rz-avatar {
          display: grid;
          width: 38px;
          height: 38px;
          flex-shrink: 0;
          place-items: center;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 14px;
          background: linear-gradient(135deg, #ec4899, #8b5cf6);
          font-size: 16px;
          font-weight: 850;
        }

        .rz-user strong,
        .rz-user span {
          display: block;
          overflow-wrap: anywhere;
        }

        .rz-user strong {
          font-size: 12px;
          font-weight: 800;
        }

        .rz-user span {
          margin-top: 4px;
          color: #b9abcF;
          font-size: 10px;
        }

        .rz-footer-mark {
          color: rgba(255, 255, 255, 0.3);
          font-size: 27px;
          font-weight: 900;
          letter-spacing: -2px;
        }

        .rz-actions {
          gap: 10px;
          margin-top: 14px;
        }

        .rz-share,
        .rz-copy {
          display: flex;
          min-height: 46px;
          align-items: center;
          justify-content: center;
          gap: 9px;
          border: 0;
          border-radius: 14px;
          cursor: pointer;
          font: inherit;
          font-size: 13px;
          font-weight: 800;
          transition:
            transform 160ms ease,
            opacity 160ms ease;
        }

        .rz-share:hover,
        .rz-copy:hover {
          transform: translateY(-2px);
        }

        .rz-share {
          flex: 1;
          background: linear-gradient(100deg, #ec4899, #8b5cf6);
          color: #fff;
        }

        .rz-copy {
          width: 48px;
          flex-shrink: 0;
          border: 1px solid rgba(140, 100, 190, 0.25);
          background: #f4edff;
          color: #5b267f;
        }

        .rz-notice {
          margin: 10px 0 0;
          color: #bda6ed;
          font-size: 12px;
          text-align: center;
        }

        @media (max-width: 420px) {
          .rz-card {
            min-height: 450px;
            padding: 20px 17px;
            border-radius: 21px;
          }

          .rz-question {
            font-size: 25px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .rz-share,
          .rz-copy {
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}