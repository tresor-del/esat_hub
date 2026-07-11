// ─── PostEdit/index.jsx ───────────────────────────────────────────────────────

import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePostEdit } from "./hooks/usePostEdit";
import { useAuth } from "../../contexts/AuthContext";
import Avatar from "../../components/ui/Avatar";
import HomeSidebar from "../Home/components/HomeSidebar";
import FileUploadZone from "../CreatePost/components/fileUploadZone";
import "../../styles/Posts/PostEdit.css"
import "../../styles/Posts/PostCreate.css"
import "../../styles/Home.css"
import "../../styles/Chat/Chat.css"
import "../../styles/Auth/Auth.css"
import { FiArrowLeft } from "react-icons/fi";


const PostEdit = ({ id, onClose }) => {
    const params = useParams();
    const postId = id || params.id;
    const { user: fullUser } = useAuth();
    const navigate = useNavigate();
    const onMobile = window.innerWidth < 768

    const {
        post,
        formData,
        preview,
        keepExistingFile,
        loading,
        saving,
        error,
        handleChange,
        handleFileChange,
        handleFileError,
        restoreExistingFile,
        handleSubmit,
    } = usePostEdit(id);

    // ── Loading / error states ────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="container" style={{ padding: "40px 20px", textAlign: "center" }}>
                <div className="loading">Chargement...</div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="container" style={{ padding: "40px 20px", textAlign: "center" }}>
                <p className="alert alert-error">{error || "Post introuvable"}</p>
            </div>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="post-edit-modal-layout">
            <div className="card post-edit-modal-card">
                <div className="card-header">
                    {onMobile && <FiArrowLeft size={30} onClick={() => onClose()} />}

                    <h2 className="card-title">Modifier le post</h2>
                </div>

                <div className="card-body">
                    {error && (
                        <div className="alert alert-error" style={{ marginBottom: "16px" }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="form">
                        {/* Type */}
                        <div className="form-group">
                            <label htmlFor="post_type" className="form-label">
                                Type de poste *
                            </label>
                            <select
                                id="post_type"
                                name="post_type"
                                className="form-select"
                                value={formData.post_type}
                                onChange={handleChange}
                                disabled={saving}
                            >
                                <option value="photo">Photo</option>
                                <option value="document">Document</option>
                            </select>
                        </div>

                        {/* Titre */}
                        <div className="form-group">
                            <label htmlFor="title" className="form-label">Titre *</label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                className="form-input"
                                placeholder="Donnez un titre à votre post"
                                value={formData.title}
                                onChange={handleChange}
                                maxLength={255}
                                required
                                disabled={saving}
                            />
                        </div>

                        {/* Description */}
                        <div className="form-group">
                            <label htmlFor="description" className="form-label">
                                Description (optionnel)
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                className="form-textarea"
                                placeholder="Ajoutez une description..."
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                disabled={saving}
                            />
                        </div>

                        {/* Fichier */}
                        <div className="form-group">
                            <label className="form-label">
                                Fichier *
                                {keepExistingFile && !formData.file && (
                                    <span style={{ color: "#2e7d32", fontWeight: 400, marginLeft: 8 }}>
                                        ✓ Fichier actuel conservé
                                    </span>
                                )}
                                {formData.file && (
                                    <span style={{ color: "#2e7d32", fontWeight: 400, marginLeft: 8 }}>
                                        ✓ Nouveau fichier sélectionné
                                    </span>
                                )}
                            </label>

                            {/* Restauration du fichier original */}
                            {!keepExistingFile && post?.post_type === formData.post_type && (
                                <div style={{ marginBottom: "12px" }}>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={restoreExistingFile}
                                        style={{ fontSize: "13px", padding: "6px 12px" }}
                                    >
                                        ↩️ Restaurer le fichier original
                                    </button>
                                </div>
                            )}

                            <div className="form-group">
                                <FileUploadZone
                                    postType={formData.post_type}
                                    file={formData.file}
                                    preview={preview}
                                    disabled={loading}
                                    onFileChange={handleFileChange}
                                    onError={handleFileError}
                                />
                            </div>

                        </div>

                        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => onClose()}
                                disabled={saving}
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={saving}
                            >
                                {saving ? "Enregistrement..." : "Enregistrer"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PostEdit;