import { Platform } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';

// Platform-specific base URL configuration
const ENV_BASE = process.env.EXPO_PUBLIC_API_URL;
const DEFAULT_BASE = Platform.select({
  android: 'http://134.255.216.155:8001/api', // Android emulator -> host loopback  
  ios: 'http://134.255.216.155:8001/api',    // iOS simulator
  default: 'http://134.255.216.155:8001/api' // Physical device fallback - use the original server
});
const BASE = (ENV_BASE && ENV_BASE.trim()) || DEFAULT_BASE || 'http://134.255.216.155:8001/api';

// Legacy API_URL for backward compatibility
export const API_URL = BASE;

function withTimeout(promise: Promise<any>, ms = 20000): Promise<any> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Request timeout after ${ms}ms - check if server is running`)), ms);
    promise.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

async function getJSON(path: string, params?: Record<string, any>, signal?: AbortSignal) {
  const qs = new URLSearchParams();
  if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qs.append(k, String(v)); });
  const url = `${BASE}${path}${qs.toString() ? `?${qs}` : ''}`;
  
  console.log(`🌐 API Request: ${url}`);
  
  try {
    const res = await withTimeout(fetch(url, { headers: { Accept: 'application/json' }, signal }), 20000);
    
    if (signal?.aborted) {
      throw new Error('Aborted');
    }
    
    const json = await res.json().catch(() => ({}));
    console.log(`📡 API Response for ${path}:`, { status: res.status, data: json });
    
    if (!res.ok) {
      const errorMessage = json?.message || json?.error || `HTTP ${res.status}`;
      throw new Error(errorMessage);
    }
    
    return json; // Typically { success, data }
  } catch (e: any) {
    if (e?.message === 'Aborted' || e?.name === 'AbortError') {
      throw e; // Re-throw aborted requests without logging
    }
    console.error('❌ API GET failed', { url, message: e?.message, error: e });
    throw e;
  }
}

async function postJSON(path: string, body: any, signal?: AbortSignal) {
  const url = `${BASE}${path}`;
  try {
    const res = await withTimeout(fetch(url, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal
    }), 20000);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);
    return json; // Typically { success, data }
  } catch (e: any) {
    console.error('API POST failed', { url, message: e?.message });
    throw e;
  }
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    full_name: string;
    phone: string;
    client_type: 'individual' | 'company';
    address?: string;
    city?: string;
    country?: string;
  };
  token: string;
}

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
    full_name: string;
    phone: string;
    client_type: 'individual' | 'company';
    address?: string;
    city?: string;
    country?: string;
  };
  token: string;
}



// Custom error class for API errors
export class ApiError extends Error {
  public status: number;
  public errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

/**
 * Enhanced fetch function that automatically handles authentication headers
 * and provides consistent error handling
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    // Get the current token from Zustand store
    const token = useAuthStore.getState().token;
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Add existing headers
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    // Add authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

        // Debug logging for orders endpoint
    if (endpoint === '/orders' && options.method === 'POST') {
      console.log('🔍 API Request Details:');
      console.log('  URL:', `${API_URL}${endpoint}`);
      console.log('  Method:', options.method);
      console.log('  Headers:', headers);
      console.log('  Body:', options.body);
      console.log('  Token exists:', !!token);
      
      // Try to parse the body to see what's actually being sent
      try {
        if (options.body) {
          const parsedBody = JSON.parse(options.body as string);
          console.log('  Parsed body:', parsedBody);
          console.log('  Items count:', parsedBody.items?.length);
          console.log('  Items:', parsedBody.items);
        }
      } catch (e) {
        console.log('  Could not parse body:', e);
      }
    }

    // Debug logging for appointments endpoint
    if (endpoint.startsWith('/appointments') && (options.method === 'POST' || options.method === 'PUT')) {
      console.log('🔍 Appointment API Request Details:');
      console.log('  URL:', `${API_URL}${endpoint}`);
      console.log('  Method:', options.method);
      console.log('  Headers:', headers);
      console.log('  Body:', options.body);
      console.log('  Token exists:', !!token);
      
      // Try to parse the body to see what's actually being sent
      try {
        if (options.body) {
          const parsedBody = JSON.parse(options.body as string);
          console.log('  Parsed appointment body:', parsedBody);
        }
      } catch (e) {
        console.log('  Could not parse appointment body:', e);
      }
    }

    // Make the request
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Parse response as JSON
    let data: ApiResponse<T>;
    try {
      data = await response.json();
    } catch (parseError) {
      throw new ApiError('Invalid JSON response from server', response.status);
    }

    // Debug logging for orders endpoint
    if (endpoint === '/orders' && options.method === 'POST') {
      console.log('🔍 API Response Details:');
      console.log('  Status:', response.status);
      console.log('  OK:', response.ok);
      console.log('  Response data:', data);
    }

    // Debug logging for appointments endpoint
    if (endpoint.startsWith('/appointments') && (options.method === 'POST' || options.method === 'PUT')) {
      console.log('🔍 Appointment API Response Details:');
      console.log('  Status:', response.status);
      console.log('  OK:', response.ok);
      console.log('  Response data:', data);
    }

    // Handle non-2xx responses
    if (!response.ok) {
      const errorMessage = data.message || `HTTP Error ${response.status}`;
      throw new ApiError(errorMessage, response.status, data.errors);
    }

    return data;
  } catch (error) {
    // Re-throw ApiError as-is
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError('Network error. Please check your connection.', 0);
    }

    // Handle other errors
    throw new ApiError(error instanceof Error ? error.message : 'Unknown error occurred', 0);
  }
}

/**
 * Login user with email and password
 */
export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  const response = await apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!response.data) {
    throw new ApiError('Login failed: No user data received', 400);
  }

  return response.data;
}

/**
 * Register a new user
 */
export async function registerUser(userData: {
  client_type: 'individual' | 'company';
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  country?: string;
  password: string;
  password_confirmation: string;
  // Additional fields for company registration
  company_name?: string;
  activity_description?: string;
  commercial_register?: string;
  tax_register?: string;
  responsible_name?: string;
  job_title?: string;
  date_of_birth?: string;
}): Promise<RegisterResponse> {
  const response = await apiFetch<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });

  if (!response.data) {
    throw new ApiError('Registration failed: No user data received', 400);
  }

  return response.data;
}

/**
 * Logout user (if backend requires a logout endpoint)
 */
export async function logoutUser(): Promise<void> {
  try {
    await apiFetch('/auth/logout', {
      method: 'POST',
    });
  } catch (error) {
    // Even if logout fails on backend, we'll clear local storage
    console.warn('Logout request failed:', error);
  }
}

/**
 * Get user profile (example of authenticated request)
 */
export async function getUserProfile(): Promise<any> {
  const response = await apiFetch('/user/profile');
  return response.data;
}



/**
 * Helper function to format API errors for display
 */
export function formatApiError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.errors) {
      // Format validation errors
      const errorMessages = Object.values(error.errors).flat();
      return errorMessages.join('\n');
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'حدث خطأ غير متوقع';
}

/**
 * Get categories with pagination and search
 */
export async function getCategories({ page = 1, limit = 15, search = '' } = {}, signal?: AbortSignal) {
  return getJSON('/categories', { page, limit, search }, signal);
}

/**
 * Get products with pagination, search, and category filtering
 */
export async function getProducts({ page = 1, limit = 15, search = '', category_id }: { page?: number; limit?: number; search?: string; category_id?: string } = {}, signal?: AbortSignal) {
  return getJSON('/products', { page, limit, search, category_id }, signal);
}

/**
 * Get product details by ID
 */
export async function getProductDetail(id: string, signal?: AbortSignal) {
  return getJSON(`/products/${id}`, undefined, signal);
}

// Export helper functions
export { BASE, getJSON, postJSON };

// Optional convenience wrappers for auth
export async function login(payload: any, signal?: AbortSignal) {
  return postJSON('/auth/login', payload, signal);
}

export async function registerIndividual(payload: any, signal?: AbortSignal) {
  return postJSON('/auth/register', payload, signal);
}

// Debug once at startup (you can remove later)
if (__DEV__) {
  // eslint-disable-next-line no-console
  console.log('🌐 API Configuration:');
  console.log('   EXPO_PUBLIC_API_URL =', process.env.EXPO_PUBLIC_API_URL);
  console.log('   Platform =', Platform.OS);
  console.log('   BASE URL =', BASE);
  console.log('   Timeout = 10 seconds');
}

// ---------------- Orders types & endpoints ----------------
export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "deleted";
export type OrdersIndexParams = { status?: OrderStatus | "cancelled_or_deleted"; search?: string; sort_by?: "created_at" | "order_number" | "total" | "status"; sort_order?: "asc" | "desc"; per_page?: number; page?: number; };
export type CreateOrderBody = { items: Array<{ product_id: number; quantity: number; options?: number[] }>; shipping_address?: string; billing_address?: string; phone?: string; notes?: string; };

// Helper to build query string
function _qs(params?: Record<string, any>) { if (!params) return ""; const s = new URLSearchParams(); Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") s.append(k, String(v)); }); const str = s.toString(); return str ? `?${str}` : ""; }

// GET /orders
export async function getOrders(params: OrdersIndexParams = {}, signal?: AbortSignal) {
  return apiFetch(`/orders${_qs(params)}`, { method: "GET", signal });
}
// POST /orders
export async function createOrder(payload: CreateOrderBody, signal?: AbortSignal) {
  try {
    const result = await apiFetch('/orders', { 
      method: 'POST', 
      body: JSON.stringify(payload), 
      signal 
    });
    return result;
  } catch (error: any) {
    if (error.status === 419) {
      // 419 usually means CSRF token expired or session expired
      console.error('❌ 419 Error - CSRF/Session expired:', error);
      throw new ApiError('Session expired or CSRF token invalid. Please refresh and try again.', 419);
    }
    throw error;
  }
}
// GET /orders/:id
export async function getOrderById(orderId: string | number, signal?: AbortSignal) {
  return apiFetch(`/orders/${orderId}`, { method: 'GET', signal });
}
// DELETE /orders/:id
export async function deleteOrder(orderId: string | number, signal?: AbortSignal) {
  return apiFetch(`/orders/${orderId}`, { method: 'DELETE', signal });
}

// ---------------- Appointments types & endpoints ----------------
export type AppointmentStatus = "pending" | "accepted" | "rejected" | "completed" | "cancelled";

export type Appointment = {
  id: number;
  appointment_date: string;
  appointment_time: string;
  service_type: string;
  description?: string;
  duration?: number;
  location?: string;
  notes?: string;
  order_id?: number;
  order_notes?: string;
  status: AppointmentStatus;
  created_at: string;
  updated_at: string;
};
export type AppointmentsIndexParams = { 
  status?: AppointmentStatus; 
  date_from?: string; 
  date_to?: string; 
  search?: string; 
  sort_by?: "appointment_date" | "created_at" | "status"; 
  sort_order?: "asc" | "desc"; 
  per_page?: number; 
  page?: number; 
};

export type AvailableTimeSlotsResponse = {
  success: boolean;
  data: {
    date: string;
    day_of_week: string;
    available_slots: string[];
    total_slots: number;
    slot_duration: number;
  };
};

// GET /appointments
export async function getAppointments(params: AppointmentsIndexParams = {}, signal?: AbortSignal) {
  return apiFetch(`/appointments${_qs(params)}`, { method: "GET", signal });
}

// POST /appointments
export async function createAppointment(payload: {
  appointment_date: string; // YYYY-MM-DD
  appointment_time: string; // HH:MM
  service_type: string;
  description?: string;
  duration?: number; // in minutes
  location?: string;
  notes?: string;
  order_id?: number;
  order_notes?: string;
}, signal?: AbortSignal) {
  console.log('🔍 Creating appointment with payload:', payload);
  
  try {
    const result = await apiFetch('/appointments', { 
      method: 'POST', 
      body: JSON.stringify(payload), 
      signal 
    });
    console.log('✅ Appointment created successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to create appointment:', error);
    throw error;
  }
}

// GET /appointments/:id
export async function getAppointmentById(appointmentId: string | number, signal?: AbortSignal) {
  return apiFetch(`/appointments/${appointmentId}`, { method: 'GET', signal });
}

// GET /appointments/:id (detailed view)
export async function getAppointmentDetails(appointmentId: string | number, signal?: AbortSignal) {
  return apiFetch(`/appointments/${appointmentId}`, { method: 'GET', signal });
}

// PUT /appointments/:id
export async function updateAppointment(appointmentId: string | number, payload: {
  appointment_date?: string;
  appointment_time?: string;
  service_type?: string;
  description?: string;
  duration?: number;
  location?: string;
  notes?: string;
  order_id?: number;
  order_notes?: string;
}, signal?: AbortSignal) {
  console.log('🔍 Updating appointment with payload:', { appointmentId, payload });
  
  try {
    const result = await apiFetch(`/appointments/${appointmentId}`, { 
      method: 'PUT', 
      body: JSON.stringify(payload), 
      signal 
    });
    console.log('✅ Appointment updated successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to update appointment:', error);
    throw error;
  }
}

// DELETE /appointments/:id
export async function deleteAppointment(appointmentId: string | number, signal?: AbortSignal) {
  return apiFetch(`/appointments/${appointmentId}`, { method: 'DELETE', signal });
}

// Helper function to create appointment from order
export async function createAppointmentFromOrder(orderId: number, appointmentData: {
  appointment_date: string;
  appointment_time: string;
  service_type: string;
  description?: string;
  duration?: number;
  location?: string;
  notes?: string;
  order_notes?: string;
}, signal?: AbortSignal) {
  return createAppointment({
    ...appointmentData,
    order_id: orderId,
  }, signal);
}

// GET /appointments/available-slots
export async function getAvailableTimeSlots(date?: string, signal?: AbortSignal) {
  const params = date ? { date } : {};
  console.log('🔍 Getting available time slots for date:', date);
  console.log('🔍 API params:', params);
  return apiFetch(`/appointments/available-slots${_qs(params)}`, { method: 'GET', signal });
}