import React, { useState, useEffect } from "react";
import { 
  FiUsers, FiFileText, FiMessageSquare, FiBarChart2, 
  FiSearch, FiFilter, FiToggleLeft, FiToggleRight, FiTrash2,
  FiEdit, FiMoreVertical, FiUserCheck, FiUserX, FiActivity
} from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";
import { 
  getAllUsers, searchUsers, updateUserStatus, 
  getAllPostsAdmin, updatePostStatus, deletePostAdmin,
  getAdminStats, getPostStatistics, getCommentStatistics,
  getAllCommentsAdmin
} from "../../services/adminApi";
import PostAuthorInfo from "../../components/posts/PostAuthorInfo";
import "../../styles/AdminDashboard.css";

const AdminDashboard = () => {
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState(null);
  const [postStats, setPostStats] = useState(null);
  const [commentStats, setCommentStats] = useState(null);

  // Filter states
  const [userStatusFilter, setUserStatusFilter] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [postStatusFilter, setPostStatusFilter] = useState("");
  const [postTypeFilter, setPostTypeFilter] = useState("");
  const [postRoomFilter, setPostRoomFilter] = useState("");

  // Check if user is admin
  const isAdmin = authUser?.role === "ADMIN";

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, activeTab, userStatusFilter, userRoleFilter, postStatusFilter, postTypeFilter, postRoomFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load stats
      const statsData = await getAdminStats();
      setStats(statsData);
      console.log("stats: ", statsData)

      if (activeTab === "users") {
        const data = await getAllUsers({ 
          limit: 100,
          status: userStatusFilter || null,
          role: userRoleFilter || null
        });
        setUsers(data.users || []);
      } else if (activeTab === "posts") {
        const roomId = postRoomFilter ? parseInt(postRoomFilter) : null;
        const [postsData, postStatsData] = await Promise.all([
          getAllPostsAdmin({ 
            limit: 100,
            status: postStatusFilter || null,
            postType: postTypeFilter || null,
            roomId: postRoomFilter === "" ? null : (postRoomFilter === "0" ? 0 : parseInt(postRoomFilter))
          }),
          getPostStatistics()
        ]);
        setPosts(postsData.posts || []);
        setPostStats(postStatsData);
      } else if (activeTab === "comments") {
        const [commentsData, commentStatsData] = await Promise.all([
          getAllCommentsAdmin({ limit: 100 }),
          getCommentStatistics()
        ]);
        setComments(commentsData.comments || []);
        setCommentStats(commentStatsData);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadData();
      return;
    }
    setLoading(true);
    try {
      const data = await searchUsers(searchQuery);
      setUsers(data.results || []);
    } catch (error) {
      console.error("Erreur lors de la recherche:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await updateUserStatus(userId, newStatus);
      loadData();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
    }
  };

  const handleTogglePostStatus = async (postId, currentStatus) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await updatePostStatus(postId, newStatus);
      loadData();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce post?")) return;
    try {
      await deletePostAdmin(postId);
      loadData();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  if (!isAdmin) {
    return (
      <div className="admin-dashboard">
        <div className="admin-access-denied">
          <FiUserX size={48} />
          <h2>Accès refusé</h2>
          <p>Vous n'avez pas les droits administrateur pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Tableau de bord administrateur</h1>
        <p>Gérez les utilisateurs et le contenu de la plateforme</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="admin-stats-grid">
          <div className="stat-card">
            <FiUsers className="stat-icon" />
            <div className="stat-content">
              <span className="stat-value">{stats.total_users || 0}</span>
              <span className="stat-label">Utilisateurs</span>
            </div>
          </div>
          <div className="stat-card">
            <FiFileText className="stat-icon" />
            <div className="stat-content">
              <span className="stat-value">{stats.total_posts || 0}</span>
              <span className="stat-label">Publications</span>
            </div>
          </div>
          <div className="stat-card">
            <FiMessageSquare className="stat-icon" />
            <div className="stat-content">
              <span className="stat-value">{stats.total_comments || 0}</span>
              <span className="stat-label">Commentaires</span>
            </div>
          </div>
          <div className="stat-card">
            <FiActivity className="stat-icon" />
            <div className="stat-content">
              <span className="stat-value">{stats.active_users || 0}</span>
              <span className="stat-label">Utilisateurs actifs</span>
            </div>
          </div>
        </div>
      )}

      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          <FiUsers />
          <span>Utilisateurs</span>
          {stats?.total_users && <span className="badge">{stats.total_users}</span>}
        </button>
        <button 
          className={`admin-tab ${activeTab === "posts" ? "active" : ""}`}
          onClick={() => setActiveTab("posts")}
        >
          <FiFileText />
          <span>Publications</span>
          {stats?.total_posts && <span className="badge">{stats.total_posts}</span>}
        </button>
        <button 
          className={`admin-tab ${activeTab === "comments" ? "active" : ""}`}
          onClick={() => setActiveTab("comments")}
        >
          <FiMessageSquare />
          <span>Commentaires</span>
          {stats?.total_comments && <span className="badge">{stats.total_comments}</span>}
        </button>
      </div>

      <div className="admin-search-bar">
        <form onSubmit={handleSearch}>
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder={activeTab === "users" ? "Rechercher des utilisateurs..." : "Rechercher des publications..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit">Rechercher</button>
        </form>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        {activeTab === "users" && (
          <>
            <select 
              value={userStatusFilter} 
              onChange={(e) => setUserStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Tous les statuts</option>
              <option value="ACTIVE">Actif</option>
              <option value="INACTIVE">Inactif</option>
              <option value="PENDING">En attente</option>
            </select>
            <select 
              value={userRoleFilter} 
              onChange={(e) => setUserRoleFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Tous les rôles</option>
              <option value="ADMIN">Administrateur</option>
              <option value="STUDENT">Étudiant</option>
            </select>
          </>
        )}
        {activeTab === "posts" && (
          <>
            <select 
              value={postStatusFilter} 
              onChange={(e) => setPostStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Tous les statuts</option>
              <option value="ACTIVE">Actif</option>
              <option value="INACTIVE">Inactif</option>
            </select>
            <select 
              value={postTypeFilter} 
              onChange={(e) => setPostTypeFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Tous les types</option>
              <option value="GENERAL">Général</option>
              <option value="ROOM">Groupe</option>
              <option value="EVENT">Événement</option>
            </select>
            <select 
              value={postRoomFilter} 
              onChange={(e) => setPostRoomFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Toutes les publications</option>
              <option value="0">Publications générales</option>
              <option value="1">Groupe 1</option>
              <option value="2">Groupe 2</option>
              <option value="3">Groupe 3</option>
              <option value="4">Groupe 4</option>
              <option value="5">Groupe 5</option>
            </select>
          </>
        )}
      </div>

      <div className="admin-content">
        {loading ? (
          <div className="admin-loading">Chargement...</div>
        ) : activeTab === "users" ? (
          <UsersList 
            users={users} 
            onToggleStatus={handleToggleUserStatus} 
          />
        ) : activeTab === "posts" ? (
          <PostsList 
            posts={posts} 
            postStats={postStats}
            onToggleStatus={handleTogglePostStatus}
            onDelete={handleDeletePost}
          />
        ) : (
          <CommentsList 
            comments={comments} 
            commentStats={commentStats}
          />
        )}
      </div>
    </div>
  );
};


const UsersList = ({ users, onToggleStatus }) => {
  if (!users.length) {
    return <div className="admin-empty">Aucun utilisateur trouvé</div>;
  }

  return (
    <div className="admin-list">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Utilisateur</th>
            <th>Rôle</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                <PostAuthorInfo user={user} variant="compact" />
              </td>
              <td>
                <span className={`role-badge role-${user.role?.toLowerCase()}`}>
                  {user.role}
                </span>
              </td>
              <td>
                <span className={`status-badge status-${user.status?.toLowerCase()}`}>
                  {user.status}
                </span>
              </td>
              <td>
                <button
                  className="action-btn"
                  onClick={() => onToggleStatus(user.id, user.status)}
                  title={user.status === "ACTIVE" ? "Désactiver" : "Activer"}
                >
                  {user.status === "ACTIVE" ? (
                    <FiToggleLeft size={20} className="active-toggle" />
                  ) : (
                    <FiToggleRight size={20} className="inactive-toggle" />
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const PostsList = ({ posts, onToggleStatus, onDelete }) => {
  if (!posts.length) {
    return <div className="admin-empty">Aucune publication trouvée</div>;
  }

  return (
    <div className="admin-list">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Titre</th>
            <th>Auteur</th>
            <th>Type</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id}>
              <td>
                <div className="post-info">
                  <span className="post-title">{post.title}</span>
                  {post.description && (
                    <span className="post-description">
                      {post.description.substring(0, 50)}...
                    </span>
                  )}
                </div>
              </td>
              <td>
                <PostAuthorInfo user={post.user} variant="compact"/>
              </td>
              <td>
                <span className="type-badge">{post.post_type || "GENERAL"}</span>
              </td>
              <td>
                <span className={`status-badge status-${post.status?.toLowerCase()}`}>
                  {post.status || "ACTIVE"}
                </span>
              </td>
              <td>
                <div className="action-buttons">
                  <button
                    className="action-btn"
                    onClick={() => onToggleStatus(post.id, post.status)}
                    title={post.status === "ACTIVE" ? "Désactiver" : "Activer"}
                  >
                    {post.status === "ACTIVE" ? (
                      <FiToggleLeft size={20} className="active-toggle" />
                    ) : (
                      <FiToggleRight size={20} className="inactive-toggle" />
                    )}
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => onDelete(post.id)}
                    title="Supprimer"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const CommentsList = ({ comments, commentStats }) => {
  if (!comments.length) {
    return <div className="admin-empty">Aucun commentaire trouvé</div>;
  }

  return (
    <div className="admin-list">
      {commentStats && (
        <div className="comments-stats">
        </div>
      )}
      <table className="admin-table">
        <thead>
          <tr>
            <th>Commentaire</th>
            <th>Auteur</th>
            <th>Post</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {comments.map((comment) => (
            <tr key={comment.id}>
              <td>
                <div className="comment-content">
                  <span className="comment-text">{comment.content?.substring(0, 80)}...</span>
                </div>
              </td>
              <td>
                <PostAuthorInfo user={comment.user || comment.author} variant="compact" />
              </td>
              <td>
                <span className="post-link">{comment.post?.title || `Post #${comment.post_id}`}</span>
              </td>
              <td>
                <span className="date-text">
                  {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : '-'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;