import React, { useEffect, useState } from 'react'
import Media from './components/Media'
import Assignment from './components/Assignment'
import { useTeacherData } from './hooks/useTeacherData'


const VIEWS = { ASSIGNMENT: "assignment", MEDIA: "media" }

const Home = () => {
  const [view, setView] = useState(VIEWS.ASSIGNMENT)

  // const { rooms } = useTeacherData();


  return (
    <div className='home-page'>
      <h1 className='title'>Tableau de bord enseignant</h1>
      <div className="sep" />

      <div className="actions-btns">
        <div className={`btn ${view === VIEWS.ASSIGNMENT ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setView(VIEWS.ASSIGNMENT)}
        >
          Devoir
        </div>
        <div className={`btn ${view === VIEWS.MEDIA ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setView(VIEWS.MEDIA)}
        >
          Envoyer un fichier
        </div>
      </div>

      {view === VIEWS.ASSIGNMENT && <Assignment />}
      {view === VIEWS.MEDIA && <Media />}
    </div>
  )
}

export default Home