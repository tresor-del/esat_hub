import React from "react";
import { FiEdit, FiTrash2, FiMoreVertical } from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";
import DropdownMenu from "../ui/DropdownMenu";

const CommentActionsMenu = ({ comment, onEdit, onDelete }) => {
  const { user } = useAuth();
  const isAuthor = user?.id && comment.user?.id && user.id === comment.user.id;
  const isAdmin = user?.role === "ADMIN";
  // Si l'utilisateur n'est pas l'auteur, ne rien afficher
  if (!isAuthor && !isAdmin) return null;

  console.log("es auteur du comment: ", isAuthor)
  console.log("est admin: ", isAdmin)
  console.log("n'est pas aut et admin: ", !isAuthor && !isAdmin)

  return (
    <DropdownMenu trigger={<FiMoreVertical />} align="right">
      {isAuthor && onEdit && (
        <button
          className="post-action-btn"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
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

      {(isAuthor || isAdmin) &&onDelete && (
        <button
          className="post-action-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(comment);
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
  );
};

export default CommentActionsMenu;