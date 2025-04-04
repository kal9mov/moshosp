-- +migrate Up
-- Начальные данные для заполнения базы данных

-- Добавление категорий запросов
INSERT INTO request_categories (name, description, icon, color) VALUES 
('medicine', 'Покупка и доставка лекарств', 'medication', '#f44336'),
('food', 'Покупка и доставка продуктов', 'restaurant', '#4caf50'),
('household', 'Помощь по дому', 'home', '#ff9800'),
('transport', 'Транспортировка', 'directions_car', '#2196f3'),
('translate', 'Помощь с переводом', 'translate', '#9c27b0'),
('tech', 'Техническая помощь', 'devices', '#607d8b'),
('paperwork', 'Помощь с документами', 'description', '#795548'),
('basic', 'Базовая помощь', 'help', '#00bcd4'),
('escort', 'Сопровождение', 'person', '#3f51b5'),
('shopping', 'Покупки', 'shopping_cart', '#8bc34a'),
('other', 'Другое', 'more_horiz', '#9e9e9e');

-- Добавление тестовых пользователей
INSERT INTO users (telegram_id, username, first_name, last_name, photo_url, phone, address, about, role) VALUES
('12345', 'user1', 'Иван', 'Иванов', 'https://via.placeholder.com/150', '+7 (999) 123-45-67', 'ул. Примерная, д. 1, кв. 1', 'Нуждаюсь в помощи волонтеров', 'user'),
('67890', 'volunteer1', 'Мария', 'Петрова', 'https://via.placeholder.com/150', '+7 (999) 765-43-21', 'ул. Ленина, д. 10, кв. 5', 'Готова помогать людям', 'volunteer'),
('11223', 'admin1', 'Алексей', 'Смирнов', 'https://via.placeholder.com/150', '+7 (999) 111-22-33', 'ул. Пушкина, д. 5, кв. 15', 'Администратор системы', 'admin');

-- Добавление статистики пользователей
INSERT INTO user_stats (user_id, level, experience, completed_requests, created_requests, volunteer_hours, rating) VALUES
(1, 1, 0, 0, 2, 0, 0),
(2, 3, 150, 10, 1, 25, 4.8),
(3, 5, 350, 15, 3, 40, 5.0);

-- Добавление достижений
INSERT INTO achievements (id, title, description, icon, category, rarity_level, points_reward) VALUES
('first_login', 'Первый вход', 'Зарегистрируйтесь и войдите в систему', '🚀', 'educational', 'common', 50),
('profile_complete', 'Личные данные', 'Заполните свой профиль полностью', '📋', 'educational', 'common', 100),
('first_request', 'Первый запрос', 'Создайте свой первый запрос о помощи', '📝', 'social', 'common', 50),
('first_help', 'Первая помощь', 'Выполните первый запрос о помощи', '🤝', 'social', 'common', 75),
('level_5', 'Уровень 5', 'Достигните 5 уровня', '⭐', 'special', 'uncommon', 150),
('complete_5_requests', 'Отзывчивый помощник', 'Выполните 5 заявок о помощи', '🛡️', 'social', 'uncommon', 200),
('complete_20_requests', 'Профессиональный волонтёр', 'Выполните 20 заявок о помощи', '🏆', 'social', 'rare', 500),
('rating_5', 'Безупречная репутация', 'Получите рейтинг 5.0', '🌟', 'social', 'epic', 1000);

-- Присвоение достижений пользователям
INSERT INTO user_achievements (user_id, achievement_id, unlocked, progress_current, progress_total, unlock_date) VALUES
-- Пользователь 1 (обычный пользователь)
(1, 'first_login', TRUE, NULL, NULL, CURRENT_TIMESTAMP),
(1, 'profile_complete', TRUE, NULL, NULL, CURRENT_TIMESTAMP),
(1, 'first_request', TRUE, NULL, NULL, CURRENT_TIMESTAMP),
(1, 'level_5', FALSE, 1, 5, NULL),

-- Пользователь 2 (волонтер)
(2, 'first_login', TRUE, NULL, NULL, CURRENT_TIMESTAMP - INTERVAL '30 days'),
(2, 'profile_complete', TRUE, NULL, NULL, CURRENT_TIMESTAMP - INTERVAL '29 days'),
(2, 'first_help', TRUE, NULL, NULL, CURRENT_TIMESTAMP - INTERVAL '28 days'),
(2, 'complete_5_requests', TRUE, NULL, NULL, CURRENT_TIMESTAMP - INTERVAL '15 days'),
(2, 'complete_20_requests', FALSE, 10, 20, NULL),
(2, 'level_5', FALSE, 3, 5, NULL),

-- Пользователь 3 (администратор)
(3, 'first_login', TRUE, NULL, NULL, CURRENT_TIMESTAMP - INTERVAL '60 days'),
(3, 'profile_complete', TRUE, NULL, NULL, CURRENT_TIMESTAMP - INTERVAL '59 days'),
(3, 'first_help', TRUE, NULL, NULL, CURRENT_TIMESTAMP - INTERVAL '58 days'),
(3, 'complete_5_requests', TRUE, NULL, NULL, CURRENT_TIMESTAMP - INTERVAL '45 days'),
(3, 'complete_20_requests', FALSE, 15, 20, NULL),
(3, 'level_5', TRUE, 5, 5, CURRENT_TIMESTAMP - INTERVAL '10 days');

-- Добавление игровых данных пользователей
INSERT INTO user_game_data (user_id, level, experience, completed_quests, total_quests) VALUES
(1, 1, 50, 2, 10),
(2, 3, 150, 10, 15),
(3, 5, 350, 15, 20);

-- Создание тестовых запросов о помощи
INSERT INTO help_requests (title, description, status, category_id, priority, location, requester_id, assigned_to, completed_at) VALUES
('Нужна помощь с покупкой продуктов', 'Мне 78 лет, трудно выходить из дома. Нужна помощь с покупкой продуктов в ближайшем магазине.', 'new', 2, 'medium', 'ул. Пушкина, д. 10, кв. 5', 1, NULL, NULL),
('Требуется помощь с лекарствами', 'Необходимо забрать рецептурные лекарства из аптеки и доставить мне. Рецепт у меня на руках.', 'in_progress', 1, 'high', 'ул. Ленина, д. 15, кв. 7', 1, 2, NULL),
('Помощь с оплатой ЖКХ', 'Нужна помощь с оплатой коммунальных услуг через терминал.', 'completed', 7, 'medium', 'ул. Гагарина, д. 3, кв. 12', 3, 2, CURRENT_TIMESTAMP - INTERVAL '5 days'),
('Сопровождение в поликлинику', 'Нужна помощь с сопровождением в поликлинику на плановый прием к врачу.', 'new', 9, 'low', 'ул. Первомайская, д. 8, кв. 2', 1, NULL, NULL),
('Настройка телевизора', 'Нужна помощь с настройкой цифрового телевидения.', 'cancelled', 6, 'low', 'ул. Советская, д. 21, кв. 9', 3, NULL, NULL);

-- Добавление комментариев к запросам
INSERT INTO request_comments (request_id, user_id, text) VALUES
(2, 2, 'Я готов помочь с доставкой лекарств. Когда вам удобно?'),
(2, 1, 'Спасибо! Можно в любой день после 14:00.'),
(3, 2, 'Задание выполнено. Чек об оплате прикреплен к сообщению.'),
(3, 3, 'Большое спасибо за помощь!');

-- Добавление оценок выполненных запросов
INSERT INTO request_ratings (request_id, rater_id, rated_id, rating, comment) VALUES
(3, 3, 2, 5, 'Отличная помощь, все сделано быстро и качественно!');

-- Добавление уведомлений
INSERT INTO notifications (user_id, type, title, message, request_id) VALUES
(1, 'request_assigned', 'Ваш запрос принят волонтером', 'Волонтер Мария взялась за выполнение вашего запроса о помощи с лекарствами.', 2),
(2, 'request_created', 'Новый запрос о помощи', 'Поступил новый запрос о помощи с покупкой продуктов.', 1),
(3, 'request_completed', 'Запрос выполнен', 'Ваш запрос о помощи с оплатой ЖКХ выполнен.', 3),
(2, 'achievement_unlocked', 'Новое достижение!', 'Вы получили достижение "Отзывчивый помощник".', NULL);

-- +migrate Down
-- Удаление всех данных в обратном порядке
DELETE FROM notifications;
DELETE FROM request_ratings;
DELETE FROM request_comments;
DELETE FROM help_requests;
DELETE FROM user_game_data;
DELETE FROM user_achievements;
DELETE FROM achievements;
DELETE FROM user_stats;
DELETE FROM users;
DELETE FROM request_categories; 