import React from "react";
import { FiGithub, FiLinkedin, FiGlobe } from "react-icons/fi"; // Réutiliser react-icons installé dans votre projet
import "../../styles/Footer.css";

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="site-footer">
            <div className="footer-container">
                {/* Section Gauche : Infos & Copyright */}
                <div className="footer-brand">
                    <h3>Esat-Hub</h3>
                    <p>&copy; {currentYear} – Tous droits réservés.</p>
                    <p className="credits">Développé par <strong> <a href="https://github.com/tresor-del" target="blank">Trésor</a></strong></p>
                </div>

                {/* Section Centre : Liens de navigation légaux */}
                <div className="footer-links">
                    <a href="/about" className="footer-link">À propos</a>
                    <a href="/privacy" className="footer-link">Confidentialité</a>
                    <a href="/terms" className="footer-link">Conditions d'utilisation</a>
                </div>

                {/* Section Droite : Réseaux Sociaux */}
                <div className="footer-socials">
                    <a href="https://github.com/esathub" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                        <FiGithub size={20} />
                    </a>
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                        <FiLinkedin size={20} />
                    </a>
                    <a href="https://votre-portfolio.com" target="_blank" rel="noopener noreferrer" aria-label="Website">
                        <FiGlobe size={20} />
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
