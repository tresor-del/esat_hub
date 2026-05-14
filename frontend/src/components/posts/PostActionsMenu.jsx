import React from "react";
import { FiEdit, FiTrash2, FiMoreHorizontal, FiToggleLeft, FiToggleRight, FiEye, FiEyeOff } from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";
import DropdownMenu from "../ui/DropdownMenu";

const PostActionsMenu = ({ post, onEdit, onDelete, onToggleStatus }) => {
  const { user } = useAuth();
  const isAuthor = user?.id && post.user?.id && user.id === post.user.id;
  const isAdmin = user?.role === "ADMIN";

  // Debug logs
  // console.log("User:", user);
  // console.log("Post:", post);
  // console.log("isAdmin:", isAdmin);

  // Si l'utilisateur n'est pas l'auteur et pas admin, ne rien afficher
  if (!isAuthor && !isAdmin) return null;

  const TriggerIcon = FiMoreHorizontal;

  const handleToggleStatus = (e) => {
    e.stopPropagation();
    if (onToggleStatus) {
      onToggleStatus(post);
    }
  };

  return (
    <DropdownMenu trigger={<TriggerIcon />} align="right">
      {(isAdmin || isAuthor) && onEdit && (
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

      { (isAdmin || isAuthor) && onDelete && (
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

      {isAdmin && (
        <>
          {(isAuthor || true) && (
            <button
              className="post-action-btn"
              onClick={handleToggleStatus}
              style={{
                color: post.status === "ACTIVE" ? "#f59e0b" : "#10b981",
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: isAuthor ? 12 : 0,
              }}
            >
              {post.status === "ACTIVE" ? (
                <>
                  <FiToggleRight />
                  <span>Desactiver</span>
                </>
              ) : (
                <>
                  <FiToggleLeft />
                  <span>Activer</span>
                </>
              )}
            </button>
          )}
        </>
      )}
    </DropdownMenu>
  );
};

export default PostActionsMenu;