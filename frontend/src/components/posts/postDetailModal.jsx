import React, { useEffect, useState } from "react";
import { FiX } from "react-icons/fi"; // Remplacement par une icône de fermeture
import { getPost, deletePost } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import CommentSection from "../../components/comments/CommentSection";
import PostCard from "../../components/posts/Postcard";
import PostCardSkeleton from "../../components/skeletons/PostcardSkeleton";
import "../../styles/CommentSection.css";
import "../../styles/PostDetail.css";

const PostDetailModal = ({ postId, onClose, onPostDeleted }) => {
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    if (postId) {
      loadPost();
    }
  }, [postId]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const result = await getPost(postId);
      setPost(result);
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement du post");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (currentPost) => {
    // Si vous êtes en production dans un modal, vous pouvez rediriger ou ouvrir un sous-modal
    window.location.href = `/edit/${currentPost.id}`;
  };

  const handleDelete = async (currentPost) => {
    if (!confirm("Voulez-vous vraiment supprimer ce post ?")) return;
    try {
      await deletePost(currentPost.id);
      onClose(); // Ferme le modal
      if (onPostDeleted) onPostDeleted(currentPost.id); // Notifie le parent pour rafraîchir la liste
    } catch (err) {
      console.error(err);
      alert("Impossible de supprimer le post.");
    }
  };

  const handleCommentAdded = (count) => {
    setCommentCount(count);
  };

  if (error) return <p className="alert alert-error">{error}</p>;

  return (
    <div className="post-detail-modal" onClick={onClose}>
      <div className="post-card-container" onClick={(e) => e.stopPropagation()}>
        <div className="post-content">
          
          {/* Bouton de fermeture moderne en haut à droite */}
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
