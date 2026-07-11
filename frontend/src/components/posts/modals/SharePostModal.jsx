import React, { useCallback, useState } from "react";
import { FiLink, FiCheck } from "react-icons/fi";
import { SiWhatsapp } from "react-icons/si";
import "../../../styles/Posts/PostActionsMenu.css";
import "../../../styles/Posts/SharePostModal.css";

const SharePostModal = ({ post, onClose }) => {
  const [copied, setCopied] = useState(false);
  const onMobile = window.innerWidth < 768
  const shareUrl = `https://esat-hub.vercel.app/post/${post.id}`;
  const waMessage = encodeURIComponent(`${post.title} : ${shareUrl}`);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const el = document.createElement("textarea");
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  return (
    <div className="pam-overlay" onClick={onClose}>
      <div className="pam-sheet" onClick={(e) => e.stopPropagation()}>

        <div className="pam-handle" />

        <div className="pam-header">
          <span className="pam-title">Partager via</span>
          <button className="pam-close-btn" onClick={onClose} aria-label="Fermer">✕</button>
        </div>

        <div className="pam-actions">
          <a
            href={`https://wa.me/?text=${waMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="pam-action pam-action--whatsapp"
          >
            <span className="pam-action-icon"><SiWhatsapp /></span>
            <span className="pam-action-label">WhatsApp</span>
          </a>

          <button
            type="button"
            className={`pam-action ${copied ? "pam-action--copied" : "pam-action--copy"}`}
            onClick={handleCopy}
          >
            <span className="pam-action-icon">
              {copied ? <FiCheck /> : <FiLink />}
            </span>
            <span className="pam-action-label">
              {copied ? "Lien copié !" : "Copier le lien"}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default SharePostModal;