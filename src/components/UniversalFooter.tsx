import Link from "next/link";
import { Heart, Sparkles } from "lucide-react";
import "./universal-footer.css";

type UniversalFooterProps = {
  /** Optional class for page-specific layout adjustments. */
  className?: string;
};

export default function UniversalFooter({ className = "" }: UniversalFooterProps) {
  return (
    <footer className={`whispr-universal-footer ${className}`.trim()}>
      <div className="whispr-footer-inner">
        <Link href="/" className="whispr-footer-brand" aria-label="Whispr home">
          whispr<span>.</span>
        </Link>

        <p className="whispr-footer-credit">
          Made with <Heart size={13} aria-label="love" /> by{" "}
          <span className="whispr-footer-author">Gyanam</span>
        </p>

        <p className="whispr-footer-tagline">
          <Sparkles size={13} aria-hidden="true" /> Your words. Your space. Your Whispr.
        </p>
      </div>
    </footer>
  );
}
