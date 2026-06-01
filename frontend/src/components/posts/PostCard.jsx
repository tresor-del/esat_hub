// ─── Postcard.jsx ─────────────────────────────────────────────────────────────

import React from "react";
import { FiMessageCircle } from "react-icons/fi";
import { IoEarth }         from "react-icons/io5";
import { FiLock }          from "react-icons/fi";

import PostAuthorInfo  from "./PostAuthorInfo";
import PostActionsMenu from "./PostActionsMenu";
import PostMedia       from "./PostMedia";
import PostDetailModal from "./postDetailModal";

import { formatRelativeDate } from "../../utils/dateFormatter";
import { usePostCard }        from "./hooks/usePostCard";
import "../../styles/PostCard.css";

const PostCard = ({
    post,
    onEdit,
    onDelete,
    onToggleStatus,
    onView,
    variant = "list",
    detail  = false,
}) => {
    const {
        isExpanded,
        selectedPostId,
        commentsLength,
        toggleReadMore,
        handleCardClick,
        closeModal,
    } = usePostCard(post);

    return (
        <div className={`post-card ${detail ? "post-detail-card" : ""}`}>
            <div className="post-content post-content-d">

                {/* Header */}
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
                            <PostActionsMenu
                                post={post}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onToggleStatus={onToggleStatus}
                            />
                            {post.room_id ? <FiLock /> : <IoEarth />}
                        </div>
                    </div>

                    <h3 className="post-title">{post.title}</h3>

                    {post.description && (
                        <div>
                            <p className={`post-description ${isExpanded ? "expanded" : "clamped"}`}>
                                {post.description}
                            </p>
                            {post.description.length > 50 && (
                                <span className="read-more-btn" onClick={toggleReadMore}>
                                    {isExpanded ? " Voir moins" : "Voir plus"}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Media */}
                <PostMedia post={post} />

                {/* Footer */}
                <div className="post-action">
                    <span
                        className="post-action-btn"
                        onClick={(e) => handleCardClick(e, { variant, onView })}
                    >
                        <FiMessageCircle size={25} /> {commentsLength}
                    </span>
                </div>
            </div>

            {selectedPostId && (
                <PostDetailModal
                    postId={selectedPostId}
                    onClose={closeModal}
                    onPostDeleted={() => {}}
                />
            )}
        </div>
    );
};

export default PostCard;