import { useQuery } from "@tanstack/react-query";
import React, { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { QRCodeSVG } from 'qrcode.react';
import { useParams, useNavigate } from "react-router-dom";
import { FiDownload, FiShare2 } from "react-icons/fi";
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


        <div className="profile-banner">

          <div className="profile-banner-content">

            <Avatar
              user={profile}
              size="xlarge"
            />

            <div className="profile-identity">

              <h1>{profile.profil_name}</h1>

              <div className="username">
                @{profile.username}
              </div>

              <div className="profile-badges">

                <div className="profile-badge">
                  {profile.domain}
                </div>

                <div className="profile-badge">
                  {profile.major}
                </div>

                <div className="profile-badge">
                  {profile.level}
                </div>

              </div>

              <div className="profile-actions">

                {isOwnProfile ? (
                  <button
                    className="btn btn-secondary"
                    onClick={() => navigate('/profile/edit')}
                  >
                    Modifier le profil
                  </button>
                ) : (
                  <button
                    className="btn btn-secondary"
                    onClick={() => navigate('/chat?user=' + profile.id)}
                  >
                    Envoyer un message
                  </button>
                )}

              </div>

            </div>

          </div>

          <div className="profile-desc">
            {profile.desc ? (
              <div className="profile-desc-content">
                <h3 className="profile-title">
                  À propos
                </h3>

                <div className="profile-content">
                  {profile.desc || "Aucune description disponible"}
                </div>

              </div>
            ) : (
              ""
            )}

          </div>

        </div>

        <div className="profile-main-grid">

          <div className="profile-sidebar">

            <div className="card info student-card">

              <div className="profile-title">
                <h3>Scanner le QR Code</h3>
              </div>

                <div className="qr-wrapper">

                  <QRCodeSVG
                    value={`${window.location.origin}/profile/${profile.id}`}
                    size={200}
                    bgColor={"#ffffff"}
                    fgColor={"#0f172a"}
                    level={"H"}
                    includeMargin={true}
                  />

                </div>


              <div className="qr-actions">
                <div className="download">
                  <FiDownload />
                </div>
                <div className="share">
                  <FiShare2 />
                </div>
              </div>

            </div>

          </div>

          <div className="profile-content">

            <div className="card info">

              <h3 className="profile-title">
                Informations Académiques
              </h3>

              <div className="academic-grid">

                <div className="academic-item">
                  <div className="label">Numéro de carte</div>
                  <div className="value">{profile.card_number ? profile.card_number : "Null"}</div>
                </div>

                <div className="academic-item">
                  <div className="label">Nom</div>
                  <div className="value">{profile.last_name}</div>
                </div>

                <div className="academic-item">
                  <div className="label">Prénom</div>
                  <div className="value">{profile.first_name}</div>
                </div>

                <div className="academic-item">
                  <div className="label">Numéro de téléphone</div>
                  <div className="value">{profile.phone_number ? profile.phone_number : "Null"}</div>
                </div>

                <div className="academic-item">
                  <div className="label">Domaine</div>
                  <div className="value">{profile.domain}</div>
                </div>

                <div className="academic-item">
                  <div className="label">Spécialité</div>
                  <div className="value">{profile.major}</div>
                </div>

                <div className="academic-item">
                  <div className="label">Cycle</div>
                  <div className="value">{profile.level}</div>
                </div>

                <div className="academic-item">
                  <div className="label">Année</div>
                  <div className="value">{profile.year}</div>
                </div>

              </div>

            </div>



            {/* <div className="card posts-card">

              <div className="card-body">

                <h3 className="profile-title">
                  Publications
                </h3>

                <div className="posts-list">

                  {filteredPosts.length === 0 ? (
                    <div className="post-list-empty">
                      <MdNotInterested size={50} />
                      <p>
                        Aucune publication
                      </p>
                    </div>
                  ) : (
                    filteredPosts.map((post) => (
                      <div
                        key={post.id}
                        className="post-item"
                        onClick={() => handleSeePost(post)}
                      >
                        <span className="post-type-icon">

                          {post.post_type === "photo"
                            ? <FiImage size={24} />
                            : <FiFile size={24} />
                          }

                        </span>

                        <div className="post-item-info">

                          <p>{post.title}</p>

                          <div className="item">
                            <span className="type">
                              {post.post_type}
                            </span>

                            <span className="date">
                              {formatRelativeDate(post.created_at)}
                            </span>
                          </div>

                        </div>

                      </div>
                    ))
                  )}

                </div>
              </div>
            </div> */}

          </div>
        </div>

      </div>

    </div >
  );
};

export default UserProfile;