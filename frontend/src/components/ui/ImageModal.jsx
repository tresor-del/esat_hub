import React, { useEffect } from 'react';
import { FiDownload } from 'react-icons/fi';
import '../../styles/ImageModal.css';

const ImageModal = ({ src, alt, onClose }) => {
  
  // Fermeture automatique du modal en appuyant sur la touche "Échap"
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Forcer Cloudinary à déclencher le téléchargement immédiat (Contourne le CORS)
  const getDownloadUrl = (url) => {
    if (url.includes("cloudinary.com")) {
      // Ajoute l'en-tête fl_attachment dans l'URL de Cloudinary
      return url.replace("/upload/", "/upload/fl_attachment/");
    }
    return url;
  };

  return (
    <div className="img-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="img-modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* L'image s'adapte en temps réel aux contraintes de l'écran */}
        <img src={src} alt={alt || "Aperçu plein écran"} className="img-modal-image" />
        
        {/* Barre de commandes repositionnée proprement */}
        <div className="img-modal-controls">
          <a 
            className="img-modal-btn download" 
            href={getDownloadUrl(src)} 
            download={`esathub-img-${Date.now()}.jpg`}
            target="_blank"
            rel="noopener noreferrer"
            title="Télécharger l'image"
          >
            <FiDownload />
          </a>
          <button className="img-modal-btn close" onClick={onClose} title="Fermer la fenêtre">
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
