import { useCallback, useEffect, useState } from "react";
import { useQueryClient }                   from "@tanstack/react-query";
import { deleteRoomMedia }                  from "../../../services/api";
import { isImageMedia, buildShareUrl }      from "../utils/mediaHelpers";

/**
 * @param {string|null} roomId
 * @param {Array}       roomMedia 
 * @param {Function}    setView  
 */
export const useMediaActions = (roomId, roomMedia, setView) => {
    const queryClient = useQueryClient();

    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [editingMedia,    setEditingMedia]    = useState(null);
    const [detailMediaId,   setDetailMediaId]   = useState(null);
    const [shareMedia,      setShareMedia]      = useState(null);
    const [imagePreview,    setImagePreview]    = useState(null);

    // analyser l'url, exclure l'id s'il y en a et afficher le modal
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("source") === "share") {
            const id = params.get("id");
            if (id) {
                setView("media");
                setDetailMediaId(id);
            }
        }
    }, []); 
    
    // afficher le modal des fichiers si sélectionné
    useEffect(() => {
        if (!detailMediaId || roomMedia.length === 0) return;
        const target = roomMedia.find((m) => String(m.id) === String(detailMediaId));
        if (!target) return;

        if (isImageMedia(target)) {
            setImagePreview(target);
            setDetailMediaId(null); 
        }
    }, [detailMediaId, roomMedia]);

    const invalidateMedia = useCallback(
        () => queryClient.invalidateQueries(["roomMedia", roomId]),
        [queryClient, roomId]
    );


    const handleOpenDetail = useCallback((media) => {
        if (isImageMedia(media)) {
            setImagePreview(media);
        } else {
            setDetailMediaId(media.id);
        }
    }, []);

    const handleShare = useCallback((media) => {
        if (navigator.share) {
            navigator.share({ title: "ESAT Hub", url: buildShareUrl(media) })
                .catch(console.error);
        } else {
            setShareMedia(media);
        }
    }, []);

    const handleDeleteMedia = useCallback(async (media) => {
        if (!window.confirm(`Voulez-vous vraiment supprimer "${media.title}" ?`)) return;
        try {
            await deleteRoomMedia(media.id);
            invalidateMedia();
        } catch (err) {
            console.error(err);
        }
    }, [invalidateMedia]);

    const handleUploadSuccess = useCallback(() => {
        setUploadModalOpen(false);
        setEditingMedia(null);
        invalidateMedia();
    }, [invalidateMedia]);

    const openAddModal = useCallback(() => {
        setEditingMedia(null);
        setUploadModalOpen(true);
    }, []);

    const openEditModal = useCallback((media) => {
        setEditingMedia(media);
        setUploadModalOpen(true);
    }, []);

    return {
        // visibilité des modals
        uploadModalOpen,
        editingMedia,
        detailMediaId,
        shareMedia,
        imagePreview,
        // actions
        handleOpenDetail,
        handleShare,
        handleDeleteMedia,
        handleUploadSuccess,
        openAddModal,
        openEditModal,
        //gestionnaires de fermerture;
        closeUploadModal:  () => { setUploadModalOpen(false); setEditingMedia(null); },
        closeDetailModal:  () => setDetailMediaId(null),
        closeShareModal:   () => setShareMedia(null),
        closeImagePreview: () => setImagePreview(null),
    };
};