import React, { useState } from 'react'
import { FiArrowLeft, FiBookOpen, FiFileText } from 'react-icons/fi'
import Media from './components/Media'
import Assignment from './components/Assignment'
import { useTeacherData } from './hooks/useTeacherData'
import { rebuildName } from './helpers/utils'

const VIEWS = { ASSIGNMENT: 'assignment', MEDIA: 'media' }

const Home = () => {
  const [view, setView] = useState(VIEWS.ASSIGNMENT)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const { rooms } = useTeacherData()

  const roomList = Array.isArray(rooms?.rooms)
    ? rooms.rooms
    : Array.isArray(rooms)
      ? rooms
      : []

  const handleSelectRoom = (room) => {
    setSelectedRoom(room)
    setView(VIEWS.ASSIGNMENT)
  }

  const handleResetSelection = () => {
    setSelectedRoom(null)
    setView(VIEWS.ASSIGNMENT)
  }

  return (
    <div className='home-page'>
      <div className='teacher-home-shell'>
        {!selectedRoom && (
          <div className='teacher-home-header'>
            <div>
              <h1 className='t-title'>Tableau de bord</h1>
            </div>
          </div>
        )}

        {!selectedRoom ? (
          <section className='teacher-room-selector'>
            <div className='teacher-room-selector__header'>
              <h2>Choisir une classe</h2>
              <p>Sélectionnez la classe concernée pour accéder aux actions.</p>
            </div>

            <div className='teacher-room-grid'>
              {roomList.length > 0 ? (
                roomList.map((room) => (
                  <button
                    key={room.id}
                    className='teacher-room-card'
                    onClick={() => handleSelectRoom(room)}
                    type='button'
                  >
                    <span className='teacher-room-card__icon'>
                      <FiBookOpen size={20} />
                    </span>
                    <span className='teacher-room-card__title'>
                      {rebuildName(room.name) || room.name}
                    </span>
                    <span className='teacher-room-card__meta'>
                      {room.level || 'Classe'}
                    </span>
                  </button>
                ))
              ) : (
                <p className='teacher-room-empty'>Aucune classe disponible pour le moment.</p>
              )}
            </div>
          </section>
        ) : (
          <>
            <div className='teacher-room-toolbar teacher-room-toolbar--detail'>
              <div className='teacher-room-title teacher-room-title--detail'>
                <h2>{rebuildName(selectedRoom.name) || selectedRoom.name}</h2>
                {selectedRoom.level && (
                  <p>{selectedRoom.level}</p>
                )}
              </div>

              <button className='teacher-room-back' onClick={handleResetSelection} type='button'>
                <FiArrowLeft size={18} />
                <span>Retour</span>
              </button>
            </div>

            <div className='teacher-view-switcher'>
              <button
                className={`teacher-view-pill ${view === VIEWS.ASSIGNMENT ? 'active' : ''}`}
                onClick={() => setView(VIEWS.ASSIGNMENT)}
                type='button'
              >
                <FiBookOpen size={18} />
                <span>Devoirs</span>
              </button>
              <button
                className={`teacher-view-pill ${view === VIEWS.MEDIA ? 'active' : ''}`}
                onClick={() => setView(VIEWS.MEDIA)}
                type='button'
              >
                <FiFileText size={18} />
                <span>Fichiers</span>
              </button>
            </div>

            <div className='teacher-view-content'>
              {view === VIEWS.ASSIGNMENT && <Assignment room={selectedRoom} onBack={handleResetSelection} />}
              {view === VIEWS.MEDIA && <Media room={selectedRoom} />}
            </div>

            <div className='teacher-mobile-actions'>
              <button
                className={`teacher-mobile-action ${view === VIEWS.ASSIGNMENT ? 'active' : ''}`}
                onClick={() => setView(VIEWS.ASSIGNMENT)}
                type='button'
              >
                <FiBookOpen size={20} />
                <span>Devoirs</span>
              </button>
              <button
                className={`teacher-mobile-action ${view === VIEWS.MEDIA ? 'active' : ''}`}
                onClick={() => setView(VIEWS.MEDIA)}
                type='button'
              >
                <FiFileText size={20} />
                <span>Fichiers</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Home