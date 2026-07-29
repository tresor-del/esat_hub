import { useQuery } from "@tanstack/react-query";
import { useAuth }  from "../../../contexts/AuthContext";
import { getUserRoom, getPosts, getRoomMedia, getAsnmts } from "../../../services/api";

/**
 * @param {"users"|"posts"|"media"|"asnmt"} view  
 */
export const useRoomData = (view) => {
    const { user: authUser } = useAuth();

    const {
        data: room,
        isLoading: loadingRoom,
    } = useQuery({
        queryKey: ["userRoom"],
        queryFn:  getUserRoom,
        staleTime: 1000 * 60 * 30, 
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

    const {
        data: asnmts,
        isLoading: loadingAsnmts
    } = useQuery({
        queryKey: ["roomAsnmts", room?.id],
        queryFn: getAsnmts,
        staleTime: 10 * 1000,
        enabled: view === "asnmt" && !!room?.id
    })

    return {
        room,
        loadingRoom,
        posts:      postsData?.posts || [],
        loadingPosts,
        roomMedia:  mediaData?.media || [],
        loadingMedia,
        asnmts,
        loadingAsnmts,
    };
};