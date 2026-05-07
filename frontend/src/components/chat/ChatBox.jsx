import React, { useEffect, useState, useRef } from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import Avatar from '../ui/Avatar';
import { FiArrowLeft } from 'react-icons/fi';
import "../../styles/Chat.css";
import { getChatHistory } from '../../services/chatApi';
import EmojiPicker from 'emoji-picker-react';

const ChatBox = ({ recipient, onClose, isMobile }) => {
    const { unreadChatsCount, messages, sendMessage, user } = useWebSocket();
    const [text, setText] = useState("");
    const [localHistory, setLocalHistory] = useState([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        const loadHistory = async () => {
            setLocalHistory([]);
            try {
                const res = await getChatHistory(recipient.id);
                setLocalHistory(res);
            } catch (error) {
                console.log(error);
            }
        };
        loadHistory();
        setShowEmojiPicker(false);
    }, [recipient.id]);

    const liveMessages = messages[recipient.id] || [];
    const conversation = [
    ...localHistory, 
    ...liveMessages.filter(liveMsg => 
        !localHistory.some(histMsg => histMsg.id === liveMsg.id)
    )
];

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
            {isMobile && (
                    <div className='chat-box-header-m'>
                        <button className='chat-close-btn' onClick={onClose}>
                            <FiArrowLeft /> Retour
                        </button>
                        <span>{recipient.profil_name}</span>
                    </div>
            )}

            <div className='chat-list'>
                {conversation.map((msg, i) => {
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
                })}
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
