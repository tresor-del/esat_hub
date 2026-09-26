import { useState, useEffect, useRef } from "react";
import { closeAttendanceSession } from "../../../services/api";
import api from "../../../services/api"

const SESSION_DURATION = 15 * 60; // 15 min en secondes

const useAttendanceSession = (activeCourseSession, onSessionClosed) => {
    const [attendees, setAttendees] = useState([]);
    const [timeLeft, setTimeLeft] = useState("");
    const [timerPercent, setTimerPercent] = useState(100);
    const intervalRef = useRef(null);

    // ── Timer ────────────────────────────────────────────
    useEffect(() => {
        if (!activeCourseSession) {
            setTimeLeft("");
            setTimerPercent(0);
            clearInterval(intervalRef.current);
            return;
        }

        const tick = () => {
            const expiresAt = new Date(activeCourseSession.expires_at).getTime();
            const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
            const pct = Math.round((remaining / SESSION_DURATION) * 100);

            const m = Math.floor(remaining / 60);
            const sec = String(remaining % 60).padStart(2, "0");
            setTimeLeft(`${m}:${sec}`);
            setTimerPercent(pct);

            if (remaining === 0) clearInterval(intervalRef.current);
        };

        tick();
        intervalRef.current = setInterval(tick, 1000);

        return () => clearInterval(intervalRef.current);
    }, [activeCourseSession]);

    // ── Présences temps réel (WebSocket) ─────────────────
    useEffect(() => {
        if (!activeCourseSession) {
            setAttendees([]);
            return;
        }

        // Charger les présences existantes au montage
        fetchAttendees(activeCourseSession.id);

        // Écouter les nouveaux scans en live
        const handleNewAttendance = (data) => {
            if (data.session_id !== activeCourseSession.id) return;
            setAttendees((prev) => {
                const alreadyIn = prev.some((a) => a.student_id === data.student_id);
                return alreadyIn ? prev : [...prev, data];
            });
        };


        window.addEventListener("NEW_ATTENDANCE", handleNewAttendance);
        return () => window.removeEventListener("NEW_ATTENDANCE", handleNewAttendance);
    }, [activeCourseSession]);

    const fetchAttendees = async (sessionId) => {
        try {
            const res = await api.get(`rooms/attendance/sessions/${sessionId}/records`);
            setAttendees(res.data);
        } catch (err) {
            console.error("Erreur chargement présences:", err);
        }
    };

    const closeSession = async () => {
        if (!activeCourseSession) return;
        try {
            await closeAttendanceSession(activeCourseSession.id);
            onSessionClosed?.(); 
        } catch (err) {
            console.error("Erreur fermeture session:", err);
        }
    };

    return { attendees, timeLeft, timerPercent, closeSession };
};

export default useAttendanceSession;