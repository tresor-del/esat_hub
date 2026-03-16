import { useState, useEffect } from "react";
import api, { API_BASE_URL_WS } from "../utils/axiosConfig";



const useWebSocket = () => {

    const [notifications, setNotifications] = useState([])

    useEffect(() => {

        const ws = new WebSocket(`${API_BASE_URL_WS}/ws`)
        ws.onmessage = (event) => {
            setNotifications(prev => [...prev, event.data])
        }

        return () => {
            ws.close()
        }

    }, []);

    return notifications

}

export default useWebSocket