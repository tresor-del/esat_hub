import { useParams, useNavigate, useLocation } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { getPost, deletePost } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import PostAuthorInfo from "../../components/posts/PostAuthorInfo"
import PostActionsMenu from "../../components//posts/PostActionsMenu";
import PostMedia from "../../components/posts/PostMedia";
import CommentSection from "../../components/comments/CommentSection";
import PostCard from "../../components/posts/Postcard";
import "../../styles/CommentSection.css"
import "../../styles/PostDetail.css"
import "../../styles/PostMedia.css"

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentCount, setCommentCount] = useState(0)
  const [commentsLoaded, setCommentsLoaded] = useState(false);

  const location = useLocation();

  const scrollToComment = async () => {
    const params = new URLSearchParams(location.search)
    const commentId = params.get("commentId")

    if (commentId) {
      setTimeout(() => {
        const element = document.getElementById(`comment-${commentId}`);
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "center"
          })

          element.classList.add("highlight-comment");
          setTimeout(() => element.classList.remove("highlight-comment"), 2000)
        }
      }, 300);
    }
  }


  useEffect(() => {
    loadPost();

  }, [id, location.state?.updatedAt]);

  useEffect(() => {
    setTimeout(() => {
      scrollToComment();
    }, 100);
  }, [])

  const loadPost = async () => {
    try {
      setLoading(true);
      const result = await getPost(id);
      setPost(result);
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement du post");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (post) => {
    navigate(`/edit/${post.id}`);
  };

  const handleDelete = async (post) => {
    if (!confirm("Voulez-vous vraiment supprimer ce post ?")) return;

    try {
      await deletePost(post.id);
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Impossible de supprimer le post.");
    }
  };

  const goHome = () => {
    navigate("/");
  };

  const handleCommentAdded = (count) => {
    setCommentCount(count)
    if (count > 0) {
      setCommentsLoaded(true);
    }
  }

  if (loading) return <div className="loading">Chargement…</div>;
  if (error) return <p className="alert alert-error">{error}</p>;
  if (!post) return null;


  return (
    <div className="post-detail-container container">
      {/* Carte du post */}
      <div className="post-card post-detail-card" style={{ cursor: "default" }}>
        <div className="post-content">
          {/* Bouton retour */}
          <div className="return-to-post-btn" onClick={goHome}>
            <FiArrowLeft />
          </div>

          {/* Métadonnées avec avatar */}
            <PostCard
              key={post.id}
              post={post}
              onEdit={handleEdit}
              onDelete={handleDelete}
              detail={true}
            />
            <br />
            <CommentSection
              postId={id}
              user={user}
              onCommentAdded={handleCommentAdded}
            />
        </div>

      </div>
    </div>
  );
};

export default PostDetail;