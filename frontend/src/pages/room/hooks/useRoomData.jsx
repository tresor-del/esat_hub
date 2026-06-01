// ─── useRoomData.js ───────────────────────────────────────────────────────────
// Centralises all data fetching for the Room page.
// Returns raw data + loading flags; no side-effects or UI logic.

import { useQuery } from "@tanstack/react-query";
import { useAuth }  from "../../../contexts/AuthContext";
import { getUserRoom, getPosts, getRoomMedia } from "../../../services/api";

/**
 * @param {"users"|"posts"|"media"} view  — controls which queries are enabled
 */
export const useRoomData = (view) => {
    const { user: authUser } = useAuth();

    const {
        data: room,
        isLoading: loadingRoom,
    } = useQuery({
        queryKey: ["userRoom"],
        queryFn:  getUserRoom,
        staleTime: 1000 * 60 * 30, // 30 min — room changes rarely
        enabled:  !!authUser,
    });

    const {
        data: postsData,
        isLoading: loadingPosts,
    } = useQuery({
        queryKey: ["roomPosts", room?.id],
        queryFn:  () => getPosts({ roomId: room.id }),
        staleTime: 1000 * 60,
        enabled:  view === "posts" && !!room?.id,
    });

    const {
        data: mediaData,
        isLoading: loadingMedia,
    } = useQuery({
        queryKey: ["roomMedia", room?.id],
        queryFn:  getRoomMedia,
        staleTime: 1000 * 60,
        enabled:  view === "media" && !!room?.id,
    });

    return {
        room,
        loadingRoom,
        posts:      postsData?.posts || [],
        loadingPosts,
        roomMedia:  mediaData?.media || [],
        loadingMedia,
    };
};