type StateMsg = { type: 'state'; players: Array<any>; bullets: Array<any> };
type Msg = { type: string; id?: string; kind?: 'player'|'bullet'; x?: number; y?: number };

let ws: WebSocket | null = null;
let onStateCb: ((s: StateMsg) => void) | null = null;

export function connect(url = (window as any).__SNOW_WS_URL || 'ws://localhost:3001/ws') {
  ws = new WebSocket(url);
  ws.addEventListener('open', () => console.log('[ws] open', url));
  ws.addEventListener('message', (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      if (msg.type === 'state' && onStateCb) onStateCb(msg as StateMsg);
    } catch (e) {
      // ignore
    }
  });
  ws.addEventListener('close', () => console.log('[ws] close'));
  ws.addEventListener('error', (e) => console.error('[ws] error', e));
  return ws;
}

export function onState(cb: (s: StateMsg) => void) { onStateCb = cb; }

export function send(msg: Msg) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(msg));
}

export function sendJoin(kind: 'player'|'bullet', id?: string, x = 0, y = 0) {
  send({ type: 'join', id, kind, x, y });
}
export function sendUpdate(kind: 'player'|'bullet', id?: string, x = 0, y = 0) {
  if (!id) return;
  send({ type: 'update', id, kind, x, y });
}
export function sendLeave(id?: string) { if (id) send({ type: 'leave', id }); }

export default { connect, onState, send, sendJoin, sendUpdate, sendLeave };
