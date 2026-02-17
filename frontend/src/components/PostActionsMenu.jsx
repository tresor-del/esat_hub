/**
 * Composant PostActionsMenu
 * Menu dropdown pour modifier/supprimer un post (visible seulement pour l'auteur)
 */

import { FiEdit, FiTrash2, FiMoreHorizontal } from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import DropdownMenu from "./DropdownMenu";

const PostActionsMenu = ({ post, onEdit, onDelete, icon = "dots" }) => {
  const { user } = useAuth();
  const isAuthor = user?.id && post.user?.id && user.id === post.user.id;

  // Si l'utilisateur n'est pas l'auteur, ne rien afficher
  if (!isAuthor) return null;

  const TriggerIcon = icon === "dots" ? FiMoreHorizontal : FiMoreHorizontal;

  return (
    <DropdownMenu trigger={<TriggerIcon />} align="right">
      {onEdit && (
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

      {onDelete && (
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
  );
};

export default PostActionsMenu;