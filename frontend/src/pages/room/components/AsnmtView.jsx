import React, { useState } from 'react'
import { useRoomData } from '../hooks/useRoomData'
import AssignmentCard from './AssignmentCard'
import AssignmentDetailsModal from '../../teacher/modals/AssignmentDetailsModal'
import AsnmtDetailModal from './modals/AsnmtDetailModal'

const AsnmtView = () => {
    const {asnmts, loadingAsnmts} = useRoomData("asnmt")
    const [asnmtDetail, setAsnmtDetail] = useState(null);


    const onpenAsnmtDetail = (asnmt) => {
        setAsnmtDetail(asnmt)
    }

    const closeAsnmtDetail = () => {
        setAsnmtDetail(null)
    }

  return (
    <div>
        {loadingAsnmts ? (
                <div className="posts-loading">Chargement des devoirs...</div>
            ) : (
                <div className="room-media-list">
                    {asnmts?.length > 0 ? (
                        asnmts 
                        .map((asnmt) => (
                            <AssignmentCard
                                key={asnmt.id}
                                asnmt={asnmt}
                                onOpen={onpenAsnmtDetail}
                            />
                        ))
                    ) : (
                        <div className="no-posts">
                            Aucun devoir en cours.
                        </div>
                    )}
                </div>
            )}

        {asnmtDetail && <AsnmtDetailModal asnmt={asnmtDetail} onClose={closeAsnmtDetail} />}
    </div>
  )
}

export default AsnmtView