import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { confirmEmail } from '../services/api';

const ConfirmEmail = () => {
  const [searchParams] = useSearchParams();
  
  // États de la page
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');

  /**
   * Vérifier l'email au chargement de la page
   */
  useEffect(() => {
    const verifyEmail = async () => {
      // Récupérer le token depuis l'URL
      const token = searchParams.get('token');

      // Si pas de token dans l'URL
      if (!token) {
        setStatus('error');
        setMessage('Token de vérification manquant');
        return;
      }

      try {
        // Appeler l'API pour confirmer l'email
        const result = await confirmEmail(token);
        
        setStatus('success');
        setMessage(result.message || 'Email vérifié avec succès !');
      } catch (error) {
        console.error('Erreur lors de la vérification:', error);
        
        setStatus('error');
        
        // Gérer les différents types d'erreurs
        if (error.response?.status === 400) {
          setMessage('Token invalide ou expiré');
        } else if (error.response?.status === 404) {
          setMessage('Utilisateur non trouvé');
        } else {
          setMessage('Erreur lors de la vérification. Veuillez réessayer.');
        }
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-text">📱 Enrollix</div>
        </div>

        {/* Titre */}
        <h2 className="auth-title">Vérification de l'Email</h2>

        {/* État de chargement */}
        {status === 'loading' && (
          <div className="loading">
            <div className="spinner"></div>
            <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>
              Vérification en cours...
            </p>
          </div>
        )}

        {/* État de succès */}
        {status === 'success' && (
          <>
            <div className="alert alert-success">
              <div style={{ fontSize: '48px', textAlign: 'center', marginBottom: '16px' }}>
                ✅
              </div>
              <strong>{message}</strong>
              <p style={{ marginTop: '8px' }}>
                Votre compte a été activé avec succès. Vous pouvez maintenant vous connecter.
              </p>
            </div>

            <Link to="/login" className="btn btn-primary btn-full" style={{ marginTop: '16px' }}>
              Se connecter
            </Link>
          </>
        )}

        {/* État d'erreur */}
        {status === 'error' && (
          <>
            <div className="alert alert-error">
              <div style={{ fontSize: '48px', textAlign: 'center', marginBottom: '16px' }}>
                ❌
              </div>
              <strong>Erreur de vérification</strong>
              <p style={{ marginTop: '8px' }}>
                {message}
              </p>
            </div>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <Link to="/register" className="btn btn-secondary" style={{ marginRight: '8px' }}>
                S'inscrire à nouveau
              </Link>
              <Link to="/login" className="btn btn-primary">
                Se connecter
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ConfirmEmail;