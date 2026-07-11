import http from "node:http";
import type { IncomingMessage } from "node:http";
import { WebSocketServer } from "ws";

import { getOrCreateRoom } from "./collaborationRoom";
import { setupCollaborationConnection } from "./connection";
import { authorizeConnection, type ConnectionAuthorization } from "./auth";

const HOST = process.env.SYNC_HOST ?? "0.0.0.0";
const PORT = Number(process.env.SYNC_PORT ?? 1234);


const authorizationByRequest = new WeakMap<
  IncomingMessage,
  ConnectionAuthorization
>();

const httpServer = http.createServer((_req, res) => {

  res.writeHead(200, { "content-type": "text/plain" });
  res.end("Scriptum sync server\n");
});


const wss = new WebSocketServer({
  server: httpServer,
  verifyClient: ({ req }, done) => {
    authorizeConnection(req.url)
      .then((authorization) => {
        if (!authorization) {
          done(false, 401, "Unauthorized");
          return;
        }
        authorizationByRequest.set(req, authorization);
        done(true);
      })
      .catch(() => done(false, 500, "Sync authorization failed"));
  },
});

wss.on("connection", (socket, request) => {
  const authorization = authorizationByRequest.get(request);
  authorizationByRequest.delete(request);
  if (!authorization) {
    // verifyClient should have gated this; fail closed if it somehow didn't.
    socket.close(4401, "unauthorized");
    return;
  }
  const room = getOrCreateRoom(authorization.roomName);
  setupCollaborationConnection(socket, room, authorization.canWrite);
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
