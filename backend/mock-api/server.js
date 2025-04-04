const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');

// Инициализация приложения
const app = express();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = 'mock-api-secret-key';

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());

// Фейковые данные
let users = [
  {
    id: 1,
    telegramId: "12345",
    username: "user1",
    firstName: "Иван",
    lastName: "Иванов",
    photoUrl: "https://via.placeholder.com/150",
    role: "user",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: {
      id: 1,
      userId: 1,
      level: 1,
      experience: 0,
      completedRequests: 0,
      createdRequests: 1,
      volunteerHours: 0,
      rating: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  },
  {
    id: 2,
    telegramId: "67890",
    username: "volunteer1",
    firstName: "Петр",
    lastName: "Петров",
    photoUrl: "https://via.placeholder.com/150",
    role: "volunteer",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: {
      id: 2,
      userId: 2,
      level: 3,
      experience: 150,
      completedRequests: 10,
      createdRequests: 2,
      volunteerHours: 25,
      rating: 4.8,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }
];

let requests = [
  {
    id: 1,
    title: "Нужна помощь с покупкой продуктов",
    description: "Мне 78 лет, трудно выходить из дома. Нужна помощь с покупкой продуктов в ближайшем магазине.",
    status: "new",
    category: "shopping",
    priority: "medium",
    location: "ул. Пушкина, д. 10, кв. 5",
    requesterId: 1,
    assignedTo: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    requester: {
      id: 1,
      username: "user1",
      firstName: "Иван",
      lastName: "Иванов",
      photoUrl: "https://via.placeholder.com/150"
    }
  },
  {
    id: 2,
    title: "Нужно забрать лекарства из аптеки",
    description: "Необходимо забрать рецептурные лекарства из аптеки и доставить мне. Рецепт у меня на руках.",
    status: "in_progress",
    category: "medicine",
    priority: "high",
    location: "ул. Ленина, д. 15, кв. 7",
    requesterId: 1,
    assignedTo: 2,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    requester: {
      id: 1,
      username: "user1",
      firstName: "Иван",
      lastName: "Иванов",
      photoUrl: "https://via.placeholder.com/150"
    },
    volunteer: {
      id: 2,
      username: "volunteer1",
      firstName: "Петр",
      lastName: "Петров",
      photoUrl: "https://via.placeholder.com/150"
    }
  }
];

// Middleware для проверки JWT
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ message: "Доступ запрещен" });
      }
      
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ message: "Требуется авторизация" });
  }
};

// Авторизация через Telegram
app.post('/auth/telegram', (req, res) => {
  const telegramAuthData = req.body;
  
  // В реальном приложении здесь должна быть проверка данных от Telegram
  // Для mock API просто проверяем наличие telegramId
  
  if (!telegramAuthData.id) {
    return res.status(400).json({ message: "Отсутствуют обязательные поля" });
  }
  
  // Ищем пользователя по TelegramID
  let user = users.find(u => u.telegramId === telegramAuthData.id);
  
  if (!user) {
    // Создаем нового пользователя, если не найден
    user = {
      id: users.length + 1,
      telegramId: telegramAuthData.id,
      username: telegramAuthData.username || `user${users.length + 1}`,
      firstName: telegramAuthData.first_name || "Новый",
      lastName: telegramAuthData.last_name || "Пользователь",
      photoUrl: telegramAuthData.photo_url || "https://via.placeholder.com/150",
      role: "user",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stats: {
        id: users.length + 1,
        userId: users.length + 1,
        level: 1,
        experience: 0,
        completedRequests: 0,
        createdRequests: 0,
        volunteerHours: 0,
        rating: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
    
    users.push(user);
  } else {
    // Обновляем информацию существующего пользователя
    user.username = telegramAuthData.username || user.username;
    user.firstName = telegramAuthData.first_name || user.firstName;
    user.lastName = telegramAuthData.last_name || user.lastName;
    user.photoUrl = telegramAuthData.photo_url || user.photoUrl;
    user.updatedAt = new Date().toISOString();
  }
  
  // Создаем JWT токен
  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });
  
  res.json({ token, user });
});

// Получение текущего пользователя
app.get('/me', authenticateJWT, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  
  if (!user) {
    return res.status(404).json({ message: "Пользователь не найден" });
  }
  
  res.json(user);
});

// Получение списка запросов помощи
app.get('/requests', authenticateJWT, (req, res) => {
  const { status, category, offset = 0, limit = 10 } = req.query;
  
  let filteredRequests = [...requests];
  
  if (status) {
    filteredRequests = filteredRequests.filter(r => r.status === status);
  }
  
  if (category) {
    filteredRequests = filteredRequests.filter(r => r.category === category);
  }
  
  const paginatedRequests = filteredRequests.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  
  res.header('X-Total-Count', filteredRequests.length.toString());
  res.json(paginatedRequests);
});

// Получение одного запроса по ID
app.get('/requests/:id', authenticateJWT, (req, res) => {
  const id = parseInt(req.params.id);
  const request = requests.find(r => r.id === id);
  
  if (!request) {
    return res.status(404).json({ message: "Запрос не найден" });
  }
  
  res.json(request);
});

// Создание нового запроса
app.post('/requests', authenticateJWT, (req, res) => {
  const { title, description, category, priority, location } = req.body;
  
  if (!title || !description || !category || !priority || !location) {
    return res.status(400).json({ message: "Отсутствуют обязательные поля" });
  }
  
  const newRequest = {
    id: requests.length + 1,
    title,
    description,
    status: "new",
    category,
    priority,
    location,
    requesterId: req.user.id,
    assignedTo: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    requester: {
      id: req.user.id,
      username: users.find(u => u.id === req.user.id).username,
      firstName: users.find(u => u.id === req.user.id).firstName,
      lastName: users.find(u => u.id === req.user.id).lastName,
      photoUrl: users.find(u => u.id === req.user.id).photoUrl
    }
  };
  
  requests.push(newRequest);
  
  // Обновляем статистику пользователя
  const user = users.find(u => u.id === req.user.id);
  if (user && user.stats) {
    user.stats.createdRequests++;
    user.stats.updatedAt = new Date().toISOString();
  }
  
  res.status(201).json(newRequest);
});

// Обновление запроса
app.put('/requests/:id', authenticateJWT, (req, res) => {
  const id = parseInt(req.params.id);
  const request = requests.find(r => r.id === id);
  
  if (!request) {
    return res.status(404).json({ message: "Запрос не найден" });
  }
  
  // Проверяем права доступа (только владелец или волонтер могут обновлять)
  if (request.requesterId !== req.user.id && 
      (request.assignedTo !== req.user.id || 
       users.find(u => u.id === req.user.id).role !== 'volunteer')) {
    return res.status(403).json({ message: "Недостаточно прав для обновления запроса" });
  }
  
  const { title, description, status, category, priority, location } = req.body;
  
  if (title) request.title = title;
  if (description) request.description = description;
  if (status) request.status = status;
  if (category) request.category = category;
  if (priority) request.priority = priority;
  if (location) request.location = location;
  
  request.updatedAt = new Date().toISOString();
  
  res.json(request);
});

// Назначение запроса волонтеру
app.post('/requests/:id/assign', authenticateJWT, (req, res) => {
  const id = parseInt(req.params.id);
  const request = requests.find(r => r.id === id);
  
  if (!request) {
    return res.status(404).json({ message: "Запрос не найден" });
  }
  
  // Проверяем, что пользователь имеет роль волонтера
  const user = users.find(u => u.id === req.user.id);
  if (!user || user.role !== 'volunteer') {
    return res.status(403).json({ message: "Только волонтеры могут быть назначены на запрос" });
  }
  
  // Запрос уже назначен другому волонтеру
  if (request.assignedTo && request.assignedTo !== req.user.id) {
    return res.status(400).json({ message: "Запрос уже назначен другому волонтеру" });
  }
  
  request.assignedTo = req.user.id;
  request.status = "in_progress";
  request.updatedAt = new Date().toISOString();
  request.volunteer = {
    id: user.id,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    photoUrl: user.photoUrl
  };
  
  res.json(request);
});

// Завершение запроса
app.post('/requests/:id/complete', authenticateJWT, (req, res) => {
  const id = parseInt(req.params.id);
  const request = requests.find(r => r.id === id);
  
  if (!request) {
    return res.status(404).json({ message: "Запрос не найден" });
  }
  
  // Проверяем права доступа (только назначенный волонтер может завершить)
  if (request.assignedTo !== req.user.id) {
    return res.status(403).json({ message: "Только назначенный волонтер может завершить запрос" });
  }
  
  request.status = "completed";
  request.updatedAt = new Date().toISOString();
  request.completedAt = new Date().toISOString();
  
  // Обновляем статистику волонтера
  const volunteer = users.find(u => u.id === req.user.id);
  if (volunteer && volunteer.stats) {
    volunteer.stats.completedRequests++;
    volunteer.stats.experience += 15;
    volunteer.stats.volunteerHours += 2;
    
    // Проверяем необходимость повышения уровня
    if (volunteer.stats.experience >= volunteer.stats.level * 50) {
      volunteer.stats.level++;
    }
    
    volunteer.stats.updatedAt = new Date().toISOString();
  }
  
  res.json(request);
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Mock API сервер запущен на порту ${PORT}`);
}); 