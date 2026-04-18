import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext"
import { getUserRoom, getPosts } from "../../services/api"
import PostAuthorInfo from "../../components/posts/PostAuthorInfo";
import PostCard from "../../components/posts/Postcard";
import { FiUsers, FiBook, FiMessageSquare } from "react-icons/fi";
import "../../styles/Room.css"


const Room = () => {
    const { user } = useAuth();
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('users'); // 'users', 'posts', 'chat'
    const [posts, setPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (user) {
            userRoomFunc();
        }
    }, [user])

    useEffect(() => {
        if (view === 'chat') {
            const interval = setInterval(() => {
                const mockMessage = {
                    id: Date.now() + Math.random(),
                    content: "Message automatique de simulation.",
                    sender: "Système",
                    timestamp: new Date().toISOString()
                };
                setMessages(prev => [...prev, mockMessage]);
            }, 10000); // every 10 seconds

            return () => clearInterval(interval);
        }
    }, [view])

    const userRoomFunc = async () => {
        try {
            setLoading(true);
            const result = await getUserRoom();
            if (result) {
                setRoom(result);
                console.log(result)
            }
        } catch (error) {
            console.log("Erreur lors de la récupération du room: ", error);
        } finally {
            setLoading(false)
        }
    }

    const handleSeeUsers = () => {
        setView('users');
    }

    const handleSeePosts = async () => {
        setView('posts');
        if (posts.length === 0 && !loadingPosts) {
            try {
                setLoadingPosts(true);
                const roomId = room.id
                const result = await getPosts({ roomId });
                if (result) {
                    setPosts(result.posts);
                    console.log(result)
                }
            } catch (error) {
                console.log("Erreur lors de la récupération des posts: ", error);
            } finally {
                setLoadingPosts(false);
            }

        }
    }

    const handleSeeChat = () => {
        setView('chat');
    }

    const handleSendMessage = () => {
        if (currentMessage.trim()) {
            const newMessage = {
                id: Date.now(),
                content: currentMessage,
                sender: user.username,
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, newMessage]);
            setCurrentMessage('');
        }
    }

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (loading) return <div>Chargement...</div>;
    if (!room) return <div>Aucune salle trouvée.</div>;

    return (
        <div className="room-container">
            <div className="room-left">
                <div className="room-name">
                    <h3>{room?.name}</h3>
                </div>
                <div className="room-btns">
                    <button className="btn btn-secondary" onClick={handleSeeUsers}> <FiUsers/> membres</button>
                    <button className="btn btn-secondary" onClick={handleSeePosts}><FiBook /> posts</button>
                    <button className="btn btn-secondary" onClick={handleSeeChat}><FiMessageSquare /> chat</button>
                </div>
            </div>
            <div className="room-right">
                {view === 'users' ? (
                    <>
                        <div className="room-users">
                            {room?.users?.map((user) =>
                                <div className="user">
                                    <PostAuthorInfo key={user.id} user={user} className={"user"} />
                                    <div>
                                        {user.type == "SIMPLE" ? "Etudiant": ""}
                                    </div>
                                </div>)}
                        </div>
                    </>
                ) : view === 'posts' ? (
                    <>
                        {loadingPosts ? (
                            <div>Chargement des posts...</div>
                        ) : (
                            <div className="room-posts">
                                {posts.length > 0 ? (
                                    posts.map((post) => <PostCard key={post.id} post={post} />)
                                ) : (
                                    <div>Aucun post trouvé.</div>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="room-chat">
                        <div className="chat-messages">
                            {messages.map((msg) => (
                                <div key={msg.id} className="chat-message">
                                    <strong>{msg.sender}:</strong> {msg.content}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="chat-input">
                            <input
                                type="text"
                                value={currentMessage}
                                onChange={(e) => setCurrentMessage(e.target.value)}
                                placeholder="Tapez votre message..."
                            />
                            <button className="btn btn-primary" onClick={handleSendMessage}>Envoyer</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Room;