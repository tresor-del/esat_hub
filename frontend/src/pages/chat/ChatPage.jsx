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

/* ─────────────────────────────────────────────────────────
   Onglets de filtrage (style Messenger)
   ───────────────────────────────────────────────────────── */
const FILTER_TABS = [
  { key: 'all',    label: 'Tout' },
  { key: 'unread', label: 'Non lu' },
  { key: 'groups', label: 'Groupes' },
];

const ChatPage = () => {
  const { refreshUnreadCount } = useWebSocket();

  /* ── Conversation active ── */
  const [activeRecipient, setActiveRecipient]   = useState(null);
  const activeRecipientRef                       = useRef(null);

  /* ── Conversations récentes ── */
  const [recentChats, setRecentChats]           = useState([]);
  const [loadingRecentChats, setLoadingRecentChats] = useState(true);

  /* ── Recherche ── */
  const [isSearchOpen, setIsSearchOpen]         = useState(false);
  const [searchQuery, setSearchQuery]           = useState('');
  const [searchResults, setSearchResults]       = useState([]);

  /* ── Onglet actif ── */
  const [activeTab, setActiveTab]               = useState('all');

  /* ── Responsive ── */
  const [isMobileView, setIsMobileView]         = useState(window.innerWidth <= 768);
  const [isChatOpen, setIsChatOpen]             = useState(false);

  const navigate = useNavigate();

  /* ────────────────────────────────────────────
     1. Chargement des conversations récentes
     ──────────────────────────────────────────── */
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

  /* ────────────────────────────────────────────
     2. Mise à jour en temps réel (WebSocket)
     ──────────────────────────────────────────── */
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

  /* ────────────────────────────────────────────
     3. Détection responsive
     ──────────────────────────────────────────── */
  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobileView(mobile);
      if (!mobile) setIsChatOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* ────────────────────────────────────────────
     4. Sélection d'un destinataire
     ──────────────────────────────────────────── */
  const handleSelectRecipient = async (recipient) => {
    setActiveRecipient(recipient);
    activeRecipientRef.current = recipient;
    if (isMobileView) setIsChatOpen(true);

    // Reset compteur non-lus localement
    setRecentChats(prev =>
      prev.map(chat =>
        chat.id === recipient.id || chat.user?.id === recipient.id
          ? { ...chat, unread_count: 0 }
          : chat
      )
    );

    // API en arrière-plan
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

  /* ────────────────────────────────────────────
     5. Recherche
     ──────────────────────────────────────────── */
  const handleToggleSearch = () => {
    if (isSearchOpen) {
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

  /* ────────────────────────────────────────────
     Filtre local des conversations selon l'onglet
     ──────────────────────────────────────────── */
  const filteredChats = recentChats.filter(u => {
    if (activeTab === 'unread') return u.unread_count > 0;
    // 'groups' non disponible en l'état — on affiche tout
    return true;
  });

  /* ────────────────────────────────────────────
     Helper : formatage de l'heure
     ──────────────────────────────────────────── */
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now  = new Date();
    const diffDays = Math.floor((now - date) / 86400000);

    if (diffDays === 0) {
      return new Intl.DateTimeFormat('fr-FR', { hour: 'numeric', minute: 'numeric' }).format(date);
    }
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) {
      return new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(date);
    }
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date);
  };

  /* ────────────────────────────────────────────
     Render
     ──────────────────────────────────────────── */
  return (
    <div className="chat-container">

      {/* ══════════════════════════════════════
          SIDEBAR
          ══════════════════════════════════════ */}
      <div className={`side-bar ${isMobileView && isChatOpen ? 'hidden' : ''}`}>

        {/* En-tête */}
        <div className="page-name">
          <div onClick={() => navigate('/')} style={{ cursor: 'pointer', flexShrink: 0 }}>
            <Logo size={36} />
          </div>
          <h1>Discussions</h1>
          <div className="header-actions-right">
            <button
              className={`action-icon-btn ${isSearchOpen ? 'active' : ''}`}
              onClick={handleToggleSearch}
              title={isSearchOpen ? 'Fermer' : 'Rechercher'}
            >
              {isSearchOpen ? <FiX /> : <FiSearch />}
            </button>
            <button
              className="action-icon-btn"
              onClick={() => setIsSearchOpen(true)}
              title="Nouveau message"
            >
              <FiEdit />
            </button>
          </div>
        </div>

        {/* Barre de recherche — slide animé */}
        <div className={`search-slide-wrapper ${isSearchOpen ? 'open' : ''}`}>
          <div className="search-slide-inner">
            <SearchFilters
              onSearch={handleSearch}
              chat={true}
              autoFocus={isSearchOpen}
            />
          </div>
        </div>

        {/* Onglets de filtrage — visibles seulement en mode "recent" */}
        {!isSearchOpen && (
          <div className="chat-filter-tabs">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.key}
                className={`filter-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Titre de section dynamique */}
        {isSearchOpen && (
          <div className="sidebar-section-title">
            <span>Rechercher un profil</span>
            <span className="close-new-view-btn" onClick={handleToggleSearch}>
              Annuler
            </span>
          </div>
        )}

        {/* Liste des contacts */}
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
                    className="contact-list-item"
                  >
                    <div className="contact-avatar-wrapper">
                      <Avatar user={u} size="medium" />
                    </div>
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
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="contact-list-item chat-skeleton-card">
                <div className="chat-skeleton-avatar chat-skeleton-blink" />
                <div className="contact-info">
                  <div className="contact-header">
                    <div className="chat-skeleton-name chat-skeleton-blink" />
                    <div className="chat-skeleton-time chat-skeleton-blink" />
                  </div>
                  <div className="content-u" style={{ marginTop: '6px' }}>
                    <div className="chat-skeleton-preview chat-skeleton-blink" />
                  </div>
                </div>
              </div>
            ))

          ) : filteredChats.length > 0 ? (
            filteredChats.map(u => (
              <div
                key={u.user?.id}
                onClick={() => handleSelectRecipient(u.user)}
                className={[
                  'contact-list-item',
                  activeRecipient?.id === u.user?.id ? 'active'  : '',
                  u.unread_count > 0                 ? 'unread'  : '',
                ].filter(Boolean).join(' ')}
              >
                {/* Avatar avec point vert si en ligne */}
                <div className="contact-avatar-wrapper">
                  <Avatar user={u.user} size="medium" />
                  {/* Afficher le point si tu as un indicateur de présence */}
                  {/* <span className="contact-online-dot" /> */}
                </div>

                <div className="contact-info">
                  <div className="contact-header">
                    <span className="contact-name">{u.user?.profil_name}</span>
                    <span className="contact-time">
                      {formatTime(u.last_message_timestamp)}
                    </span>
                  </div>
                  <div className="content-u">
                    <p className="contact-preview">
                      {u.last_message_content || 'Commencer une discussion'}
                    </p>
                    {u.unread_count > 0 && (
                      <span className="unread-msg-badge">{u.unread_count}</span>
                    )}
                  </div>
                </div>
              </div>
            ))

          ) : (
            <p className="empty-text">
              {activeTab === 'unread'
                ? 'Aucun message non lu'
                : 'Aucune conversation récente'}
            </p>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════
          ZONE DE CHAT
          ══════════════════════════════════════ */}
      <div
        className={[
          'chat-zone',
          isMobileView && isChatOpen ? 'active' : '',
        ].filter(Boolean).join(' ')}
      >
        {activeRecipient ? (
          <ChatBox
            recipient={activeRecipient}
            onClose={handleCloseChat}
            isMobile={isMobileView}
          />
        ) : (
          <div className="chat-zone-empty">
            <div className="empty-icon">💬</div>
            <h3>Vos messages</h3>
            <p>Envoyez des messages privés à vos contacts.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;