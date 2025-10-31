// services/interceptor.ts
import axios from "axios";

console.log("🔧 Interceptor cargado");

// Configure baseURL so relative axios calls hit the Django backend instead of Vite dev server
// Prefer relative baseURL so Vite proxy handles CORS/HTTPS; set VITE_API_BASE_URL only in real deployments
axios.defaults.baseURL = (import.meta as any)?.env?.VITE_API_BASE_URL ?? "";

// Variable para evitar múltiples refresh simultáneos
let refreshPromise: Promise<string> | null = null;

const refrescarToken = async (): Promise<string> => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    console.log("🔄 Intentando refrescar token...");

    const response = await axios.post(
      "/api/refrescar-token/",
      {
        refresh: refreshToken,
      }
    );

    const nuevoToken = response.data.access;
    localStorage.setItem("authToken", nuevoToken);
    console.log("✅ Nuevo token obtenido");

    return nuevoToken;
  } catch (error) {
    console.error("❌ Error refrescando token:", error);
    // Limpiar tokens y redirigir al login
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    window.location.href = "/login";
    throw error;
  }
};

// Interceptor de requests
axios.interceptors.request.use((request) => {
  const token = localStorage.getItem("authToken");

  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }

  return request;
});

// Interceptor de responses para manejar tokens expirados
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log("🔐 Token expirado, intentando refresh...");

      originalRequest._retry = true;

      try {
        // Evitar múltiples llamadas simultáneas al refresh
        if (!refreshPromise) {
          refreshPromise = refrescarToken();
        }

        const nuevoToken = await refreshPromise;
        refreshPromise = null;

        // Reintentar la request original con el nuevo token
        originalRequest.headers.Authorization = `Bearer ${nuevoToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        refreshPromise = null;
        console.error("❌ No se pudo refrescar el token:", refreshError);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
