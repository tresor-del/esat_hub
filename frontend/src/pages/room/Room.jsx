import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext"
import { getUserRoom, getPosts } from "../../services/api"
import PostCard from "../../components/posts/Postcard";
import PostAuthorInfo from "../../components/posts/PostAuthorInfo";
import { FiUsers, FiBook, FiSearch } from "react-icons/fi";
import "../../styles/Room.css"
import Avatar from "../../components/ui/Avatar";
import { Navigate } from "react-router-dom";


const Room = () => {
    const { user: authUser } = useAuth();
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('users'); // 'users', 'posts'
    const [posts, setPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (authUser) {
            userRoomFunc();
        }
    }, [authUser])

    const userRoomFunc = async () => {
        try {
            setLoading(true);
            const result = await getUserRoom();
            if (result) {
                setRoom(result);
                console.log("user_room: ", result)
            }
        } catch (error) {
            console.log("Erreur lors de la récupération du room: ", error);
        } finally {
            setLoading(false)
        }
    }

    const handleSeeUsers = () => {
        setView('users');
    }

    const handleSeePosts = async () => {
        setView('posts');
        if (posts.length === 0 && !loadingPosts) {
            try {
                setLoadingPosts(true);
                const roomId = room.id
                const result = await getPosts({ roomId });
                if (result) {
                    setPosts(result.posts);
                    console.log(result)
                }
            } catch (error) {
                console.log("Erreur lors de la récupération des posts: ", error);
            } finally {
                setLoadingPosts(false);
            }
        }
    }

    const handleSeeFiles = () => {
        setView('files');
    }


    // Filter users based on search query
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

    if (loading) return <div className="room-loading">Chargement...</div>;
    if (!room) return <div className="room-error">Aucune salle trouvée.</div>;

    return (
        <div className="room-container">
            <div className="room-left">
                <div className="room-name">
                    <h3>{room?.name}</h3>
                </div>
                <div className="room-btns">
                    <button 
                        className={`btn ${view === 'users' ? 'btn-primary' : 'btn-secondary'}`} 
                        onClick={handleSeeUsers}
                    >
                        <FiUsers/> membres
                    </button>
                    <button 
                        className={`btn ${view === 'posts' ? 'btn-primary' : 'btn-secondary'}`} 
                        onClick={handleSeePosts}
                    >
                        <FiBook /> posts
                    </button>
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