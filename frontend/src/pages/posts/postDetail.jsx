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
import PostCardSkeleton from "../../components/skeletons/PostcardSkeleton";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "../../contexts/toastContext";
import "../../styles/Comments/CommentSection.css"
import "../../styles/Posts/PostDetail.css"
import "../../styles/Posts/PostMedia.css"

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  // const [post, setPost] = useState(null);
  // const [loading, setLoading] = useState(true);
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
    setTimeout(() => {
      scrollToComment();
    }, 100);
  }, [])

 const { data: post, isLoading: loading } = useQuery({
    queryKey: ["post", id],
    queryFn: () => getPost(id),
});

  useEffect(() => {
    if (post?.comments_count !== undefined) {
      setCommentCount(post.comments_count);
    }
  }, [post?.comments_count]);

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
      toast({ message: "Une erreur s'est produite.", type: "error" });
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


  if (error) return <p className="alert alert-error">{error}</p>;

  return (
    <div className="post-detail-container container">
      {/* Carte du post */}
      <div className="post-card post-detail-card" style={{ cursor: "default" }}>
        <div className="post-content">
          {/* Bouton retour */}
          <div className="return-to-post-btn" onClick={goHome}>
            <FiArrowLeft /> Post
          </div>

          {loading ? (
            <PostCardSkeleton />
          ) : 
          (
            <PostCard
              key={post.id}
              post={post}
              onEdit={handleEdit}
              onDelete={handleDelete}
              detail={true}
              commentCount={commentCount}
            />
          )}
            
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