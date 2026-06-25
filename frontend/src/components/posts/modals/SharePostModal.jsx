import React, { useCallback, useState } from "react";

const SharePostModal = ({ post, onClose }) => {
    const [copied, setCopied] = useState(false);

    const shareUrl  = `https://esat-hub.vercel.app/post/${post.id}`;
    const waMessage = encodeURIComponent(`${post.title} : ${shareUrl}`);

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
        <div className="media-upload-card-container" onClick={onClose}>
            <div className="media-upload-card" onClick={(e) => e.stopPropagation()}>
                <div className="media-upload-header">
                    <h3>Partager via</h3>
                    <button type="button" className="modal-close-btn" onClick={onClose}>
                        ✕
                    </button>
                </div>
                <div className="share-options">
                    <a
                        href={`https://wa.me/?text=${waMessage}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="share-option share-option--whatsapp"
                    >
                        <span>WhatsApp</span>
                    </a>
                    <button
                        type="button"
                        className="share-option share-option--copy"
                        onClick={handleCopy}
                    >
                        <span>{copied ? "Lien copié !" : "Copier le lien"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SharePostModal;