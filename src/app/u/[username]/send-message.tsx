
"use client";

import { useState } from "react";
import {
  Check,
  Heart,
  Lightbulb,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const categories = [
  { id: "question", label: "Question", icon: MessageCircle },
  { id: "compliment", label: "Compliment", icon: Heart },
  { id: "deep", label: "Deep thought", icon: Lightbulb },
  { id: "funny", label: "Funny", icon: Sparkles },
  { id: "confession", label: "Confession", icon: ShieldCheck },
];

export default function SendMessage({
  username,
}: {
  username: string;
}) {
  const [text, setText] = useState("");
  const [tag, setTag] = useState("question");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = text.trim();
    if (message.length < 3 || busy) return;

    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, text: message, tag }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Your message could not be sent.");
      }

      setSent(true);
      setText("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="publish-success" role="status">
        <div className="publish-success-icon">
          <Check size={28} />
        </div>
        <p className="publish-section-label">MESSAGE DELIVERED</p>
        <h3>Your Whispr is away.</h3>
        <p>
          Your anonymous message has been sent. You just made a little space
          for an honest conversation.
        </p>
        <button
          type="button"
          className="publish-submit"
          onClick={() => {
            setSent(false);
            setError("");
            setTag("question");
          }}
        >
          <MessageCircle size={17} />
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="publish-form">
      <div className="publish-field-heading">
        <label htmlFor="whispr-message">Your anonymous message</label>
        <span>Required</span>
      </div>

      <textarea
        id="whispr-message"
        className="publish-textarea"
        value={text}
        onChange={(event) => setText(event.target.value)}
        maxLength={500}
        minLength={3}
        required
        disabled={busy}
        placeholder="Type what you really want to say…"
        aria-describedby="whispr-counter whispr-privacy"
      />

      <div className="publish-counter-row">
        <span id="whispr-privacy">
          <ShieldCheck size={14} />
          Keep personal details private.
        </span>
        <span id="whispr-counter">{text.length}/500</span>
      </div>

      <fieldset className="publish-categories">
        <legend>Choose a vibe</legend>
        <div className="publish-category-list">
          {categories.map(({ id, label, icon: Icon }) => (
            <button
              type="button"
              key={id}
              disabled={busy}
              aria-pressed={tag === id}
              className={`publish-category ${
                tag === id ? "is-selected" : ""
              }`}
              onClick={() => setTag(id)}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      {error && (
        <p className="publish-error" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="publish-submit"
        disabled={busy || text.trim().length < 3}
      >
        {busy ? (
          <>
            <span className="publish-spinner" />
            Sending your Whispr…
          </>
        ) : (
          <>
            Send anonymously
            <Send size={17} />
          </>
        )}
      </button>

      <p className="publish-form-note">
        <ShieldCheck size={14} />
        No login. No name shown to the recipient. Just your message.
      </p>
    </form>
  );
}
