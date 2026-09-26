CREATE DATABASE IF NOT EXISTS emergency_finder;
USE emergency_finder;

CREATE TABLE IF NOT EXISTS emergency_exits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exit_key VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    row_idx INT NOT NULL,
    col_idx INT NOT NULL,
    is_active TINYINT(1) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS evacuation_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    start_row INT NOT NULL,
    start_col INT NOT NULL,
    exit_used VARCHAR(100) NOT NULL,
    distance_meters FLOAT NOT NULL,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO emergency_exits (exit_key, name, row_idx, col_idx, is_active) VALUES
('exit_1', 'North Exit', 0, 10, 1),
('exit_2', 'South-East Exit', 13, 18, 1),
('exit_3', 'West Exit', 7, 0, 1);