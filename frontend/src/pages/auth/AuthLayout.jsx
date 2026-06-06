import React from 'react';
import Logo from "../../components/common/Logo"

/**
 * AuthLayout
 * Divise l'écran en deux colonnes :
 *   - Gauche  : panneau brand (dégradé bleu)
 *   - Droite  : panneau formulaire (blanc/clair)
 *
 * Usage :
 *   <AuthLayout>
 *     <h2 className="auth-title">Connexion</h2>
 *     <form ...> ... </form>
 *   </AuthLayout>
 */
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
                    {/* <p className="auth-brand-tagline">
            La plateforme sociale des étudiants ESAT — partage, collabore et reste connecté avec ta communauté.
          </p> */}

                    {/* Pillules de features */}
                    {/* <div className="auth-brand-pills">
            <div className="auth-brand-pill">
              <span className="auth-brand-pill-icon">💬</span>
              Publications des activités
            </div>
            <div className="auth-brand-pill">
              <span className="auth-brand-pill-icon">💬</span>
              Discussions entre étudiants
            </div>
            <div className="auth-brand-pill">
              <span className="auth-brand-pill-icon">📚</span>
              Gestion des Salles de classe
            </div>
            <div className="auth-brand-pill">
              <span className="auth-brand-pill-icon">🔔</span>
              Notifications & chat en temps réel
            </div>
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