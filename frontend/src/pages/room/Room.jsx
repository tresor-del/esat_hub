import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext"
import { getUserRoom, getPosts, getRoomMedia, uploadRoomMedia, updateRoomMedia, deleteRoomMedia, getPostFileUrl } from "../../services/api"
import PostCard from "../../components/posts/Postcard";
import PostAuthorInfo from "../../components/posts/PostAuthorInfo";
import PostMedia from "../../components/posts/PostMedia";
import { FiUsers, FiBook, FiSearch, FiImage, FiMoreVertical, FiEdit, FiTrash2 } from "react-icons/fi";
import "../../styles/Room.css"
import Avatar from "../../components/ui/Avatar";
import { Navigate } from "react-router-dom";
import ImageModal from "../../components/ui/ImageModal";
import DropdownMenu from "../../components/ui/DropdownMenu";


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
    // const [imageModalOpen, setImageModalOpen] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);

    const queryClient = useQueryClient();

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


    if (isLoading) return <div className="room-loading">Chargement...</div>;
    if (!room) return <div className="room-error">Aucune salle trouvée.</div>;

    const onMobile = window.innerWidth < 768;


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

    return (
        <div className="room-container">
            <div className="room-left">
                <div className="room-name">
                    <h3>{room?.name}</h3>
                </div>
                {onMobile ? (
                    <div className="room-btns-mobile">
                        <button
                            className={`btn ${view === 'media' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={handleSeeMedia}
                        >
                            <FiImage />
                        </button>
                        <button
                            className={`btn ${view === 'users' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={handleSeeUsers}
                        >
                            <FiUsers />
                        </button>
                        <button
                            className={`btn ${view === 'posts' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={handleSeePosts}
                        >
                            <FiBook />
                        </button>
                    </div>
                ) : (
                    <div className="room-btns">
                        <button
                            className={`btn ${view === 'media' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={handleSeeMedia}
                        >
                            <FiImage /> médias
                        </button>
                        <button
                            className={`btn ${view === 'users' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={handleSeeUsers}
                        >
                            <FiUsers /> membres
                        </button>
                        <button
                            className={`btn ${view === 'posts' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={handleSeePosts}
                        >
                            <FiBook /> posts
                        </button>
                    </div>
                )}

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
                                <thead>
                                    <tr>
                                        <th>Membre</th>
                                        <th>Spécialité</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map((user) => (
                                            <tr key={user.id} className="user-row">
                                                <td>
                                                    <PostAuthorInfo user={user} variant="compact" />
                                                </td>
                                                <td>
                                                    <span className="domain-badge">
                                                        {user.major || 'Non spécifié'}
                                                    </span>
                                                </td>
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
                        <button onClick={openAddMediaModal} className="btn btn-primary">
                            Ajouter un média
                        </button>

                        <div className="users-search">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Rechercher un média..."
                                value={searchMediaQuery}
                                onChange={(e) => setSearchMediaQuery(e.target.value)}
                            />
                        </div>

                        {searchMediaQuery && (
                            <div className="search-results-info">
                                {filteredMedia.length} résultat(s) pour "{searchMediaQuery}"
                            </div>
                        )}

                        {modalOpen && (
                            <div className="media-upload-card-container">
                                <div className="media-upload-card">
                                    <h2>{editingMedia ? 'Modifier le média' : 'Ajouter un média'}</h2>
                                    <form onSubmit={handleSubmitMedia} className="media-upload-form">
                                        <label>
                                            Titre
                                            <input
                                                type="text"
                                                value={mediaTitle}
                                                onChange={(e) => setMediaTitle(e.target.value)}
                                                placeholder="Titre du média"
                                            />
                                        </label>
                                        <label>
                                            Description
                                            <textarea
                                                value={mediaDescription}
                                                onChange={(e) => setMediaDescription(e.target.value)}
                                                placeholder="Description (optionnelle)"
                                            />
                                        </label>
                                        <label>
                                            Fichier
                                            <input
                                                type="file"
                                                onChange={handleFileChange}
                                                accept="image/*,application/pdf,video/*,audio/*"
                                            />
                                        </label>
                                        {editingMedia && (
                                            <p className="media-help-text">
                                                Sélectionnez un nouveau fichier pour remplacer le fichier actuel.
                                            </p>
                                        )}
                                        {uploadError && <div className="upload-error">{uploadError}</div>}
                                        <button type="submit" className="btn btn-primary" disabled={uploading}>
                                            {uploading ? 'Envoi...' : editingMedia ? 'Mettre à jour le média' : 'Envoyer le média'}
                                        </button>
                                        <button type="button" className="btn btn-secondary" onClick={hideModal}>
                                            Fermer
                                        </button>
                                    </form>
                                </div>
                            </div>)}

                        {loadingMedia ? (
                            <div className="posts-loading">Chargement des médias...</div>
                        ) : (
                            <div className="room-media-list">
                                {filteredMedia.length > 0 ? (
                                    filteredMedia.map((media) => (
                                        <div key={media.id} className="media-item">
                                            <div className="media-author-header">
                                                <PostAuthorInfo user={media.user} variant="default" />
                                                <div>
                                                    {media.user?.id === authUser?.id ? (
                                                        <DropdownMenu trigger={<FiMoreVertical />} align="right">
                                                            <button
                                                                className="post-action-btn"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openEditMediaModal(media);
                                                                }}
                                                                style={{
                                                                    color: "var(--reddit-blue)",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: 8,
                                                                }}
                                                            >
                                                                <FiEdit />
                                                                <span>Modifier</span>
                                                            </button>

                                                            <button
                                                                className="post-action-btn"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteMedia(media);
                                                                }}
                                                                style={{
                                                                    color: "#d32f2f",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: 8,
                                                                    marginTop: 6,
                                                                }}
                                                            >
                                                                <FiTrash2 />
                                                                <span>Supprimer</span>
                                                            </button>
                                                        </DropdownMenu>
                                                    ) : null}
                                                </div>
                                            </div>
                                            <div className="media-item-header">
                                                <div>
                                                    <strong>{media.title}</strong>
                                                    <p className="media-description-text">{media.description || 'Pas de description'}</p>
                                                </div>
                                                <span className="media-date">{new Date(media.created_at).toLocaleDateString('fr-FR')}</span>
                                            </div>

                                            <PostMedia post={media} />

                                            <div className="media-item-actions">
                                                <span className="media-type">{media.mime_type || 'Inconnu'}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-posts">{searchMediaQuery ? 'Aucun média trouvé pour cette recherche' : 'Aucun média dans cette salle'}</div>
                                )}
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
                                    posts.map((post) => <PostCard key={post.id} post={post} />)
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