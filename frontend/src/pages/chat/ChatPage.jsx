import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useNavigate } from 'react-router-dom';
import SearchFilters from '../../components/ui/SearchFilters';
import { FiSearch, FiEdit, FiX } from 'react-icons/fi';
import { searchPosts } from '../../services/api';
import { markMessagesAsReadApi, getRecentChat } from '../../services/chatApi';
import Avatar from '../../components/ui/Avatar';
import ChatBox from '../../components/chat/ChatBox';
import Logo from '../../components/common/Logo';
import "../../styles/Chat.css";

/* --------------------------------------------------
   Données de démonstration pour la barre "actifs"
   (remplace par de vraies données si tu as un endpoint)
   -------------------------------------------------- */
const DEMO_ACTIVE_USERS = [
  { emoji: '⚡', bg: '#fff8e1', label: 'Votre Note' },
  { emoji: '👑', bg: '#e8f5e9', label: 'Alex' },
  { emoji: '🚀', bg: '#e3f2fd', label: 'Inès' },
  { emoji: '🎮', bg: '#fce4ec', label: 'Thomas' },
  { emoji: '🎨', bg: '#f3e5f5', label: 'Camille' },
  { emoji: '🏄', bg: '#e0f7fa', label: 'Mathis' },
];

const ChatPage = () => {
  const { refreshUnreadCount } = useWebSocket();

  // État de la conversation active
  const [activeRecipient, setActiveRecipient]   = useState(null);
  const activeRecipientRef                       = useRef(null);

  // Conversations récentes
  const [recentChats, setRecentChats]           = useState([]);
  const [loadingRecentChats, setLoadingRecentChats] = useState(true);

  // Recherche
  const [isSearchOpen, setIsSearchOpen]         = useState(false);
  const [searchQuery, setSearchQuery]           = useState('');
  const [searchResults, setSearchResults]       = useState([]);

  // Responsive
  const [isMobileView, setIsMobileView]         = useState(window.innerWidth <= 768);
  const [isChatOpen, setIsChatOpen]             = useState(false);

  const navigate = useNavigate();

  /* ------------------------------------------------
     1. Chargement initial des conversations récentes
     ------------------------------------------------ */
  useEffect(() => {
    const loadRecent = async () => {
      setLoadingRecentChats(true);
      try {
        const data = await getRecentChat();
        setRecentChats(data || []);
      } catch (err) {
        console.error('Erreur chargement récents:', err);
      } finally {
        setLoadingRecentChats(false);
      }
    };
    loadRecent();
  }, []);

  /* ------------------------------------------------
     2. Mise à jour temps réel de la sidebar via events
     ------------------------------------------------ */
  useEffect(() => {
    const handleChatUpdate = (event) => {
      const msg        = event.detail;
      const isActiveCv = activeRecipientRef.current?.id === msg.sender_id;

      setRecentChats(prev =>
        prev.map(chat => {
          const isThis = chat.id === msg.sender_id || chat.id === msg.recipient_id;
          if (!isThis) return chat;
          return {
            ...chat,
            last_message_content:   msg.content,
            last_message_timestamp: msg.timestamp,
            unread_count:
              msg.isIncoming && !isActiveCv
                ? chat.unread_count + 1
                : chat.unread_count,
          };
        })
      );
    };

    window.addEventListener('CHAT_UPDATED', handleChatUpdate);
    return () => window.removeEventListener('CHAT_UPDATED', handleChatUpdate);
  }, []);

  /* ------------------------------------------------
     3. Détection responsive
     ------------------------------------------------ */
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobileView(mobile);
      if (!mobile) setIsChatOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /* ------------------------------------------------
     4. Sélection d'un destinataire
     ------------------------------------------------ */
  const handleSelectRecipient = async (recipient) => {
    setActiveRecipient(recipient);
    activeRecipientRef.current = recipient;

    if (isMobileView) setIsChatOpen(true);

    // Réinitialise les compteurs locaux immédiatement
    setRecentChats(prev =>
      prev.map(chat =>
        chat.id === recipient.id || chat.user?.id === recipient.id
          ? { ...chat, unread_count: 0 }
          : chat
      )
    );

    try {
      await Promise.all([
        markMessagesAsReadApi(recipient.id),
        refreshUnreadCount(),
      ]);
    } catch (err) {
      console.error('Erreur arrière-plan:', err);
    }
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    setActiveRecipient(null);
    activeRecipientRef.current = null;
  };

  /* ------------------------------------------------
     5. Recherche d'utilisateurs
     ------------------------------------------------ */
  const handleToggleSearch = () => {
    if (isSearchOpen) {
      // Fermeture : reset recherche
      setIsSearchOpen(false);
      setSearchQuery('');
      setSearchResults([]);
    } else {
      setIsSearchOpen(true);
    }
  };

  const handleSearch = async (value) => {
    setSearchQuery(value);
    if (value.length > 2) {
      try {
        const result = await searchPosts(value);
        setSearchResults(result?.users_list?.users || []);
      } catch {
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  /* ------------------------------------------------
     Helpers
     ------------------------------------------------ */
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Intl.DateTimeFormat('fr-FR', {
      hour:   'numeric',
      minute: 'numeric',
    }).format(new Date(timestamp));
  };

  /* ------------------------------------------------
     Render
     ------------------------------------------------ */
  return (
    <div className="chat-container">

      {/* ══════════════════════════════════════════
          SIDEBAR
          ══════════════════════════════════════════ */}
      <div className={`side-bar ${isMobileView && isChatOpen ? 'hidden' : ''}`}>

        {/* ── En-tête ── */}
        <div className="page-name">
          <div onClick={() => navigate('/')} style={{ cursor: 'pointer', flexShrink: 0 }}>
            <Logo size={38} />
          </div>
          <h1>Inbox</h1>

          <div className="header-actions-right">
            {/* Loupe — toggle barre de recherche */}
            <button
              className={`action-icon-btn ${isSearchOpen ? 'active' : ''}`}
              onClick={handleToggleSearch}
              title={isSearchOpen ? 'Fermer la recherche' : 'Rechercher'}
            >
              {isSearchOpen ? <FiX /> : <FiSearch />}
            </button>

            {/* Nouveau message */}
            <button
              className="action-icon-btn"
              onClick={() => { setIsSearchOpen(true); }}
              title="Nouveau message"
            >
              <FiEdit />
            </button>
          </div>
        </div>

        {/* ── Barre de recherche — slide animé ── */}
        <div className={`search-slide-wrapper ${isSearchOpen ? 'open' : ''}`}>
          <div className="search-slide-inner">
            <SearchFilters
              onSearch={handleSearch}
              chat={true}
              autoFocus={isSearchOpen}
            />
          </div>
        </div>

        {/* ── Utilisateurs actifs (stories) — desktop uniquement via CSS ── */}
        <div className="active-users-bar">
          {DEMO_ACTIVE_USERS.map((u, i) => (
            <div
              key={i}
              className="active-user-item-mock"
              title={u.label}
            >
              <div className="avatar-wrapper-online">
                <div
                  className="mock-avatar"
                  style={{ backgroundColor: u.bg }}
                >
                  {u.emoji}
                </div>
                <span className="online-indicator" />
              </div>
              <span>{u.label}</span>
            </div>
          ))}
        </div>

        {/* ── Titre de section dynamique ── */}
        <div className="sidebar-section-title">
          <span>{isSearchOpen ? 'Rechercher un profil' : 'Messages récents'}</span>
          {isSearchOpen && (
            <span className="close-new-view-btn" onClick={handleToggleSearch}>
              Annuler
            </span>
          )}
        </div>

        {/* ── Liste des contacts ── */}
        <div className="contacts-list">

          {/* Vue : résultats de recherche */}
          {isSearchOpen ? (
            <div>
              {searchResults.length > 0 ? (
                searchResults.map(u => (
                  <div
                    key={u.id}
                    onClick={() => {
                      handleSelectRecipient(u);
                      handleToggleSearch();
                    }}
                    className="contact-list-item search-result-item"
                  >
                    <Avatar user={u} />
                    <span className="search-result-name">{u.profil_name}</span>
                  </div>
                ))
              ) : (
                searchQuery.length > 2 && (
                  <p className="empty-text">Aucun utilisateur trouvé</p>
                )
              )}
            </div>

          ) : loadingRecentChats ? (
            /* Skeleton de chargement */
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="contact-list-item chat-skeleton-card">
                <div className="chat-skeleton-avatar chat-skeleton-blink" />
                <div className="contact-info">
                  <div className="contact-header">
                    <div className="chat-skeleton-name chat-skeleton-blink" />
                    <div className="chat-skeleton-time chat-skeleton-blink" />
                  </div>
                  <div className="content-u" style={{ marginTop: '7px' }}>
                    <div className="chat-skeleton-preview chat-skeleton-blink" />
                  </div>
                </div>
              </div>
            ))

          ) : recentChats.length > 0 ? (
            /* Conversations récentes */
            recentChats.map(u => (
              <div
                key={u.user?.id}
                onClick={() => handleSelectRecipient(u.user)}
                className={[
                  'contact-list-item',
                  activeRecipient?.id === u.user?.id ? 'active'  : '',
                  u.unread_count > 0                 ? 'unread'  : '',
                ].join(' ')}
              >
                <Avatar user={u.user} size="smlarge" />
                <div className="contact-info">
                  <div className="contact-header">
                    <span className="contact-name">{u.user?.profil_name}</span>
                    <span className="contact-time">
                      {formatTime(u.last_message_timestamp)}
                    </span>
                  </div>
                  <div className="content-u">
                    <p className="contact-preview">
                      {u.last_message_content || 'Aucun message'}
                    </p>
                    {u.unread_count > 0 && (
                      <span className="unread-msg-badge">{u.unread_count}</span>
                    )}
                  </div>
                </div>
              </div>
            ))

          ) : (
            <p className="empty-text">Aucune conversation récente</p>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          ZONE DE CHAT
          ══════════════════════════════════════════ */}
      <div
        className={[
          'chat-zone',
          isMobileView && isChatOpen ? 'active' : '',
        ].join(' ')}
      >
        {activeRecipient ? (
          <ChatBox
            recipient={activeRecipient}
            onClose={handleCloseChat}
            isMobile={isMobileView}
          />
        ) : (
          <div className="chat-zone-empty">
            <span className="empty-icon">💬</span>
            <h3>Sélectionnez une conversation</h3>
            <p>Parcourez vos messages récents ou lancez une recherche pour chatter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;