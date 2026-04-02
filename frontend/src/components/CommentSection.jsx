import React, { useEffect, useState } from "react";
import Avatar from "./Avatar";
import { useNavigate } from "react-router-dom";
import { addComment, getComments } from "../services/api";
import "../styles/CommentSection.css";
import PostAuthorInfo from "./PostAuthorInfo";
import { formatRelativeDate } from "../utils/dateFormatter";


const CommentSection = ({postId, user, onCommentAdded}) => {

    const [comments, setComments] = useState([]) 
    const [content, setContent] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const navigate = useNavigate();

    useEffect(() => {
        loadComments();
    }, [postId])

    useEffect(() =>{
        if (onCommentAdded) {
            onCommentAdded(comments.length);
        }
    }, [comments, onCommentAdded])

    const loadComments = async () => {
        try {
            setLoading(true);
            const result = await getComments(postId);
            if (result.comments) {
                setComments(result.comments);
            }
        } catch (error) {
            setError("Erreur lors du chargement des commentaires")
        } finally {
            setLoading(false);
        }
    }

    const handleClick = (e) =>{
        e.stopPropagation();
        if (user?.id) {
            navigate(`/profile/${user.id}`)
        }
    }

    const handleSubmit = async () => {
        try {
            setLoading(true)
            const commentData = {
                user_id: user.id,
                post_id: postId,
                content: content
            }
            const response = await addComment(commentData);
            setComments([...comments, response]);
            setContent("");
        } catch (error) {
            setError("Erreur lors de l'ajout du commentaire")
        } finally {
            setLoading(false)
        }
    }

    return (

        <div>
            
            {/* envoie de commentaires */}
            <div className="submitForm">
                <input placeholder="Ecrivez votre commentaire ici..." className="input" type="text" value={content} onChange={(e) => {setContent(e.target.value)}} />
                <button className="submitButton" onClick={handleSubmit}>Submit</button>
            </div>
            {/* list des commentaires */}
            <div className="commentBox">
                {comments.map((comment) =>(
                <div key={comment.id} className="commentCard">
                    <div className="comment-info">
                        <PostAuthorInfo user={comment.user} onClick={handleClick} />
                        <span className="comment-date">{formatRelativeDate(comment.created_at)}</span>
                    </div>
                    <div className="comment-body">
                        <div className="content">
                            {comment.content}
                        </div>
                        <div className="comment-footer">
                            <button className="comment-response-button">Répondre</button>
                        </div>
                    </div>
                    
                </div>
            ))}

            </div>
            
        </div>

        
    )
}

export default CommentSection;