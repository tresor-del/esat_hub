import React from "react";
import "../../styles/skeltons/CommentSectionSkeleton.css";

const CommentSectionSkeleton = () => {
  return (
    <div className="comment-section-container skeleton-section">
      
      {/* Formulaire de saisie factice */}
      <div className="submitForm skeleton-form-box">
        <div className="comment-textarea skeleton-field skeleton-blink" />
        <div className="submitButton skeleton-btn skeleton-blink" />
      </div>

      {/* Liste des boîtes de commentaires simulées */}
      <div className="commentBox">
        
        {/* SQUELETTE 1 : Commentaire racine + sa réponse imbriquée */}
        <div className="skeleton-comment-card-wrapper">
          <div className="skeleton-comment-card">
            <div className="skeleton-comment-avatar skeleton-blink" />
            <div className="skeleton-comment-content">
              <div className="skeleton-comment-header">
                <div className="skeleton-comment-name skeleton-blink" />
                <div className="skeleton-comment-date skeleton-blink" />
              </div>
              <div className="skeleton-comment-text skeleton-blink" />
              <div className="skeleton-comment-text short skeleton-blink" />
            </div>
          </div>
          
          {/* Réponse imbriquée (décalée vers la droite) */}
          <div className="skeleton-comment-replies">
            <div className="skeleton-comment-card">
              <div className="skeleton-comment-avatar skeleton-blink" />
              <div className="skeleton-comment-content">
                <div className="skeleton-comment-header">
                  <div className="skeleton-comment-name skeleton-blink" style={{ width: '80px' }} />
                  <div className="skeleton-comment-date skeleton-blink" />
                </div>
                <div className="skeleton-comment-text skeleton-blink" />
              </div>
            </div>
          </div>
        </div>

        {/* SQUELETTE 2 : Commentaire racine standard */}
        <div className="skeleton-comment-card-wrapper">
          <div className="skeleton-comment-card">
            <div className="skeleton-comment-avatar skeleton-blink" />
            <div className="skeleton-comment-content">
              <div className="skeleton-comment-header">
                <div className="skeleton-comment-name skeleton-blink" style={{ width: '130px' }} />
                <div className="skeleton-comment-date skeleton-blink" />
              </div>
              <div className="skeleton-comment-text skeleton-blink" />
              <div className="skeleton-comment-text skeleton-blink" />
            </div>
          </div>
        </div>

        {/* SQUELETTE 3 : Commentaire racine court */}
        <div className="skeleton-comment-card-wrapper">
          <div className="skeleton-comment-card">
            <div className="skeleton-comment-avatar skeleton-blink" />
            <div className="skeleton-comment-content">
              <div className="skeleton-comment-header">
                <div className="skeleton-comment-name skeleton-blink" style={{ width: '90px' }} />
                <div className="skeleton-comment-date skeleton-blink" />
              </div>
              <div className="skeleton-comment-text skeleton-blink" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CommentSectionSkeleton;
