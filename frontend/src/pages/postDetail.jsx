import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { FiArrowUp, FiArrowDown, FiUser, FiDownload, FiEdit, FiTrash2, FiMenu } from "react-icons/fi";
import { getPost, getPostFileUrl, downloadPostFile, deletePost } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import DropdownMenu from "../components/DropdownMenu";

const PostDetail = () => {
  const { id } = useParams();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [voteCount, setVoteCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadPost();
  }, [id]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const result = await getPost(id);
      setPost(result);
      // hydrate local comments if provided by backend
      if (result.comments && Array.isArray(result.comments)) {
        setComments(result.comments);
      }
      if (typeof result.vote_count !== "undefined") {
        setVoteCount(result.vote_count);
      }
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement du post");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Chargement…</div>;
  if (error) return <p className="alert alert-error">{error}</p>;
  if (!post) return null;

  return (
    <div className="post-detail-container container">
      <div className="post-card post-detail-card" style={{ cursor: "default" }}>
        

        {/* Contenu */}
        <div className="post-content">

          {/* Meta */}
          <div className="post-meta">
            <div className="post-user-info">
              <FiUser className="post-user" />
              <span style={{ fontWeight: 600 }}>{post.user?.email}</span>
              <span>·</span>
              <span>{new Date(post.created_at).toLocaleDateString("fr-FR")}</span>
            </div>

            {/* Actions pour l'auteur */}
            <div>
              {user?.id && post.user?.id && user.id === post.user.id && (
                <DropdownMenu trigger={<FiMenu />} align="right">
                  <button
                    className="post-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/edit/${post.id}`);
                    }}
                  >
                    <FiEdit />
                    <span>Modifier</span>
                  </button>

                  <button
                    className="post-action-btn"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!confirm("Voulez-vous vraiment supprimer ce post ?")) return;
                      try {
                        await deletePost(post.id);
                        navigate("/");
                      } catch (err) {
                        console.error(err);
                        alert("Impossible de supprimer le post.");
                      }
                    }}
                    style={{ color: "#d32f2f" }}
                  >
                    <FiTrash2 />
                    <span>Supprimer</span>
                  </button>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Titre */}
          <h1 className="post-title" style={{ fontSize: "22px" }}>
            {post.title}
          </h1>

          {/* Description complète */}
          {post.description && (
            <p className="post-description full">
              {post.description}
            </p>
          )}

          {/* Image */}
          {post.post_type === "photo" && (
            <div className="img-container">
              <img
                src={getPostFileUrl(post.id)}
                alt={post.title}
                style={{ maxWidth: "100%", borderRadius: "12px" }}
              />
            </div>
          )}

          {/* Document */}
          {post.post_type === "document" && (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-body">
                📄{" "}
                <a href={getPostFileUrl(post.id)} target="_blank" rel="noreferrer">
                  Ouvrir le document
                </a>
              </div>
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

      {/* Zone commentaires */}
      <div className="card comments-card">
        <div className="card-header">
          <h3 className="card-title">Commentaires</h3>
        </div>
        <div className="card-body">
          {/* Liste des commentaires */}
          {comments.length === 0 ? (
            <div className="empty-state">Aucun commentaire pour l’instant.</div>
          ) : (
            <div className="comments-list">
              {comments.map((c, idx) => (
                <div key={idx} className="comment">
                  <div className="comment-author">{c.author || "Anonyme"}</div>
                  <div className="comment-body">{c.body}</div>
                </div>
              ))}
            </div>
          )}

          {/* Formulaire simple d'ajout de commentaire (UI-only si backend manquant) */}
          <div className="comment-form">
            <textarea
              className="form-textarea"
              placeholder="Ajouter un commentaire..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              style={{width: "100%"}}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (!newComment.trim()) return;
                  // Optimistic UI : on ajoute localement
                  setComments((s) => [
                    ...s,
                    { author: user?.username || user?.email || "Vous", body: newComment.trim() },
                  ]);
                  setNewComment("");
                }}
              >
                Publier
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setNewComment("")}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
