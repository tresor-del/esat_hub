import React, { useMemo, useState } from "react";
import "../../styles/Rooms/Room.css";

import { useRoomData } from "./hooks/useRoomData";
import { useMediaActions } from "./hooks/useMediaActions";
import { getMediaUrl } from "./utils/mediaHelpers";

import RoomSidebar from "./components/RoomSidebar";
import UsersView from "./components/UsersView";
import PostsView from "./components/PostsView";
import MediaView from "./components/MediaView";
import AttendanceView from "./components/AttendanceView";

import MediaUploadModal from "./components/modals/MediaUploadModal";
import MediaDetailModal from "./components/modals/MediaDetailModal";
import ShareModal from "./components/modals/ShareModal";
import ImageModal from "../../components/ui/ImageModal";

const Room = () => {
    const [view, setView] = useState("users");

    // hook pour les données de la salle de classe
    const {
        room,
        loadingRoom,
        posts,
        loadingPosts,
        roomMedia,
        loadingMedia,
    } = useRoomData(view);

    const {
        uploadModalOpen,
        editingMedia,
        detailMediaId,
        shareMedia,
        imagePreview,
        handleOpenDetail,
        handleShare,
        handleUploadSuccess,
        openAddModal,
        closeUploadModal,
        closeDetailModal,
        closeShareModal,
        closeImagePreview,
    } = useMediaActions(room?.id, roomMedia, setView);

    
    const selectedDetailMedia = useMemo(
        () =>
            detailMediaId
                ? (roomMedia.find((m) => String(m.id) === String(detailMediaId)) ?? null)
                : null,
        [roomMedia, detailMediaId]
    );

    if (!room) return <div className="room-error">Aucune salle trouvée.</div>;

    return (
        <div className="room-container">

            {loadingRoom &&
                <div className='spinner-container'>
                    <div className="spinner"></div>
                </div>
            }

            <RoomSidebar room={room} view={view} onViewChange={setView} />

            <div className="room-right">
                {view === "users" && (
                    <UsersView users={room.users} />
                )}

                {view === "posts" && (
                    <PostsView posts={posts} loading={loadingPosts} />
                )}

                {view === "media" && (
                    <MediaView
                        roomMedia={roomMedia}
                        loading={loadingMedia}
                        onOpenAdd={openAddModal}
                        onOpenDetail={handleOpenDetail}
                        onShare={handleShare}
                    />
                )}

                {view === "attendance" && (
                    <AttendanceView />
                )}
            </div>

            {/* Affichage des modales */}

            {uploadModalOpen && (
                <MediaUploadModal
                    editingMedia={editingMedia}
                    onClose={closeUploadModal}
                    onSuccess={handleUploadSuccess}
                />
            )}

            {selectedDetailMedia && (
                <MediaDetailModal
                    media={selectedDetailMedia}
                    onClose={closeDetailModal}
                />
            )}

            {imagePreview && (
                <ImageModal
                    src={getMediaUrl(imagePreview)}
                    alt={imagePreview.title}
                    onClose={closeImagePreview}
                />
            )}

            {shareMedia && (
                <ShareModal
                    media={shareMedia}
                    onClose={closeShareModal}
                />
            )}

        </div>
    );
};

export default Room;