  // components/Avatar.jsx
  import { useState } from "react";
  import { FiUser } from "react-icons/fi";
  import { getAvatarUrl } from "../../services/api";
  import ImageModal from "./ImageModal";
  import React from "react";

  const Avatar = ({ 
    user, 
    size = "medium", // "small" | "medium" | "large"
    onClick,
    className = "",
    openModal = true
  }) => {
    const [imageError, setImageError] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const sizes = {
      small: 32,
      medium: 40,
      large: 80,
      xlarge: 200
    };

    const avatarBust = user?.id 
      ? localStorage.getItem(`avatar_bust_${user.id}`) 
      : null;

    const sizeValue = sizes[size] || sizes.medium;

    const styles = {
      container: {
        width: `${sizeValue}px`,
        height: `${sizeValue}px`,
        borderRadius: "50%",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f0f0f0",
        cursor: onClick ? "pointer" : "default",
        flexShrink: 0,
        border: "2px solid var(--border-color, #edeff1)"
      },
      image: {
        width: "100%",
        height: "100%",
        objectFit: "cover"
      },
      placeholder: {
        fontSize: `${sizeValue * 0.5}px`,
        color: "#999"
      }
    };

    // Obtenir l'URL de l'avatar
    const avatarUrl = user?.avatar_url || (user?.id && !imageError 
      ? getAvatarUrl(user.id, avatarBust) 
      : null);

    // Obtenir les initiales
    const getInitials = () => {
      if (!user?.email) return "?";
      const email = user.email;
      const name = email.split("@")[0];
      return name.substring(0, 2).toUpperCase();
    };


    return (
      <div 
        style={styles.container} 
        className={className}
        onClick={onClick}
        title={user?.email || "Utilisateur"}
      >
        {avatarUrl && !imageError ? (
          <img
            src={avatarUrl}
            alt={user?.email || "Avatar"}
            style={styles.image}
            onError={() => setImageError(true)}
            onClick={() => setIsModalOpen(openModal)}
          />
        ) : (
          <div style={styles.placeholder}>
            {user?.email ? getInitials() : <FiUser />}
          </div>
        )}

        {isModalOpen && (
                  <ImageModal
                    src={avatarUrl}
                    onClose={() => setIsModalOpen(false)}
                  />
                )}
      </div>
    );
  };

  export default Avatar;