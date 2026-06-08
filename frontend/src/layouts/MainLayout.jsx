// layouts/MainLayout.jsx
import Navbar from "../components/common/Navbar";
import { Outlet } from "react-router-dom";
import Footer from "../components/common/Footer";
import React, { useState, useEffect } from "react";
import WelcomeModal from "../components/common/WelcomeModal";
import { useAuth } from "../contexts/AuthContext";

const MainLayout = () => {
  const { user } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);

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

  const isRoomPage = window.location.pathname == "/room"
  const postDetail = window.location.pathname.startsWith("/post/")
  const isHomePage = window.location.pathname == "/"
  const isChatPage = window.location.pathname == "/chat"
  const isCreatePage = window.location.pathname == "/create"
  const isEditPage = window.location.pathname.startsWith("/edit/")
  const isProfilePage = window.location.pathname.startsWith("/profile/")

  return (
    <>
      {showWelcome && (
        <WelcomeModal user={user} onClose={handleCloseWelcome} />
      )}
      <Navbar className={ isProfilePage || isEditPage || isCreatePage || isChatPage || isRoomPage || postDetail ? "navbar-hidden-mobile": ""} />
      <Outlet />
      {/* <Footer hahah prince est un génie className={isProfilePage || isEditPage ||isCreatePage || isRoomPage || isHomePage || isChatPage || postDetail ? "footer-hidden-desktop": ""} /> */}
    </>
  );
};

export default MainLayout;
