import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext"
import { getUserRoom, getPosts, getRoomMedia, uploadRoomMedia, updateRoomMedia, deleteRoomMedia, getPostFileUrl } from "../../services/api"
import PostCard from "../../components/posts/Postcard";
import PostAuthorInfo from "../../components/posts/PostAuthorInfo";
import PostMedia from "../../components/posts/PostMedia";
import ImageModal from "../../components/ui/ImageModal";
import { FiUsers, FiBook, FiSearch, FiImage, FiFileText, FiMoreVertical, FiEdit, FiTrash2, FiArrowLeft, FiFilter } from "react-icons/fi";
import "../../styles/Room.css"
import Avatar from "../../components/ui/Avatar";
import { Navigate, useNavigate } from "react-router-dom";
import DropdownMenu from "../../components/ui/DropdownMenu";
import Footer from "../../components/common/Footer";


const Room = () => {
    const { user: authUser } = useAuth();
    // const [room, setRoom] = useState(null);
    // const [loading, setLoading] = useState(true);
    const [view, setView] = useState('users'); // 'users', 'posts', 'media'
    // const [posts, setPosts] = useState([]);
    // const [loadingPosts, setLoadingPosts] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchMediaQuery, setSearchMediaQuery] = useState("");
    const [mediaTitle, setMediaTitle] = useState("");
    const [mediaDescription, setMediaDescription] = useState("");
    const [mediaFile, setMediaFile] = useState(null);
    const [uploadError, setUploadError] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingMedia, setEditingMedia] = useState(null);
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [selectedImageMedia, setSelectedImageMedia] = useState(null);

    const queryClient = useQueryClient();
    const navigate = useNavigate()

    // Room — change très rarement
    const { data: room, isLoading } = useQuery({
        queryKey: ["userRoom"],
        queryFn: getUserRoom,
        staleTime: 1000 * 60 * 30, // 30 minutes
        enabled: !!authUser,
    });

    // Posts de la room — chargés seulement si vue 'posts' active
    const { data: postsData, isLoading: loadingPosts } = useQuery({
        queryKey: ["roomPosts", room?.id],
        queryFn: () => getPosts({ roomId: room.id }),
        staleTime: 1000 * 60,
        enabled: view === 'posts' && !!room?.id, // ← chargé seulement quand nécessaire
    });

    const { data: mediaData, isLoading: loadingMedia } = useQuery({
        queryKey: ["roomMedia", room?.id],
        queryFn: getRoomMedia,
        staleTime: 1000 * 60,
        enabled: view === 'media' && !!room?.id,
    });

    const posts = postsData?.posts || [];
    const roomMedia = mediaData?.media || [];

    const filteredUsers = room?.users?.filter(user => {
        const query = searchQuery.toLowerCase();
        return (
            user.username?.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query) ||
            user.profil_name?.toLowerCase().includes(query) ||
            user.first_name?.toLowerCase().includes(query) ||
            user.last_name?.toLowerCase().includes(query)
        );
    }) || [];

    const filteredMedia = roomMedia.filter(media => {
        const query = searchMediaQuery.toLowerCase();
        return (
            media.title?.toLowerCase().includes(query) ||
            media.description?.toLowerCase().includes(query)
        );
    }) || [];

    const isImageMedia = (media) => media?.mime_type?.startsWith("image/");
    const isDocumentMedia = (media) => media?.mime_type?.startsWith("application/") || media?.post_type === "document";

    const getMediaUrl = (media) => {
        if (!media) return "";
        return media.file_path || media.url || media.path || "";
    };

    const openMediaDetail = (media) => {
        if (isImageMedia(media)) {
            setSelectedImageMedia(media);
            setSelectedMedia(null);
        } else {
            setSelectedMedia(media);
        }
    };

    const closeMediaDetail = () => setSelectedMedia(null);
    const closeImageModal = () => setSelectedImageMedia(null);

    if (isLoading) return <div className="room-loading">Chargement...</div>;
    if (!room) return <div className="room-error">Aucune salle trouvée.</div>;

    const handleSeeUsers = () => {
        setView('users');
    }

    const handleSeePosts = () => setView('posts');

    const handleSeeMedia = () => setView('media');

    const handleFileChange = (event) => {
        setMediaFile(event.target.files?.[0] || null);
    };

    const resetMediaForm = () => {
        setMediaTitle("");
        setMediaDescription("");
        setMediaFile(null);
        setUploadError(null);
        setEditingMedia(null);
    };

    const openAddMediaModal = () => {
        resetMediaForm();
        setModalOpen(true);
    };

    const openEditMediaModal = (media) => {
        setEditingMedia(media);
        setMediaTitle(media.title || "");
        setMediaDescription(media.description || "");
        setMediaFile(null);
        setUploadError(null);
        setModalOpen(true);
    };

    const handleSubmitMedia = async (event) => {
        event.preventDefault();
        setUploadError(null);

        if (!mediaTitle.trim()) {
            setUploadError("Veuillez ajouter un titre.");
            return;
        }

        if (!editingMedia && !mediaFile) {
            setUploadError("Veuillez ajouter un fichier.");
            return;
        }

        try {
            setUploading(true);
            if (editingMedia) {
                const formData = new FormData();
                formData.append("title", mediaTitle.trim());
                formData.append("description", mediaDescription.trim());
                if (mediaFile) {
                    formData.append("file", mediaFile);
                }

                await updateRoomMedia(editingMedia.id, formData);
            } else {
                await uploadRoomMedia({
                    title: mediaTitle.trim(),
                    description: mediaDescription.trim(),
                    file: mediaFile,
                });
            }

            resetMediaForm();
            setModalOpen(false);
            queryClient.invalidateQueries(["roomMedia", room?.id]);
        } catch (error) {
            console.error(error);
            setUploadError("Impossible d'enregistrer le média. Réessayez.");
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteMedia = async (media) => {
        if (!window.confirm(`Voulez-vous vraiment supprimer "${media.title}" ?`)) {
            return;
        }

        try {
            setUploading(true);
            await deleteRoomMedia(media.id);
            queryClient.invalidateQueries(["roomMedia", room?.id]);
        } catch (error) {
            console.error(error);
            setUploadError("Impossible de supprimer le média. Réessayez.");
        } finally {
            setUploading(false);
        }
    };

    const hideModal = () => {
        if (modalOpen) {
            setModalOpen(false);
            resetMediaForm();
        }
    }

    const handleView = (post) => {
        navigate(`/post/${post.id}`);
    };

    const handleEdit = (post) => {
        navigate(`/edit/${post.id}`);
    };

    return (
        <div className="room-container">
            <div className="room-left">
                <div className="room-name">

                    {/* <FiArrowLeft className="b-btn" onClick={() => navigate("/")} /> */}
                    <h3>
                        {room?.name === "PREPA_2" && "Prépa. 2eme Année"}
                        {room?.name === "PREPA_1" && "Prépa. 1eme Année"}
                    </h3>
                </div>
                <div className="room-btns">
                    <button
                        type="button"
                        className={`btn room-media-btn ${view === 'media' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={handleSeeMedia}
                        aria-label="Voir les médias"
                    >
                        <FiImage size={22} />
                        <span className="btn-label">médias</span>
                    </button>
                    <button
                        type="button"
                        className={`btn room-media-btn ${view === 'users' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={handleSeeUsers}
                        aria-label="Voir les membres"
                    >
                        <FiUsers size={22} />
                        <span className="btn-label">membres</span>
                    </button>
                    {/* <button
                        type="button"
                        className={`btn room-media-btn ${view === 'posts' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={handleSeePosts}
                        aria-label="Voir les posts"
                    >
                        <FiBook size={22} />
                        <span className="btn-label">posts</span>
                    </button> */}
                </div>

            </div>
            <div className="room-right">
                {view === 'users' ? (
                    <div className="room-users-view">

                        <div className="users-search">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Rechercher par nom, email ou pseudo..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {searchQuery && (
                            <div className="search-results-info">
                                {filteredUsers.length} résultat(s) pour "{searchQuery}"
                            </div>
                        )}

                        <div className="users-table-container">
                            <table className="users-table">
                                {/* <thead>
                                    <tr>
                                        <th>Membre</th>
                                        {/* <th>Spécialité</th> */}
                                {/* </tr> */}
                                {/* </thead>  */}
                                <tbody>
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map((user) => (
                                            <tr key={user.id} className="user-row">
                                                <td>
                                                    <PostAuthorInfo user={user} variant="full" showDomain={true} showMajor={true} />
                                                </td>
                                                {/* <td>
                                                    <span className="domain-badge">
                                                        {user.major || 'Non spécifié'}
                                                    </span>
                                                </td> */}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="no-results">
                                                {searchQuery ? 'Aucun membre trouvé pour cette recherche' : 'Aucun membre dans cette salle'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : view === 'media' ? (
                    <div className="room-media-view">
                        <div className="room-media-actions">
                            <div className="media-room-header">
                                <h3 className="room-media-title">Médias</h3>
                                <button onClick={openAddMediaModal} className="btn btn-primary media-add-btn">
                                    Ajouter un média
                                </button>
                            </div>

                            <div className="users-search media-search">
                                <FiSearch className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Rechercher un média..."
                                    value={searchMediaQuery}
                                    onChange={(e) => setSearchMediaQuery(e.target.value)}
                                />
                            </div>
                        </div>


                        {searchMediaQuery && (
                            <div className="search-results-info">
                                {filteredMedia.length} résultat(s) pour "{searchMediaQuery}"
                            </div>
                        )}

                        {loadingMedia ? (
                            <div className="posts-loading">Chargement des médias...</div>
                        ) : (
                            <div className="room-media-list">
                                {filteredMedia.length > 0 ? (
                                    filteredMedia.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((media) => (
                                        <button
                                            key={media.id}
                                            type="button"
                                            className="media-item"
                                            onClick={() => openMediaDetail(media)}
                                        >
                                            <div className="media-preview">
                                                {isImageMedia(media) ? (
                                                    <img
                                                        src={getMediaUrl(media)}
                                                        alt={media.title}
                                                        className="media-preview-image"
                                                    />
                                                ) : (
                                                    <div className="media-preview-icon">
                                                        <FiFileText size={32} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="media-item-body">
                                                <div className="media-item-meta">
                                                    <span className="media-item-badge">
                                                        {isImageMedia(media) ? 'Image' : isDocumentMedia(media) ? 'Document' : 'Fichier'}
                                                    </span>
                                                    <span className="media-date">
                                                        {media.created_at ? new Date(media.created_at).toLocaleDateString('fr-FR') : ''}
                                                    </span>
                                                </div>
                                                <h4>{media.title}</h4>
                                                <p>{media.description || 'Pas de description'}</p>
                                                <div className="media-item-author">
                                                    <Avatar user={media.user} />
                                                    <span>{media.user?.profil_name || media.user?.username || 'Anonyme'}</span>
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="no-posts">{searchMediaQuery ? 'Aucun média trouvé pour cette recherche' : 'Aucun média dans cette salle'}</div>
                                )}
                            </div>
                        )}

                        {modalOpen && (
                            <div className="media-upload-card-container" onClick={hideModal}>
                                <div className="media-upload-card" onClick={(e) => e.stopPropagation()}>
                                    <div className="media-upload-header">
                                        <h3>{editingMedia ? 'Modifier un média' : 'Ajouter un média'}</h3>
                                        <button type="button" className="modal-close-btn" onClick={hideModal}>
                                            ✕
                                        </button>
                                    </div>
                                    <form className="media-upload-form" onSubmit={handleSubmitMedia}>
                                        <label>
                                            Titre du média
                                            <input
                                                type="text"
                                                value={mediaTitle}
                                                onChange={(e) => setMediaTitle(e.target.value)}
                                                placeholder="Titre"
                                            />
                                        </label>
                                        <label>
                                            Description (facultative)
                                            <textarea
                                                value={mediaDescription}
                                                onChange={(e) => setMediaDescription(e.target.value)}
                                                placeholder="Description"
                                            />
                                        </label>
                                        <label>
                                            Fichier
                                            <input
                                                type="file"
                                                onChange={handleFileChange}
                                            />
                                        </label>
                                        {uploadError && <div className="upload-error">{uploadError}</div>}
                                        <div className="form-actions">
                                            <button type="button" className="btn btn-secondary" onClick={hideModal}>
                                                Annuler
                                            </button>
                                            <button type="submit" className="btn btn-primary" disabled={uploading}>
                                                {uploading ? 'Enregistrement...' : editingMedia ? 'Mettre à jour' : 'Ajouter'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {selectedImageMedia && (
                            <ImageModal
                                src={getMediaUrl(selectedImageMedia)}
                                alt={selectedImageMedia.title}
                                onClose={closeImageModal}
                            />
                        )}

                        {selectedMedia && (
                            <div className="media-detail-overlay" onClick={closeMediaDetail}>
                                <div className="media-detail-modal" onClick={(e) => e.stopPropagation()}>
                                    <div className="media-detail-header">
                                        <div>
                                            <span className="media-item-badge">
                                                {isImageMedia(selectedMedia) ? 'Image' : isDocumentMedia(selectedMedia) ? 'Document' : 'Fichier'}
                                            </span>
                                            <h3>{selectedMedia.title}</h3>
                                            <p>{selectedMedia.description || 'Pas de description fournie.'}</p>
                                        </div>
                                        <button type="button" className="modal-close-btn" onClick={closeMediaDetail}>
                                            ✕
                                        </button>
                                    </div>
                                    <div className="media-detail-body">
                                        {isImageMedia(selectedMedia) ? (
                                            <img
                                                src={getMediaUrl(selectedMedia)}
                                                alt={selectedMedia.title}
                                                className="media-detail-image"
                                            />
                                        ) : (
                                            <div className="media-detail-doc-preview">
                                                <FiFileText size={50} />
                                                <span>Document</span>
                                                <a
                                                    href={getMediaUrl(selectedMedia)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="btn btn-primary"
                                                >
                                                    Ouvrir le document
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                    <div className="media-detail-footer">
                                        <div>
                                            <strong>Auteur :</strong> {selectedMedia.user?.profil_name || selectedMedia.user?.username || 'Anonyme'}
                                        </div>
                                        <div>
                                            <strong>Type :</strong> {isImageMedia(selectedMedia) ? 'Image' : isDocumentMedia(selectedMedia) ? 'Document' : selectedMedia.mime_type}
                                        </div>
                                        <div>
                                            <strong>Date :</strong> {selectedMedia.created_at ? new Date(selectedMedia.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="room-posts-view">
                        {loadingPosts ? (
                            <div className="posts-loading">Chargement des posts...</div>
                        ) : (
                            <div className="room-posts">
                                {posts.length > 0 ? (
                                    posts.map((post) => <PostCard key={post.id} post={post} onView={handleView} onEdit={handleEdit} />)
                                ) : (
                                    <div className="no-posts">Aucun post trouvé dans cette salle.</div>
                                )}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    )
}

export default Room;