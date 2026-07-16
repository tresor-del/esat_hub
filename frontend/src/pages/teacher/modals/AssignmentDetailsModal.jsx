import React from "react";
import { FiFile, FiUser, FiClock } from "react-icons/fi";
import { rebuildName } from "../helpers/utils";

const STATUS_LABELS = {
    DRAFT: "Brouillon",
    PUBLISHED: "Publié",
    CLOSED: "Terminé",
    ARCHIVED: "Archivé",
};

/**
 * @prop {object} asnmt - le devoir dont on affiche les détails
 * @prop {Function} onClose
 */
const AssignmentDetailsModal = ({ asnmt, onClose }) => {
    if (!asnmt) return null;

    return (
        <div className="media-upload-card-container" onClick={onClose}>
            <div className="media-upload-card details-card" onClick={(e) => e.stopPropagation()}>

                <div className="media-upload-header">
                    <h3>{asnmt.title}</h3>
                    <button type="button" className="modal-close-btn" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="details-body">
                    <div className="details-meta">
                        <span className={`status-badge status-${asnmt.status?.toLowerCase()}`}>
                            {STATUS_LABELS[asnmt.status] || asnmt.status}
                        </span>
                        <span className="details-due">
                            <FiClock size={14} /> Expire le {new Date(asnmt.due_date).toLocaleDateString('fr-FR')}
                        </span>
                    </div>

                    {asnmt.description && (
                        <p className="details-description">{asnmt.description}</p>
                    )}

                    {asnmt.media?.length > 0 && (
                        <div className="details-section">
                            <h4>Fichiers joints</h4>
                            <ul className="details-files-list">
                                {asnmt.media.map((m) => (
                                    <li key={m.id}>
                                        <FiFile size={14} />
                                        <a href={m.file_path} target="_blank" rel="noopener noreferrer">
                                            {m.file_name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="details-section">
                        <h4>
                            Soumissions ({asnmt.submissions?.length || 0})
                        </h4>
                        {asnmt.submissions?.length > 0 ? (
                            <ul className="submissions-list">
                                {asnmt.submissions.map((sub) => (
                                    <li key={sub.id} className="submission-item">
                                        <div className="submission-student">
                                            <FiUser size={14} />
                                            {rebuildName(sub.student?.name) || "Élève inconnu"}
                                        </div>
                                        <div className="submission-info">
                                            <span className="submission-date">
                                                Soumis le {new Date(sub.submitted_at).toLocaleDateString('fr-FR')}
                                            </span>
                                            {sub.grade != null ? (
                                                <span className="submission-grade">Note : {sub.grade}/20</span>
                                            ) : (
                                                <span className="submission-grade pending">Non noté</span>
                                            )}
                                        </div>
                                        {sub.media?.length > 0 && (
                                            <ul className="details-files-list">
                                                {sub.media.map((m) => (
                                                    <li key={m.id}>
                                                        <FiFile size={14} />
                                                        <a href={m.file_path} target="_blank" rel="noopener noreferrer">
                                                            {m.file_name}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="details-empty">Aucune soumission pour l'instant.</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AssignmentDetailsModal;