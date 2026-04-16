// pages/UserProfile.jsx
import React, { useState, useEffect } from "react";
import QRCode from "react-qr-code"
import { useParams, useNavigate } from "react-router-dom";
import { FiEdit2, FiMail, FiCalendar, FiArrowLeft } from "react-icons/fi";
import { TbSchool } from "react-icons/tb";
import { RiSchoolLine } from "react-icons/ri";
import { MdOutlineDomainVerification } from "react-icons/md";
import { getUserProfile, getPosts, uploadAvatar } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import Avatar from "../../components/ui/Avatar";
import PostCard from "../../components/posts/Postcard";
import { jsx } from "react/jsx-runtime";

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
      const result = await getPosts({ id: id });
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
          <button className="back-button" onClick={() => navigate(-1)}>
            <FiArrowLeft size={18} />
            Retour
          </button>
          <div>
            {profile.card_number}
          </div>
        </div>




        <div className="profile-header">
          {/* Avatar */}
          <div className="profile-side">
            <div className="profile-avatar-container">
              <Avatar user={profile} size="xlarge" />

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

          {/* Informations */}
          <div className="profile-info">

            <h1 className="profile-name">{profile.profil_name}</h1>


            <div className="profile-meta">

            
              <div className="info">
                <div className="profile-meta-item">
                  <MdOutlineDomainVerification size={16} />
                  <span>{profile.domain}</span>
                </div>

                <div className="profile-meta-item">
                  <TbSchool size={16} />
                  <span>{profile.level}-{profile.year}</span>
                </div>

                {profile.created_at && (
                  <div className="profile-meta-item">
                    <FiCalendar size={16} />
                    <span>Membre depuis {formatDate(profile.created_at)}</span>
                  </div>
                )}
              </div>
              <div className="qr-code">
                <QRCode
                  value={profile.email}
                  size={100}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>

            </div>



            {/* Liste des posts */}
            <div className="profile-posts">


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