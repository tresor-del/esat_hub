import React, { useEffect, useState, useRef } from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import Avatar from '../ui/Avatar';
import "../../styles/Chat.css";
import { getChatHistory } from '../../services/chatApi';

// Import du sélecteur d'emojis
import EmojiPicker from 'emoji-picker-react';

const ChatBox = ({ recipient }) => {
    const { messages, sendMessage, user } = useWebSocket();
    const [text, setText] = useState("");
    const [localHistory, setLocalHistory] = useState([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false); // État pour afficher/masquer le sélecteur
    
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null); // Référence pour cibler l'input text

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const res = await getChatHistory(recipient.id);
                setLocalHistory(res);
            } catch (error) {
                console.log(error);
            }
        };
        loadHistory();
        setShowEmojiPicker(false); // Ferme le sélecteur si on change de contact
    }, [recipient.id]);

    const liveMessages = messages[recipient.id] || [];
    const conversation = [...localHistory, ...liveMessages];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [conversation.length]);

    const handleSend = (e) => {
        e.preventDefault();
        if (text.trim()) {
            sendMessage(recipient.id, text);
            setText("");
            setShowEmojiPicker(false);
        }
    };

    // Fonction magique pour insérer l'emoji là où se trouve le curseur
    const onEmojiClick = (emojiData) => {
        const input = inputRef.current;
        if (!input) return;

        const start = input.selectionStart;
        const end = input.selectionEnd;
        
        // On découpe le texte pour insérer l'emoji au milieu
        const newText = text.substring(0, start) + emojiData.emoji + text.substring(end);
        
        setText(newText);

        // On remet le focus sur l'input et on place le curseur juste après l'emoji
        setTimeout(() => {
            input.focus();
            input.setSelectionRange(start + emojiData.emoji.length, start + emojiData.emoji.length);
        }, 10);
    };

    return (
        <div className='chat-box-container'>
            <div>
                <strong className='chat-box-header'>
                    <Avatar user={recipient} /> {recipient.profil_name}
                </strong>
            </div>

            <div className='chat-list'>
                {conversation.map((msg, i) => (
                    <div
                        key={i}
                        className={`chat-message-wrapper ${msg.sender_id === recipient.id ? 'incoming' : 'outgoing'}`}
                    >
                        <span className="chat-message-bubble">
                            {msg.content}
                        </span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Formulaire avec sélecteur d'emojis */}
            <form onSubmit={handleSend} className="chat-form" style={{ position: 'relative' }}>
                
                {/* Boîte flottante du sélecteur d'emojis */}
                {showEmojiPicker && (
                    <div style={{ position: 'absolute', bottom: '70px', left: '15px', zIndex: 1000 }}>
                        <EmojiPicker onEmojiClick={onEmojiClick} />
                    </div>
                )}

                <button 
                    type="button" 
                    className="emoji-btn" 
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', padding: '0 10px' }}
                >
                    😊
                </button>

                <input
                    ref={inputRef} // Attachement de la référence
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
