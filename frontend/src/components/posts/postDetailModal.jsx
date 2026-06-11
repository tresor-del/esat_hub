import React, { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";
import CommentSection from "../../components/comments/CommentSection";
import PostAuthorInfo from "../../components/posts/PostAuthorInfo";
import { usePostDetail } from "../../components/posts/hooks/usePostDetail";
import "../../styles/Posts/PostDetail.css"

const PostDetailModal = ({ postId, onClose, onPostDeleted }) => {
  const { user } = useAuth();

  const {
    post,
    loading,
    error,
    loadPost,
    handleCommentAdded,
  } = usePostDetail({ onClose, onPostDeleted });

  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (postId) loadPost(postId);
  }, [postId]);

  const handleImageLoad = (e) => {
    setImgSize({
      width: e.target.naturalWidth,
      height: e.target.naturalHeight,
    });
  };

  if (error) return <p className="alert alert-error">{error}</p>;

  const toggleReadMore = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  }

  return (
    <div className="post-detail-modal" onClick={onClose}>

      <div className="return-to-post-btn" onClick={onClose}>
        <FiX size={33} />
      </div>

      <div className="post-detail-content" onClick={(e) => e.stopPropagation()}>

        {/* IMAGE */}
        <div className="post-detail-media">

          {post?.file_path && (
            <img
              src={post.file_path}
              alt={post.title}
              className="post-image"
            />
          )}

        </div>

        {/* COMMENTS */}
        <div className="post-detail-info">
          <CommentSection
            postId={post?.id}
            user={user}
            onCommentAdded={handleCommentAdded}
          />

        </div>

      </div>
    </div>
  );
};

export default PostDetailModal;