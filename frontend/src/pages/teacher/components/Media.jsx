import React, {useState, useCallback} from 'react'
import { rebuildName } from '../helpers/utils'
import MediaUploadModal from '../../room/components/modals/MediaUploadModal';

const Media = ({ room }) => {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState(null);


  const openAddModal = useCallback(() => {
    setEditingMedia(null);
    setUploadModalOpen(true);
  }, []);

  const closeUploadModal = () => {
    setEditingMedia(null);
    setUploadModalOpen(null);
  }


  return (
    <section className="teacher-section">
      <div className="teacher-section-card">
        <p>
          Ajoutez ici les fichiers que vous souhaitez partager avec les élèves de{' '}
          <strong>{rebuildName(room?.name) || room?.name || 'cette classe'}</strong>.
        </p>
        <button
          type="button"
          className="btn btn-primary media-add-btn create"
        onClick={openAddModal}
        >
          Ajouter un Fichier
        </button>
      </div>

      {uploadModalOpen && (
        <MediaUploadModal
          editingMedia={editingMedia}
          onClose={closeUploadModal}
          // onSuccess={handleUploadSuccess}
        />
      )}

    </section>
  )
}

export default Media
