import { useAuthStore } from '../store/useAuthStore';

// API Configuration
export const API_URL = 'http://134.255.216.155:8001/api';

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

export interface OtpResponse {
  success: boolean;
  message: string;
  otpId?: string;
  expiresAt?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  isVerified: boolean;
  otpId?: string;
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
 * Send OTP to user via email, SMS, or WhatsApp
 */
export async function sendOtp(
  identifier: string, 
  type: 'email' | 'sms' | 'whatsapp'
): Promise<OtpResponse> {
  const response = await apiFetch<OtpResponse>('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({
      identifier,
      type,
    }),
  });

  if (!response.success) {
    throw new ApiError(response.message || 'فشل في إرسال رمز التحقق', 400);
  }

  return {
    success: response.success,
    message: response.message || 'تم إرسال رمز التحقق',
    otpId: response.data?.otpId,
    expiresAt: response.data?.expiresAt,
  };
}

/**
 * Verify OTP code
 */
export async function verifyOtp(
  identifier: string,
  code: string,
  type: 'email' | 'sms' | 'whatsapp'
): Promise<VerifyOtpResponse> {
  const response = await apiFetch<VerifyOtpResponse>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({
      identifier,
      code,
      type,
    }),
  });

  if (!response.success) {
    throw new ApiError(response.message || 'فشل في التحقق من الرمز', 400);
  }

  return {
    success: response.success,
    message: response.message || 'تم التحقق من الرمز',
    isVerified: response.data?.isVerified || false,
    otpId: response.data?.otpId,
  };
}

/**
 * Resend OTP to user
 */
export async function resendOtp(
  identifier: string,
  type: 'email' | 'sms' | 'whatsapp'
): Promise<OtpResponse> {
  const response = await apiFetch<OtpResponse>('/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify({
      identifier,
      type,
    }),
  });

  if (!response.success) {
    throw new ApiError(response.message || 'فشل في إعادة إرسال رمز التحقق', 400);
  }

  return {
    success: response.success,
    message: response.message || 'تم إعادة إرسال رمز التحقق',
    otpId: response.data?.otpId,
    expiresAt: response.data?.expiresAt,
  };
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
