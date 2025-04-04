import { Achievement, Game } from '../store/gameStore';

// Профиль пользователя для демо-данных
export const demoProfile = {
  name: 'Иванов Иван',
  avatar: '/images/avatars/default.jpg',
  level: 1,
  experience: 50,
  nextLevelExperience: 100,
  completedQuests: 0, // Будет рассчитано автоматически
  totalQuests: 0,     // Будет рассчитано автоматически
};

// Демо-данные для игровых заданий
export const demoGames: Game[] = [
  {
    id: 'game-001',
    title: 'Основы работы в системе',
    description: 'Познакомьтесь с основными функциями системы',
    imageSrc: '/images/games/basics.jpg',
    level: 1,
    points: 50,
    path: '/game/tutorial',
    isCompleted: true,
    isLocked: false,
    category: 'education'
  },
  {
    id: 'game-002',
    title: 'Работа с документами',
    description: 'Освойте навыки работы с документами',
    imageSrc: '/images/games/documents.jpg',
    level: 1,
    points: 75,
    path: '/game/documents',
    isCompleted: false,
    isLocked: false,
    category: 'education'
  },
  {
    id: 'game-003',
    title: 'Коммуникация с коллегами',
    description: 'Изучите способы общения с коллегами через систему',
    imageSrc: '/images/games/communication.jpg',
    level: 2,
    points: 100,
    path: '/game/communication',
    isCompleted: false,
    isLocked: false,
    category: 'social'
  },
  {
    id: 'game-004',
    title: 'Работа с отчетами',
    description: 'Научитесь формировать и анализировать отчеты',
    imageSrc: '/images/games/reports.jpg',
    level: 2,
    points: 125,
    path: '/game/reports',
    isCompleted: false,
    isLocked: false,
    category: 'practice'
  },
  {
    id: 'game-005',
    title: 'Продвинутая аналитика',
    description: 'Освойте продвинутые инструменты анализа данных',
    imageSrc: '/images/games/analytics.jpg',
    level: 3,
    points: 150,
    path: '/game/analytics',
    isCompleted: false,
    isLocked: true,
    category: 'practice'
  },
  {
    id: 'game-006',
    title: 'Оптимизация рабочих процессов',
    description: 'Изучите способы оптимизации рабочих процессов',
    imageSrc: '/images/games/optimization.jpg',
    level: 3,
    points: 200,
    path: '/game/optimization',
    isCompleted: false,
    isLocked: true,
    category: 'challenge'
  }
];

// Демо-данные для достижений
export const demoAchievements: Achievement[] = [
  {
    id: 'ach-001',
    title: 'Первые шаги',
    description: 'Начните работу в системе',
    iconSrc: '/images/achievements/first_steps.png',
    iconName: 'first_steps',
    category: 'educational',
    rarityLevel: 'common',
    unlocked: true,
    isUnlocked: true,
    unlockDate: '12.10.2023',
    pointsReward: 50
  },
  {
    id: 'ach-002',
    title: 'Активный участник',
    description: 'Выполните 5 или более заданий',
    iconSrc: '/images/achievements/active_user.png',
    iconName: 'active_user',
    category: 'social',
    rarityLevel: 'uncommon',
    unlocked: false,
    isUnlocked: false,
    progress: {
      current: 2,
      total: 5
    },
    pointsReward: 100
  },
  {
    id: 'ach-003',
    title: 'Эксперт',
    description: 'Достигните 5 уровня',
    iconSrc: '/images/achievements/expert.png',
    iconName: 'expert',
    category: 'educational',
    rarityLevel: 'rare',
    unlocked: false,
    isUnlocked: false,
    progress: {
      current: 1,
      total: 5
    },
    pointsReward: 200
  },
  {
    id: 'ach-004',
    title: 'Исследователь',
    description: 'Изучите все разделы системы',
    iconSrc: '/images/achievements/explorer.png',
    iconName: 'explorer',
    category: 'technical',
    rarityLevel: 'uncommon',
    unlocked: false,
    isUnlocked: false,
    pointsReward: 75
  },
  {
    id: 'ach-005',
    title: 'Командный игрок',
    description: 'Помогите коллегам 10 раз',
    iconSrc: '/images/achievements/team_player.png',
    iconName: 'team_player',
    category: 'social',
    rarityLevel: 'rare',
    unlocked: false,
    isUnlocked: false,
    pointsReward: 150
  },
  {
    id: 'ach-006',
    title: 'Инноватор',
    description: 'Предложите идею по улучшению системы',
    iconSrc: '/images/achievements/innovator.png',
    iconName: 'innovator',
    category: 'special',
    rarityLevel: 'epic',
    unlocked: false,
    isUnlocked: false,
    pointsReward: 300
  },
  {
    id: 'ach-007',
    title: 'Легенда',
    description: 'Достигните 20 уровня',
    iconSrc: '/images/achievements/legend.png',
    iconName: 'legend',
    category: 'special',
    rarityLevel: 'legendary',
    unlocked: false,
    isUnlocked: false,
    progress: {
      current: 1,
      total: 20
    },
    pointsReward: 500
  },
  {
    id: 'ach-008',
    title: 'Наставник',
    description: 'Помогите новому сотруднику освоиться',
    iconSrc: '/images/achievements/mentor.png',
    iconName: 'mentor',
    category: 'social',
    rarityLevel: 'epic',
    unlocked: false,
    isUnlocked: false,
    pointsReward: 250
  }
];

// Демо-данные для лидерборда
export const demoLeaderboard = [
  {
    id: 'user-001',
    rank: 1,
    name: 'Петров Сергей',
    avatar: '/images/avatars/user1.jpg',
    level: 5,
    points: 1200,
    completedQuests: 15,
    achievements: 8,
    department: 'IT отдел',
    isCurrentUser: false
  },
  {
    id: 'user-002',
    rank: 2,
    name: 'Смирнова Елена',
    avatar: '/images/avatars/user2.jpg',
    level: 4,
    points: 950,
    completedQuests: 12,
    achievements: 6,
    department: 'Бухгалтерия',
    isCurrentUser: false
  },
  {
    id: 'user-003',
    rank: 3,
    name: 'Иванов Иван',
    avatar: '/images/avatars/default.jpg',
    level: 1,
    points: 50,
    completedQuests: 1,
    achievements: 1,
    department: 'HR отдел',
    isCurrentUser: true
  },
  {
    id: 'user-004',
    rank: 4,
    name: 'Козлов Дмитрий',
    avatar: '/images/avatars/user3.jpg',
    level: 1,
    points: 25,
    completedQuests: 0,
    achievements: 0,
    department: 'Отдел продаж',
    isCurrentUser: false
  }
];

// Примеры игровых событий для демонстрации
export const demoEvents = [
  {
    id: 'event-001',
    type: 'achievement_unlocked',
    title: 'Первые шаги',
    description: 'Начните работу в системе',
    timestamp: Date.now() - 86400000, // вчера
    points: 50,
    achievement: demoAchievements[0]
  },
  {
    id: 'event-002',
    type: 'quest_completed',
    title: 'Основы работы в системе',
    description: 'Познакомьтесь с основными функциями системы',
    timestamp: Date.now() - 86400000 + 3600000, // вчера +1 час
    points: 50
  },
  {
    id: 'event-003',
    type: 'points_earned',
    title: 'Опыт получен',
    description: 'Ежедневный вход в систему',
    timestamp: Date.now() - 3600000, // час назад
    points: 10
  }
]; 