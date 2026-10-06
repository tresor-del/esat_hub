import React from "react";
import { useAttendanceData } from "../hooks/useAttendanceData";
import { IconCalendarOff, IconSchool, IconUsers, IconClock, IconQrcode, IconPlayerStop } from '@tabler/icons-react';
import { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import CreateSessionModal from "./modals/CreateSessionMoadal";
import Avatar from "../../../components/ui/Avatar";
import useAttendanceSession from "../hooks/useAttendanceSession";
import "../../../styles/Rooms/Attendance.css"
import { getSessionQR } from "../../../services/api";
import { getAttendanceHistory } from "../../../services/api";
import { IconHistory, IconChevronDown, IconChevronUp } from '@tabler/icons-react';


const QRModal = ({ session, onClose }) => {
    const [qrData, setQrData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    console.log(session)

    useEffect(() => {
        getSessionQR(session.id)
            .then(setQrData)
            .catch(() => setError("Impossible de charger le QR code."))
            .finally(() => setLoading(false));
    }, [session.id]);

    return (
        <div className="media-upload-card-container" onClick={onClose}>
            <div className="media-upload-card" onClick={(e) => e.stopPropagation()}>

                <div className="media-upload-header">
                    <h3>{session.course}</h3>
                    <button className="modal-close-btn" onClick={onClose}>✕</button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "20px 0" }}>
                    {loading && (
                        <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                            Chargement...
                        </span>
                    )}

                    {error && (
                        <span style={{ color: "#ef4444", fontSize: 14 }}>{error}</span>
                    )}

                    {qrData && (
                        <>
                            <img
                                src={`data:image/png;base64,${qrData.qr_image}`}
                                alt="QR Code de la session"
                                style={{ width: 220, height: 220, borderRadius: 12 }}
                            />
                            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                                Expire à {new Date(qrData.expires_at).toLocaleTimeString()}
                            </span>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
};

const HistoryModal = ({ onClose }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedDays, setExpandedDays] = useState({});
    const [expandedSessions, setExpandedSessions] = useState({});

    useEffect(() => {
        getAttendanceHistory()
            .then(setHistory)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const toggleDay = (day) =>
        setExpandedDays(prev => ({ ...prev, [day]: !prev[day] }));

    const toggleSession = (sessionId) =>
        setExpandedSessions(prev => ({ ...prev, [sessionId]: !prev[sessionId] }));

    const formatDay = (dateStr) =>
        new Date(dateStr).toLocaleDateString("fr-FR", {
            weekday: "long", day: "numeric", month: "long", year: "numeric"
        });

    const formatTime = (isoStr) =>
        new Date(isoStr).toLocaleTimeString("fr-FR", {
            hour: "2-digit", minute: "2-digit"
        });

    return (
        <div className="media-upload-card-container" onClick={onClose}>
            <div className="media-upload-card history-modal" onClick={e => e.stopPropagation()}>

                <div className="media-upload-header">
                    <h3>Historique des présences</h3>
                    <button className="modal-close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="history-body">
                    {loading && (
                        <p className="history-empty">Chargement...</p>
                    )}

                    {!loading && history.length === 0 && (
                        <p className="history-empty">Aucune session terminée pour l'instant.</p>
                    )}

                    {history.map(({ day, sessions, total_present }) => (
                        <div key={day} className="history-day-block">

                            {/* ── Niveau 1 : Jour ── */}
                            <button className="history-day-header" onClick={() => toggleDay(day)}>
                                <div className="history-day-info">
                                    <span className="history-day-label">{formatDay(day)}</span>
                                    {/* <span className="history-day-badge">
                                        {total_present} présent{total_present > 1 ? "s" : ""}
                                    </span> */}
                                    <span className="history-day-badge">
                                        {sessions.length} cours
                                    </span>
                                </div>
                                {expandedDays[day] ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                            </button>

                            {/* ── Niveau 2 : Sessions du jour ── */}
                            {expandedDays[day] && (
                                <ul className="history-sessions-list">
                                    {sessions.map(s => (
                                        <li key={s.session_id} className="history-session-block">

                                            <button
                                                className="history-session-header"
                                                onClick={() => toggleSession(s.session_id)}
                                            >
                                                <div className="history-session-info">
                                                    <IconSchool size={14} />
                                                    <span className="history-session-course">{s.course}</span>
                                                </div>
                                                <div className="history-session-meta">
                                                    <span className="history-session-count">
                                                        <IconUsers size={13} /> {s.total_present}
                                                    </span>
                                                    {expandedSessions[s.session_id]
                                                        ? <IconChevronUp size={14} />
                                                        : <IconChevronDown size={14} />
                                                    }
                                                </div>
                                            </button>

                                            {/* ── Niveau 3 : Liste étudiants ── */}
                                            {expandedSessions[s.session_id] && (
                                                <ul className="history-students-list">
                                                    {s.students.length === 0 && (
                                                        <li className="history-student-empty">
                                                            Aucun étudiant enregistré
                                                        </li>
                                                    )}
                                                    {s.students.map((stu, i) => (
                                                        <li key={stu.student_id} className="history-student-item">
                                                            <span className="history-student-rank">#{i + 1}</span>
                                                            <div className="attendee-avatar">
                                                                <Avatar user={stu} />
                                                            </div>
                                                            <div className="history-student-name">
                                                                <span>{stu.first_name} {stu.last_name}</span>
                                                                <span className="history-student-profil">@{stu.profil_name}</span>
                                                            </div>
                                                            <span className="attendee-time">
                                                                {formatTime(stu.scanned_at)}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}

                                        </li>
                                    ))}
                                </ul>
                            )}

                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};

const AttendanceView = () => {
    const { user } = useAuth();
    const { activeCourseSession, checkForCourseSession, setActiveCourseSession } = useAttendanceData();
    const [showModal, setShowModal] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    // callback passé au hook
    const handleSessionClosed = () => {
        setActiveCourseSession(null);
        checkForCourseSession();
    };

    const { attendees, timeLeft, timerPercent, closeSession } = useAttendanceSession(
        activeCourseSession,
        handleSessionClosed
    );

    return (
        <div className="attendance-view-container">
            {activeCourseSession ? (
                <div className="session-card">
                    {/* Header, timer bar, stats — identiques */}
                    <div className="session-card-header">
                        <div className="session-course">
                            <IconSchool size={20} />
                            <p className="session-course-name">{activeCourseSession.course}</p>
                        </div>
                        <div className="session-status-badge">
                            <div className="status-dot" />
                            Active
                        </div>
                    </div>

                    <div className="timer-bar-wrap">
                        <div className="timer-bar" style={{ width: `${timerPercent}%` }} />
                    </div>

                    <div className="session-card-body">
                        <div className="session-stat">
                            <IconUsers size={20} />
                            <p className="session-stat-value">{attendees.length}</p>
                            <p className="session-stat-label">Présents</p>
                        </div>
                        <div className="session-stat">
                            <IconClock size={20} />
                            <p className="session-stat-value">{timeLeft}</p>
                            <p className="session-stat-label">Restant</p>
                        </div>
                        <div className="session-stat">
                            <IconQrcode size={20} />
                            <p className="session-stat-value">QR</p>
                            <p className="session-stat-label">Actif</p>
                        </div>
                    </div>

                    {/* ← LISTE DES PRÉSENTS — visible pour le rep uniquement */}
                    {attendees.length > 0 && (
                        <div className="attendees-list">
                            <p className="attendees-list-title">
                                <IconUsers size={14} /> Étudiants présents
                            </p>
                            <ul>
                                {attendees.map((a) => (
                                    <li key={a.student_id} className="attendee-item">
                                        <div className="attendee-avatar">
                                            <Avatar user={a} />
                                        </div>
                                        <span>{a.first_name} {a.last_name}</span>
                                        <span className="attendee-time">
                                            {new Date(a.scanned_at).toLocaleTimeString([], {
                                                hour: "2-digit", minute: "2-digit"
                                            })}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="session-card-footer">
                        <div className="session-actions">
                            <button className="btn-sm btn-sm-primary" onClick={() => setShowQR(true)}>
                                <IconQrcode size={14} /> Voir QR
                            </button>
                            {user.is_room_rep && (
                                <button className="btn-sm btn-sm-danger" onClick={closeSession}>
                                    <IconPlayerStop size={14} /> Fermer
                                </button>
                            )}

                            {user.is_room_rep && (
                                <button className="btn-sm" onClick={() => setShowHistory(true)}>
                                    <IconHistory size={14} /> Historique
                                </button>
                            )}
                        </div>
                    </div>
                </div>

            ) : (
                <div className="empty-session">
                    <IconCalendarOff size={52} stroke={1.5} />
                    <p>Aucune session en cours</p>
                    {user.is_room_rep && (
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            Commencer une session
                        </button>
                    )}

                    {user.is_room_rep && (
                        <button className="btn btn-secondary" onClick={() => setShowHistory(true)}>
                            <IconHistory size={16} /> Voir l'historique
                        </button>
                    )}
                </div>
            )}

            {showQR && (
                <QRModal session={activeCourseSession} onClose={() => setShowQR(false)} />
            )}
            {showModal && (
                <CreateSessionModal
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        checkForCourseSession(); // ← recharge la session après création
                        setShowModal(false);
                    }}
                />
            )}
            {showHistory && (
                <HistoryModal onClose={() => setShowHistory(false)} />
            )}
        </div>
    );
};

export default AttendanceView;