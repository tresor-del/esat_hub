// ─── postDetailModal.jsx ──────────────────────────────────────────────────────

import React, { useEffect } from "react";
import { FiX } from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";

import PostCard from "../../components/posts/Postcard";
import PostCardSkeleton from "../../components/skeletons/PostcardSkeleton";
import CommentSection from "../../components/comments/CommentSection";
import { usePostDetail } from "../../components/posts/hooks/usePostDetail";

import "../../styles/CommentSection.css";
import "../../styles/PostDetail.css";

/**
 * @prop {string}   postId
 * @prop {Function} onClose
 * @prop {Function} onPostDeleted  — optional, called with deleted post id
 */
const PostDetailModal = ({ postId, onClose, onPostDeleted }) => {
  const { user } = useAuth();

  const {
    post,
    loading,
    error,
    loadPost,
    handleEdit,
    handleDelete,
    handleCommentAdded,
  } = usePostDetail({ onClose, onPostDeleted });

  useEffect(() => {
    if (postId) loadPost(postId);
  }, [postId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <p className="alert alert-error">{error}</p>;

  return (
    <div className="post-detail-modal" onClick={onClose}>
      <div className="post-card-container" onClick={(e) => e.stopPropagation()}>
        <div className="post-content">
          <div className="return-to-post-btn" onClick={onClose}>
            <FiX size={20} />
          </div>

          {loading ? (
            <PostCardSkeleton />
          ) : (
            <PostCard
              key={post.id}
              post={post}
              onEdit={handleEdit}
              onDelete={handleDelete}
              detail={true}
            />
          )}

          <br />
          {!loading && post && (
            <CommentSection
              postId={post.id}
              user={user}
              onCommentAdded={handleCommentAdded}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PostDetailModal;