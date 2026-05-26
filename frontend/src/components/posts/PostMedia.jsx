// PostMedia.js
import { version } from 'react-pdf/package.json';
import React, { useState, useEffect } from "react";
import { getPostFileUrl } from "../../services/api";
import api from "../../utils/axiosConfig";
import { Document, Page, pdfjs } from "react-pdf";
import "../../styles/PostMedia.css";
import ImageModal from "../ui/ImageModal";
import axios from "axios";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// pdfjs.GlobalWorkerOptions.workerSrc = new URL(
//   'pdfjs-dist/build/pdf.worker.min.mjs',
//   import.meta.url
// ).toString();

const PostMedia = ({ post, bust, size = "small" }) => {
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfError, setPdfError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ÉTAT DE CHARGEMENT DE L'IMAGE
  const [isImageLoading, setIsImageLoading] = useState(true);

  const effectiveBust = bust || localStorage.getItem(`post_bust_${post.id}`);

  // Dimensions selon la taille
  const dimensions = {
    small: { width: 300, toolbar: false },
    normal: { width: 300, toolbar: true },
    large: { width: 1200, toolbar: true }
  };

  const config = dimensions[size] || dimensions.normal;

  // Reset les états quand le post change
  useEffect(() => {
    setCurrentPage(1);
    setIsModalOpen(false);
    setIsNarrow(false);
    setIsImageLoading(true);
  }, [post.id]);

  const getDownloadUrl = (url) => {
    if (url.includes("cloudinary.com")) {
      // Ajoute l'en-tête fl_attachment dans l'URL de Cloudinary
      return url.replace("/upload/", "/upload/fl_attachment/");
    }
    return url;
  };

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
        // const response = await api.get(`/files/posts/${post.id}`, {
        //   responseType: "blob",
        //   params: effectiveBust ? { v: effectiveBust } : {},
        // });

        // const blob = new Blob([response.data], { type: "application/pdf" });
        // objectUrl = URL.createObjectURL(blob);

        // if (!cancelled) {
        //   setPdfBlobUrl(objectUrl);
        // }

        const directUrl = getPostFileUrl(post, effectiveBust);

        // setPdfBlobUrl(directUrl);
        // setPdfError(false);

        // Si c'est un lien Cloudinary et qu'on est en taille "small" (aperçu du fil d'actualité)
        if (directUrl.includes("cloudinary.com") && size === "small") {
          // On transforme l'URL pour demander à Cloudinary la page 1 en image JPG
          const imageUrlPreview = directUrl.replace(".pdf", ".jpg") + "?page=1";
          setPdfBlobUrl(imageUrlPreview);
        } else {
          setPdfBlobUrl(directUrl); // Fichier PDF réel pour le mode "normal" ou "large"
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
  }, [post.id, effectiveBust, size]);

  // ==================== PHOTOS ====================
  if (post.post_type === "photo") {
    const imageUrl = getPostFileUrl(post, effectiveBust);

    const handleImageLoad = (e) => {
      setIsImageLoading(false); // Désactive le squelette dès le chargement complet
      const { naturalWidth, clientWidth } = e.target;
      if (naturalWidth > clientWidth) {
        setIsNarrow(true);
      }
    };

    return (
      <div className={`post-media photo ${size}`}>
        {!imageError ? (
          <div className="photo-container-relative" style={{ position: "relative", width: "100%" }}>

            {/* SQUELETTE EN ATTENTE DU CHARGEMENT */}
            {isImageLoading && (
              <div className="photo-skeleton skeleton-blink" />
            )}

            {/* LE WRAPPER ET L'IMAGE RESTE MASQUÉS JUSQU'AU CHARGEMENT */}
            <div
              className={`photo-wrapper ${isNarrow ? 'has-blur-bg' : ''}`}
              style={{
                display: isImageLoading ? "none" : "block",
                backgroundImage: isNarrow ? `url(${imageUrl})` : "none"
              }}
            >
              <div className="blur-overlay"></div>
              <img
                src={imageUrl}
                alt={post.title}
                className="photo-image"
                onError={() => {
                  setImageError(true);
                  setIsImageLoading(false);
                }}
                onLoad={handleImageLoad}
                onClick={() => setIsModalOpen(true)}
                style={{ cursor: 'zoom-in' }}
              />
            </div>
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
    if (pdfError) {
      return (
        <div className={`pdf-fallback ${size}`}>
          <div className="pdf-fallback-icon">📄</div>
          <p>Impossible d'afficher l'aperçu</p>
          <a
            href={getPostFileUrl(post, effectiveBust)}
            target="_blank"
            rel="noreferrer"
            className="pdf-fallback-link"
          >
            Ouvrir le document
          </a>
        </div>
      );
    }

    if (loading || !pdfBlobUrl) {
      return (
        <div className={`pdf-loading ${size}`}>
          <div className="spinner"></div>
          <p>Chargement du document...</p>
        </div>
      );
    }

    // Détermine si on affiche une simple image d'aperçu ou le vrai lecteur PDF interactif
    const isImagePreview = pdfBlobUrl.includes("?page=1");

    return (
      <div className={`pdf-viewer ${size}`}>
        <div className="pdf-container">
          {isImagePreview ? (
            <div className="pdf-preview-clickable" onClick={() => setIsPdfModalOpen(true)}>
              <img
                src={pdfBlobUrl}
                alt={post.title || "Aperçu PDF"}
                className="pdf-preview-img"
                onError={() => setPdfError(true)}
              />
              <div className="pdf-preview-overlay">
                <span>🔍 Cliquer pour ouvrir le lecteur</span>
              </div>
            </div>
          ) : (
            /* ── LECTEUR INTERACTIF POUR LES RENDERINGS LARGE ET NORMAL ── */
            <Document
              file={pdfBlobUrl}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              onLoadError={() => setPdfError(true)}
              options={{
                cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
                cMapPacked: true,
              }}
            >
              <Page
                pageNumber={currentPage}
                width={config.width}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                canvasBackground="transparent"
              />
            </Document>
          )}
        </div>

        {size === "small" && (
          <div className="pdf-badge">
            Document pdf
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

            <a href={getPostFileUrl(post, effectiveBust)} target="_blank" rel="noreferrer">
              📥
            </a>
          </div>
        )}

        {/* ── MODAL DE LECTURE PLEIN ÉCRAN ── */}
        {isPdfModalOpen && (
          <div className="pdf-modal-backdrop" onClick={() => setIsPdfModalOpen(false)}>
            <div className="pdf-modal-content" onClick={(e) => e.stopPropagation()}>

              {/* Bouton de fermeture épuré */}
              <button className="pdf-modal-close" onClick={() => setIsPdfModalOpen(false)} aria-label="Fermer">
                ✕
              </button>
              <a
                className="img-modal-btn download"
                href={getPostFileUrl(post)}
                download={`esathub-img-${Date.now()}.jpg`}
                target="_blank"
                rel="noopener noreferrer"
                title="Télécharger l'image"
              >
                📥
              </a>

              {/* Zone principale de visualisation du document */}
              <div className="pdf-modal-body">
                <Document
                  file={getPostFileUrl(post, effectiveBust)}
                  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                  onLoadError={() => setPdfError(true)}
                  options={{
                    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
                    cMapPacked: true,
                  }}
                >
                  <Page
                    pageNumber={currentPage}
                    height={window.innerHeight - 160}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    onRenderError={() => console.log("Rendu annulé ou interrompu")}
                    onLoadError={() => console.log("Chargement interrompu")}
                  />
                </Document>
              </div>

              {/* Barre de navigation basse et moderne */}
              {numPages > 1 && (
                <div className="pdf-modal-toolbar">
                  <button
                    className="pdf-nav-btn"
                    onClick={goToPrevPage}
                    disabled={currentPage === 1}
                  >
                    ◀ Précédent
                  </button>

                  <span className="pdf-page-indicator">
                    {currentPage} <span className="pdf-page-separator">/</span> {numPages}
                  </span>

                  <button
                    className="pdf-nav-btn"
                    onClick={goToNextPage}
                    disabled={currentPage === numPages}
                  >
                    Suivant ▶
                  </button>
                </div>
              )}
            </div>
          </div>
        )}


      </div>
    );
  }

  return null;
};

export default PostMedia;
