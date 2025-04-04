-- Заполнение таблицы категорий запросов
INSERT INTO categories (name, icon) VALUES
    ('Покупка продуктов', 'shopping_cart'),
    ('Доставка лекарств', 'medication'),
    ('Выгул домашних животных', 'pets'),
    ('Помощь по дому', 'home'),
    ('Медицинская помощь', 'medical_services'),
    ('Транспортировка', 'directions_car'),
    ('Юридическая помощь', 'gavel'),
    ('Помощь в обучении', 'school'),
    ('Прочее', 'help')
ON CONFLICT DO NOTHING;

-- Заполнение таблицы категорий достижений
INSERT INTO achievement_categories (name, icon) VALUES
    ('Основные', 'star'),
    ('Помощь', 'volunteer_activism'),
    ('Волонтерство', 'handshake'),
    ('Активность', 'local_activity'),
    ('Особые', 'emoji_events')
ON CONFLICT DO NOTHING;

-- Заполнение таблицы достижений
INSERT INTO achievements (code, name, description, icon, category_id, rarity, experience) VALUES
    ('first_login', 'Первые шаги', 'Войдите в приложение впервые', 'first_step', 1, 'common', 10),
    ('profile_complete', 'Заполненный профиль', 'Заполните всю информацию в профиле', 'person', 1, 'common', 20),
    ('first_request', 'Первый запрос', 'Создайте свой первый запрос о помощи', 'add_task', 2, 'common', 30),
    ('five_requests', '5 запросов', 'Создайте 5 запросов о помощи', 'format_list_numbered', 2, 'rare', 50),
    ('ten_requests', '10 запросов', 'Создайте 10 запросов о помощи', 'list_alt', 2, 'epic', 100),
    ('first_volunteer', 'Первая помощь', 'Помогите кому-то впервые', 'volunteer_activism', 3, 'common', 50),
    ('five_volunteers', '5 раз помогли', 'Помогите 5 раз другим людям', 'group_add', 3, 'rare', 100),
    ('ten_volunteers', '10 раз помогли', 'Помогите 10 раз другим людям', 'groups', 3, 'epic', 200),
    ('first_comment', 'Первый комментарий', 'Оставьте свой первый комментарий', 'comment', 4, 'common', 20),
    ('first_rating', 'Первая оценка', 'Оцените выполненный запрос впервые', 'thumb_up', 4, 'common', 20),
    ('perfect_rating', 'Идеальная оценка', 'Получите оценку 5 звезд', 'grade', 4, 'rare', 50),
    ('quick_response', 'Быстрый отклик', 'Откликнитесь на запрос в течение 5 минут после публикации', 'speed', 5, 'legendary', 100),
    ('night_helper', 'Ночной помощник', 'Выполните запрос между 22:00 и 6:00', 'nightlight', 5, 'legendary', 100),
    ('long_distance', 'Дальнее расстояние', 'Выполните запрос на расстоянии более 5 км', 'route', 5, 'epic', 80),
    ('social_media', 'Социальные сети', 'Поделитесь приложением в социальных сетях', 'share', 1, 'common', 30)
ON CONFLICT DO NOTHING; 