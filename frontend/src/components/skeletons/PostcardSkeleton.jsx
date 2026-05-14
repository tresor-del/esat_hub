import React from "react";
import "../../styles/skeltons/PostCardSkeleton.css";

const PostCardSkeleton = () => {
  return (
    <div className="post-card skeleton-card">
      <div className="post-content">
        
        {/* En-tête : Avatar + Métadonnées */}
        <div className="post-meta">
          <div className="post-user-info">
            <div className="post-user skeleton-avatar skeleton-blink" />
            <div>
              <div className="skeleton-title skeleton-blink" />
              <div className="skeleton-meta skeleton-blink" />
            </div>
          </div>
        </div>

        {/* Corps : Description textuelle */}
        <div className="post-description">
          <div className="skeleton-desc-line skeleton-blink" />
          <div className="skeleton-desc-line last skeleton-blink" />
        </div>

        {/* Nouveau : Image de la publication */}
        <div className="skeleton-post-image skeleton-blink" />

        {/* Pied de page : Barre d'actions */}
        <div className="post-action">
          <div className="skeleton-action-btn skeleton-blink" />
          <div className="skeleton-action-btn skeleton-blink" />
          <div className="skeleton-action-btn skeleton-blink" />
        </div>

      </div>
    </div>
  );
};

export default PostCardSkeleton;
