// ─── useMediaActions.js ───────────────────────────────────────────────────────
// Handles media interactions: open detail, share, delete, deep-link on mount.
// Keeps all side-effects out of the view components.

import { useCallback, useEffect, useState } from "react";
import { useQueryClient }                   from "@tanstack/react-query";
import { deleteRoomMedia }                  from "../../../services/api";
import { isImageMedia, buildShareUrl }      from "../utils/mediaHelpers";

/**
 * @param {string|null} roomId
 * @param {Array}       roomMedia  — from useRoomData
 * @param {Function}    setView    — to switch to "media" tab on deep-link
 */
export const useMediaActions = (roomId, roomMedia, setView) => {
    const queryClient = useQueryClient();

    // ── Modal state ───────────────────────────────────────────────────────────
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [editingMedia,    setEditingMedia]    = useState(null);
    const [detailMediaId,   setDetailMediaId]   = useState(null);
    const [shareMedia,      setShareMedia]      = useState(null);
    const [imagePreview,    setImagePreview]    = useState(null);

    // ── Deep-link: parse URL on mount ─────────────────────────────────────────
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("source") === "share") {
            const id = params.get("id");
            if (id) {
                setView("media");
                setDetailMediaId(id);
            }
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Deep-link: open the right modal once media list is ready ──────────────
    useEffect(() => {
        if (!detailMediaId || roomMedia.length === 0) return;
        const target = roomMedia.find((m) => String(m.id) === String(detailMediaId));
        if (!target) return;

        if (isImageMedia(target)) {
            setImagePreview(target);
            setDetailMediaId(null); // clear so it doesn't re-trigger
        }
        // Documents stay open via detailMediaId → selectedDetailMedia in index.jsx
    }, [detailMediaId, roomMedia]);

    // ── Invalidation helper ───────────────────────────────────────────────────
    const invalidateMedia = useCallback(
        () => queryClient.invalidateQueries(["roomMedia", roomId]),
        [queryClient, roomId]
    );

    // ── Handlers ──────────────────────────────────────────────────────────────

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
        // modal visibility
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
        // close handlers
        closeUploadModal:  () => { setUploadModalOpen(false); setEditingMedia(null); },
        closeDetailModal:  () => setDetailMediaId(null),
        closeShareModal:   () => setShareMedia(null),
        closeImagePreview: () => setImagePreview(null),
    };
};