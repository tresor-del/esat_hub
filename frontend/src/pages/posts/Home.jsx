import React, { useState, useEffect } from "react";
import { FiSearch, FiFilter } from "react-icons/fi";
import PostCard from "../../components/posts/Postcard";
import { getUserProfile } from "../../services/api";
import { getPosts, searchPosts, deletePost } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import "../../styles/Home.css"

const Home = () => {
  const navigate = useNavigate();

  // États pour les postes
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  // États pour la pagination
  const [hasMore, setHasMore] = useState(true);
  const postsPerPage = 10;

  const [filterType, setFilterType] = useState("general");

  const { user: userAuth } = useAuth();
  const [user, setUser] = useState();


  /**
   * Charger les postes au montage et quand le filtre change
   * Réinitialiser les posts et hasMore pour une nouvelle recherche
   */

  useEffect(() => {
    const userProfil = async () => {
      try {
        const result = await getUserProfile(userAuth?.id)
        if (result) setUser(result);
      } catch (error) {
        console.log("Erreur lors de la récupération du user: ", error)
      }

    }
    userProfil();
  }, [])

  const room_id = user?.user_room_id;

  useEffect(() => {

    setHasMore(true);
    setError("");
    if (filterType === "private" && !room_id) {
      setPosts([])
      return;
    }
    loadPosts();
  }, [filterType]);

  /**
   * Charger les postes depuis l'API
   */
  const loadPosts = async (
    isLoadMore = false,
  ) => {
    try {
      setLoading(true);
      setError("");

      const skip = isLoadMore ? posts.length : 0;
      let result;


      // Charger avec filtre de type
      if (filterType === "private" && !user?.user_room_id) {
        // Pas de room_id pour l'utilisateur, afficher rien en privé
        result = { posts: [], total: 0 };
      } else {
        const roomId = filterType === "private" ? user?.user_room_id : null;
        console.log("room_id au moment du call:", room_id);
        result = await getPosts({ skip, limit: postsPerPage, roomId });
        console.log(result)
      }


      // Déterminer les données en fonction du type (recherche ou filtre normal)
      const postsData = result.posts;
      const totalPosts = postsData.length;

      // Mettre à jour les postes (fusion avec les existants si on charge plus)
      if (isLoadMore) {
        setPosts([...posts, ...postsData]);
      } else {
        setPosts(postsData);
      }

      // Vérifier s'il y a plus de postes à charger
      // Si le nombre de posts reçus < limit, on a atteint la fin
      setHasMore(totalPosts === postsPerPage);
    } catch (err) {
      console.error("Erreur lors du chargement des postes:", err);
      setError("Erreur lors du chargement des postes");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Charger plus de postes (pagination)
   */
  const loadMore = () => {
    loadPosts(true);
  };

  /**
   * Gérer la modification d'un poste
   */
  const handleEdit = (post) => {
    navigate(`/edit/${post.id}`);
  };

  /**
   * Gérer la suppression d'un poste
   */
  const handleDelete = async (post) => {
    if (
      !window.confirm(`Êtes-vous sûr de vouloir supprimer "${post.title}" ?`)
    ) {
      return;
    }

    try {
      await deletePost(post.id);
      setPosts(posts.filter((p) => p.id !== post.id));
      alert("Poste supprimé avec succès");
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      alert("Erreur lors de la suppression du poste");
    }
  };

  /**
   * Voir les détails d'un poste
   */
  const handleView = (post) => {
    navigate(`/post/${post.id}`);
  };



  return (
    <div className="container">
      <div className="main-content">
        <div style={{ marginBottom: "12px" }} />

        {/* Boutons de filtre - toujours visibles */}
        <div className="post-filter-btns">
          <button
            className={filterType === "general" ? "active" : ""}
            onClick={() => setFilterType("general")}
          >
            Général
          </button>
          <button
            className={filterType === "private" ? "active" : ""}
            onClick={() => setFilterType("private")}
          >
            Privé
          </button>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: "16px" }}>
            {error}
          </div>
        )}

        {/* État de chargement */}
        {loading && posts.length === 0 ? (
          <div className="loading">
            <div className="spinner"></div>
            <p style={{ marginTop: "16px", color: "var(--text-secondary)" }}>
              Chargement des postes...
            </p>
          </div>
        ) : posts.length === 0 ? (
          // État vide
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3 className="empty-state-title">
              {filterType === "private" ? "Aucun poste privé" : "Aucun poste trouvé"}
            </h3>
            <p>
              {filterType === "private"
                ? "Vous n'avez accès à aucun poste privé pour le moment"
                : "Soyez le premier à créer un poste !"}
            </p>
            {filterType === "general" && (
              <button
                className="btn btn-primary"
                onClick={() => navigate("/create")}
                style={{ marginTop: "16px" }}
              >
                + Créer un poste
              </button>
            )}
          </div>
        ) : (
          // Liste des postes
          <>
            <div>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                />
              ))}
            </div>


            {/* Bouton charger plus */}
            {hasMore && (
              <div style={{ textAlign: "center", marginTop: "24px" }}>
                <button
                  className="btn btn-secondary"
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? "Chargement..." : "Charger plus"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;