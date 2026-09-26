import React, { useRef, useState } from "react";
import { createAs, updateAssignment } from "../../../services/TeacherApi";
import { useAuth } from "../../../contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

/**
 * @prop {object|null} editingAsnmt 
 * @prop {Function|null}    onClose
 * @prop {Function|null}    onSuccess 
 */
const CreateAsnModal = ({ editingAsnmt, onClose, onSuccess, roomId }) => {
    const [title, setTitle] = useState(editingAsnmt?.title || "");
    const [description, setDescription] = useState(editingAsnmt?.description || "");
    const formatDateForInput = (dateStr) => {
        if (!dateStr) return "";
        return dateStr.split("T")[0]; // garde juste YYYY-MM-DD
    };

    const [dueDate, setDueDate] = useState(
        editingAsnmt?.due_date ?
            formatDateForInput(editingAsnmt?.due_date) :
            new Date().toISOString().slice(0, 16)
    );
    const [selectedFiles, setSelectedFiles] = useState(editingAsnmt?.media || []);
    const fileRef = useRef();
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);
    const queryClient = useQueryClient();

    const { user } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!title.trim()) {
            setError("Veuillez ajouter un titre.");
            return;
        }
        // if (!editingAsnmt && !file) {
        //     setError("Veuillez ajouter un fichier.");
        //     return;
        // }

        try {
            setUploading(true);
            if (editingAsnmt) {
                const formData = new FormData();
                formData.append("title", title.trim());
                formData.append("description", description.trim());

                selectedFiles.forEach((f) => formData.append("files", f));
                await updateAssignment(editingAsnmt.id, formData);
            } else {
                const res = await createAs({
                    title: title.trim(),
                    description: description.trim(),
                    due_date: dueDate,
                    files: selectedFiles,
                    room_id: roomId,
                });
                console.log(res);
            }
            onSuccess();
            queryClient.invalidateQueries({ queryKey: ["assignments", roomId] })
        } catch (err) {
            console.error(err);
            setError("Impossible d'enregistrer le média. Réessayez.");
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (e) => {
        // e.target.files est un objet FileList. 
        // On le convertit en tableau standard avec Array.from()
        const filesArray = Array.from(e.target.files);
        setSelectedFiles(filesArray);
    };

    return (
        <div className="media-upload-card-container" onClick={onClose}>
            <div className="media-upload-card" onClick={(e) => e.stopPropagation()}>

                <div className="media-upload-header">
                    <h3>{editingAsnmt ? "Modifier un devoir" : "Ajouter un devoir"}</h3>
                    <button type="button" className="modal-close-btn" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <form className="media-upload-form" onSubmit={handleSubmit}>
                    <label>
                        Titre
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Titre"
                        />
                    </label>
                    <label>
                        Description
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description"
                        />
                    </label>

                    <label>
                        Date limite
                        <input
                            type="datetime-local"
                            id="due-date"
                            name="dueDate"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                        />
                    </label>

                    <div>Fichiers: </div>

                    {(editingAsnmt && selectedFiles.length > 0) && (
                        <ul className="existing-files-list">
                            {selectedFiles.map((m) => (
                                <li key={m.id}>
                                    {m.file_name}
                                    <button
                                        type="button"
                                        onClick={() => setSelectedFiles(selectedFiles.filter(x => x.id !== m.id))}
                                    >
                                        Retirer
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="asnmt-detail-media">
                                {selectedFiles?.length > 0 && (
                                    <>
                                        {selectedFiles.map((m, index) => (
                                            <a key={index}>
                                                {m.name}
                                                <button
                                                    type="button"
                                                    className="btn"
                                                    onClick={() => setSelectedFiles(selectedFiles.filter(x => x.name !== m.name))}
                                                >
                                                    Retirer
                                                </button>
                                            </a>
                                        ))}
                                    </>
                                )}
                            </div>

                    <input ref={fileRef} type="file" onChange={handleFileChange} multiple style={{display: "none"}} />
                    <div className="btn btn-secondary" onClick={() => fileRef.current.click()}>Ajouter un fichier.</div>

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
                                : editingAsnmt
                                    ? "Mettre à jour"
                                    : "Créer le devoir"}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
};

export default CreateAsnModal;