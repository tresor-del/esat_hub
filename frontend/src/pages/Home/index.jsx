// ─── Home/index.jsx ───────────────────────────────────────────────────────────

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { FiInbox } from "react-icons/fi";
import { useInView } from 'react-intersection-observer';

import { useHomeData } from "./hooks/useHomeData";
import HomeSidebar from "./components/HomeSidebar";
import CreatePostBar from "./components/CreatePostBar";

import PostCard from "../../components/posts/Postcard";
import PostCardSkeleton from "../../components/skeletons/PostcardSkeleton";
import UserTour from "../../components/common/Usertour";
import { deletePost } from "../../services/api";
import "../../styles/Home.css";

const Home = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

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

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleEdit = (post) => navigate(`/edit/${post.id}`);

    const handleView = (post) => navigate(`/post/${post.id}`);

    const handleDelete = async (post) => {
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${post.title}" ?`)) return;
        try {
            await deletePost(post.id);
            queryClient.invalidateQueries({ queryKey: ["posts"] });
            alert("Poste supprimé avec succès");
        } catch (err) {
            console.error("Erreur lors de la suppression:", err);
            alert("Erreur lors de la suppression du poste");
        }
    };

    // infinite scroll
    const { ref, inView } = useInView({
        threshold: 0.1,
    });

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);


    const hasNext = false;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="container">
            <HomeSidebar fullUser={fullUser} userAuth={userAuth} />

            <div className="main-content home">
                {/* {!isLoading && filteredPosts.length > 0 && <UserTour />} */}


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
                                <CreatePostBar fullUser={fullUser} userAuth={userAuth} />

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
                            <div ref={ref} style={{ minHeight: '50px'}}>
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
            </div>
        </div>
    );
};

export default Home;