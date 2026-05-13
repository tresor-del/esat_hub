import React, { useState, useEffect } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
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
  const [filterType, setFilterType] = useState("general"); // "general" | "private" | "my_posts"
  const [hasMore, setHasMore] = useState(true);
  const queryClient = useQueryClient();
  const postsPerPage = 10;

  // Cache du profil
  const { data: fullUser } = useQuery({
    queryKey: ["userProfile", userAuth?.id],
    queryFn: () => getUserProfile(userAuth.id),
    enabled: !!userAuth?.id,
    staleTime: Infinity, // Le profil ne change pas souvent
  });

  // Cache de la room
  const { data: room } = useQuery({
    queryKey: ["userRoom"],
    queryFn: getUserRoom,
    staleTime: 1000 * 60 * 30, // 30 minutes de cache
  });

  // LE CACHE DES POSTS 
  const {
    data: postsData, // On récupère "data" et on le renomme "postsData"
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({ // <-- BIEN UTILISER useInfiniteQuery ici
    queryKey: ["posts", filterType, fullUser?.user_room_id],
    queryFn: async ({ pageParam = 0 }) => { // <-- Récupérer le pageParam ici
      let roomId = filterType === "private" ? fullUser?.user_room_id : null;
      let myPost = filterType === "my_posts";

      const result = await getPosts({
        skip: pageParam, // <-- Utiliser pageParam pour la pagination
        limit: postsPerPage,
        roomId,
        myPost,
        allPosts: false
      });
      return result; 
    },
    getNextPageParam: (lastPage, allPages) => {
      // Si on a reçu moins de posts que la limite, c'est qu'il n'y a plus de pages
      if (!lastPage.posts || lastPage.posts.length < postsPerPage) {
        return undefined;
      }
      // Sinon, le prochain skip est le nombre total de posts déjà chargés
      return allPages.length * postsPerPage;
    },
    enabled: (filterType !== "private" || !!fullUser),
  });

  // Aplatir les pages pour l'affichage (postsData contient .pages)
  const posts = postsData?.pages.flatMap((page) => page.posts) || [];

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
      queryClient.invalidateQueries({ queryKey: ["posts"] });
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
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    } catch (error) {
      alert("Erreur lors du changement de statut");
    }
  };

  // Obtenir le nom de la salle si disponible
  const roomName = room?.name || "Ma Classe";

  return (
    <div className="container">
      <div className="main-content home">
        {/* Filtres améliorés */}
        {/* <div className="post-filter-btns">
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
        </div> */}

        {isLoading && posts?.length === 0 ? (
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
            {hasNextPage && (
              <button 
                className="btn btn-secondary" 
                onClick={() => fetchNextPage()} 
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Chargement..." : "Charger plus"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;