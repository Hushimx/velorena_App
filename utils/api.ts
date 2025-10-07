import { Platform } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useGlobalErrorStore } from '../store/useGlobalErrorStore';

// Platform-specific base URL configuration
const ENV_BASE = process.env.EXPO_PUBLIC_API_URL;
const DEFAULT_BASE = Platform.select({
  android: 'http://127.0.0.1:8000/api', // Android emulator -> localhost
  ios: 'http://127.0.0.1:8000/api',    // iOS simulator -> localhost
  default: 'http://127.0.0.1:8000/api' // Physical device fallback -> localhost
});
const BASE = (ENV_BASE && ENV_BASE.trim()) || DEFAULT_BASE || 'http://127.0.0.1:8000/api';

// Legacy API_URL for backward compatibility
export const API_URL = BASE;

// Smart image URL helper - uses the same base as API
export const getImageUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return BASE.replace('/api', '') + '/' + path.replace(/^\//, '');
};

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
    
    // Check for network errors and update global error state
    const globalErrorStore = useGlobalErrorStore.getState();
    if (globalErrorStore.isNetworkError(e)) {
      globalErrorStore.setServerDown(true, 'فشل في الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.');
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
    // Check for network errors and update global error state
    const globalErrorStore = useGlobalErrorStore.getState();
    if (globalErrorStore.isNetworkError(e)) {
      globalErrorStore.setServerDown(true, 'فشل في الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.');
    }
    
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

// Debounce utility to prevent spam requests
const requestCache = new Map<string, Promise<any>>();
const lastRequestTime = new Map<string, number>();
const DEBOUNCE_DELAY = 1000; // 1 second debounce

function debounceRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const lastTime = lastRequestTime.get(key) || 0;
  
  // If request was made recently, return the cached promise
  if (now - lastTime < DEBOUNCE_DELAY && requestCache.has(key)) {
    console.log(`⏳ Debouncing request for ${key}`);
    return requestCache.get(key)!;
  }
  
  // Make new request and cache it
  lastRequestTime.set(key, now);
  const promise = requestFn().catch((error) => {
    // If it's an auth error, clear the cache immediately to prevent retries
    if (error.message?.includes('Unauthenticated') || error.message?.includes('401')) {
      console.log(`🔐 Auth error for ${key}, clearing cache`);
      requestCache.delete(key);
    }
    throw error;
  }).finally(() => {
    // Clear cache after request completes (unless it was an auth error)
    setTimeout(() => {
      requestCache.delete(key);
    }, DEBOUNCE_DELAY);
  });
  
  requestCache.set(key, promise);
  return promise;
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
      'Accept': 'application/json',
    };

    // Only set Content-Type if it's not FormData (FormData needs automatic boundary)
    const isFormData = options.body instanceof FormData;
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    // Add existing headers (but don't override Content-Type for FormData)
    if (options.headers) {
      if (!isFormData || !(options.headers as any)['Content-Type']) {
        Object.assign(headers, options.headers);
      }
    }

    // Add authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('🔑 Token added to headers:', token.substring(0, 20) + '...');
    } else {
      console.log('❌ No token found for API request');
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

    // Debug logging for cart endpoints
    if (endpoint.startsWith('/cart')) {
      console.log('🛒 Cart API Request Details:');
      console.log('  URL:', `${API_URL}${endpoint}`);
      console.log('  Method:', options.method || 'GET');
      console.log('  Headers:', headers);
      console.log('  Token exists:', !!token);
      console.log('  Token preview:', token ? token.substring(0, 20) + '...' : 'No token');
      console.log('  Base URL:', BASE);
      console.log('  API_URL:', API_URL);
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
    } catch {
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

    // Debug logging for cart endpoints
    if (endpoint.startsWith('/cart')) {
      console.log('🛒 Cart API Response Details:');
      console.log('  Status:', response.status);
      console.log('  OK:', response.ok);
      console.log('  Response data:', data);
    }

    // Handle non-2xx responses
    if (!response.ok) {
      const errorMessage = data.message || `HTTP Error ${response.status}`;
      
      // Handle authentication errors globally
      if (response.status === 401) {
        console.log('🔐 Global auth error detected, clearing auth state');
        // Clear auth state to prevent infinite loops
        const authStore = useAuthStore.getState();
        if (authStore.token) {
          authStore.logout();
        }
      }
      
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
      const globalErrorStore = useGlobalErrorStore.getState();
      globalErrorStore.setServerDown(true, 'فشل في الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.');
      throw new ApiError('Network error. Please check your connection.', 0);
    }

    // Check for other network errors
    const globalErrorStore = useGlobalErrorStore.getState();
    if (globalErrorStore.isNetworkError(error)) {
      globalErrorStore.setServerDown(true, 'فشل في الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.');
    }

    // Handle other errors
    throw new ApiError(error instanceof Error ? error.message : 'Unknown error occurred', 0);
  }
}

/**
 * Login user with email and password
 */
export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  // Import the guest token function dynamically to avoid circular imports
  const { getCurrentGuestToken } = await import('../hooks/useHybridNotifications');
  const guestToken = getCurrentGuestToken();
  
  const loginData: any = {
    email,
    password,
  };
  
  // Include guest token if available
  if (guestToken) {
    loginData.guest_token = guestToken;
    console.log('🔗 Including guest token in login request');
  }

  const response = await apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(loginData),
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
  // Import the guest token function dynamically to avoid circular imports
  const { getCurrentGuestToken } = await import('../hooks/useHybridNotifications');
  const guestToken = getCurrentGuestToken();
  
  const registrationData: any = { ...userData };
  
  // Include guest token if available
  if (guestToken) {
    registrationData.guest_token = guestToken;
    console.log('🔗 Including guest token in registration request');
  }

  const response = await apiFetch<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(registrationData),
  });

  if (!response.data) {
    throw new ApiError('Registration failed: No user data received', 400);
  }

  return response.data;
}

// ---------------- OTP API types & endpoints ----------------
export type OtpType = 'email' | 'sms' | 'whatsapp' | 'fake';

export type SendOtpResponse = {
  success: boolean;
  message: string;
  data: {
    otp_id: string;
    expires_at: string;
    type: OtpType;
  };
};

export type VerifyOtpResponse = {
  success: boolean;
  message: string;
  data: {
    verified_at: string;
    otp_id: string;
  };
};

export type ResendOtpResponse = {
  success: boolean;
  message: string;
  data: {
    otp_id: string;
    expires_at: string;
    type: OtpType;
  };
};

/**
 * Send OTP to phone number via WhatsApp
 */
export async function sendOtp(phoneNumber: string, type: OtpType = 'whatsapp', expiryMinutes: number = 10, signal?: AbortSignal): Promise<SendOtpResponse> {
  console.log('🔍 Sending OTP:', { phoneNumber, type, expiryMinutes });
  
  try {
    const result = await apiFetch<SendOtpResponse>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({
        identifier: phoneNumber,
        type,
        expiry_minutes: expiryMinutes,
      }),
      signal,
    });
    
    console.log('✅ OTP sent successfully:', result);
    return result.data!;
  } catch (error) {
    console.error('❌ Failed to send OTP:', error);
    throw error;
  }
}

/**
 * Verify OTP code
 */
export async function verifyOtp(phoneNumber: string, code: string, type: OtpType = 'whatsapp', signal?: AbortSignal): Promise<VerifyOtpResponse> {
  console.log('🔍 Verifying OTP:', { phoneNumber, code, type });
  
  try {
    const result = await apiFetch<VerifyOtpResponse>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        identifier: phoneNumber,
        code,
        type,
      }),
      signal,
    });
    
    console.log('✅ OTP verified successfully:', result);
    return result.data!;
  } catch (error) {
    console.error('❌ Failed to verify OTP:', error);
    throw error;
  }
}

/**
 * Resend OTP
 */
export async function resendOtp(phoneNumber: string, type: OtpType = 'whatsapp', expiryMinutes: number = 10, signal?: AbortSignal): Promise<ResendOtpResponse> {
  console.log('🔍 Resending OTP:', { phoneNumber, type, expiryMinutes });
  
  try {
    const result = await apiFetch<ResendOtpResponse>('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({
        identifier: phoneNumber,
        type,
        expiry_minutes: expiryMinutes,
      }),
      signal,
    });
    
    console.log('✅ OTP resent successfully:', result);
    return result.data!;
  } catch (error) {
    console.error('❌ Failed to resend OTP:', error);
    throw error;
  }
}

// Email availability check
export interface CheckEmailResponse {
  success: boolean;
  message: string;
  available: boolean;
}

export async function checkEmailAvailability(email: string, signal?: AbortSignal): Promise<CheckEmailResponse> {
  console.log('🔍 Checking email availability:', { email });
  
  try {
    const result = await apiFetch<CheckEmailResponse>('/auth/check-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
      signal,
    });
    
    console.log('✅ Email availability checked:', result);
    
    // The response structure is: { success: true/false, data: { available: true/false, ... } }
    // OR when email is taken: { success: false, message: "...", available: false }
    if (result.data) {
      return result.data;
    } else {
      // Sometimes the response puts available at the top level
      return {
        success: result.success,
        message: result.message || '',
        available: (result as any).available || false
      };
    }
  } catch (error) {
    console.error('❌ Failed to check email availability:', error);
    
    // If it's a 422 error, it means email is already taken
    if (error instanceof ApiError && error.status === 422) {
      return {
        success: false,
        message: 'Email is already taken',
        available: false
      };
    }
    
    throw error;
  }
}

// Phone availability check
export interface CheckPhoneResponse {
  success: boolean;
  message: string;
  available: boolean;
}

export async function checkPhoneAvailability(phone: string, signal?: AbortSignal): Promise<CheckPhoneResponse> {
  console.log('🔍 Checking phone availability:', { phone });
  
  try {
    const result = await apiFetch<CheckPhoneResponse>('/auth/check-phone', {
      method: 'POST',
      body: JSON.stringify({ phone }),
      signal,
    });
    
    console.log('✅ Phone availability checked:', result);
    
    if (result.data) {
      return result.data;
    } else {
      return {
        success: result.success,
        message: result.message || '',
        available: (result as any).available || false
      };
    }
  } catch (error) {
    console.error('❌ Failed to check phone availability:', error);
    
    // If it's a 422 error, it means phone is already taken
    if (error instanceof ApiError && error.status === 422) {
      return {
        success: false,
        message: 'Phone is already taken',
        available: false
      };
    }
    
    throw error;
  }
}

// Forgot Password - Send OTP
export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  otp_id?: number;
  phone?: string;
}

export async function forgotPassword(identifier: string, signal?: AbortSignal): Promise<ForgotPasswordResponse> {
  console.log('🔍 Requesting password reset:', { identifier });
  
  try {
    const result = await apiFetch<ForgotPasswordResponse>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ identifier }),
      signal,
    });
    
    console.log('✅ Password reset OTP sent:', result);
    return result.data || { success: result.success, message: result.message || 'OTP sent successfully' };
  } catch (error) {
    console.error('❌ Failed to send password reset OTP:', error);
    throw error;
  }
}

// Reset Password - Verify OTP and Set New Password
export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export async function resetPassword(
  phone: string,
  code: string,
  password: string,
  password_confirmation: string,
  signal?: AbortSignal
): Promise<ResetPasswordResponse> {
  console.log('🔍 Resetting password');
  
  try {
    const result = await apiFetch<ResetPasswordResponse>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ phone, code, password, password_confirmation }),
      signal,
    });
    
    console.log('✅ Password reset successfully:', result);
    return result.data || { success: result.success, message: result.message || 'Password reset successfully' };
  } catch (error) {
    console.error('❌ Failed to reset password:', error);
    throw error;
  }
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
 * Get product details by ID (backward compatibility)
 */
export async function getProductDetail(id: string, signal?: AbortSignal) {
  return getJSON(`/products/id/${id}`, undefined, signal);
}


/**
 * Design type definition
 */
export interface Design {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  thumbnail_url?: string;
  category: string;
  tags?: string[];
  in_cart?: boolean;
  metadata?: {
    author?: string;
    license?: string;
    premium?: boolean;
  };
  created_at: string;
  updated_at: string;
}

/**
 * Cart Design type definition
 */
export interface CartDesign {
  id: number;
  user_id?: number;
  session_id?: string;
  title: string;
  design_data: {
    original_design_id: string;
  };
  image_url: string;
  thumbnail_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Search designs using external API (Freepik)
 */
export async function searchDesigns(query: string, category?: string, signal?: AbortSignal) {
  const params: Record<string, string> = {};
  if (query) params.search = query;
  if (category) params.category = category;
  
  return apiFetch<{ data: Design[]; search?: string; category?: string }>(`/designs/search${_qs(params)}`, { 
    method: 'GET', 
    signal 
  });
}

/**
 * Get cart designs (supports both authenticated users and guests)
 */
export async function getCartDesigns(signal?: AbortSignal) {
  return debounceRequest('cart-designs', () => 
    apiFetch<{ data: CartDesign[]; count: number; user_type: string }>('/designs/cart', { method: 'GET', signal })
  );
}

/**
 * Save design to cart (supports both authenticated users and guests)
 */
export async function saveDesignToCart(payload: {
  design_id: string;
  title: string;
  image_url: string;
}, signal?: AbortSignal) {
  console.log('🔍 Saving design to cart:', payload);
  
  try {
    const result = await apiFetch('/designs/save-to-cart', { 
      method: 'POST', 
      body: JSON.stringify(payload), 
      signal 
    });
    console.log('✅ Design saved to cart successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to save design to cart:', error);
    throw error;
  }
}

/**
 * Delete design from cart
 */
export async function deleteDesignFromCart(payload: {
  design_id: string;
  title: string;
  image_url: string;
}, signal?: AbortSignal) {
  console.log('🔍 Deleting design from cart:', payload);
  
  try {
    const result = await apiFetch('/designs/delete-from-cart', { 
      method: 'POST', 
      body: JSON.stringify(payload), 
      signal 
    });
    console.log('✅ Design deleted from cart successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to delete design from cart:', error);
    throw error;
  }
}

/**
 * Add design to favorites (requires authentication)
 */
export async function addDesignToFavorites(payload: {
  design_id: string;
  title: string;
  image_url: string;
}, signal?: AbortSignal) {
  console.log('🔍 Adding design to favorites:', payload);
  
  try {
    const result = await apiFetch('/designs/add-to-favorites', { 
      method: 'POST', 
      body: JSON.stringify(payload), 
      signal 
    });
    console.log('✅ Design added to favorites successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to add design to favorites:', error);
    throw error;
  }
}

/**
 * Get user's saved designs (legacy function for backward compatibility)
 */
export async function getSavedDesigns(params: { page?: number; per_page?: number } = {}, signal?: AbortSignal) {
  return apiFetch(`/designs/saved${_qs(params)}`, { method: 'GET', signal });
}

/**
 * Save design to favorites (legacy function for backward compatibility)
 */
export async function saveDesign(payload: {
  design_id: string;
  notes?: string;
  custom_image?: File | Blob;
  image_type?: 'edited' | 'custom' | 'modified';
}, signal?: AbortSignal) {
  const formData = new FormData();
  formData.append('design_id', payload.design_id);
  if (payload.notes) formData.append('notes', payload.notes);
  if (payload.custom_image) {
    const filename = payload.custom_image instanceof File ? payload.custom_image.name : 'custom_image.jpg';
    formData.append('custom_image', payload.custom_image as any, filename);
  }
  if (payload.image_type) formData.append('image_type', payload.image_type);

  return apiFetch('/designs/save', {
    method: 'POST',
    body: formData,
    signal
  });
}

/**
 * Update favorite design
 */
export async function updateFavoriteDesign(designId: string, payload: {
  new_design_id?: string;
  notes?: string;
  custom_image?: File | Blob;
  image_type?: 'edited' | 'custom' | 'modified';
}, signal?: AbortSignal) {
  const formData = new FormData();
  if (payload.new_design_id) formData.append('new_design_id', payload.new_design_id);
  if (payload.notes) formData.append('notes', payload.notes);
  if (payload.custom_image) {
    const filename = payload.custom_image instanceof File ? payload.custom_image.name : 'custom_image.jpg';
    formData.append('custom_image', payload.custom_image as any, filename);
  }
  if (payload.image_type) formData.append('image_type', payload.image_type);

  return apiFetch(`/designs/favorite/${designId}`, {
    method: 'PUT',
    body: formData,
    signal
  });
}

/**
 * Remove design from favorites
 */
export async function removeFavoriteDesign(designId: string, signal?: AbortSignal) {
  return apiFetch(`/designs/favorite/${designId}`, { method: 'DELETE', signal });
}

/**
 * Upload multiple ready design files
 */
export async function uploadReadyDesign(designFiles: (File | Blob)[], signal?: AbortSignal) {
  try {
    console.log('📤 Starting design upload with', designFiles.length, 'files');
    
    const formData = new FormData();
    
    // Append all design files with proper filenames
    designFiles.forEach((file, index) => {
      const filename = `design_${index + 1}.jpg`; // Provide a filename for React Native
      console.log(`📎 Appending file ${index + 1}:`, { 
        type: file.constructor.name, 
        size: file.size, 
        filename 
      });
      
      // For React Native, we need to handle Blob differently
      if (file instanceof Blob) {
        // Convert Blob to a format React Native FormData can handle
        formData.append('design_files[]', {
          uri: file, // React Native expects uri property
          type: file.type || 'image/jpeg',
          name: filename,
        } as any);
      } else {
        formData.append('design_files[]', file as any, filename);
      }
    });

    console.log('🚀 Uploading design files to server...');
    // Use test endpoint for debugging
    const result = await apiFetch('/test-design-upload', {
      method: 'POST',
      body: formData,
      signal
    });
    
    console.log('✅ Upload successful:', result);
    return result;
  } catch (error) {
    console.error('❌ Upload failed:', error);
    throw error;
  }
}

/**
 * Upload designs using React Native FormData directly (no Blob conversion)
 */
export async function uploadReadyDesignDirect(formData: FormData, signal?: AbortSignal) {
  try {
    console.log('📤 Starting direct design upload');
    
    console.log('🚀 Uploading FormData directly to server...');
    const result = await apiFetch('/designs/upload-ready-design', {
      method: 'POST',
      body: formData,
      signal
    });
    
    console.log('✅ Upload successful:', result);
    return result;
  } catch (error) {
    console.error('❌ Upload failed:', error);
    throw error;
  }
}

/**
 * Get specific design details
 */
export async function getDesignDetails(designId: string, signal?: AbortSignal) {
  return apiFetch(`/designs/${designId}`, { method: 'GET', signal });
}

/**
 * Search products
 */
export async function searchProducts(query: string, page = 1, limit = 20, signal?: AbortSignal) {
  return getJSON('/products/search', { q: query, page, limit }, signal);
}

/**
 * Get highlights with pagination and search
 */
export async function getHighlights({ page = 1, limit = 15, search = '' } = {}, signal?: AbortSignal) {
  return getJSON('/highlights', { page, limit, search }, signal);
}

/**
 * Get specific highlight by slug
 */
export async function getHighlight(slug: string, signal?: AbortSignal) {
  return getJSON(`/highlights/${slug}`, undefined, signal);
}

/**
 * Get products for a specific highlight
 */
export async function getHighlightProducts(highlightSlug: string, { page = 1, limit = 15, search = '' } = {}, signal?: AbortSignal) {
  return getJSON(`/highlights/${highlightSlug}/products`, { page, limit, search }, signal);
}

/**
 * Get home banners for carousel
 */
export async function getHomeBanners(signal?: AbortSignal) {
  return getJSON('/home-banners', undefined, signal);
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
   
  console.log('🌐 API Configuration:');
  console.log('   EXPO_PUBLIC_API_URL =', process.env.EXPO_PUBLIC_API_URL);
  console.log('   Platform =', Platform.OS);
  console.log('   BASE URL =', BASE);
  console.log('   API_URL =', API_URL);
  console.log('   Timeout = 10 seconds');
}

// ---------------- Orders types & endpoints ----------------
export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "deleted";
export type OrdersIndexParams = { status?: OrderStatus | "cancelled_or_deleted"; search?: string; sort_by?: "created_at" | "order_number" | "total" | "status"; sort_order?: "asc" | "desc"; per_page?: number; page?: number; };
export type CreateOrderBody = { items: { product_id: number; quantity: number; options?: number[] }[]; shipping_address?: string; billing_address?: string; phone?: string; notes?: string; };

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

// POST /orders/:id/payment - Initiate payment for an order
export async function initiatePayment(orderId: string | number, signal?: AbortSignal) {
  console.log('💳 Initiating payment for order:', orderId);
  
  try {
    const result = await apiFetch(`/orders/${orderId}/payment`, {
      method: 'POST',
      signal
    });
    console.log('✅ Payment initiated successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to initiate payment:', error);
    throw error;
  }
}
// DELETE /orders/:id
export async function deleteOrder(orderId: string | number, signal?: AbortSignal) {
  return apiFetch(`/orders/${orderId}`, { method: 'DELETE', signal });
}

// ---------------- Appointments types & endpoints ----------------
export type AppointmentStatus = "pending" | "accepted" | "rejected" | "completed" | "cancelled" | "started";

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
  zoom_meeting_url?: string;
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

// POST /appointments/create-from-cart
export async function createAppointmentFromCart(appointmentData: {
  appointment_date: string;
  appointment_time: string;
  service_type: string;
  description?: string;
  duration?: number;
  location?: string;
  notes?: string;
  order_notes?: string;
}, signal?: AbortSignal) {
  console.log('🛒 Creating appointment from cart with data:', appointmentData);
  return apiFetch('/appointments/create-from-cart', {
    method: 'POST',
    body: JSON.stringify(appointmentData),
    signal,
  });
}

// GET /appointments/available-slots
export async function getAvailableTimeSlots(date?: string, signal?: AbortSignal) {
  const params = date ? { date } : {};
  console.log('🔍 Getting available time slots for date:', date);
  console.log('🔍 API params:', params);
  return apiFetch(`/appointments/available-slots${_qs(params)}`, { method: 'GET', signal });
}

// ---------------- Support Tickets types & endpoints ----------------
export type SupportTicketStatus = "open" | "in_progress" | "pending" | "resolved" | "closed";
export type SupportTicketPriority = "low" | "medium" | "high" | "urgent";
export type SupportTicketCategory = "technical" | "billing" | "general" | "feature_request" | "bug_report";

export type SupportTicket = {
  id: number;
  ticket_number: string;
  subject: string;
  description: string;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  category: SupportTicketCategory;
  attachments: string[];
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  assigned_admin?: {
    id: number;
    name: string;
  };
  replies?: SupportTicketReply[];
};

export type SupportTicketReply = {
  id: number;
  message: string;
  attachments: string[];
  author_type: "user" | "admin" | "system";
  author_name: string;
  created_at: string;
};

export type SupportTicketsIndexParams = {
  status?: SupportTicketStatus;
  priority?: SupportTicketPriority;
  category?: SupportTicketCategory;
  page?: number;
  per_page?: number;
};

export type CreateSupportTicketBody = {
  subject: string;
  description: string;
  priority: SupportTicketPriority;
  category: SupportTicketCategory;
  attachments?: string[];
};

export type CreateSupportTicketReplyBody = {
  message: string;
  attachments?: string[];
};

export type SupportTicketStatistics = {
  total: number;
  open: number;
  closed: number;
  by_priority: Record<SupportTicketPriority, number>;
  by_category: Record<SupportTicketCategory, number>;
};

// GET /support-tickets
export async function getSupportTickets(params: SupportTicketsIndexParams = {}, signal?: AbortSignal) {
  return apiFetch(`/support-tickets${_qs(params)}`, { method: 'GET', signal });
}

// POST /support-tickets
export async function createSupportTicket(payload: CreateSupportTicketBody, signal?: AbortSignal) {
  console.log('🔍 Creating support ticket with payload:', payload);
  
  try {
    const result = await apiFetch('/support-tickets', { 
      method: 'POST', 
      body: JSON.stringify(payload), 
      signal 
    });
    console.log('✅ Support ticket created successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to create support ticket:', error);
    throw error;
  }
}

// GET /support-tickets/:id
export async function getSupportTicketById(ticketId: string | number, signal?: AbortSignal) {
  return apiFetch(`/support-tickets/${ticketId}`, { method: 'GET', signal });
}

// POST /support-tickets/:id/replies
export async function addSupportTicketReply(ticketId: string | number, payload: CreateSupportTicketReplyBody, signal?: AbortSignal) {
  console.log('🔍 Adding reply to support ticket:', { ticketId, payload });
  
  try {
    const result = await apiFetch(`/support-tickets/${ticketId}/replies`, { 
      method: 'POST', 
      body: JSON.stringify(payload), 
      signal 
    });
    console.log('✅ Support ticket reply added successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to add support ticket reply:', error);
    throw error;
  }
}

// GET /support-tickets/:id/replies
export async function getSupportTicketReplies(ticketId: string | number, signal?: AbortSignal) {
  return apiFetch(`/support-tickets/${ticketId}/replies`, { method: 'GET', signal });
}

// GET /support-tickets/statistics
export async function getSupportTicketStatistics(signal?: AbortSignal) {
  return apiFetch('/support-tickets/statistics', { method: 'GET', signal });
}

// ---------------- Cart API types & endpoints ----------------
export type CartItem = {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: string;
  total_price: string;
  selected_options: Record<string, string>;
  notes?: string;
  created_at: string;
  product: {
    id: number;
    name: string;
    name_ar: string;
    base_price: string;
    options: {
      id: number;
      name: string;
      type: string;
      values: {
        id: number;
        name: string;
        price_adjustment: string;
      }[];
    }[];
  };
};

export type CartSummary = {
  item_count: number;
  subtotal: string;
  tax: string;
  total: string;
};

export type CartResponse = {
  items: CartItem[];
  summary: CartSummary;
};

export type AddToCartBody = {
  product_id: number;
  quantity: number;
  selected_options?: Record<string, string>;
  notes?: string;
};

export type UpdateCartItemBody = {
  quantity: number;
};

// GET /cart/items
export async function getCartItems(signal?: AbortSignal) {
  return debounceRequest('cart-items', () => 
    apiFetch<CartResponse>('/cart/items', { method: 'GET', signal })
  );
}

// POST /cart/add
export async function addToCart(payload: AddToCartBody, signal?: AbortSignal) {
  console.log('🔍 Adding item to cart:', payload);
  
  try {
    const result = await apiFetch('/cart/add', { 
      method: 'POST', 
      body: JSON.stringify(payload), 
      signal 
    });
    console.log('✅ Item added to cart successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to add item to cart:', error);
    throw error;
  }
}

// PUT /cart/items/:cartItemId
export async function updateCartItem(cartItemId: number, payload: UpdateCartItemBody, signal?: AbortSignal) {
  console.log('🔍 Updating cart item:', { cartItemId, payload });
  
  try {
    const result = await apiFetch(`/cart/items/${cartItemId}`, { 
      method: 'PUT', 
      body: JSON.stringify(payload), 
      signal 
    });
    console.log('✅ Cart item updated successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to update cart item:', error);
    throw error;
  }
}

// DELETE /cart/items/:cartItemId
export async function removeCartItem(cartItemId: number, signal?: AbortSignal) {
  console.log('🔍 Removing cart item:', cartItemId);
  
  try {
    const result = await apiFetch(`/cart/items/${cartItemId}`, { 
      method: 'DELETE', 
      signal 
    });
    console.log('✅ Cart item removed successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to remove cart item:', error);
    throw error;
  }
}

// DELETE /cart/clear
export async function clearCart(signal?: AbortSignal) {
  console.log('🔍 Clearing cart');
  
  try {
    const result = await apiFetch('/cart/clear', { 
      method: 'DELETE', 
      signal 
    });
    console.log('✅ Cart cleared successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to clear cart:', error);
    throw error;
  }
}

// ========================================
// EXPO PUSH NOTIFICATION API FUNCTIONS
// ========================================

export interface ExpoPushTokenData {
  token: string;
  device_id?: string;
  platform?: 'ios' | 'android' | 'web';
}

export interface ExpoPushTokenResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    token: string;
    platform: string;
    device_id: string;
    is_active: boolean;
    created_at: string;
  };
}

// POST /expo-push/register-guest (no authentication required)
export async function registerGuestExpoPushToken(
  tokenData: ExpoPushTokenData,
  signal?: AbortSignal
): Promise<ExpoPushTokenResponse> {
  console.log('🔔 Registering guest Expo push token');
  
  try {
    const result = await fetch(`${BASE}/expo-push/register-guest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(tokenData),
      signal
    });

    if (!result.ok) {
      throw new Error(`HTTP error! status: ${result.status}`);
    }

    const data = await result.json();
    console.log('✅ Guest Expo push token registered successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Failed to register guest Expo push token:', error);
    throw error;
  }
}

// POST /expo-push/register
export async function registerExpoPushToken(
  tokenData: ExpoPushTokenData,
  signal?: AbortSignal
): Promise<ExpoPushTokenResponse> {
  console.log('🔔 Registering Expo push token');
  
  try {
    const result = await apiFetch('/expo-push/register', {
      method: 'POST',
      body: JSON.stringify(tokenData),
      signal
    });
    console.log('✅ Expo push token registered successfully:', result);
    return result.data || { success: result.success, message: result.message || 'Token registered successfully' };
  } catch (error) {
    console.error('❌ Failed to register Expo push token:', error);
    throw error;
  }
}

// GET /expo-push/tokens
export async function getExpoPushTokens(signal?: AbortSignal) {
  console.log('🔔 Getting Expo push tokens');
  
  try {
    const result = await apiFetch('/expo-push/tokens', {
      method: 'GET',
      signal
    });
    console.log('✅ Expo push tokens retrieved successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to get Expo push tokens:', error);
    throw error;
  }
}

// POST /expo-push/deactivate
export async function deactivateExpoPushToken(
  tokenId: number,
  signal?: AbortSignal
) {
  console.log('🔔 Deactivating Expo push token');
  
  try {
    const result = await apiFetch('/expo-push/deactivate', {
      method: 'POST',
      body: JSON.stringify({ token_id: tokenId }),
      signal
    });
    console.log('✅ Expo push token deactivated successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to deactivate Expo push token:', error);
    throw error;
  }
}

// DELETE /expo-push/delete
export async function deleteExpoPushToken(
  tokenId: number,
  signal?: AbortSignal
) {
  console.log('🔔 Deleting Expo push token');
  
  try {
    const result = await apiFetch('/expo-push/delete', {
      method: 'DELETE',
      body: JSON.stringify({ token_id: tokenId }),
      signal
    });
    console.log('✅ Expo push token deleted successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to delete Expo push token:', error);
    throw error;
  }
}

// POST /expo-push/test
export async function sendTestExpoNotification(signal?: AbortSignal) {
  console.log('🔔 Sending test Expo notification');
  
  try {
    const result = await apiFetch('/expo-push/test', {
      method: 'POST',
      signal
    });
    console.log('✅ Test Expo notification sent successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to send test Expo notification:', error);
    throw error;
  }
}

// ========================================
// ADDRESS MANAGEMENT API
// ========================================

export interface Address {
  id: number;
  user_id: number;
  name?: string;
  contact_name: string;
  contact_phone: string;
  address_line: string;
  city?: string;
  district?: string;
  postal_code?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  delivery_instruction: 'hand_to_me' | 'leave_at_spot';
  drop_off_location?: string;
  additional_notes?: string;
  building_image_url?: string;
  is_default: boolean;
  full_address: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAddressPayload {
  name?: string;
  contact_name: string;
  contact_phone: string;
  address_line: string;
  city?: string;
  district?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  delivery_instruction?: 'hand_to_me' | 'leave_at_spot';
  drop_off_location?: string;
  additional_notes?: string;
  building_image_url?: string;
  is_default?: boolean;
}

// GET /addresses - Get all user addresses
export async function getAddresses(signal?: AbortSignal): Promise<Address[]> {
  console.log('📍 Fetching user addresses');
  
  try {
    const result = await apiFetch('/addresses', {
      method: 'GET',
      signal
    });
    console.log('✅ Addresses fetched successfully:', result);
    return result.data || [];
  } catch (error) {
    console.error('❌ Failed to fetch addresses:', error);
    throw error;
  }
}

// GET /addresses/{id} - Get specific address
export async function getAddress(addressId: number, signal?: AbortSignal): Promise<Address> {
  console.log('📍 Fetching address:', addressId);
  
  try {
    const result = await apiFetch(`/addresses/${addressId}`, {
      method: 'GET',
      signal
    });
    console.log('✅ Address fetched successfully:', result);
    return result.data;
  } catch (error) {
    console.error('❌ Failed to fetch address:', error);
    throw error;
  }
}

// POST /addresses - Create new address
export async function createAddress(payload: CreateAddressPayload, signal?: AbortSignal): Promise<Address> {
  console.log('📍 Creating new address:', payload);
  
  try {
    const result = await apiFetch('/addresses', {
      method: 'POST',
      body: JSON.stringify(payload),
      signal
    });
    console.log('✅ Address created successfully:', result);
    return result.data;
  } catch (error) {
    console.error('❌ Failed to create address:', error);
    throw error;
  }
}

// PUT /addresses/{id} - Update address
export async function updateAddress(addressId: number, payload: Partial<CreateAddressPayload>, signal?: AbortSignal): Promise<Address> {
  console.log('📍 Updating address:', addressId, payload);
  
  try {
    const result = await apiFetch(`/addresses/${addressId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      signal
    });
    console.log('✅ Address updated successfully:', result);
    return result.data;
  } catch (error) {
    console.error('❌ Failed to update address:', error);
    throw error;
  }
}

// DELETE /addresses/{id} - Delete address
export async function deleteAddress(addressId: number, signal?: AbortSignal): Promise<void> {
  console.log('📍 Deleting address:', addressId);
  
  try {
    const result = await apiFetch(`/addresses/${addressId}`, {
      method: 'DELETE',
      signal
    });
    console.log('✅ Address deleted successfully:', result);
  } catch (error) {
    console.error('❌ Failed to delete address:', error);
    throw error;
  }
}

// POST /addresses/{id}/set-default - Set address as default
export async function setDefaultAddress(addressId: number, signal?: AbortSignal): Promise<Address> {
  console.log('📍 Setting default address:', addressId);
  
  try {
    const result = await apiFetch(`/addresses/${addressId}/set-default`, {
      method: 'POST',
      signal
    });
    console.log('✅ Default address set successfully:', result);
    return result.data;
  } catch (error) {
    console.error('❌ Failed to set default address:', error);
    throw error;
  }
}