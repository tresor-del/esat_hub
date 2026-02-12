/**
 * Composant PostCard - Carte de poste style Reddit
 * Affiche un poste avec votes, titre, description et actions
 */

import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  FiUser,
  FiEdit,
  FiTrash2,
  FiMoreHorizontal,
} from "react-icons/fi";
import { getPostFileUrl } from "../services/api";
import DropdownMenu from "./DropdownMenu";

const PostCard = ({ post, onEdit, onDelete, onView, variant = "list" / "list" | "detail" }) => {
  // État local pour le vote (simulation - pas implémenté dans le backend)
  const [voteCount, setVoteCount] = useState(0);
  const [userVote, setUserVote] = useState(null); // null, 'up', ou 'down'

  const { user } = useAuth();
  const isAuthor = user?.id && post.user?.id && user.id === post.user.id;
  console.log("Is Author: ", isAuthor);
  // menu state is handled by DropdownMenu component

  /**
   * Gérer le vote positif
   */
  const handleUpvote = () => {
    if (userVote === "up") {
      // Annuler le vote
      setUserVote(null);
      setVoteCount(voteCount - 1);
    } else if (userVote === "down") {
      // Changer de vote négatif à positif
      setUserVote("up");
      setVoteCount(voteCount + 2);
    } else {
      // Nouveau vote positif
      setUserVote("up");
      setVoteCount(voteCount + 1);
    }
  };

  /**
   * Gérer le vote négatif
   */
  const handleDownvote = () => {
    if (userVote === "down") {
      // Annuler le vote
      setUserVote(null);
      setVoteCount(voteCount + 1);
    } else if (userVote === "up") {
      // Changer de vote positif à négatif
      setUserVote("down");
      setVoteCount(voteCount - 2);
    } else {
      // Nouveau vote négatif
      setUserVote("down");
      setVoteCount(voteCount - 1);
    }
  };

  /**
   * Formater la date de création
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Il y a quelques secondes";
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    if (diffInHours < 48) return "Hier";

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Il y a ${diffInDays} jours`;

    return date.toLocaleDateString("fr-FR");
  };

  /**
   * Gérer le clic sur la carte pour voir les détails
   */
  const handleCardClick = (e) => {
    // Ne pas ouvrir si on clique sur un bouton
    if(variant === "detail") return; 
    if (e.target.closest("button")) return;

    if (onView) {
      onView(post);
    }
  };

  return (
    <div className="post-card" onClick={handleCardClick}>

      {/* Contenu du poste */}
      <div className="post-content">

        {/* Métadonnées */}
        <div className="post-meta">

          <div>
            {/* Identité de l'auteur */}
            <div className="post-user-info">
              <FiUser  className="post-user"/>
                <span style={{ fontWeight: "bold", fontSize: "1rem"}}>
                {post.user.email}
              </span>
              <span>.</span>
              <span>{formatDate(post.created_at)}</span>
            </div>
            
          </div>

          <DropdownMenu trigger={<FiMoreHorizontal />} align="right">
            {isAuthor && onEdit && (
              <button
                className="post-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(post);
                }}
                style={{
                  color: "var(--reddit-blue)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <FiEdit />
                <span>Modifier</span>
              </button>
            )}

            {isAuthor && onDelete && (
              <button
                className="post-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(post);
                }}
                style={{
                  color: "#d32f2f",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 6,
                }}
              >
                <FiTrash2 />
                <span>Supprimer</span>
              </button>
            )}
          </DropdownMenu>

        </div>

        {/* Titre du poste */}
        <h3 className="post-title">{post.title}</h3>
        
       {/* Description tronquée */}
        {post.description && (
          <p className="post-description">
            {post.description}
          </p>
        )}  
        
        {/* Aperçu du document si c'est un document */}
        {post.post_type === "document" && (
          <div 
            className="document-preview"
            style={{ 
              marginTop: "12px", 
              marginBottom: "12px", 
              padding: "16px",
              backgroundColor: "var(--bg-secondary, #f6f7f8)",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              border: "1px solid var(--border-color, #edeff1)"
            }}
          >
            <div style={{ fontSize: "24px" }}>📄</div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ fontWeight: "600", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                Document joint
              </div>
              <a 
                href={getPostFileUrl(post.id)} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{ color: "var(--reddit-blue)", fontSize: "14px", textDecoration: "none" }}
              >
                Ouvrir le fichier
              </a>
            </div>
          </div>
        )}

        {/* Aperçu de l'image si c'est une photo */}
        {post.post_type === "photo" && (
          <div className="img-container" style={{ marginTop: "12px", marginBottom: "12px", width: "100%"}}>
            <img
              src={getPostFileUrl(post.id)}
              alt={post.title}
              style={{
                maxWidth: "100%",
                maxHeight: "auto",
                borderRadius: "4px",
                objectFit: "cover",
              }}
              onError={(e) => {
                // Si l'image ne charge pas, masquer l'élément
                e.target.style.display = "none";
              }}
            />
          </div>
        )}

        {/* Actions */}
        <div className="post-actions">
          <button
            className="post-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleUpvote();
            }}
          >
            <span>{voteCount}</span>
            <span>Likes</span>
          </button>

          {/* Bouton Commentaires (simulé) */}
          <button
            className="post-action-btn"
            onClick={(e) => e.stopPropagation()}
          >
            <span>0</span>
            <span>Commentaires</span>
          </button>

          {/* Les actions Modifier / Supprimer sont accessibles depuis le menu (FiMoreHorizontal) */}
        </div>

      </div>
    </div>
  );
};

export default PostCard;
