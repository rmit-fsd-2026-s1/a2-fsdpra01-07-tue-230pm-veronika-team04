import apiClient from './api';

export const userApi = {
  getProfile: (id: string | number) => apiClient.get(`/profile/${id}`),
  updateUser: (id: string | number, data: any) => apiClient.put(`/profile/${id}`, data),
};