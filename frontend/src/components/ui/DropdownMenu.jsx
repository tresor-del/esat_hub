import React, { useState, useRef, useEffect } from "react";
import "../../styles/DropdownMenu.css"

const DropdownMenu = ({
  trigger,
  children,
  align = "left",
  className = "",
  forcedOpen = null,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  // On utilise forcedOpen s'il est fourni, sinon le state interne
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  // utility to get focusable elements
  const getFocusable = (el) => {
    if (!el) return [];
    return Array.from(
      el.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])',
      ),
    );
  };

  useEffect(() => {
    const onDocClick = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handleClose = () => setOpen(false);

  // Keyboard handling: Esc to close, trap focus when open
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!open) return;
      // Close on Escape
      if (e.key === "Escape") {
        setOpen(false);
        // restore focus to trigger
        if (triggerRef.current) triggerRef.current.focus();
      }

      if (e.key === "Tab") {
        const menuEl = menuRef.current;
        const focusable = getFocusable(menuEl);
        if (focusable.length === 0) {
          // nothing to focus in menu -> prevent leaving
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // When opening, move focus to first focusable element inside menu (or to menu if none)
  useEffect(() => {
    if (!open) return;
    const menuEl = menuRef.current;
    const focusable = getFocusable(menuEl);
    if (focusable.length > 0) {
      // small timeout to ensure element is in DOM
      setTimeout(() => focusable[0].focus(), 0);
    } else if (menuEl) {
      // if nothing focusable, focus the menu container for screen readers
      menuEl.setAttribute("tabindex", "-1");
      setTimeout(() => menuEl.focus(), 0);
    }
  }, [open]);

  return (
    <div ref={ref} className={`dropdown-menu-wrapper ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        className="menu-button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open)
        }}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {trigger}
      </button>

      {open && (
        <div
          ref={menuRef}
          className={`menu-dropdown ${align === "right" ? "align-right" : "align-left"}`}
          role="menu"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      )}

      
    </div>
  );
};

export default DropdownMenu;
