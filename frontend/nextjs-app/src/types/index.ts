// ============================================
// User & Authentication Types
// ============================================

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  perfil: UserProfile;
}

export interface UserProfile {
  aprobado: boolean;
  rol?: "ADMIN" | "COLAB" | "VISIT";
  permisos?: UserPermissions;
}

export interface UserPermissions {
  VerDashboard?: boolean;
  GestionarSensores?: boolean;
  GestionarCalibraciones?: boolean;
  GestionarInventario?: boolean;
  GestionarLlenados?: boolean;
  VerCalculadora?: boolean;
  AprobarUsuarios?: boolean;
  GestionarPermisos?: boolean;
  [key: string]: boolean | undefined;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface TokenRefreshResponse {
  access: string;
}

// ============================================
// Sensor Types
// ============================================

export interface MeasuredVariable {
  id: number;
  name: string;
  unit: string;
  description?: string;
}

export interface Sensor {
  id: number;
  name: string;
  mqtt_code: string;
  measured_variable: number;
  measured_variable_detail?: MeasuredVariable;
  suscription_date: string;
  min_range: number;
  max_range: number;
  hysteresis?: number | null;
  accuracy?: number | null;
  precision?: number | null;
}

export interface SensorData {
  id: number;
  sensor: number;
  value: number;
  timestamp: string;
  fill?: number | null;
}

export interface SensorCreateData {
  name: string;
  mqtt_code: string;
  measured_variable: number;
  min_range: number;
  max_range: number;
  hysteresis?: number | null;
  accuracy?: number | null;
  precision?: number | null;
}

// ============================================
// Fill Types
// ============================================

export interface FillPrediction {
  id: number;
  expected_max_production: number;
  expected_production_day: number;
  expected_delay_days: number;
  cumulative_data: number[];
  daily_data: number[];
}

export interface Fill {
  id: number;
  first_day: string;
  last_day?: string | null;
  people_involved?: string | null;
  filling_mass: number;
  approx_density: number;
  added_watter: number;
  type_material: number;
  filling_moisture: number;
  delay_time: number;
  prediction?: FillPrediction | null;
}

export interface FillCreateData {
  people_involved?: string;
  filling_mass: number;
  approx_density: number;
  added_watter: number;
  type_material: number;
  filling_moisture: number;
  delay_time: number;
}

// ============================================
// Calibration Types
// ============================================

export interface Calibration {
  id: number;
  sensor: number;
  sensor_name?: string;
  date: string;
  standard_value: number;
  measured_value: number;
  error: number;
  observations?: string | null;
  calibrated_by?: string | null;
}

export interface CalibrationCreateData {
  sensor: number;
  date: string;
  standard_value: number;
  measured_value: number;
  error: number;
  observations?: string;
  calibrated_by?: string;
}

// ============================================
// Inventory Types
// ============================================

export interface Place {
  id: number;
  name: string;
  description?: string | null;
}

export interface Item {
  id: number;
  name: string;
  description?: string | null;
  quantity: number;
  unit: string;
  place: number;
  place_name?: string;
  last_updated?: string;
}

export interface ItemCreateData {
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  place: number;
}

export interface PlaceCreateData {
  name: string;
  description?: string;
}

// ============================================
// BatchModel / Calculator Types
// ============================================

export interface BasicParams {
  id: number;
  supplyName: string;
  TS: number;
  VSTS: number;
  potencial_production: number;
}

export interface BasicParamsCreateData {
  supplyName: string;
  TS: number;
  VSTS: number;
  potencial_production: number;
}

export interface CalculationInput {
  filling_mass: number;
  approx_density: number;
  added_watter: number;
  type_material: number;
  filling_moisture: number;
  delay_time: number;
  temperature?: number;
  simulation_days?: number;
}

export interface CalculationResult {
  total_solids: number;
  volatile_solids: number;
  potential_production: number;
  max_mu: number;
  specific_mu: number;
  cumulative_production: number[];
  daily_production: number[];
  days: number[];
}

// ============================================
// WebSocket Types
// ============================================

export interface WebSocketMessage {
  type: "sensor_data" | "sensor_list" | "error";
  data?: Record<string, string[]>;
  message?: string;
}

export interface SensorReading {
  sensorCode: string;
  values: number[];
  timestamps: string[];
}

// ============================================
// API Response Types
// ============================================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  detail?: string;
  message?: string;
  [key: string]: unknown;
}
