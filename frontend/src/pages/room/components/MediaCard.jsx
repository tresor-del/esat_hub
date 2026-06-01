// ─── MediaCard.jsx ────────────────────────────────────────────────────────────

import React from "react";
import { FiFileText, FiShare2 } from "react-icons/fi";
import Avatar from "../../../components/ui/Avatar";
import {
    isImageMedia,
    isDocumentMedia,
    getMediaUrl,
    formatMediaType,
} from "../utils/mediaHelpers";

/**
 * @prop {object}   media
 * @prop {Function} onOpen   — open detail / image preview
 * @prop {Function} onShare
 */
const MediaCard = ({ media, onOpen, onShare }) => {
    const handleShareClick = (e) => {
        e.stopPropagation();
        onShare(media);
    };

    return (
        <button
            type="button"
            className="media-item"
            onClick={() => onOpen(media)}
        >
            <div className="media-preview">
                {isImageMedia(media) ? (
                    <img
                        src={getMediaUrl(media)}
                        alt={media.title}
                        className="media-preview-image"
                    />
                ) : (
                    <div className="media-preview-icon">
                        <FiFileText size={32} />
                    </div>
                )}
            </div>

            <div className="media-item-body">
                <div className="media-item-meta">
                    <span className="media-item-badge">{formatMediaType(media)}</span>
                    <span className="media-date">
                        {media.created_at
                            ? new Date(media.created_at).toLocaleDateString("fr-FR")
                            : ""}
                    </span>
                </div>

                <h4>{media.title}</h4>
                <p>{media.description || "Pas de description"}</p>

                <div className="media-item-footer">
                    <div className="media-item-author">
                        <Avatar user={media.user} />
                        <span>
                            {media.user?.profil_name ||
                                media.user?.username ||
                                "Anonyme"}
                        </span>
                    </div>
                    <button
                        type="button"
                        className="media-item-action"
                        onClick={handleShareClick}
                        aria-label="Partager"
                    >
                        <FiShare2 />
                    </button>
                </div>
            </div>
        </button>
    );
};

export default MediaCard;