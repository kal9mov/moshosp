import axios from 'axios';

// Базовый URL для API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

// Создаем экземпляр axios с базовыми настройками
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Перехватчик для добавления токена авторизации
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Перехватчик ответов для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Обработка ошибки авторизации (401)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Типы данных
export interface User {
  id: number;
  telegramId: string;
  username: string;
  firstName: string;
  lastName: string;
  photoUrl: string;
  phone?: string;
  address?: string;
  about?: string;
  role: 'user' | 'volunteer' | 'admin';
  createdAt: string;
  updatedAt: string;
  stats: UserStats;
}

export interface UserStats {
  id: number;
  userId: number;
  level: number;
  experience: number;
  completedRequests: number;
  createdRequests: number;
  volunteerHours: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface HelpRequest {
  id: number;
  title: string;
  description: string;
  status: 'new' | 'in_progress' | 'completed' | 'cancelled';
  category: string;
  priority: 'low' | 'medium' | 'high';
  location: string;
  requesterId: number;
  assignedTo: number | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  requester?: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    photoUrl: string;
  };
  volunteer?: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    photoUrl: string;
  };
}

export interface TelegramAuthData {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface Notification {
  id: string;
  userId: number;
  type: 'request_created' | 'request_assigned' | 'request_completed' | 'request_cancelled' | 'achievement_unlocked' | 'level_up' | 'system';
  title: string;
  message: string;
  requestId?: number;
  achievementId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface RequestStats {
  volunteers: number;
  completedRequests: number;
  partners: number;
  isSupport247: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconSrc?: string;
  icon?: string;
  category: 'educational' | 'social' | 'technical' | 'special';
  rarityLevel: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  progress?: {
    current: number;
    total: number;
  };
  unlockDate?: string;
  pointsReward: number;
}

export interface GameData {
  id: number;
  userId: number;
  level: number;
  experience: number;
  completedQuests: number;
  totalQuests: number;
  achievements: Achievement[];
  updatedAt: string;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  avatar?: string;
  level: number;
  points: number;
  completedQuests: number;
  achievements: number;
  department?: string;
  isCurrentUser?: boolean;
}

// Методы API
export const authAPI = {
  // Авторизация через Telegram
  loginWithTelegram: async (telegramData: TelegramAuthData) => {
    try {
      // Для тестового входа возвращаем мок-данные без реального API-запроса
      if (telegramData.hash === "fake_hash_for_testing") {
        console.log("Используем тестовую авторизацию без API");
        
        // Создаем тестовый токен
        const token = "test_token_" + Date.now();
        localStorage.setItem('token', token);
        
        // Возвращаем тестовые данные пользователя
        return {
          token,
          user: {
            id: parseInt(telegramData.id),
            telegramId: telegramData.id,
            username: telegramData.username || "test_user",
            firstName: telegramData.first_name || "Тестовый",
            lastName: telegramData.last_name || "Пользователь",
            photoUrl: telegramData.photo_url || "",
            role: "user" as "user" | "volunteer" | "admin",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            stats: {
              id: 1,
              userId: parseInt(telegramData.id),
              level: 1,
              experience: 0,
              completedRequests: 0,
              createdRequests: 0,
              volunteerHours: 0,
              rating: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          }
        };
      }
      
      // Реальный API-запрос
      const { data } = await api.post('/auth/telegram', telegramData);
      if (data && data.token) {
        localStorage.setItem('token', data.token);
      }
      return data;
    } catch (error) {
      console.error("Ошибка авторизации:", error);
      throw error;
    }
  },
  
  // Получение текущего пользователя
  getCurrentUser: async () => {
    try {
      // Проверяем, не является ли токен тестовым
      const token = localStorage.getItem('token');
      if (token && token.startsWith('test_token_')) {
        console.log("Используем тестовые данные пользователя");
        
        // Возвращаем мок-данные пользователя для тестирования
        return {
          id: 123456789,
          telegramId: "123456789",
          username: "test_user",
          firstName: "Тестовый",
          lastName: "Пользователь",
          photoUrl: "",
          phone: "+7 (999) 123-45-67",
          address: "г. Москва, ул. Ленина, д. 10, кв. 5",
          about: "Люблю помогать людям и участвовать в волонтерских проектах.",
          role: "user" as "user" | "volunteer" | "admin",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          stats: {
            id: 1,
            userId: 123456789,
            level: 1,
            experience: 0,
            completedRequests: 0,
            createdRequests: 0,
            volunteerHours: 0,
            rating: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        };
      }
      
      // Реальный API-запрос
      const { data } = await api.get<User>('/users/me');
      return data;
    } catch (error) {
      console.error("Ошибка получения данных пользователя:", error);
      throw error;
    }
  },
  
  // Обновление профиля пользователя
  updateUserProfile: async (updates: { phone?: string; address?: string; about?: string }) => {
    try {
      const { data } = await api.put<User>('/users/me', updates);
      return data;
    } catch (error) {
      console.error("Ошибка обновления профиля:", error);
      throw error;
    }
  },
  
  // Выход из системы
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },
};

export const requestsAPI = {
  // Получение списка запросов помощи
  getRequests: async (params?: {
    status?: string;
    category?: string;
    priority?: string;
    searchTerm?: string;
    limit?: number;
    offset?: number;
  }) => {
    try {
      // Для тестирования
      if (process.env.REACT_APP_ENV === 'development') {
        // Возвращаем мок-данные для разработки
        return Array(10).fill(null).map((_, index) => ({
          id: index + 1,
          title: `Тестовый запрос ${index + 1}`,
          description: `Описание тестового запроса ${index + 1}`,
          status: ['new', 'in_progress', 'completed', 'cancelled'][Math.floor(Math.random() * 4)] as 'new' | 'in_progress' | 'completed' | 'cancelled',
          category: ['medicine', 'food', 'household', 'transport', 'translate', 'tech', 'paperwork', 'basic', 'escort', 'shopping', 'other'][Math.floor(Math.random() * 11)],
          priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
          location: 'г. Москва, ул. Примерная, д. 10',
          requesterId: 123456789,
          assignedTo: Math.random() > 0.5 ? 987654321 : null,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: null,
          requester: {
            id: 123456789,
            username: 'requester_user',
            firstName: 'Иван',
            lastName: 'Петров',
            photoUrl: '',
          },
          volunteer: Math.random() > 0.5 ? {
            id: 987654321,
            username: 'volunteer_user',
            firstName: 'Мария',
            lastName: 'Сидорова',
            photoUrl: '',
          } : undefined,
        }));
      }
      
      // Реальный API-запрос
      const { data } = await api.get<HelpRequest[]>('/requests', { params });
      return data;
    } catch (error) {
      console.error("Ошибка получения запросов:", error);
      throw error;
    }
  },
  
  // Получение запросов пользователя
  getUserRequests: async (userId: number) => {
    try {
      // Для тестирования
      if (process.env.REACT_APP_ENV === 'development') {
        // Возвращаем мок-данные для разработки
        return Array(5).fill(null).map((_, index) => ({
          id: index + 100,
          title: `Мой запрос ${index + 1}`,
          description: `Описание моего запроса ${index + 1}`,
          status: ['new', 'in_progress', 'completed', 'cancelled'][Math.floor(Math.random() * 4)] as 'new' | 'in_progress' | 'completed' | 'cancelled',
          category: ['medicine', 'food', 'household', 'transport', 'translate', 'tech', 'paperwork', 'basic', 'escort', 'shopping', 'other'][Math.floor(Math.random() * 11)],
          priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
          location: 'г. Москва, ул. Моя, д. 5',
          requesterId: userId,
          assignedTo: Math.random() > 0.5 ? 987654321 : null,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 15 * 24 * 60 * 60 * 1000)).toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: null,
          requester: {
            id: userId,
            username: 'test_user',
            firstName: 'Тестовый',
            lastName: 'Пользователь',
            photoUrl: '',
          },
          volunteer: Math.random() > 0.5 ? {
            id: 987654321,
            username: 'volunteer_user',
            firstName: 'Мария',
            lastName: 'Сидорова',
            photoUrl: '',
          } : undefined,
        }));
      }
      
      // Реальный API-запрос
      const { data } = await api.get<HelpRequest[]>(`/users/${userId}/requests`);
      return data;
    } catch (error) {
      console.error("Ошибка получения запросов пользователя:", error);
      throw error;
    }
  },
  
  // Получение запроса по ID
  getRequestById: async (id: number) => {
    try {
      const { data } = await api.get<HelpRequest>(`/requests/${id}`);
      return data;
    } catch (error) {
      console.error(`Ошибка получения запроса с ID ${id}:`, error);
      throw error;
    }
  },
  
  // Создание нового запроса
  createRequest: async (request: {
    title: string;
    description: string;
    category: string;
    priority: 'low' | 'medium' | 'high';
    location: string;
    status?: string;
  }) => {
    try {
      const { data } = await api.post<HelpRequest>('/requests', request);
      return data;
    } catch (error) {
      console.error("Ошибка создания запроса:", error);
      throw error;
    }
  },
  
  // Обновление запроса
  updateRequest: async (
    id: number,
    updates: Partial<{
      title: string;
      description: string;
      status: 'new' | 'in_progress' | 'completed' | 'cancelled';
      category: string;
      priority: 'low' | 'medium' | 'high';
      location: string;
      assignedTo: number | null;
      completedAt: string | null;
    }>
  ) => {
    try {
      const { data } = await api.put<HelpRequest>(`/requests/${id}`, updates);
      return data;
    } catch (error) {
      console.error(`Ошибка обновления запроса с ID ${id}:`, error);
      throw error;
    }
  },
  
  // Получение статистики системы
  getStats: async () => {
    try {
      // Для тестирования
      if (process.env.REACT_APP_ENV === 'development') {
        // Возвращаем мок-данные для разработки
        return {
          volunteers: 530,
          completedRequests: 1278,
          partners: 53,
          isSupport247: true
        };
      }
      
      // Реальный API-запрос
      const { data } = await api.get<RequestStats>('/stats');
      return data;
    } catch (error) {
      console.error("Ошибка получения статистики:", error);
      throw error;
    }
  },
  
  // Получение уведомлений пользователя
  getNotifications: async () => {
    try {
      // Для тестирования
      if (process.env.REACT_APP_ENV === 'development') {
        // Возвращаем мок-данные для разработки
        return Array(5).fill(null).map((_, index) => ({
          id: `notification_${index + 1}`,
          userId: 123456789,
          type: ['request_created', 'request_assigned', 'request_completed', 'achievement_unlocked', 'system'][Math.floor(Math.random() * 5)] as 'request_created' | 'request_assigned' | 'request_completed' | 'achievement_unlocked' | 'system',
          title: `Тестовое уведомление ${index + 1}`,
          message: `Текст тестового уведомления ${index + 1}`,
          requestId: Math.random() > 0.5 ? 100 + index : undefined,
          achievementId: Math.random() > 0.8 ? `achievement_${index}` : undefined,
          isRead: Math.random() > 0.5,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
        }));
      }
      
      // Реальный API-запрос
      const { data } = await api.get<Notification[]>('/notifications');
      return data;
    } catch (error) {
      console.error("Ошибка получения уведомлений:", error);
      throw error;
    }
  },
  
  // Отметка уведомления как прочитанного
  markNotificationRead: async (id: string) => {
    try {
      const { data } = await api.put<Notification>(`/notifications/${id}/read`);
      return data;
    } catch (error) {
      console.error(`Ошибка отметки уведомления с ID ${id}:`, error);
      throw error;
    }
  },
  
  // Отметка всех уведомлений как прочитанных
  markAllNotificationsRead: async () => {
    try {
      const { data } = await api.put<{ success: boolean }>('/notifications/read-all');
      return data;
    } catch (error) {
      console.error("Ошибка отметки всех уведомлений:", error);
      throw error;
    }
  },
};

export const gameAPI = {
  // Получение игровых данных пользователя
  getUserGameData: async (userId: number) => {
    try {
      // Для тестирования
      if (process.env.REACT_APP_ENV === 'development') {
        // Возвращаем мок-данные для разработки
        return {
          id: 1,
          userId: userId,
          level: 3,
          experience: 250,
          completedQuests: 8,
          totalQuests: 20,
          achievements: [
            {
              id: 'achievement_1',
              title: 'Первый запрос',
              description: 'Создайте свой первый запрос о помощи',
              icon: '🚀',
              category: 'social',
              rarityLevel: 'common',
              unlocked: true,
              unlockDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              pointsReward: 50
            },
            {
              id: 'achievement_2',
              title: 'Начинающий волонтёр',
              description: 'Выполните 5 запросов о помощи',
              icon: '⭐',
              category: 'social',
              rarityLevel: 'uncommon',
              unlocked: true,
              unlockDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
              pointsReward: 100
            },
            {
              id: 'achievement_3',
              title: 'Отзывчивый помощник',
              description: 'Получите 5 положительных отзывов',
              icon: '🏆',
              category: 'social',
              rarityLevel: 'rare',
              unlocked: false,
              progress: {
                current: 3,
                total: 5
              },
              pointsReward: 150
            }
          ],
          updatedAt: new Date().toISOString()
        };
      }
      
      // Реальный API-запрос
      const { data } = await api.get<GameData>(`/users/${userId}/game-data`);
      return data;
    } catch (error) {
      console.error(`Ошибка получения игровых данных пользователя с ID ${userId}:`, error);
      throw error;
    }
  },
  
  // Получение таблицы лидеров
  getLeaderboard: async (limit: number = 10) => {
    try {
      // Для тестирования
      if (process.env.REACT_APP_ENV === 'development') {
        // Возвращаем мок-данные для разработки
        return Array(limit).fill(null).map((_, index) => ({
          id: `user_${index + 1}`,
          rank: index + 1,
          name: `Пользователь ${index + 1}`,
          avatar: '',
          level: Math.floor(Math.random() * 10) + 1,
          points: Math.floor(Math.random() * 1000) + 100,
          completedQuests: Math.floor(Math.random() * 50) + 5,
          achievements: Math.floor(Math.random() * 10) + 1,
          department: ['Центральный', 'Западный', 'Восточный', 'Северный', 'Южный'][Math.floor(Math.random() * 5)],
          isCurrentUser: index === 2 // Третий пользователь - текущий (для примера)
        }));
      }
      
      // Реальный API-запрос
      const { data } = await api.get<LeaderboardEntry[]>('/leaderboard', { params: { limit } });
      return data;
    } catch (error) {
      console.error("Ошибка получения таблицы лидеров:", error);
      throw error;
    }
  },
  
  // Получение достижений пользователя
  getUserAchievements: async (userId: number) => {
    try {
      // Для тестирования
      if (process.env.REACT_APP_ENV === 'development') {
        // Возвращаем мок-данные для разработки
        return Array(8).fill(null).map((_, index) => ({
          id: `achievement_${index + 1}`,
          title: `Тестовое достижение ${index + 1}`,
          description: `Описание тестового достижения ${index + 1}`,
          icon: ['🚀', '⭐', '🏆', '🎯', '🎮', '🎲', '🎭', '🎨'][index],
          category: ['educational', 'social', 'technical', 'special'][Math.floor(Math.random() * 4)] as 'educational' | 'social' | 'technical' | 'special',
          rarityLevel: ['common', 'uncommon', 'rare', 'epic', 'legendary'][Math.floor(Math.random() * 5)] as 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary',
          unlocked: index < 5, // Первые 5 разблокированы
          unlockDate: index < 5 ? new Date(Date.now() - Math.floor(Math.random() * 60 * 24 * 60 * 60 * 1000)).toISOString() : undefined,
          progress: index >= 5 ? {
            current: Math.floor(Math.random() * 10),
            total: 10
          } : undefined,
          pointsReward: (index + 1) * 50
        }));
      }
      
      // Реальный API-запрос
      const { data } = await api.get<Achievement[]>(`/users/${userId}/achievements`);
      return data;
    } catch (error) {
      console.error(`Ошибка получения достижений пользователя с ID ${userId}:`, error);
      throw error;
    }
  },
  
  // Обновление игровых данных пользователя
  updateGameData: async (userId: number, updates: Partial<{ 
    level: number; 
    experience: number; 
    completedQuests: number; 
    totalQuests: number;
  }>) => {
    try {
      const { data } = await api.put<GameData>(`/users/${userId}/game-data`, updates);
      return data;
    } catch (error) {
      console.error(`Ошибка обновления игровых данных пользователя с ID ${userId}:`, error);
      throw error;
    }
  },
  
  // Синхронизация игровых данных пользователя
  syncGameData: async (userId: number, gameData: Partial<GameData>) => {
    try {
      const { data } = await api.post<GameData>(`/users/${userId}/sync-game-data`, gameData);
      return data;
    } catch (error) {
      console.error(`Ошибка синхронизации игровых данных пользователя с ID ${userId}:`, error);
      throw error;
    }
  },
  
  // Обновление достижения пользователя
  updateUserAchievement: async (userId: number, achievementId: string, updates: Partial<{
    unlocked: boolean;
    unlockDate: string;
    progress: {
      current: number;
      total: number;
    };
  }>) => {
    try {
      // Для тестирования
      if (process.env.REACT_APP_ENV === 'development') {
        console.log(`Тестовое обновление достижения ${achievementId} для пользователя ${userId}:`, updates);
        // Возвращаем мок-данные для разработки
        return {
          id: achievementId,
          title: `Тестовое достижение`,
          description: `Описание тестового достижения`,
          icon: '🏆',
          category: 'social',
          rarityLevel: 'uncommon',
          unlocked: updates.unlocked || false,
          unlockDate: updates.unlockDate,
          progress: updates.progress,
          pointsReward: 50
        };
      }
      
      // Реальный API-запрос
      const { data } = await api.put<Achievement>(`/users/${userId}/achievements/${achievementId}`, updates);
      return data;
    } catch (error) {
      console.error(`Ошибка обновления достижения ${achievementId} пользователя с ID ${userId}:`, error);
      throw error;
    }
  }
};

export default api; 