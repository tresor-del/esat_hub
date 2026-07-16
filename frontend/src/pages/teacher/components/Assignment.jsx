import React, { useState } from 'react'
import { FiPlus } from "react-icons/fi";
import { useTeacherData } from '../hooks/useTeacherData';
import RoomView from './RoomView';
import { rebuildName } from '../helpers/utils';


const Assignment = () => {
    const { rooms } = useTeacherData();
    const [roomView, setRommView] = useState("")

    const closeRoom = () => {
        setRommView("")
    }

    return (
        <section className="assignment-section">
            {(rooms && !roomView) && (
            <p>Choisissez une classe et gérez les devoirs.</p>
            )}
            <div className="assignment-section-content">
                <div className="rooms">
                    {(rooms && !roomView) && (
                        rooms.rooms?.map((room) => (
                            <div
                                className='btn btn-secondary room-item'
                                key={room.id}
                                onClick={() => setRommView(room)}
                            >
                                {rebuildName(room.name)}
                            </div>
                        ))
                    )}
                </div>
                
                {roomView && (
                    <RoomView room={roomView} onclose={closeRoom} />
                )}
            </div>
        </section>
    )
}

export default Assignment;
