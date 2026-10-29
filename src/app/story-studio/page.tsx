"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Instagram, Share2, Sparkles } from "lucide-react";

const W = 1080;
const H = 1920;

function drawStory(canvas: HTMLCanvasElement, message: string, displayName: string, profileUrl: string) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not create the story image.");

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#10091f");
  bg.addColorStop(0.5, "#21103d");
  bg.addColorStop(1, "#090611");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(790, 400, 20, 790, 400, 600);
  glow.addColorStop(0, "rgba(168,85,247,.32)");
  glow.addColorStop(1, "rgba(168,85,247,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(216,180,254,.18)";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(56, 56, W - 112, H - 112, 44); ctx.stroke();

  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 64px system-ui, -apple-system, sans-serif";
  ctx.fillText("whispr", 104, 174);
  ctx.fillStyle = "#d8b4fe";
  ctx.beginPath(); ctx.arc(315, 151, 8, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = "#d8b4fe";
  ctx.font = "600 28px system-ui, -apple-system, sans-serif";
  ctx.fillText("A LITTLE SOMETHING TO SHARE", 104, 310);

  ctx.fillStyle = "rgba(255,255,255,.07)";
  ctx.strokeStyle = "rgba(216,180,254,.28)";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(80, 390, W - 160, 790, 36); ctx.fill(); ctx.stroke();

  const maxWidth = W - 250;
  const words = message.trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";
  ctx.font = "500 54px system-ui, -apple-system, sans-serif";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) { lines.push(line); line = word; }
    else line = candidate;
  }
  if (line) lines.push(line);
  const shownLines = lines.slice(0, 11);
  const lineHeight = 76;
  let y = 590 - ((shownLines.length - 1) * lineHeight) / 2;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  for (const text of shownLines) { ctx.fillText(text, W / 2, y, maxWidth); y += lineHeight; }

  ctx.textAlign = "left";
  ctx.fillStyle = "#c4b5fd";
  ctx.font = "600 30px system-ui, -apple-system, sans-serif";
  ctx.fillText(displayName.trim() ? `FOR ${displayName.trim().toUpperCase()}` : "A NOTE FOR YOU", 104, 1290);
  ctx.fillStyle = "rgba(255,255,255,.7)";
  ctx.font = "400 30px system-ui, -apple-system, sans-serif";
  ctx.fillText("Say what you can't say out loud.", 104, 1360);

  ctx.fillStyle = "#d8b4fe";
  ctx.font = "600 27px system-ui, -apple-system, sans-serif";
  ctx.fillText("SEND AN ANONYMOUS MESSAGE", 104, 1645);
  ctx.fillStyle = "#ffffff";
  ctx.font = "400 23px system-ui, -apple-system, sans-serif";
  const cleanUrl = profileUrl.trim();
  ctx.fillText(cleanUrl.length > 55 ? cleanUrl.slice(0, 52) + "…" : cleanUrl, 104, 1695);
  ctx.fillStyle = "rgba(255,255,255,.5)";
  ctx.font = "400 23px system-ui, -apple-system, sans-serif";
  ctx.fillText("Anonymous. Thoughtful. Whispr.", 104, 1780);
}

export default function StoryStudioPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [message, setMessage] = useState("Some things are easier to say anonymously.");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [notice, setNotice] = useState("");
  const profileUrl = typeof window !== "undefined" && username.trim()
    ? `${window.location.origin}/u/${username.trim().replace(/^@/, "")}`
    : "your-whispr-link";

  function makeBlob(): Promise<Blob> {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error("Story canvas isn't ready yet.");
    drawStory(canvas, message || "A little something to share.", displayName, profileUrl);
    return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Could not create image.")), "image/png"));
  }

  async function downloadStory() {
    try {
      const blob = await makeBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "whispr-story.png";
      anchor.click();
      URL.revokeObjectURL(url);
      setNotice("Story image downloaded. Open Instagram and add it to your Story.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not download the story."); }
  }

  async function shareStory() {
    try {
      const blob = await makeBlob();
      const file = new File([blob], "whispr-story.png", { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "My Whispr", text: "Send me an anonymous message." });
        setNotice("Choose Instagram if it appears in your device's share options.");
      } else {
        await downloadStory();
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setNotice("Sharing isn't supported here. Download the image and add it to Instagram Stories.");
    }
  }

  return (
    <main className="page min-h-screen py-8 max-w-5xl">
      <nav className="nav mb-8">
        <Link href="/" className="brand">whispr<span className="brand-dot">.</span></Link>
        <Link href="/dashboard" className="secondary inline-flex items-center gap-2"><ArrowLeft size={16}/> Dashboard</Link>
      </nav>
      <div className="mb-8">
        <p className="muted text-sm flex items-center gap-2"><Sparkles size={16}/> WHISPR CREATOR TOOLS</p>
        <h1 className="display text-4xl md:text-5xl mt-3">Story <span className="gradient-text">Studio.</span></h1>
        <p className="muted mt-3 max-w-2xl">Create a 9:16 story card with your Whispr link. Share it where supported, or download the image for Instagram.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6 items-start">
        <section className="panel p-5 md:p-6 space-y-5">
          <label className="block text-sm">Message on the card<textarea className="input min-h-28 mt-2" maxLength={240} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Write something you want to share…"/></label>
          <label className="block text-sm">Display name <span className="muted">(optional)</span><input className="input mt-2" maxLength={40} value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Your name"/></label>
          <label className="block text-sm">Whispr username<input className="input mt-2" maxLength={30} value={username} onChange={e=>setUsername(e.target.value.replace(/[^a-zA-Z0-9_.-]/g, ""))} placeholder="yourusername"/></label>
          <p className="muted text-xs">Only include information you want public. The card displays your public profile link.</p>
          <div className="flex flex-wrap gap-3">
            <button className="primary inline-flex items-center gap-2" onClick={shareStory}><Instagram size={17}/> Share story</button>
            <button className="secondary inline-flex items-center gap-2" onClick={downloadStory}><Download size={17}/> Download PNG</button>
          </div>
          {notice && <p role="status" className="text-sm muted">{notice}</p>}
        </section>
        <section className="panel p-3 md:p-4">
          <div className="mx-auto w-full max-w-[270px] overflow-hidden rounded-3xl border border-purple-300/20" style={{aspectRatio:"9 / 16", background:"linear-gradient(145deg,#10091f,#21103d 55%,#090611)", padding:"10% 8%", display:"flex", flexDirection:"column", justifyContent:"space-between"}}>
            <div><p className="display text-2xl">whispr<span className="brand-dot">.</span></p><p className="text-[9px] tracking-[.22em] text-purple-200 mt-8">A LITTLE SOMETHING TO SHARE</p></div>
            <div className="rounded-2xl border border-purple-200/20 bg-white/5 p-4"><p className="text-white text-sm leading-relaxed break-words">{message || "A little something to share."}</p></div>
            <div><p className="text-purple-200 text-xs">{displayName ? `FOR ${displayName.toUpperCase()}` : "A NOTE FOR YOU"}</p><p className="text-white/70 text-xs mt-2 break-all">{profileUrl}</p><p className="text-white/50 text-[10px] mt-5">Anonymous. Thoughtful. Whispr.</p></div>
          </div>
          <p className="muted text-xs text-center mt-3">Preview only. Export is rendered at 1080 × 1920.</p>
        </section>
      </div>
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
    </main>
  );
}
