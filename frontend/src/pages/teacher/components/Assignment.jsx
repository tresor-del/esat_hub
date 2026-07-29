import React from 'react'
import RoomView from './RoomView'

const Assignment = ({ room, onBack }) => {
    if (!room) return null

    return (
        <section className="assignment-section">
            <RoomView room={room} onclose={onBack} />
        </section>
    )
}

export default Assignment;
