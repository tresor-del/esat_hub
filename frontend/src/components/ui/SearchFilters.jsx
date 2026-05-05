import React, { useState } from "react";
import { FiSearch, FiFilter } from "react-icons/fi";

const SearchFilters = ({
  onSearch, // Récupère la prop envoyée par SearchDropdown
  compact = false,
  chat = false,
}) => {
  return (
    <div className={`${compact ? "search-filters compact" : ""} ${chat ? "chat-filter": ""}`}>
      <form className="search-form" onSubmit={(e) => e.preventDefault()}>
        <div className={`${compact ? "search-input-wrapper" : ""}`}>
          <input
            type="text"
            className="form-input search-input"
            placeholder="Rechercher quelque chose"
            onChange={(e) => onSearch(e.target.value)} // Transmet la saisie en direct
          />
        </div>
      </form>
    </div>
  );
};


export default SearchFilters;
