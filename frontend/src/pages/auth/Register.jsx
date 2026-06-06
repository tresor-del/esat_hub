import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register, checkPname } from '../../services/api';
import AuthLayout from './AuthLayout';
import "../../styles/Auth.css";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', profilName: '', email: '',
    schoolName: 'ESAT_TOGO', domain: '', level: '', year: '',
    role: 'STUDENT', major: '', password: '', confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [availability, setAvailability] = useState({ checked: false, available: false, message: '' });
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    checkProfilName();
  }, [formData.profilName]);

  const checkProfilName = () => {
    if (!formData.profilName || formData.profilName.length < 3) {
      setAvailability({ checked: false, available: false, message: '' });
      return;
    }
    const delay = setTimeout(async () => {
      setIsChecking(true);
      try {
        const result = await checkPname(formData.profilName);
        setAvailability({ checked: true, available: result.available, message: result.message });
      } catch (err) {
        console.error('Erreur de vérification:', err);
      } finally {
        setIsChecking(false);
      }
    }, 500);
    return () => clearTimeout(delay);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.profilName || !formData.password || !formData.confirmPassword ||
        !formData.firstName || !formData.lastName || !formData.schoolName ||
        !formData.domain || !formData.level || !formData.role) {
      setError('Veuillez remplir tous les champs');
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
        first_name: rest.firstName, last_name: rest.lastName,
        profil_name: rest.profilName, email: rest.email,
        school_name: rest.schoolName, domain: rest.domain,
        level: rest.level, major: rest.major, role: rest.role,
        password: rest.password, year: rest.year,
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
          <label htmlFor="firstName" className="form-label">Prénom</label>
          <input type="text" id="firstName" name="firstName" className="form-input"
            value={formData.firstName} onChange={handleChange} required disabled={loading} />
        </div>

        {/* Last Name */}
        <div className="form-group">
          <label htmlFor="lastName" className="form-label">Nom</label>
          <input type="text" id="lastName" name="lastName" className="form-input"
            value={formData.lastName} onChange={handleChange} required disabled={loading} />
        </div>

        {/* Email */}
        <div className="form-group">
          <label htmlFor="email" className="form-label">Email</label>
          <input type="email" id="email" name="email" className="form-input"
            placeholder="your@email.com" value={formData.email}
            onChange={handleChange} required disabled={loading} />
        </div>

        {/* Profil Name */}
        <div className="form-group">
          <label htmlFor="profilName" className="form-label">Nom de profil</label>
          <input
            type="text" id="profilName" name="profilName"
            className={`form-input ${availability.checked ? (availability.available ? 'is-valid' : 'is-invalid') : ''}`}
            value={formData.profilName} onChange={handleChange} required disabled={loading}
          />
          {isChecking && <small className="text-muted">Vérification…</small>}
          {availability.checked && !isChecking && (
            <span style={{ fontSize: '0.8rem', color: availability.available ? '#4CAF50' : '#f44336', marginTop: '4px', display: 'block' }}>
              {availability.message}
            </span>
          )}
        </div>

        {/* École */}
        <div className="form-group">
          <label className="form-label">École</label>
          <select disabled className="form-select" name="schoolName" value={formData.schoolName} onChange={handleChange}>
            <option value="ESAT_TOGO">ESAT-TOGO</option>
          </select>
        </div>

        {/* Domaine */}
        <div className="form-group">
          <label className="form-label">Domaine</label>
          <select className="form-select" name="domain" value={formData.domain} onChange={handleChange}>
            <option value="">Choisir…</option>
            <option value="INFORMATIQUE">Informatique</option>
            <option value="AERONAUTIQUE">Aéronautique</option>
          </select>
        </div>

        {/* Filière */}
        <div className="form-group">
          <label className="form-label">Filière</label>
          <select className="form-select" name="major" value={formData.major} onChange={handleChange}>
            <option value="">Choisir…</option>
            <option value="IA">Intelligence Artificielle</option>
            <option value="CYBERSECURITE">Cybersécurité</option>
            <option value="GENIE LOGICIEL">Génie Logiciel</option>
            <option value="DATA SCIENCE">Data Science</option>
            <option value="RESEAUX & TELECOMS">Réseau et Télécommunication</option>
            <option value="SYSTEMES EMBARQUES">Systèmes Embarqués</option>
            <option value="MAINTENANCE AERONAUTIQUE">Maintenance Aéronautique</option>
            <option value="CONCEPTION AEROSPATIALE">Conception Aérospaciale</option>
          </select>
        </div>

        {/* Niveau */}
        <div className="form-group">
          <label className="form-label">Niveau</label>
          <select className="form-select" name="level" value={formData.level} onChange={handleChange}>
            <option value="">Choisir…</option>
            <option value="PREPA">Cycle Préparatoire</option>
            <option value="INGE">Cycle Ingénieur</option>
          </select>
        </div>

        {/* Année */}
        <div className="form-group">
          <label className="form-label">Année</label>
          <select className="form-select" name="year" value={formData.year} onChange={handleChange}>
            <option value="">Choisir…</option>
            <option value="PREMIERE_ANNEE">1ère année</option>
            <option value="DEUXIEME_ANNEE">2ème année</option>
            <option value="TROISIEME_ANNEE">3ème année</option>
          </select>
        </div>

        {/* Rôle */}
        <div className="form-group">
          <label className="form-label">Rôle</label>
          <select className="form-select" name="role" value={formData.role} onChange={handleChange} disabled>
            <option value="STUDENT">Étudiant</option>
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