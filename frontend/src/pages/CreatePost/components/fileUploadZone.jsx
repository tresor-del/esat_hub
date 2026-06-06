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
        if (preview && file) {
            return (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                    <img src={preview} alt="Aperçu"
                        style={{ maxWidth: "100%", maxHeight: "220px", borderRadius: "10px", objectFit: "contain" }} />
                    <p className="file-upload-text-secondary">Fichier sélectionné — cliquez pour changer</p>
                </div>
            );
        }
        if (file) {
            return (
                <div className="file-selected-doc">
                    <span className="file-selected-doc-icon">📄</span>
                    <span className="file-selected-doc-name">{file.name}</span>
                    <span className="file-selected-doc-change">Changer</span>
                </div>
            );
        }
        if (keepExistingFile && preview && postType === "photo") {
            return (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                    <img src={preview} alt="Aperçu actuel"
                        style={{ maxWidth: "100%", maxHeight: "220px", borderRadius: "10px", objectFit: "contain" }} />
                    <p className="file-upload-text-secondary">
                        {existingFileLabel || "Fichier actuel — cliquez pour changer"}
                    </p>
                </div>
            );
        }
        if (keepExistingFile) {
            return (
                <div className="file-selected-doc">
                    <span className="file-selected-doc-icon">{postType === "photo" ? "📷" : "📄"}</span>
                    <span className="file-selected-doc-name">Fichier actuel conservé</span>
                    <span className="file-selected-doc-change">Remplacer</span>
                </div>
            );
        }
        // État vide
        return (
            <>
                <div className="file-upload-icon-circle">
                    <FiUpload />
                </div>
                <div>
                    <p className="file-upload-text-primary">Glissez ou cliquez pour uploader</p>
                    <p className="file-upload-text-secondary">
                        {postType === "photo" ? "JPG, PNG, GIF ou WEBP · max 10 Mo" : "PDF, DOC, DOCX, TXT, XLS, XLSX, PPT ou PPTX"}
                    </p>
                </div>
                <button type="button" className="file-upload-browse-btn">Parcourir</button>
            </>
        );
    };

    return (
        <div>
            <input type="file" id="file" accept={accept} onChange={handleChange}
                style={{ display: "none" }} disabled={disabled} />
            <label htmlFor="file" className="file-upload-label">
                {renderContent()}
            </label>
        </div>
    );
};

export default FileUploadZone;