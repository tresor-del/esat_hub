import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { register, checkPname } from '../../services/api';
import "../../styles/Auth.css"

const Register = () => {
  const navigate = useNavigate();

  // États du formulaire
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    profilName: '',
    email: '',
    schoolName: 'ESAT_TOGO',
    domain: '',
    level: '',
    year: '',
    role: 'STUDENT',
    major: '',
    password: '',
    confirmPassword: '',
  });

  // États de l'interface
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Profil name checking
  const [availability, setAvailability] = useState({
    checked: false,
    available: false,
    message: ""
  });
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    checkProfilName();
  }, [formData.profilName])

  const checkProfilName = () => {
    if (!formData.profilName || formData.profilName.length < 3) {
      setAvailability({ checked: false, available: false, message: "" });
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsChecking(true);
      try {
        const result = await checkPname(formData.profilName);
        console.log(result)
        setAvailability({
          checked: true,
          available: result.available,
          message: result.message
        });
      } catch (error) {
        console.error("Erreur de vérification:", error);
      } finally {
        setIsChecking(false);
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn);
  }

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
      !formData.level ||
      !formData.role ||
      !formData.type) {
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

      const { confirmPassword, ...rest } = formData

      const dataToSend = {
        first_name: rest.firstName,
        last_name: rest.lastName,
        profil_name: rest.profilName,
        email: rest.email,
        school_name: rest.schoolName,
        domain: rest.domain,
        level: rest.level,
        major: rest.major,
        role: rest.role,
        password: rest.password
      }

      console.log(dataToSend);

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
                className={`form-input ${availability.checked ? (availability.available ? 'is-valid' : 'is-invalid') : ''
                  }`}
                value={formData.profilName}
                onChange={handleChange}
                required
                disabled={loading}
              />
              {isChecking && <small className="text-muted">Vérification...</small>}


            {/* Message d'état */}
            {availability.checked && !isChecking && (
              <span style={{
                fontSize: '0.8rem',
                color: availability.available ? '#4CAF50' : '#f44336',
                marginTop: '4px',
                display: 'block'
              }}>
                {availability.message}
              </span>
            )}
          </div>


          <div className="form-group">
            <label htmlFor="schoolName" className='form-label'>École</label>
            <select disabled className='form-select' name="schoolName" value={formData.schoolName} onChange={handleChange}>
              <option value="">Choisir... </option>
              <option value="ESAT_TOGO" selected>ESAT-TOGO</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="domain" className='form-label'>Domaine</label>
            <select className='form-select' name="domain" value={formData.domain} onChange={handleChange}>
              <option value="">Choisir...</option>
              <option value="INFORMATIQUE">Informatique</option>
              <option value="AERONAUTIQUE">Aéronautique</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="major" className='form-label'>Filiere</label>
            <select className='form-select' name="major" value={formData.major} onChange={handleChange}>
              <option value="">Choisir...</option>
              <option value="IA">Intelligence Artificielle</option>
              <option value="CYBERSECURITE">Cybersécurité</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="level" className='form-label'>Niveau</label>
            <select className='form-select' name="level" value={formData.level} onChange={handleChange}>
              <option value="">Choisir...</option>
              <option value="PREPA">Cycle Préparatoire</option>
              <option value="INGE">Cycle Ingénieur</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="year" className='form-label'>Année</label>
            <select className='form-select' name="year" value={formData.year} onChange={handleChange}>
              <option value="">Choisir...</option>
              <option value="1_ERE_ANNEE">1 ere année</option>
              <option value="2_EME_ANNEE">2 eme année</option>
              <option value="3_EME_ANNEE">3 eme année</option>
            </select>
          </div>


          <div className="form-group">
            <label htmlFor="role" className='form-label'>Rôle</label>
            <select className='form-select' name="role" value={formData.role} onChange={handleChange} disabled>
              <option value="">Choisir...</option>
              <option value="STUDENT" selected>Étudiant</option>            </select>
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