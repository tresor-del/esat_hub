import React, { useState } from "react";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiLock, FiGlobe, FiMessageCircle, FiArrowLeft } from "react-icons/fi";
import { IoEarth } from "react-icons/io5";
import PostAuthorInfo from "./PostAuthorInfo";
import PostActionsMenu from "./PostActionsMenu";
import PostMedia from "./PostMedia";
import { useLocation } from "react-router-dom";
import { getComments, getUserProfile } from "../../services/api";
import { formatRelativeDate } from "../../utils/dateFormatter";
import PostCardSkeleton from "../skeletons/PostcardSkeleton";
import CommentSection from "../comments/CommentSection";
import PostDetailModal from "./postDetailModal";
import "../../styles/PostCard.css"

const PostCard = ({
  post,
  onEdit,
  onDelete,
  onToggleStatus,
  onView,
  variant = "list",
  detail = false
}) => {

  // const [commentsLength, setCommentLength] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isModaleOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  // const [user, setUser] = useState()

  const { data: commentsData } = useQuery({
    queryKey: ["commentsCount", post.id],
    queryFn: () => getComments(post.id),
    staleTime: 1000 * 60,
  });

  const commentsLength = commentsData?.total || 0;

  useEffect(() => {
    const handResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handResize);
    // fetchCount()
    return () => window.removeEventListener("resize", handResize);
  }, []);

  const toggleReadMore = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  }


  const handleCardClick = (e) => {
    if (variant === "detail") return;
    if (e.target.closest("button") || e.target.closest(".read-more-btn")) return;

    if (isMobile) {
      if (onView) {
        onView(post);
      }
    } else {
      // if (onView) {
      //   onView(post);
      // }
      setSelectedPostId(post.id)
    }
  };


  return (
    <div className={`post-card ${detail ? 'post-detail-card' : ''}`}>
      <div className="post-content post-content-d">
        {/* Métadonnées avec avatar */}
        <div className="post-meta">
          <PostAuthorInfo
            user={post.user}
            createdAt={post.created_at}
            dateVariant="relative"
            showAvatar={true}
            openModal={false}
            variant="compact"
          />

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {post.room_id ? (<FiLock />) : (<IoEarth />)}
            <PostActionsMenu post={post} onEdit={onEdit} onDelete={onDelete} onToggleStatus={onToggleStatus} />
          </div>
        </div>

        {/* Titre du poste */}
        <h3 className="post-title">{post.title}</h3>

        {/* Description */}
        {post.description && (
          <div>
            <p className={`post-description ${isExpanded ? 'expanded' : 'clamped'}`}>
              {post.description}
            </p>
            {post.description.length > 50 && (
              <span className="read-more-btn" onClick={toggleReadMore}>
                {isExpanded ? " Voir moins" : "Voir plus"}
              </span>
            )}
          </div>
        )}

        {/* Médias */}
        <PostMedia post={post} />

        <div className="post-action" >
          <span className="post-action-btn" onClick={handleCardClick}>{commentsLength} commentaires</span>
          <span className="post-action-btn time" >{formatRelativeDate(post.created_at)}</span>
        </div>

      </div>
      {/* 
      {isModaleOpen && (
        <div className="post-detail-modal">

          <div className="post-card-container">
            <div className="return-to-post-btn" onClick={() => setIsModalOpen(false)}>
              <FiArrowLeft />
            </div>
            <div className="" style={{ cursor: "default" }}>
              <div className="post-content">
                {/* Bouton retour */}


      {/* {loading ? (
                  <PostCardSkeleton />
                ) :
                  (
                    <PostCard
                      key={post.id}
                      post={post}
                      // onEdit={handleEdit}
                      // onDelete={handleDelete}
                      detail={true}
                    />
                  )}

                <br />
                <CommentSection
                  postId={post.id}
                  user={post.user}
                // onCommentAdded={handleCommentAdded}
                />
              </div> */}

      {/* </div> */}
      {/* </div> */}

      {/* </div> */}
      {/* )} */}

      {selectedPostId && (
        <PostDetailModal
          postId={selectedPostId}
          onClose={() => setSelectedPostId(null)}
          onPostDeleted={(id) => {
            // Optionnel : retirez le post de votre liste locale si supprimé
          }}
        />
      )}

    </div>
  );
};

export default PostCard;
