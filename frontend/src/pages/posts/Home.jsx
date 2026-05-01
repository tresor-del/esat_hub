import React, { useState, useEffect } from "react";
import { FiSearch, FiFilter, FiGlobe, FiLock, FiUsers, FiBook } from "react-icons/fi";
import PostCard from "../../components/posts/Postcard";
import { getPost, getUserProfile, getUserRoom } from "../../services/api";
import { getPosts, searchPosts, deletePost } from "../../services/api";
import { updatePostStatus } from "../../services/adminApi";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import "../../styles/Home.css"


const Home = () => {
  const navigate = useNavigate();
  const { user: userAuth } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [filterType, setFilterType] = useState("general"); // "general" | "private" | "my_posts"
  const [fullUser, setFullUser] = useState(null);
  const [room, setRoom] = useState(null);
  const postsPerPage = 10;

  // 1. Charger le profil complet une seule fois
  useEffect(() => {
    const loadProfile = async () => {
      if (userAuth?.id) {
        try {
          const result = await getUserProfile(userAuth.id);
          setFullUser(result);
        } catch (err) {
          console.error("Erreur profil:", err);
        }
      }
    };
    loadProfile();
  }, [userAuth?.id]);

  useEffect(() => {
    const loadRoom = async () => {
        try {
          const result = await getUserRoom();
          setRoom(result);
        } catch (err) {
          console.error("Erreur room:", err);
        }
      };
    loadRoom();
  }, [])

  // 2. Charger les posts quand le filtre change OU quand l'user est enfin chargé
  useEffect(() => {
    if (filterType === "private" && !fullUser) return;
    if (filterType === "my_posts" && !fullUser) return;

    loadPosts(false);
  }, [filterType, fullUser, room]);

  // Ajouter des posts dynamiquement depuis le ws
  useEffect(() => {
    const handleRealtime = async (event) => {
      const post_data = event.detail;

      try {
        const response = await getPost(post_data.post_id);
        if (response) {
          setPosts(prev => [response, ...prev.filter(p => p.id !== response.id)])
        }
      } catch (error) {
        console.log(error)
      }
    };

    window.addEventListener("NEW_POST", handleRealtime);
    return () => window.removeEventListener("NEW_POST", handleRealtime);
  }, [])

  const loadPosts = async (isLoadMore = false) => {
    try {
      setLoading(true);
      setError("");
      const skip = isLoadMore ? posts.length : 0;

      let roomId = null;
      let myPost = false;
      let allPosts = false;

      // Filtrer selon le type
      if (filterType === "private") {
        // Posts de ma salle de classe (room_id non null)
        roomId = fullUser?.user_room_id;
        if (!roomId) {
          setPosts([]);
          setHasMore(false);
          return;
        } 

      } else if (filterType === "my_posts") {
        // Mes propres posts
        myPost = true;
      } else if (filterType === "general") {
        // Posts généraux seulement (room_id = null, exclure les posts de classes)
        allPosts = false;
        // roomId reste null, ce qui dans l'API signifie posts sans room
      }
      // filterType === "general" -> roomId = null (posts généraux sans room_id)

      const result = await getPosts({ skip, limit: postsPerPage, roomId, myPost, allPosts });

      const postsData = result.posts || [];
      setPosts(prev => isLoadMore ? [...prev, ...postsData] : postsData);
      setHasMore(postsData.length === postsPerPage);
    } catch (err) {
      console.error("Erreur:", err);
      setError("Impossible de charger les publications.");
    } finally {
      setLoading(false);
    }
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

  const onToggleStatus = async (post) => {
    const newStatus = post.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await updatePostStatus(post.id, newStatus);
      setPosts(posts.map(p => p.id === post.id ? { ...p, status: newStatus } : p));
    } catch (error) {
      alert("Erreur lors du changement de statut");
    }
  };

  // Obtenir le nom de la salle si disponible
  const roomName = room?.name || "Ma Classe";

  return (
    <div className="container">
      <div className="main-content">
        {/* Filtres améliorés */}
        <div className="post-filter-btns" style={{ marginBottom: "20px" }}>
          <button
            className={`filter-btn ${filterType === "general" ? "active" : ""}`}
            onClick={() => setFilterType("general")}
          >
            <span>Tous les posts</span>
          </button>
          
          <button
            className={`filter-btn ${filterType === "private" ? "active" : ""}`}
            onClick={() => setFilterType("private")}
          >
            <span>{roomName}</span>
          </button>
        </div>

        {loading && posts?.length === 0 ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : (
          <>
            {posts?.length === 0 ? (
              <div className="empty-state">
                <h3>
                  {filterType === "general" && "Aucun post général"}
                  {filterType === "private" && `Aucun post dans ${roomName}`}
                </h3>
                <p>
                  {filterType === "general" && "Les posts des classes n'apparaissent pas ici. Créez un post général pour le voir ici."}
                  {filterType === "private" && "Les posts de votre salle apparaîtront ici. Créez un post pour votre salle le voir ici."}
                </p>
              </div>
            ) : (
              posts?.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleStatus={onToggleStatus}
                  onView={handleView}
                />
              ))
            )}
            {hasMore && (
              <button className="btn btn-secondary" onClick={() => loadPosts(true)} disabled={loading}>
                {loading ? "Chargement..." : "Charger plus"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;