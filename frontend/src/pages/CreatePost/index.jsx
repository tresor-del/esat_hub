// ─── CreatePost/index.jsx ─────────────────────────────────────────────────────

import React from "react";
import { useNavigate } from "react-router-dom";
import { useCreatePost } from "./hooks/useCreatePost";
import FileUploadZone from "./components/fileUploadZone";
import { useAuth } from "../../contexts/AuthContext";
import Avatar from "../../components/ui/Avatar";
import HomeSidebar from "../Home/components/HomeSidebar";
import "../../styles/PostEdit.css"
import "../../styles/Home.css"
import "../../styles/Auth.css"

const CreatePost = ({ onClose }) => {
    const navigate = useNavigate();
    const { user: fullUser } = useAuth();

    const {
        formData,
        preview,
        error,
        loading,
        handleChange,
        handleFileChange,
        handleFileError,
        handleSubmit,
    } = useCreatePost();

    return (

        <div className="post-edit-modal-layout">
            <div className="card post-edit-modal-card">
                <div className="card-header">

                    <h2 className="card-title">Créer un nouveau poste</h2>
                </div>


                <div className="card-body">
                    {error && (
                        <div className="alert alert-error" style={{ marginBottom: "16px" }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="form">
                        <div className="post-create-info">
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
                                    disabled={loading}
                                >
                                    <option value="photo">Photo</option>
                                    <option value="document">Document</option>
                                    <option value="text">Text</option>
                                </select>
                            </div>

                            {/* Visibilité */}
                            <div className="form-group">
                                <label htmlFor="post_scope" className="form-label">
                                    Visibilité du poste *
                                </label>
                                <select
                                    id="post_scope"
                                    name="post_scope"
                                    className="form-select"
                                    value={formData.post_scope}
                                    onChange={handleChange}
                                    disabled={loading}
                                >
                                    <option value="general">Général</option>
                                    <option value="private">Pour la classe</option>
                                </select>
                            </div>
                        </div>

                        {/* Titre */}
                        <div className="form-group">
                            <label htmlFor="title" className="form-label">Titre *</label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                className="form-input"
                                placeholder="Donnez un titre à votre poste"
                                value={formData.title}
                                onChange={handleChange}
                                maxLength={255}
                                required
                                disabled={loading}
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
                                disabled={loading}
                            />
                        </div>

                        {/* Fichier */}
                        {formData.post_type !== "text" && (
                            <div className="form-group">
                                <label className="form-label">Fichier</label>
                                <FileUploadZone
                                    postType={formData.post_type}
                                    file={formData.file}
                                    preview={preview}
                                    disabled={loading}
                                    onFileChange={handleFileChange}
                                    onError={handleFileError}
                                />
                            </div>
                        )}

                        <div className="post-edit-footer">
                            <button type="button" className="btn-cancel"
                                onClick={() => navigate("/")} disabled={loading}>
                                Annuler
                            </button>
                            <button type="submit" className="btn-submit" disabled={loading}>
                                {loading ? "Création..." : "Créer le poste"}
                            </button>
                        </div>
                        
                    </form>
                </div>
            </div>
        </div>


    );
};

export default CreatePost;