const defaultDevelopmentOrigins = [
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "http://localhost:5173",
  "http://127.0.0.1:5173"
];

const parseOrigins = (origins = "") =>
  String(origins || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

export const getAllowedOrigins = () =>
  [...new Set([...parseOrigins(process.env.ALLOWED_ORIGINS), process.env.CLIENT_URL, ...defaultDevelopmentOrigins])]
    .map((origin) => String(origin || "").trim())
    .filter(Boolean);

export const isAllowedOrigin = (origin) => !origin || getAllowedOrigins().includes(origin);

export const createCorsOptions = () => ({
  credentials: true,
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS is not allowed for this origin."));
  }
});
