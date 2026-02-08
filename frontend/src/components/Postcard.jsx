/**
 * Composant PostCard - Carte de poste style Reddit
 * Affiche un poste avec votes, titre, description et actions
 */

import { useState } from 'react';
import { FiArrowUp, FiArrowDown, FiMessageSquare, FiShare2, FiEdit, FiTrash2 } from 'react-icons/fi';
import { getPostFileUrl } from '../services/api';

const PostCard = ({ post, onEdit, onDelete, onView }) => {
  // État local pour le vote (simulation - pas implémenté dans le backend)
  const [voteCount, setVoteCount] = useState(0);
  const [userVote, setUserVote] = useState(null); // null, 'up', ou 'down'

  /**
   * Gérer le vote positif
   */
  const handleUpvote = () => {
    if (userVote === 'up') {
      // Annuler le vote
      setUserVote(null);
      setVoteCount(voteCount - 1);
    } else if (userVote === 'down') {
      // Changer de vote négatif à positif
      setUserVote('up');
      setVoteCount(voteCount + 2);
    } else {
      // Nouveau vote positif
      setUserVote('up');
      setVoteCount(voteCount + 1);
    }
  };

  /**
   * Gérer le vote négatif
   */
  const handleDownvote = () => {
    if (userVote === 'down') {
      // Annuler le vote
      setUserVote(null);
      setVoteCount(voteCount + 1);
    } else if (userVote === 'up') {
      // Changer de vote positif à négatif
      setUserVote('down');
      setVoteCount(voteCount - 2);
    } else {
      // Nouveau vote négatif
      setUserVote('down');
      setVoteCount(voteCount - 1);
    }
  };

  /**
   * Formater la date de création
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Il y a quelques minutes';
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    if (diffInHours < 48) return 'Hier';
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Il y a ${diffInDays} jours`;
    
    return date.toLocaleDateString('fr-FR');
  };

  /**
   * Gérer le clic sur la carte pour voir les détails
   */
  const handleCardClick = (e) => {
    // Ne pas ouvrir si on clique sur un bouton
    if (e.target.closest('button')) return;
    
    if (onView) {
      onView(post);
    }
  };

  return (
    <div className="post-card" onClick={handleCardClick}>
      {/* Section de vote (gauche) */}
      <div className="post-vote">
        <button 
          className="vote-button"
          onClick={(e) => {
            e.stopPropagation();
            handleUpvote();
          }}
          style={{ color: userVote === 'up' ? 'var(--reddit-orange)' : undefined }}
        >
          <FiArrowUp />
        </button>
        
        <span className="vote-count">{voteCount}</span>
        
        <button 
          className="vote-button"
          onClick={(e) => {
            e.stopPropagation();
            handleDownvote();
          }}
          style={{ color: userVote === 'down' ? 'var(--reddit-blue)' : undefined }}
        >
          <FiArrowDown />
        </button>
      </div>

      {/* Contenu du poste */}
      <div className="post-content">
        {/* Métadonnées */}
        <div className="post-meta">
          {/* Badge du type de poste */}
          <span className={`post-badge badge-${post.post_type}`}>
            {post.post_type === 'photo' ? '📷 Photo' : '📄 Document'}
          </span>
          
          {/* Date de création */}
          <span>•</span>
          <span>{formatDate(post.created_at)}</span>
        </div>

        {/* Titre du poste */}
        <h3 className="post-title">{post.title}</h3>

        {/* Description */}
        {post.description && (
          <p className="post-description">{post.description}</p>
        )}

        {/* Aperçu de l'image si c'est une photo */}
        {post.post_type === 'photo' && (
          <div style={{ marginTop: '12px', marginBottom: '12px' }}>
            <img 
              src={getPostFileUrl(post.id)}
              alt={post.title}
              style={{
                maxWidth: '100%',
                maxHeight: '400px',
                borderRadius: '4px',
                objectFit: 'cover',
              }}
              onError={(e) => {
                // Si l'image ne charge pas, masquer l'élément
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Actions */}
        <div className="post-actions">
          {/* Bouton Commentaires (simulé) */}
          <button 
            className="post-action-btn"
            onClick={(e) => e.stopPropagation()}
          >
            <FiMessageSquare />
            <span>Commentaires</span>
          </button>

          {/* Bouton Partager (simulé) */}
          <button 
            className="post-action-btn"
            onClick={(e) => e.stopPropagation()}
          >
            <FiShare2 />
            <span>Partager</span>
          </button>

          {/* Bouton Modifier */}
          {onEdit && (
            <button 
              className="post-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(post);
              }}
              style={{ color: 'var(--reddit-blue)' }}
            >
              <FiEdit />
              <span>Modifier</span>
            </button>
          )}

          {/* Bouton Supprimer */}
          {onDelete && (
            <button 
              className="post-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(post);
              }}
              style={{ color: '#d32f2f' }}
            >
              <FiTrash2 />
              <span>Supprimer</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostCard;