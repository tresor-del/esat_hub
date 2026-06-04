// ─── HomeSidebar.jsx ──────────────────────────────────────────────────────────

import React from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "../../../components/ui/Avatar";

const HomeSidebar = ({className, fullUser, userAuth}) => {
    const navigate = useNavigate();

    return (
        <div className={ `left-home-card ${className}`}>
            <div className="left-card-header">
                <div className="left-card-avatar">
                    <Avatar
                        user={fullUser}
                        size="large"
                        onClick={() => navigate(`profile/${userAuth.id}`)}
                    />
                </div>
                <div className="left-card-meta">
                    <h3 className="left-card-name">
                        {fullUser?.first_name} {fullUser?.last_name}
                    </h3>
                </div>
            </div>

            <div className="left-card-about">
                <h4>Tips    :</h4>
                <p>
                    {fullUser?.bio ||
                        "Participez aux discussions, partagez vos expériences et explorez les publications du réseau."}
                </p>
            </div>

            <button
                className="left-card-button"
                onClick={() => navigate(`/profile/${userAuth.id}`)}
            >
                Voir votre profil
            </button>

            <div className="left-card-footer">
                <div>
                    <a href="/about"   className="footer-link">À propos</a>
                    <a href="/privacy" className="footer-link">Confidentialité</a>
                    <a href="/terms"   className="footer-link">Condition d'utilisation</a>
                </div>
                <div className="left-home-footer-brand">
                    <h3 className="footer-link">Esat-Hub &copy; 2026</h3>
                    <p className="footer-link">Tous droits réservés.</p>
                    <p className="footer-link">
                        Développé par{" "}
                        <strong>
                            <a href="https://github.com/tresor-del" target="blank">
                                Trésor
                            </a>
                        </strong>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default HomeSidebar;