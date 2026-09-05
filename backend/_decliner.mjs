import { readFileSync } from "node:fs";
const base = "http://localhost:5000";
const env = Object.fromEntries(readFileSync(".env", "utf8").split(/\r?\n/).filter(l => l.includes("=")).map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]));
const { Client } = await import("pg");
const pg = new Client({ connectionString: env.DATABASE_URL });
await pg.connect();
const u = await pg.query("SELECT id, email FROM users WHERE id = '8fadc1e8-7eac-4f82-bb53-b32802f7b69d'");
await pg.end();
const email = u.rows[0].email;
const login = await (await fetch(`${base}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "CallPeer123!" }) })).json();
if (!login.accessToken) { console.log("peer login failed", res_status ?? ""); process.exit(1); }
const { io } = await import("../frontend/node_modules/socket.io-client/build/esm/index.js");
const socket = io(base, { auth: { token: login.accessToken }, transports: ["websocket"] });
await new Promise((resolve) => socket.on("connect", resolve));
console.log("callpeer socket ready — waiting for the incoming call; will decline it");
socket.on("call:incoming", (payload) => {
  console.log("call:incoming from", payload.from?.username);
  window_settimeout_decline(socket, payload.fromUserId);
});
function window_settimeout_decline(socket, fromUserId) {
  setTimeout(() => socket.emit("call:decline", { toUserId: fromUserId }), 1500);
}
// keep alive for 45s then exit
setTimeout(() => { socket.disconnect(); process.exit(0); }, 45_000);
