// components/PostAuthorInfo.jsx (VERSION MISE À JOUR)
import { useNavigate } from "react-router-dom";
import Avatar from "./Avatar";

/**
 * Formater la date de création
 */
const formatDate = (dateString, variant = "relative") => {
  const date = new Date(dateString);
  
  if (variant === "absolute") {
    return date.toLocaleDateString("fr-FR");
  }

  // Format relatif par défaut
  const now = new Date();
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return "Il y a quelques minutes";
  if (diffInHours < 24) return `Il y a ${diffInHours}h`;
  if (diffInHours < 48) return "Hier";
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `Il y a ${diffInDays} jours`;
  
  return date.toLocaleDateString("fr-FR");
};

const PostAuthorInfo = ({ 
  user, 
  createdAt, 
  dateVariant = "relative",
  showAvatar = true 
}) => {
  const navigate = useNavigate();

  const handleUserClick = (e) => {
    e.stopPropagation();
    if (user?.id) {
      console.log(user.id);
      navigate(`/profile/${user.id}`);
    }
  };

  console.log("post.user:", user);

  return (
    <div className="post-user-info">
      
      {showAvatar && (
        <Avatar 
          user={user} 
          size="small" 
          onClick={handleUserClick}
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
        {user?.username || "Utilisateur inconnu"}
      </span>
      
      <span>·</span>
      
      <span style={{ fontSize: "0.9rem"}}>{formatDate(createdAt, dateVariant)}</span>
    </div>
  );
};

export default PostAuthorInfo;