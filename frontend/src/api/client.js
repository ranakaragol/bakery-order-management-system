import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const api = axios.create({ baseURL });
export const publicApi = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const rawSession = localStorage.getItem("bakery_auth");

  if (rawSession) {
    const session = JSON.parse(rawSession);

    if (session?.token) {
      config.headers.Authorization = `Bearer ${session.token}`;
    }
  }

  return config;
});

export default api;
