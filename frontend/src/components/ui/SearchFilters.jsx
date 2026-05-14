import React from "react";
import { FiSearch } from "react-icons/fi";
import Avatar from "./Avatar";

const SearchFilters = ({
  onSearch,
  compact = false,
  chat = false,
  user = null, 
}) => {
  return (
    <div className={`search-filters-wrapper ${compact ? "compact" : ""} ${chat ? "chat-filter" : ""}`}>
      <form className="search-form" onSubmit={(e) => e.preventDefault()}>
        <div className={`${chat ? "search-input-container-chat" : "search-input-container"} ${compact ? "search-input-wrapper" : ""}`}>
          
          {/* Avatar utilisateur connecté */}
          {user && (
            <div className="search-avatar-prefix">
              <Avatar user={user} size="small" />
            </div>
          )}

          {/* Zone de saisie avec icône */}
          <div className="search-field-group">
            <FiSearch className="search-icon-inside" size={18} />
            <input
              type="text"
              className="search-input"
              placeholder="Rechercher sur Esat-Hub ..."
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>

        </div>
      </form>
    </div>
  );
};

export default SearchFilters;
