import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const api = axios.create({ baseURL: API });

// Attach current role to every request
api.interceptors.request.use((cfg) => {
  const role = localStorage.getItem("mw_role") || "engineer";
  cfg.headers = cfg.headers || {};
  cfg.headers["X-Role"] = role;
  return cfg;
});

export const getPermissions = () => api.get("/auth/permissions").then(r => r.data);

export const getOverview = () => api.get("/dashboard/overview").then(r => r.data);
export const listAssets = () => api.get("/assets").then(r => r.data);
export const getAsset = (id) => api.get(`/assets/${id}`).then(r => r.data);
export const getSensors = (id) => api.get(`/assets/${id}/sensors`).then(r => r.data);
export const listAlerts = (params = {}) => api.get("/alerts", { params }).then(r => r.data);
export const ackAlert = (alert_id) => api.post("/alerts/acknowledge", { alert_id }).then(r => r.data);
export const listLogbook = (asset_id) => api.get("/logbook", { params: asset_id ? { asset_id } : {} }).then(r => r.data);
export const createLogbook = (body) => api.post("/logbook", body).then(r => r.data);
export const listKnowledge = (params = {}) => api.get("/knowledge", { params }).then(r => r.data);
export const getRiskMatrix = () => api.get("/risk-matrix").then(r => r.data);
export const getRecommendations = (id) => api.get(`/recommendations/${id}`).then(r => r.data);
export const getReport = (id) => api.get(`/reports/${id}`).then(r => r.data);
export const startSession = (body = {}) => api.post("/wizard/sessions", body).then(r => r.data);
export const listSessions = () => api.get("/wizard/sessions").then(r => r.data);
export const getSession = (sid) => api.get(`/wizard/sessions/${sid}`).then(r => r.data);
export const sendFeedback = (body) => api.post("/wizard/feedback", body).then(r => r.data);
export const simulateAnomaly = () => api.post("/simulate/anomaly").then(r => r.data);

export async function* streamChat({ session_id, message, model, asset_id }) {
  const res = await fetch(`${API}/wizard/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id, message, model, asset_id }),
  });
  if (!res.body) return;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n\n");
    buf = lines.pop() || "";
    for (const line of lines) {
      const m = line.match(/^data:\s*(.*)$/m);
      if (!m) continue;
      try { yield JSON.parse(m[1]); } catch (_) {}
    }
  }
}

export const getInventory = () => api.get("/inventory").then(r => r.data);
export const purchasePart = (id) => api.post(`/inventory/purchase/${id}`).then(r => r.data);
export const getScheduler = () => api.get("/scheduler").then(r => r.data);
export const getAnalytics = () => api.get("/analytics").then(r => r.data);

export async function transcribeAudio(blob) {
  const fd = new FormData();
  fd.append("file", blob, "rec.webm");
  const r = await fetch(`${API}/voice/transcribe`, { method: "POST", body: fd });
  if (!r.ok) throw new Error(`STT ${r.status}`);
  return r.json();
}

export async function speakText(text, voice = "onyx") {
  const r = await fetch(`${API}/voice/speak`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice }),
  });
  if (!r.ok) throw new Error(`TTS ${r.status}`);
  return r.blob();
}

export default api;
