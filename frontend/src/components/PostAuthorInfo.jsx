import React from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "./Avatar";


const PostAuthorInfo = ({ 
  user,
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


  return (
    <div className="post-user-info">
      
      {showAvatar && (
        <Avatar 
          user={user} 
          size="medium" 
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
    </div>
  );
};

export default PostAuthorInfo;