import Link from "next/link";
import {
  ArrowLeft,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Heart,
  Star,
  Send,
} from "lucide-react";
import { adminDb } from "@/lib/admin";
import SendMessage from "./send-message";
import "./ask.css";
import "./ask-genz-additions.css";

type PublicProfileProps = {
  params: Promise<{ username: string }>;
};

export default async function PublicProfile({
  params,
}: PublicProfileProps) {
  const { username } = await params;
  const normalizedUsername = username.trim().replace(/^@/, "").toLowerCase();

  let displayName = normalizedUsername;
  let bio =
    "Got a question, a thought, or something you've always wanted to say? This is your moment.";
  let profileError = "";

  try {
    const db = adminDb();
    const usernameSnapshot = await db
      .collection("usernames")
      .doc(normalizedUsername)
      .get();

    if (!usernameSnapshot.exists) {
      profileError = `The username "${normalizedUsername}" was not found.`;
    } else {
      const uid = usernameSnapshot.data()?.uid;

      if (typeof uid !== "string" || !uid.trim()) {
        profileError = "This username is not linked to a valid account.";
      } else {
        const profileSnapshot = await db
          .collection("profiles")
          .doc(uid.trim())
          .get();

        if (!profileSnapshot.exists) {
          profileError = "The profile linked to this username was not found.";
        } else {
          const profile = profileSnapshot.data()!;

          if (profile.inboxEnabled !== true) {
            profileError = "This user's anonymous inbox is currently disabled.";
          } else {
            if (typeof profile.displayName === "string" && profile.displayName.trim()) {
              displayName = profile.displayName.trim();
            }
            if (typeof profile.bio === "string" && profile.bio.trim()) {
              bio = profile.bio.trim();
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("[Whispr] Public profile Firebase error:", error);
    profileError =
      "We couldn't load this profile right now. Please try again shortly.";
  }

  if (profileError) {
    return (
      <main className="publish-page ask-genz-page">
        <div className="publish-glow publish-glow-one" aria-hidden="true" />
        <div className="publish-glow publish-glow-two" aria-hidden="true" />
        <div className="ask-genz-sticker ask-genz-sticker-one" aria-hidden="true">✦</div>
        <div className="ask-genz-sticker ask-genz-sticker-two" aria-hidden="true">♡</div>

        <div className="publish-shell ask-genz-shell">
          <nav className="publish-nav">
            <Link href="/" className="publish-brand" aria-label="Whispr home">
              whispr<span>.</span>
            </Link>
            <div className="publish-nav-label">
              <ShieldCheck size={15} />
              <span>Anonymous by design</span>
            </div>
          </nav>

          <section className="publish-hero ask-genz-error">
            <div className="publish-avatar ask-genz-avatar">?</div>
            <div className="publish-eyebrow">
              <Sparkles size={14} /> PROFILE UNAVAILABLE
            </div>
            <h1>
              Oops, this <span className="publish-gradient">Whispr</span> is unavailable.
            </h1>
            <p className="publish-bio">{profileError}</p>
            <Link href="/" className="publish-back-link">
              <ArrowLeft size={14} /> Back to Whispr
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const initial = displayName.charAt(0).toUpperCase();

  return (
    <main className="publish-page ask-genz-page">
      <div className="publish-glow publish-glow-one" aria-hidden="true" />
      <div className="publish-glow publish-glow-two" aria-hidden="true" />
      <div className="ask-genz-sticker ask-genz-sticker-one" aria-hidden="true"><Star size={25} /></div>
      <div className="ask-genz-sticker ask-genz-sticker-two" aria-hidden="true"><Heart size={25} /></div>
      <div className="ask-genz-sticker ask-genz-sticker-three" aria-hidden="true">✷</div>

      <div className="publish-shell ask-genz-shell">
        <nav className="publish-nav">
          <Link href="/" className="publish-brand" aria-label="Whispr home">
            whispr<span>.</span>
          </Link>
          <div className="publish-nav-label">
            <ShieldCheck size={15} />
            <span>Anonymous by design</span>
          </div>
        </nav>

        <section className="publish-hero ask-genz-hero">
          <div className="ask-genz-profile-tag"><span className="ask-genz-live-dot" /> ANONYMOUS INBOX OPEN</div>
          <div className="publish-avatar ask-genz-avatar">{initial}</div>
          <div className="publish-eyebrow">
            <Sparkles size={14} /> YOUR SPACE TO SAY IT
          </div>
          <h1>
            Send a Whispr to
            <span className="publish-gradient"> {displayName}</span>
          </h1>
          <p className="publish-bio">{bio}</p>

          <div className="ask-genz-prompt-chips" aria-label="Message inspiration">
            <span>💭 a thought</span>
            <span>👀 a confession</span>
            <span>💌 a question</span>
          </div>

          <div className="publish-trust-row">
            <span><ShieldCheck size={15} /> No account needed</span>
            <span><MessageCircle size={15} /> Anonymous to the recipient</span>
          </div>
        </section>

        <section className="publish-compose ask-genz-compose">
          <div className="publish-compose-heading">
            <div>
              <p className="publish-section-label">YOUR LITTLE CONFESSION CORNER</p>
              <h2>What’s on your mind?</h2>
              <p>Be genuine. Be kind. Be yourself. ✨</p>
            </div>
            <div className="publish-compose-icon ask-genz-compose-icon">
              <MessageCircle size={23} />
            </div>
          </div>

          <SendMessage username={normalizedUsername} />
          <p className="ask-genz-form-note"><ShieldCheck size={13} /> Keep it kind. Your identity won’t appear in their inbox.</p>
        </section>

        <footer className="publish-footer ask-genz-footer">
          <Link href="/" className="publish-back-link">
            <ArrowLeft size={14} /> Made with <span className="publish-gradient">Whispr</span>
          </Link>
          <p><Heart size={13} /> Anonymous thoughts, softer landing.</p>
        </footer>
      </div>
    </main>
  );
}
