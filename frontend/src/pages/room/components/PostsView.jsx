import React from "react";
import { useNavigate } from "react-router-dom";
import PostCard from "../../../components/posts/Postcard";

/**
 * @prop {Array}   posts
 * @prop {boolean} loading
 */
const PostsView = ({ posts = [], loading }) => {
    const navigate = useNavigate();

    if (loading) {
        return <div className="posts-loading">Chargement des posts...</div>;
    }

    return (
        <div className="room-posts-view">
            <div className="room-posts">
                {posts.length > 0 ? (
                    posts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            onView={() => navigate(`/post/${post.id}`)}
                            onEdit={() => navigate(`/edit/${post.id}`)}
                        />
                    ))
                ) : (
                    <div className="no-posts">Aucun post trouvé dans cette salle.</div>
                )}
            </div>
        </div>
    );
};

export default PostsView;