DROP TABLE IF EXISTS user_tokens;
CREATE TABLE IF NOT EXISTS user_tokens (email TEXT PRIMARY KEY, token TEXT);
DROP TABLE IF EXISTS users;
CREATE TABLE IF NOT EXISTS users (uid TEXT PRIMARY KEY, email TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);