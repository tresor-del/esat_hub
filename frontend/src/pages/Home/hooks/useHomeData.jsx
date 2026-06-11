import { useEffect } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/AuthContext";
import { getUserProfile, getPosts } from "../../../services/api";
import { sendSystemNotification } from "../../../services/notificationService";

const POSTS_PER_PAGE = 10;

export const useHomeData = () => {
    const { user: userAuth } = useAuth();

    // ── Profil complet (avatar, bio…) ─────────────────────────────────────────
    const { data: fullUser } = useQuery({
        queryKey: ["userProfile", userAuth?.id],
        queryFn: () => getUserProfile(userAuth.id),
        enabled: !!userAuth?.id,
        staleTime: Infinity,
    });

    // ── Posts paginés ─────────────────────────────────────────────────────────
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

    const posts = postsData?.pages.flatMap((p) => p.posts) ?? [];

    // Filtre les posts privés selon la room de l'utilisateur
    const filteredPosts = posts.filter(
        (post) => post.room_id === null || post.room_id === userAuth?.user_room_id
    );

    // ── Notification de bienvenue (une seule fois par utilisateur) ────────────
    const setupWelcomeNotification = async () => {
        if (window.AppInventor) return; // Ignoré dans Kodular

        const key = `welcome_notif_sent_${userAuth?.id}`;
        if (localStorage.getItem(key)) return;
        if (!("Notification" in window)) return;

        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        if (navigator.serviceWorker) {
            await navigator.serviceWorker.ready;
            sendSystemNotification({
                type: "SHOW_WS_NOTIFICATION",
                title: `${userAuth?.profil_name}`,
                body: "Bienvenue sur EsatHub!",
            });
            localStorage.setItem(key, "true");
        }
    };

    useEffect(() => {
        setupWelcomeNotification();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

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