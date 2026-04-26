-- V19__insert_default_roles.sql

INSERT INTO roles (name, created_at)
VALUES ('USER', NOW()),
       ('ADMIN', NOW()),
       ('SCANNER', NOW()),
       ('CREATOR', NOW()),
       ('VERIFIED', NOW()),
       ('MODERATOR', NOW());