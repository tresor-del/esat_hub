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
            <h2 className="room-name">{displayName}</h2>
            <div className="room-btns">
                <button
                    type="button"
                    className={`room-media-btn ${view === "users" ? "active" : ""}`}
                    onClick={() => onViewChange("users")}
                    aria-label="Voir les membres"
                >
                    <FiUsers  />
                    <span className="btn-label">Membres</span>
                </button>
                <button
                    type="button"
                    className={`room-media-btn ${view === "media" ? "active" : ""}`}
                    onClick={() => onViewChange("media")}
                    aria-label="Voir les médias"
                >
                    <FiImage  />
                    <span className="btn-label">Fichiers</span>
                </button>

                <button
                    type="button"
                    className={`room-media-btn ${view === "attendance" ? "active" : ""}`}
                    onClick={() => onViewChange("attendance")}
                    aria-label="Système de présence aux cours"
                >
                    <FiUsers  />
                    <span className="btn-label">Présence</span>
                </button>
                
            </div>
        </div>
    );
};

export default RoomSidebar;