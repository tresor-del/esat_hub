// layouts/MainLayout.jsx
import Navbar from "../components/common/Navbar";
import { Outlet } from "react-router-dom";
import Footer from "../components/common/Footer";
import React, { useState, useEffect } from "react";
import WelcomeModal from "../components/common/WelcomeModal";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/toastContext";
import { useCreatePostModal } from "../contexts/createPostContext";
import CreatePost from "../pages/CreatePost";

const StudentLayout = () => {
  const { user } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);

  const { createPostModale, closeCreatePost } = useCreatePostModal();

  // gestion des erreurs réseau
  const { toast } = useToast()

  // useEffect(() => {
  //   const handleRetry = (e) => {
  //     toast({
  //       message: `Connexion instable — tentative ${e.detail.retryCount}/5...`,
  //       type: 'warning',
  //       duration: 3000
  //     })
  //   }

  //   const handleRetrySuccess = () => {
  //     toast({
  //       message: 'Connexion rétablie !',
  //       type: 'success',
  //       duration: 3000
  //     })
  //   }

  //   window.addEventListener('app:retry', handleRetry)
  //   window.addEventListener('app:retry-success', handleRetrySuccess)

  //   return () => {
  //     window.removeEventListener('app:retry', handleRetry)
  //     window.removeEventListener('app:retry-success', handleRetrySuccess)
  //   }
  // }, [toast])

  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true)
      toast({
        message: 'Vous êtes hors connexion !',
        type: 'error',
        duration: 10000
      })
    }

    const handleOnline = () => {
      setIsOffline(false)
      toast({
        message: 'Connexion rétablie !',
        type: 'success',
        duration: 10000
      })
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [toast])

  useEffect(() => {
    if (user?.id) {
      const welcomeKey = `welcome_modal_seen_${user.id}`;
      const hasSeenWelcome = localStorage.getItem(welcomeKey);

      if (!hasSeenWelcome) {
        setShowWelcome(true);
      }
    }
  }, [user?.id]);

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    if (user?.id) {
      const welcomeKey = `welcome_modal_seen_${user.id}`;
      localStorage.setItem(welcomeKey, "true");
    }
  };

  return (

    <>
      {showWelcome && (
        <WelcomeModal user={user} onClose={handleCloseWelcome} />
      )}

      {createPostModale && (
        <div className="modal-overlay">
          <div className="modal-container">
            <button className="modal-close" onClick={closeCreatePost}>✕</button>
            <CreatePost onClose={closeCreatePost} />
          </div>
        </div>
      )}

      <Navbar />
      <Outlet />

      {/* <Footer hahah prince est un génie className={isProfilePage || isEditPage ||isCreatePage || isRoomPage || isHomePage || isChatPage || postDetail ? "footer-hidden-desktop": ""} /> */}
    </>


  );
};

export default StudentLayout;
