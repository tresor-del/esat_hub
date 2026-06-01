// ─── RoomSidebar.jsx ──────────────────────────────────────────────────────────

import React  from "react";
import { FiImage, FiUsers } from "react-icons/fi";
import { ROOM_DISPLAY_NAMES } from "../utils/mediaHelpers";

/**
 * @prop {object}   room
 * @prop {"users"|"posts"|"media"} view
 * @prop {Function} onViewChange
 */
const RoomSidebar = ({ room, view, onViewChange }) => {
    const displayName =
        ROOM_DISPLAY_NAMES[room?.name] || room?.name || "";

    return (
        <div className="room-left">
            <div className="room-name">
                <h3>{displayName}</h3>
            </div>
            <div className="room-btns">
                <button
                    type="button"
                    className={`btn room-media-btn ${view === "media" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => onViewChange("media")}
                    aria-label="Voir les médias"
                >
                    <FiImage  />
                    <span className="btn-label">Fichiers</span>
                </button>
                <button
                    type="button"
                    className={`btn room-media-btn ${view === "users" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => onViewChange("users")}
                    aria-label="Voir les membres"
                >
                    <FiUsers  />
                    <span className="btn-label">Membres</span>
                </button>
            </div>
        </div>
    );
};

export default RoomSidebar;