// Словарь категорий запросов
export const categoryDictionary: Record<string, string> = {
  'paperwork': 'Документы',
  'escort': 'Сопровождение',
  'shopping': 'Покупки',
  'tech': 'Техническая помощь',
  'basic': 'Базовая помощь',
  'other': 'Прочее'
};

// Получение названия категории
export const getCategoryName = (category: string): string => {
  switch (category) {
    case 'medicine': return 'Медицинская помощь';
    case 'food': return 'Продукты питания';
    case 'household': return 'Бытовая помощь';
    case 'transport': return 'Транспорт';
    case 'tech': return 'Техническая помощь';
    case 'paperwork': return 'Помощь с документами';
    case 'basic': return 'Базовые потребности';
    case 'escort': return 'Сопровождение';
    case 'shopping': return 'Покупки';
    case 'translate': return 'Перевод';
    case 'other': return 'Другое';
    default: return category;
  }
};

// Словарь статусов запросов
export const statusDictionary: Record<string, string> = {
  'new': 'Новый',
  'in_progress': 'В работе',
  'completed': 'Выполнен',
  'cancelled': 'Отменён'
};

// Функция для локализации статуса
export const getStatusName = (statusKey: string): string => {
  return statusDictionary[statusKey] || statusKey;
};

// Словарь приоритетов запросов
export const priorityDictionary: Record<string, string> = {
  'low': 'Низкий',
  'medium': 'Средний',
  'high': 'Высокий',
  'urgent': 'Срочный'
};

// Функция для локализации приоритета
export const getPriorityName = (priorityKey: string): string => {
  return priorityDictionary[priorityKey] || priorityKey;
};

// Функция форматирования даты
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}; 