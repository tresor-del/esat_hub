import React from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "../ui/Avatar";


const PostAuthorInfo = ({
  user,
  dateVariant = "relative",
  showAvatar = true,
  openModal = true,
  showEmail = false,
  showDomain = false,
  showYear = false,
  showStatus = false,
  showMajor = false,
  variant = "default" // "default" | "compact" | "full"
}) => {
  const navigate = useNavigate();

  const handleUserClick = (e) => {
    e.stopPropagation();
    if (user?.id) {
      console.log(user.id);
      navigate(`/profile/${user.id}`);
    }
  };

  // Format name: profil_name > username > first_name + last_name
  const displayName = user?.profil_name

  // Compact variant - just avatar and name
  if (variant === "compact") {
    return (
      <div className="user-cell">
        <Avatar user={user} size="medium" onClick={handleUserClick} openModal={openModal} />
        <div className="user-info">
          <span className="user-name">{displayName}</span>
          <span className="user-username">{user?.username}</span>
        </div>
      </div>
    );
  }

  // Full variant - with email, domain, year, status
  if (variant === "full") {
    return (
      <div className="user-cell-full">
        <Avatar user={user} size="smlarge" onClick={handleUserClick} openModal={openModal} />
        <div className="user-info-full">
          <div className="user-info">
            <span className="user-name" onClick={handleUserClick} style={{ cursor: "pointer" }}>
              {displayName}
            </span>
            {/* <span className="user-username">{user?.username}</span> */}

          </div>

          <div>

          </div>
          {showEmail && <span className="user-email">{user?.email}</span>}
          <div className="user-badges">
            {showDomain && user?.domain && (
              <span className="domain-badge">{user.domain}</span>
            )}
            {showYear && user?.year && (
              <span className="year-badge">{user.year}</span>
            )}
            {showStatus && user?.status && (
              <span className={`status-badge status-${user.status.toLowerCase()}`}>
                {user.status}
              </span>
            )}

            {showMajor && user?.major && (
              <span className="year-badge">{user.major}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default variant - original behavior
  return (
    <div className="post-user-info">
      {showAvatar && (
        <Avatar
          user={user}
          size="medium"
          onClick={handleUserClick}
          openModal={openModal}
        />
      )}
      <span
        style={{
          fontWeight: dateVariant === "absolute" ? 600 : "bold",
          fontSize: dateVariant === "absolute" ? "inherit" : "1rem",
          cursor: "pointer"
        }}
        onClick={handleUserClick}
      >
        {user?.profil_name || "Utilisateur inconnu"}
      </span>
    </div>
  );
};

export default PostAuthorInfo;