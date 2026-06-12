import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from './AuthLayout';
import "../../styles/Auth/Auth.css";
import { requestNotificationPermission } from '../../services/notificationService';

const Login = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.username || !formData.password) {
      setError('Veuillez remplir tous les champs');
      setLoading(false);
      return;
    }

    try {
      const result = await login(formData.username, formData.password);
      if (result.success) {
        const token = await requestNotificationPermission();
        if (token) {
          await axios.post("/api/v1/notifications/devices/register", {
            user_id: user.id,
            device_token: token,
            platform: "web"
          });
        }
        navigate('/');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Une erreur inattendue s'est produite");
      console.error('Erreur lors de la connexion:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout loading={loading}>
      <h2 className="auth-title">Connexion</h2>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="username" className="form-label">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            className="form-input"
            placeholder="profil_name@esat_togo"
            value={formData.username}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password" className="form-label">Mot de passe</label>
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

        <button
          type="submit"
          className="btn btn-primary btn-full"
          disabled={loading}
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      <div className="auth-link">
        Pas encore de compte ?{' '}
        <Link to="/register">S'inscrire</Link>
      </div>
    </AuthLayout>
  );
};

export default Login;