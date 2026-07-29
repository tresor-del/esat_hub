import React, { useCallback, useState } from "react";
import { buildShareUrl } from "../../utils/mediaHelpers";
import { SiWhatsapp } from "react-icons/si";
import { FiCheck, FiLink } from "react-icons/fi";

const ShareModal = ({ media, onClose }) => {
    const [copied, setCopied] = useState(false);

    const shareUrl = buildShareUrl(media);
    const waMessage = encodeURIComponent(`Fichier partagé depuis ESAT Hub : ${shareUrl}`);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
        } catch {
            // Fallback for older browsers / insecure contexts
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

export default ShareModal;