import { create } from 'zustand';
import { User, authAPI } from '../lib/api';

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Методы
  login: (telegramAuthData: any) => Promise<void>;
  logout: () => void;
  checkSession: () => Promise<void>;
  updateUserProfile: (updates: { phone?: string; address?: string; about?: string }) => Promise<void>;
  clearError: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  
  // Авторизация пользователя
  login: async (telegramAuthData) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authAPI.loginWithTelegram(telegramAuthData);
      
      // Сохраняем данные пользователя и токен, если они есть
      if (data && data.user) {
        set({ 
          user: data.user, 
          isAuthenticated: true, 
          isLoading: false 
        });
        
        // Сохраняем пользователя в localStorage для сохранения сессии
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        throw new Error('Получены некорректные данные пользователя');
      }
    } catch (error: any) {
      console.error('Ошибка при авторизации:', error);
      set({ 
        error: error.message || 'Ошибка при авторизации', 
        isLoading: false 
      });
    }
  },
  
  // Выход пользователя
  logout: () => {
    authAPI.logout();
    set({ user: null, isAuthenticated: false });
  },
  
  // Проверка текущей сессии пользователя
  checkSession: async () => {
    set({ isLoading: true });
    try {
      // Проверяем наличие токена
      const token = localStorage.getItem('token');
      if (!token) {
        set({ isAuthenticated: false, isLoading: false });
        return;
      }
      
      // Проверяем наличие сохраненного пользователя
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        set({ 
          user: JSON.parse(savedUser), 
          isAuthenticated: true, 
          isLoading: false 
        });
      }
      
      // Дополнительно получаем свежие данные с сервера
      const user = await authAPI.getCurrentUser();
      if (user) {
        set({ 
          user, 
          isAuthenticated: true, 
          isLoading: false 
        });
        
        // Обновляем сохраненные данные пользователя
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        // Если данные не получены, выходим
        authAPI.logout();
        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false 
        });
      }
    } catch (error: any) {
      console.error('Ошибка при проверке сессии:', error);
      // При ошибке очищаем данные сессии
      authAPI.logout();
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false,
        error: error.message || 'Ошибка при проверке сессии'
      });
    }
  },
  
  // Обновление профиля пользователя
  updateUserProfile: async (updates) => {
    set({ isLoading: true, error: null });
    try {
      const updatedUser = await authAPI.updateUserProfile(updates);
      if (updatedUser) {
        set({ 
          user: updatedUser, 
          isLoading: false 
        });
        
        // Обновляем сохраненные данные пользователя
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error: any) {
      console.error('Ошибка при обновлении профиля:', error);
      set({ 
        error: error.message || 'Ошибка при обновлении профиля', 
        isLoading: false 
      });
    }
  },
  
  // Очистка ошибки
  clearError: () => set({ error: null })
})); 