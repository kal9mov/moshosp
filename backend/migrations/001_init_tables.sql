-- +migrate Up
-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    avatar VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Создание таблицы категорий запросов
CREATE TABLE IF NOT EXISTS request_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Создание таблицы запросов
CREATE TABLE IF NOT EXISTS requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    volunteer_id INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    address TEXT NOT NULL,
    category_id INTEGER NOT NULL REFERENCES request_categories(id),
    status VARCHAR(20) NOT NULL DEFAULT 'new',
    priority VARCHAR(20) NOT NULL DEFAULT 'normal',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Создание таблицы комментариев к запросам
CREATE TABLE IF NOT EXISTS request_comments (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES requests(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Создание таблицы оценок запросов
CREATE TABLE IF NOT EXISTS request_ratings (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES requests(id) UNIQUE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Создание таблицы игровых данных пользователей
CREATE TABLE IF NOT EXISTS user_game_data (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) UNIQUE,
    experience INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    points INTEGER NOT NULL DEFAULT 0,
    consecutive_days INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Создание таблицы достижений
CREATE TABLE IF NOT EXISTS achievements (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    rarity VARCHAR(20) NOT NULL,
    icon VARCHAR(255),
    experience_reward INTEGER NOT NULL DEFAULT 0,
    points_reward INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Создание таблицы достижений пользователей
CREATE TABLE IF NOT EXISTS user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    achievement_id VARCHAR(50) NOT NULL REFERENCES achievements(id),
    unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_viewed BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (user_id, achievement_id)
);

-- Создание таблицы уведомлений
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    entity_id INTEGER,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Создание таблицы для push-уведомлений
CREATE TABLE IF NOT EXISTS user_devices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    device_token VARCHAR(255) NOT NULL,
    platform VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, device_token)
);

-- Заполнение таблицы категорий запросов начальными данными
INSERT INTO request_categories (name, description, icon) VALUES
    ('Покупка продуктов', 'Помощь с покупкой и доставкой продуктов питания', 'shopping_cart'),
    ('Медицинская помощь', 'Покупка и доставка лекарств, сопровождение в медицинские учреждения', 'medical_services'),
    ('Бытовая помощь', 'Помощь с уборкой, мелким ремонтом и другими бытовыми задачами', 'home'),
    ('Выгул животных', 'Помощь с выгулом домашних животных', 'pets'),
    ('Транспортировка', 'Помощь с перемещением и транспортировкой', 'directions_car'),
    ('Психологическая поддержка', 'Разговоры и психологическая поддержка', 'psychology'),
    ('Помощь с цифровыми устройствами', 'Помощь с настройкой и использованием компьютеров, телефонов и других устройств', 'computer'),
    ('Другое', 'Другие виды помощи', 'more_horiz');

-- Заполнение таблицы достижений начальными данными
INSERT INTO achievements (id, name, description, category, rarity, icon, experience_reward, points_reward) VALUES
    ('first_request_created', 'Первый шаг', 'Создайте свою первую заявку о помощи', 'requests', 'common', 'first_step.png', 10, 5),
    ('first_request_accepted', 'Готов помочь', 'Примите первую заявку как волонтер', 'volunteer', 'common', 'ready_to_help.png', 20, 10),
    ('first_request_completed', 'Миссия выполнена', 'Выполните первую заявку как волонтер', 'volunteer', 'common', 'mission_complete.png', 30, 15),
    ('five_requests_completed', 'Добрая душа', 'Выполните 5 заявок как волонтер', 'volunteer', 'uncommon', 'kind_soul.png', 50, 25),
    ('ten_requests_completed', 'Супер-волонтер', 'Выполните 10 заявок как волонтер', 'volunteer', 'rare', 'super_volunteer.png', 100, 50),
    ('twentyfive_requests_completed', 'Герой района', 'Выполните 25 заявок как волонтер', 'volunteer', 'epic', 'neighborhood_hero.png', 250, 125),
    ('fifty_requests_completed', 'Легенда волонтерства', 'Выполните 50 заявок как волонтер', 'volunteer', 'legendary', 'volunteer_legend.png', 500, 250),
    ('hundred_requests_completed', 'Волонтер года', 'Выполните 100 заявок как волонтер', 'volunteer', 'mythic', 'volunteer_of_the_year.png', 1000, 500),
    ('active_three_days', 'Активный участник', 'Будьте активны 3 дня подряд', 'activity', 'common', 'active_user.png', 15, 7),
    ('active_week', 'Недельный марафон', 'Будьте активны 7 дней подряд', 'activity', 'uncommon', 'weekly_marathon.png', 35, 17),
    ('active_month', 'Месяц добрых дел', 'Будьте активны 30 дней подряд', 'activity', 'epic', 'month_of_good_deeds.png', 200, 100),
    ('perfect_rating', 'Безупречная репутация', 'Получите 5 оценок с максимальным рейтингом', 'volunteer', 'rare', 'perfect_reputation.png', 100, 50),
    ('helpful_comments', 'Всегда на связи', 'Оставьте 10 комментариев к заявкам', 'social', 'uncommon', 'always_connected.png', 30, 15),
    ('social_butterfly', 'Душа компании', 'Получите 20 ответов на ваши комментарии', 'social', 'rare', 'social_butterfly.png', 60, 30);

-- +migrate Down
-- Удаление таблиц в обратном порядке
DROP TABLE IF EXISTS user_devices;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS user_achievements;
DROP TABLE IF EXISTS achievements;
DROP TABLE IF EXISTS user_game_data;
DROP TABLE IF EXISTS request_ratings;
DROP TABLE IF EXISTS request_comments;
DROP TABLE IF EXISTS requests;
DROP TABLE IF EXISTS request_categories;
DROP TABLE IF EXISTS users; 