import Cookies from "js-cookie";
import apiClient from "./apiClient";
import type {
  User,
  LoginCredentials,
  RegisterData,
  AuthResponse,
} from "@/types";

const TOKEN_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";
const USER_KEY = "user";

export const authService = {
  /**
   * Login user with credentials
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      "/api/auth/login/",
      credentials
    );
    const { access, refresh, user } = response.data;

    // Store tokens in cookies
    Cookies.set(TOKEN_KEY, access, { expires: 1 }); // 1 day
    Cookies.set(REFRESH_KEY, refresh, { expires: 7 }); // 7 days
    Cookies.set(USER_KEY, JSON.stringify(user), { expires: 7 });

    return response.data;
  },

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<User> {
    const response = await apiClient.post<User>("/api/auth/register/", data);
    return response.data;
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = Cookies.get(REFRESH_KEY);
      if (refreshToken) {
        await apiClient.post("/api/auth/logout/", { refresh: refreshToken });
      }
    } catch {
      // Ignore errors on logout
    } finally {
      Cookies.remove(TOKEN_KEY);
      Cookies.remove(REFRESH_KEY);
      Cookies.remove(USER_KEY);
    }
  },

  /**
   * Get current authenticated user and update stored data
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>("/api/users/me/");
    // Update stored user data with fresh data from server
    Cookies.set(USER_KEY, JSON.stringify(response.data), { expires: 7 });
    return response.data;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!Cookies.get(TOKEN_KEY);
  },

  /**
   * Get stored user from cookie
   */
  getStoredUser(): User | null {
    const userStr = Cookies.get(USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  /**
   * Get access token
   */
  getAccessToken(): string | undefined {
    return Cookies.get(TOKEN_KEY);
  },

  /**
   * Get refresh token
   */
  getRefreshToken(): string | undefined {
    return Cookies.get(REFRESH_KEY);
  },

  /**
   * Update stored user
   */
  updateStoredUser(user: User): void {
    Cookies.set(USER_KEY, JSON.stringify(user), { expires: 7 });
  },
};

export default authService;
