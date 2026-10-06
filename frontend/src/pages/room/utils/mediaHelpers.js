
export const isImageMedia = (media) =>
    media?.mime_type?.startsWith("image/");

export const isDocumentMedia = (media) =>
    media?.mime_type?.startsWith("application/") ||
    media?.post_type === "document";

export const getMediaUrl = (media) =>
    media?.file_path || media?.url || media?.path || "";

export const buildShareUrl = (media) =>
    `https://esat-hub.vercel.app/room?source=share&id=${media.id}`;

export const formatMediaType = (media) => {
    if (isImageMedia(media))    return "Image";
    if (isDocumentMedia(media)) return "Document";
    return "Fichier";
};

export const ROOM_DISPLAY_NAMES = {
    PREPA_2: "Prépa. 2ème Année",
    PREPA_1: "Prépa. 1ère Année",
};