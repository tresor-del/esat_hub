/**
 * Page PostEdit - Modification d'un post
 * Réutilise les styles et la structure de CreatePost
 */

import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { FiUpload, FiX } from "react-icons/fi";
import { getPost, getPostFileUrl, updatePost} from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const PostEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // États du formulaire
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    post_type: "photo",
    file: null,
  });

  // États de l'interface
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [keepExistingFile, setKeepExistingFile] = useState(true);

  // Charger le post
  useEffect(() => {
    loadPost();
  }, [id]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const result = await getPost(id);

      // Vérifier que l'utilisateur est l'auteur
      if (!user || user.id !== result.user?.id) {
        setError("Vous n'êtes pas autorisé à modifier ce post");
        setTimeout(() => navigate("/"), 2000);
        return;
      }

      setPost(result);
      console.log("Post chargé:", result);
      setFormData({
        title: result.title,
        description: result.description || "",
        post_type: result.post_type || "photo",
        file: null,
      });

      // Afficher l'aperçu du fichier existant
      if (result.post_type === "photo" || result.post_type === "document") {
        setPreview(getPostFileUrl(result.id));
        setKeepExistingFile(true);
      }
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement du post");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gérer les changements dans les champs texte
   */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  /**
   * Gérer la sélection de fichier
   */
  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // Vérifier le type de fichier selon le type de poste
    const allowedPhotoTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    const allowedDocTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];

    if (
      formData.post_type === "photo" &&
      !allowedPhotoTypes.includes(file.type)
    ) {
      setError(
        "Type de fichier non autorisé pour une photo. Utilisez JPG, PNG, GIF ou WEBP."
      );
      return;
    }

    if (
      formData.post_type === "document" &&
      !allowedDocTypes.includes(file.type)
    ) {
      setError(
        "Type de fichier non autorisé pour un document. Utilisez PDF, DOC, DOCX, TXT, XLS, XLSX, PPT ou PPTX."
      );
      return;
    }

    setFormData({
      ...formData,
      file: file,
    });
    setKeepExistingFile(false);

    // Créer un aperçu pour les images
    if (formData.post_type === "photo" && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    if (error) setError("");
  };

  /**
   * Supprimer le fichier sélectionné
   */
  const removeFile = () => {
    setFormData({ ...formData, file: null });
    setKeepExistingFile(false);
    // Ne pas réinitialiser preview pour garder l'aperçu du fichier existant
    // L'utilisateur pourra maintenant cliquer pour changer
  };

  /**
   * Restaurer le fichier existant
   */
  const restoreExistingFile = () => {
    setFormData({ ...formData, file: null });
    setKeepExistingFile(true);
    if (post.post_type === "photo" || post.post_type === "document") {
      setPreview(getPostFileUrl(post.id));
    }
  };

  /**
   * Valider le formulaire
   */
  const validateForm = () => {
    if (!formData.title.trim()) {
      setError("Le titre est obligatoire");
      return false;
    }

    // Un fichier est requis soit nouveau soit existant
    if (!formData.file && !keepExistingFile) {
      setError("Veuillez sélectionner un fichier ou conserver l'existant");
      return false;
    }

    return true;
  };

  /**
   * Gérer la soumission du formulaire
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setSaving(true);

    try {
      const data = new FormData();
      console.log("Titre avant append: ", formData.title);
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("post_type", formData.post_type);

      // Ajouter le fichier si nouveau fichier sélectionné
      if (formData.file) {
        data.append("file", formData.file);
      }

      // Si on a supprimé le fichier existant sans en ajouter un nouveau
      if (!keepExistingFile && !formData.file) {
        data.append("remove_file", "true");
      }

      // print(data.description)
      console.log("Id du poste modifié: ", id);
      console.log("Données du poste modifié: ", data.get("title"));
      await updatePost(id, data);

      // Rediriger vers la page du post
      navigate(`/post/${id}`);
    } catch (err) {
      console.error("Erreur lors de la modification:", err);
      setError(
        err.response?.data?.detail || "Erreur lors de la modification du post"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: "40px 20px", textAlign: "center" }}>
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container" style={{ padding: "40px 20px", textAlign: "center" }}>
        <p className="alert alert-error">{error || "Post introuvable"}</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card" style={{ minWidth: "800px", margin: "0 auto" }}>
        <div className="card-header">
          <h2 className="card-title">Modifier le post</h2>
        </div>

        <div className="card-body">
          {/* Message d'erreur */}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: "16px" }}>
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
                disabled={saving}
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
                placeholder="Donnez un titre à votre post"
                value={formData.title}
                onChange={handleChange}
                maxLength={255}
                required
                disabled={saving}
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
                disabled={saving}
              />
            </div>

            {/* Upload de fichier */}
            <div className="form-group">
              <label className="form-label">
                Fichier *
                {keepExistingFile && formData.file === null && (
                  <span style={{ color: "#2e7d32", fontWeight: 400, marginLeft: 8 }}>
                    ✓ Fichier actuel conservé
                  </span>
                )}
                {formData.file && (
                  <span style={{ color: "#2e7d32", fontWeight: 400, marginLeft: 8 }}>
                    ✓ Nouveau fichier sélectionné
                  </span>
                )}
              </label>

              {/* Bouton pour restaurer le fichier original (seulement si on a changé) */}
              {!keepExistingFile && post?.post_type === formData.post_type && (
                <div style={{ marginBottom: "12px" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={restoreExistingFile}
                    style={{ fontSize: "13px", padding: "6px 12px" }}
                  >
                    ↩️ Restaurer le fichier original
                  </button>
                </div>
              )}

              {/* Zone de drop/upload */}
              <div className="file-upload">
                <input
                  type="file"
                  id="file"
                  accept={
                    formData.post_type === "photo"
                      ? "image/*"
                      : ".pdf,.doc,.docx,.txt,.xlsx,.xls,.ppt,.pptx"
                  }
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  disabled={saving}
                />
                <label
                  htmlFor="file"
                  className="file-upload-label"
                  style={{
                    cursor: "pointer",
                  }}
                >
                  {preview ? (
                    // Aperçu de l'image
                    <div>
                      <img
                        src={preview}
                        alt="Aperçu"
                        style={{
                          maxWidth: "100%",
                          maxHeight: "300px",
                          borderRadius: "4px",
                        }}
                      />
                      <p
                        style={{
                          marginTop: "12px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {formData.file
                          ? "✅ Nouveau fichier sélectionné - Cliquez pour changer"
                          : keepExistingFile 
                            ? "Fichier actuel - Cliquez pour le changer"
                            : "Cliquez pour sélectionner un nouveau fichier"}
                      </p>
                    </div>
                  ) : formData.file ? (
                    // Nom du fichier (pour les documents)
                    <div>
                      <div className="file-upload-icon">📄</div>
                      <strong>✅ {formData.file.name}</strong>
                      <p
                        style={{
                          marginTop: "8px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        Nouveau fichier - Cliquez pour changer
                      </p>
                    </div>
                  ) : keepExistingFile && (post.post_type === "photo" || post.post_type === "document") ? (
                    // Fichier existant conservé (sans aperçu visuel)
                    <div>
                      <div className="file-upload-icon">
                        {formData.post_type === "photo" ? "📷" : "📄"}
                      </div>
                      <strong>Fichier actuel conservé</strong>
                      <p
                        style={{
                          marginTop: "8px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        Cliquez pour le remplacer
                      </p>
                    </div>
                  ) : (
                    // État initial (pas de fichier)
                    <>
                      <div className="file-upload-icon">
                        <FiUpload />
                      </div>
                      <strong>Cliquez pour sélectionner un fichier</strong>
                      <p
                        style={{
                          marginTop: "8px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {formData.post_type === "photo"
                          ? "JPG, PNG, GIF ou WEBP"
                          : "PDF, DOC, DOCX, TXT, XLS, XLSX, PPT ou PPTX"}
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Boutons d'action */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate(`/post/${id}`)}
                disabled={saving}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "Enregistrement..." : "Enregistrer les modifications"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostEdit;