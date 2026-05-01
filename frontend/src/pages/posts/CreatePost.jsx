import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUpload } from 'react-icons/fi';
import { createPost } from '../../services/api';
import { getUserProfile } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import "../../styles/Auth.css"

const CreatePost = () => {
  const navigate = useNavigate();
  const { user: userAuth } = useAuth();
  const [user, setUser] = useState();

  useEffect(() => {
    const userProfil = async () => {
      try {
        const result = await getUserProfile(userAuth.id);
        if (result) {
          setUser(result)
        }
      } catch (error) {
        console.log("Erreur de récupération de l'utilisateur: ", error)
      }
    }

    userProfil()
  }, [])

  // États du formulaire
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    post_type: 'photo', // ✅ Minuscule
    post_scope: 'general',
    room_id: null,
    file: null,
  });

  // Mettre à jour room_id selon le scope
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      room_id: prev.post_scope === 'private' ? user?.user_room_id || null : null
    }));
  }, [formData.post_scope, user]);

  // États de l'interface
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

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

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Le titre est obligatoire');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;
    setLoading(true);

    try {
      await createPost(formData);
      navigate('/');
    } catch (err) {
      console.error('Erreur lors de la création:', err);
      const apiDetail = err.response?.data?.detail;
      
      if (Array.isArray(apiDetail)) {
        setError(apiDetail[0].msg);
      } else if (typeof apiDetail === 'string') {
        setError(apiDetail);
      } else {
        setError('Erreur lors de la création du poste');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-create-container">
      <div className="card auth-card ">
        <div className="card-header">
          <h2 className="card-title">Créer un nouveau poste</h2>
        </div>

        <div className="card-body">
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="form">
            <div className='post-create-info'>
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
                  {/* ✅ Valeurs d'options alignées en minuscules */}
                  <option value="photo">Photo</option>
                  <option value="document">Document</option>
                  <option value="text">Text</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="post_scope" className="form-label">
                  Visibilité du poste *
                </label>
                <select
                  id="post_scope"
                  name="post_scope"
                  className="form-select"
                  value={formData.post_scope}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="general">Général</option>
                  <option value="private">Pour la classe</option>
                </select>
              </div>
            </div>

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

            {/* ✅ Masqué si "text" en minuscule */}
            {formData.post_type !== 'text' && (
              <div className="form-group">
                <label className="form-label">
                  Fichier
                </label>

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
                      <div>
                        <div className="file-upload-icon">📄</div>
                        <strong>{formData.file.name}</strong>
                        <p style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>
                          Cliquez pour changer
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="file-upload-icon">
                          <FiUpload />
                        </div>
                        <strong>Cliquez pour sélectionner un fichier</strong>
                        <p style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>
                          {/* ✅ Conditions alignées en minuscules */}
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
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
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
