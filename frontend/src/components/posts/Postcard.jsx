import React, { useState } from "react";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { FiLock, FiGlobe, FiMessageCircle, FiArrowLeft, FiMoreHorizontal, FiHeart } from "react-icons/fi";
import { IoEarth } from "react-icons/io5";
import PostAuthorInfo from "./PostAuthorInfo";
import PostActionsMenu from "./PostActionsMenu";
import PostMedia from "./PostMedia";
import { useLocation } from "react-router-dom";
import { getComments, getUserProfile, togglePostLike } from "../../services/api";
import { formatRelativeDate } from "../../utils/dateFormatter";
import PostCardSkeleton from "../skeletons/PostcardSkeleton";
import CommentSection from "../comments/CommentSection";
import PostDetailModal from "./postDetailModal";
import { FiShare2 } from "react-icons/fi";
import "../../styles/Posts/PostCard.css"
import "../../styles/Rooms/Room.css"
import SharePostModal from "./modals/SharePostModal";

const PostCard = ({
  post,
  onEdit,
  onDelete,
  onToggleStatus,
  onView,
  variant = "list",
  detail = false,
  commentCount
}) => {

  // const [commentsLength, setCommentLength] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isModaleOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [sharePost, setSharePost] = useState(false);
  const [openPostAtions, setOpenPostActions] = useState(false)
  // const [likesCount, setLikesCount] = useState(post?.likes_count ?? 0);
  // const [likedByMe, setLikedByMe] = useState(post?.liked_by_me ?? false);
  const [loadingLike, setLoadingLike] = useState(false);
  const likeLockRef = React.useRef(false);
  const queryClient = useQueryClient()
  // const [user, setUser] = useState()

  // const { data: commentsData } = useQuery({
  //   queryKey: ["commentsCount", post.id],
  //   queryFn: () => getComments(post.id),
  //   staleTime: 1000 * 60,
  // });

  const commentsLength = commentCount ?? post.comments_count ?? 0;

  // useEffect(() => {
  //   setLikesCount(post?.likes_count ?? 0);
  //   setLikedByMe(post?.liked_by_me ?? false);
  // }, [post?.id, post?.likes_count, post?.liked_by_me]);

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

  const handleShareClick = () => {
    setSharePost(true);
  }

  // données directement dans le cache.
  const likesCount = post?.likes_count ?? 0;
  const likedByMe = post?.liked_by_me ?? false;
  
  // mise à jours des likes directement dans le cache.
  const patchPostInCache = (updater) => {
    queryClient.setQueryData(["posts"], (old) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          posts: page.posts.map((p) =>
            p.id === post.id ? updater(p) : p
          ),
        })),
      };
    });
  };

  const handleLikeClick = async (e) => {
    e.stopPropagation();
    if (likeLockRef.current) return;
    likeLockRef.current = true;
    setLoadingLike(true);

    const snapshot = queryClient.getQueryData(["posts"]);

    // mise à jour dans le cache
    patchPostInCache((p) => ({
      ...p,
      liked_by_me: !p.liked_by_me,
      likes_count: p.liked_by_me ? p.likes_count - 1 : p.likes_count + 1,
    }));

    try {
      const result = await togglePostLike(post.id);
      // 2. Sync avec la vraie valeur du backend (source de vérité)
      patchPostInCache((p) => ({
        ...p,
        liked_by_me: result.liked_by_me,
        likes_count: result.likes_count,
      }));
    } catch (error) {
      // 3. Rollback si l'API échoue
      queryClient.setQueryData(["posts"], snapshot);
      console.error("Erreur lors du like du post:", error);
    } finally {
      likeLockRef.current = false;
      setLoadingLike(false);
    }
  };

  const closeSharePostModal = () => {
    setSharePost(false);
  }

  const handleOpenPostActions = () => {
    setOpenPostActions(true)
  }

  const handleClosePostActions = () => {
    setOpenPostActions(false)
  }


  return (
    <div className={`post-card ${detail ? 'post-detail-card' : ''}`}>
      <div className="post-content post-content-d">
        {/* Métadonnées avec avatar */}
        <div className="post-header">
          <div className="post-meta">
            <PostAuthorInfo
              user={post.user}
              createdAt={post.created_at}
              dateVariant="relative"
              showAvatar={true}
              openModal={false}
              variant="default"
              postDate={formatRelativeDate(post.created_at)}
            />

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <FiMoreHorizontal fontSize={25} opacity={0.6} onClick={handleOpenPostActions} />
              {post.room_id ? (<FiLock opacity={0.6} />) : (<IoEarth opacity={0.6} />)}
            </div>

          </div>

          {/* Titre du poste */}
          <h3 className="post-title">{post.title}</h3>

          {/* Description */}
          {post.description && (
            <div>
              {!detail ? (

                <p className={`post-description ${isExpanded ? 'expanded' : 'clamped'}`}>
                  {post.description}
                </p>
              ) : (
                <p className={`post-description`}>
                  {post.description}
                </p>
              )}
              {!detail && post.description.length > 50 &&
                (<span className="read-more-btn" onClick={toggleReadMore}>
                  {isExpanded ? " Voir moins" : "Voir plus"}
                </span>)

              }
            </div>
          )}
        </div>

        {/* Médias */}
        <PostMedia post={post} />

        {/* {!detail ? ( */}
          <div className="post-action" >
            <button type="button" className={`post-action-btn ${likedByMe ? "liked" : ""}`} onClick={handleLikeClick} disabled={loadingLike}>
              <FiHeart size={20} fill={likedByMe ? "#ef4444" : "none"} color={likedByMe ? "#ef4444" : undefined} />
              {likesCount}
            </button>
            <span className="post-action-btn" onClick={handleCardClick}> <FiMessageCircle size={25} /> {commentsLength}</span>
            <span className="post-action-btn" onClick={handleShareClick}><FiShare2 size={20} /></span>
          </div>
        {/* ) : ( */}
          {/* <span className="post-action-btn">Commentaires</span> */}
        {/* )} */}


      </div>

      {selectedPostId && (
        <PostDetailModal
          postId={selectedPostId}
          onClose={() => setSelectedPostId(null)}
          onPostDeleted={(id) => {
            // Optionnel : retirez le post de votre liste locale si supprimé
          }} a
        />
      )}

      {sharePost && (
        <SharePostModal
          post={post}
          onClose={closeSharePostModal}
        />
      )}

      {openPostAtions && (
        <PostActionsMenu
          post={post}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleStatus={onToggleStatus}
          onClose={handleClosePostActions}
        />
      )}

    </div>
  );
};

export default PostCard;
