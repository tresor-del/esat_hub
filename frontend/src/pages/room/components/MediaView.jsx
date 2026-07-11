import React, { useMemo, useState } from "react";
import { FiSearch } from "react-icons/fi";
import MediaCard from "./MediaCard";

/**
 * @prop {Array}    roomMedia
 * @prop {boolean}  loading
 * @prop {Function} onOpenAdd    
 * @prop {Function} onOpenDetail 
 * @prop {Function} onShare 
 */
const MediaView = ({ roomMedia = [], loading, onOpenAdd, onOpenDetail, onShare }) => {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredMedia = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return [...roomMedia]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .filter(
                (m) =>
                    !q ||
                    m.title?.toLowerCase().includes(q) ||
                    m.description?.toLowerCase().includes(q)
            );
    }, [roomMedia, searchQuery]);

    return (
        <div className="room-media-view">
            {/* Toolbar */}
            <div className="room-media-actions">
                <div className="media-room-header">
                    <h3 className="room-media-title">Médias</h3>
                    <button
                        type="button"
                        className="btn btn-primary media-add-btn"
                        onClick={onOpenAdd}
                    >
                        Ajouter un Fichier
                    </button>
                </div>
                <div className="users-search media-search">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Rechercher un média..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {searchQuery && (
                <div className="search-results-info">
                    {filteredMedia.length} résultat(s) pour "{searchQuery}"
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className="posts-loading">Chargement des médias...</div>
            ) : (
                <div className="room-media-list">
                    {filteredMedia.length > 0 ? (
                        filteredMedia.map((media) => (
                            <MediaCard
                                key={media.id}
                                media={media}
                                onOpen={onOpenDetail}
                                onShare={onShare}
                            />
                        ))
                    ) : (
                        <div className="no-posts">
                            {searchQuery
                                ? "Aucun média trouvé pour cette recherche"
                                : "Aucun média dans cette salle"}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MediaView;