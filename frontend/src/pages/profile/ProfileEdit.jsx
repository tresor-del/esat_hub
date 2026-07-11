import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiSave } from "react-icons/fi";
import { useQueryClient } from "@tanstack/react-query";
import { updateProfile, getUserProfile, uploadAvatar } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import Avatar from "../../components/ui/Avatar";
import { FiEdit2 } from "react-icons/fi";
import { useToast } from "../../contexts/toastContext";
import "../../styles/Auth/Auth.css";
import "../../styles/Posts/PostEdit.css"
import "../../styles/Users/UserProfile.css"

const ProfileEdit = ({ onClose }) => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const { user, logout, updateUser } = useAuth();
    const queryClient = useQueryClient();
    const onMobile = window.innerWidth < 768

    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const [formData, setFormData] = useState({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        profil_name: user.profil_name || '',
        email: user.email || '',
        school_name: user.school_name || '',
        domain: user.domain || '',
        level: user.level || '',
        major: user.major || '',
        year: user.year || '',
        phone_number: user.phone_number || '',
        card_number: user.card_number || '',
        birthday: user.birthday || '',
        old_password: '',
        new_password: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Vérifier le type
        if (!file.type.startsWith("image/")) {
            alert("Veuillez sélectionner une image");
            return;
        }

        // Vérifier la taille (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert("L'image ne doit pas dépasser 5 MB");
            return;
        }

        try {
            setUploadingAvatar(true);
            const result = await uploadAvatar(file);
            console.log(result)
            localStorage.setItem(`avatar_bust_${user.id}`, Date.now());
            // Recharger le profil
            updateUser({ avatar_path: result.avatar_path });
            queryClient.invalidateQueries({ queryKey: ["userProfile", user.id] });
            toast({ message: "Photo de profil mise à jour avec succès" })
        } catch (err) {
            console.error("Erreur lors de l'upload:", err);
            toast({ message: "Une erreur s'est produite, veuillez réessayer.", type: "error" })
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        if (error) setError('');
    };

    const validateForm = () => {
        if (!formData.first_name || !formData.last_name || !formData.profil_name || !formData.email) {
            setError('Veuillez remplir tous les champs obligatoires');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!validateForm()) {
            setLoading(false);
            return;
        }

        // Construire le payload sans les champs password vides
        const payload = { ...formData };
        if (!payload.new_password) {
            delete payload.new_password;
            delete payload.old_password;
        }

        try {
            await updateProfile(formData);
            queryClient.invalidateQueries({ queryKey: ["userProfile", user.id] });
            toast({ message: "Profil mis à jour !" });
            onClose();
        } catch (err) {
            const message = err.response?.status === 400
                ? "Données invalides ou profil_name déjà utilisé"
                : "Erreur lors de la mise à jour";
            toast({ message, type: "error" });
        } finally {
            setLoading(false);
        }
    };

    if (!user || Object.keys(user).length === 0) {
        return <div className="container">Chargement...</div>;
    }

    if (success) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <h2 className="auth-title">Profil mis à jour !</h2>
                    <div className="alert alert-success">
                        Vos informations ont été enregistrées avec succès.
                    </div>
                    <p>Redirection vers votre profil...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="post-edit-modal-layout">
            <div className="card post-edit-modal-card">
                <div className="card-header">
                    {onMobile && <FiArrowLeft size={30} onClick={() => onClose()} />}

                    <h2 className="card-title">Modifier le profile</h2>
                </div>

                {error && (
                    <div className="alert alert-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="edit-form">
                    <div className="profile-side">
                        <div className="profile-avatar-container">
                            <Avatar user={user} size="xlarge" uploading={uploadingAvatar} />

                            <label className="avatar-upload-btn">
                                 Changer la photo
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    style={{ display: "none" }}
                                />
                            </label>

                        </div>
                    </div>

                    <div className="profile-info">

                        <h1 className="group-title">Informations Personnelles: </h1>
                        <hr />

                        <div className="form-group">
                            <label htmlFor="first_name" className="form-label">
                                Prénom
                            </label>
                            <input
                                type="text"
                                id="first_name"
                                name="first_name"
                                className="form-input"
                                value={formData.first_name}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="last_name" className="form-label">
                                Nom
                            </label>
                            <input
                                type="text"
                                id="last_name"
                                name="last_name"
                                className="form-input"
                                value={formData.last_name}
                                onChange={handleChange}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="birthday" className="form-label">
                                Date de naissance
                            </label>
                            <input
                                type="date"
                                id="birthday"
                                name="birthday"
                                className="form-input"
                                value={formData.birthday}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email" className="form-label">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className="form-input"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone_number" className="form-label">
                                Numéro de Télephone
                            </label>
                            <input
                                type="phone_number"
                                id="phone_number"
                                name="phone_number"
                                className="form-input"
                                value={formData.phone_number}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>

                        <h1 className="group-title">Informations du Compte: </h1>
                        <hr />

                        <div className="form-group">
                            <label htmlFor="profil_name" className="form-label">
                                Nom de profil
                            </label>
                            <input
                                type="text"
                                id="profil_name"
                                name="profil_name"
                                className="form-input"
                                value={formData.profil_name}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>

                        <h1 className="group-title">Informations Académiques: </h1>
                        <hr />

                        <div className="form-group">
                            <label htmlFor="first_name" className="form-label">
                                Numéro de carte
                            </label>
                            <input
                                type="text"
                                id="card_number"
                                name="card_number"
                                className="form-input"
                                value={formData.card_number}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="school_name" className="form-label">
                                École
                            </label>
                            <select
                                name="school_name"
                                value={formData.school_name}
                                onChange={handleChange}
                                disabled={loading}
                                className="form-input"
                            >
                                <option value="">Choisir...</option>
                                <option value="ESAT_TOGO">ESAT-TOGO</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="domain" className="form-label">
                                Domaine
                            </label>
                            <select
                                name="domain"
                                value={formData.domain}
                                onChange={handleChange}
                                disabled={loading}
                                className="form-input"
                            >
                                <option value="">Choisir...</option>
                                <option value="INFORMATIQUE">Informatique</option>
                                <option value="AERONAUTIQUE">Aéronautique</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="level" className="form-label">
                                Niveau
                            </label>
                            <select
                                name="level"
                                value={formData.level}
                                onChange={handleChange}
                                disabled={loading}
                                className="form-input"
                            >
                                <option value="">Choisir...</option>
                                <option value="PREPA">Cycle Préparatoire</option>
                                <option value="INGE">Cycle Ingénieur</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="year" className="form-label">
                                Année
                            </label>
                            <select
                                name="year"
                                value={formData.year}
                                onChange={handleChange}
                                disabled={loading}
                                className="form-input"
                            >
                                <option value="">Choisir...</option>
                                <option value="PREMIERE_ANNEE">1 ere année</option>
                                <option value="DEUXIEME_ANNEE">2 eme année</option>
                                <option value="TROISIEME_ANNEE">3 eme année</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="type" className="form-label">
                                Filiere
                            </label>
                            <select
                                name="major"
                                value={formData.major}
                                onChange={handleChange}
                                disabled={loading}
                                className="form-input"
                            >
                                <option value="">Choisir...</option>
                                <option value="IA">Intelligence Artificielle</option>
                                <option value="CYBERSECURITE">Cybersécurité</option>
                            </select>
                        </div>

                        <h1 className="group-title red-zone">Modifier le mot de passe:</h1>
                        <hr />

                        <div className="form-group">
                            <label htmlFor="profil_name" className="form-label">
                                Ancien mot de passe
                            </label>
                            <input
                                type="password"
                                className="form-input"
                                id="old_password"
                                name="old_password"
                                className="form-input"
                                value={formData.old_password}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="profil_name" className="form-label">
                                Nouveau mot de passe
                            </label>
                            <input
                                type="password"
                                id="new_password"
                                name="new_password"
                                className="form-input"
                                value={formData.new_password}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>

                        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                            <button
                                type="submit"
                                className="btn btn-secondary"
                                disabled={loading}
                                onClick={() => onClose()}
                            >
                                Annuler
                            </button>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                <FiSave size={16} style={{ marginRight: '8px' }} />
                                {loading ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </div>

                    </div>

                </form>
            </div>
        </div>
    );
};

export default ProfileEdit;