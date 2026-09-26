import React, { useState } from 'react'
import { FiArrowLeft, FiTrash2, FiChevronDown } from 'react-icons/fi'
import { rebuildName } from '../helpers/utils'
import { useTeacherData } from '../hooks/useTeacherData'
import CreateAsnModal from '../modals/CreateAsnModal'
import { useToast } from '../../../contexts/toastContext'
import { updateAssignment, deleteAssignment } from '../../../services/TeacherApi'
import { useQueryClient } from '@tanstack/react-query'
import AssignmentDetailsModal from '../modals/AssignmentDetailsModal'

const STATUS_LABELS = {
    DRAFT: "Brouillon",
    PUBLISHED: "Publié",
    CLOSED: "Terminé",
    ARCHIVED: "Archivé",
}

const RoomView = ({ room, onclose }) => {
    const [create, setCreate] = useState(false);
    const [editAsnmt, setEditAsnmt] = useState(null)
    const [openMenuId, setOpenMenuId] = useState(null);
    const { assignments } = useTeacherData(room);
    const [viewingAsnmt, setViewingAsnmt] = useState(null);
    console.log(assignments)
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const closeAsModal = () => {
        setCreate(false);
        setEditAsnmt(null)
    }

    const onSuccess = () => {
        setCreate(false);
        setEditAsnmt(null)
        toast({ message: "Devoir créé avec succès", type: "success" })
    }

    const invalidateAssignments = () => {
        queryClient.invalidateQueries({ queryKey: ["assignments", room?.id] });
        queryClient.invalidateQueries({ queryKey: ["asnmts", room?.id] });
    }

    const handleStatusChange = async (asnmt, newStatus) => {
        setOpenMenuId(null);
        try {
            await updateAssignment(asnmt.id, { status: newStatus });
            invalidateAssignments();
            toast({ message: "Statut mis à jour", type: "success" });
        } catch (err) {
            console.error(err);
            toast({ message: "Impossible de changer le statut", type: "error" });
        }
    }

    const handleDelete = async (asnmt) => {
        if (!window.confirm(`Supprimer le devoir "${asnmt.title}" ? Cette action est irréversible.`)) {
            return;
        }
        try {
            // await deleteAssignment(asnmt.id);
            invalidateAssignments();
            toast({ message: "Devoir supprimé", type: "success" });
        } catch (err) {
            console.error(err);
            toast({ message: "Impossible de supprimer le devoir", type: "error" });
        }
    }

    return (
        <div className='room-view'>

            {/* <div className="header">
                <div className='header-t'>
                    <div className="go-back" onClick={onclose}>
                        <FiArrowLeft size={25} />
                    </div>
                    <div className='t'>
                        <h1>{rebuildName(room?.name)}</h1>
                    </div>
                </div>

                <div className="btn btn-primary create" onClick={() => setCreate(true)}>
                    Créer un devoir.
                </div>
            </div> */}

            <div className="asnmts">
                {assignments?.length > 0 ? (
                    <>
                    {assignments.map((asnmt) => (
                        
                        <div key={asnmt.id} className='asnmt' onClick={() => setViewingAsnmt(asnmt)}>
                            <div className="asnmt-main">
                                <div className="asnmt-title">{asnmt.title}</div>
                                <div className="asnmt-meta">
                                    <span className={`status-badge status-${asnmt.status?.toLowerCase()}`}>
                                        {STATUS_LABELS[asnmt.status] || asnmt.status}
                                    </span>
                                    <span className="asnmt-due">
                                        Expire le {new Date(asnmt.due_date).toLocaleDateString('fr-FR')}
                                    </span>
                                    <span className="asnmt-submissions">
                                        {asnmt.submissions?.length || 0} soumission{asnmt.submissions?.length > 1 ? "s" : ""}
                                    </span>
                                    <span className="asnmt-submissions">
                                        {asnmt.media?.length || 0} fichier{asnmt.media?.length > 1 ? "s" : ""}
                                    </span>
                                </div>
                            </div>

                            <div className="asnmt-actions" onClick={(e) => e.stopPropagation()}>
                                <div className="status-dropdown">
                                    <button
                                        className="btn-icon"
                                        onClick={() => setOpenMenuId(openMenuId === asnmt.id ? null : asnmt.id)}
                                    >
                                        Statut <FiChevronDown size={14} />
                                    </button>
                                    {openMenuId === asnmt.id && (
                                        <div className="status-menu">
                                            {Object.entries(STATUS_LABELS).map(([key, label]) => (
                                                <div
                                                    key={key}
                                                    className={`status-menu-item ${asnmt.status === key ? "active" : ""}`}
                                                    onClick={() => handleStatusChange(asnmt, key)}
                                                >
                                                    {label}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button
                                    className="btn-icon btn-icon-danger"
                                    onClick={() => handleDelete(asnmt)}
                                    title="Supprimer"
                                >
                                    <FiTrash2 size={16} />
                                </button>
                                {/* <button
                                    className="btn-icon btn-icon-info"
                                    onClick={() => setEditAsnmt(asnmt)}
                                    title="Modifier"
                                >
                                    <FiTrash2 size={16} />
                                </button> */}
                            </div>
                        </div>
                    ))}
                    <div className="btn btn-primary create" onClick={() => setCreate(true)}>
                            Créer
                        </div>
                    </>
                ) : (
                    <div className='empty'>
                        Aucun devoir dans la salle pour l'instant.
                        <div className="btn btn-primary create" onClick={() => setCreate(true)}>
                            Créer
                        </div>
                    </div>
                )}


            </div>

            {create && <CreateAsnModal roomId={room.id} onClose={closeAsModal} onSuccess={onSuccess} />}
            {editAsnmt && <CreateAsnModal roomId={room.id} onClose={closeAsModal} onSuccess={onSuccess} editingAsnmt={editAsnmt} />}

            {viewingAsnmt && (
                <AssignmentDetailsModal
                    asnmt={viewingAsnmt}
                    onClose={() => setViewingAsnmt(null)}
                    onSubmissionUpdated={() => {
                        invalidateAssignments();
                    }}
                />
            )}
        </div>
    )
}

export default RoomView