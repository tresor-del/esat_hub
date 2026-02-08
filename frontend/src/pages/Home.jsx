/**
 * Page d'Accueil - Home
 * Affiche la liste de tous les postes avec filtres et recherche
 */

import { useState, useEffect } from 'react';
import { FiSearch, FiFilter } from 'react-icons/fi';
import PostCard from '../components/Postcard';
import { getPosts, searchPosts, deletePost } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  // États pour les postes
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // États pour les filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'photo', 'document'

  // États pour la pagination
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const postsPerPage = 10;

  /**
   * Charger les postes au montage et quand les filtres changent
   */
  useEffect(() => {
    loadPosts();
  }, [filterType]);

  /**
   * Charger les postes depuis l'API
   */
  const loadPosts = async (isLoadMore = false) => {
    try {
      setLoading(true);
      setError('');

      const skip = isLoadMore ? posts.length : 0;
      let result;

      // Si recherche active
      if (searchQuery.trim()) {
        result = await searchPosts(searchQuery, skip, postsPerPage);
      } else {
        // Sinon, charger avec filtre de type
        const type = filterType === 'all' ? null : filterType;
        result = await getPosts(skip, postsPerPage, type);
      }

      // Mettre à jour les postes
      if (isLoadMore) {
        setPosts([...posts, ...result.posts]);
      } else {
        setPosts(result.posts);
      }

      // Vérifier s'il y a plus de postes
      setHasMore(result.posts.length === postsPerPage);
      
    } catch (err) {
      console.error('Erreur lors du chargement des postes:', err);
      setError('Erreur lors du chargement des postes');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gérer la recherche
   */
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    loadPosts();
  };

  /**
   * Gérer le changement de filtre
   */
  const handleFilterChange = (type) => {
    setFilterType(type);
    setPage(0);
    setSearchQuery(''); // Réinitialiser la recherche
  };

  /**
   * Charger plus de postes (pagination)
   */
  const loadMore = () => {
    loadPosts(true);
  };

  /**
   * Gérer la modification d'un poste
   */
  const handleEdit = (post) => {
    navigate(`/edit/${post.id}`);
  };

  /**
   * Gérer la suppression d'un poste
   */
  const handleDelete = async (post) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${post.title}" ?`)) {
      return;
    }

    try {
      await deletePost(post.id);
      
      // Retirer le poste de la liste
      setPosts(posts.filter(p => p.id !== post.id));
      
      // Message de succès (vous pouvez ajouter un toast ici)
      alert('Poste supprimé avec succès');
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      alert('Erreur lors de la suppression du poste');
    }
  };

  /**
   * Voir les détails d'un poste
   */
  const handleView = (post) => {
    navigate(`/post/${post.id}`);
  };

  return (
    <div className="container">
      <div className="main-content">
        {/* Barre de filtres et recherche */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-body">
            <div className="filters-bar">
              {/* Barre de recherche */}
              <form onSubmit={handleSearch} style={{ flex: 1, minWidth: '250px' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input search-input"
                    placeholder="Rechercher un poste..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '40px' }}
                  />
                  <FiSearch 
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-secondary)'
                    }}
                  />
                </div>
              </form>

              {/* Boutons de filtre */}
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('all')}
                >
                  <FiFilter /> Tous
                </button>
                <button
                  className={`filter-btn ${filterType === 'photo' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('photo')}
                >
                  📷 Photos
                </button>
                <button
                  className={`filter-btn ${filterType === 'document' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('document')}
                >
                  📄 Documents
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* État de chargement */}
        {loading && posts.length === 0 ? (
          <div className="loading">
            <div className="spinner"></div>
            <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>
              Chargement des postes...
            </p>
          </div>
        ) : posts.length === 0 ? (
          // État vide
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3 className="empty-state-title">Aucun poste trouvé</h3>
            <p>
              {searchQuery 
                ? 'Aucun résultat pour votre recherche'
                : 'Soyez le premier à créer un poste !'
              }
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/create')}
              style={{ marginTop: '16px' }}
            >
              + Créer un poste
            </button>
          </div>
        ) : (
          // Liste des postes
          <>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
              />
            ))}

            {/* Bouton charger plus */}
            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <button 
                  className="btn btn-secondary"
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? 'Chargement...' : 'Charger plus'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;