import { spawn } from "node:child_process";
import readline from "node:readline";
import {
  describeListeningProcess,
  devServices,
  isPortOpen,
  printPortConflict
} from "./dev-shared.mjs";

const children = new Map();
let shuttingDown = false;

const pipeWithPrefix = (stream, prefix, target) => {
  const lineReader = readline.createInterface({ input: stream });

  lineReader.on("line", (line) => {
    target.write(`${prefix} ${line}\n`);
  });
};

const terminateChildren = (signal = "SIGTERM") => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children.values()) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
};

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    terminateChildren(signal);
    process.exit(0);
  });
}

for (const service of devServices) {
  if (await isPortOpen(service)) {
    printPortConflict(service, describeListeningProcess(service.port));
    process.exit(1);
  }
}

for (const service of devServices) {
  const [command, ...args] = service.command;
  const child = spawn(command, args, {
    cwd: service.cwd,
    env: process.env,
    stdio: ["inherit", "pipe", "pipe"]
  });

  children.set(service.key, child);
  pipeWithPrefix(child.stdout, `[${service.key}]`, process.stdout);
  pipeWithPrefix(child.stderr, `[${service.key}]`, process.stderr);

  child.on("exit", (code, signal) => {
    children.delete(service.key);

    if (shuttingDown) {
      return;
    }

    const reason = signal ? `signal ${signal}` : `code ${code ?? 0}`;
    console.error(`[dev] ${service.label} beklenmedik sekilde kapandi (${reason}).`);
    terminateChildren();
    process.exit(code ?? 1);
  });
}

console.log("[dev] Frontend ve backend gelistirme surecleri baslatildi.");
console.log("[dev] Durum kontrolu icin: npm run dev:status");
