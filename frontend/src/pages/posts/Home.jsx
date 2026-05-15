import React, { useEffect } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiImage, FiVideo } from "react-icons/fi";
import PostCard from "../../components/posts/Postcard";
import Avatar from "../../components/ui/Avatar";
import { getUserProfile, getPosts, deletePost } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import PostCardSkeleton from "../../components/skeletons/PostcardSkeleton";
import "../../styles/Home.css";
import { sendSystemNotification } from "../../services/notificationService";
import { se } from "date-fns/locale";

const Home = () => {
  const navigate = useNavigate();
  const { user: userAuth } = useAuth();
  const queryClient = useQueryClient();
  const postsPerPage = 10;

  // Cache du profil (contient l'utilisateur connecté nécessaire pour l'avatar)
  const { data: fullUser } = useQuery({
    queryKey: ["userProfile", userAuth?.id],
    queryFn: () => getUserProfile(userAuth.id),
    enabled: !!userAuth?.id,
    staleTime: Infinity,
  });

  // LE CACHE DES POSTS (Affiche tout)
  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ["posts"],
    queryFn: async ({ pageParam = 0 }) => {
      const result = await getPosts({
        skip: pageParam,
        limit: postsPerPage,
        allPosts: true
      });
      return result;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.posts || lastPage.posts.length < postsPerPage) {
        return undefined;
      }
      return allPages.length * postsPerPage;
    },
    enabled: !!fullUser,
  });

  // Aplatir les pages pour l'affichage
  const posts = postsData?.pages.flatMap((page) => page.posts) || [];

  const handleCreate = () => {
    navigate("/create");
  };

  const handleUserClick = (e) => {
    e.stopPropagation(); // Évite la redirection vers /create lors du clic sur l'avatar
  };

  const handleEdit = (post) => {
    navigate(`/edit/${post.id}`);
  };

  const handleDelete = async (post) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${post.title}" ?`)) {
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

  const handleView = (post) => {
    navigate(`/post/${post.id}`);
  };

  const handleNotificationSetup = async () => {
    // 1. Vérification du support navigateur
    if (!("Notification" in window)) {
      console.error("Ce navigateur ne prend pas en charge les notifications.");
      return;
    }

    // 2. Demande de permission et attente du clic utilisateur
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      console.log("Permission accordée !");

      // 3. On attend un tout petit peu que le Service Worker soit prêt avant d'envoyer
      if (navigator.serviceWorker) {
        await navigator.serviceWorker.ready;

        sendSystemNotification({
          type: "SHOW_WS_NOTIFICATION",
          title: "Bienvenue",
          body: "Bienvenue sur l'application !",
        });
      }
    } else {
      console.warn("Permission refusée par l'utilisateur.");
    }
  };

  useEffect(() => {
    handleNotificationSetup();
  }, []);

  const filteredPosts = posts.filter(
    (post) => post.room_id === null || post.room_id === userAuth?.user_room_id
  );

  return (
    <div className="container">
      <div className="main-content home">

        {/* Barre de création de post moderne intégrée */}
        <div className="create-post-container">
          <div className="create-post-avatar-wrapper">
            <Avatar
              user={fullUser}
              size="medium"
              onClick={() => navigate(`profile/${userAuth.id}`)}
            />
          </div>
          <div className="create-post-input-trigger" onClick={handleCreate}>
            <span>Quoi de neuf {userAuth?.profil_name} ?</span>
          </div>
          <div className="create-post-actions" onClick={handleCreate}>
            <button type="button" className="action-icon-btn" title="Ajouter une image">
              <FiImage size={20} />
            </button>
            <button type="button" className="action-icon-btn" title="Ajouter une vidéo">
              <FiVideo size={20} />
            </button>
          </div>
        </div>

        {/* Liste des posts */}
        {isLoading ? (
          <div className="posts-skeleton-list">
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        ) : (
          <>
            {filteredPosts.length === 0 ? (
              <div className="empty-state">
                <h3>Aucun Post pour le moment</h3>
              </div>
            ) : (
              filteredPosts
                .map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
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
