import axios from 'axios';
import { LoginCredentials, RegisterData, AuthResponse, User, ApiResponse } from '../types';

// Configuración base de axios reutilizando la baseURL global (interceptor)
const apiClient = axios.create({
  // Use relative baseURL in dev so that Vite proxy handles CORS and HTTPS
  baseURL: (import.meta as any)?.env?.VITE_API_BASE_URL ?? '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a las requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas de error
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  async register(userData: RegisterData): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.post('/api/crear-usuario/', userData);
      return {
        data: response.data.usuario,
        message: response.data.mensaje,
      };
    } catch (error: any) {
      throw new Error(
        error.response?.data?.detail ||
        error.response?.data?.message ||
        (error.response?.data?.username && error.response.data.username[0]) ||
        (error.response?.data?.email && error.response.data.email[0]) ||
        'Error en el registro'
      );
    }
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post('/api/iniciar-sesion/', credentials);
      
      const authData = response.data;
      
      // Guardar tokens y datos de usuario
      if (authData.access) {
        localStorage.setItem('authToken', authData.access);
      }
      if (authData.refresh) {
        localStorage.setItem('refreshToken', authData.refresh);
      }
      if (authData.user) {
        localStorage.setItem('user', JSON.stringify(authData.user));
      }

      return authData;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Error en el inicio de sesión'
      );
    }
  },

  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await apiClient.post('/api/cerrar-sesion/', { refresh_token: refreshToken });
      }
    } catch (error) {
      console.warn('Error durante logout:', error);
    } finally {
      // Limpiar localStorage independientemente del resultado
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  async refreshToken(): Promise<string> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No hay token de refresh disponible');
      }

      const response = await apiClient.post('/api/refrescar-token/', {
        refresh: refreshToken,
      });

      const newAccessToken = response.data.access;
      localStorage.setItem('authToken', newAccessToken);

      return newAccessToken;
    } catch (error: any) {
      // Si el refresh falla, limpiar todo y redirigir al login
      this.logout();
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated(): boolean {
    return localStorage.getItem('authToken') !== null;
  },

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user ? user.perfil?.aprobado === true : false;
  },
};

export default apiClient;