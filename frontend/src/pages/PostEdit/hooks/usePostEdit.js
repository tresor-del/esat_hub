// ─── usePostEdit.js ───────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { getPost, getPostFileUrl, updatePost } from "../../../services/api";

export const usePostEdit = (id) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [post, setPost] = useState(null);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        post_type: "photo",
        file: null,
    });
    const [preview, setPreview] = useState(null);
    const [keepExistingFile, setKeepExistingFile] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // ── Load post on mount ────────────────────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const result = await getPost(id);

                if (!user || user.id !== result.user?.id) {
                    setError("Vous n'êtes pas autorisé à modifier ce post");
                    setTimeout(() => navigate("/"), 2000);
                    return;
                }

                setPost(result);
                setFormData({
                    title: result.title,
                    description: result.description || "",
                    post_type: result.post_type || "photo",
                    file: null,
                });

                if (result.post_type === "photo" || result.post_type === "document") {
                    const bust = localStorage.getItem(`post_bust_${result.id}`);
                    setPreview(getPostFileUrl(result.id, bust));
                    setKeepExistingFile(true);
                }
            } catch (err) {
                console.error(err);
                setError("Erreur lors du chargement du post");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        if (error) setError("");
    };

    const handleFileChange = (file, previewUrl) => {
        setFormData((prev) => ({ ...prev, file }));
        setPreview(previewUrl);
        setKeepExistingFile(false);
        if (error) setError("");
    };

    const handleFileError = (message) => setError(message);

    const restoreExistingFile = () => {
        setFormData((prev) => ({ ...prev, file: null }));
        setKeepExistingFile(true);
        if (post?.post_type === "photo" || post?.post_type === "document") {
            const bust = localStorage.getItem(`post_bust_${post.id}`);
            setPreview(getPostFileUrl(post.id, bust));
        }
    };

    const validate = () => {
        if (!formData.title.trim()) {
            setError("Le titre est obligatoire");
            return false;
        }
        if (!formData.file && !keepExistingFile) {
            setError("Veuillez sélectionner un fichier ou conserver l'existant");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!validate()) return;

        setSaving(true);
        try {
            const data = new FormData();
            data.append("title", formData.title);
            data.append("description", formData.description);
            data.append("post_type", formData.post_type);
            if (formData.file) data.append("file", formData.file);
            if (!keepExistingFile && !formData.file) data.append("remove_file", "true");

            await updatePost(id, data);
            localStorage.setItem(`post_bust_${id}`, Date.now());
            navigate(`/post/${id}`, { state: { updatedAt: Date.now() } });
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || "Erreur lors de la modification du post");
        } finally {
            setSaving(false);
        }
    };

    return {
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
    };
};