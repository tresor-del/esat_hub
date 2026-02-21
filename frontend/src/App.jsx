/**
 * Composant Principal App
 * Configure le routeur et les routes de l'application
 */

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";


import "./styles/PostPdfViewer.css"
import "./styles/UserProfile.css"
// Layouts
import MainLayout from "./layouts/MainLayout";
import EmptyLayout from "./layouts/EmptyLayout";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ConfirmEmail from "./pages/ComfirmEmail";
import Home from "./pages/Home";
import CreatePost from "./pages/CreatePost";
import PostDetail from "./pages/postDetail";
import PostEdit from "./pages/PostEdit";
import UserProfil from "./pages/UserProfil"

// Styles (split into ./styles/*.css)
import "./App.css"
import { useEffect } from "react";

/**
 * Routes de l'application
 */

const AppRoutes = () => {
  const { isAuth, logout } = useAuth();
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

  return (
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
  );
};

/**
 * Composant App principal
 */
function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
