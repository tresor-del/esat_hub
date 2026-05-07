import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useNavigate } from 'react-router-dom';
import SearchFilters from '../../components/ui/SearchFilters';
import { FiArrowLeft } from 'react-icons/fi';
import { searchPosts } from '../../services/api';
import { markMessagesAsReadApi } from '../../services/chatApi';
import Avatar from '../../components/ui/Avatar';
import ChatBox from '../../components/chat/ChatBox';
import "../../styles/Chat.css"
import { getRecentChat } from '../../services/chatApi';

const ChatPage = () => {
    const { unreadChatsCount, refreshUnreadCount, messages } = useWebSocket();
    const [activeRecipient, setActiveRecipient] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [view, setView] = useState("recent")
    const [recentChats, setRecentChats] = useState([]);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
    const [isChatOpen, setIsChatOpen] = useState(false);

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
    }, [messages, unreadChatsCount]);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobileView(mobile);
            if (!mobile) {
                setIsChatOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSelectRecipient = async (recipient) => {
        setActiveRecipient(recipient);
        if (recipient.unread_count > 0) {
            try {
                // 1. Appel API pour mettre à jour la DB
                await markMessagesAsReadApi(recipient.id);

                // 2. Refresh du badge global dans la Navbar
                await refreshUnreadCount();

                // 3. Optionnel : On peut aussi forcer un reload des conversations 
                // pour enlever le point rouge de la sidebar immédiatement
                // (Comme tu as [messages] en dépendance de ton useEffect, 
                // ça se fera peut-être déjà selon ta logique)
            } catch (error) {
                console.error("Erreur marquage lu:", error);
            }
        }
        if (isMobileView) {
            setIsChatOpen(true);
        }
    };

    const handleCloseChat = () => {
        setIsChatOpen(false);
        setActiveRecipient(null);
    };

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

    const formatTime = (timestamp) => {
        if (!timestamp) return "";
        return new Intl.DateTimeFormat('fr-FR', {
            hour: 'numeric',
            minute: 'numeric',
        }).format(new Date(timestamp));
    };


    return (
        <div className='chat-container  '>

            {/* SIDEBAR : Recherche et Contacts */}
            <div className={`side-bar ${isMobileView && isChatOpen ? 'hidden' : ''}`}>
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
                                    onClick={() => handleSelectRecipient(u)}
                                    // La classe 'active' gérera le changement de background color
                                    className={`contact-list-item 
                        ${activeRecipient?.id === u.id ? 'active' : ''}
                        ${u.unread_count > 0 ? 'unread' : ''}
                        `}
                                >
                                    <Avatar user={u} />
                                    <div className="contact-info">
                                        <div className="contact-header">
                                            <span className="contact-name">{u.profil_name}</span>
                                            {/* Affichage de l'heure du dernier message */}
                                            <span className="contact-time">{formatTime(u.last_message_timestamp)}</span>
                                        </div>
                                        <div className='content-u'>
                                            {/* Aperçu du message */}
                                            <p className="contact-preview">
                                                {u.last_message_content || "Aucun message"}
                                            </p>
                                            {u.unread_count > 0 && (<span className='unread-msg-badge'>{u.unread_count}</span>)}
                                        </div>

                                    </div>
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
                                        onClick={() => { handleSelectRecipient(u); setSearchQuery(""); }}
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
            <div className={`chat-zone ${isMobileView ? '' : 'desktop'} ${isMobileView && isChatOpen ? 'active' : ''}`}>
                {activeRecipient ? (
                    <ChatBox recipient={activeRecipient} onClose={handleCloseChat} isMobile={isMobileView} />
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
