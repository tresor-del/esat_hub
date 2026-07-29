// ─── PostDetail.jsx ───────────────────────────────────────────────────────────

import React, { useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { useAuth }     from "../../contexts/AuthContext";

import PostCard         from "../../components/posts/Postcard";
import PostCardSkeleton from "../../components/skeletons/PostcardSkeleton";
import CommentSection   from "../../components/comments/CommentSection";
import { usePostDetail } from "../../components/posts/hooks/usePostDetail";

import "../../styles/CommentSection.css";
import "../../styles/Posts/PostDetail.css";
import "../../styles/Posts/PostMedia.css";

const PostDetail = () => {
    const { id }     = useParams();
    const navigate   = useNavigate();
    const location   = useLocation();
    const { user }   = useAuth();

    const {
        post,
        loading,
        error,
        loadPost,
        handleEdit,
        handleDelete,
        handleCommentAdded,
    } = usePostDetail();

    // ── Load / reload ─────────────────────────────────────────────────────────
    useEffect(() => {
        loadPost(id);
    }, [id, location.state?.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Scroll to comment from deep-link ──────────────────────────────────────
    useEffect(() => {
        const params    = new URLSearchParams(location.search);
        const commentId = params.get("commentId");
        if (!commentId) return;

        const timer = setTimeout(() => {
            const el = document.getElementById(`comment-${commentId}`);
            if (!el) return;
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("highlight-comment");
            setTimeout(() => el.classList.remove("highlight-comment"), 2000);
        }, 300);

        return () => clearTimeout(timer);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    if (error) return <p className="alert alert-error">{error}</p>;

    return (
        <div className="post-detail-container container">
            <div className="post-card post-detail-card" style={{ cursor: "default" }}>
                <div className="post-content">
                    <div className="return-to-post-btn" onClick={() => navigate("/")}>
                        <FiArrowLeft />
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