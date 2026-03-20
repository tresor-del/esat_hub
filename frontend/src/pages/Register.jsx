import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/api';

const Register = () => {
  const navigate = useNavigate();

  // États du formulaire
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    profilName: '',
    email: '',
    schoolName: '',
    domain: '',
    level: '',
    password: '',
    confirmPassword: '',
  });

  // États de l'interface
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  /**
   * Gérer les changements dans les champs du formulaire
   */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Effacer les messages quand l'utilisateur tape
    if (error) setError('');
  };

  /**
   * Valider le formulaire avant soumission
   * @returns {boolean} True si le formulaire est valide
   */
  const validateForm = () => {
    // Vérifier que tous les champs sont remplis
    if (!formData.profilName || 
      !formData.password || 
      !formData.confirmPassword ||
      !formData.firstName ||
      !formData.lastName ||
      !formData.profilName ||
      !formData.schoolName ||
      !formData.domain ||
      !formData.level ) {
      setError('Veuillez remplir tous les champs');
      return false;
    }

    // Vérifier le format de l'email
    // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // if (!emailRegex.test(formData.email)) {
    //   setError('Veuillez entrer un email valide');
    //   return false;
    // }

    // Vérifier la longueur du mot de passe
    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }

    // Vérifier que les mots de passe correspondent
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }

    return true;
  };

  /**
   * Gérer la soumission du formulaire
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Valider le formulaire
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      // Tentative d'inscription

      const {confirmPassword, ...rest} = formData

      const dataToSend = {
        first_name: rest.firstName,
        last_name: rest.lastName,
        profil_name: rest.profilName,
        email: rest.email,
        school_name: rest.schoolName,
        domain: rest.domain,
        level: rest.level,
        password: rest.password
      }

      const result = await register(dataToSend);

      // Inscription réussie
      setSuccess(true);

      // Rediriger vers la page de connexion après 3 secondes
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err) {
      console.error('Erreur lors de l\'inscription:', err);

      // Gérer les différentes erreurs
      if (err.response?.status === 400) {
        setError('Cet email est déjà utilisé');
      } else {
        setError(err.response?.data?.detail || 'Erreur lors de l\'inscription. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Afficher le message de succès
  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-text">Esat-Hub</div>
          </div>

          <h2 className="auth-title">Inscription Réussie !</h2>

          <div className="alert alert-success">
            <strong>Vérifiez votre email</strong>
            <p style={{ marginTop: '8px' }}>
              Un email de vérification a été envoyé à <strong>{formData.email}</strong>.
              Cliquez sur le lien dans l'email pour activer votre compte.
            </p>
          </div>

          <div className="auth-link" style={{ marginTop: '16px' }}>
            Redirection vers la page de connexion...
          </div>
        </div>
      </div>
    );
  }

  // Afficher le formulaire d'inscription
  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-text">Esat-Hub</div>
        </div>

        {/* Titre */}
        <h2 className="auth-title">Créer un compte</h2>

        {/* Message d'erreur */}
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {/* Formulaire d'inscription */}
        <form onSubmit={handleSubmit} className="form">
          {/* Champ First Name */}
          <div className="form-group">
            <label htmlFor="firstName" className="form-label">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              className="form-input"
              placeholder="profil_name@school_name"
              value={formData.firstName}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          {/* Last Name */}
          <div className="form-group">
            <label htmlFor="lastName" className="form-label">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              className="form-input"
              value={formData.lastName}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          {/* Email  */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="profilName" className="form-label">
              Profil Name
            </label>
            <input
              type="text"
              id="profilName"
              name="profilName"
              className="form-input"
              placeholder="profil_name@school_name"
              value={formData.profilName}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <select name="schoolName" value={formData.schoolName} onChange={handleChange}>
              <option value="">Choisir...</option>
              <option value="ESAT_TOGO">ESAT-TOGO</option>
            </select>
          </div>

          <div className="form-group">
            <select name="domain" value={formData.domain} onChange={handleChange}>
              <option value="">Choisir...</option>
              <option value="INFORMATIQUE">Informatique</option>
              <option value="AERONAUTIQUE">Aéronautique</option>
            </select>
          </div>

          <div className="form-group">
            <select name="level" value={formData.level} onChange={handleChange}>
              <option value="">Choisir...</option>
              <option value="PREPA">Cycle Préparatoire</option>
              <option value="INGE">Cycle Ingénieur</option>
            </select>
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
            <small style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
              Minimum 6 caractères
            </small>
          </div>

          {/* Champ Confirmation Mot de passe */}
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className="form-input"
              placeholder="••••••••"
              value={formData.confirmPassword}
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
            {loading ? 'Inscription...' : 'S\'inscrire'}
          </button>
        </form>

        {/* Lien vers la connexion */}
        <div className="auth-link">
          Déjà un compte ?{' '}
          <Link to="/login">Se connecter</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;