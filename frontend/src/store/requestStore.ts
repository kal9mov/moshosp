import { create } from 'zustand';
import { requestsAPI } from '../lib/api';
import type { HelpRequest as ApiHelpRequest } from '../lib/api';

// Базовый URL API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Интерфейс запроса помощи
export interface HelpRequest {
  id: number;
  title: string;
  description: string;
  status: 'new' | 'in_progress' | 'completed' | 'cancelled';
  category: string;
  priority: 'low' | 'medium' | 'high';
  location: string;
  requesterId: number;
  assignedTo?: number | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
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

// Интерфейс статистики
export interface RequestStats {
  volunteers: number;
  completedRequests: number;
  partners: number;
  isSupport247: boolean;
}

// Интерфейс уведомления
export interface RequestNotification {
  id: string;
  type: 'request_created' | 'request_assigned' | 'request_completed' | 'request_cancelled' | 'system';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  requestId?: number;
}

// Параметры для создания запроса
export interface RequestCreateParams {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  location: string;
  status: 'new' | 'in_progress' | 'completed' | 'cancelled';
}

// Параметры для обновления запроса
export interface RequestUpdateParams {
  title?: string;
  description?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  location?: string;
  status?: 'new' | 'in_progress' | 'completed' | 'cancelled';
}

// Параметры фильтрации и сортировки
export interface FilterParams {
  status?: string;
  category?: string;
  priority?: string;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

interface RequestFilters {
  status?: string;
  category?: string;
  priority?: string;
  search?: string;
}

interface RequestsState {
  requests: HelpRequest[];
  userRequests: HelpRequest[];
  currentRequest: HelpRequest | null;
  filters: RequestFilters;
  totalCount: number;
  page: number;
  limit: number;
  isLoading: boolean;
  error: string | null;
  stats: RequestStats;
  notifications: RequestNotification[];
  unreadNotifications: number;
  
  // Действия
  fetchRequests: (filters?: RequestFilters, page?: number) => Promise<void>;
  fetchUserRequests: () => Promise<void>;
  fetchRequestById: (id: number) => Promise<HelpRequest | null>;
  createRequest: (request: Omit<HelpRequest, 'id' | 'requesterId' | 'assignedTo' | 'createdAt' | 'updatedAt' | 'completedAt' | 'requester' | 'volunteer'>) => Promise<HelpRequest | null>;
  updateRequest: (id: number, updates: Partial<HelpRequest>) => Promise<HelpRequest | null>;
  assignRequest: (id: number) => Promise<HelpRequest | null>;
  completeRequest: (id: number) => Promise<HelpRequest | null>;
  setFilters: (filters: RequestFilters) => void;
  setPage: (page: number) => void;
  resetState: () => void;
  fetchStats: () => Promise<RequestStats>;
  fetchNotifications: () => Promise<RequestNotification[]>;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addNotification: (notification: Omit<RequestNotification, 'id' | 'createdAt' | 'isRead'>) => void;
}

const initialFilters: RequestFilters = {
  status: undefined,
  category: undefined,
  search: undefined
};

// Начальное состояние статистики
const initialStats: RequestStats = {
  volunteers: 0,
  completedRequests: 0,
  partners: 0,
  isSupport247: true
};

// Функция для преобразования API типа в локальный формат
const convertApiHelpRequest = (apiRequest: ApiHelpRequest): HelpRequest => {
  return {
    ...apiRequest,
    // Конвертируем все несовместимые поля
    assignedTo: apiRequest.assignedTo || undefined,
    completedAt: apiRequest.completedAt || undefined
  };
};

// Функция для преобразования массива API типов в локальный формат
const convertApiHelpRequests = (apiRequests: ApiHelpRequest[]): HelpRequest[] => {
  return apiRequests.map(convertApiHelpRequest);
};

export const useRequestStore = create<RequestsState>((set, get) => ({
  requests: [],
  userRequests: [],
  currentRequest: null,
  filters: initialFilters,
  totalCount: 0,
  page: 1,
  limit: 10,
  isLoading: false,
  error: null,
  stats: initialStats,
  notifications: [],
  unreadNotifications: 0,

  // Получение списка запросов с фильтрацией и пагинацией
  fetchRequests: async (filters, page) => {
    set({ isLoading: true, error: null });
    try {
      // Формируем параметры запроса
      const currentFilters = filters || get().filters;
      const currentPage = page || get().page;
      const params: FilterParams = {
        ...currentFilters,
        limit: get().limit,
        offset: (currentPage - 1) * get().limit
      };
      
      // Делаем запрос к API
      const response = await requestsAPI.getRequests(params);
      
      // Конвертируем данные API в локальный формат
      const convertedRequests = convertApiHelpRequests(response);
      
      set({
        requests: convertedRequests,
        isLoading: false,
        page: currentPage,
        filters: currentFilters,
        // Проксируем количество запросов из ответа или устанавливаем длину массива
        totalCount: response.length
      });
    } catch (error: any) {
      console.error('Ошибка получения запросов:', error);
      set({ 
        error: error.message || 'Не удалось загрузить запросы', 
        isLoading: false 
      });
    }
  },

  // Получение запросов пользователя
  fetchUserRequests: async () => {
    set({ isLoading: true, error: null });
    try {
      // Получаем текущего пользователя
      const user = localStorage.getItem('user');
      if (!user) {
        throw new Error('Пользователь не найден');
      }
      const userData = JSON.parse(user);
      
      // Делаем запрос к API для получения запросов пользователя
      const response = await requestsAPI.getUserRequests(userData.id);
      
      // Конвертируем данные API в локальный формат
      const convertedRequests = convertApiHelpRequests(response);
      
      set({
        userRequests: convertedRequests,
        isLoading: false
      });
    } catch (error: any) {
      console.error('Ошибка получения запросов пользователя:', error);
      set({ 
        error: error.message || 'Не удалось загрузить запросы пользователя', 
        isLoading: false 
      });
    }
  },

  // Получение запроса по ID
  fetchRequestById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      // Делаем запрос к API
      const response = await requestsAPI.getRequestById(id);
      
      // Конвертируем данные API в локальный формат
      const convertedRequest = convertApiHelpRequest(response);
      
      set({
        currentRequest: convertedRequest,
        isLoading: false
      });
      
      return convertedRequest;
    } catch (error: any) {
      console.error(`Ошибка получения запроса с ID ${id}:`, error);
      set({ 
        error: error.message || `Не удалось загрузить запрос с ID ${id}`, 
        isLoading: false 
      });
      return null;
    }
  },

  // Создание нового запроса
  createRequest: async (requestData) => {
    set({ isLoading: true, error: null });
    try {
      // Делаем запрос к API для создания запроса
      const response = await requestsAPI.createRequest(requestData);
      
      // Конвертируем данные API в локальный формат
      const convertedRequest = convertApiHelpRequest(response);
      
      // Обновляем список запросов пользователя
      set((state) => ({
        userRequests: [...state.userRequests, convertedRequest],
        isLoading: false
      }));
      
      // Создаем уведомление о новом запросе
      get().addNotification({
        type: 'request_created',
        title: 'Новый запрос создан',
        message: `Ваш запрос "${convertedRequest.title}" был успешно создан.`,
        requestId: convertedRequest.id
      });
      
      return convertedRequest;
    } catch (error: any) {
      console.error('Ошибка создания запроса:', error);
      set({ 
        error: error.message || 'Не удалось создать запрос', 
        isLoading: false 
      });
      return null;
    }
  },

  // Обновление запроса
  updateRequest: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      // Делаем запрос к API для обновления запроса
      const response = await requestsAPI.updateRequest(id, updates);
      
      // Конвертируем данные API в локальный формат
      const convertedRequest = convertApiHelpRequest(response);
      
      // Обновляем списки запросов
      set((state) => ({
        requests: state.requests.map(req => req.id === id ? convertedRequest : req),
        userRequests: state.userRequests.map(req => req.id === id ? convertedRequest : req),
        currentRequest: state.currentRequest?.id === id ? convertedRequest : state.currentRequest,
        isLoading: false
      }));
      
      return convertedRequest;
    } catch (error: any) {
      console.error(`Ошибка обновления запроса с ID ${id}:`, error);
      set({ 
        error: error.message || `Не удалось обновить запрос с ID ${id}`, 
        isLoading: false 
      });
      return null;
    }
  },

  // Назначение запроса на текущего пользователя
  assignRequest: async (id) => {
    set({ isLoading: true, error: null });
    try {
      // Получаем текущего пользователя
      const user = localStorage.getItem('user');
      if (!user) {
        throw new Error('Пользователь не найден');
      }
      const userData = JSON.parse(user);
      
      // Обновляем запрос через API
      const updates = {
        status: 'in_progress',
        assignedTo: userData.id
      };
      
      // Делаем запрос к API для обновления запроса
      const response = await requestsAPI.updateRequest(id, updates);
      
      // Конвертируем данные API в локальный формат
      const convertedRequest = convertApiHelpRequest(response);
      
      // Обновляем списки запросов
      set((state) => ({
        requests: state.requests.map(req => req.id === id ? convertedRequest : req),
        userRequests: state.userRequests.map(req => req.id === id ? convertedRequest : req),
        currentRequest: state.currentRequest?.id === id ? convertedRequest : state.currentRequest,
        isLoading: false
      }));
      
      // Создаем уведомление о назначении запроса
      get().addNotification({
        type: 'request_assigned',
        title: 'Запрос назначен',
        message: `Вы взяли запрос "${convertedRequest.title}" в работу.`,
        requestId: convertedRequest.id
      });
      
      return convertedRequest;
    } catch (error: any) {
      console.error(`Ошибка назначения запроса с ID ${id}:`, error);
      set({ 
        error: error.message || `Не удалось назначить запрос с ID ${id}`, 
        isLoading: false 
      });
      return null;
    }
  },

  // Завершение запроса
  completeRequest: async (id) => {
    set({ isLoading: true, error: null });
    try {
      // Обновляем запрос через API
      const updates = {
        status: 'completed',
        completedAt: new Date().toISOString()
      };
      
      // Делаем запрос к API для обновления запроса
      const response = await requestsAPI.updateRequest(id, updates);
      
      // Конвертируем данные API в локальный формат
      const convertedRequest = convertApiHelpRequest(response);
      
      // Обновляем списки запросов
      set((state) => ({
        requests: state.requests.map(req => req.id === id ? convertedRequest : req),
        userRequests: state.userRequests.map(req => req.id === id ? convertedRequest : req),
        currentRequest: state.currentRequest?.id === id ? convertedRequest : state.currentRequest,
        isLoading: false
      }));
      
      // Создаем уведомление о завершении запроса
      get().addNotification({
        type: 'request_completed',
        title: 'Запрос завершен',
        message: `Запрос "${convertedRequest.title}" был успешно завершен.`,
        requestId: convertedRequest.id
      });
      
      return convertedRequest;
    } catch (error: any) {
      console.error(`Ошибка завершения запроса с ID ${id}:`, error);
      set({ 
        error: error.message || `Не удалось завершить запрос с ID ${id}`, 
        isLoading: false 
      });
      return null;
    }
  },

  // Установка фильтров
  setFilters: (filters) => {
    set({ filters });
    get().fetchRequests(filters, 1); // Сбрасываем страницу на первую при изменении фильтров
  },

  // Установка страницы
  setPage: (page) => {
    set({ page });
    get().fetchRequests(get().filters, page);
  },

  // Сброс состояния
  resetState: () => {
    set({
      requests: [],
      userRequests: [],
      currentRequest: null,
      filters: initialFilters,
      totalCount: 0,
      page: 1,
      isLoading: false,
      error: null,
      notifications: [],
      unreadNotifications: 0
    });
  },
  
  // Получение статистики
  fetchStats: async () => {
    set({ isLoading: true, error: null });
    try {
      // В будущем тут будет реальный запрос к API
      // const response = await requestsAPI.getStats();
      
      // Временная заглушка для демонстрации
      const mockStats: RequestStats = {
        volunteers: 530,
        completedRequests: 1278,
        partners: 53,
        isSupport247: true
      };
      
      set({
        stats: mockStats,
        isLoading: false
      });
      
      return mockStats;
    } catch (error: any) {
      console.error('Ошибка получения статистики:', error);
      set({ 
        error: error.message || 'Не удалось загрузить статистику', 
        isLoading: false 
      });
      return initialStats;
    }
  },
  
  // Получение уведомлений
  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      // В будущем тут будет реальный запрос к API
      // const response = await requestsAPI.getNotifications();
      
      // Получаем текущие уведомления из состояния
      const currentNotifications = get().notifications;
      
      set({
        isLoading: false,
        unreadNotifications: currentNotifications.filter(n => !n.isRead).length
      });
      
      return currentNotifications;
    } catch (error: any) {
      console.error('Ошибка получения уведомлений:', error);
      set({ 
        error: error.message || 'Не удалось загрузить уведомления', 
        isLoading: false 
      });
      return [];
    }
  },
  
  // Отметка уведомления как прочитанного
  markNotificationAsRead: (id) => {
    set((state) => {
      const updatedNotifications = state.notifications.map(notification =>
        notification.id === id ? { ...notification, isRead: true } : notification
      );
      
      return {
        notifications: updatedNotifications,
        unreadNotifications: updatedNotifications.filter(n => !n.isRead).length
      };
    });
  },
  
  // Отметка всех уведомлений как прочитанных
  markAllNotificationsAsRead: () => {
    set((state) => {
      const updatedNotifications = state.notifications.map(notification => ({
        ...notification,
        isRead: true
      }));
      
      return {
        notifications: updatedNotifications,
        unreadNotifications: 0
      };
    });
  },
  
  // Добавление нового уведомления
  addNotification: (notificationData) => {
    const newNotification: RequestNotification = {
      id: Date.now().toString(), // Генерируем уникальный ID на основе времени
      ...notificationData,
      createdAt: new Date().toISOString(),
      isRead: false
    };
    
    set((state) => {
      const updatedNotifications = [newNotification, ...state.notifications];
      return {
        notifications: updatedNotifications,
        unreadNotifications: updatedNotifications.filter(n => !n.isRead).length
      };
    });
  }
})); 