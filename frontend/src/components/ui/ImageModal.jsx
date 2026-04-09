import React from 'react';
import '../../styles/ImageModal.css';

const ImageModal = ({ src, alt, onClose }) => {
  
  const handleDownload = async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `image-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Erreur de téléchargement:", error);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt={alt} className="modal-image" />
        
        <div className="modal-controls">
          <button className="modal-btn download" onClick={handleDownload} title="Télécharger">
            📥
          </button>
          <button className="modal-btn close" onClick={onClose} title="Fermer">
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
