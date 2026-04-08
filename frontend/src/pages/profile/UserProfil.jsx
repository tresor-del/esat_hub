// pages/UserProfile.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiEdit2, FiMail, FiCalendar, FiArrowLeft } from "react-icons/fi";
import { TbSchool } from "react-icons/tb";
import { RiSchoolLine } from "react-icons/ri";
import { MdOutlineDomainVerification } from "react-icons/md";
import { getUserProfile, getPosts, uploadAvatar } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import Avatar from "../components/Avatar";
import PostCard from "../components/Postcard";
import { jsx } from "react/jsx-runtime";

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({ postsCount: 0,});
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState("");

  const isOwnProfile = currentUser?.id === id;

  useEffect(() => {
    loadProfile();
    loadUserPosts();
  }, [id]);

  const loadProfile = async () => {
    try {
      setLoading(true);
        const result = await getUserProfile(id);
        console.log("resdkddlk", result)
        setProfile(result);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger le profil");
    } finally {
      setLoading(false);
    }
  };

  const loadUserPosts = async () => {
    try {
      const result = await getPosts({ id: id});
      console.log(result.posts)
      setPosts(result.posts || []);
      
      // Calculer les stats
      setStats({
        postsCount: result.total || 0,
      });
    } catch (err) {
      console.error("Erreur lors du chargement des posts:", err);
    }
  };

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
      await uploadAvatar(file);
      localStorage.setItem(`avatar_bust_${currentUser.id}`, Date.now());
      // Recharger le profil
      await loadProfile();
    } catch (err) {
      console.error("Erreur lors de l'upload:", err);
      alert("Impossible de mettre à jour la photo de profil");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", { 
      year: "numeric", 
      month: "long" 
    });
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: "40px 20px", textAlign: "center" }}>
        <div className="loading">Chargement du profil...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container" style={{ padding: "40px 20px", textAlign: "center" }}>
        <p className="alert alert-error">{error || "Profil introuvable"}</p>
      </div>
    );
  }

  return (
    <div className="profile-container container">
      

      {/* Carte de profil */}
      <div className="profile-card card">

        {/* Bouton retour */}
      <button className="back-button" onClick={() => navigate(-1)}>
        <FiArrowLeft size={18} />
        Retour
      </button>

        <div className="profile-header">
          {/* Avatar */}
          <div className="profile-avatar-container">
            <Avatar user={profile} size="xlarge" />
            
            {isOwnProfile && (
              <label className="avatar-upload-btn">
                <FiEdit2 size={16} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                  style={{ display: "none" }}
                />
              </label>
            )}
            
          </div>

          {/* Informations */}
          <div className="profile-info">
            
            <h1 className="profile-name">{profile.profil_name}</h1>
            
            <div className="profile-meta">

              {/* <div className="profile-meta-item">
                <FiMail size={16} />  
                <span>{profile.email}</span>
              </div> */}

              <div className="profile-meta-item">
                <RiSchoolLine size={16} />
                <span>{profile.school_name}</span>
              </div>

              <div className="profile-meta-item">
                <MdOutlineDomainVerification size={16} />
                <span>{profile.domain}</span>
              </div>

              <div className="profile-meta-item">
                <TbSchool size={16} />
                <span>{profile.level}</span>
              </div>
              
              {profile.created_at && (
                <div className="profile-meta-item">
                  <FiCalendar size={16} />
                  <span>Membre depuis {formatDate(profile.created_at)}</span>
                </div>
              )}
            </div>

            {/* Statistiques */}
            <div className="profile-stats">
              <div className="profile-stat">
                
              </div>
            </div>

            {/* Liste des posts */}
      <div className="profile-posts">

        {/* <h2 className="section-title">
          {isOwnProfile ? "Mes posts" : "Posts de l'utilisateur"}
        </h2> */}

        {posts.length === 0 ? (
          <div className="empty-state card">
            <p>Aucun post pour l'instant.</p>
          </div>
        ) : (
          <div className="posts-grid">
            {posts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post}
                onView={(p) => navigate(`/post/${p.id}`)}
                variant="list"
              />
            ))}
          </div>
        )}
      </div>
          </div>
        </div>
        
      </div>

      
    </div>
  );
};

export default UserProfile;