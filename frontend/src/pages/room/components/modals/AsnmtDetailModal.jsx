import React, { useRef, useState } from "react";
import { FiFileText } from "react-icons/fi";
import { getMediaUrl } from "../../utils/mediaHelpers";
import { Countdown } from "../../utils/AsnmtCountDown";
import { createSubmission } from "../../../../services/TeacherApi";
import { useAuth } from "../../../../contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

const AsnmtDetailModal = ({ asnmt, onClose }) => {
    if (!asnmt) return null;
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [selectedFiles, setSelectedFiles] = useState([]);
    const fileInputRef = useRef();

    const handleFileChange = (e) => {
        const filesArray = Array.from(e.target.files);
        setSelectedFiles(filesArray)
        e.target.value = "";
    }

    const handleSubmitAsnmt = async (e) => {
        e.preventDefault();
        try {
            const response = await createSubmission({
                assignmentId: asnmt?.id,
                files: selectedFiles
            })

            queryClient.invalidateQueries({ queryKey: ["assignments", asnmt.room_id] })
            onClose();
            // toast({message: "Devoir envoyé avec succès", type: "success"})
        } catch (error) {
            console.log(error)
        }
    }

    const getSub = () => {
        return asnmt.submissions?.filter((a) => a.student_id === user.id)
    }

    return (
        <div className="media-detail-overlay" onClick={onClose}>
            <div className="media-detail-modal" onClick={(e) => e.stopPropagation()}>

                <div className="media-detail-header">
                    <div>
                        {/* <span className="media-item-badge">{formatMediaType(media)}</span> */}
                        <h3><strong>{asnmt.title}</strong></h3>
                        <p style={{ color: "var(--text-muted-darker)" }}>{asnmt.description || "Pas de description fournie."}</p>
                    </div>
                    <button type="button" className="modal-close-btn" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="asnmt-detail-media">
                    <span>Fichiers associés: </span>
                    {asnmt.media?.length > 0 && (
                        asnmt.media
                            .map((m) => (
                                <a target="_blank" key={m.id} href={`${getMediaUrl(m)}`}> {m.file_name} </a>
                            ))
                    )}
                </div>

                {getSub().length > 0 ? (
                    <>
                        <div style={{color: "red"}}>Vous avez déjà soumi votre devoir</div>
                        <div>{getSub()[0].grade ? `Note: ${getSub()[0].grade}` : " Pas encore noté."}</div>
                        {getSub()[0].feedback && (

                            <div><strong>{asnmt.teacher?.full_name}</strong>: {getSub()[0].feedback}</div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="sep"></div>
                        <h1 style={{ fontSize: "1.5rem" }}>Envoyer votre devoir !</h1>

                        <form action="" className="media-upload-form" onSubmit={handleSubmitAsnmt}>

                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                onChange={handleFileChange}
                                style={{ display: "none" }}
                            />

                            <div className="btn btn-secondary" onClick={() => fileInputRef.current.click()}>
                                Choisir des documents
                            </div>

                            <div className="asnmt-detail-media">
                                {selectedFiles?.length > 0 && (
                                    <>
                                        {selectedFiles.map((m, index) => (
                                            <a key={index}>
                                                {m.name}
                                                <button
                                                    type="button"
                                                    className="btn"
                                                    onClick={() => setSelectedFiles(selectedFiles.filter(x => x.name !== m.name))}
                                                >
                                                    Retirer
                                                </button>
                                            </a>
                                        ))}
                                    </>
                                )}
                            </div>

                            {selectedFiles?.length > 0 ? (

                                <button className="btn btn-primary" type="submit">Envoyer mon devoir</button>
                            ) : (
                                <button disabled className="btn btn-primary" type="submit">Envoyer mon devoir</button>

                            )}

                        </form>
                    </>
                )}


                <div className="media-detail-footer">
                    <div>
                        <strong>Auteur :</strong>{" "}
                        {asnmt.teacher?.full_name || "Anonyme"}
                    </div>
                    <div>
                        <strong>Temps restant :</strong>{" "}
                        {asnmt?.due_date
                            ? <Countdown dueDate={asnmt.due_date} />
                            : "N/A"}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AsnmtDetailModal;