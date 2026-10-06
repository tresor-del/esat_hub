import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

const BASE_URL = 'https://esat-hub.onrender.com'; 
const WS_BASE = 'wss://esat-hub.onrender.com';

// Charge les identifiants générés par seed_load_test_users.py
const credentials = new SharedArray('users', function () {
  return JSON.parse(open('./load_test_credentials.json'));
});

export const options = {
setupTimeout: '15m',
  scenarios: {
    posts_and_chat: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 20 },
        { duration: '3m', target: 20 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.05'],
  },
};

// setup() tourne UNE SEULE FOIS avant le test, pas par VU/itération.
// On y fait les logins pour éviter de spammer /token (limité à 5/minute) pendant le test.
export function setup() {
  const users = []; // { id, token }

  credentials.forEach((cred, i) => {
    const res = http.post(
      `${BASE_URL}/api/v1/auth/token`,
      `username=${encodeURIComponent(cred.username)}&password=${encodeURIComponent(cred.password)}`,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    if (res.status === 200) {
      users.push({ id: cred.id, token: res.json('access_token') });
    } else {
      console.log(`Login échoué pour ${cred.username}: ${res.status} ${res.body}`);
    }

    // Espacement pour rester sous le rate limit de 5/minute pendant le setup
    // (~12s entre logins => max 5 par minute)
    if (i < credentials.length - 1) sleep(12);
  });

  return { users };
}

export default function (data) {
  const users = data.users;
  if (!users || users.length < 2) return; // besoin d'au moins 2 utilisateurs pour se parler

  const me = users[__VU % users.length];
  const neighbor = users[(__VU + 1) % users.length]; // le "voisin" à qui on écrit
  const token = me.token;
  if (!token) return;

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  // --- Scénario 1 : GET /api/v1/posts/ ---
  const postsRes = http.get(`${BASE_URL}/api/v1/posts/?skip=0&limit=20`, authHeaders);
  check(postsRes, {
    'posts status 200': (r) => r.status === 200,
    'posts réponse rapide (<1s)': (r) => r.timings.duration < 1000,
  });

  sleep(1);

  // --- Scénario 2 : connexion WebSocket /ws (auth confirmée : token en query param) ---
  const wsRes = ws.connect(`${WS_BASE}/api/v1/ws?token=${token}`, {}, function (socket) {
    socket.on('open', () => {
      socket.send(JSON.stringify({
        recipient_id: neighbor.id, // vrai utilisateur de test, pas un UUID inventé
        message: `Message de test depuis VU ${__VU}`,
      }));
    });

    socket.on('message', (data) => {
      // message reçu (accusé de réception, notification, etc.)
    });

    socket.on('error', (e) => {
      console.log(`Erreur WS (VU ${__VU}):`, e.error());
    });

    socket.setTimeout(() => {
      socket.close();
    }, 60000);
  });

  check(wsRes, { 'WS connecté': (r) => r && r.status === 101 });
}