// pages/UserProfile.jsx
import React, { useState, useEffect } from "react";
import QRCode from "react-qr-code"
import { useParams, useNavigate } from "react-router-dom";
import { FiEdit2, FiMail, FiCalendar, FiArrowLeft, FiUser } from "react-icons/fi";
import { TbSchool } from "react-icons/tb";
import { RiSchoolLine } from "react-icons/ri";
import { MdOutlineDomainVerification } from "react-icons/md";
import { getUserProfile, getPosts, uploadAvatar } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import Avatar from "../../components/ui/Avatar";
import PostCard from "../../components/posts/Postcard";

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({ postsCount: 0, });
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState("");

  const isOwnProfile = currentUser?.id === id;

  useEffect(() => {
    loadProfile();

  }, [id]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const result = await getUserProfile(id);
      setProfile(result);
      loadUserPosts(result.id);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger le profil");
    } finally {
      setLoading(false);
    }
  };

  const loadUserPosts = async (userId) => {
    try {
      const result = await getPosts({ user_id: userId });
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
    <div className="profile-container">


      {/* Carte de profil */}
      <div className="profile-card card">

        {/* Bouton retour */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {/* <button className="back-button" onClick={() => navigate(-1)}>
            <FiArrowLeft size={18} />
            Retour
          </button> */}
          <div>

          </div>
        </div>


        <div className="profile-header">
          {/* Avatar */}
          <div className="profile-side">
            <div className="profile-avatar-container">
              <Avatar user={profile} size="xlarge" />

            </div>


            <div className="profile-meta">
              <div className="profile-name">
                <h2 >{profile.profil_name}</h2>
                <span>{profile.username}</span>
              </div>


              <div className="info">
                <div className="profile-meta-item">
                  <FiUser size={16} />
                  <span>{profile.last_name} {profile.first_name}</span>
                </div>

                <div className="profile-meta-item">
                  <FiMail size={16} />
                  <span>{profile.email}</span>
                </div>

                <div className="profile-meta-item">
                  <MdOutlineDomainVerification size={16} />
                  <span>{profile.domain}-{profile.major}</span>
                </div>

                <div className="profile-meta-item">
                  <TbSchool size={16} />
                  <span>{profile.level}-{profile.year}</span>
                </div>
                <div className="profile-meta-item">
                  <QRCode
                    value={profile?.card_number}
                    size={64}      // C'est ici que tu règles la taille (en pixels)
                    level="H"      // Optionnel : niveau de correction d'erreur (L, M, Q, H)
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }} // Optionnel : pour le rendre responsive
                  />
                </div>
                <div>
                  {isOwnProfile && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => navigate('/profile/edit')}
                      style={{ marginBottom: '16px' }}
                    >
                      <FiEdit2 size={16} style={{ marginRight: '8px' }} />
                      Modifier le profil
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Informations */}
          <div className="profile-info">


            {/* Liste des posts */}
            <div className="profile-posts">

              <h3>Les publications de {profile.profil_name}</h3><br /><br />

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