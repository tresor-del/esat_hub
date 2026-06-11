import React, { useState } from "react";
import { uploadRoomMedia, updateRoomMedia } from "../../../../services/api";

/**
 * @prop {object|null} editingMedia  — null → add mode, object → edit mode
 * @prop {Function}    onClose
 * @prop {Function}    onSuccess     — called after successful save
 */
const MediaUploadModal = ({ editingMedia, onClose, onSuccess }) => {
    const [title,       setTitle]       = useState(editingMedia?.title       || "");
    const [description, setDescription] = useState(editingMedia?.description || "");
    const [file,        setFile]        = useState(null);
    const [error,       setError]       = useState(null);
    const [uploading,   setUploading]   = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!title.trim()) {
            setError("Veuillez ajouter un titre.");
            return;
        }
        if (!editingMedia && !file) {
            setError("Veuillez ajouter un fichier.");
            return;
        }

        try {
            setUploading(true);
            if (editingMedia) {
                const formData = new FormData();
                formData.append("title", title.trim());
                formData.append("description", description.trim());
                if (file) formData.append("file", file);
                await updateRoomMedia(editingMedia.id, formData);
            } else {
                await uploadRoomMedia({
                    title: title.trim(),
                    description: description.trim(),
                    file,
                });
            }
            onSuccess();
        } catch (err) {
            console.error(err);
            setError("Impossible d'enregistrer le média. Réessayez.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="media-upload-card-container" onClick={onClose}>
            <div className="media-upload-card" onClick={(e) => e.stopPropagation()}>

                <div className="media-upload-header">
                    <h3>{editingMedia ? "Modifier un média" : "Ajouter un média"}</h3>
                    <button type="button" className="modal-close-btn" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <form className="media-upload-form" onSubmit={handleSubmit}>
                    <label>
                        Titre du média
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Titre"
                        />
                    </label>
                    <label>
                        Description (facultative)
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description"
                        />
                    </label>
                    <label>
                        Fichier
                        <input
                            type="file"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                    </label>

                    {error && <div className="upload-error">{error}</div>}

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={uploading}
                        >
                            {uploading
                                ? "Enregistrement..."
                                : editingMedia
                                ? "Mettre à jour"
                                : "Ajouter"}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
};

export default MediaUploadModal;