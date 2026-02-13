// API utility functions for frontend-backend communication

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    message: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

// Workspace types
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  settings?: any;
  userRole: string;
  _count: {
    contacts: number;
    conversations: number;
    bookings: number;
    forms: number;
    inventory: number;
    integrations: number;
  };
}

export interface CreateWorkspaceData {
  name: string;
  slug: string;
  description?: string;
  settings?: any;
}

// Contact types
export interface Contact {
  id: string;
  workspaceId: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  tags: string[];
  customFields?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactData {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  tags?: string[];
  customFields?: any;
}

// API Client class
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    
    // Load token from localStorage on client side
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data?.token) {
      this.token = response.data.token;
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }

    return response;
  }

  async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.success && response.data?.token) {
      this.token = response.data.token;
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }

    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.token = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
    }
  }

  // Workspace methods
  async getWorkspaces(): Promise<ApiResponse<Workspace[]>> {
    return this.request<Workspace[]>('/workspaces');
  }

  async getWorkspace(id: string): Promise<ApiResponse<Workspace>> {
    return this.request<Workspace>(`/workspaces/${id}`);
  }

  async createWorkspace(data: CreateWorkspaceData): Promise<ApiResponse<Workspace>> {
    return this.request<Workspace>('/workspaces', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWorkspace(id: string, data: Partial<CreateWorkspaceData>): Promise<ApiResponse<Workspace>> {
    return this.request<Workspace>(`/workspaces/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteWorkspace(id: string): Promise<ApiResponse> {
    return this.request(`/workspaces/${id}`, {
      method: 'DELETE',
    });
  }

  async inviteUserToWorkspace(workspaceId: string, email: string, role: string): Promise<ApiResponse> {
    return this.request(`/workspaces/${workspaceId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
  }

  // Contact methods
  async getContacts(workspaceId: string, page = 1, limit = 20): Promise<PaginatedResponse<Contact>> {
    return this.request<Contact[]>(`/contacts?workspaceId=${workspaceId}&page=${page}&limit=${limit}`);
  }

  async getContact(id: string): Promise<ApiResponse<Contact>> {
    return this.request<Contact>(`/contacts/${id}`);
  }

  async createContact(workspaceId: string, data: CreateContactData): Promise<ApiResponse<Contact>> {
    return this.request<Contact>('/contacts', {
      method: 'POST',
      body: JSON.stringify({ ...data, workspaceId }),
    });
  }

  async updateContact(id: string, data: Partial<CreateContactData>): Promise<ApiResponse<Contact>> {
    return this.request<Contact>(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteContact(id: string): Promise<ApiResponse> {
    return this.request(`/contacts/${id}`, {
      method: 'DELETE',
    });
  }

  // Conversation methods
  async getConversations(workspaceId: string, page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    return this.request<any[]>(`/conversations?workspaceId=${workspaceId}&page=${page}&limit=${limit}`);
  }

  async getConversation(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/conversations/${id}`);
  }

  async createConversation(workspaceId: string, data: any): Promise<ApiResponse<any>> {
    return this.request<any>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ ...data, workspaceId }),
    });
  }

  // Booking methods
  async getBookings(workspaceId: string, page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    return this.request<any[]>(`/bookings?workspaceId=${workspaceId}&page=${page}&limit=${limit}`);
  }

  async getBooking(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/bookings/${id}`);
  }

  async createBooking(workspaceId: string, data: any): Promise<ApiResponse<any>> {
    return this.request<any>('/bookings', {
      method: 'POST',
      body: JSON.stringify({ ...data, workspaceId }),
    });
  }

  // Form methods
  async getForms(workspaceId: string, page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    return this.request<any[]>(`/forms?workspaceId=${workspaceId}&page=${page}&limit=${limit}`);
  }

  async getForm(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/forms/${id}`);
  }

  async createForm(workspaceId: string, data: any): Promise<ApiResponse<any>> {
    return this.request<any>('/forms', {
      method: 'POST',
      body: JSON.stringify({ ...data, workspaceId }),
    });
  }

  async getFormSubmissions(formId: string): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/forms/${formId}/submissions`);
  }

  // Inventory methods
  async getInventory(workspaceId: string, page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    return this.request<any[]>(`/inventory?workspaceId=${workspaceId}&page=${page}&limit=${limit}`);
  }

  async getInventoryItem(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/inventory/${id}`);
  }

  async createInventoryItem(workspaceId: string, data: any): Promise<ApiResponse<any>> {
    return this.request<any>('/inventory', {
      method: 'POST',
      body: JSON.stringify({ ...data, workspaceId }),
    });
  }

  // Integration methods
  async getIntegrations(workspaceId: string): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/integrations?workspaceId=${workspaceId}`);
  }

  async createIntegration(workspaceId: string, data: any): Promise<ApiResponse<any>> {
    return this.request<any>('/integrations', {
      method: 'POST',
      body: JSON.stringify({ ...data, workspaceId }),
    });
  }

  // Dashboard methods
  async getDashboardStats(workspaceId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/dashboard/stats/${workspaceId}`);
  }

  async getDashboardAnalytics(workspaceId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/dashboard/analytics?workspaceId=${workspaceId}`);
  }

  // Public API methods (no authentication required)
  async getPublicWorkspace(workspaceId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/public/workspaces/${workspaceId}`);
  }

  async submitPublicForm(data: any): Promise<ApiResponse> {
    return this.request('/public/forms/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createPublicBooking(data: any): Promise<ApiResponse> {
    return this.request('/public/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// Create and export API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Utility functions for common operations
export const apiUtils = {
  // Handle API errors consistently
  handleError: (error: any): string => {
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('auth_token');
  },

  // Get current user
  getCurrentUser: () => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Get auth token
  getAuthToken: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  },

  // Clear auth data
  clearAuth: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }
};

// React hooks for API calls (if using React)
export const useApi = () => {
  return {
    api: apiClient,
    utils: apiUtils
  };
};

export default apiClient;
