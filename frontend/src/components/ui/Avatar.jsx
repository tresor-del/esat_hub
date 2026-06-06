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
  openModal = true,
  uploading = false
}) => {
  const [imageError, setImageError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sizes = {
    small: 32,
    medium: 40,
    smlarge: 60,
    large: 80,
    xlarge: 200
  };

  const avatarBust = user?.id 
    ? localStorage.getItem(`avatar_bust_${user.id}`) 
    : null;

  const sizeValue = sizes[size] || sizes.medium;

  const colors = [
    { bg: "#E0E7FF", text: "#4F46E5" }, // Bleu Indigo
    { bg: "#F3E8FF", text: "#9333EA" }, // Violet
    { bg: "#D1FAE5", text: "#059669" }, // Vert Émeraude
    { bg: "#FFE4E6", text: "#E11D48" }, // Rose / Corail doux
    { bg: "#FEF3C7", text: "#D97706" }  // Ambre / Orange doux
  ];

  const getDynamicColors = () => {
    if (!user?.profil_name) return colors[0]; // Couleur par défaut (Bleu)
    
    // On calcule une somme mathématique basée sur les lettres de l'profil_name
    let sum = 0;
    for (let i = 0; i < user.profil_name.length; i++) {
      sum += user.profil_name.charCodeAt(i);
    }
    
    // Le modulo (%) permet de tomber pile sur un des index de notre tableau (0 à 4)
    const index = sum % colors.length;
    return colors[index];
  };

  const dynamicColor = getDynamicColors();

  const styles = {
    container: {
      width: `${sizeValue}px`,
      height: `${sizeValue}px`,
      borderRadius: "50%",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: dynamicColor.bg, // Applique le fond dynamique
      cursor: onClick ? "pointer" : "default",
      flexShrink: 0,
    },
    image: {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    },
    placeholder: {
      fontSize: `${sizeValue * 0.45}px`,
      color: dynamicColor.text, // Applique la couleur de texte assortie
      fontWeight: "600",        // Rendre les initiales plus pro et visibles
      fontFamily: "sans-serif"
    }
  };

  // Obtenir l'URL de l'avatar
  const avatarUrl = user?.avatar_path || (user?.id && !imageError 
    ? getAvatarUrl(user, avatarBust) 
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
      {uploading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <div className="spinner"></div>
        </div>
      ) : 
      avatarUrl && !imageError ? (
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
