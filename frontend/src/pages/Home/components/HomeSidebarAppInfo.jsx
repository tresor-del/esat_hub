import React, { useEffect, useRef } from "react";

const HomeSidebarAppInfo = ({ className }) => {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = 240, H = 240, cx = W/2, cy = H/2, R = 100;
    let rot = 0, t = 0, animId;

    const cities = [
      { name:'Lomé',     lat:6.14,  lng:1.21   },
      { name:'Paris',    lat:48.86, lng:2.35   },
      { name:'New York', lat:40.71, lng:-74.01 },
      { name:'Tokyo',    lat:35.68, lng:139.65 },
      { name:'Rio',      lat:-22.91,lng:-43.17 },
      { name:'Lagos',    lat:6.45,  lng:3.39   },
      { name:'Londres',  lat:51.51, lng:-0.13  },
      { name:'Dubaï',    lat:25.20, lng:55.27  },
    ];

    const arcs = [
      { from:0, to:1, color:'#38bdf8' },
      { from:2, to:1, color:'#f87171' },
      { from:3, to:0, color:'#38bdf8' },
      { from:4, to:2, color:'#f87171' },
      { from:5, to:0, color:'#4ade80' },
      { from:6, to:7, color:'#facc15' },
      { from:1, to:7, color:'#facc15' },
      { from:0, to:5, color:'#4ade80' },
    ];

    const toRad = d => d * Math.PI / 180;

    function project(lat, lng, rotation) {
      const phi = toRad(lat);
      const lambda = toRad(lng) + rotation;
      const x = Math.cos(phi) * Math.cos(lambda);
      const y = Math.sin(phi);
      const z = Math.cos(phi) * Math.sin(lambda);
      return { x: cx + R * x, y: cy - R * y, z };
    }

    function lerpOnSphere(lat1, lng1, lat2, lng2, t) {
      const p1 = [Math.cos(toRad(lat1))*Math.cos(toRad(lng1)), Math.sin(toRad(lat1)), Math.cos(toRad(lat1))*Math.sin(toRad(lng1))];
      const p2 = [Math.cos(toRad(lat2))*Math.cos(toRad(lng2)), Math.sin(toRad(lat2)), Math.cos(toRad(lat2))*Math.sin(toRad(lng2))];
      const dot = Math.max(-1, Math.min(1, p1[0]*p2[0]+p1[1]*p2[1]+p1[2]*p2[2]));
      const angle = Math.acos(dot);
      if (angle < 0.001) return [p1[0]*(1-t)+p2[0]*t, p1[1]*(1-t)+p2[1]*t, p1[2]*(1-t)+p2[2]*t];
      const s = Math.sin(angle);
      const pa = Math.sin((1-t)*angle)/s, pb = Math.sin(t*angle)/s;
      return [pa*p1[0]+pb*p2[0], pa*p1[1]+pb*p2[1], pa*p1[2]+pb*p2[2]];
    }

    function cartToLatLng(v) {
      return { lat: Math.asin(v[1]) * 180/Math.PI, lng: Math.atan2(v[2], v[0]) * 180/Math.PI };
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // Globe fond
      const grad = ctx.createRadialGradient(cx-30, cy-30, 10, cx, cy, R);
      grad.addColorStop(0, '#1e3a5f');
      grad.addColorStop(0.5, '#0d2040');
      grad.addColorStop(1, '#060d1f');
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2);
      ctx.fillStyle = grad; ctx.fill();

      // Grille
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.40)'; 
      ctx.lineWidth = 1;
      for (let la = -60; la <= 60; la += 30) {
        ctx.beginPath(); let first = true;
        for (let lo = -180; lo <= 180; lo += 3) {
          const p = project(la, lo, rot);
          if (p.z < -0.15) { first = true; continue; }
          first ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); first = false;
        }
        ctx.stroke();
      }
      for (let lo = -180; lo < 180; lo += 30) {
        ctx.beginPath(); let first = true;
        for (let la = -80; la <= 80; la += 3) {
          const p = project(la, lo, rot);
          if (p.z < -0.15) { first = true; continue; }
          first ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); first = false;
        }
        ctx.stroke();
      }

      // Arcs animés
      arcs.forEach((arc, i) => {
        const c1 = cities[arc.from], c2 = cities[arc.to];
        const arcT = ((t * 0.4 + i * 0.13) % 1);
        const tailLen = 0.18;
        ctx.lineWidth = 1.2;
        for (let s = 0; s < 60; s++) {
          const st = s/60, et = (s+1)/60;
          if (st > arcT || et < arcT - tailLen) continue;
          const alpha = (st - (arcT - tailLen)) / tailLen;
          const v1 = lerpOnSphere(c1.lat, c1.lng, c2.lat, c2.lng, st);
          const v2 = lerpOnSphere(c1.lat, c1.lng, c2.lat, c2.lng, et);
          const ll1 = cartToLatLng(v1), ll2 = cartToLatLng(v2);
          const p1 = project(ll1.lat, ll1.lng, rot);
          const p2 = project(ll2.lat, ll2.lng, rot);
          if (p1.z < -0.15 || p2.z < -0.15) continue;
          ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
          const hex = Math.floor(Math.max(0, Math.min(1, alpha))*255).toString(16).padStart(2,'0');
          ctx.strokeStyle = arc.color + hex; ctx.stroke();
        }
        // Tête de l'arc
        const headV = lerpOnSphere(c1.lat, c1.lng, c2.lat, c2.lng, arcT);
        const headLL = cartToLatLng(headV);
        const hp = project(headLL.lat, headLL.lng, rot);
        if (hp.z > 0) {
          ctx.beginPath(); ctx.arc(hp.x, hp.y, 2.5, 0, Math.PI*2);
          ctx.fillStyle = arc.color; ctx.fill();
        }
      });

      // Villes
      cities.forEach((city, i) => {
        const p = project(city.lat, city.lng, rot);
        if (p.z < -0.15) return;
        const pulse = 0.5 + 0.5*Math.sin(t*3 + i*1.1);
        ctx.beginPath(); ctx.arc(p.x, p.y, 3 + pulse*2, 0, Math.PI*2);
        ctx.fillStyle = `rgba(56,189,248,${0.15 + pulse*0.15})`; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI*2);
        ctx.fillStyle = '#fff'; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI*2);
        ctx.fillStyle = '#38bdf8'; ctx.fill();
        if (p.z > 0.3) {
          ctx.font = '20px sans-serif';
          ctx.fillStyle = 'rgba(255,255,255,0.75)';
          ctx.fillText(city.name, p.x+5, p.y-3);
        }
      });

      // Reflet
      const gloss = ctx.createRadialGradient(cx-35, cy-35, 0, cx, cy, R);
      gloss.addColorStop(0, 'rgba(255,255,255,0.07)');
      gloss.addColorStop(0.5, 'rgba(255,255,255,0)');
      gloss.addColorStop(1, 'rgba(0,0,30,0.3)');
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2);
      ctx.fillStyle = gloss; ctx.fill();
      ctx.strokeStyle = 'rgba(56,189,248,0.2)';
      ctx.lineWidth = 1; ctx.stroke();

      rot += 0.004;
      t += 0.012;
      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animId); // cleanup
  }, []);

  return (
    <div className={`left-home-card ${className}`}>
      <div className="left-card-header" style={{ flexDirection: "column", gap: "10px" }}>
        {/* <h1 className="left-card-name" style={{ fontSize: "1.1rem", textAlign: "center", width: "100%" }}>
          Esat-Hub
        </h1> */}
      </div>
      <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", borderRadius: "12px", overflow: "hidden" }}>
        <canvas ref={canvasRef} width={240} height={240} style={{ display: "block", backgroundColor: "#fff" }} />
      </div>
      <div className="left-card-footer">
        <div>
          <a href="/about" className="footer-link">À propos</a>
          <a href="/privacy" className="footer-link">Confidentialité</a>
          <a href="/terms" className="footer-link">Condition d'utilisation</a>
        </div>
        <div className="left-home-footer-brand">
          <h3 className="footer-link">Esat-Hub &copy; 2026</h3>
          <p className="footer-link">Tous droits réservés.</p>
          <p className="footer-link">Développé par <strong><a href="https://github.com" target="_blank" rel="noreferrer">Trésor</a></strong></p>
        </div>
      </div>
    </div>
  );
};

export default HomeSidebarAppInfo;