import {
  describeListeningProcess,
  devServices,
  fetchBackendHealth,
  infraServices,
  isPortOpen
} from "./dev-shared.mjs";

for (const service of [...infraServices, ...devServices]) {
  const running = await isPortOpen(service);
  console.log(
    `[status] ${service.label}: ${running ? "UP" : "DOWN"} (${service.host}:${service.port})`
  );

  if (running) {
    const processDetails = describeListeningProcess(service.port);

    if (processDetails) {
      console.log(processDetails);
    }
  }
}

try {
  const health = await fetchBackendHealth();
  console.log("[status] Backend health:");
  console.log(JSON.stringify(health, null, 2));
} catch (error) {
  console.log(`[status] Backend health okunamadi: ${error.message}`);
}
