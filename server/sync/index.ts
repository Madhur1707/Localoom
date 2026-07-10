import http from "node:http";
import { WebSocketServer } from "ws";

import { getOrCreateRoom } from "./collaborationRoom";
import { setupCollaborationConnection } from "./connection";

const HOST = process.env.SYNC_HOST ?? "0.0.0.0";
const PORT = Number(process.env.SYNC_PORT ?? 1234);

// The client connects to `ws://host:port/<documentId>`; the path (minus the
// leading slash) is the room name. Fall back to a shared room if absent.
function roomNameFromUrl(url: string | undefined): string {
  const path = (url ?? "/").split("?")[0];
  return decodeURIComponent(path.slice(1)) || "default";
}

const httpServer = http.createServer((_req, res) => {
  // A tiny health endpoint so a load balancer / `curl` can confirm liveness;
  // the real traffic is the WebSocket upgrade handled below.
  res.writeHead(200, { "content-type": "text/plain" });
  res.end("Scriptum sync server\n");
});

const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (socket, request) => {
  const room = getOrCreateRoom(roomNameFromUrl(request.url));
  setupCollaborationConnection(socket, room);
});

function handleServerError(error: NodeJS.ErrnoException) {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use — a sync server is probably already ` +
        `running. Stop it first, or set SYNC_PORT to a free port.`
    );
    process.exit(1);
  }
  throw error;
}

// The listen error can surface on either emitter depending on ws internals.
httpServer.on("error", handleServerError);
wss.on("error", handleServerError);

httpServer.listen(PORT, HOST, () => {
  console.log(`Scriptum sync server listening on ws://${HOST}:${PORT}`);
});

// Close sockets cleanly on shutdown so clients fall back to local-first mode
// instead of hanging on a half-open connection.
function shutdown() {
  console.log("Scriptum sync server shutting down");
  wss.clients.forEach((socket) => socket.close(1001, "server shutting down"));
  wss.close(() => httpServer.close(() => process.exit(0)));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
