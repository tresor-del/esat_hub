import { useQuery } from "@tanstack/react-query";
import React, { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { QRCodeSVG } from 'qrcode.react';
import { useParams, useNavigate } from "react-router-dom";
import { FiEdit2, FiMail, FiCalendar, FiArrowLeft, FiUser, FiImage, FiFile, FiBookOpen, } from "react-icons/fi";
import { TbSchool } from "react-icons/tb";
import { RiSchoolLine, } from "react-icons/ri";
import { MdOutlineDomainVerification, MdEmergency, MdNotAccessible, MdNotStarted, MdNotInterested, MdNotificationsNone, MdMessage } from "react-icons/md";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { getUserProfile, getPosts, uploadAvatar } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import Avatar from "../../components/ui/Avatar";
import PostCard from "../../components/posts/Postcard";
import PostAuthorInfo from "../../components/posts/PostAuthorInfo";
import ProfileSkeleton from "../../components/skeletons/ProfileSkeleton";
import PostCardSkeleton from "../../components/skeletons/PostcardSkeleton";
import { formatRelativeDate } from "../../utils/dateFormatter";
import PostDetailModal from "../../components/posts/postDetailModal";


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
  const [selectedPost, setSelectedPost] = useState(null);

  // Profil
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["userProfile", id],
    queryFn: () => isOwnProfile ? Promise.resolve(currentUser) : getUserProfile(id),
    staleTime: isOwnProfile ? Infinity : 1000 * 60 * 5,
    enabled: !!id,
  });

  // Posts
  const { data: postsData, isLoading: postsLoading } = useQuery({
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long"
    });
  };

  if (isLoading) {
    return (
      <div >
        <ProfileSkeleton />
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

  const filteredPosts = posts.filter(
    (post) => post.room_id === null || post.room_id === currentUser?.user_room_id
  );

  const handleSeePost = (post) => {
    if (isMobile) navigate(`/post/${post.id}`);
    if (!isMobile) setSelectedPost(post.id);
  }

  const handleClose = () => {
    setSelectedPost(null)
  }

  return (
    <div className="profile-container">


      {/* Carte de profil */}
      <div className="profile-card">

        <div className="profile-header">
          {/* Avatar */}
          <div className="profile-side">
            <div className="card profile-avatar-container">
              <Avatar user={profile} size="xlarge" />

              <div className="profile-name">
                <h2 >{profile.profil_name}</h2>
                <span>{profile.username}</span>
              </div>

              {isOwnProfile ? (
                <>
                  <button
                    className="btn btn-secondary profile-edit-btn"
                    onClick={() => navigate('/profile/edit')}
                    style={{ marginBottom: '16px' }}
                  >
                    <FiEdit2 size={16} style={{ marginRight: '8px', color: "var(--reddit-blue)" }} />
                    Modifier le profil
                  </button>
                </>
              ) : (

                <button
                  className="btn btn-secondary profile-edit-btn"
                  onClick={() => navigate('/chat?user=' + profile.id)}
                  style={{ marginBottom: '16px' }}
                >
                  <MdMessage size={16} style={{ marginRight: '8px', color: "var(--reddit-blue)" }} />
                  Envoyer un message
                </button>
              )}

            </div>

            <div className="card about info">
              <h3 className="profile-title">Description</h3>
              <p className="desc">
                {profile.desc ? profile.desc : (
                  <div className="empty-container">
                    <div className="empty-container-icon">
                      <MdNotInterested />
                    </div>
                    <p>pas de description</p>
                  </div>
                )}
              </p>
            </div>

          </div>

          {/* Informations */}
          <div className="profile-info">

            <div className=" aca-info">
              <div className=" card info">
                <h3 className="profile-title">Info Académiques</h3>
                <div className="profile-meta-item">
                  <span className="label">N° de carte: </span>
                  <span className="i">{profile.card_number}</span>
                </div>
                <div className="profile-meta-item">
                  <span className="label">Nom: </span>
                  <span className="i">{(profile.last_name).toUpperCase()} {profile.first_name}</span>
                </div>

                <div className="profile-meta-item">
                  <span className="label">Email: </span>
                  <span className="i">{profile.email}</span>
                </div>

                <div className="profile-meta-item">
                  <span className="label">Domaine:</span>
                  <span className="i"> {profile.domain}</span>
                </div>

                <div className="profile-meta-item">
                  <span className="label">Spécialité:</span>
                  <span className="i">{profile.major}</span>
                </div>

                <div className="profile-meta-item">
                  <span className="label">Cycle :</span>
                  <span className="i">{profile.level}</span>
                </div>

                <div className="profile-meta-item">
                  <span className="label">Année:</span>
                  <span className="i">{profile.year}</span>
                </div>
              </div>

              <div className=" card info bg-gray-50 p-3 rounded-lg inline-block qr">
                <h3 className="profile-title">Qr Code</h3>
                <QRCodeSVG
                  value={"lienAEncoder"}
                  size={200}               // Taille en pixels (largeur/hauteur)
                  bgColor={"#ffffff"}      // Couleur de fond
                  fgColor={"#000000"}      // Couleur du code QR (adaptez à votre charte !)
                  level={"M"}              // Niveau de correction d'erreur (L, M, Q, H)
                  includeMargin={true}     // Ajoute une marge blanche de sécurité autour
                />
              </div>
            </div>

            <div className="card info posts-card">
              <h3 className="profile-title">Publications</h3>
              <div className="posts-list">
                {filteredPosts.length === 0 ? (
                  <div className="post-list-empty">
                    <div className="post-list-empty-icon">
                      <MdNotInterested />
                    </div>
                    <p>{profile.profil_name} n'a rien publié</p>
                  </div>
                ) : (
                  filteredPosts?.map((post) => (
                    <div className="post-item" onClick={() => handleSeePost(post)}>
                      <span className="post-type-icon">
                        {post.post_type === "photo" ? (
                          <FiImage size={33} />
                        ) : (<FiFile size={33} />)}
                      </span>

                      <div className="post-item-info">
                        <p>{post.title}</p>
                        <div className="item">
                          <span className="type">{post.post_type}</span>
                          {/* <span className="sep">.</span> */}
                          <span className="date">{formatRelativeDate(post.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}

              </div>

            </div>

          </div>
        </div>

      </div>

      {selectedPost && (
        <PostDetailModal postId={selectedPost} onClose={handleClose} />
      )}
    </div >
  );
};

export default UserProfile;