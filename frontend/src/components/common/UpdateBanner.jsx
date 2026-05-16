import React, { useState, useEffect } from "react";

export default function UpdateBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setShow(true);
    };

    // Écoute l'événement lancé par main.jsx
    window.addEventListener('swUpdateAvailable', handleUpdate);

    return () => {
      window.removeEventListener('swUpdateAvailable', handleUpdate);
    };
  }, []);

  const handleReload = () => {
    // Force la fermeture de la bannière et recharge immédiatement l'application
    setShow(false);
    window.location.reload();
  };

  if (!show) return null;

  return (
    <div style={styles.bannerContainer}>
      <div style={styles.bannerContent}>
        <span>🚀 Une nouvelle version est disponible !</span>
        <button onClick={handleReload} style={styles.bannerButton}>
          Mettre à jour
        </button>
      </div>
    </div>
  );
}

// Styles basiques (A adapter avec Tailwind CSS ou tes propres classes)
const styles = {
  bannerContainer: {
    position: "fixed",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "#1e293b", // Couleur ardoise foncée
    color: "#ffffff",
    padding: "12px 24px",
    borderRadius: "12px",
    boxShadow: "0px 10px 25px rgba(0,0,0,0.3)",
    zIndex: 9999,
    width: "90%",
    maxWidth: "400px",
  },
  bannerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "14px",
    fontWeight: "500",
  },
  bannerButton: {
    backgroundColor: "#3b82f6", // Bleu moderne
    color: "white",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  }
};
