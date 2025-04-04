import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { requestsAPI, HelpRequest as ApiHelpRequest } from './api';

// Типы запросов от пользователей
export type RequestType = 'info' | 'duty' | 'career';

// Интерфейс для запроса помощи - совместимый с API
export interface HelpRequest {
  id: string;
  userId: string;
  userName: string;
  userContact: string;
  type: RequestType;
  description: string;
  status: 'new' | 'processing' | 'completed' | 'cancelled';
  createdAt: string;
  assignedTo?: string;
}

// Конвертер типов для преобразования данных API в локальный формат
const convertApiToLocalRequest = (apiRequest: ApiHelpRequest): HelpRequest => {
  return {
    id: apiRequest.id.toString(),
    userId: apiRequest.requesterId.toString(),
    userName: apiRequest.requester?.firstName + ' ' + apiRequest.requester?.lastName || 'Пользователь',
    userContact: apiRequest.requester?.username || '',
    type: (apiRequest.category as RequestType) || 'info',
    description: apiRequest.description,
    status: apiRequest.status === 'in_progress' ? 'processing' : 
            (apiRequest.status as HelpRequest['status']),
    createdAt: apiRequest.createdAt,
    assignedTo: apiRequest.assignedTo?.toString(),
  };
};

// Конвертер типов для преобразования локальных данных в формат API
const convertLocalToApiRequest = (localRequest: Omit<HelpRequest, 'id' | 'createdAt' | 'status'>): any => {
  return {
    title: localRequest.userContact, // Используем userContact как заголовок
    description: localRequest.description,
    category: localRequest.type,
    priority: 'medium', // По умолчанию средний приоритет
    location: 'Москва', // По умолчанию Москва
  };
};

// Интерфейс для состояния запросов
interface RequestState {
  userRequests: HelpRequest[];
  isLoading: boolean;
  error: string | null;
  
  // CRUD операции
  fetchRequests: (userId?: string) => Promise<void>;
  addRequest: (request: Omit<HelpRequest, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  updateRequestStatus: (id: string, status: HelpRequest['status']) => Promise<void>;
  assignRequest: (id: string, assignedTo: string) => Promise<void>;
  
  // Селекторы
  getUserRequests: (userId: string) => HelpRequest[];
}

// Создаем хранилище для запросов с персистентностью
export const useRequestStore = create<RequestState>()(
  persist(
    (set, get) => ({
      userRequests: [],
      isLoading: false,
      error: null,
      
      // Получение запросов с API
      fetchRequests: async (userId) => {
        set({ isLoading: true, error: null });
        try {
          let requests: ApiHelpRequest[];
          
          if (userId) {
            requests = await requestsAPI.getUserRequests(parseInt(userId));
          } else {
            requests = await requestsAPI.getRequests();
          }
          
          // Преобразуем данные API в локальный формат
          const localRequests = requests.map(convertApiToLocalRequest);
          
          set({ userRequests: localRequests, isLoading: false });
        } catch (error: any) {
          console.error('Ошибка получения запросов:', error);
          set({ 
            error: error.message || 'Не удалось загрузить запросы', 
            isLoading: false 
          });
        }
      },
      
      // Добавление нового запроса через API
      addRequest: async (requestData) => {
        set({ isLoading: true, error: null });
        try {
          // Конвертируем данные в формат API
          const apiRequestData = convertLocalToApiRequest(requestData);
          
          // Отправляем запрос на сервер
          const newApiRequest = await requestsAPI.createRequest(apiRequestData);
          
          // Конвертируем полученный результат в локальный формат
          const localRequest = convertApiToLocalRequest(newApiRequest);
          
          // Обновляем локальное состояние
          set((state) => ({ 
            userRequests: [...state.userRequests, localRequest],
            isLoading: false 
          }));
        } catch (error: any) {
          console.error('Ошибка добавления запроса:', error);
          set({ 
            error: error.message || 'Не удалось создать запрос', 
            isLoading: false 
          });
        }
      },
      
      // Обновление статуса запроса через API
      updateRequestStatus: async (id, status) => {
        set({ isLoading: true, error: null });
        try {
          // Конвертируем статус в формат API
          const apiStatus = status === 'processing' ? 'in_progress' : status;
          
          // Отправляем запрос на сервер
          const updatedApiRequest = await requestsAPI.updateRequest(parseInt(id), { 
            status: apiStatus as any 
          });
          
          // Конвертируем полученный результат в локальный формат
          const updatedLocalRequest = convertApiToLocalRequest(updatedApiRequest);
          
          // Обновляем локальное состояние
          set((state) => ({
            userRequests: state.userRequests.map(request => 
              request.id === id ? updatedLocalRequest : request
            ),
            isLoading: false
          }));
        } catch (error: any) {
          console.error('Ошибка обновления статуса запроса:', error);
          set({ 
            error: error.message || 'Не удалось обновить статус запроса', 
            isLoading: false 
          });
        }
      },
      
      // Назначение запроса волонтеру через API
      assignRequest: async (id, assignedTo) => {
        set({ isLoading: true, error: null });
        try {
          // Используем упрощенный подход: просто обновляем статус через API
          const apiStatus = 'in_progress';
          
          // Отправляем запрос на сервер
          await requestsAPI.updateRequest(parseInt(id), { 
            status: apiStatus as any,
            assignedTo: parseInt(assignedTo)
          });
          
          // Обновляем локальное состояние
          set((state) => ({
            userRequests: state.userRequests.map(request => 
              request.id === id ? { 
                ...request, 
                assignedTo, 
                status: 'processing' 
              } : request
            ),
            isLoading: false
          }));
        } catch (error: any) {
          console.error('Ошибка назначения запроса:', error);
          set({ 
            error: error.message || 'Не удалось назначить запрос', 
            isLoading: false 
          });
        }
      },
      
      // Селектор для получения запросов пользователя
      getUserRequests: (userId) => {
        return get().userRequests.filter(request => request.userId === userId);
      },
    }),
    {
      name: 'requests-storage',
      // Сохраняем только запросы, не сохраняем состояние загрузки и ошибки
      partialize: (state) => ({ userRequests: state.userRequests }),
    }
  )
); 