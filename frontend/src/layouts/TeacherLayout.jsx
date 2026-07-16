// layouts/MainLayout.jsx
import Navbar from "../components/common/Navbar";
import { Outlet } from "react-router-dom";
import Footer from "../components/common/Footer";
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/toastContext";
import TeacherNavbar from "../components/common/TeacherNavbar";
import "../styles/Teacher/Layout.css"
import "../styles/Teacher/Navbar.css"
import "../styles/Teacher/Home.css"
import '../styles/Teacher/Assignment.css'
import '../styles/Teacher/RoomView.css'

const TeacherLayout = () => {
  const { user } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);

  // gestion des erreurs réseau
  const { toast } = useToast()

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


  return (

    <div className="t-layout">
    <TeacherNavbar />
      <Outlet />
    </div>

  );
};

export default TeacherLayout;
