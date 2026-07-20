import { spawnSync } from "node:child_process";
import net from "node:net";

export const FRONTEND_HOST = "127.0.0.1";
export const FRONTEND_PORT = 5173;
export const BACKEND_HOST = "127.0.0.1";
export const BACKEND_PORT = 5001;
export const MONGODB_HOST = "127.0.0.1";
export const MONGODB_PORT = 27017;
export const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

export const devServices = [
  {
    key: "backend",
    label: "Backend API",
    host: BACKEND_HOST,
    port: BACKEND_PORT,
    cwd: new URL("../backend/", import.meta.url),
    command: [npmCommand, "run", "dev"]
  },
  {
    key: "frontend",
    label: "Frontend",
    host: FRONTEND_HOST,
    port: FRONTEND_PORT,
    cwd: new URL("../frontend/", import.meta.url),
    command: [npmCommand, "run", "dev"]
  }
];

export const infraServices = [
  {
    key: "mongodb",
    label: "MongoDB",
    host: MONGODB_HOST,
    port: MONGODB_PORT
  }
];

export const describeListeningProcess = (port) => {
  const lookup = spawnSync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN"], {
    encoding: "utf8"
  });

  if (lookup.error || lookup.status !== 0 || !lookup.stdout.trim()) {
    return "";
  }

  return lookup.stdout.trim();
};

export const isPortOpen = async ({ host = "127.0.0.1", port, timeoutMs = 300 }) => {
  if (describeListeningProcess(port)) {
    return true;
  }

  return await new Promise((resolve) => {
    const socket = net.createConnection({ host, port });

    const finalize = (status) => {
      socket.destroy();
      resolve(status);
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finalize(true));
    socket.once("timeout", () => finalize(false));
    socket.once("error", () => finalize(false));
  });
};

export const printPortConflict = (service, processDetails = "") => {
  console.error(
    `[dev] ${service.label} icin beklenen ${service.host}:${service.port} portu zaten kullanimda.`
  );

  if (processDetails) {
    console.error(processDetails);
  }

  console.error(
    "[dev] Lutfen once ilgili sureci durdurun ve gerekirse `npm run dev:status` ile yeniden kontrol edin."
  );
};

export const fetchBackendHealth = async () => {
  const response = await fetch(`http://${BACKEND_HOST}:${BACKEND_PORT}/api/health`);

  if (!response.ok) {
    throw new Error(`Health endpoint returned HTTP ${response.status}.`);
  }

  return await response.json();
};
