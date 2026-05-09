// PostMedia.js
import React, { useState, useEffect } from "react";
import { getPostFileUrl } from "../../services/api";
import api from "../../utils/axiosConfig";
import { Document, Page, pdfjs } from "react-pdf";
import "../../styles/PostMedia.css";
import ImageModal from "../ui/ImageModal";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PostMedia = ({ post, bust, size = "small" }) => {
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfError, setPdfError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const effectiveBust = bust || localStorage.getItem(`post_bust_${post.id}`);

  // Dimensions selon la taille
  const dimensions = {
    small: { width: 300, toolbar: false },
    normal: { width: 300, toolbar: true },
    large: { width: 1200, toolbar: true }
  };

  const config = dimensions[size] || dimensions.normal;

  // Reset page quand le document change
  useEffect(() => {
    setCurrentPage(1);
  }, [post.id]);

  const goToPrevPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => {
    if (numPages) {
      setCurrentPage(prev => Math.min(numPages, prev + 1));
    }
  };

  // Chargement du PDF
  useEffect(() => {
    let cancelled = false;
    let objectUrl = null;

    const fetchPdf = async () => {
      if (post.post_type !== "document") return;

      try {
        setLoading(true);
        const response = await api.get(`files/posts/${post.id}`, {
          responseType: "blob",
          params: effectiveBust ? { v: effectiveBust } : {},
        });

        const blob = new Blob([response.data], { type: "application/pdf" });
        objectUrl = URL.createObjectURL(blob);

        if (!cancelled) {
          setPdfBlobUrl(objectUrl);
        }
      } catch (error) {
        console.error("Erreur chargement PDF:", error);
        setPdfError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPdf();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [post.id, effectiveBust]);

  // ==================== PHOTOS ====================
  if (post.post_type === "photo") {
    const imageUrl = getPostFileUrl(post, effectiveBust);

    const [isNarrow, setIsNarrow] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleImageLoad = (e) => {
      const { naturalWidth, naturalHight, clientWidth } = e.target;
      if (naturalWidth > clientWidth) {
        setIsNarrow(true);
      }
    }

    return (
      <div className={`post-media photo ${size}`}>
        {!imageError ? (
          <div className={`photo-wrapper ${isNarrow ? 'has-blur-bg' : ''}`} style={isNarrow ? { backgroundImage: `url(${imageUrl})` } : {}}>
            <div className="blur-overlay"></div>
            <img
              src={imageUrl}
              alt={post.title}
              className="photo-image"
              onError={() => setImageError(true)}
              onLoad={handleImageLoad}
              onClick={() => setIsModalOpen(true)} // Ouvre au clic
              style={{ cursor: 'zoom-in' }}

            />


          </div>

        ) : (
          <div className="photo-error">
            <span>🖼️</span>
            <p>Image non disponible</p>
          </div>
        )}

        {isModalOpen && (
          <ImageModal
            src={imageUrl}
            alt={post.title}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </div>

    );
  }

  // ==================== DOCUMENTS PDF ====================
  if (post.post_type === "document") {
    // Gestion erreur
    if (pdfError) {
      return (
        <div className={`pdf-fallback ${size}`}>
          <div className="pdf-fallback-icon">📄</div>
          <p>Impossible d'afficher l'aperçu</p>
          <a
            href={getPostFileUrl(post.id, effectiveBust)}
            target="_blank"
            rel="noreferrer"
            className="pdf-fallback-link"
          >
            Ouvrir le document
          </a>
        </div>
      );
    }

    // Chargement
    if (loading || !pdfBlobUrl) {
      return (
        <div className={`pdf-loading ${size}`}>
          <div className="spinner"></div>
          <p>Chargement du document...</p>
        </div>
      );
    }

    // Affichage PDF
    return (
      <div className={`pdf-viewer ${size}`}>


        {/* Conteneur PDF centré */}
        <div className="pdf-container">
          <Document
            file={pdfBlobUrl}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            onLoadError={() => setPdfError(true)}
          >
            <Page
              pageNumber={currentPage}  // ← Changez 1 par currentPage
              width={config.width}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        </div>

        {/* Badge pour version small */}
        {size === "small" && numPages > 1 && (
          <div className="pdf-badge">
            {numPages} page{numPages > 1 ? 's' : ''}
          </div>
        )}

        {config.toolbar && numPages > 1 && (
          <div className="pdf-toolbar">
            <span className="pdf-title">{post.title || "Document"}</span>

            <div className="pdf-toolbar-center">
              <button onClick={goToPrevPage} disabled={currentPage === 1}>
                ◀ Précédent
              </button>
              <span>Page {currentPage} / {numPages}</span>
              <button onClick={goToNextPage} disabled={currentPage === numPages}>
                Suivant ▶
              </button>
            </div>

            <a href={getPostFileUrl(post.id, effectiveBust)} target="_blank" rel="noreferrer">
              📥
            </a>
          </div>
        )}

      </div>
    );
  }

  return null;
};

export default PostMedia;