import React from 'react';
import Logo from "../../components/common/Logo"


const AuthLayout = ({ children, loading = false }) => {
    return (
        <div className="auth-container">
            {/* ── Panneau gauche – Brand ── */}
            <div className="auth-brand-panel">
                <div className="brand-circle-accent" />

                <div className="auth-brand-content">
                    {/* Logo */}
                    <div className="auth-brand-logo-wrap">
                        <div className="auth-brand-logo-halo">
                            <Logo size={110} className={loading ? 'spinning-logo' : ''} />
                        </div>
                    </div>

                    {/* Nom & tagline */}
                    <h1 className="auth-brand-name">Esat-Hub</h1>
                    <h2 className="auth-brand-tagline">Plateforme Social de l'ESAT-TOGO</h2>
                    {/* <div className="presentations">
                        <img src="/presentation_smartphones.png" alt="" />
                        <img src="/presentation_desktop.png" alt="" />
                    </div> */}
                </div>
            </div>

            {/* ── Panneau droit – Formulaire ── */}
            <div className="auth-form-panel">
                <div className="auth-card">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;