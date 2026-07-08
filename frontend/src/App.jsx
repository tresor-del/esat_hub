import React, { useEffect, lazy, Suspense, useState } from "react";
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
import Logo from "./components/common/Logo";
import WelcomeModal from "./components/common/WelcomeModal";

import "./styles/Users/UserProfile.css";
import "./App.css";

import MainLayout from "./layouts/MainLayout";
import EmptyLayout from "./layouts/EmptyLayout";
import { CreatePostProvider } from "./contexts/createPostContext";
import { ToastProvider } from "./contexts/toastContext";
import PostDetailRoute from "./components/posts/PostDetailRoute";

const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const Home = lazy(() => import("./pages/Home/index"));
const PostDetail = lazy(() => import("./pages/posts/postDetail"));
const UserProfil = lazy(() => import("./pages/profile/UserProfil"));
const ProfileEdit = lazy(() => import("./pages/profile/ProfileEdit"));
const Room = lazy(() => import("./pages/room/index"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const ChatPage = lazy(() => import("./pages/chat/ChatPage"));
const ScanPage = lazy(() => import("./pages/ScanPage"));
const About = lazy(() => import("./pages/legal/About"));
const Privacy = lazy(() => import("./pages/legal/Privacy"));
const Terms = lazy(() => import("./pages/legal/Terms"));
const UpdateBanner = lazy(() => import("./components/common/UpdateBanner"))

// cache persistants
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { capacitorPersister } from './lib/capacitorQueryPersister';
import {useDeepLinks} from "./hooks/useDeepLinks"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24h — garder le cache 24h
      staleTime: 1000 * 60 * 5,    // 5min — considérer les données fraîches 5min
    },
  },
});

persistQueryClient({
  queryClient,
  persister: capacitorPersister,
  maxAge: 1000 * 60 * 60 * 24, // 24h
});

const AppRoutes = () => {
  useDeepLinks();

  const { loading, isAuth, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleLogout = (event) => {
      console.warn("Session expirée");
      logout();
      navigate("/login");
    };

    window.addEventListener("app:logout", handleLogout);

    return () => {
      window.removeEventListener("app:logout", handleLogout);
    };
  }, [logout, navigate]);

  if (loading) {
    return (
      <div className="app-splash-screen">
        <div className="splash-content">
          <Logo size={60} className="spinning-logo" />
          <div className="splash-progress-bar">
            <div className="splash-progress-line"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <WebSocketProvider>
      <Suspense fallback={
        <div className="app-splash-screen" style={{ position: 'absolute' }}>
          <div className="spinner"></div>
        </div>
      }>
        <Routes>

          <Route element={<EmptyLayout />}>
            <Route
              path="/login"
              element={isAuth() ? <Navigate to="/" replace /> : <Login />}
            />
            <Route
              path="/register"
              element={isAuth() ? <Navigate to="/" replace /> : <Register />}
            />

          </Route>

          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/" element={<Home />} />
            <Route path="/post/:id" element={<Home />} />
            <Route path="/post-page/:id" element={<PostDetailRoute />} />
            <Route path="/profile/:id" element={<UserProfil />} />
            <Route path="/profile/edit" element={<ProfileEdit />} />
            <Route path="/room" element={<Room />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/attendance/scan" element={<ScanPage />} />
          </Route>

          <Route
            path="*"
            element={<Navigate to={isAuth() ? "/" : "/login"} replace />}
          />

        </Routes>
      </Suspense>
    </WebSocketProvider>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <ToastProvider>
            <CreatePostProvider>
              <AppRoutes />
            </CreatePostProvider>
          </ToastProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
