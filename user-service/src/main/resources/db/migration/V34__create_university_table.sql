CREATE TABLE university (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    website VARCHAR(255),
    domains JSON,
    web_pages JSON,
    country VARCHAR(100),
    alpha_two_code VARCHAR(10),
    state_province VARCHAR(100),
    description TEXT,
    logo VARCHAR(500),
    images JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE user_profile
ADD COLUMN university_id BIGINT;
