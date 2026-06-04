// ─── PostEdit/index.jsx ───────────────────────────────────────────────────────

import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePostEdit } from "./hooks/usePostEdit";
import { useAuth } from "../../contexts/AuthContext";
import Avatar from "../../components/ui/Avatar";
import HomeSidebar from "../Home/components/HomeSidebar";
import FileUploadZone from "../CreatePost/components/fileUploadZone";
import "../../styles/PostEdit.css"
import "../../styles/PostCreate.css"
import "../../styles/Home.css"
import "../../styles/Chat.css"
import "../../styles/Auth.css"

const PostEdit = () => {
    const { id } = useParams();
    const {user: fullUser } = useAuth();
    const navigate = useNavigate();

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
        <div className="pc-container">
            <div className="card post-create-container">
                <div className="card-header">
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
                                onClick={() => navigate(`/post/${id}`)}
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

            <HomeSidebar fullUser={fullUser} userAuth={fullUser} className="on-chat" />

        </div>
    );
};

export default PostEdit;