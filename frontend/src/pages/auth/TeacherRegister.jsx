import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register, checkPname } from '../../services/api';
import AuthLayout from './AuthLayout';
import "../../styles/Auth/Auth.css";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '', 
    email: '', 
    password: '', 
    confirmPassword: '', 
    subject: '',
    role: 'TEACHER',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword ||
        !formData.subject ||!formData.role) {
      setError('Veuillez remplir tous les champs');
      console.log(formData)
      return false;
    }
    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (!validateForm()) { setLoading(false); return; }

    try {
      const { confirmPassword, ...rest } = formData;
      await register({
        full_name: rest.fullName, 
        email: rest.email,
        subject: rest.subject, 
        role: rest.role,
        password: rest.password,
      });
      setSuccess(true);
    } catch (err) {
      console.error("Erreur lors de l'inscription:", err);
      if (err.response?.status === 400) setError('Cet email est déjà utilisé');
      else setError(err.response?.data?.detail || "Erreur lors de l'inscription. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout loading={false}>
        <h2 className="auth-title">Inscription Réussie !</h2>
        <div className="alert alert-success">
          <strong>Confirmation en cours…</strong>
          <p style={{ marginTop: '8px' }}>
            Votre compte doit être confirmé par un admin avant de vous connecter.
          </p>
          <p>Username : <strong>{formData.profilName}@esat_togo</strong></p>
        </div>
        <Link to="/login" className="btn btn-primary btn-full">
          Se connecter
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout loading={loading}>
      <h2 className="auth-title">Créer un compte</h2>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="form">
        {/* First Name */}
        <div className="form-group">
          <label htmlFor="fullName" className="form-label">Nom</label>
          <input type="text" id="fullName" name="fullName" className="form-input"
            value={formData.fullName} onChange={handleChange} required disabled={loading} />
        </div>

        {/* Email */}
        <div className="form-group">
          <label htmlFor="email" className="form-label">Email</label>
          <input type="email" id="email" name="email" className="form-input"
            placeholder="votre@email.com" value={formData.email}
            onChange={handleChange} required disabled={loading} />
        </div>

        {/* Last Name */}
        <div className="form-group">
          <label htmlFor="subject" className="form-label">Matière</label>
          <input type="text" id="subject" name="subject" className="form-input"
            value={formData.subject} onChange={handleChange} required disabled={loading} />
        </div>

        {/* Rôle */}
        <div className="form-group">
          <label className="form-label">Rôle</label>
          <select className="form-select" name="role" value={formData.role} onChange={handleChange} disabled>
            <option value="TEACHER">Professeur</option>
          </select>
        </div>

        {/* Mot de passe */}
        <div className="form-group">
          <label htmlFor="password" className="form-label">Mot de passe</label>
          <input type="password" id="password" name="password" className="form-input"
            placeholder="••••••••" value={formData.password}
            onChange={handleChange} required disabled={loading} />
          <small style={{ color: '#a0aab4', fontSize: '12px' }}>Minimum 6 caractères</small>
        </div>

        {/* Confirmer mot de passe */}
        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">Confirmer le mot de passe</label>
          <input type="password" id="confirmPassword" name="confirmPassword" className="form-input"
            placeholder="••••••••" value={formData.confirmPassword}
            onChange={handleChange} required disabled={loading} />
        </div>

        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
          {loading ? 'Inscription…' : "S'inscrire"}
        </button>
      </form>

      <div className="auth-link">
        Déjà un compte ?{' '}
        <Link to="/login">Se connecter</Link>
      </div>
    </AuthLayout>
  );
};

export default Register;