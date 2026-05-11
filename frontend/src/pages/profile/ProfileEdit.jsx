import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiSave } from "react-icons/fi";
import { updateProfile, getUserProfile, uploadAvatar } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import Avatar from "../../components/ui/Avatar";
import { FiEdit2 } from "react-icons/fi";
import "../../styles/Auth.css";
import "../../styles/UserProfile.css"

const ProfileEdit = () => {
    const navigate = useNavigate();
    const { user, logout, updateUser } = useAuth();

    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    // const [profile, setProfile] = useState(null);

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
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // useEffect(() => {
    //     loadProfile();
    // }, []);

    // const loadProfile = async () => {
    //     try {
    //         setLoading(true);
    //         const result = await getUserProfile(user.id);
    //         setProfile(result);
    //         setFormData({
    //             first_name: result.first_name || '',
    //             last_name: result.last_name || '',
    //             profil_name: result.profil_name || '',
    //             email: result.email || '',
    //             school_name: result.school_name || '',
    //             domain: result.domain || '',
    //             level: result.level || '',
    //             major: result.major || '',
    //             year: result.year || '',
    //             phone_number: result.phone_number || '',
    //             card_number: result.card_number || '',
    //             birthday: result.birthday || '',
    //         });
    //     } catch (err) {
    //         console.error('Erreur chargement profil:', err);
    //         setError('Impossible de charger le profil');
    //     } finally {
    //         setLoading(false);
    //     }
    // };


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
            localStorage.setItem(`avatar_bust_${user.id}`, Date.now());
            // Recharger le profil
            updateUser({ avatar_path: result.avatar_path });
        } catch (err) {
            console.error("Erreur lors de l'upload:", err);
            alert("Impossible de mettre à jour la photo de profil");
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

        try {
            await updateProfile(formData);
            setSuccess(true);
            setTimeout(() => {
                navigate(`/profile/${user.id}`);
            }, 2000);
        } catch (err) {
            console.error('Erreur mise à jour:', err);
            if (err.response?.status === 400) {
                setError('Données invalides ou profil_name déjà utilisé');
            } else {
                setError('Erreur lors de la mise à jour');
            }
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
        <div className="auth-container">
            <div className="auth-card edit-profile-card">
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
                                <FiEdit2 size={16} />
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
                            <label htmlFor="first_name" className="form-label">
                                Prénom *
                            </label>
                            <input
                                type="text"
                                id="first_name"
                                name="first_name"
                                className="form-input"
                                value={formData.first_name}
                                onChange={handleChange}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="last_name" className="form-label">
                                Nom *
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
                            <label htmlFor="profil_name" className="form-label">
                                Nom de profil *
                            </label>
                            <input
                                type="text"
                                id="profil_name"
                                name="profil_name"
                                className="form-input"
                                value={formData.profil_name}
                                onChange={handleChange}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email" className="form-label">
                                Email *
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className="form-input"
                                value={formData.email}
                                onChange={handleChange}
                                required
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
                                required
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
                        <button
                            type="submit"
                            className="btn btn-primary btn-full"
                            disabled={loading}
                        >
                            <FiSave size={16} style={{ marginRight: '8px' }} />
                            {loading ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default ProfileEdit;