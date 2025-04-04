-- +migrate Up
-- Создание представлений для удобной работы с данными

-- Представление для полной информации о пользователях
CREATE OR REPLACE VIEW user_full_info AS
SELECT
    u.id,
    u.telegram_id,
    u.username,
    u.first_name,
    u.last_name,
    u.photo_url,
    u.phone,
    u.address,
    u.about,
    u.role,
    u.created_at,
    us.level,
    us.experience,
    us.completed_requests,
    us.created_requests,
    us.volunteer_hours,
    us.rating,
    (SELECT COUNT(*) FROM user_achievements ua WHERE ua.user_id = u.id AND ua.unlocked = TRUE) AS achievements_count,
    (SELECT COUNT(*) FROM help_requests hr WHERE hr.requester_id = u.id) AS total_requests_created,
    (SELECT COUNT(*) FROM help_requests hr WHERE hr.assigned_to = u.id) AS total_requests_taken,
    (SELECT COUNT(*) FROM help_requests hr WHERE hr.assigned_to = u.id AND hr.status = 'completed') AS total_requests_completed
FROM
    users u
JOIN
    user_stats us ON u.id = us.user_id
WHERE
    u.is_deleted = FALSE OR u.is_deleted IS NULL;

-- Представление для запросов с информацией о пользователях
CREATE OR REPLACE VIEW request_full_info AS
SELECT
    hr.id,
    hr.title,
    hr.description,
    hr.status,
    rc.name AS category_name,
    rc.icon AS category_icon,
    rc.color AS category_color,
    hr.priority,
    hr.location,
    hr.created_at,
    hr.updated_at,
    hr.completed_at,
    hr.requester_id,
    requester.username AS requester_username,
    requester.first_name AS requester_first_name,
    requester.last_name AS requester_last_name,
    requester.photo_url AS requester_photo_url,
    hr.assigned_to,
    volunteer.username AS volunteer_username,
    volunteer.first_name AS volunteer_first_name,
    volunteer.last_name AS volunteer_last_name,
    volunteer.photo_url AS volunteer_photo_url,
    (SELECT COUNT(*) FROM request_comments rc WHERE rc.request_id = hr.id) AS comments_count
FROM
    help_requests hr
LEFT JOIN
    request_categories rc ON hr.category_id = rc.id
LEFT JOIN
    users requester ON hr.requester_id = requester.id
LEFT JOIN
    users volunteer ON hr.assigned_to = volunteer.id
WHERE
    hr.is_deleted = FALSE OR hr.is_deleted IS NULL;

-- Представление для статистики системы
CREATE OR REPLACE VIEW system_stats AS
SELECT
    (SELECT COUNT(*) FROM users WHERE role = 'volunteer') AS total_volunteers,
    (SELECT COUNT(*) FROM help_requests WHERE status = 'completed') AS total_completed_requests,
    (SELECT COUNT(*) FROM users WHERE role = 'user') AS total_users,
    (SELECT COUNT(*) FROM help_requests) AS total_requests,
    (SELECT COUNT(*) FROM partner_organizations) AS total_partners,
    (SELECT SUM(volunteer_hours) FROM user_stats) AS total_volunteer_hours,
    (SELECT AVG(rating) FROM request_ratings) AS average_rating,
    (SELECT COUNT(*) FROM help_requests WHERE status = 'new') AS pending_requests;

-- Представление для достижений пользователей с детальной информацией
CREATE OR REPLACE VIEW user_achievements_info AS
SELECT
    ua.id,
    ua.user_id,
    u.username,
    u.first_name,
    u.last_name,
    u.photo_url,
    a.id AS achievement_id,
    a.title AS achievement_title,
    a.description AS achievement_description,
    a.icon AS achievement_icon,
    a.icon_src AS achievement_icon_src,
    a.category AS achievement_category,
    a.rarity_level AS achievement_rarity,
    a.points_reward,
    ua.unlocked,
    ua.progress_current,
    ua.progress_total,
    ua.unlock_date,
    CASE
        WHEN ua.progress_total > 0 THEN ROUND((ua.progress_current::float / ua.progress_total::float) * 100)
        ELSE 0
    END AS progress_percentage
FROM
    user_achievements ua
JOIN
    users u ON ua.user_id = u.id
JOIN
    achievements a ON ua.achievement_id = a.id;

-- Представление для лидерборда по опыту
CREATE OR REPLACE VIEW leaderboard_experience AS
SELECT
    ROW_NUMBER() OVER (ORDER BY us.experience DESC) AS rank,
    u.id,
    u.username,
    u.first_name,
    u.last_name,
    u.photo_url,
    us.level,
    us.experience AS points,
    us.completed_requests,
    (SELECT COUNT(*) FROM user_achievements ua WHERE ua.user_id = u.id AND ua.unlocked = TRUE) AS achievements_count
FROM
    users u
JOIN
    user_stats us ON u.id = us.user_id
WHERE
    (u.is_deleted = FALSE OR u.is_deleted IS NULL)
ORDER BY
    us.experience DESC, us.level DESC;

-- Представление для лидерборда по выполненным запросам
CREATE OR REPLACE VIEW leaderboard_requests AS
SELECT
    ROW_NUMBER() OVER (ORDER BY us.completed_requests DESC) AS rank,
    u.id,
    u.username,
    u.first_name,
    u.last_name,
    u.photo_url,
    us.level,
    us.experience,
    us.completed_requests AS points,
    (SELECT COUNT(*) FROM user_achievements ua WHERE ua.user_id = u.id AND ua.unlocked = TRUE) AS achievements_count
FROM
    users u
JOIN
    user_stats us ON u.id = us.user_id
WHERE
    (u.is_deleted = FALSE OR u.is_deleted IS NULL) AND
    us.completed_requests > 0
ORDER BY
    us.completed_requests DESC;

-- Представление для уведомлений с дополнительной информацией
CREATE OR REPLACE VIEW notifications_info AS
SELECT
    n.id,
    n.user_id,
    u.username,
    u.first_name,
    u.last_name,
    n.type,
    n.title,
    n.message,
    n.request_id,
    n.achievement_id,
    n.is_read,
    n.created_at,
    CASE
        WHEN n.request_id IS NOT NULL THEN hr.title
        ELSE NULL
    END AS request_title,
    CASE
        WHEN n.achievement_id IS NOT NULL THEN a.title
        ELSE NULL
    END AS achievement_title
FROM
    notifications n
LEFT JOIN
    users u ON n.user_id = u.id
LEFT JOIN
    help_requests hr ON n.request_id = hr.id
LEFT JOIN
    achievements a ON n.achievement_id = a.id;

-- +migrate Down
-- Удаление представлений
DROP VIEW IF EXISTS notifications_info;
DROP VIEW IF EXISTS leaderboard_requests;
DROP VIEW IF EXISTS leaderboard_experience;
DROP VIEW IF EXISTS user_achievements_info;
DROP VIEW IF EXISTS system_stats;
DROP VIEW IF EXISTS request_full_info;
DROP VIEW IF EXISTS user_full_info; 