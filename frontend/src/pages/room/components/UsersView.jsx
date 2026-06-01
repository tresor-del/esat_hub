// ─── UsersView.jsx ────────────────────────────────────────────────────────────

import React, { useMemo, useState } from "react";
import { FiSearch } from "react-icons/fi";
import PostAuthorInfo from "../../../components/posts/PostAuthorInfo";

/**
 * @prop {Array} users  — room.users
 */
const UsersView = ({ users = [] }) => {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredUsers = useMemo(() => {
        const q = searchQuery.toLowerCase();
        if (!q) return users;
        return users.filter(
            (u) =>
                u.username?.toLowerCase().includes(q)    ||
                u.email?.toLowerCase().includes(q)       ||
                u.profil_name?.toLowerCase().includes(q) ||
                u.first_name?.toLowerCase().includes(q)  ||
                u.last_name?.toLowerCase().includes(q)
        );
    }, [users, searchQuery]);

    return (
        <div className="room-users-view">
            <div className="users-search">
                <FiSearch className="search-icon" />
                <input
                    type="text"
                    placeholder="Rechercher par nom, email ou pseudo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {searchQuery && (
                <div className="search-results-info">
                    {filteredUsers.length} résultat(s) pour "{searchQuery}"
                </div>
            )}

            <div className="users-table-container">
                <table className="users-table">
                    <tbody>
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                                <tr key={user.id} className="user-row">
                                    <td>
                                        <PostAuthorInfo
                                            user={user}
                                            variant="full"
                                            showDomain
                                            showMajor
                                        />
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="no-results">
                                    {searchQuery
                                        ? "Aucun membre trouvé pour cette recherche"
                                        : "Aucun membre dans cette salle"}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UsersView;