import React from "react";
import { FiFileText } from "react-icons/fi";
import {
    isImageMedia,
    isDocumentMedia,
    getMediaUrl,
    formatMediaType,
} from "../../utils/mediaHelpers";
import { Countdown } from "../../utils/AsnmtCountDown";

const AsnmtDetailModal = ({ asnmt, onClose }) => {
    if (!asnmt) return null;

    return (
        <div className="media-detail-overlay" onClick={onClose}>
            <div className="media-detail-modal" onClick={(e) => e.stopPropagation()}>

                <div className="media-detail-header">
                    <div>
                        {/* <span className="media-item-badge">{formatMediaType(media)}</span> */}
                        <h3><strong>{asnmt.title}</strong></h3>
                        <p style={{color: "var(--text-muted-darker)"}}>{asnmt.description || "Pas de description fournie."}</p>
                    </div>
                    <button type="button" className="modal-close-btn" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="asnmt-detail-media">
                        <span>Fichiers associés: </span>
                        {asnmt.media?.length > 0 && (
                            asnmt.media
                            .map((m) => (
                                <a target="_blank" key={m.id} href={`${getMediaUrl(m)}`}> {m.file_name} </a>
                            ))
                        )}
                </div>

                <div className="btn btn-primary">
                        Soumettre mon devoir
                </div>

                <div className="media-detail-footer">
                    <div>
                        <strong>Auteur :</strong>{" "}
                        {asnmt.teacher?.full_name || "Anonyme"}
                    </div>
                    <div>
                        <strong>Temps restant :</strong>{" "}
                        {asnmt?.due_date
                            ? <Countdown dueDate={asnmt.due_date} />
                            : "N/A"}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AsnmtDetailModal;