import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useNavigate } from 'react-router-dom';
import SearchFilters from '../../components/ui/SearchFilters';
import { FiArrowLeft } from 'react-icons/fi';
import { useSearchParams } from 'react-router-dom';
import { searchPosts } from '../../services/api';
import { getAllUsers, markMessagesAsReadApi } from '../../services/chatApi';
import Avatar from '../../components/ui/Avatar';
import ChatBox from '../../components/chat/ChatBox';
import "../../styles/Chat/Chat.css"
import "../../styles/Home.css"
import { getRecentChat } from '../../services/chatApi';
import { set } from 'date-fns';
import Logo from '../../components/common/Logo';
import { useAuth } from '../../contexts/AuthContext';
import HomeSidebar from '../Home/components/HomeSidebar';

const ChatPage = () => {
    const { unreadChatsCount, refreshUnreadCount, setUnreadChatsCount, activeConvRef, messages } = useWebSocket();
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
    const [allUsers, setAllUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const { user: fullUser } = useAuth();

    const navigate = useNavigate()

    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        const loadRecent = async () => {
            setLoadingRecentChats(true);
            try {
                const data = await getRecentChat();
                setRecentChats(data || []);
            } catch (error) {
                console.error("Erreur chargement récents:", error);
            } finally {
                setLoadingRecentChats(false);
            }
        };

        const getAll = async () => {
            try {
                setLoadingUsers(true)
                const data = await getAllUsers();
                setAllUsers(data || []);
            } catch (error) {
                console.error("Erreur lors de la reception des users:", error);

            } finally {
                setLoadingUsers(false)
            }
        }

        getAll();
        loadRecent();
    }, []);

    useEffect(() => {
        const handleChatUpdate = (event) => {
            console.log("CHAT_UPDATED reçu:", event.detail);
            const msg = event.detail;
            const isActiveConv = activeRecipientRef.current?.id === msg.sender.id;

            setRecentChats(prev => prev.map(chat => {

                const isThisChat = chat.user?.id === msg.sender.id || chat.user?.id === msg.recipient_id;
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

            setRecentChats(prev => prev.sort(
                (a, b) => new Date(b.last_message_timestamp) - new Date(a.last_message_timestamp)
            ))
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

    // 1. ÉCOUTER l'URL au chargement : Si un ID est présent, on l'active
    useEffect(() => {
        const userIdInUrl = searchParams.get('user');
        if (userIdInUrl && (!activeRecipient || activeRecipient.id !== userIdInUrl)) {
            // Trouvez l'utilisateur dans votre liste globale et activez-le
            const user = allUsers?.find(u => u.id === userIdInUrl);
            if (user) handleSelectRecipient(user);
        }
    }, [searchParams, allUsers, activeRecipient]);

    const handleSelectRecipient = async (recipient) => {
        // 1. ACTIONS INITIALES INSTANTANÉES (L'interface change de suite)
        activeConvRef.current = recipient.id;
        setActiveRecipient(recipient);
        setSearchParams({ user: recipient.id });
        activeRecipientRef.current = recipient;

        if (isMobileView) {
            setIsChatOpen(true);
        }

        // Trouver combien de messages non lus avait cette conv
        const chat = recentChats.find(c => c.user?.id === recipient.id);
        const previousUnread = chat?.unread_count || 0;

        // 2. MISE À JOUR LOCALE DU COMPTEUR (Pas d'attente d'API)
        setRecentChats(prev => prev.map(chat =>
            // CORRECTION SÉCURITÉ : Vérifier chat.user?.id au lieu de chat.id 
            // car u.user?.id est utilisé dans le .map de votre JSX
            (chat.user?.id === recipient.id || chat.user?.id === recipient.id)
                ? { ...chat, unread_count: 0 }
                : chat
        ));

        // Décrémenter immédiatement le badge global
        if (previousUnread > 0) {
            setUnreadChatsCount(prev => Math.max(0, prev - previousUnread)); // ← nécessite d'exposer ce setter
        }

        try {
            await markMessagesAsReadApi(recipient.id); // ← d'abord marquer comme lu
            await refreshUnreadCount();                 // ← ENSUITE refresh, avec la DB à jour
        } catch (error) {
            console.error("Erreur requêtes arrière-plan chat:", error);
        }
    };

    const handleCloseChat = () => {
        activeConvRef.current = null;
        setIsChatOpen(false);
        setActiveRecipient(null);
        setSearchParams({});
        activeRecipientRef.current = null;
    };

    const handleSearch = async (value) => {
        setSearchQuery(value);
        if (value.length > 2) {
            const result = await searchPosts(value);
            // console.log(result)
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

    const handleMsgEvent = (msg) => {

        setRecentChats(prev => prev.map(chat => {

            const isThisChat = chat.user?.id === activeRecipientRef.current?.id;
            if (!isThisChat) return chat;

            return {
                ...chat,
                last_message_content: msg.last_message_content,
                last_message_timestamp: msg.last_message_timestamp,
                last_sender_id: msg.last_sender_id,
                // Non lu seulement si message entrant ET pas dans la conv active
                unread_count: 0,
            };


        }));

        setRecentChats(prev => prev.sort(
            (a, b) => new Date(b.last_message_timestamp) - new Date(a.last_message_timestamp)
        ))
    }


    return (
        <div className='chat'>
            <div className="chat-container">
                <div className='page-name' >
                    <p>Messagerie</p>
                    <div className="search-filter-btns">
                        <button
                            className={` search-filter-btn ${view === 'recent' ? 'active' : ''}`}
                            onClick={handleSeeRecent}
                        >
                            Tout
                        </button>
                        <button
                            className={`search-filter-btn ${view === 'new' ? 'active' : ''}`}
                            onClick={handleSeeNew}
                        >
                            Nouveau
                        </button>
                    </div>
                </div>

                <div className='chat-container-main'>
                    {/* SIDEBAR : Recherche et Contacts */}
                    <div className={`side-bar ${isMobileView && isChatOpen ? 'hidden' : ''}`}>

                        {view === 'recent' && (
                            <div className="contacts-list">
                                {loadingRecentChats ? (
                                    <>
                                        {/* Génère 4 lignes de squelettes de contacts en boucle */}
                                        {Array(8).fill(0).map((_, index) => (
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
                                                    <Avatar user={u.user} size="smlarge" />
                                                    <div className="contact-info">
                                                        <div className="contact-header">
                                                            <span className="contact-name">{u.user.first_name} {u.user.last_name}</span>
                                                            <span className="contact-time">{formatTime(u.last_message_timestamp)}</span>
                                                        </div>
                                                        <div className='content-u'>
                                                            <p className="contact-preview">
                                                                {u.last_sender_id === fullUser?.id ? "Vous : " : `${u.user.first_name} : `}
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
                                {/* <p className='title'>Nouveau message</p> */}
                                <div className="search">
                                    <input onChange={(e) => handleSearch(e.target.value)} className='chat-search-input' type="text" placeholder='Taper un nom' />
                                </div>
                                <p className='title'>Suggestions</p>
                                <div className="contacts-list">
                                    {loadingUsers ? (
                                        <>
                                            {/* Génère 8 lignes de squelettes de contacts en boucle */}
                                            {Array(8).fill(0).map((_, index) => (
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
                                            {(searchResults.length > 0 ? searchResults : allUsers).length > 0 ? (
                                                (searchResults.length > 0 ? searchResults : allUsers).map(u => (
                                                    <div
                                                        key={u.id}
                                                        onClick={() => { handleSelectRecipient(u); setSearchQuery(""); }}
                                                        className='contact-list-item'
                                                    >
                                                        <Avatar user={u} />
                                                        <div className="contact-info">
                                                            <div className="contact-header">

                                                                <span className="contact-name">{u.first_name} {u.last_name}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className='empty-text'>Aucun utilisateur trouvé</p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>

                    {/* ZONE DE CHAT : Vide ou Active */}
                    <div className={`chat-zone ${isMobileView ? '' : 'desktop'} ${isMobileView && isChatOpen ? 'active' : ''}`}>
                        {activeRecipient ? (
                            <ChatBox recipient={activeRecipient} onClose={handleCloseChat} isMobile={isMobileView} onMessage={handleMsgEvent} />
                        ) : (
                            <div style={{ margin: 'auto', textAlign: 'center', color: '#888' }}>
                                <div style={{ fontSize: '50px' }}>💬</div>
                                <h3>Sélectionnez une conversation</h3>
                                <p>Cherchez un utilisateur à gauche pour commencer à discuter.</p>
                            </div>
                        )}
                    </div>
                </div>


            </div>

            <HomeSidebar fullUser={activeRecipient ? activeRecipient : fullUser} userAuth={activeRecipient ? activeRecipient : fullUser} className="profile" />

        </div>

    );
};

export default ChatPage;
