import Koa from "koa";
import http from "http";
import { WebSocketServer, type RawData, type WebSocket } from "ws";

type Kind = "player" | "bullet";
interface Entity {
  id: string;
  x: number;
  y: number;
  kind: Kind;
  owner?: string;
}

const app = new Koa();
const server = http.createServer(app.callback());

const wss = new WebSocketServer({ server, path: "/ws" });

let nextClientId = 1;
const clients = new Map<WebSocket, string>();
const players = new Map<string, Entity>();
const bullets = new Map<string, Entity>();
// track last update timestamp (ms) for players
const playerLastSeen = new Map<string, number>();
// track last update timestamp (ms) for bullets
const bulletLastSeen = new Map<string, number>();

function broadcastState() {
  const state = {
    type: "state",
    players: Array.from(players.values()),
    bullets: Array.from(bullets.values()),
  };
  const payload = JSON.stringify(state);
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) {
      client.send(payload);
    }
  }
}

function safeParse(data: RawData) {
  try {
    const s = typeof data === "string" ? data : data.toString();
    return JSON.parse(s);
  } catch (e) {
    return null;
  }
}

function handleMessage(ws: WebSocket, msg: any) {
  if (!msg || typeof msg.type !== "string") return;

  switch (msg.type) {
    case "join": {
      // client may provide an id; otherwise assign one
      const id = msg.id || clients.get(ws) || `p${nextClientId++}`;
      clients.set(ws, id);
      if (msg.kind === "player") {
        players.set(id, { id, x: Number(msg.x) || 0, y: Number(msg.y) || 0, kind: "player" });
        playerLastSeen.set(id, Date.now());
      } else if (msg.kind === "bullet") {
        // try to derive owner from id (format owner_b_xxx) or fallback to client's id
        const owner = typeof id === 'string' && id.includes('_b_') ? id.split('_b_')[0] : clients.get(ws);
        bullets.set(id, { id, x: Number(msg.x) || 0, y: Number(msg.y) || 0, kind: "bullet", owner });
        bulletLastSeen.set(id, Date.now());
      }
      // ack with assigned id
      ws.send(JSON.stringify({ type: "welcome", id }));
      break;
    }
    case "update": {
      const id = msg.id || clients.get(ws);
      if (!id) return;
      if (msg.kind === "player") {
        players.set(id, { id, x: Number(msg.x) || 0, y: Number(msg.y) || 0, kind: "player" });
        playerLastSeen.set(id, Date.now());
      } else if (msg.kind === "bullet") {
        // preserve owner if exists
        const existing = bullets.get(id);
        const owner = existing?.owner || (typeof id === 'string' && id.includes('_b_') ? id.split('_b_')[0] : clients.get(ws));
        bullets.set(id, { id, x: Number(msg.x) || 0, y: Number(msg.y) || 0, kind: "bullet", owner });
        bulletLastSeen.set(id, Date.now());
      }
      break;
    }
    case "leave": {
      const id = msg.id || clients.get(ws);
      if (id) {
        // remove player if exists
        players.delete(id);
        playerLastSeen.delete(id);
        // if id corresponds to a bullet id, delete that bullet
        if (bullets.has(id)) {
          console.log("*****");
          console.log(bullets);

          bullets.delete(id);
          console.log(bullets);

          bulletLastSeen.delete(id);
        }
        // also remove any bullets owned by this id (if id is a player id)
        for (const [bid, b] of bullets.entries()) {
          if (b.owner === id) {
            bullets.delete(bid);
            bulletLastSeen.delete(bid);
          }
        }
      }
      break;
    }
    case "clearBullets": {
      // optional helper to clear all bullets
      bullets.clear();
      break;
    }
    default:
      // unknown
      break;
  }
}

wss.on("connection", (ws: WebSocket) => {
  const assigned = `c${nextClientId++}`;
  clients.set(ws, assigned);
  ws.send(JSON.stringify({ type: "welcome", id: assigned }));

  ws.on("message", (data: RawData) => {
    const msg = safeParse(data);
    if (!msg) return;
    handleMessage(ws, msg);
  });

  ws.on("close", () => {
    const id = clients.get(ws);
    if (id) {
      players.delete(id);
      bullets.delete(id);
      playerLastSeen.delete(id);
      // remove any bullets owned by this client id
      for (const [bid, b] of bullets.entries()) {
        if (b.owner === id) {
          bullets.delete(bid);
          bulletLastSeen.delete(bid);
        }
      }
      clients.delete(ws);
    }
  });
});

// Broadcast 20 times per second
const TICK_MS = 1000 / 20;
setInterval(broadcastState, TICK_MS);

// Remove players that haven't sent updates for more than 2 seconds
const STALE_MS = 2000;
setInterval(() => {
  const now = Date.now();
  for (const [id, last] of playerLastSeen.entries()) {
    if (now - last > STALE_MS) {
      players.delete(id);
      playerLastSeen.delete(id);
    }
  }
}, 1000);

// Remove bullets that haven't sent updates for more than STALE_MS
setInterval(() => {
  const now = Date.now();
  for (const [id, last] of bulletLastSeen.entries()) {
    if (now - last > STALE_MS) {
      bullets.delete(id);
      bulletLastSeen.delete(id);
    }
  }
}, 1000);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
server.listen(PORT, () => {
  // 启动服务：pnpm snowball-server
  console.log(`Snowball WS server running on http://localhost:${PORT}/ws`);
});

export {};
