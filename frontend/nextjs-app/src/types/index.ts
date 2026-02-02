// ============================================
// User & Authentication Types
// ============================================

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile: UserProfile;
}

export interface UserProfile {
  aprobado: boolean;
  rol?: "ADMIN" | "COLAB" | "VISIT";
  permissions?: UserPermissions;
}

export interface UserPermissions {
  // Sensors
  ViewDashboard?: boolean;
  // Fills
  ViewFillData?: boolean;
  CreateFill?: boolean;
  EndFill?: boolean;
  // Calibrations
  ViewCalibrations?: boolean;
  CreateCalibrations?: boolean;
  ModifyCalibrations?: boolean;
  UpdateCalibrations?: boolean;
  DeleteCalibrations?: boolean;
  // Inventory
  ViewInventory?: boolean;
  CreateInventory?: boolean;
  ModifyInventory?: boolean;
  UpdateInventory?: boolean;
  DeleteInventory?: boolean;
  // Reports
  ViewReports?: boolean;
  GenerateReports?: boolean;
  // Users
  ViewUsers?: boolean;
  ModifyUsers?: boolean;
  ApproveUsers?: boolean;
  BanUsers?: boolean;
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
  password2: string;
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
  sensor: Sensor;
  value: number;
  date: string;
  fill?: Fill | null;
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
  total_solids: number;
  total_volatile_solids: number;
  potencial_production: number;
  max_mu: number;
  solvent_volume: number;
  initial_concentration: number;
  specific_mu: number;
  cumulative_production: number[];
  derivative_production: number[];
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

// Real production data point (from gas flow sensor)
export interface RealProductionData {
  id: number;
  fill: number;
  date: string;
  daily_production: number;      // m³/día - producción diaria medida
  cumulative_production: number; // m³ - producción acumulada calculada
}

// Aggregated real production for charts
export interface RealProductionSummary {
  fill_id: number;
  dates: string[];
  daily_values: number[];
  cumulative_values: number[];
  total_production: number;
}

// ============================================
// Calibration Types
// ============================================

export interface Calibration {
  id: number;
  userId: number;
  sensorId: number;
  date: string;
  params: string;
  note: string;
  result: string;
  previous_calibration: string | null;
}

export interface CalibrationCreateData {
  userId: number;
  sensorId: number;
  date: string;
  params: string;
  note: string;
  result: string;
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
  days?: number;
}

export interface CalculationResult {
  total_solids: number;
  total_volatile_solids: number;
  potencial_production: number;
  max_mu: number;
  solvent_volume: number;
  initial_concentration: number;
  specific_mu: number;
  cumulative_production: number[];
  derivative_production: number[];
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
