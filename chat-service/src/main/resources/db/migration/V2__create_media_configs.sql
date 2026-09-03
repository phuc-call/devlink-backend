CREATE TABLE media_configs (
    media_type VARCHAR(20) PRIMARY KEY,
    max_size_mb INT NOT NULL,
    max_count_per_msg INT,
    max_duration_sec INT,
    max_total_size_mb INT
);

INSERT INTO media_configs (media_type, max_size_mb, max_count_per_msg, max_duration_sec, max_total_size_mb) VALUES
('IMAGE', 10,  10, NULL, NULL),
('VIDEO', 200, 10, 300,  500),
('FILE',  50,  5,  NULL, NULL);
