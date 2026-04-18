import React, {useEffect, useState} from "react";
import { useAuth } from "../../contexts/AuthContext"
import {getUserRoom} from "../../services/api"


const Room = () => {
    const {user} = useAuth();
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true); 

    useEffect(() => {
        if (user) {

            userRoomFunc();
        }
    }, [user])    

    const userRoomFunc = async () => {
        try {
            setLoading(true);
            const result = await getUserRoom();
            if (result){
                setRoom(result);
                console.log(result)
            }   
        } catch (error) {
            console.log("Erreur lors de la récupération du room: ", error);
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div>Chargement...</div>;
    if (!room) return <div>Aucune salle trouvée.</div>;

    return (
        <div>
            <h1>{room?.name}</h1>
            
        </div>
    )
}

export default Room;