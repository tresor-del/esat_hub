/**
 * Composant Principal App
 * Configure le routeur et les routes de l'application
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ConfirmEmail from './pages/ComfirmEmail';
import Home from './pages/Home';
import CreatePost from './pages/CreatePost';

// Styles
import './App.css';

/**
 * Composant de routeur principal
 * Séparé pour pouvoir utiliser useAuth
 */
const AppRoutes = () => {
  const { isAuth } = useAuth();

  return (
    <>
      {/* Afficher la navbar seulement si connecté */}
      {isAuth() && <Navbar />}
      
      <Routes>
        {/* Routes publiques */}
        <Route 
          path="/login" 
          element={isAuth() ? <Navigate to="/" replace /> : <Login />} 
        />
        <Route 
          path="/register" 
          element={isAuth() ? <Navigate to="/" replace /> : <Register />} 
        />
        <Route path="/confirm-email" element={<ConfirmEmail />} />

        {/* Routes protégées */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <CreatePost />
            </ProtectedRoute>
          }
        />

        {/* Route par défaut - rediriger vers login si non authentifié */}
        <Route 
          path="*" 
          element={<Navigate to={isAuth() ? "/" : "/login"} replace />} 
        />
      </Routes>
    </>
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