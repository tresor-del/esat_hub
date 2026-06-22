import React, { useEffect, useState, useRef } from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import Avatar from '../ui/Avatar';
import { FiArrowLeft, FiSend, FiPaperclip } from 'react-icons/fi';
import "../../styles/Chat/Chat.css";
import { getChatHistory, markMessagesAsReadApi } from '../../services/chatApi';
import EmojiPicker from 'emoji-picker-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { uploadChatFile } from '../../services/chatApi';
import { useSearchParams } from 'react-router-dom';

const ChatBox = ({ recipient, onClose, isMobile, onMessage }) => {
    const { refreshUnreadCount, activeConvRef, unreadChatsCount, messages, sendMessage, user } = useWebSocket();
    const [text, setText] = useState("");
    const [localHistory, setLocalHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const [uploadingFile, setUploadingFile] = useState(false);
    const fileInputRef = useRef(null);

    const { searchParams, setSearchParams } = useSearchParams();

    useEffect(() => {
        activeConvRef.current = recipient.id; // ← on est dans cette conv
        return () => {
            activeConvRef.current = null; // ← on quitte
        };
    }, [recipient.id]);

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validation
        const isImage = file.type.startsWith("image/");
        const isDoc = file.type === "application/pdf";
        if (!isImage && !isDoc) {
            alert("Seules les images et PDFs sont acceptés");
            return;
        }
        // if (file.size > 5 * 1024 * 1024) {
        //     alert("Fichier trop volumineux (max 5MB)");
        //     return;
        // }

        try {
            setUploadingFile(true);
            const formData = new FormData();
            formData.append("file", file);

            const result = await uploadChatFile(formData);
            console.log(result)

            // Envoie via WS avec le media_id
            sendMessage(recipient.id, "", result.media_id);

            onMessage({
                last_message_content: "📎 Fichier",
                last_message_timestamp: new Date().toISOString(),
                unread_count: 0,
                user: recipient,
            });

            const optimisticMsg = {
                sender_id: currentUser.id,
                content: "",
                timestamp: new Date().toISOString(),
                is_read: false,
                media: {
                    id: result.media_id,
                    file_path: result.file_path,
                    file_name: file.name,
                    mime_type: file.type,
                }
            };
            setLocalHistory(prev => [...prev, optimisticMsg]);

        } catch (err) {
            console.error("Erreur upload:", err);
            alert("Erreur lors de l'envoi du fichier");
        } finally {
            setUploadingFile(false);
            e.target.value = ""; // reset input
        }
    };

    useEffect(() => {
        const loadHistory = async () => {
            setLocalHistory([]);
            setLoadingHistory(true);
            try {
                const res = await getChatHistory(recipient.id);
                console.log(res)
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
        if (liveMessages.length === 0) return;

        const lastMsg = liveMessages[liveMessages.length - 1];
        const isIncoming = lastMsg.sender?.id !== currentUser.id;

        const syncRead = async () => {
            try {
                await markMessagesAsReadApi(recipient.id); // marquer lu en DB d'abord
                if (isIncoming) {
                    await refreshUnreadCount(); // puis re-synchroniser le badge global
                }
            } catch (error) {
                console.error("Erreur sync read:", error);
            }
        };

        syncRead();

        // Notifier le parent pour mettre à jour la liste
        onMessage({
            last_message_content: lastMsg.content || "📎 Fichier",
            last_message_timestamp: lastMsg.timestamp,
            last_sender_id: lastMsg.sender?.id,
            unread_count: 0,
            user: recipient,
        });

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
            const data = {
                last_message_content: text,
                last_message_timestamp: new Date().toISOString(),
                last_sender_id: currentUser.id,
                unread_count: 0,
                user: currentUser,
            }
            onMessage(data)
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
                    <span>{recipient.first_name} {recipient.last_name}</span>
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

                        // vérfier si l'auteur du message précédent est le mm que celui du nouveau
                        const prevMsg = conversation[i - 1]
                        const isGrouped = prevMsg && prevMsg.sender_id === msg.sender_id && !showDateBadge;


                        return (
                            <React.Fragment key={i}>
                                {showDateBadge && (
                                    <div className="chat-date-separator">
                                        <span>{currentDateLabel}</span>
                                    </div>
                                )}

                                <div className={`chat-message-wrapper `} >

                                    {/* En-tête : avatar + nom + heure */}
                                    <div className={`chat-message-header ${isGrouped ? "grouped" : ""}`}>
                                        {!isGrouped ? (
                                            msg.sender_id === recipient.id ? (
                                                <Avatar user={recipient} size="default" />
                                            ) : (
                                                <Avatar user={currentUser} size="default" />
                                            )
                                        ) : (
                                            <div className="avatar-placeholder" />
                                        )}

                                        <div className='name'>

                                            <span className="name-h">
                                                {!isGrouped && (
                                                    msg.sender_id === recipient.id
                                                        ? `${recipient.first_name} ${recipient.last_name}`
                                                        : `${currentUser.first_name} ${currentUser.last_name}`
                                                )}

                                            </span>

                                            <div className={`content ${msg.sender_id === currentUser.id ? "outgoing" : "incoming"}`}>
                                                {msg.content && <span>{msg.content}</span>}

                                                {msg.media && (
                                                    msg.media.mime_type?.startsWith("image/") ? (
                                                        <img
                                                            src={msg.media.file_path}
                                                            alt="image"
                                                            className="chat-media-image"
                                                            onClick={() => window.open(msg.media.file_path, "_blank")}
                                                        />
                                                    ) : (
                                                        <a
                                                            href={msg.media.file_path}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="chat-media-doc"
                                                        >
                                                            📄 {msg.media.file_name || "Document"}
                                                        </a>
                                                    )
                                                )}

                                                <span className="chat-message-time">
                                                    {formatChatTimestamp(msg.timestamp)}
                                                </span>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="chat-form">
                <button
                    type="button"
                    className="file-upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                >
                    {uploadingFile ? <div className="spinner-sm" /> : <FiPaperclip size={20} />}
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                />

                {showEmojiPicker && (
                    <div className="emoji-picker-popup">
                        <EmojiPicker onEmojiClick={onEmojiClick} />
                    </div>
                )}

                <div className="chat-input-wrapper">
                    <textarea
                        ref={inputRef}
                        value={text}
                        onChange={(e) => {
                            setText(e.target.value);
                            // Auto-resize
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        onKeyDown={(e) => {
                            // Envoyer avec Entrée, saut de ligne avec Shift+Entrée
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend(e);
                            }
                        }}
                        placeholder="Écrivez votre message..."
                        className="chat-input"
                        rows={1}
                    />
                    <button
                        type="button"
                        className="emoji-btn"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                        😊
                    </button>
                </div>

                <button type="submit" className="chat-submit-btn"><FiSend /></button>
            </form>
        </div>
    );
};

export default ChatBox;
