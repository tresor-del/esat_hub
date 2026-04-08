import { useParams, useNavigate, useLocation } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { getPost, deletePost } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import PostAuthorInfo from "../components/PostAuthorInfo";
import PostActionsMenu from "../components/PostActionsMenu";
import PostMedia from "../components/PostMedia";
import CommentSection from "../components/CommentSection";
import "../styles/CommentSection.css"

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
          <div className="post-meta">
            <PostAuthorInfo
              user={post.user}
              createdAt={post.created_at}
              showAvatar={true}
            />

            <PostActionsMenu
              post={post}
              onEdit={handleEdit}
              onDelete={handleDelete}
              icon="menu"
            />
          </div>

          {/* Titre */}
          <h1 className="post-title" style={{ fontSize: "22px" }}>
            {post.title}
          </h1>

          {/* Description complète */}
          {post.description && (
            <p className="post-description full">{post.description}</p>
          )}

          {/* Médias (photo ou document) */}
          <PostMedia post={post} size="normal" bust={location.state?.updatedAt} />

          {/* Actions avec vrais likes */}
          {/* <PostActions 
            voteCount={likesCount}
            commentCount={commentsCount}
            downloadCount={0}
            isLiked={isLiked}
            onUpvote={handleToggleLike}
            variant="detail"
          /> */}
        </div>
      </div>

      {/* Section commentaires */}
      <div className="card comments-card" style={{ width: "100%" }}>
        <div className="card-header">
          <h3 className="card-title">
            Commentaires ({commentCount})
          </h3>
        </div>
        <div className="card-body">
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