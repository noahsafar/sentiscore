import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { useState, useEffect } from 'react';
import { ApiResponse, PaginatedEntries } from '@/types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'http://localhost:8000',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.client.interceptors.request.use(
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

    // Handle response errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post('http://localhost:8000/api/auth/login', { email, password });
    return response.data;
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    timezone: string;
  }) {
    const response = await this.client.post('http://localhost:8000/api/auth/register', userData);
    return response.data;
  }

  async logout() {
    await this.client.post('http://localhost:8000/api/auth/logout');
  }

  async refreshToken() {
    const response = await this.client.post('http://localhost:8000/api/auth/refresh');
    return response.data;
  }

  // User endpoints
  async getProfile() {
    const response = await this.client.get('http://localhost:8000/api/users/me');
    return response.data;
  }

  async updateProfile(userData: {
    name?: string;
    email?: string;
    timezone?: string;
    preferences?: any;
  }) {
    const response = await this.client.patch('http://localhost:8000/api/users/me', userData);
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await this.client.post('http://localhost:8000/api/users/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  }

  // Entry endpoints
  async getEntries(params?: {
    page?: number;
    limit?: number;
    dateRange?: { start: Date; end: Date };
    tags?: string[];
    moodRange?: { min: number; max: number };
  }): Promise<ApiResponse<PaginatedEntries>> {
    const response = await this.client.get('http://localhost:8000/api/entries', { params });
    return response.data;
  }

  async getEntry(id: string): Promise<ApiResponse> {
    const response = await this.client.get(`http://localhost:8000/api/entries/${id}`);
    return response.data;
  }

  async createEntry(data: {
    transcript: string;
    audio?: Blob;
    duration?: number;
    tags?: string[];
    isPublic?: boolean;
  }) {
    const formData = new FormData();
    formData.append('transcript', data.transcript);
    if (data.audio) {
      formData.append('audio', data.audio, 'recording.webm');
    }
    if (data.duration) {
      formData.append('duration', data.duration.toString());
    }
    if (data.tags) {
      formData.append('tags', JSON.stringify(data.tags));
    }
    if (data.isPublic !== undefined) {
      formData.append('isPublic', data.isPublic.toString());
    }

    const response = await this.client.post('http://localhost:8000/api/entries', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async updateEntry(id: string, data: {
    transcript?: string;
    tags?: string[];
    isPublic?: boolean;
  }) {
    const response = await this.client.patch(`http://localhost:8000/api/entries/${id}`, data);
    return response.data;
  }

  async deleteEntry(id: string) {
    const response = await this.client.delete(`http://localhost:8000/api/entries/${id}`);
    return response.data;
  }

  // Mood analysis
  async analyzeMood(text: string): Promise<ApiResponse> {
    const response = await this.client.post('http://localhost:8000/api/analysis/mood', { text });
    return response.data;
  }

  async getMoodTrends(params?: {
    timeRange?: 'week' | 'month' | 'year' | 'all';
    metrics?: string[];
  }): Promise<ApiResponse> {
    const response = await this.client.get('http://localhost:8000/api/analysis/trends', { params });
    return response.data;
  }

  // Insights
  async getInsights(params?: {
    page?: number;
    limit?: number;
    type?: string;
  }): Promise<ApiResponse> {
    const response = await this.client.get('http://localhost:8000/api/insights', { params });
    return response.data;
  }

  async getInsight(id: string): Promise<ApiResponse> {
    const response = await this.client.get(`http://localhost:8000/api/insights/${id}`);
    return response.data;
  }

  async dismissInsight(id: string) {
    const response = await this.client.post(`http://localhost:8000/api/insights/${id}/dismiss`);
    return response.data;
  }

  // Dashboard
  async getDashboardStats(): Promise<ApiResponse> {
    const response = await this.client.get('http://localhost:8000/api/dashboard/stats');
    return response.data;
  }

  // Export
  async exportData(data: {
    format: 'pdf' | 'json' | 'csv';
    dateRange?: { start: Date; end: Date };
    includeAudio?: boolean;
    includeInsights?: boolean;
    anonymize?: boolean;
  }) {
    const response = await this.client.post('http://localhost:8000/api/export', data, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Search
  async searchEntries(query: string, filters?: {
    dateRange?: { start: Date; end: Date };
    moodRange?: { min: number; max: number };
    tags?: string[];
    emotions?: string[];
  }): Promise<ApiResponse> {
    const response = await this.client.post('http://localhost:8000/api/search', {
      query,
      filters,
    });
    return response.data;
  }

  // Voice/Transcription
  async transcribeAudio(audio: Blob): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('audio', audio, 'recording.webm');

    const response = await axios.post('http://localhost:8000/api/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();

// Helper function to handle API errors
export function handleApiError(error: any): string {
  if (error.response?.data?.error?.message) {
    return error.response.data.error.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

// Generic API hook
export function useApi<T = any>(
  apiCall: () => Promise<ApiResponse<T>>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiCall();
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.error?.message || 'Failed to fetch data');
        }
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  return { data, loading, error, refetch: () => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiCall();
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.error?.message || 'Failed to fetch data');
        }
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  } };
}