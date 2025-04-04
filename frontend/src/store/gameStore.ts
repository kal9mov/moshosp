import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { gameAPI, Achievement as ApiAchievement, GameData, LeaderboardEntry } from '../lib/api';
import { useUserStore } from './userStore';

// Переэкспорт интерфейсов из GameNotification
import type { GameEvent, GameNotificationType } from '../components/game/GameNotification';
export type { GameEvent, GameNotificationType };

// Оставляем единую версию Achievement, совместимую с API
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

// Оставляем единую версию Game
export interface Game {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  level: number;
  points: number;
  path: string;
  isCompleted: boolean;
  isLocked: boolean;
  category: 'education' | 'practice' | 'social' | 'challenge' | 'educational' | 'technical';
}

// Интерфейс для крупных наград, отображаемых анимированно
export interface AnimatedReward {
  type: 'achievement' | 'level_up';
  achievement?: Achievement;
  level?: number;
  points?: number;
  title: string;
  description?: string;
}

// Интерфейс для игрока
export interface Player {
  id: string;
  name: string;
  avatar?: string;
  level: number;
  experience: number;
  nextLevelExperience: number;
  gamesCompleted?: number;
  achievements: Achievement[] | string[]; // Может быть как массив ID, так и объекты
  completedQuests: number;
  totalQuests: number;
}

// Интерфейс для категорий достижений
export type AchievementCategory = 'educational' | 'social' | 'technical' | 'special';

// Интерфейс для редкости достижений
export type RarityLevel = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface GameState {
  // Данные пользователя
  name: string;
  avatar?: string;
  level: number;
  experience: number;
  nextLevelExperience: number;
  completedQuests: number;
  totalQuests: number;

  // Игровые данные
  achievements: Achievement[];
  games: Game[]; 
  leaderboard: {
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
  }[];
  
  // Система уведомлений
  currentEvent: GameEvent | null;
  eventsHistory: GameEvent[];
  animatedReward: AnimatedReward | null;
  
  // Действия с профилем
  setUserProfile: (profile: Partial<GameState>) => void;
  addExperience: (points: number, source?: string) => void;
  
  // Действия с заданиями
  completeGame: (gameId: string) => void;
  unlockGame: (gameId: string) => void;
  
  // Действия с достижениями
  unlockAchievement: (achievementId: string) => void;
  updateAchievementProgress: (achievementId: string, progress: number) => void;
  
  // Действия с уведомлениями
  createEvent: (type: GameNotificationType, data: Partial<GameEvent>) => void;
  clearCurrentEvent: () => void;
  showAnimatedReward: (reward: AnimatedReward) => void;
  clearAnimatedReward: () => void;

  // Сброс игровых данных (для тестирования)
  resetGameData: () => void;

  // Данные игрока
  player: Player;
  currentNotification: GameEvent | null;
  isNotificationOpen: boolean;
  
  // Методы для работы с игровым состоянием
  updatePlayer: (playerData: Partial<Player>) => void;
  levelUp: () => void;
  
  // Методы для уведомлений
  showNotification: (event: GameEvent) => void;
  hideNotification: () => void;
  
  // Методы для истории событий
  addEventToHistory: (event: GameEvent) => void;
  clearEventHistory: () => void;
  
  // Метод инициализации тестовых данных
  initializeGameData: () => void;

  // Методы для работы с игровым состоянием
  checkAchievementsProgress: () => void;

  // Состояние API
  isLoading: boolean;
  error: string | null;
  
  // Методы API
  fetchUserGameData: (userId: number | string) => Promise<void>;
  fetchLeaderboard: (limit?: number) => Promise<void>;
  fetchUserAchievements: (userId: number | string) => Promise<void>;
  syncGameDataWithBackend: () => Promise<void>;
  updateGameDataOnServer: (updates: Partial<Player>) => Promise<void>;
}

// Расчет опыта до следующего уровня
const calculateNextLevelExperience = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

// Инициализация демо-данными для тестирования
const initialGameState = {
  // Профиль пользователя
  name: 'Гость',
  avatar: '',
  level: 1,
  experience: 0,
  nextLevelExperience: 100,
  completedQuests: 0,
  totalQuests: 0,
  
  // Игровые данные
  achievements: [],
  games: [],
  leaderboard: [],
  
  // Система уведомлений
  currentEvent: null,
  eventsHistory: [],
  animatedReward: null,
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialGameState,
      
      // Добавляем состояние загрузки и ошибки
      isLoading: false,
      error: null,
      
      // Получение игровых данных пользователя с бэкенда
      fetchUserGameData: async (userId) => {
        set({ isLoading: true, error: null });
        try {
          // Преобразуем userId к числу, если это строка
          const id = typeof userId === 'string' ? parseInt(userId) : userId;
          
          const gameData = await gameAPI.getUserGameData(id);
          
          // Создаем объект Player из полученных данных
          const player: Player = {
            id: userId.toString(),
            name: gameData.username || 'Пользователь',
            avatar: gameData.avatar,
            level: gameData.level,
            experience: gameData.experience,
            nextLevelExperience: calculateNextLevelExperience(gameData.level),
            completedQuests: gameData.completedQuests,
            totalQuests: gameData.totalQuests,
            achievements: gameData.achievements || []
          };
          
          // Обновляем состояние
          set({
            player,
            level: player.level,
            experience: player.experience,
            nextLevelExperience: player.nextLevelExperience,
            completedQuests: player.completedQuests,
            totalQuests: player.totalQuests,
            isLoading: false
          });
        } catch (error: any) {
          console.error('Ошибка получения игровых данных пользователя:', error);
          set({
            error: error.message || 'Ошибка при получении игровых данных',
            isLoading: false
          });
        }
      },
      
      // Получение таблицы лидеров с бэкенда
      fetchLeaderboard: async (limit = 10) => {
        set({ isLoading: true, error: null });
        try {
          const leaderboardData = await gameAPI.getLeaderboard(limit);
          
          set({ 
            leaderboard: leaderboardData, 
            isLoading: false 
          });
        } catch (error: any) {
          console.error('Ошибка получения таблицы лидеров:', error);
          set({
            error: error.message || 'Ошибка при получении таблицы лидеров',
            isLoading: false
          });
        }
      },
      
      // Получение достижений пользователя с бэкенда
      fetchUserAchievements: async (userId) => {
        set({ isLoading: true, error: null });
        try {
          // Преобразуем userId к числу, если это строка
          const id = typeof userId === 'string' ? parseInt(userId) : userId;
          
          const achievementData = await gameAPI.getUserAchievements(id);
          
          // Обновляем состояние
          set({ 
            achievements: achievementData, 
            isLoading: false 
          });
        } catch (error: any) {
          console.error('Ошибка получения достижений пользователя:', error);
          set({
            error: error.message || 'Ошибка при получении достижений',
            isLoading: false
          });
        }
      },
      
      // Синхронизация игровых данных с бэкендом
      syncGameDataWithBackend: async () => {
        set({ isLoading: true, error: null });
        try {
          // Получаем данные из userStore для получения userId
          const user = useUserStore.getState().user;
          if (!user) {
            console.warn('Пользователь не авторизован. Синхронизация невозможна.');
            set({ isLoading: false });
            return;
          }
          
          // Получаем текущее состояние игры
          const { level, experience, completedQuests, totalQuests, achievements } = get();
          
          // Подготавливаем данные для отправки на сервер
          const gameData = {
            level,
            experience,
            completedQuests,
            totalQuests,
            achievements: achievements.map(a => ({
              id: a.id,
              unlocked: a.unlocked,
              progress: a.progress
            }))
          };
          
          // Отправляем данные на сервер для синхронизации
          await gameAPI.syncGameData(user.id, gameData as any);
          
          // Обновляем локальные данные с сервера для уверенности в их актуальности
          await get().fetchUserGameData(user.id);
          await get().fetchUserAchievements(user.id);
          await get().fetchLeaderboard();
          
          set({ isLoading: false });
          
          // Создаем событие синхронизации
          get().createEvent('system', {
            title: 'Синхронизация',
            description: 'Данные успешно синхронизированы с сервером',
          });
        } catch (error: any) {
          console.error('Ошибка синхронизации игровых данных:', error);
          set({
            error: error.message || 'Ошибка синхронизации с сервером',
            isLoading: false
          });
          
          // Создаем событие об ошибке
          get().createEvent('system', {
            title: 'Ошибка синхронизации',
            description: error.message || 'Не удалось синхронизировать данные с сервером',
          });
        }
      },
      
      // Обновление функции добавления опыта для использования API
      addExperience: async (points, source) => {
        set({ isLoading: true });
        const prevLevel = get().level;
        
        try {
          // Обновляем локальное состояние
          set(
            produce((state: GameState) => {
              state.experience += points;
              state.player.experience += points;
              
              // Проверяем, достигнут ли следующий уровень
              while (state.experience >= state.nextLevelExperience) {
                state.level += 1;
                state.player.level += 1;
                state.experience -= state.nextLevelExperience;
                state.player.experience -= state.player.nextLevelExperience;
                state.nextLevelExperience = calculateNextLevelExperience(state.level);
                state.player.nextLevelExperience = calculateNextLevelExperience(state.player.level);
              }
            })
          );
          
          // Создаем уведомление о получении опыта
          get().createEvent('points_earned', {
            title: 'Опыт получен',
            description: source ? `Получено ${points} XP за: ${source}` : `Получено ${points} XP`,
            points,
          });
          
          // Если произошло повышение уровня, создаем соответствующее уведомление
          const currentLevel = get().level;
          if (currentLevel > prevLevel) {
            get().createEvent('level_up', {
              title: `Уровень ${currentLevel}`,
              description: `Вы достигли уровня ${currentLevel}!`,
              level: currentLevel,
            });
            
            // Показываем анимированную награду
            get().showAnimatedReward({
              type: 'level_up',
              level: currentLevel,
              title: `Уровень ${currentLevel}`,
              description: 'Поздравляем с повышением уровня!'
            });
          }
          
          // Синхронизируем изменения с сервером
          const user = useUserStore.getState().user;
          if (user) {
            await gameAPI.updateGameData(user.id, {
              level: get().level,
              experience: get().experience
            });
          }
          
          // Проверяем достижения после получения опыта
          get().checkAchievementsProgress();
          
        } catch (error: any) {
          console.error('Ошибка при добавлении опыта:', error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      // Обновление функции разблокировки достижения для API
      unlockAchievement: async (achievementId) => {
        const achievement = get().achievements.find(a => a.id === achievementId);
        
        if (!achievement || achievement.unlocked) {
          return; // Достижение уже разблокировано или не найдено
        }
        
        set({ isLoading: true });
        
        try {
          // Обновляем локальное состояние
          set(
            produce((state: GameState) => {
              const achievementIndex = state.achievements.findIndex(a => a.id === achievementId);
              if (achievementIndex !== -1) {
                state.achievements[achievementIndex].unlocked = true;
                state.achievements[achievementIndex].unlockDate = new Date().toISOString();
              }
            })
          );
          
          // Создаем уведомление о разблокировке достижения
          get().createEvent('achievement_unlocked', {
            title: 'Достижение разблокировано',
            description: achievement.title,
            achievementId: achievement.id,
          });
          
          // Показываем анимированную награду
          get().showAnimatedReward({
            type: 'achievement',
            achievement,
            title: achievement.title,
            description: achievement.description,
            points: achievement.pointsReward
          });
          
          // Добавляем очки за достижение
          if (achievement.pointsReward > 0) {
            get().addExperience(achievement.pointsReward, `Достижение "${achievement.title}"`);
          }
          
          // Синхронизируем изменения с сервером
          const user = useUserStore.getState().user;
          if (user) {
            // Обновляем конкретное достижение на сервере
            await gameAPI.updateUserAchievement(user.id, achievementId, {
              unlocked: true,
              unlockDate: new Date().toISOString()
            });
          }
        } catch (error: any) {
          console.error('Ошибка при разблокировке достижения:', error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      // Обновление данных профиля
      setUserProfile: (profile) => set(profile),
      
      // Показ анимированной награды
      showAnimatedReward: (reward: AnimatedReward) => {
        set({ animatedReward: reward });
      },
      
      // Очистка анимированной награды
      clearAnimatedReward: () => {
        set({ animatedReward: null });
      },
      
      // Создание игрового события (уведомления)
      createEvent: (type: GameNotificationType, data: Partial<GameEvent>) => {
        const newEvent: GameEvent = {
          type,
          id: `${Date.now()}`,
          timestamp: Date.now(),
          title: data.title || '',
          description: data.description,
          points: data.points,
          level: data.level,
          achievement: data.achievement,
        };
        
        set(produce((state: GameState) => {
          state.currentEvent = newEvent;
          state.eventsHistory = [newEvent, ...state.eventsHistory].slice(0, 20); // Сохраняем последние 20 событий
        }));
      },
      
      // Очистка текущего события
      clearCurrentEvent: () => set({ currentEvent: null }),
      
      // Отметка о выполнении задания
      completeGame: (gameId) => {
        const game = get().games.find(g => g.id === gameId);
        if (!game || game.isCompleted) return;
        
        set(
          produce((state: GameState) => {
            const game = state.games.find(g => g.id === gameId);
            if (game) {
              game.isCompleted = true;
              state.completedQuests += 1;
            }
          })
        );
        
        // Создаем уведомление о выполнении задания
        if (game) {
          get().createEvent('quest_completed', {
            title: game.title,
            description: game.description,
            points: game.points,
          });
          
          // Начисляем опыт за задание
          get().addExperience(game.points, `Задание "${game.title}"`);
        }
        
        // Проверяем, не разблокировали ли мы какие-то достижения
        get().checkAchievementsProgress();
      },
      
      // Разблокировка задания
      unlockGame: (gameId) => {
        set(
          produce((state: GameState) => {
            const game = state.games.find(g => g.id === gameId);
            if (game) {
              game.isLocked = false;
            }
          })
        );
      },
      
      // Обновление прогресса достижения для API
      updateAchievementProgress: async (achievementId, progress) => {
        const achievement = get().achievements.find(a => a.id === achievementId);
        
        if (!achievement || achievement.unlocked) {
          return; // Достижение уже разблокировано или не найдено
        }
        
        set({ isLoading: true });
        
        try {
          // Определяем, должно ли быть разблокировано достижение
          let shouldUnlock = false;
          let updatedProgress = { current: 0, total: 0 };
          
          // Обновляем локальное состояние
          set(
            produce((state: GameState) => {
              const achievementIndex = state.achievements.findIndex(a => a.id === achievementId);
              if (achievementIndex !== -1) {
                const achievement = state.achievements[achievementIndex];
                if (!achievement.progress) {
                  achievement.progress = { current: 0, total: 100 };
                }
                
                achievement.progress.current = progress;
                updatedProgress = { ...achievement.progress };
                
                // Проверяем, достигнута ли цель
                if (achievement.progress.current >= achievement.progress.total) {
                  shouldUnlock = true;
                }
              }
            })
          );
          
          // Синхронизируем изменения с сервером
          const user = useUserStore.getState().user;
          if (user) {
            // Обновляем прогресс достижения на сервере
            await gameAPI.updateUserAchievement(user.id, achievementId, {
              progress: updatedProgress
            });
          }
          
          // Если достигнута цель, разблокируем достижение
          if (shouldUnlock) {
            get().unlockAchievement(achievementId);
          }
        } catch (error: any) {
          console.error('Ошибка при обновлении прогресса достижения:', error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      // Добавляем метод для проверки прогресса всех достижений
      checkAchievementsProgress: () => {
        const { achievements, player, games } = get();
        
        // Проверяем достижения на основе текущего состояния игры
        achievements.forEach(achievement => {
          if (achievement.unlocked) return; // Пропускаем уже разблокированные достижения
          
          // Проверяем разные типы достижений
          switch (achievement.id) {
            case 'first_login':
              // Достижение за первый вход (всегда разблокировано)
              get().unlockAchievement(achievement.id);
              break;
              
            case 'profile_complete':
              // Достижение за заполнение профиля
              if (player.avatar) {
                get().unlockAchievement(achievement.id);
              }
              break;
              
            case 'level_5':
              // Достижение за достижение 5 уровня
              if (player.level >= 5) {
                get().unlockAchievement(achievement.id);
              }
              break;
              
            case 'complete_5_quests':
              // Достижение за выполнение 5 заданий
              if (player.completedQuests >= 5) {
                get().unlockAchievement(achievement.id);
              } else if (achievement.progress) {
                // Обновляем прогресс
                get().updateAchievementProgress(achievement.id, player.completedQuests);
              }
              break;
              
            // Добавьте другие проверки для разных типов достижений
          }
        });
      },
      
      // Сброс игровых данных
      resetGameData: () => set({
        ...initialGameState,
        eventsHistory: [], // Сбрасываем и историю событий
      }),

      // Новые поля для новой логики
      player: {
        id: 'user-1',
        name: 'Пользователь',
        level: 1,
        experience: 0,
        nextLevelExperience: 100,
        gamesCompleted: 0,
        achievements: [],
        completedQuests: 0,
        totalQuests: 0
      },
      currentNotification: null,
      isNotificationOpen: false,
      
      // Методы для работы с игровым состоянием
      updatePlayer: (playerData) => {
        set((state) => ({
          player: { ...state.player, ...playerData },
        }));
      },
      
      // Методы для уведомлений
      showNotification: (event) => {
        set({
          currentNotification: event,
          isNotificationOpen: true,
        });
      },
      
      // Методы для истории событий
      addEventToHistory: (event) => {
        set((state) => ({
          eventsHistory: [event, ...state.eventsHistory], // Добавляем в начало массива
        }));
      },
      
      // Метод инициализации тестовых данных
      initializeGameData: () => {
        // Тестовые задания
        const demoGames: Game[] = [
          {
            id: 'game-1',
            title: 'Знакомство с системой',
            description: 'Ознакомьтесь с основными функциями системы',
            imageUrl: 'https://via.placeholder.com/300x200?text=Tutorial',
            level: 1,
            points: 50,
            path: '/tutorial',
            isCompleted: false,
            isLocked: false,
            category: 'educational'
          },
          {
            id: 'game-2',
            title: 'Заполнение профиля',
            description: 'Заполните все поля вашего профиля',
            imageUrl: 'https://via.placeholder.com/300x200?text=Profile',
            level: 1,
            points: 30,
            path: '/profile',
            isCompleted: false,
            isLocked: false,
            category: 'social'
          },
          {
            id: 'game-3',
            title: 'Первая заявка',
            description: 'Создайте свою первую заявку в системе',
            imageUrl: 'https://via.placeholder.com/300x200?text=Request',
            level: 1,
            points: 70,
            path: '/create-request',
            isCompleted: false,
            isLocked: false,
            category: 'technical'
          },
          {
            id: 'game-4',
            title: 'Изучение документации',
            description: 'Изучите основную документацию по системе',
            imageUrl: 'https://via.placeholder.com/300x200?text=Docs',
            level: 2,
            points: 100,
            path: '/docs',
            isCompleted: false,
            isLocked: true,
            category: 'educational'
          },
          {
            id: 'game-5',
            title: 'Коммуникация в чате',
            description: 'Отправьте сообщение в общем чате',
            imageUrl: 'https://via.placeholder.com/300x200?text=Chat',
            level: 2,
            points: 80,
            path: '/chat',
            isCompleted: false,
            isLocked: true,
            category: 'social'
          },
          {
            id: 'game-6',
            title: 'Расширенные функции',
            description: 'Освойте расширенные функции системы',
            imageUrl: 'https://via.placeholder.com/300x200?text=Advanced',
            level: 3,
            points: 150,
            path: '/advanced',
            isCompleted: false,
            isLocked: true,
            category: 'technical'
          }
        ];
        
        // Тестовые достижения
        const demoAchievements: Achievement[] = [
          {
            id: 'achievement-1',
            title: 'Первые шаги',
            description: 'Выполните ваше первое задание',
            category: 'educational',
            rarityLevel: 'common',
            iconName: 'SchoolIcon',
            unlocked: false,
            isUnlocked: false,
            pointsReward: 20
          },
          {
            id: 'achievement-2',
            title: 'Социальная бабочка',
            description: 'Примите участие в обсуждении на форуме',
            category: 'social',
            rarityLevel: 'uncommon',
            iconName: 'PeopleIcon',
            unlocked: false,
            isUnlocked: false,
            pointsReward: 30
          },
          {
            id: 'achievement-3',
            title: 'Технический гений',
            description: 'Выполните все технические задания первого уровня',
            category: 'technical',
            rarityLevel: 'rare',
            iconName: 'CodeIcon',
            unlocked: false,
            isUnlocked: false,
            pointsReward: 50
          },
          {
            id: 'achievement-4',
            title: 'Искатель знаний',
            description: 'Пройдите все обучающие материалы',
            category: 'educational',
            rarityLevel: 'epic',
            iconName: 'MenuBookIcon',
            unlocked: false,
            isUnlocked: false,
            pointsReward: 100
          },
          {
            id: 'achievement-5',
            title: 'Мастер коммуникации',
            description: 'Соберите 10 положительных отзывов от коллег',
            category: 'social',
            rarityLevel: 'epic',
            iconName: 'ForumIcon',
            unlocked: false,
            isUnlocked: false,
            pointsReward: 120
          },
          {
            id: 'achievement-6',
            title: 'Легендарный работник',
            description: 'Достигните 10 уровня в системе',
            category: 'special',
            rarityLevel: 'legendary',
            iconName: 'EmojiEventsIcon',
            unlocked: false,
            isUnlocked: false,
            pointsReward: 500
          }
        ];
        
        // Тестовая таблица лидеров - данные игроков
        const playerData = [
          {
            id: 'player-1',
            name: 'Александр И.',
            avatar: 'https://via.placeholder.com/50?text=AI',
            level: 8,
            experience: 750,
            nextLevelExperience: 900,
            gamesCompleted: 15,
            achievements: ['achievement-1', 'achievement-2', 'achievement-3', 'achievement-4'],
            completedQuests: 5,
            totalQuests: 10
          },
          {
            id: 'player-2',
            name: 'Екатерина С.',
            avatar: 'https://via.placeholder.com/50?text=EC',
            level: 7,
            experience: 680,
            nextLevelExperience: 800,
            gamesCompleted: 12,
            achievements: ['achievement-1', 'achievement-2', 'achievement-3'],
            completedQuests: 3,
            totalQuests: 10
          },
          {
            id: 'player-3',
            name: 'Максим Т.',
            avatar: 'https://via.placeholder.com/50?text=MT',
            level: 5,
            experience: 470,
            nextLevelExperience: 600,
            gamesCompleted: 9,
            achievements: ['achievement-1', 'achievement-2'],
            completedQuests: 2,
            totalQuests: 10
          },
          {
            id: 'player-4',
            name: 'Ольга В.',
            avatar: 'https://via.placeholder.com/50?text=OV',
            level: 4,
            experience: 350,
            nextLevelExperience: 500,
            gamesCompleted: 6,
            achievements: ['achievement-1'],
            completedQuests: 1,
            totalQuests: 10
          },
          {
            id: 'user-1',
            name: 'Вы',
            level: 1,
            experience: 0,
            nextLevelExperience: 100,
            gamesCompleted: 0,
            achievements: [],
            completedQuests: 0,
            totalQuests: 0
          }
        ];
        
        // Преобразование в формат таблицы лидеров
        const demoLeaderboard = playerData.map((player, index) => ({
          id: player.id,
          rank: index + 1,
          name: player.name,
          avatar: player.avatar,
          level: player.level,
          points: player.experience,
          completedQuests: player.completedQuests,
          achievements: player.achievements.length,
          department: player.id === 'user-1' ? 'Ваш отдел' : 'Отдел',
          isCurrentUser: player.id === 'user-1'
        }));
        
        // Тестовая история событий
        const demoEvents: GameEvent[] = [
          {
            id: uuidv4(),
            type: 'level_up',
            title: 'Уровень 5 достигнут!',
            description: 'Поздравляем с повышением! Новые задания теперь доступны.',
            level: 5,
            timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2 // 2 дня назад
          },
          {
            id: uuidv4(),
            type: 'achievement_unlocked',
            title: 'Технический гений',
            description: 'Выполните все технические задания первого уровня',
            points: 50,
            achievement: demoAchievements[2],
            timestamp: Date.now() - 1000 * 60 * 60 * 24 // 1 день назад
          },
          {
            id: uuidv4(),
            type: 'quest_completed',
            title: 'Задание "Заполнение профиля" выполнено',
            description: 'Заполните все поля вашего профиля',
            points: 30,
            timestamp: Date.now() - 1000 * 60 * 60 * 12 // 12 часов назад
          },
          {
            id: uuidv4(),
            type: 'points_earned',
            title: 'Получено 100 очков опыта',
            description: 'Продолжайте выполнять задания для получения большего количества очков',
            points: 100,
            timestamp: Date.now() - 1000 * 60 * 60 * 3 // 3 часа назад
          }
        ];
        
        // Устанавливаем тестовые данные в хранилище
        set({
          games: demoGames,
          achievements: demoAchievements,
          leaderboard: demoLeaderboard,
          eventsHistory: demoEvents
        });
      },
      
      // Дополнительные недостающие методы
      levelUp: () => {
        set(produce((state: GameState) => {
          state.level += 1;
          state.experience = 0;
          state.nextLevelExperience = calculateNextLevelExperience(state.level);
        }));
      },
      
      hideNotification: () => {
        set({
          isNotificationOpen: false
        });
      },
      
      clearEventHistory: () => {
        set({
          eventsHistory: []
        });
      },
    }),
    {
      name: 'game-storage',
      partialize: (state) => ({
        name: state.name,
        avatar: state.avatar,
        level: state.level,
        experience: state.experience,
        nextLevelExperience: state.nextLevelExperience,
        completedQuests: state.completedQuests,
        totalQuests: state.totalQuests,
        achievements: state.achievements,
        games: state.games, 
        player: state.player,
        // Не сохраняем состояние загрузки, ошибки и другие временные данные
      }),
    }
  )
);

// Хук для инициализации игровых данных
export const useInitializeGameData = () => {
  const initializeGameData = useGameStore((state) => state.initializeGameData);
  return initializeGameData;
};

// Обновление игровых данных на сервере
export const updateGameDataOnServer = async (updates: Partial<Player>) => {
  const gameStore = useGameStore.getState();
  const user = useUserStore.getState().user;
  if (!user) {
    throw new Error('Пользователь не авторизован');
  }
  
  try {
    await gameAPI.updateGameData(user.id, updates as any);
    gameStore.updatePlayer(updates);
  } catch (error: any) {
    console.error('Ошибка обновления игровых данных:', error);
    throw error;
  }
}; 