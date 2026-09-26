import React, { useState } from "react";
import { createAttendanceSession } from "../../../../services/api";

/**
 * @prop {Function} onClose
 * @prop {Function} onSuccess  — reçoit la session créée { session_id, qr_image, expires_at, course }
 */
const CreateSessionModal = ({ onClose, onSuccess }) => {
  const [course,   setCourse]   = useState("");
  const [error,    setError]    = useState(null);
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!course.trim()) {
      setError("Veuillez saisir le nom du cours.");
      return;
    }

    setLoading(true);
    try {
      const session = await createAttendanceSession(course.trim());
      onSuccess(session);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de la création de la session.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="media-upload-card-container" onClick={onClose}>
      <div className="media-upload-card" onClick={(e) => e.stopPropagation()}>

        <div className="media-upload-header">
          <h3>Démarrer une session</h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form className="media-upload-form" onSubmit={handleSubmit}>
          <label>
            Nom du cours
            <input
              type="text"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="ex: Algorithmes avancés"
              autoFocus
              disabled={loading}
            />
          </label>

          {error && <div className="upload-error">{error}</div>}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Création..." : "Démarrer"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default CreateSessionModal;