
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
// import logo from "../public/logo_circle.png"
import Logo from "./components/common/Logo";


import "./styles/UserProfile.css"
// Layouts
import MainLayout from "./layouts/MainLayout";
import EmptyLayout from "./layouts/EmptyLayout";

// Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ConfirmEmail from "./pages/auth/ComfirmEmail";
import Home from "./pages/posts/Home";
import CreatePost from "./pages/posts/CreatePost";
import PostDetail from "./pages/posts/postDetail";
import PostEdit from "./pages/posts/PostEdit";
import UserProfil from "./pages/profile/UserProfil"
import ProfileEdit from "./pages/profile/ProfileEdit"
import Room from "./pages/room/Room";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ChatPage from "./pages/chat/ChatPage";


import "./App.css"
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

/**
 * Routes de l'application
 */

const AppRoutes = () => {
  const { loading, isAuth, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {

    // fonction pour se déconnecter si la session de l'utilisateur à expiré
    const handleLogout = (event) => {
      console.warn("Session expiré");
      logout();
      navigate()
    };

    // déconnecté le client après le signal d'axios
    window.addEventListener("app:logout", handleLogout)

    return () => {
      // Nettoyage pour éviter les bugs si le composant est rechargé
      window.removeEventListener("app:logout", handleLogout);
    };

  }, [logout, navigate])

  if (loading) {
  return (
    <div className="app-splash-screen">
      <div className="splash-content">
        <Logo size={60} className="spinning-logo"/>
        <div className="splash-progress-bar">
          <div className="splash-progress-line"></div>
        </div>
      </div>
    </div>
  );
}

  return (

    <WebSocketProvider>
      <Routes>

        {/* Routes publiques */}

        <Route element={<EmptyLayout />}>
          <Route
            path="/login"
            element={isAuth() ? <Navigate to="/" replace /> : <Login />}
          />
          <Route
            path="/register"
            element={isAuth() ? <Navigate to="/" replace /> : <Register />}
          />
          <Route path="/confirm-email" element={<ConfirmEmail />} />
          <Route path="/chat" element={<ChatPage />} />

        </Route>


        {/* Routes protégées AVEC navbar */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/create" element={<CreatePost />} />
          <Route path="/edit/:id" element={<PostEdit />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/profile/:id" element={<UserProfil />} />
          <Route path="/profile/edit" element={<ProfileEdit />} />
          <Route path="/room" element={<Room />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/" element={<Home />} />
        </Route>


        {/* Routes protégées SANS navbar */}
        <Route
          element={
            <ProtectedRoute>
              <EmptyLayout />
            </ProtectedRoute>
          }
        >

        </Route>


        {/* Fallback */}

        <Route
          path="*"
          element={<Navigate to={isAuth() ? "/" : "/login"} replace />}
        />


      </Routes>
    </WebSocketProvider>

  );
};

/**
 * Composant App principal
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
