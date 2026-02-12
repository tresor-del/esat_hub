/**
 * Composant Principal App
 * Configure le routeur et les routes de l'application
 */

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

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

// Styles
import "./App.css";

/**
 * Routes de l'application
 */
const AppRoutes = () => {
  const { isAuth } = useAuth();

  return (
    <Routes>
      {/* ===================== */}
      {/* Routes publiques */}
      {/* ===================== */}
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

      {/* ===================== */}
      {/* Routes protégées AVEC navbar */}
      {/* ===================== */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Home />} />
      </Route>

      {/* ===================== */}
      {/* Routes protégées SANS navbar */}
      {/* Ici : create / edit / post detail ohne navbar */}
      <Route
        element={
          <ProtectedRoute>
            <EmptyLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/create" element={<CreatePost />} />
        <Route path="/edit/:id" element={<PostEdit />} />
        <Route path="/post/:id" element={<PostDetail />} />
      </Route>

      {/* ===================== */}
      {/* Fallback */}
      {/* ===================== */}
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
