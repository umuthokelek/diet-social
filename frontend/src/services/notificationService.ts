import api from './api';

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'FOLLOW' | 'LIKE' | 'COMMENT';
  createdAt: string;
  isRead: boolean;
}

/**
 * Fetches all unread notifications for the current user
 * @returns Promise containing an array of notifications
 */
export const getNotifications = async (): Promise<Notification[]> => {
  try {
    const response = await api.get<Notification[]>('/Notification');
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Marks all notifications as read for the current user
 * @returns Promise that resolves when the operation is complete
 */
export const markAllAsRead = async (): Promise<void> => {
  try {
    await api.post('/Notification/mark-read');
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    throw error;
  }
}; 