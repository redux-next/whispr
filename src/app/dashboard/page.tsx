"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import "./dashboard.css";

type Message = {
  id: string;
  recipientUid?: string;
  text?: string;
  tag?: string;
  createdAt?: { toDate?: () => Date } | Date | string | null;
};

type Tab = "inbox" | "stories" | "profile";
type CardMode = "question" | "profile";
type ProfileTheme = "dreamy" | "strawberry" | "midnight" | "matcha" | "ocean";

function formatDate(value: Message["createdAt"]) {
  if (!value) return "Recently";
  try {
    const date =
      typeof value === "string"
        ? new Date(value)
        : value instanceof Date
          ? value
          : typeof value.toDate === "function"
            ? value.toDate()
            : null;
    if (!date || Number.isNaN(date.getTime())) return "Recently";
    return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "Recently";
  }
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return "An unexpected error occurred.";
}

export default function DashboardPage() {
  const router = useRouter();
  const usernameEditRef = useRef(false);

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inboxLoading, setInboxLoading] = useState(true);
  const [inboxError, setInboxError] = useState("");
  const [inboxRetry, setInboxRetry] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>("inbox");

  const [username, setUsername] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [inboxEnabled, setInboxEnabled] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState("");
  const [cardMode, setCardMode] = useState<CardMode>("question");
  const [profileTheme, setProfileTheme] = useState<ProfileTheme>("dreamy");
  const [cardNotice, setCardNotice] = useState("");
  const [notice, setNotice] = useState("");

  const [showDeveloperIntro, setShowDeveloperIntro] = useState(false);

  const initials = (displayName || username || user?.email || "W")
    .trim()
    .charAt(0)
    .toUpperCase();

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (!currentUser) router.replace("/login");
    });
  }, [router]);

  useEffect(() => {
    if (!user) return;
    setProfileLoading(true);
    return onSnapshot(
      doc(db, "profiles", user.uid),
      (snapshot) => {
        const data = snapshot.data();
        const savedUsername = typeof data?.username === "string" ? data.username : "";
        setUsername(savedUsername);
        if (!usernameEditRef.current) setNewUsername(savedUsername);
        setDisplayName(typeof data?.displayName === "string" ? data.displayName : user.displayName || "");
        // Profiles without this field remain enabled by default.
        setInboxEnabled(data?.inboxEnabled !== false);
        setProfileLoading(false);
      },
      (error) => {
        console.error("[Whispr] Profile retrieval failed:", error);
        setProfileError(`${error.code}: ${error.message}`);
        setProfileLoading(false);
      },
    );
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setInboxLoading(true);
    setInboxError("");
    const messagesQuery = query(
      collection(db, "messages"),
      where("recipientUid", "==", user.uid),
      orderBy("createdAt", "desc"),
    );
    return onSnapshot(
      messagesQuery,
      (snapshot) => {
        setMessages(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as Message[]);
        setInboxLoading(false);
        setInboxError("");
      },
      (error) => {
        console.error("[Whispr] Inbox retrieval failed:", error);
        setInboxError(`${error.code}: ${error.message}`);
        setInboxLoading(false);
      },
    );
  }, [user, inboxRetry]);

  useEffect(() => {
  if (sessionStorage.getItem("whispr_show_developer_intro") !== "1") {
    return;
  }

  sessionStorage.removeItem("whispr_show_developer_intro");

  const timer = window.setTimeout(() => {
    setShowDeveloperIntro(true);
  }, 5000);

  return () => window.clearTimeout(timer);
}, []);

  const questions = useMemo(
    () => messages.filter((message) => typeof message.text === "string" && message.text.trim().length > 0),
    [messages],
  );
  const selectedQuestion = questions.find((message) => message.id === selectedMessageId);
  const shareUrl = useMemo(() => {
    if (typeof window === "undefined" || !username) return "";
    return `${window.location.origin}/u/${encodeURIComponent(username)}`;
  }, [username]);

  async function saveProfile() {
    if (!user) return;
    setProfileError("");
    setProfileSaving(true);
    try {
      const desiredUsername = newUsername.trim().toLowerCase();
      if (!/^[a-z0-9_]{3,20}$/.test(desiredUsername)) {
        throw new Error("Username must be 3–20 characters using letters, numbers, or underscores.");
      }
      const idToken = await user.getIdToken();
      if (desiredUsername !== username) {
        const response = await fetch("/api/username", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ username: desiredUsername }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "Unable to update username.");
      }
      await setDoc(
        doc(db, "profiles", user.uid),
        { uid: user.uid, displayName: displayName.trim().slice(0, 80), updatedAt: serverTimestamp() },
        { merge: true },
      );
      usernameEditRef.current = false;
      setNewUsername(desiredUsername);
      setProfileError("Profile saved successfully.");
    } catch (error) {
      console.error("[Whispr] Profile update failed:", error);
      setProfileError(`Couldn't save profile: ${getErrorMessage(error)}`);
    } finally {
      setProfileSaving(false);
    }
  }

  async function toggleInbox() {
    if (!user || profileSaving) return;
    setProfileSaving(true);
    setProfileError("");
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ inboxEnabled: !inboxEnabled }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to update inbox.");
      setInboxEnabled(!inboxEnabled);
      setProfileError(!inboxEnabled ? "Anonymous inbox enabled." : "Anonymous inbox disabled.");
    } catch (error) {
      console.error("[Whispr] Inbox setting update failed:", error);
      setProfileError(`Couldn't update inbox: ${getErrorMessage(error)}`);
    } finally {
      setProfileSaving(false);
    }
  }

  async function copyShareLink() {
    if (!shareUrl) {
      setNotice("Your username is missing from your profile.");
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setNotice("Your anonymous link has been copied.");
    } catch {
      setNotice(`Copy this link: ${shareUrl}`);
    }
  }

  async function shareProfile() {
    if (!shareUrl) {
      setCardNotice("Set a username before sharing your profile.");
      return;
    }
    try {
      if (navigator.share) {
        await navigator.share({
          title: "My Whispr profile",
          text: "Send me an anonymous question on Whispr.",
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(`Send me an anonymous question on Whispr: ${shareUrl}`);
        setCardNotice("Profile link copied and ready to share.");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setCardNotice("Sharing isn't available. Try copying your profile link.");
    }
  }

  function makeCardSvg(mode: CardMode) {
    const escapeXml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char] || char);
    const isProfile = mode === "profile";
    const themeColors: Record<ProfileTheme, { start: string; middle: string; end: string; accent: string; ink: string }> = {
      dreamy: { start: "#28103e", middle: "#7431a4", end: "#e34b9b", accent: "#ffd4ec", ink: "#51206f" },
      strawberry: { start: "#65172e", middle: "#e33f70", end: "#ff9b9b", accent: "#ffe0e8", ink: "#8f2345" },
      midnight: { start: "#080d2b", middle: "#263b83", end: "#7866e8", accent: "#d8d5ff", ink: "#202b68" },
      matcha: { start: "#183b32", middle: "#52866a", end: "#c6d879", accent: "#eff8c7", ink: "#244d3a" },
      ocean: { start: "#082f49", middle: "#087eaa", end: "#67d5e8", accent: "#d5f8ff", ink: "#07506d" },
    };
    const palette = isProfile ? themeColors[profileTheme] : themeColors.dreamy;
    const headline = isProfile ? "ASK ME ANYTHING" : "SOMEONE ASKED";
    const mainText = isProfile ? `@${username || "yourusername"}` : (questionCard || "Choose a question in your inbox");
    const footer = isProfile ? "SEND ME AN ANONYMOUS QUESTION" : `ANONYMOUS  ·  @${username || "yourusername"}`;
    const fontSize = mainText.length > 95 ? 54 : mainText.length > 55 ? 66 : 78;
    const lines: string[] = [];
    const words = mainText.split(/\s+/);
    let line = "";
    const maxChars = isProfile ? 20 : 22;
    for (const word of words) {
      if ((line + " " + word).trim().length > maxChars && line) { lines.push(line); line = word; }
      else line = (line + " " + word).trim();
    }
    if (line) lines.push(line);
    const startY = 850 - (lines.length * (fontSize + 18)) / 2;
    const textSvg = lines.slice(0, 9).map((item, index) => `<text x="540" y="${startY + index * (fontSize + 18)}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="700" fill="#fff8ff">${escapeXml(item)}</text>`).join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${palette.start}"/><stop offset="52%" stop-color="${palette.middle}"/><stop offset="100%" stop-color="${palette.end}"/></linearGradient><radialGradient id="glow"><stop stop-color="#ffd6f5" stop-opacity=".65"/><stop offset="100%" stop-color="#ffd6f5" stop-opacity="0"/></radialGradient></defs><rect width="1080" height="1920" rx="56" fill="url(#bg)"/><circle cx="110" cy="260" r="280" fill="url(#glow)"/><circle cx="1000" cy="1500" r="350" fill="url(#glow)"/><g fill="#fff" font-family="Arial, sans-serif"><text x="105" y="130" font-size="46" font-weight="700">w.</text><text x="975" y="145" font-size="70" text-anchor="end">✦</text><text x="110" y="420" font-size="42">✷</text><text x="920" y="520" font-size="84">♡</text><text x="120" y="1440" font-size="80">✧</text><text x="890" y="1600" font-size="58">✿</text></g><rect x="75" y="560" width="930" height="760" rx="54" fill="#160d27" fill-opacity=".48" stroke="#ffffff" stroke-opacity=".35" stroke-width="3"/><text x="540" y="665" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="700" letter-spacing="8" fill="${palette.accent}">${headline}</text>${textSvg}<rect x="135" y="1465" width="810" height="112" rx="56" fill="#fff" fill-opacity=".94"/><text x="540" y="1534" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="${palette.ink}">${escapeXml(footer)}</text><text x="540" y="1690" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" fill="#fff">whispr · say it anonymously</text><text x="540" y="1780" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#ffe8fb">${escapeXml(isProfile ? shareUrl : "made with a little mystery ✨")}</text></svg>`;
    return svg;
  }

  function downloadCard() {
    if (cardMode === "question" && !selectedQuestion) {
      setCardNotice("Choose a question first, or switch to your profile link card.");
      return;
    }
    const blob = new Blob([makeCardSvg(cardMode)], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = cardMode === "profile" ? `whispr-profile-${username || "link"}.svg` : `whispr-question-${selectedQuestion?.id || "card"}.svg`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setCardNotice("Your story card was downloaded as an SVG image.");
  }

  async function shareCard() {
    if (!shareUrl) {
      setCardNotice("Set a username before sharing your card.");
      return;
    }
    if (cardMode === "question" && !selectedQuestion) {
      setCardNotice("Choose a question first, or switch to your profile link card.");
      return;
    }
    const isProfile = cardMode === "profile";
    const text = isProfile
      ? `Ask me anything anonymously on Whispr: ${shareUrl}`
      : `Someone asked me anonymously on Whispr: “${questionCard}”\nAsk me something: ${shareUrl}`;
    try {
      if (navigator.share) {
        const cardFile = new File([makeCardSvg(cardMode)], isProfile ? "whispr-profile-card.svg" : "whispr-question-card.svg", { type: "image/svg+xml" });
        if (navigator.canShare?.({ files: [cardFile] })) {
          await navigator.share({ title: isProfile ? "My Whispr profile card" : "My Whispr question card", text, url: shareUrl, files: [cardFile] });
        } else {
          await navigator.share({ title: isProfile ? "My Whispr profile card" : "My Whispr question card", text, url: shareUrl });
        }
      } else {
        await navigator.clipboard.writeText(text);
        setCardNotice("Card text and profile link copied. Download the card image to attach it when sharing.");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setCardNotice("Sharing failed. Download the card and copy your profile link instead.");
    }
  }

  async function handleSignOut() {
    await signOut(auth);
    router.replace("/login");
  }

  if (authLoading || !user) {
    return <main className="whispr-loading"><div className="loading-orb" /><p>Opening your Whispr space…</p></main>;
  }

  const navItems: { id: Tab; icon: string; label: string }[] = [
    { id: "inbox", icon: "✉", label: "Inbox" },
    { id: "stories", icon: "▧", label: "Story Cards" },
    { id: "profile", icon: "◎", label: "Profile" },
  ];

  function renderNavigation(mobile = false) {
    return (
      <nav className={mobile ? "side-nav mobile-nav" : "side-nav desktop-nav"} aria-label="Dashboard navigation">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={activeTab === item.id ? "nav-item active" : "nav-item"}
            onClick={() => { setActiveTab(item.id); setNotice(""); setCardNotice(""); }}
            aria-current={activeTab === item.id ? "page" : undefined}
          >
            <span className="nav-icon" aria-hidden="true">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {item.id === "inbox" && <span className="nav-count">{messages.length}</span>}
          </button>
        ))}
      </nav>
    );
  }

  const questionCard = selectedQuestion?.text?.trim() || "";

  return (
    <main className="whispr-shell">
      <aside className="whispr-sidebar">
        <button className="brand-mark" onClick={() => setActiveTab("inbox")} aria-label="Whispr home">
          <span className="brand-icon">w.</span><span>whispr</span>
        </button>
        <div className="sidebar-label">YOUR SPACE</div>
        {renderNavigation()}
        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="avatar">{initials}</div>
            <div className="sidebar-user-copy">
              <strong>{displayName || username || "Whispr user"}</strong>
              <span>{username ? `@${username}` : "Your account"}</span>
            </div>
          </div>
          <button className="signout-button" onClick={handleSignOut}>↗ Sign out</button>
        </div>
      </aside>

      <section className="whispr-main">
        <header className="topbar">
          <div>
            <span className="eyebrow">YOUR PRIVATE CORNER</span>
            <h1>{activeTab === "inbox" ? "Your inbox" : activeTab === "stories" ? "Question story cards" : "Your profile"}</h1>
          </div>
          <button className="primary-button share-button" onClick={copyShareLink}>↗ Share my link</button>
        </header>

        {notice && <div className="notice" role="status"><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss">×</button></div>}

        {activeTab === "inbox" && (
          <div className="page-content">
            <div className="welcome-panel">
              <div><span className="eyebrow">ANONYMOUSLY, JUST FOR YOU</span><h2>Curious what people are thinking?</h2><p>Share your link and let the honest questions find their way to you.</p></div>
              <div className="welcome-art" aria-hidden="true"><span>✳</span><span>♡</span><span>✦</span></div>
            </div>
            <div className="section-heading"><div><h2>Anonymous questions</h2><p>Your inbox is private. Turn any question into a story card whenever you like.</p></div><span className="count-pill">{messages.length} total</span></div>
            {inboxLoading ? (
              <div className="empty-state"><div className="loading-orb" /><h3>Loading your questions…</h3></div>
            ) : inboxError ? (
              <div className="error-panel"><strong>Couldn't retrieve your inbox</strong><p>{inboxError}</p><p>Check your Firestore rules and any required composite index for recipientUid and createdAt.</p><button className="primary-button" onClick={() => setInboxRetry((value) => value + 1)}>Retry inbox</button></div>
            ) : messages.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">✉</div><h3>Your inbox is quiet… for now</h3><p>Share your link to start receiving anonymous questions.</p><button className="primary-button" onClick={copyShareLink}>Copy my link</button></div>
            ) : (
              <div className="message-list">
                {messages.map((message) => (
                  <article className="message-card" key={message.id}>
                    <div className="message-card-top"><span className="anonymous-avatar">?</span><div className="message-meta"><strong>Anonymous</strong><span>{formatDate(message.createdAt)}</span></div>{message.tag && <span className="message-tag">{message.tag}</span>}</div>
                    <p className="message-text">{message.text || "This question has no text."}</p>
                    <div className="message-actions">
                      <button className="primary-button" onClick={() => { setSelectedMessageId(message.id); setActiveTab("stories"); setCardNotice(""); }}>Create question story</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "stories" && (
          <div className="page-content">
            <div className="section-heading">
              <div><h2>Card Studio ✨</h2><p>Make a fun story card to share a question or invite people to your anonymous inbox.</p></div>
              <span className="count-pill">{questions.length} questions</span>
            </div>

            {cardNotice && <div className="notice" role="status"><span>{cardNotice}</span><button type="button" onClick={() => setCardNotice("")} aria-label="Dismiss">×</button></div>}

            <div className="whispr-card-mode" role="tablist" aria-label="Choose card type">
              <button type="button" role="tab" aria-selected={cardMode === "question"} className={cardMode === "question" ? "whispr-card-mode-button active" : "whispr-card-mode-button"} onClick={() => setCardMode("question")}>💬 Question card</button>
              <button type="button" role="tab" aria-selected={cardMode === "profile"} className={cardMode === "profile" ? "whispr-card-mode-button active" : "whispr-card-mode-button"} onClick={() => setCardMode("profile")}>💜 Profile link card</button>
            </div>

            <div className="message-card story-studio-panel">
              {cardMode === "profile" && <div className="profile-theme-picker" aria-label="Choose profile card theme">
                <span className="field-label">PICK A VIBE</span>
                <div className="profile-theme-options">
                  {([ ["dreamy", "💜", "Dreamy"], ["strawberry", "🍓", "Strawberry"], ["midnight", "🌙", "Midnight"], ["matcha", "🍵", "Matcha"], ["ocean", "🌊", "Ocean"] ] as [ProfileTheme, string, string][]).map(([theme, emoji, label]) => <button key={theme} type="button" className={`profile-theme-option ${profileTheme === theme ? "active" : ""}`} aria-pressed={profileTheme === theme} onClick={() => setProfileTheme(theme)}><span>{emoji}</span>{label}</button>)}
                </div>
              </div>}

              {cardMode === "question" && <>
                <label className="field-label" htmlFor="question-story-select">CHOOSE A QUESTION</label>
                <select id="question-story-select" className="profile-input" value={selectedMessageId} onChange={(event) => setSelectedMessageId(event.target.value)}>
                  <option value="">Select an anonymous question…</option>
                  {questions.map((message) => <option key={message.id} value={message.id}>{(message.text || "Anonymous question").replace(/\s+/g, " ").slice(0, 100)}</option>)}
                </select>
              </>}

              {cardMode === "question" ? (selectedQuestion ? (
                <div className="question-story-card whispr-genz-question" id="whispr-question-story">
                  <div className="genz-sticker sticker-star" aria-hidden="true">✦</div><div className="genz-sticker sticker-heart" aria-hidden="true">♡</div><div className="genz-sticker sticker-flower" aria-hidden="true">✿</div>
                  <div className="question-story-glow" aria-hidden="true" />
                  <div className="question-story-content">
                    <div className="question-story-brand"><span className="question-story-mark">w.</span><span>WHISPR</span></div>
                    <div className="question-story-kicker"><span>✦</span> SOMEONE ASKED</div>
                    <div className="question-story-quote" aria-hidden="true">“</div>
                    <p className="question-story-text">{questionCard}</p>
                    <div className="question-story-footer"><span className="question-story-anon"><span>?</span> anonymous</span><span className="question-story-line" /><span className="question-story-handle">@{username || "yourusername"}</span></div>
                  </div>
                </div>
              ) : <div className="empty-state story-select-empty"><div className="empty-icon">💬</div><h3>No question selected yet</h3><p>{questions.length ? "Pick a question above to make your story." : "You have no questions yet. You can still make a profile link card."}</p></div>) : (
                <div className={`whispr-profile-story-card theme-${profileTheme}`} id="whispr-profile-story">
                  <span className="profile-card-sticker profile-sticker-one" aria-hidden="true">✦</span><span className="profile-card-sticker profile-sticker-two" aria-hidden="true">♡</span><span className="profile-card-sticker profile-sticker-three" aria-hidden="true">✿</span>
                  <div className="profile-card-brand"><span>w.</span> WHISPR</div>
                  <div className="profile-card-mascot" aria-hidden="true"><span>◕ᴗ◕</span><i>♡</i></div>
                  <p className="profile-card-eyebrow">YOUR SAFE SPACE TO ASK</p>
                  <h3>spill the tea ☕</h3>
                  <p className="profile-card-handle">@{username || "yourusername"}</p>
                  <div className="profile-card-cta">ASK ME ANONYMOUSLY ↗</div>
                  <p className="profile-card-url">{shareUrl || "Set your username to generate your profile link"}</p>
                  <p className="profile-card-foot">no names. no pressure. just whispr. ✨</p>
                </div>
              )}

              <div className="message-actions story-card-actions">
                <button type="button" className="primary-button" onClick={downloadCard}>↓ Download card image</button>
                <button type="button" className="primary-button" onClick={shareCard}>↗ Share this card</button>
                {cardMode === "profile" && <button type="button" className="secondary-button" onClick={copyShareLink}>Copy profile link</button>}
              </div>
              <p className="muted-text story-studio-hint">Cards download as SVG images with playful stickers. Sharing sends the card text and your separate profile link; no public question-card page is created.</p>
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="page-content">
            <div className="section-heading"><div><h2>Your profile</h2><p>Manage how you appear in your Whispr space.</p></div></div>
            {profileLoading ? <div className="empty-state">Loading your profile…</div> : (
              <div className="profile-panel">
                <div className="profile-avatar">{initials}</div>
                <label className="field-label" htmlFor="display-name">DISPLAY NAME</label>
                <input id="display-name" className="profile-input" value={displayName} maxLength={80} onChange={(event) => setDisplayName(event.target.value)} placeholder="Your display name" />
                <label className="field-label" htmlFor="username">USERNAME</label>
                <input id="username" className="profile-input" value={newUsername} onChange={(event) => { usernameEditRef.current = true; setNewUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20)); }} minLength={3} maxLength={20} pattern="[a-z0-9_]{3,20}" autoComplete="username" />
                <p className="muted-text">Use 3–20 lowercase letters, numbers, or underscores. Changing your username changes your public profile link.</p>
                <button type="button" className="primary-button" disabled={profileSaving} onClick={saveProfile}>{profileSaving ? "Saving…" : "Save profile"}</button>
                <div className="inbox-setting" style={{ marginTop: 24 }}>
                  <div><strong>Anonymous inbox</strong><p className="muted-text">{inboxEnabled ? "People can send you anonymous questions." : "Your public inbox is currently closed."}</p></div>
                  <button type="button" className="primary-button" onClick={toggleInbox} disabled={profileSaving}>{profileSaving ? "Updating…" : inboxEnabled ? "Disable inbox" : "Enable inbox"}</button>
                </div>
                {profileError && <div className="notice" role="status">{profileError}</div>}
                <div className="profile-share-row"><p>{shareUrl || "Your username is not available yet."}</p><button type="button" className="primary-button" onClick={copyShareLink}>Copy profile link</button></div>
                <button type="button" className="signout-button profile-signout" onClick={handleSignOut}>↗ Sign out</button>
              </div>
            )}
          </div>
        )}
      </section>
      <div className="mobile-bottom-nav">{renderNavigation(true)}</div>
      {showDeveloperIntro && (
  <div
    className="developer-intro-overlay"
    onClick={() => setShowDeveloperIntro(false)}
  >
    <section
      className="developer-intro-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="developer-intro-title"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="developer-intro-close"
        aria-label="Close introduction"
        onClick={() => setShowDeveloperIntro(false)}
      >
        ×
      </button>

      <span className="developer-intro-sparkle" aria-hidden="true">
        ✧
      </span>

      <p className="developer-intro-eyebrow">A LITTLE INTRODUCTION</p>

      <h2 id="developer-intro-title">Behind the Whispr.</h2>

      <p className="developer-intro-description">
        A little space for your thoughts, built with care.
      </p>

      <p className="developer-intro-credit">
        Made by <span>Gyanam ♥</span>
      </p>

      <p className="developer-intro-role">
        Developer · Builder · Dreamer
      </p>

      <button
        type="button"
        className="developer-intro-action"
        onClick={() => setShowDeveloperIntro(false)}
      >
        Let's go <span aria-hidden="true">✦</span>
      </button>
    </section>
  </div>
)}
    </main>
  );
}
