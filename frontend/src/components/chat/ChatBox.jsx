import React, { useEffect, useState, useRef } from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import Avatar from '../ui/Avatar';
import {
  FiArrowLeft,
  FiPhone,
  FiVideo,
  FiInfo,
  FiSend,
  FiMic,
} from 'react-icons/fi';
import "../../styles/Chat.css";
import { getChatHistory, markMessagesAsReadApi } from '../../services/chatApi';
import EmojiPicker from 'emoji-picker-react';
import { useNavigate } from 'react-router-dom';

const ChatBox = ({ recipient, onClose, isMobile }) => {
  const { messages, sendMessage } = useWebSocket();

  const [text, setText]                   = useState('');
  const [localHistory, setLocalHistory]   = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const navigate       = useNavigate();

  /* ------------------------------------------------
     Booléen : l'utilisateur est-il en train de taper ?
     ------------------------------------------------ */
  const isTyping = text.trim().length > 0;

  /* ------------------------------------------------
     1. Chargement de l'historique à chaque destinataire
     ------------------------------------------------ */
  useEffect(() => {
    const loadHistory = async () => {
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
    loadHistory();
    setShowEmojiPicker(false);
    setText('');
  }, [recipient.id]);

  /* ------------------------------------------------
     2. Fusion historique + messages WebSocket live
     ------------------------------------------------ */
  const liveMessages = messages[recipient.id] || [];

  const lastHistoryTs =
    localHistory.length > 0
      ? new Date(localHistory[localHistory.length - 1].timestamp)
      : new Date(0);

  const conversation = [
    ...localHistory,
    ...liveMessages.filter(m => new Date(m.timestamp) > lastHistoryTs),
  ];

  /* ------------------------------------------------
     3. Marquer les nouveaux messages entrants comme lus
     ------------------------------------------------ */
  useEffect(() => {
    if (liveMessages.length > 0) {
      markMessagesAsReadApi(recipient.id).catch(console.error);
    }
  }, [liveMessages.length, recipient.id]);

  /* ------------------------------------------------
     4. Scroll automatique vers le bas
     ------------------------------------------------ */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.length]);

  /* ------------------------------------------------
     Fermer l'emoji picker quand on clique ailleurs
     ------------------------------------------------ */
  useEffect(() => {
    if (!showEmojiPicker) return;
    const handleOutside = (e) => {
      if (!e.target.closest('.emoji-picker-popover') && !e.target.closest('.emoji-btn')) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showEmojiPicker]);

  /* ------------------------------------------------
     Formatage des dates et heures
     ------------------------------------------------ */
  const formatChatTimestamp = (timestamp) =>
    new Intl.DateTimeFormat('fr-FR', {
      hour:   'numeric',
      minute: 'numeric',
      hour12: false,
    }).format(new Date(timestamp));

  const getRelativeDateLabel = (timestamp) => {
    const date             = new Date(timestamp);
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
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric', month: 'long',
    }).format(date);
  };

  /* ------------------------------------------------
     Envoi d'un message
     ------------------------------------------------ */
  const handleSend = (e) => {
    e.preventDefault();
    if (!isTyping) return;
    sendMessage(recipient.id, text);
    setText('');
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  /* ------------------------------------------------
     Gestion des touches (Entrée = envoyer, Shift+Entrée = saut de ligne)
     ------------------------------------------------ */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  /* ------------------------------------------------
     Insertion d'emoji dans le champ
     ------------------------------------------------ */
  const onEmojiClick = (emojiData) => {
    const input = inputRef.current;
    if (!input) return;
    const start   = input.selectionStart;
    const end     = input.selectionEnd;
    const newText = text.substring(0, start) + emojiData.emoji + text.substring(end);
    setText(newText);

    setTimeout(() => {
      input.focus();
      const pos = start + emojiData.emoji.length;
      input.setSelectionRange(pos, pos);
    }, 10);
  };

  /* ------------------------------------------------
     Variable pour les séparateurs de date
     ------------------------------------------------ */
  let lastDateLabel = null;

  /* ─────────────────────────────────────────────── */
  return (
    <div className="chat-box-container">

      {/* ══════════════════════
          TOPBAR
          ══════════════════════ */}
      <div className="chat-box-header-m">

        {/* Bouton retour — visible sur mobile (masqué en CSS desktop) */}
        <button className="chat-close-btn" onClick={onClose} title="Retour">
          <FiArrowLeft />
        </button>

        {/* Identité du correspondant */}
        <div
          className="chat-header-identity"
          onClick={() => navigate(`/profile/${recipient.id}`)}
        >
          <Avatar user={recipient} />
          <div className="chat-header-name-group">
            <span className="chat-header-name">{recipient.profil_name}</span>
            <span className="chat-header-status">En ligne</span>
          </div>
        </div>

        {/* Actions à droite */}
        <div className="chat-header-actions">
          {/* Appel vocal — masqué sur mobile via .desktop-only */}
          <button
            className="chat-header-action-btn desktop-only"
            title="Appel vocal"
            type="button"
          >
            <FiPhone />
          </button>

          {/* Appel vidéo — masqué sur mobile */}
          <button
            className="chat-header-action-btn desktop-only"
            title="Appel vidéo"
            type="button"
          >
            <FiVideo />
          </button>

          {/* Infos — visible partout */}
          <button
            className="chat-header-action-btn"
            title="Infos du contact"
            type="button"
            onClick={() => navigate(`/profile/${recipient.id}`)}
          >
            <FiInfo />
          </button>
        </div>
      </div>

      {/* ══════════════════════
          FIL DES MESSAGES
          ══════════════════════ */}
      <div className="chat-list">
        {loadingHistory ? (
          <div className="spinner" style={{ marginTop: '40px' }} />
        ) : (
          conversation.map((msg, i) => {
            const dateLabel  = getRelativeDateLabel(msg.timestamp);
            const showBadge  = dateLabel !== lastDateLabel;
            lastDateLabel    = dateLabel;

            return (
              <React.Fragment key={msg.id || i}>
                {/* Séparateur de date */}
                {showBadge && (
                  <div className="chat-date-separator">
                    <span>{dateLabel}</span>
                  </div>
                )}

                {/* Bulle de message */}
                <div
                  className={`chat-message-wrapper ${
                    msg.sender_id === recipient.id ? 'incoming' : 'outgoing'
                  }`}
                >
                  <div className="chat-message-bubble">
                    <span className="chat-message-text">{msg.content}</span>
                    <div className="chat-message-meta">
                      <span className="chat-message-time">
                        {formatChatTimestamp(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}

        {/* Ancre de scroll */}
        <div ref={messagesEndRef} />
      </div>

      {/* ══════════════════════
          BARRE DE SAISIE
          ══════════════════════ */}
      <form onSubmit={handleSend} className="chat-form">

        {/* Panneau emoji flottant */}
        {showEmojiPicker && (
          <div className="emoji-picker-popover">
            <EmojiPicker
              onEmojiClick={onEmojiClick}
              width={isMobile ? '100%' : 320}
              height={350}
              searchDisabled={false}
              skinTonesDisabled={false}
            />
          </div>
        )}

        {/* Bouton emoji */}
        <button
          type="button"
          className="emoji-btn"
          onClick={() => setShowEmojiPicker(v => !v)}
          title="Émojis"
        >
          😊
        </button>

        {/* Champ de saisie */}
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Écrivez un message..."
          className="chat-input"
          autoComplete="off"
        />

        {/* Bouton Envoyer / Micro
            - Mic  : texte vide → icône micro grisée (non cliquable)
            - Send : texte présent → cercle vert avec flèche, cliquable
        */}
        <button
          type="submit"
          className={`chat-submit-btn ${isTyping ? 'typing' : ''}`}
          disabled={!isTyping}
          title={isTyping ? 'Envoyer' : 'Micro'}
        >
          {isTyping ? <FiSend /> : <FiMic />}
        </button>
      </form>
    </div>
  );
};

export default ChatBox;