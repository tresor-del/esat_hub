// ─── CreatePostBar.jsx ────────────────────────────────────────────────────────

import React from "react";
import { useNavigate } from "react-router-dom";
import { FiFile, FiImage, FiVideo } from "react-icons/fi";
import Avatar from "../../../components/ui/Avatar";
import CreatePost from "../../CreatePost";


/**
 * @prop {object} fullUser
 * @prop {object} userAuth
 */
const CreatePostBar = ({fullUser, userAuth, handleCreate, closeModale }) => {
    const navigate = useNavigate();


    return (
        <div
            className="create-post-container"
            data-step="1"
            data-intro="Créez des posts ici !"
        >
            <div className="create-post-avatar-wrapper">
                <Avatar
                    user={fullUser}
                    size="medium"
                    onClick={() => navigate(`profile/${userAuth.id}`)}
                />
            </div>

            <div className="create-post-input-trigger" onClick={handleCreate}>
                <span>Quoi de neuf {userAuth?.profil_name} ?</span>
            </div>

            <div className="create-post-actions" onClick={handleCreate}>
                <button type="button" className="action-icon-btn" title="Ajouter une image">
                    <FiImage size={20} />
                </button>
                <button type="button" className="action-icon-btn" title="Ajouter une vidéo">
                    <FiFile size={20} />
                </button>
            </div>
        </div>
    );
};

export default CreatePostBar;