import React, { useState } from "react";
import { FiSearch, FiFilter } from "react-icons/fi";

const SearchFilters = ({
  initialQuery = "",
  initialFilter = "all",
  compact = false,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [filterType, setFilterType] = useState(initialFilter);

  // Event Bus: Déclenché l'event qui sera écouté par le home lors des recherches
  const submit = (e) => {
    if (e) e.preventDefault();
    window.dispatchEvent(
      new CustomEvent("app:search", {
        detail: { query: query.trim(), filterType },
      }),
    );
  };  

  return (

    <div className={`search-filters ${compact ? "compact" : ""}`}>
      <form onSubmit={submit} className="search-form">
        <div className="search-input-wrapper">
          {/* <FiSearch className="search-icon" /> */}
          <input
            type="text"
            className="form-input search-input"
            placeholder="Rechercher quelque chose"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </form>
    </div>
  );
};

export default SearchFilters;
