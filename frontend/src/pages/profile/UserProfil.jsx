import { useQuery } from "@tanstack/react-query";
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
import PostAuthorInfo from "../../components/posts/PostAuthorInfo";

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // const [profile, setProfile] = useState(null);
  // const [posts, setPosts] = useState([]);
  // const [stats, setStats] = useState({ postsCount: 0, });
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  // const [error, setError] = useState("");
  const [qrValue, setQrValue] = useState()
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const isOwnProfile = currentUser?.id === id;

  // Profil
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["userProfile", id],
    queryFn: () => isOwnProfile ? Promise.resolve(currentUser) : getUserProfile(id),
    staleTime: isOwnProfile ? Infinity : 1000 * 60 * 5, 
    enabled: !!id,
  });

  // Posts
  const { data: postsData } = useQuery({
    queryKey: ["userPosts", id],
    queryFn: () => getPosts({ user_id: id }),
    staleTime: 1000 * 60,
    enabled: !!profile,
  });

  const posts = postsData?.posts || [];
  const stats = { postsCount: postsData?.total || 0 };


  // useEffect(() => {
  //   loadProfile();

  // }, [id]);

  // Détection des petits écrans
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // const loadProfile = async () => {
  //   try {
  //     setLoading(true);
  //     const result = isOwnProfile ? currentUser : await getUserProfile(id);
  //     setProfile(result);
  //     loadUserPosts(result.id);
  //     setQrValue(result.card_number)
  //   } catch (err) {
  //     console.error(err);
  //     setError("Impossible de charger le profil");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const loadUserPosts = async (userId) => {
  //   try {
  //     const result = await getPosts({ user_id: userId });
  //     console.log(result.posts)
  //     setPosts(result.posts || []);

  //     // Calculer les stats
  //     setStats({
  //       postsCount: result.total || 0,
  //     });
  //   } catch (err) {
  //     console.error("Erreur lors du chargement des posts:", err);
  //   }
  // };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long"
    });
  };

  if (isLoading) {
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

        <div className="profile-header">
          {/* Avatar */}
          <div className="profile-side">
            <div className="profile-avatar-container">
              {isMobile ? (
                <div className="u-i">
                  <Avatar user={profile} size="large" />
                  <div className="ui-items">
                    <span style={{fontWeight: "bold"}}>{profile.profil_name}</span>
                    <span style={{color: "#777"}}>{profile.username}</span>
                  </div>
                </div>
              ):
              (
                <Avatar user={profile} size="xlarge" />
                
              )}
              
            </div>

            <div className="profile-meta">
              
                  {isOwnProfile && (
                    <button
                      className="btn btn-secondary profile-edit-btn"
                      onClick={() => navigate('/profile/edit')}
                      style={{ marginBottom: '16px' }}
                    >
                      <FiEdit2 size={16} style={{ marginRight: '8px' }} />
                      Modifier le profil
                    </button>
                  )}

              {isMobile ? (
                <div></div>
              ):
              (
              <div className="profile-name">
                <h2 >{profile.profil_name}</h2>
                <span>{profile.username}</span>
              </div>
              )}


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
                {isMobile ? (
                  // Version mobile compacte du QR code
                  <div>
                    
                  </div>
                ) : (
                  // Version desktop normale
                  <div className="profile-meta-item">
                    {/* <QRCode
                      value={qrValue}
                      size={64}
                      level="H"
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    /> */}
                  </div>
                )}
                
              </div>
            </div>

          </div>

          {/* Informations */}
          <div className="profile-info">

            {/* Liste des posts */}
            <div className="profile-posts">

              {posts.length === 0 ? (
                <div className="empty-state card">
                  <p> <span style={{fontWeight: "bold"}}>{profile.profil_name} </span> n'a aucun post pour l'instant.</p>
                </div>
              ) : (
                <div className="posts-grid">
                  {(isMobile ? posts.slice(0, 3) : posts).map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onView={(p) => navigate(`/post/${p.id}`)}
                      variant={isMobile ? "compact" : "list"}
                    />
                  ))}
                  {isMobile && posts.length > 3 && (
                    <div className="load-more-mobile" style={{ textAlign: 'center', padding: '16px' }}>
                      <button className="btn btn-secondary" onClick={() => navigate(`/profile/${id}/posts`)}>
                        Voir tous les posts ({posts.length})
                      </button>
                    </div>
                  )}
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