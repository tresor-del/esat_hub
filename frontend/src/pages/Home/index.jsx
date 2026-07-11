import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { FiInbox } from "react-icons/fi";
import { useInView } from 'react-intersection-observer';
import { useParams, useLocation } from "react-router-dom";

import { useHomeData } from "./hooks/useHomeData";
import HomeSidebar from "./components/HomeSidebar";
import CreatePostBar from "./components/CreatePostBar";

import PostCard from "../../components/posts/Postcard";
import PostDetailModal from "../../components/posts/postDetailModal";
import PostCardSkeleton from "../../components/skeletons/PostcardSkeleton";
import { deletePost } from "../../services/api";
import HomeSidebarAppInfo from "./components/HomeSidebarAppInfo";
import PostEdit from "../PostEdit";
import CreatePost from "../CreatePost";
import { useCreatePostModal } from "../../contexts/createPostContext";
import { useToast } from "../../contexts/toastContext";
import "../../styles/Home.css";

const Home = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [editPostId, setEditPostId] = React.useState(null);
    const { createPostModale, openCreatePost, closeCreatePost } = useCreatePostModal();
    const { id: modalPostId } = useParams();
    const { toast } = useToast();
    const isMobile = window.innerWidth < 768;

    // si on visite la page de détail d'un post sur mobile,
    // on redirige vers le vrai lien
    useEffect(() => {
        if (modalPostId && isMobile) {
            // Seulement sur mobile, remplace par la vraie page
            navigate(`/post-page/${modalPostId}`, { replace: true });
        }
    }, [modalPostId]);

    // hook personnalisé pour gérer les données de la page d'acceuil.
    const {
        userAuth,
        fullUser,
        filteredPosts,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isFetching,
    } = useHomeData();


    const handleEdit = (post) => {
        setEditPostId(post.id);
    };

    const closeEditModal = () => {
        setEditPostId(null);
    };

    const handleView = (post) => navigate(`/post/${post.id}`);

    const handleDelete = async (post) => {
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${post.title}" ?`)) return;
        try {
            await deletePost(post.id);
            queryClient.invalidateQueries({ queryKey: ["posts"] });
            toast({ message: "Post Supprimé avec succès" })
        } catch (err) {
            console.error("Erreur lors de la suppression:", err);
            toast({ message: "Erreur lors de la suppression du poste", type: "error" });
        }
    };

    // mécanisme d'infinite scroll
    const { ref, inView } = useInView({
        threshold: 0.1,
    });

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

    return (
        <div className="container">
            <HomeSidebar fullUser={fullUser} userAuth={userAuth} className="profile" />

            <div className="main-content home">

                {/* Liste des posts */}
                {isLoading || (filteredPosts.length === 0 && isFetching) ? (
                    <div className="posts-skeleton-list">
                        <PostCardSkeleton />
                        <PostCardSkeleton />
                        <PostCardSkeleton />
                    </div>
                ) : (
                    <>
                        {filteredPosts.length === 0 ? (
                            <div className="empty-state-container">
                                <div className="empty-state-card">
                                    <div className="empty-state-icon-wrapper">
                                        <FiInbox size={48} className="empty-state-icon" />
                                    </div>
                                    <h3 className="empty-state-title">Aucun post pour le moment</h3>
                                    <p className="empty-state-subtitle">
                                        Les publications s'afficheront ici.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="posts-list">
                                {!isMobile &&

                                    <CreatePostBar
                                        fullUser={fullUser}
                                        userAuth={userAuth}
                                        handleCreate={openCreatePost}
                                        closeModale={closeCreatePost}
                                    />
                                }

                                {filteredPosts.map((post) => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onView={handleView}
                                    />
                                ))}
                            </div>
                        )}

                        {hasNextPage && (
                            <div ref={ref} className="posts-skeleton-list" style={{ minHeight: '50px' }}>
                                {isFetchingNextPage && (
                                    <div>
                                        <PostCardSkeleton />
                                        <PostCardSkeleton />
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {editPostId && (
                    <div className="modal-overlay">
                        <div className="modal-container">

                            <button className="modal-close" onClick={closeEditModal}>
                                ✕
                            </button>

                            <PostEdit id={editPostId} onClose={closeEditModal} />

                        </div>
                    </div>
                )}

                {modalPostId && !isMobile && (
                    <div className="modal-overlay">
                        <PostDetailModal
                            postId={modalPostId}
                            onClose={() => navigate("/")}
                        />
                    </div>
                )}


            </div>


            <HomeSidebarAppInfo />


        </div>
    );
};

export default Home;