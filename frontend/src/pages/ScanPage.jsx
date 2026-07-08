import api from "../services/api";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRef } from "react";
import { IconCircleCheck, IconCircleX } from '@tabler/icons-react';

const ScanPage = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const hasScanned = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("QR Code invalide.");
      return;
    }

    if (!user) {
      navigate(`/login?next=${encodeURIComponent("/attendance/scan?token=" + token)}`);
      return;
    }

    if (hasScanned.current) return; // bloque le 2ème appel
    hasScanned.current = true;

    api.post(`rooms/attendance/scan?token=${token}`)
      .then(() => {
        setStatus("success");
      })
      .catch((err) => {
        const detail = err.response?.data?.detail;
        if (Array.isArray(detail)) {
          setMessage(detail.map((e) => e.msg).join(", "));
        } else if (typeof detail === "string") {
          setMessage(detail);
        } else {
          setMessage("Erreur lors du scan.");
        }
        setStatus("error"); // ← manquait ici
      });
  }, [token, user]);

  return (
    <div className="scan-result" style={{display: "flex", width: "100%", height: "calc(100vh - 80px)", flexDirection: "column", alignItems: "center", justifyContent: "center"}}>
      {status === "loading" && <p>Enregistrement de ta présence...</p>}

      {status === "success" && (
        <>
          <IconCircleCheck size={64} color="#22c55e" stroke={1.5} />
          <p>Présence enregistrée !</p>
          <button onClick={() => navigate("/")}>Retour à l'accueil</button>
        </>
      )}

      {status === "error" && (
        <>
          <IconCircleX size={64} color="#ef4444" stroke={1.5} />
          <p>{message}</p>
          <button onClick={() => navigate("/")}>Retour à l'accueil</button>
        </>
      )}
    </div>
  );
};

export default ScanPage;