-- Удаление данных из таблицы достижений
DELETE FROM achievements WHERE code IN (
    'first_login', 'profile_complete', 'first_request', 'five_requests', 'ten_requests',
    'first_volunteer', 'five_volunteers', 'ten_volunteers', 'first_comment', 'first_rating',
    'perfect_rating', 'quick_response', 'night_helper', 'long_distance', 'social_media'
);

-- Удаление данных из таблицы категорий достижений
DELETE FROM achievement_categories WHERE name IN (
    'Основные', 'Помощь', 'Волонтерство', 'Активность', 'Особые'
);

-- Удаление данных из таблицы категорий запросов
DELETE FROM categories WHERE name IN (
    'Покупка продуктов', 'Доставка лекарств', 'Выгул домашних животных', 'Помощь по дому',
    'Медицинская помощь', 'Транспортировка', 'Юридическая помощь', 'Помощь в обучении', 'Прочее'
); 