/**
 * Page de Création de Poste
 * Permet de créer un nouveau poste avec upload de fichier
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUpload } from 'react-icons/fi';
import { createPost } from '../services/api';

const CreatePost = () => {
  const navigate = useNavigate();

  // États du formulaire
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    post_type: 'photo',
    file: null,
  });

  // États de l'interface
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  /**
   * Gérer les changements dans les champs texte
   */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');
  };

  /**
   * Gérer la sélection de fichier
   */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;

    // Vérifier le type de fichier selon le type de poste
    const allowedPhotoTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedDocTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    if (formData.post_type === 'photo' && !allowedPhotoTypes.includes(file.type)) {
      setError('Type de fichier non autorisé pour une photo. Utilisez JPG, PNG, GIF ou WEBP.');
      return;
    }

    if (formData.post_type === 'document' && !allowedDocTypes.includes(file.type)) {
      setError('Type de fichier non autorisé pour un document. Utilisez PDF, DOC, DOCX, TXT, XLS, XLSX, PPT ou PPTX.');
      return;
    }

    setFormData({
      ...formData,
      file: file,
    });

    // Créer un aperçu pour les images
    if (formData.post_type === 'photo' && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    if (error) setError('');
  };

  /**
   * Valider le formulaire
   */
  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Le titre est obligatoire');
      return false;
    }

    if (!formData.file) {
      setError('Veuillez sélectionner un fichier');
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

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Créer le poste
      await createPost(formData);

      // Rediriger vers l'accueil
      navigate('/');
    } catch (err) {
      console.error('Erreur lors de la création:', err);
      setError(err.response?.data?.detail || 'Erreur lors de la création du poste');
    } finally {
      setLoading(false);
    }
  };

  return (
    
    <div className="container">
      <div className="card" style={{ minWidth: '800px', margin: '0 auto' }}>
        <div className="card-header">
          <h2 className="card-title">Créer un nouveau poste</h2>
        </div>

        <div className="card-body">
          {/* Message d'erreur */}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '16px' }}>
              {error}
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="form">
            {/* Type de poste */}
            <div className="form-group">
              <label htmlFor="post_type" className="form-label">
                Type de poste *
              </label>
              <select
                id="post_type"
                name="post_type"
                className="form-select"
                value={formData.post_type}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="photo">📷 Photo</option>
                <option value="document">📄 Document</option>
              </select>
            </div>

            {/* Titre */}
            <div className="form-group">
              <label htmlFor="title" className="form-label">
                Titre *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                className="form-input"
                placeholder="Donnez un titre à votre poste"
                value={formData.title}
                onChange={handleChange}
                maxLength={255}
                required
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="description" className="form-label">
                Description (optionnel)
              </label>
              <textarea
                id="description"
                name="description"
                className="form-textarea"
                placeholder="Ajoutez une description..."
                value={formData.description}
                onChange={handleChange}
                rows={4}
                disabled={loading}
              />
            </div>

            {/* Upload de fichier */}
            <div className="form-group">
              <label className="form-label">
                Fichier *
              </label>
              
              {/* Zone de drop/upload */}
              <div className="file-upload">
                <input
                  type="file"
                  id="file"
                  accept={formData.post_type === 'photo' 
                    ? 'image/*' 
                    : '.pdf,.doc,.docx,.txt,.xlsx,.xls,.ppt,.pptx'
                  }
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  disabled={loading}
                />
                <label htmlFor="file" className="file-upload-label" style={{ cursor: 'pointer' }}>
                  {preview ? (
                    // Aperçu de l'image
                    <div>
                      <img 
                        src={preview} 
                        alt="Aperçu" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '300px',
                          borderRadius: '4px'
                        }} 
                      />
                      <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>
                        Cliquez pour changer
                      </p>
                    </div>
                  ) : formData.file ? (
                    // Nom du fichier (pour les documents)
                    <div>
                      <div className="file-upload-icon">📄</div>
                      <strong>{formData.file.name}</strong>
                      <p style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>
                        Cliquez pour changer
                      </p>
                    </div>
                  ) : (
                    // État initial
                    <>
                      <div className="file-upload-icon">
                        <FiUpload />
                      </div>
                      <strong>Cliquez pour sélectionner un fichier</strong>
                      <p style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>
                        {formData.post_type === 'photo'
                          ? 'JPG, PNG, GIF ou WEBP'
                          : 'PDF, DOC, DOCX, TXT, XLS, XLSX, PPT ou PPTX'
                        }
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Boutons d'action */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/')}
                disabled={loading}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Création...' : 'Créer le poste'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;