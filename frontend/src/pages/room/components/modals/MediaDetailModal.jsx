import React from "react";
import { FiFileText } from "react-icons/fi";
import {
    isImageMedia,
    isDocumentMedia,
    getMediaUrl,
    formatMediaType,
} from "../../utils/mediaHelpers";

const MediaDetailModal = ({ media, onClose }) => {
    if (!media) return null;

    return (
        <div className="media-detail-overlay" onClick={onClose}>
            <div className="media-detail-modal" onClick={(e) => e.stopPropagation()}>

                <div className="media-detail-header">
                    <div>
                        <span className="media-item-badge">{formatMediaType(media)}</span>
                        <h3>{media.title}</h3>
                        <p>{media.description || "Pas de description fournie."}</p>
                    </div>
                    <button type="button" className="modal-close-btn" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="media-detail-body">
                    {isImageMedia(media) ? (
                        <img
                            src={getMediaUrl(media)}
                            alt={media.title}
                            className="media-detail-image"
                        />
                    ) : (
                        <div className="media-detail-doc-preview">
                            <FiFileText size={50} />
                            <span>Document</span>
                            <a
                                href={getMediaUrl(media)}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-primary"
                            >
                                Ouvrir le document
                            </a>
                        </div>
                    )}
                </div>

                <div className="media-detail-footer">
                    <div>
                        <strong>Auteur :</strong>{" "}
                        {media.user?.profil_name || media.user?.username || "Anonyme"}
                    </div>
                    <div>
                        <strong>Type :</strong>{" "}
                        {isImageMedia(media)
                            ? "Image"
                            : isDocumentMedia(media)
                            ? "Document"
                            : media.mime_type}
                    </div>
                    <div>
                        <strong>Date :</strong>{" "}
                        {media.created_at
                            ? new Date(media.created_at).toLocaleDateString("fr-FR")
                            : "N/A"}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default MediaDetailModal;