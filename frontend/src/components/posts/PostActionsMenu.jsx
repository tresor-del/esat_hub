import React from "react";
import {
  FiEdit2,
  FiTrash2,
  FiToggleLeft,
  FiToggleRight,
} from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";
import "../../styles/Posts/PostActionsMenu.css";

const PostActionsMenu = ({ post, onEdit, onDelete, onToggleStatus, onClose }) => {
  const { user } = useAuth();
  const isAuthor = user?.id && post.user?.id && user.id === post.user.id;
  const isAdmin = user?.role === "ADMIN";

  if (!isAuthor && !isAdmin) return null;

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit?.(post);
    onClose?.();
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete?.(post);
    onClose?.();
  };

  const handleToggleStatus = (e) => {
    e.stopPropagation();
    onToggleStatus?.(post);
    onClose?.();
  };

  const isActive = post.status === "ACTIVE";

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
          {(isAdmin || isAuthor) && onEdit && (
            <button className="pam-action pam-action--edit" onClick={handleEdit}>
              <span className="pam-action-icon"><FiEdit2 /></span>
              <span className="pam-action-label">Modifier le post</span>
            </button>
          )}

          {isAdmin && (
            <button
              className={`pam-action ${isActive ? "pam-action--deactivate" : "pam-action--activate"}`}
              onClick={handleToggleStatus}
            >
              <span className="pam-action-icon">
                {isActive ? <FiToggleRight /> : <FiToggleLeft />}
              </span>
              <span className="pam-action-label">
                {isActive ? "Désactiver le post" : "Activer le post"}
              </span>
            </button>
          )}

          {(isAdmin || isAuthor) && onDelete && (
            <>
              <div className="pam-divider" />
              <button className="pam-action pam-action--delete" onClick={handleDelete}>
                <span className="pam-action-icon"><FiTrash2 /></span>
                <span className="pam-action-label">Supprimer le post</span>
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default PostActionsMenu;