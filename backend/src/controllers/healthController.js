import packageMetadata from "../../package.json" with { type: "json" };

const startedAt = new Date().toISOString();

export const getHealth = (req, res) => {
  res.json({
    status: "ok",
    service: "bakery-backend",
    version: packageMetadata.version,
    startedAt,
    runtime: {
      lifecycle: process.env.npm_lifecycle_event || "direct-node",
      node: process.version
    }
  });
};
