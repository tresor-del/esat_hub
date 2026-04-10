import React, { useState } from 'react';
import DropdownMenu from '../ui/DropdownMenu';
import SearchFilters from '../ui/SearchFilters';

const SearchDropdown = () => {
  const [results, setResults] = useState([]); // Stocke tes résultats ici
  const [query, setQuery] = useState("");

  // Simulation d'une recherche (à remplacer par ton appel API)
  const handleSearch = (value) => {
    setQuery(value);
    if (value.length > 2) {
      // Exemple de données
      setResults([{ id: 1, name: "Résultat pour " + value }]);
    } else {
      setResults([]);
    }
  };

  return (
    <DropdownMenu 
      trigger={<SearchFilters onSearch={handleSearch} compact={true} />} 
      align="center"
      forcedOpen={query.length > 0} // S'ouvre dès qu'on tape quelque chose
    >
      <div className="search-result-container">
        <h4>Résultats pour "{query}"</h4>
        {results.length > 0 ? (
          <ul className="results-list">
            {results.map(item => (
              <li key={item.id} className="result-item" role="menuitem" tabIndex="0">
                {item.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-results">Aucun résultat trouvé.</p>
        )}
      </div>
    </DropdownMenu>
  );
};

export default SearchDropdown;