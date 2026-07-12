import React from "react";
import { FiEdit2, FiTrash2, FiMoreVertical } from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";
import "../../styles/Posts/PostActionsMenu.css";

const CommentActionsMenu = ({ comment, onEdit, onDelete, onClose }) => {
  const { user } = useAuth();
  const isAuthor = user?.id && comment.user?.id && user.id === comment.user.id;
  const isAdmin = user?.role === "ADMIN";
  // Si l'utilisateur n'est pas l'auteur, ne rien afficher
  if (!isAuthor && !isAdmin) return null;

  return (

    <div className="pam-overlay" onClick={onClose}>

      <div className="pam-sheet" onClick={(e) => e.stopPropagation()}>

        {/* Handle bar mobile */}
        <div className="pam-handle" />

        <div className="pam-header">
          <span className="pam-title">Actions</span>
          <button className="pam-close-btn" onClick={onClose} aria-label="Fermer">✕</button>
        </div>

        <div className="pam-actions">
          {isAuthor && onEdit && (
            <button
              className="pam-action pam-action--edit"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <span className="pam-action-icon"><FiEdit2 /></span>

              <span className="pam-action-label">Modifier</span>
            </button>
          )}

          {(isAuthor || isAdmin) && onDelete && (
            <button
              className="pam-action pam-action--delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(comment);
              }}
            >
              <span className="pam-action-icon"><FiTrash2 /></span>
              <span className="pam-action-label"> Supprimer</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default CommentActionsMenu;