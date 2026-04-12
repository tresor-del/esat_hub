import React, { useState } from 'react';
import DropdownMenu from '../ui/DropdownMenu';
import SearchFilters from '../ui/SearchFilters';
import { searchPosts } from '../../services/api';
import { useCallback } from 'react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatRelativeDate } from '../../utils/dateFormatter';
import { useRef, useEffect } from 'react';
import Avatar from '../ui/Avatar';
import "../../styles/Search.css"

const SearchDropdown = () => {
  const [results, setResults] = useState([]);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const searchRef = useRef(null);

  const handleSearch = async (value) => {
    setQuery(value);
    if (value.length > 2) {
      const result = await searchPosts(value);
      setResults(result);
    } else {
      setResults([]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setQuery(""); // Ferme les résultats si on clique ailleurs
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const highlightText = (text, query) => {
    if (!query || !text) return text;

    // On crée une regex insensible à la casse
    const parts = text.split(new RegExp(`(${query})`, 'gi'));

    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="highlight">{part}</mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };


  return (
    <div className="search-dropdown-wrapper" ref={searchRef}>
      {/* L'input est ici, indépendant du dropdown */}
      <SearchFilters onSearch={handleSearch} compact={true} />

      {/* Le menu ne s'affiche que s'il y a une query */}
      {query.length > 0 && (
        <div className="menu-dropdown align-center">
          <div className="search-result-container">

            {/* Vérifie si on a au moins un post ou un utilisateur */}
            {(results.posts_list?.posts.length > 0 || results.users_list?.users.length > 0) ? (
              <div className="results-list">

                {/* SECTION UTILISATEURS */}
                {results.users_list?.users.length > 0 && (
                  <div className="results-section">
                    <h5>Users</h5>
                    {results.users_list.users.map(user => (
                      <div key={user.id} className="result-item" onClick={() => navigate(`/profile/${user.username}`)}>
                        <Avatar user={user} size="small" />
                        <div className="result-info">
                          <span className="result-title">{highlightText(user.username, query)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* SECTION POSTS */}
                {results.posts_list?.posts.length > 0 && (
                  <div className="results-section">
                    <h5>Publications</h5>
                    {results.posts_list.posts.map(post => (
                      <div key={post.id} className="result-item" onClick={() => navigate(`/post/${post.id}`)}>
                        <Avatar user={post.user} size="small" />
                        <div className="result-info">
                          <span className="result-subtitle">{post.user?.username}</span>
                          <span className="result-title">{highlightText(post.title, query)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            ) : (
              <p className="no-results">Aucun résultat trouvé pour cette recherche.</p>
            )}
          </div>

        </div>
      )}
    </div>
  );
};


export default SearchDropdown;