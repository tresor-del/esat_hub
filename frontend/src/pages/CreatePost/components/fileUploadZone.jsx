// ─── FileUploadZone.jsx ───────────────────────────────────────────────────────
// Shared between CreatePost and PostEdit.
// Handles file selection, type validation, preview rendering.

import React from "react";
import { FiUpload } from "react-icons/fi";

const ALLOWED_PHOTO_TYPES = [
    "image/jpeg", "image/png", "image/gif", "image/webp",
];

const ALLOWED_DOC_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

export const validateFile = (file, postType) => {
    if (postType === "photo" && !ALLOWED_PHOTO_TYPES.includes(file.type)) {
        return "Type de fichier non autorisé pour une photo. Utilisez JPG, PNG, GIF ou WEBP.";
    }
    if (postType === "document" && !ALLOWED_DOC_TYPES.includes(file.type)) {
        return "Type de fichier non autorisé pour un document. Utilisez PDF, DOC, DOCX, TXT, XLS, XLSX, PPT ou PPTX.";
    }
    return null;
};

/**
 * @prop {string}        postType          — "photo" | "document"
 * @prop {File|null}     file              — currently selected new file
 * @prop {string|null}   preview           — data URL or remote URL
 * @prop {boolean}       keepExistingFile  — (edit mode only)
 * @prop {boolean}       disabled
 * @prop {Function}      onFileChange      — (file, preview) => void
 * @prop {Function}      onError           — (message) => void
 * @prop {string|null}   existingFileLabel — label shown when keeping existing file (edit mode)
 */
const FileUploadZone = ({
    postType,
    file,
    preview,
    keepExistingFile = false,
    disabled = false,
    onFileChange,
    onError,
    existingFileLabel = null,
}) => {
    const accept =
        postType === "photo"
            ? "image/*"
            : ".pdf,.doc,.docx,.txt,.xlsx,.xls,.ppt,.pptx";

    const handleChange = (e) => {
        const selected = e.target.files?.[0];
        if (!selected) return;

        const validationError = validateFile(selected, postType);
        if (validationError) {
            onError(validationError);
            return;
        }

        let previewUrl = null;
        if (postType === "photo" && selected.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onloadend = () => onFileChange(selected, reader.result);
            reader.readAsDataURL(selected);
        } else {
            onFileChange(selected, null);
        }
    };

    const renderContent = () => {
        // New file selected with image preview
        if (preview && file) {
            return (
                <div>
                    <img
                        src={preview}
                        alt="Aperçu"
                        style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "4px" }}
                    />
                    <p style={{ marginTop: "12px", color: "var(--text-secondary)" }}>
                        ✅ Nouveau fichier sélectionné — Cliquez pour changer
                    </p>
                </div>
            );
        }

        // New document selected (no image preview)
        if (file) {
            return (
                <div>
                    <div className="file-upload-icon">📄</div>
                    <strong>✅ {file.name}</strong>
                    <p style={{ marginTop: "8px", color: "var(--text-secondary)" }}>
                        Cliquez pour changer
                    </p>
                </div>
            );
        }

        // Edit mode: existing file kept, image preview available
        if (keepExistingFile && preview && postType === "photo") {
            return (
                <div>
                    <img
                        src={preview}
                        alt="Aperçu actuel"
                        style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "4px" }}
                    />
                    <p style={{ marginTop: "12px", color: "var(--text-secondary)" }}>
                        {existingFileLabel || "Fichier actuel — Cliquez pour le changer"}
                    </p>
                </div>
            );
        }

        // Edit mode: existing file kept, no image preview
        if (keepExistingFile) {
            return (
                <div>
                    <div className="file-upload-icon">
                        {postType === "photo" ? "📷" : "📄"}
                    </div>
                    <strong>Fichier actuel conservé</strong>
                    <p style={{ marginTop: "8px", color: "var(--text-secondary)" }}>
                        Cliquez pour le remplacer
                    </p>
                </div>
            );
        }

        // Default: empty state
        return (
            <>
                <div className="file-upload-icon">
                    <FiUpload />
                </div>
                <strong>Cliquez pour sélectionner un fichier</strong>
                <p style={{ marginTop: "8px", color: "var(--text-secondary)" }}>
                    {postType === "photo"
                        ? "JPG, PNG, GIF ou WEBP"
                        : "PDF, DOC, DOCX, TXT, XLS, XLSX, PPT ou PPTX"}
                </p>
            </>
        );
    };

    return (
        <div className="file-upload">
            <input
                type="file"
                id="file"
                accept={accept}
                onChange={handleChange}
                style={{ display: "none" }}
                disabled={disabled}
            />
            <label htmlFor="file" className="file-upload-label" style={{ cursor: "pointer" }}>
                {renderContent()}
            </label>
        </div>
    );
};

export default FileUploadZone;