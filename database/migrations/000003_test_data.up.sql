-- Добавление тестовых пользователей
INSERT INTO users (telegram_id, name, phone, email, avatar_url, role, created_at, updated_at) VALUES
    (123456789, 'Иван Петров', '+7 (900) 123-45-67', 'ivan@example.com', 'https://i.pravatar.cc/150?img=1', 'user', NOW(), NOW()),
    (987654321, 'Мария Сидорова', '+7 (900) 987-65-43', 'maria@example.com', 'https://i.pravatar.cc/150?img=5', 'volunteer', NOW(), NOW()),
    (111222333, 'Алексей Козлов', '+7 (900) 111-22-33', 'alex@example.com', 'https://i.pravatar.cc/150?img=3', 'volunteer', NOW(), NOW()),
    (444555666, 'Екатерина Иванова', '+7 (900) 444-55-66', 'kate@example.com', 'https://i.pravatar.cc/150?img=9', 'user', NOW(), NOW()),
    (777888999, 'Дмитрий Смирнов', '+7 (900) 777-88-99', 'dmitry@example.com', 'https://i.pravatar.cc/150?img=8', 'admin', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Добавление статистики пользователей
INSERT INTO user_stats (user_id, experience, level, completed_requests, volunteer_hours, achievements_count, created_at, updated_at)
SELECT id, 
       CASE 
         WHEN role = 'volunteer' THEN floor(random() * 500) + 100
         WHEN role = 'admin' THEN floor(random() * 1000) + 500
         ELSE floor(random() * 200) + 50
       END as experience,
       CASE 
         WHEN role = 'volunteer' THEN floor(random() * 5) + 2
         WHEN role = 'admin' THEN floor(random() * 10) + 5
         ELSE floor(random() * 3) + 1
       END as level,
       CASE 
         WHEN role = 'volunteer' THEN 0
         ELSE floor(random() * 10) + 1
       END as completed_requests,
       CASE 
         WHEN role = 'volunteer' THEN floor(random() * 100) + 10
         ELSE 0
       END as volunteer_hours,
       floor(random() * 5) + 1 as achievements_count,
       NOW(), NOW()
FROM users
WHERE id <= 5
ON CONFLICT DO NOTHING;

-- Добавление тестовых запросов
INSERT INTO requests (title, description, location, category_id, priority, status, author_id, volunteer_id, created_at, updated_at) 
VALUES
    ('Нужна помощь с покупкой продуктов', 'Не могу сам сходить в магазин из-за болезни. Нужны молоко, хлеб, сыр, яйца и немного фруктов.', 'ул. Ленина, 25, кв. 15', 1, 'medium', 'new', 1, NULL, NOW() - INTERVAL '3 day', NOW() - INTERVAL '3 day'),
    ('Доставить лекарства из аптеки', 'Нужно забрать рецептурные лекарства из аптеки и доставить до дома.', 'пр. Мира, 78, кв. 42', 2, 'high', 'in_progress', 1, 2, NOW() - INTERVAL '5 day', NOW() - INTERVAL '4 day'),
    ('Выгулять собаку', 'Нужно выгулять собаку (лабрадор, дружелюбный) в течение 30 минут.', 'ул. Садовая, 15, кв. 3', 3, 'low', 'completed', 4, 2, NOW() - INTERVAL '10 day', NOW() - INTERVAL '9 day'),
    ('Помощь с настройкой телевизора', 'Не могу настроить новый телевизор. Нужна помощь с подключением и настройкой каналов.', 'ул. Гагарина, 54, кв. 89', 4, 'medium', 'completed', 4, 3, NOW() - INTERVAL '15 day', NOW() - INTERVAL '14 day'),
    ('Требуется сопровождение в поликлинику', 'Нужно сопроводить пожилого человека в поликлинику и обратно.', 'ул. Строителей, 32, кв. 7', 5, 'high', 'new', 1, NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- Добавление тестовых комментариев
INSERT INTO request_comments (request_id, user_id, text, created_at) VALUES
    (2, 1, 'Пожалуйста, привезите до 18:00.', NOW() - INTERVAL '4 day 6 hour'),
    (2, 2, 'Хорошо, постараюсь быть у вас до 17:30.', NOW() - INTERVAL '4 day 5 hour'),
    (3, 4, 'Собаку зовут Рекс, поводок и намордник находятся в шкафу у входа.', NOW() - INTERVAL '9 day 12 hour'),
    (3, 2, 'Выгулял вашего пса. Очень дружелюбный, все прошло отлично!', NOW() - INTERVAL '9 day 10 hour'),
    (4, 4, 'Я буду дома весь день, можете прийти в любое удобное для вас время.', NOW() - INTERVAL '14 day 8 hour'),
    (4, 3, 'Приду примерно в 14:00, если вам удобно.', NOW() - INTERVAL '14 day 7 hour'),
    (4, 4, 'Да, это удобно, буду ждать.', NOW() - INTERVAL '14 day 6 hour')
ON CONFLICT DO NOTHING;

-- Добавление тестовых оценок
INSERT INTO request_ratings (request_id, user_id, rating, feedback, created_at) VALUES
    (3, 4, 5, 'Отличный волонтер! Быстро и качественно выполнил просьбу.', NOW() - INTERVAL '9 day 5 hour'),
    (4, 4, 4, 'Хорошо справился с задачей, телевизор работает. Немного опоздал.', NOW() - INTERVAL '14 day 1 hour')
ON CONFLICT DO NOTHING;

-- Добавление достижений для пользователей
INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
SELECT u.id, a.id, NOW() - (random() * INTERVAL '30 day')
FROM users u
CROSS JOIN achievements a
WHERE u.id <= 5 AND random() < 0.3 -- 30% вероятность получения достижения
ON CONFLICT DO NOTHING;

-- Добавление тестовых уведомлений
INSERT INTO notifications (user_id, title, message, type, is_read, data, created_at) VALUES
    (1, 'Ваш запрос принят', 'Ваш запрос на доставку лекарств принят волонтером.', 'request_accepted', true, '{"request_id": 2}', NOW() - INTERVAL '4 day 5 hour'),
    (1, 'Новое достижение!', 'Вы разблокировали достижение "Первый запрос".', 'achievement_unlocked', true, '{"achievement_id": 3}', NOW() - INTERVAL '3 day 2 hour'),
    (2, 'Запрос выполнен', 'Вы отметили запрос на выгул собаки как выполненный.', 'request_completed', false, '{"request_id": 3}', NOW() - INTERVAL '9 day 10 hour'),
    (2, 'Новая оценка', 'Вы получили оценку 5 звезд за выполненный запрос.', 'new_rating', false, '{"request_id": 3, "rating": 5}', NOW() - INTERVAL '9 day 5 hour'),
    (4, 'Запрос выполнен', 'Ваш запрос на настройку телевизора выполнен. Пожалуйста, оцените работу волонтера.', 'request_completed', true, '{"request_id": 4}', NOW() - INTERVAL '14 day 2 hour'),
    (3, 'Новая оценка', 'Вы получили оценку 4 звезды за выполненный запрос.', 'new_rating', false, '{"request_id": 4, "rating": 4}', NOW() - INTERVAL '14 day 1 hour')
ON CONFLICT DO NOTHING; 