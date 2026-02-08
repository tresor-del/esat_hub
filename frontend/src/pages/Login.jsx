/**
 * Page de Connexion
 * Permet à l'utilisateur de se connecter avec son email et mot de passe
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // États du formulaire
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // États de l'interface
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Gérer les changements dans les champs du formulaire
   */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Effacer l'erreur quand l'utilisateur commence à taper
    if (error) setError('');
  };

  /**
   * Gérer la soumission du formulaire
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation basique
    if (!formData.email || !formData.password) {
      setError('Veuillez remplir tous les champs');
      setLoading(false);
      return;
    }

    try {
      // Tentative de connexion
      const result = await login(formData.email, formData.password);

      if (result.success) {
        // Connexion réussie - rediriger vers la page d'accueil
        navigate('/');
      } else {
        // Afficher l'erreur
        setError(result.error);
      }
    } catch (err) {
      setError('Une erreur inattendue s\'est produite');
      console.error('Erreur lors de la connexion:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-text">📱 Esat-Hub</div>
        </div>

        {/* Titre */}
        <h2 className="auth-title">Connexion</h2>

        {/* Message d'erreur */}
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
          
        )}

        {/* Formulaire de connexion */}
        <form onSubmit={handleSubmit} className="form">
          {/* Champ Email */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              placeholder="votre@email.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          {/* Champ Mot de passe */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          {/* Bouton de soumission */}
          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        {/* Lien vers l'inscription */}
        <div className="auth-link">
          Pas encore de compte ?{' '}
          <Link to="/register">S'inscrire</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;