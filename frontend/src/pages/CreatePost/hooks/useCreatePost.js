// ─── useCreatePost.js ─────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { useNavigate }         from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { createPost } from "../../../services/api";

const INITIAL_FORM = {
    title:       "",
    description: "",
    post_type:   "photo",
    post_scope:  "general",
    room_id:     null,
    file:        null,
};

export const useCreatePost = () => {
    const navigate     = useNavigate();
    const { user }     = useAuth();

    const [formData, setFormData] = useState(INITIAL_FORM);
    const [preview,  setPreview]  = useState(null);
    const [error,    setError]    = useState("");
    const [loading,  setLoading]  = useState(false);

    // Sync room_id with scope
    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            room_id:
                prev.post_scope === "private" ? (user?.user_room_id ?? null) : null,
        }));
    }, [formData.post_scope, user]);

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        if (error) setError("");
    };

    const handleFileChange = (file, previewUrl) => {
        setFormData((prev) => ({ ...prev, file }));
        setPreview(previewUrl);
        if (error) setError("");
    };

    const handleFileError = (message) => setError(message);

    const validate = () => {
        if (!formData.title.trim()) {
            setError("Le titre est obligatoire");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!validate()) return;

        setLoading(true);
        try {
            await createPost(formData);
            navigate("/");
        } catch (err) {
            const detail = err.response?.data?.detail;
            if (Array.isArray(detail))        setError(detail[0].msg);
            else if (typeof detail === "string") setError(detail);
            else setError("Erreur lors de la création du poste");
        } finally {
            setLoading(false);
        }
    };

    return {
        formData,
        preview,
        error,
        loading,
        handleChange,
        handleFileChange,
        handleFileError,
        handleSubmit,
    };
};