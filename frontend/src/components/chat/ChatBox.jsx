import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import Avatar from '../ui/Avatar';
import {
  FiArrowLeft,
  FiPhone,
  FiVideo,
  FiInfo,
  FiSend,
  FiMic,
  FiImage,
  FiSmile,
  FiThumbsUp,
  FiChevronDown,
  FiUser,
  FiBellOff,
  FiSearch,
  FiFileText,
  FiLock,
  FiAlertCircle,
} from 'react-icons/fi';
import EmojiPicker from 'emoji-picker-react';
import { useNavigate } from 'react-router-dom';
import { getChatHistory, markMessagesAsReadApi } from '../../services/chatApi';
import "../../styles/Chat.css";

/* ─────────────────────────────────────────────────────────
   Panneau d'informations du contact (colonne droite, desktop)
   ───────────────────────────────────────────────────────── */
const InfoPanel = ({ recipient, navigate }) => {
  const [sections, setSections] = useState({
    info:      false,
    customize: false,
    media:     true,   // Ouvert par défaut
    privacy:   false,
  });

  const toggle = (key) =>
    setSections(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="chat-info-panel">
      {/* ── Profil ── */}
      <div className="info-panel-profile">
        <Avatar user={recipient} size="large" openModal={false} />
        <p className="info-panel-name">{recipient.profil_name}</p>
        <p className="info-panel-status">Actif(ve) récemment</p>
        <div className="info-panel-encrypted">
          <FiLock size={12} />
          <span>Chiffré de bout en bout</span>
        </div>
      </div>

      {/* ── Actions rapides ── */}
      <div className="info-panel-actions">
        <button
          className="info-action-btn"
          onClick={() => navigate(`/profile/${recipient.id}`)}
        >
          <span className="info-action-icon"><FiUser /></span>
          <span>Profil</span>
        </button>

        <button className="info-action-btn">
          <span className="info-action-icon"><FiBellOff /></span>
          <span>Sourdine</span>
        </button>

        <button className="info-action-btn">
          <span className="info-action-icon"><FiSearch /></span>
          <span>Rechercher</span>
        </button>
      </div>

      {/* ── Section : Infos de la discussion ── */}
      <div className="info-section">
        <div className="info-section-header" onClick={() => toggle('info')}>
          <span className="info-section-title">Informations sur la discussion</span>
          <FiChevronDown
            className={`info-section-chevron ${sections.info ? 'open' : ''}`}
          />
        </div>
        <div className={`info-section-body ${sections.info ? 'open' : ''}`}>
          <div className="info-section-item">
            <FiUser />
            <span>Voir le profil</span>
          </div>
        </div>
      </div>

      {/* ── Section : Personnaliser ── */}
      <div className="info-section">
        <div className="info-section-header" onClick={() => toggle('customize')}>
          <span className="info-section-title">Personnaliser la discussion</span>
          <FiChevronDown
            className={`info-section-chevron ${sections.customize ? 'open' : ''}`}
          />
        </div>
        <div className={`info-section-body ${sections.customize ? 'open' : ''}`}>
          <div className="info-section-item">
            <FiSmile />
            <span>Changer l'emoji</span>
          </div>
        </div>
      </div>

      {/* ── Section : Fichiers et médias (ouverte par défaut) ── */}
      <div className="info-section">
        <div className="info-section-header" onClick={() => toggle('media')}>
          <span className="info-section-title">Fichiers et contenus multimédias</span>
          <FiChevronDown
            className={`info-section-chevron ${sections.media ? 'open' : ''}`}
          />
        </div>
        <div className={`info-section-body ${sections.media ? 'open' : ''}`}>
          <div className="info-section-item">
            <FiImage />
            <span>Contenu multimédia</span>
          </div>
          <div className="info-section-item">
            <FiFileText />
            <span>Fichiers</span>
          </div>
        </div>
      </div>

      {/* ── Section : Confidentialité ── */}
      <div className="info-section">
        <div className="info-section-header" onClick={() => toggle('privacy')}>
          <span className="info-section-title">Confidentialité et assistance</span>
          <FiChevronDown
            className={`info-section-chevron ${sections.privacy ? 'open' : ''}`}
          />
        </div>
        <div className={`info-section-body ${sections.privacy ? 'open' : ''}`}>
          <div className="info-section-item">
            <FiAlertCircle />
            <span>Signaler</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   Composant principal ChatBox
   ───────────────────────────────────────────────────────── */
const ChatBox = ({ recipient, onClose, isMobile }) => {
  const { messages, sendMessage } = useWebSocket();

  const [text, setText]                     = useState('');
  const [localHistory, setLocalHistory]     = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const navigate       = useNavigate();

  const isTyping = text.trim().length > 0;

  /* ────────────────────────────────────────
     1. Chargement de l'historique
     ──────────────────────────────────────── */
  useEffect(() => {
    const load = async () => {
      setLocalHistory([]);
      setLoadingHistory(true);
      try {
        const res = await getChatHistory(recipient.id);
        setLocalHistory(res || []);
      } catch (err) {
        console.error('Erreur historique:', err);
      } finally {
        setLoadingHistory(false);
      }
    };
    load();
    setShowEmojiPicker(false);
    setText('');
  }, [recipient.id]);

  /* ────────────────────────────────────────
     2. Fusion historique + messages live
     ──────────────────────────────────────── */
  const liveMessages = messages[recipient.id] || [];

  const lastHistoryTs =
    localHistory.length > 0
      ? new Date(localHistory[localHistory.length - 1].timestamp)
      : new Date(0);

  const conversation = [
    ...localHistory,
    ...liveMessages.filter(m => new Date(m.timestamp) > lastHistoryTs),
  ];

  /* ────────────────────────────────────────
     3. Marquer comme lu
     ──────────────────────────────────────── */
  useEffect(() => {
    if (liveMessages.length > 0) {
      markMessagesAsReadApi(recipient.id).catch(console.error);
    }
  }, [liveMessages.length, recipient.id]);

  /* ────────────────────────────────────────
     4. Scroll automatique
     ──────────────────────────────────────── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.length]);

  /* ────────────────────────────────────────
     Fermer emoji picker au clic extérieur
     ──────────────────────────────────────── */
  useEffect(() => {
    if (!showEmojiPicker) return;
    const handle = (e) => {
      if (!e.target.closest('.emoji-picker-popover') && !e.target.closest('.emoji-btn')) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [showEmojiPicker]);

  /* ────────────────────────────────────────
     Formatage dates
     ──────────────────────────────────────── */
  const formatChatTimestamp = (ts) =>
    new Intl.DateTimeFormat('fr-FR', { hour: 'numeric', minute: 'numeric', hour12: false })
      .format(new Date(ts));

  const getRelativeDateLabel = (ts) => {
    const date             = new Date(ts);
    const now              = new Date();
    const startOfToday     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const oneWeekAgo = new Date(startOfToday);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 6);

    if (date >= startOfToday)     return "Aujourd'hui";
    if (date >= startOfYesterday) return 'Hier';
    if (date >= oneWeekAgo)
      return new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(date);
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(date);
  };

  /* ────────────────────────────────────────
     Envoi de message
     ──────────────────────────────────────── */
  const handleSend = (e) => {
    e.preventDefault();
    if (!isTyping) return;
    sendMessage(recipient.id, text);
    setText('');
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const onEmojiClick = (emojiData) => {
    const input = inputRef.current;
    if (!input) return;
    const start   = input.selectionStart;
    const end     = input.selectionEnd;
    const newText = text.slice(0, start) + emojiData.emoji + text.slice(end);
    setText(newText);
    setTimeout(() => {
      const pos = start + emojiData.emoji.length;
      input.focus();
      input.setSelectionRange(pos, pos);
    }, 10);
  };

  /* ────────────────────────────────────────
     Construction des groupes de messages
     (messages consécutifs du même expéditeur)
     ──────────────────────────────────────── */
  const buildGroups = (msgs) => {
    const groups = [];
    let current  = null;

    msgs.forEach((msg, i) => {
      const isIncoming = msg.sender_id === recipient.id;
      const dateLabel  = getRelativeDateLabel(msg.timestamp);

      if (!current || current.isIncoming !== isIncoming || current.dateLabel !== dateLabel) {
        if (current) groups.push(current);
        current = { isIncoming, dateLabel, msgs: [] };
      }
      current.msgs.push(msg);
    });

    if (current) groups.push(current);
    return groups;
  };

  const groups = buildGroups(conversation);

  /* ─────────────────────────────────────── */
  return (
    /* Conteneur externe = chat + panneau info */
    <div className="chat-box-outer">

      {/* ══════════════════════════════════
          CHAT PRINCIPAL
          ══════════════════════════════════ */}
      <div className="chat-box-container">

        {/* ── Topbar ── */}
        <div className="chat-box-header-m">
          {/* Retour (mobile uniquement via CSS) */}
          <button className="chat-close-btn" onClick={onClose} title="Retour">
            <FiArrowLeft />
          </button>

          {/* Identité */}
          <div
            className="chat-header-identity"
            onClick={() => navigate(`/profile/${recipient.id}`)}
          >
            <Avatar user={recipient} size="medium" openModal={false} />
            <div className="chat-header-name-group">
              <span className="chat-header-name">{recipient.profil_name}</span>
              <span className="chat-header-status">Actif(ve) récemment</span>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="chat-header-actions">
            {/* Téléphone et vidéo — masqués sur mobile via CSS */}
            <button className="chat-header-action-btn" title="Appel vocal" type="button">
              <FiPhone />
            </button>
            <button className="chat-header-action-btn" title="Appel vidéo" type="button">
              <FiVideo />
            </button>
            {/* Info — toujours visible, ouvre/ferme le panneau sur mobile */}
            <button
              className="chat-header-action-btn"
              title="Informations"
              type="button"
              onClick={() => navigate(`/profile/${recipient.id}`)}
            >
              <FiInfo />
            </button>
          </div>
        </div>

        {/* ── Fil des messages ── */}
        <div className="chat-list">
          {loadingHistory ? (
            <div className="spinner" />
          ) : (
            (() => {
              let lastDate = null;
              return groups.map((group, gi) => {
                const showDate = group.dateLabel !== lastDate;
                lastDate = group.dateLabel;

                return (
                  <React.Fragment key={gi}>
                    {/* Séparateur de date */}
                    {showDate && (
                      <div className="chat-date-separator">
                        <span>{group.dateLabel}</span>
                      </div>
                    )}

                    {/* Groupe de messages */}
                    <div className={`msg-group ${group.isIncoming ? 'incoming' : 'outgoing'}`}>
                      {group.msgs.map((msg, mi) => {
                        const isLast    = mi === group.msgs.length - 1;
                        const showAvatar = group.isIncoming && isLast;
                        const showTime   = isLast;

                        return (
                          <React.Fragment key={msg.id || `${gi}-${mi}`}>
                            <div className="msg-row">
                              {/* Avatar (entrants uniquement, dernier msg du groupe) */}
                              {group.isIncoming ? (
                                showAvatar ? (
                                  <div className="msg-avatar-slot">
                                    <Avatar
                                      user={recipient}
                                      size="small"
                                      openModal={false}
                                    />
                                  </div>
                                ) : (
                                  <div className="msg-avatar-ghost" />
                                )
                              ) : null}

                              {/* Bulle */}
                              <div
                                className="chat-message-bubble"
                                title={formatChatTimestamp(msg.timestamp)}
                              >
                                {msg.content}
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })}

                      {/* Heure affichée sous le groupe */}
                      <div className="msg-group-time">
                        {formatChatTimestamp(group.msgs[group.msgs.length - 1].timestamp)}
                      </div>
                    </div>
                  </React.Fragment>
                );
              });
            })()
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Barre de saisie ── */}
        <form onSubmit={handleSend} className="chat-form">
          {/* Emoji picker flottant */}
          {showEmojiPicker && (
            <div className="emoji-picker-popover">
              <EmojiPicker
                onEmojiClick={onEmojiClick}
                width={isMobile ? '100%' : 320}
                height={350}
              />
            </div>
          )}

          {/* ── Icônes gauche (mobile = plus d'icônes) ── */}
          <div className="chat-form-left-actions">
            {/* Micro — mobile only via classe */}
            <button type="button" className="form-action-btn mobile-only" title="Message vocal">
              <FiMic />
            </button>
            {/* Image — mobile only */}
            <button type="button" className="form-action-btn mobile-only" title="Envoyer une image">
              <FiImage />
            </button>
            {/* Emoji — desktop et mobile */}
            <button
              type="button"
              className="emoji-btn"
              onClick={() => setShowEmojiPicker(v => !v)}
              title="Emojis"
            >
              😊
            </button>
          </div>

          {/* ── Champ de saisie ── */}
          <div className="chat-input-wrapper">
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Aa"
              className="chat-input"
              autoComplete="off"
            />
          </div>

          {/* ── Bouton envoyer ou pouce ── */}
          {isTyping ? (
            /* Flèche d'envoi bleue */
            <button
              type="submit"
              className="chat-submit-btn"
              title="Envoyer"
            >
              <FiSend />
            </button>
          ) : (
            /* Pouce (like) quand rien n'est écrit */
            <button
              type="button"
              className="chat-submit-btn"
              title="J'aime"
              onClick={() => sendMessage(recipient.id, '👍')}
            >
              <FiThumbsUp />
            </button>
          )}
        </form>
      </div>

      {/* ══════════════════════════════════
          PANNEAU D'INFO (desktop uniquement)
          Masqué sur mobile via CSS
          ══════════════════════════════════ */}
      <InfoPanel recipient={recipient} navigate={navigate} />
    </div>
  );
};

export default ChatBox;