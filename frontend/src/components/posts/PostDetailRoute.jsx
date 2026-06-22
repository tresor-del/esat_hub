import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import PostDetail from "../../pages/posts/postDetail";


const PostDetailRoute = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isMobile = window.innerWidth < 768;

    useEffect(() => {
        if (!isMobile) {
            // Desktop → retourne à Home avec le modal
            navigate("/", { replace: true, state: { openPostId: id } });
        }
    }, []);

    // Mobile → affiche la page directement
    return isMobile ? <PostDetail /> : null;
};

export default PostDetailRoute;