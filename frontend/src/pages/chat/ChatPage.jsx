import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useNavigate } from 'react-router-dom';
import SearchFilters from '../../components/ui/SearchFilters';
import { FiArrowLeft } from 'react-icons/fi';
import { searchPosts } from '../../services/api';
import { markMessagesAsReadApi } from '../../services/chatApi';
import Avatar from '../../components/ui/Avatar';
import ChatBox from '../../components/chat/ChatBox';
import "../../styles/Chat.css"
import logo from "../../../public/logo_circle.png"
import { getRecentChat } from '../../services/chatApi';
import { set } from 'date-fns';

const ChatPage = () => {
    const { unreadChatsCount, refreshUnreadCount, messages } = useWebSocket();
    const [activeRecipient, setActiveRecipient] = useState(null);
    // on utilise useRef pour avoir les valeurs courantes et eviter les closures
    const activeRecipientRef = useRef();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [view, setView] = useState("recent")
    const [recentChats, setRecentChats] = useState([]);
    const [loadingRecentChats, setLoadingRecentChats] = useState(true);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const navigate = useNavigate()


    useEffect(() => {
        const loadRecent = async () => {
            setLoadingRecentChats(true);
            try {
                const data = await getRecentChat();
                setRecentChats(data || []);
                console.log("Recent:", data)
            } catch (error) {
                console.error("Erreur chargement récents:", error);
            } finally {
                setLoadingRecentChats(false);
            }
        };
        loadRecent();
    }, []);

    useEffect(() => {
        const handleChatUpdate = (event) => {

            const msg = event.detail;
            const isActiveConv = activeRecipientRef.current?.id === msg.sender_id;

            setRecentChats(prev => prev.map(chat => {

                const isThisChat = chat.id === msg.sender_id || chat.id === msg.recipient_id;
                if (!isThisChat) return chat;

                return {
                    ...chat,
                    last_message_content: msg.content,
                    last_message_timestamp: msg.timestamp,
                    // Non lu seulement si message entrant ET pas dans la conv active
                    unread_count: msg.isIncoming && !isActiveConv
                        ? chat.unread_count + 1
                        : chat.unread_count
                };
            }));
        };
        window.addEventListener("CHAT_UPDATED", handleChatUpdate);
        return () => window.removeEventListener("CHAT_UPDATED", handleChatUpdate);
    }, []);


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
        activeRecipientRef.current = recipient;

        setRecentChats(prev => prev.map(chat =>
            chat.id === recipient.id
                ? { ...chat, unread_count: 0 }
                : chat
        ));

        try {

            await markMessagesAsReadApi(recipient.id);

            await refreshUnreadCount();

        } catch (error) {
            console.error("Erreur marquage lu:", error);
        }

        if (isMobileView) {
            setIsChatOpen(true);
        }
    };

    const handleCloseChat = () => {
        setIsChatOpen(false);
        setActiveRecipient(null);
        activeRecipientRef.current = null;
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
        <div className="chat-container" style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>

            {/* SIDEBAR : Recherche et Contacts */}
            <div className={`side-bar ${isMobileView && isChatOpen ? 'hidden' : ''}`}>
                <div className='page-name' >
                    <img src={logo} alt="" width={60} onClick={() => navigate("/")} />
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
                        {loadingRecentChats ? (
                            <>
                                {/* Génère 4 lignes de squelettes de contacts en boucle */}
                                {Array(4).fill(0).map((_, index) => (
                                    <div key={index} className="contact-list-item chat-skeleton-card">
                                        {/* Avatar Squelette */}
                                        <div className="chat-skeleton-avatar chat-skeleton-blink" />

                                        <div className="contact-info">
                                            <div className="contact-header">
                                                {/* Nom Squelette */}
                                                <div className="chat-skeleton-name chat-skeleton-blink" />
                                                {/* Heure Squelette */}
                                                <div className="chat-skeleton-time chat-skeleton-blink" />
                                            </div>
                                            <div className='content-u' style={{ marginTop: '8px' }}>
                                                {/* Aperçu du Message Squelette */}
                                                <div className="chat-skeleton-preview chat-skeleton-blink" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <>
                                {recentChats.length > 0 ? (
                                    recentChats.map(u => (
                                        <div
                                            key={u.user?.id}
                                            onClick={() => handleSelectRecipient(u.user)}
                                            className={`contact-list-item 
                                ${activeRecipient?.id === u.user?.id ? 'active' : ''}
                                ${u.unread_count > 0 ? 'unread' : ''}
                            `}
                                        >
                                            <Avatar user={u.user} />
                                            <div className="contact-info">
                                                <div className="contact-header">
                                                    <span className="contact-name">{u.user.profil_name}</span>
                                                    <span className="contact-time">{formatTime(u.last_message_timestamp)}</span>
                                                </div>
                                                <div className='content-u'>
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
                            </>
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
