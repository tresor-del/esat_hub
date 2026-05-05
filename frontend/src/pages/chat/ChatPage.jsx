import React, { useState, useEffect } from 'react';
// import { useWebSocket } from '../contexts/WebSocketContext';
import { useNavigate } from 'react-router-dom';
import SearchFilters from '../../components/ui/SearchFilters';
import { FiArrowLeft } from 'react-icons/fi';
import { searchPosts } from '../../services/api';
import Avatar from '../../components/ui/Avatar';
import ChatBox from '../../components/chat/ChatBox';
import "../../styles/Chat.css"
import { getRecentChat } from '../../services/chatApi';

const ChatPage = () => {
    //   const { messages, user } = useWebSocket();
    const [activeRecipient, setActiveRecipient] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [view, setView] = useState("recent")
    const [recentChats, setRecentChats] = useState([]);

    const navigate = useNavigate()


    useEffect(() => {
        const loadRecent = async () => {
            try {
                const data = await getRecentChat();
                setRecentChats(data || []);
                console.log("Recent:", data)
            } catch (error) {
                console.error("Erreur chargement récents:", error);
            }
        };
        loadRecent();
    }, []);

    const handleSearch = async (value) => {
        setSearchQuery(value);
        if (value.length > 2) {
            const result = await searchPosts(value);
            console.log(result)
            setSearchResults(result.users_list.users);
        } else {
            setSearchResults([]);
        }
    };

    const handleSeeRecent = () => {
        setView("recent");
    }

    const handleSeeNew = () => {
        setView("new")
    }

    return (
        <div className='chat-container  '>

            {/* SIDEBAR : Recherche et Contacts */}
            <div className='side-bar'>
                <div className="go-back-btn" onClick={() => navigate("/")}>
                    <FiArrowLeft /> Retour
                </div>
                <div >
                    <h1>Inbox</h1>
                </div>

                <div className="search-filter-btns">
                    <button
                        className={`btn ${view === 'recent' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={handleSeeRecent}
                    >
                        Récents
                    </button>
                    <button
                        className={`btn ${view === 'new' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={handleSeeNew}
                    >
                        Nouveau
                    </button>
                </div>
                {view === 'recent' && (
                    <div className="contacts-list">
                        {recentChats.length > 0 ? (
                            recentChats.map(u => (
                                <div
                                    key={u.id}
                                    onClick={() => setActiveRecipient(u)}
                                    className={`contact-list-item ${activeRecipient?.id === u.id ? 'active' : ''}`}
                                >
                                    <Avatar user={u} /> {u.profil_name}
                                </div>
                            ))
                        ) : (
                            <p className='empty-text'>Aucune conversation récente</p>
                        )}
                    </div>
                )}

                {view === 'new' && (
                    <div className='new-view'>
                        <div className="search">
                            <SearchFilters onSearch={handleSearch} chat={true} />
                        </div>
                        <div className="contacts-list">
                            {searchResults.length > 0 ? (
                                // Résultats de recherche
                                searchResults.map(u => (
                                    <div
                                        key={u.id}
                                        onClick={() => { setActiveRecipient(u); setSearchQuery(""); }}
                                        className='contact-list-item'
                                    >
                                        <Avatar user={u} /> {u.profil_name}
                                    </div>
                                ))
                            ) : (
                                // Ici tu pourrais lister tes conversations récentes
                                <p className='empty-text'>Aucun utilisateur trouvé</p>
                            )}
                        </div>
                    </div>

                )}

            </div>

            {/* ZONE DE CHAT : Vide ou Active */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {activeRecipient ? (
                    <ChatBox recipient={activeRecipient} />
                ) : (
                    <div style={{ margin: 'auto', textAlign: 'center', color: '#888' }}>
                        <div style={{ fontSize: '50px' }}>💬</div>
                        <h3>Sélectionnez une conversation</h3>
                        <p>Cherchez un utilisateur à gauche pour commencer à discuter.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;
