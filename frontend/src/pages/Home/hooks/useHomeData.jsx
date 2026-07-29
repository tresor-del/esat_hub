import { useEffect } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/AuthContext";
import { getUserProfile, getPosts } from "../../../services/api";
import { sendSystemNotification } from "../../../services/notificationService";

const POSTS_PER_PAGE = 5;

export const useHomeData = () => {
    const { user: userAuth } = useAuth();

    //  Profil complet 
    const { data: fullUser } = useQuery({
        queryKey: ["userProfile", userAuth?.id],
        queryFn: () => getUserProfile(userAuth.id),
        // la requête doit se lancer que si l'utilisateur existe
        enabled: !!userAuth?.id,
        staleTime: Infinity,
    });

    // Posts paginés 
    const {
        data: postsData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isFetching,
    } = useInfiniteQuery({
        queryKey: ["posts"],
        queryFn: async ({ pageParam = 0 }) => {
            return getPosts({ skip: pageParam, limit: POSTS_PER_PAGE, allPosts: true });
        },
        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage.posts || lastPage.posts.length < POSTS_PER_PAGE) return undefined;
            return allPages.length * POSTS_PER_PAGE;
        },
    });

    // extraire, aplatir et regrouper les postes.
    const posts = postsData?.pages.flatMap((p) => p.posts) ?? [];

    // Filtre les posts privés selon la room de l'utilisateur
    const filteredPosts = posts.filter(
        (post) => post.room_id === null || post.room_id === userAuth?.user_room_id
    );

    return {
        userAuth,
        fullUser,
        filteredPosts,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isFetching,
    };
};