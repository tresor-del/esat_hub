import React, { useEffect, useState, useRef } from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import Avatar from '../ui/Avatar';
import { FiArrowLeft } from 'react-icons/fi';
import "../../styles/Chat.css";
import { getChatHistory, markMessagesAsReadApi } from '../../services/chatApi';
import EmojiPicker from 'emoji-picker-react';
import { useNavigate } from 'react-router-dom';

const ChatBox = ({ recipient, onClose, isMobile }) => {
    const { unreadChatsCount, messages, sendMessage, user } = useWebSocket();
    const [text, setText] = useState("");
    const [localHistory, setLocalHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const navigate = useNavigate();

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        const loadHistory = async () => {
            setLocalHistory([]);
            setLoadingHistory(true);
            try {
                const res = await getChatHistory(recipient.id);
                setLocalHistory(res);
            } catch (error) {
                console.log(error);
            } finally {
                setLoadingHistory(false);  // ← fin
            }
        };
        loadHistory();
        setShowEmojiPicker(false);
    }, [recipient.id]);

    const liveMessages = messages[recipient.id] || [];

    // On prend le timestamp du dernier message de l'historique
    const lastHistoryTimestamp = localHistory.length > 0
        ? new Date(localHistory[localHistory.length - 1].timestamp)
        : new Date(0);

    // On garde seulement les liveMessages plus récents que l'historique
    const conversation = [
        ...localHistory,
        ...liveMessages.filter(liveMsg =>
            new Date(liveMsg.timestamp) > lastHistoryTimestamp
        )
    ];

    useEffect(() => {
        const liveMessages = messages[recipient.id] || [];
        if (liveMessages.length > 0) {
            // On a des messages en temps réel, on les marque comme lus
            markMessagesAsReadApi(recipient.id).catch(console.error);
        }
    }, [messages[recipient.id]?.length]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [conversation.length]);

    // --- FONCTIONS DE FORMATAGE ---
    const formatChatTimestamp = (timestamp) => {
        return new Intl.DateTimeFormat('fr-FR', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: false
        }).format(new Date(timestamp));
    };

    const getRelativeDateLabel = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        const oneWeekAgo = new Date(startOfToday);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 6);

        if (date >= startOfToday) return "Aujourd'hui";
        if (date >= startOfYesterday) return "Hier";
        if (date >= oneWeekAgo) {
            return new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(date);
        }
        return new Intl.DateTimeFormat('fr-FR').format(date);
    };
    // ------------------------------

    const handleSend = (e) => {
        e.preventDefault();
        if (text.trim()) {
            sendMessage(recipient.id, text);
            setText("");
            setShowEmojiPicker(false);
        }
    };

    const onEmojiClick = (emojiData) => {
        const input = inputRef.current;
        if (!input) return;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const newText = text.substring(0, start) + emojiData.emoji + text.substring(end);
        setText(newText);
        setTimeout(() => {
            input.focus();
            input.setSelectionRange(start + emojiData.emoji.length, start + emojiData.emoji.length);
        }, 10);
    };

    // Variable pour suivre la date du message précédent lors du rendu
    let lastDateLabel = null;

    return (
        <div className='chat-box-container'>
                <div className='chat-box-header-m'>
                    <button className='chat-close-btn' onClick={onClose}>
                        <FiArrowLeft />
                    </button>
                    <div className="a" onClick={() => navigate(`/profile/${recipient.id}`)}>

                    <Avatar user={recipient} />
                    <span>{recipient.profil_name}</span>
                    </div>
                </div>

            <div className='chat-list'>

                {loadingHistory ? (
                    <div style={{ margin: 'auto', textAlign: 'center', color: '#888' }}>
                        <div className="spinner"></div>
                    </div>
                ) : (
                    conversation.map((msg, i) => {
                        const currentDateLabel = getRelativeDateLabel(msg.timestamp);
                        const showDateBadge = currentDateLabel !== lastDateLabel;
                        lastDateLabel = currentDateLabel;

                        return (
                            <React.Fragment key={i}>
                                {showDateBadge && (
                                    <div className="chat-date-separator">
                                        <span>{currentDateLabel}</span>
                                    </div>
                                )}
                                <div className={`chat-message-wrapper ${msg.sender_id === recipient.id ? 'incoming' : 'outgoing'}`}>
                                    <div className="chat-message-bubble">
                                        {msg.content}
                                        <div className="chat-message-time">
                                            {formatChatTimestamp(msg.timestamp)}
                                        </div>
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="chat-form" style={{ position: 'relative' }}>
                {showEmojiPicker && (
                    <div style={{ position: 'absolute', bottom: '70px', left: '15px', zIndex: 1000 }}>
                        <EmojiPicker onEmojiClick={onEmojiClick} />
                    </div>
                )}
                <button
                    type="button"
                    className="emoji-btn"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                    😊
                </button>
                <input
                    ref={inputRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Écrivez votre message..."
                    className="chat-input"
                />
                <button type="submit" className="chat-submit-btn">Envoyer</button>
            </form>
        </div>
    );
};

export default ChatBox;
