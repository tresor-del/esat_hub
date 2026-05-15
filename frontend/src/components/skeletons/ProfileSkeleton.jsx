import React from "react";
import "../../styles/skeltons/ProfileSkeleton.css"; // Créez ce fichier CSS associé

const ProfileSkeleton = ({ isMobile }) => {
  return (
    <div className="profile-container skeleton-loading">
      <div className="profile-card card">
        <div className="profile-header">
          
          {/* Côté gauche : Avatar et Infos de base */}
          <div className="profile-side">
            <div className="profile-avatar-container">
              {isMobile ? (
                <div className="u-i">
                  <div className="skeleton skeleton-avatar-large" />
                  <div className="ui-items">
                    <div className="skeleton skeleton-text-title" style={{ width: "120px" }} />
                    <div className="skeleton skeleton-text-sub" style={{ width: "80px", marginTop: "6px" }} />
                  </div>
                </div>
              ) : (
                <div className="skeleton skeleton-avatar-xlarge" />
              )}
            </div>

            <div className="profile-meta">
              {/* Le bouton de modification si c'est le profil connecté */}
              <div className="skeleton skeleton-btn" style={{ marginBottom: '16px', width: "150px" }} />

              {!isMobile && (
                <div className="profile-name">
                  <div className="skeleton skeleton-text-title" style={{ width: "180px", height: "24px" }} />
                  <div className="skeleton skeleton-text-sub" style={{ width: "100px", marginTop: "8px" }} />
                </div>
              )}

              {/* Liste d'icônes et métadonnées */}
              <div className="info" style={{ marginTop: "20px" }}>
                {[1, 2, 3, 4].map((item) => (
                  <div className="profile-meta-item" key={item} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div className="skeleton skeleton-icon" />
                    <div className="skeleton skeleton-text-body" style={{ width: `${140 + item * 20}px` }} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Côté droit : Grille des posts */}
          <div className="profile-info">
            <div className="profile-posts">
              <div className="posts-grid">
                {/* Affiche 3 items fictifs sur mobile, ou 4 sur desktop */}
                {[1, 2, 3, 4].slice(0, isMobile ? 3 : 4).map((item) => (
                  <div className={`skeleton-post-card ${isMobile ? "compact" : "list"}`} key={item}>
                    <div className="skeleton skeleton-image" />
                    <div className="skeleton-post-content">
                      <div className="skeleton skeleton-text-title" style={{ width: "60%" }} />
                      <div className="skeleton skeleton-text-body" style={{ width: "90%", marginTop: "10px" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfileSkeleton;
