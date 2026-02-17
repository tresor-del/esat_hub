/**
 * PostMedia - VERSION DESIGN ÉPURÉ
 * Sans la barre d'outils PDF.js
 */

import { useState, useEffect } from "react";
import { getPostFileUrl } from "../services/api";
import api from "../utils/axiosConfig";
import { FiChevronLeft, FiChevronRight, FiMaximize2 } from "react-icons/fi";
import { Document, Page, pdfjs } from "react-pdf";

// Configure le worker PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;


const PostMedia = ({ post, variant = "preview" }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfError, setPdfError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fileBlobUrl, setFileBlobUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [loading, setLoading] = useState(true);

  const totalPages = numPages || 1;

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (variant !== "detail") return;
      if (e.key === "ArrowRight") goToNextPage();
      if (e.key === "ArrowLeft") goToPrevPage();
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentPage, variant, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [post.id]);

  // Fetch du fichier avec authentification
  useEffect(() => {
    let cancelled = false;
    let objectUrl = null;

    const fetchBlob = async () => {
      try {
        const resp = await api.get(`/posts/${post.id}/file`, {
          responseType: "blob",
        });

        const mime = resp.headers["content-type"] || resp.data.type || "application/pdf";
        const blob = new Blob([resp.data], { type: mime });
        objectUrl = window.URL.createObjectURL(blob);
        if (!cancelled) setFileBlobUrl(objectUrl);
      } catch (err) {
        console.debug("Fetch blob failed, fallback to direct URL", err?.response?.status);
        setFileBlobUrl(null);
      }
    };

    if (post.post_type === "document") {
      fetchBlob();
    }

    return () => {
      cancelled = true;
      if (objectUrl) {
        try {
          window.URL.revokeObjectURL(objectUrl);
        } catch (e) {}
      }
    };
  }, [post.id]);

  // Callback quand le PDF est chargé
  const onDocumentLoadSuccess = ({ numPages: n }) => {
    setNumPages(n);
    setLoading(false);
  };

  const onDocumentLoadError = (error) => {
    console.error("PDF load error:", error);
    setPdfError(true);
    setLoading(false);
  };

  // Images
  if (post.post_type === "photo") {
    return (
      <div
        className="img-container"
        style={{
          marginTop: "12px",
          marginBottom: "12px",
          width: "100%",
        }}
      >
        <img
          src={getPostFileUrl(post.id)}
          alt={post.title}
          style={{
            maxWidth: "100%",
            maxHeight: variant === "preview" ? "auto" : "none",
            borderRadius: "4px",
            objectFit: "cover",
          }}
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      </div>
    );
  }

  // Documents
  if (post.post_type === "document") {
    const fileUrl = getPostFileUrl(post.id);
    const isPDF = fileUrl.toLowerCase().endsWith(".pdf");

    // MODE DETAIL - Navigation complète
    if (variant === "detail") {
      if (isPDF && !pdfError) {
        return (
          <div
            className="pdf-viewer-container"
            style={{
              marginTop: 16,
              marginBottom: 16,
              border: "1px solid var(--border-color, #edeff1)",
              borderRadius: "8px",
              overflow: "hidden",
              backgroundColor: "#f5f5f5",
            }}
          >
            {/* En-tête personnalisé (sans barre PDF.js) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                backgroundColor: "white",
                borderBottom: "1px solid var(--border-color, #edeff1)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "20px" }}>📄</span>
                <span style={{ fontWeight: 600 }}>{post.title}</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {/* Indicateur de page */}
                {!loading && (
                  <div style={{ fontSize: "14px", color: "#666" }}>
                    Page {currentPage} / {totalPages}
                  </div>
                )}

                {/* Bouton plein écran */}
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    color: "var(--reddit-blue)",
                  }}
                  title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
                >
                  <FiMaximize2 size={18} />
                </button>

                {/* Lien nouvel onglet */}
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "var(--reddit-blue)",
                    textDecoration: "none",
                    fontSize: "14px",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  Ouvrir ↗
                </a>
              </div>
            </div>

            {/* Zone de rendu PDF */}
            <div
              style={{
                position: "relative",
                width: "100%",
                minHeight: isFullscreen ? "80vh" : "600px",
                backgroundColor: "#525659",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {loading && (
                <div style={{ color: "white", fontSize: "16px" }}>
                  Chargement du document...
                </div>
              )}

              {/* Bouton précédent */}
              {!loading && totalPages > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevPage();
                  }}
                  disabled={currentPage === 1}
                  style={{
                    position: "absolute",
                    left: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 10,
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    border: "none",
                    color: "white",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: currentPage === 1 ? 0.3 : 1,
                    transition: "all 0.2s ease",
                  }}
                >
                  <FiChevronLeft size={24} />
                </button>
              )}

              {/* Document PDF rendu page par page */}
              <div
                style={{
                  width: "100%",
                  maxWidth: isFullscreen ? "90vw" : 920,
                  padding: 8,
                }}
              >
                <Document
                  file={fileBlobUrl || fileUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading=""
                >
                  <Page
                    pageNumber={currentPage}
                    width={isFullscreen ? Math.floor(window.innerWidth * 0.85) : 900}
                    renderAnnotationLayer={false}
                    renderTextLayer={true}
                  />
                </Document>
              </div>

              {/* Bouton suivant */}
              {!loading && totalPages > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNextPage();
                  }}
                  disabled={currentPage === totalPages}
                  style={{
                    position: "absolute",
                    right: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 10,
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    border: "none",
                    color: "white",
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: currentPage === totalPages ? 0.3 : 1,
                    transition: "all 0.2s ease",
                  }}
                >
                  <FiChevronRight size={24} />
                </button>
              )}

              {/* Indicateur de page overlay */}
              {!loading && totalPages > 1 && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "16px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    color: "white",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    fontSize: "14px",
                    fontWeight: 600,
                    zIndex: 10,
                  }}
                >
                  {currentPage} / {totalPages}
                </div>
              )}
            </div>

            {/* Barre de miniatures */}
            {!loading && totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  padding: "12px",
                  backgroundColor: "white",
                  overflowX: "auto",
                  borderTop: "1px solid var(--border-color, #edeff1)",
                }}
              >
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentPage(index + 1);
                    }}
                    style={{
                      minWidth: "60px",
                      height: "40px",
                      border:
                        currentPage === index + 1
                          ? "2px solid var(--reddit-blue)"
                          : "1px solid var(--border-color, #edeff1)",
                      borderRadius: "4px",
                      backgroundColor: currentPage === index + 1 ? "#e8f4fd" : "white",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: currentPage === index + 1 ? 600 : 400,
                      color: currentPage === index + 1 ? "var(--reddit-blue)" : "#666",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      }

      // Fallback pour erreurs ou documents non-PDF
      return (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-body" style={{ padding: "24px", textAlign: "center" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>📄</div>
            <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>
              {post.title}
            </h3>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: "inline-block",
                padding: "10px 20px",
                backgroundColor: "var(--reddit-blue)",
                color: "white",
                borderRadius: "6px",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Ouvrir le document
            </a>
          </div>
        </div>
      );
    }

    // MODE PREVIEW - Aperçu dans la liste
    if (isPDF && !pdfError) {
      return (
        <div
          className="document-preview"
          style={{
            marginTop: "12px",
            marginBottom: "12px",
            padding: "0",
            backgroundColor: "var(--bg-secondary, #f6f7f8)",
            borderRadius: "8px",
            overflow: "hidden",
            border: "1px solid var(--border-color, #edeff1)",
            cursor: "pointer",
          }}
        >
          {/* Aperçu du PDF */}
          <div
            style={{
              position: "relative",
              width: "100%",
              minHeight: "350px",
              backgroundColor: "#525659",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {loading && (
              <div style={{ color: "white", fontSize: "14px" }}>Chargement...</div>
            )}

            <div style={{ width: "100%", maxWidth: 720, padding: 8 }}>
              <Document
                file={fileBlobUrl || fileUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading=""
              >
                <Page
                  pageNumber={currentPage}
                  width={700}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                />
              </Document>
            </div>

            {/* Mini contrôles */}
            {!loading && totalPages > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevPage();
                  }}
                  disabled={currentPage === 1}
                  style={{
                    position: "absolute",
                    left: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 10,
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    backgroundColor: "rgba(0,0,0,0.6)",
                    border: "none",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    opacity: currentPage === 1 ? 0.3 : 1,
                  }}
                >
                  <FiChevronLeft size={18} />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNextPage();
                  }}
                  disabled={currentPage === totalPages}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 10,
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    backgroundColor: "rgba(0,0,0,0.6)",
                    border: "none",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                    opacity: currentPage === totalPages ? 0.3 : 1,
                  }}
                >
                  <FiChevronRight size={18} />
                </button>

                {/* Indicateur page */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "12px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    color: "white",
                    padding: "6px 12px",
                    borderRadius: "16px",
                    fontSize: "12px",
                    fontWeight: 600,
                    zIndex: 10,
                  }}
                >
                  {currentPage} / {totalPages}
                </div>
              </>
            )}
          </div>

          {/* Info en bas */}
          <div
            style={{
              padding: "8px 16px",
              backgroundColor: "white",
              borderTop: "1px solid var(--border-color, #edeff1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ fontSize: "13px", color: "#666", fontWeight: 500 }}>
              📄 {post.title}
            </div>
            {!loading && (
              <div style={{ fontSize: "12px", color: "#999" }}>
                {totalPages} {totalPages > 1 ? "pages" : "page"}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Documents non-PDF
    return (
      <div
        className="document-preview"
        style={{
          marginTop: "12px",
          marginBottom: "12px",
          padding: "24px",
          backgroundColor: "var(--bg-secondary, #f6f7f8)",
          borderRadius: "8px",
          border: "1px solid var(--border-color, #edeff1)",
          textAlign: "center",
          cursor: "pointer",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>📄</div>
        <div style={{ fontWeight: "600", marginBottom: "8px" }}>{post.title}</div>
        <div style={{ fontSize: "13px", color: "#666" }}>
          Document {fileUrl.split(".").pop().toUpperCase()}
        </div>
      </div>
    );
  }

  return null;
};

export default PostMedia;