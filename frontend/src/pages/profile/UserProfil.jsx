import { useQuery } from "@tanstack/react-query";
import React, { useState, useEffect } from "react";
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
import ProfileEdit from "./ProfileEdit";


const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [qrValue, setQrValue] = useState()
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const isOwnProfile = currentUser?.id === id;
  const [selectedPost, setSelectedPost] = useState(null);
  const [editProfile, seteditProfile] = React.useState();

  // Profil
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["userProfile", id],
    queryFn: () => getUserProfile(id),
    staleTime: 1000 * 60 * 5,
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


  const handleEdit = () => {
        seteditProfile(true);
    };

    const closeEditProfile = () =>{
      seteditProfile(false);
    }

  return (
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
                {profile.username}
              </div>

              <div className="username" style={{color: "yellow"}}>
                {profile.is_room_rep ? "Délégué" : ""}
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
                    onClick={() => handleEdit()}
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
                    value={`https://esathub.vercel.app/profile/${profile.id}`}
                    size={250}
                    bgColor={"#ffffff"}
                    fgColor={"#0f172a"}
                    level={"H"}
                    includeMargin={true}
                  />
                
                </div>

            </div>

          </div>

          <div className="profile-content">

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

      </div>

      {editProfile && (
                <div className="modal-overlay">
                    <div className="modal-container">

                        <button className="modal-close" onClick={closeEditProfile}>
                            ✕
                        </button>

                        <ProfileEdit onClose={closeEditProfile} />

                    </div>
                </div>
            )}

    </div >
  );
};

export default UserProfile;