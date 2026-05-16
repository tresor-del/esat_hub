import React, { useEffect, lazy, Suspense } from "react";
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

import "./styles/UserProfile.css";
import "./App.css";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import MainLayout from "./layouts/MainLayout";
import EmptyLayout from "./layouts/EmptyLayout";

const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const ConfirmEmail = lazy(() => import("./pages/auth/ComfirmEmail"));
const Home = lazy(() => import("./pages/posts/Home"));
const CreatePost = lazy(() => import("./pages/posts/CreatePost"));
const PostDetail = lazy(() => import("./pages/posts/postDetail"));
const PostEdit = lazy(() => import("./pages/posts/PostEdit"));
const UserProfil = lazy(() => import("./pages/profile/UserProfil"));
const ProfileEdit = lazy(() => import("./pages/profile/ProfileEdit"));
const Room = lazy(() => import("./pages/room/Room"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const ChatPage = lazy(() => import("./pages/chat/ChatPage"));
const About = lazy(() => import("./pages/legal/About"));
const Privacy = lazy(() => import("./pages/legal/Privacy"));
const Terms = lazy(() => import("./pages/legal/Terms"));
const UpdateBanner = lazy(() => import("./components/common/UpdateBanner") )


const queryClient = new QueryClient();

const AppRoutes = () => {
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
            <Route path="/confirm-email" element={<ConfirmEmail />} />
            <Route path="/chat" element={<ChatPage />} />

          </Route>

          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreatePost />} />
            <Route path="/edit/:id" element={<PostEdit />} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/profile/:id" element={<UserProfil />} />
            <Route path="/profile/edit" element={<ProfileEdit />} />
            <Route path="/room" element={<Room />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
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
          <AppRoutes />
          <Suspense fallback={null}>
            <UpdateBanner />
          </Suspense>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
