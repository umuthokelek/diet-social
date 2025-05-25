import api from './api';

export interface DietLog {
  id: string;
  title: string;
  description: string | null;
  calories: number;
  createdAt: string;
  userDisplayName: string;
  userId: string;
}

export interface CreateDietLogRequest {
  title: string;
  description?: string;
  calories: number;
}

export const dietLogsService = {
  async getDietLogs(): Promise<DietLog[]> {
    const response = await api.get<DietLog[]>('/DietLog');
    return response.data;
  },

  async createDietLog(data: CreateDietLogRequest): Promise<DietLog> {
    const response = await api.post<DietLog>('/DietLog', data);
    return response.data;
  }
}; 