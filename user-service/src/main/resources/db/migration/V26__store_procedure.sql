CREATE PROCEDURE get_all_user_languages()
BEGIN
SELECT
    u.id AS userId,
    up.language AS languages
FROM user u
JOIN user_profile up ON up.user_id=u.id
WHERE up.language IS NOT NULL AND up.language !='[]';
END