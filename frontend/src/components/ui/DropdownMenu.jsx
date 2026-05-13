  import React, { useState, useRef, useEffect } from "react";
  import { FiX } from "react-icons/fi";
  import "../../styles/DropdownMenu.css";

  /**
   * DropdownMenu
   * - Desktop : petit menu flottant sous le trigger
   * - Mobile  : panneau plein-écran avec header et bouton fermer
   *
   * Props :
   *   trigger   – élément React affiché comme bouton d'ouverture
   *   children  – contenu du menu
   *   align     – "left" | "right" (position desktop, défaut "left")
   *   title     – titre affiché sur mobile (défaut "Menu")
   *   className – classe CSS supplémentaire sur le wrapper
   */
  const DropdownMenu = ({
    trigger,
    children,
    align = "left",
    title = "Menu",
    className = "",
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const wrapperRef = useRef(null);

    /* Détection responsive */
    useEffect(() => {
      const onResize = () => setIsMobile(window.innerWidth <= 768);
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }, []);

    /* Bloquer le scroll body en mode plein-écran mobile */
    useEffect(() => {
      document.body.style.overflow = isMobile && isOpen ? "hidden" : "";
      return () => { document.body.style.overflow = ""; };
    }, [isOpen, isMobile]);

    /* Fermer en cliquant en dehors (desktop uniquement) */
    useEffect(() => {
      if (isMobile || !isOpen) return;
      const onClickOutside = (e) => {
        if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", onClickOutside);
      return () => document.removeEventListener("mousedown", onClickOutside);
    }, [isOpen, isMobile]);

    const open  = () => setIsOpen(true);
    const close = () => setIsOpen(false);
    const toggle = () => setIsOpen((prev) => !prev);

    return (
      <div ref={wrapperRef} className={`dropdown-wrapper ${className}`}>
        {/* Trigger */}
        <button type="button" className="dropdown-trigger" onClick={toggle}>
          {trigger}
        </button>

        {/* Contenu */}
        {isOpen && (
          <>
            {isMobile ? (
              /* ── Mobile : plein écran ── */
              <div className="dropdown-fullscreen">
                <div className="dropdown-fullscreen-header">
                  <h4>{title}</h4>
                  <button className="dropdown-close-btn" onClick={close} aria-label="Fermer">
                    <FiX size={20} />
                  </button>
                </div>
                <div className="dropdown-fullscreen-body">
                  {children}
                </div>
              </div>
            ) : (
              /* ── Desktop : flottant ── */
              <div className={`dropdown-panel dropdown-panel--${align}`}>
                {children}
              </div>
            )}

            {/* Overlay desktop (ferme au clic à côté) */}
            {!isMobile && (
              <div className="dropdown-overlay" onClick={close} />
            )}
          </>
        )}
      </div>
    );
  };

  export default DropdownMenu;