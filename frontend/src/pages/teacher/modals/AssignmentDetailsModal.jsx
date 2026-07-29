import React, { useEffect, useState } from "react";
import { FiFile, FiUser, FiClock } from "react-icons/fi";
import { useToast } from "../../../contexts/toastContext";
import { updateSubmissionReview } from "../../../services/TeacherApi";
import { downloadFile } from "../helpers/utils";

const STATUS_LABELS = {
    DRAFT: "Brouillon",
    PUBLISHED: "Publié",
    CLOSED: "Terminé",
    ARCHIVED: "Archivé",
};

/**
 * @prop {object} asnmt - le devoir dont on affiche les détails
 * @prop {Function} onClose - fonction pour fermer le modal
 * @prop {Function} onSubmissionUpdated - fonction appelée après enregistrement d'une soumission
 */
const AssignmentDetailsModal = ({ asnmt, onClose, onSubmissionUpdated }) => {
    const { toast } = useToast();
    const [drafts, setDrafts] = useState({});
    const [savingId, setSavingId] = useState(null);

    useEffect(() => {
        const initialDrafts = {};
        (asnmt?.submissions || []).forEach((sub) => {
            initialDrafts[sub.id] = {
                grade: sub.grade ?? "",
                feedback: sub.feedback ?? "",
            };
        });
        setDrafts(initialDrafts);
    }, [asnmt]);

    if (!asnmt) return null;

    const handleDraftChange = (submissionId, field, value) => {
        setDrafts((prev) => ({
            ...prev,
            [submissionId]: {
                ...prev[submissionId],
                [field]: value,
            },
        }));
    };

    const handleSaveSubmission = async (submission) => {
        const draft = drafts[submission.id] || {};
        const payload = {
            grade: draft.grade === "" ? null : Number(draft.grade),
            feedback: draft.feedback?.trim() ? draft.feedback.trim() : null,
        };

        setSavingId(submission.id);
        try {
            await updateSubmissionReview(asnmt.id, submission.id, payload);
            if (onSubmissionUpdated) {
                onSubmissionUpdated();
            }
            toast({ message: "Soumission mise à jour", type: "success" });
        } catch (error) {
            console.error(error);
            toast({ message: "Impossible d'enregistrer l'évaluation", type: "error" });
        } finally {
            setSavingId(null);
        }
    };

    const formatSubmissionDate = (value) => {
        if (!value) return "Date inconnue";

        const date = new Date(value);
        return `${date.toLocaleDateString("fr-FR")} à ${String(date.getHours()).padStart(2, "0")}h ${String(date.getMinutes()).padStart(2, "0")}`;
    };

    return (
        <div className="media-upload-card-container" onClick={onClose}>
            <div className="media-upload-card details-card t" onClick={(e) => e.stopPropagation()}>

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
                                {asnmt.submissions.map((sub) => {
                                    const studentName = [sub.student?.first_name, sub.student?.last_name].filter(Boolean).join(" ") || "Étudiant";
                                    const currentDraft = drafts[sub.id] || { grade: sub.grade ?? "", feedback: sub.feedback ?? "" };

                                    return (
                                        <li key={sub.id} className="submission-item">
                                            <div className="submission-student">
                                                <FiUser size={14} />
                                                {studentName}
                                            </div>
                                            <div className="submission-info">
                                                <span className="submission-date">
                                                    Soumis le {formatSubmissionDate(sub.submitted_at)}
                                                    {sub.is_late ? " · en retard" : ""}
                                                </span>
                                                {sub.grade != null ? (
                                                    <span className="submission-grade">Note : {sub.grade}</span>
                                                ) : (
                                                    <span className="submission-grade pending">Non noté</span>
                                                )}
                                            </div>

                                            {sub.media?.length > 0 && (
                                                <div className="details-submission-files">
                                                    <h5>Pièces jointes</h5>
                                                    <ul className="details-files-list">
                                                        {sub.media.map((m) => (
                                                            <li key={m.id}>
                                                                <FiFile size={14} />
                                                                <a
                                                                    rel="noopener noreferrer"
                                                                    onClick={(e) => downloadFile(e, m.file_path, m.file_name)}
                                                                >
                                                                    {m.file_name}
                                                                </a>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            <div className="submission-review">
                                                <label className="submission-review-field">
                                                    <span>Note /20</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="20"
                                                        step="1"
                                                        value={currentDraft.grade}
                                                        onChange={(e) => handleDraftChange(sub.id, "grade", e.target.value)}
                                                    />
                                                </label>
                                                <label className="submission-review-field">
                                                    <span>Feedback</span>
                                                    <textarea
                                                        rows={4}
                                                        value={currentDraft.feedback}
                                                        onChange={(e) => handleDraftChange(sub.id, "feedback", e.target.value)}
                                                        placeholder="Ajoutez un commentaire ou des conseils de correction"
                                                    />
                                                </label>
                                                <div className="submission-review-actions">
                                                    <button
                                                        type="button"
                                                        className="submission-save-btn"
                                                        onClick={() => handleSaveSubmission(sub)}
                                                        disabled={savingId === sub.id}
                                                    >
                                                        {savingId === sub.id ? "Enregistrement..." : "Enregistrer"}
                                                    </button>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
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