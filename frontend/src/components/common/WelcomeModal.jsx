import React, { useState } from 'react';
import '../../styles/WelcomeModal.css';

const WelcomeModal = ({ user, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: `Bienvenue ${user?.firstName || 'sur ESAT Hub'}! 👋`,
      description: "Découvrez une plateforme innovante de partage et de collaboration pour notre École.",
      icon: "🎉"
    },
    {
      title: "Partagez vos publications 📝",
      description: "Créez des posts, partagez vos réalisations, vos projets et connectez-vous avec d'autres étudiants.",
      icon: "📝"
    },
    {
      title: "Communiquez en temps réel 💬",
      description: "Utilisez le chat pour discuter avec vos camarades, et restez connecté.",
      icon: "💬"
    },
    {
      title: "Découvrez les documents 📚",
      description: "Parcourez les ressources partagées, les documents importants et les guides utiles.",
      icon: "📚"
    },
    {
      title: "Personnalisez votre profil 👤",
      description: "Complétez votre profil, ajoutez une photo de profil et partagez plus sur vous.",
      icon: "👤"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handleDotClick = (index) => {
    setCurrentStep(index);
  };

  return (
    <div className="welcome-modal-overlay" onClick={handleSkip}>
      <div className="welcome-modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Bouton fermeture */}
        <button className="welcome-modal-close" onClick={handleSkip} aria-label="Fermer">
          ✕
        </button>

        {/* Contenu principal */}
        <div className="welcome-modal-body">
          <div className="welcome-modal-icon">
            {steps[currentStep].icon}
          </div>

          <h2 className="welcome-modal-title">
            {steps[currentStep].title}
          </h2>

          <p className="welcome-modal-description">
            {steps[currentStep].description}
          </p>
        </div>

        {/* Indicateurs de progression */}
        <div className="welcome-modal-dots">
          {steps.map((_, index) => (
            <button
              key={index}
              className={`welcome-modal-dot ${index === currentStep ? 'active' : ''}`}
              onClick={() => handleDotClick(index)}
              aria-label={`Étape ${index + 1}`}
            />
          ))}
        </div>

        {/* Boutons d'action */}
        <div className="welcome-modal-actions">
          <button className="welcome-modal-btn skip" onClick={handleSkip}>
            Passer
          </button>

          <button className="welcome-modal-btn next" onClick={handleNext}>
            {currentStep === steps.length - 1 ? 'Commencer' : 'Suivant'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
