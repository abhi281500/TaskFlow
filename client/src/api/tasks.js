import axios from "axios";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
  headers: { "Content-Type": "application/json" }
});
api.interceptors.request.use(config => {
  const token = localStorage.getItem("taskflow_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export const taskApi = {
  getAll: params => api.get("/tasks", { params }),
  getCounts: () => api.get("/tasks/counts"),
  getOne: id => api.get(`/tasks/${id}`),
  create: payload => api.post("/tasks", payload),
  update: (id, payload) => api.patch(`/tasks/${id}`, payload),
  remove: id => api.delete(`/tasks/${id}`)
};
export const authApi = {
  register: payload => api.post("/auth/register", payload),
  login: payload => api.post("/auth/login", payload),
  me: () => api.get("/auth/me")
};
export function getApiError(error) {
  return error.response?.data?.message || (error.code === "ERR_NETWORK"
    ? "Cannot connect to the server. Check that the backend is running."
    : error.message || "Something went wrong");
}
