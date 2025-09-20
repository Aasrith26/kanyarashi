-- Database initialization script for RecurAI
-- Run this script to set up the database

-- Create database (uncomment if needed)
-- CREATE DATABASE recur_ai_db;

-- Connect to recur_ai_db and run the schema
\c recur_ai_db;

-- Run the schema file
\i schema.sql;

-- Create a read-only user for reporting
CREATE USER recur_ai_readonly WITH PASSWORD 'readonly_password_123';
GRANT CONNECT ON DATABASE recur_ai_db TO recur_ai_readonly;
GRANT USAGE ON SCHEMA public TO recur_ai_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO recur_ai_readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO recur_ai_readonly;

-- Create a read-write user for the application
CREATE USER recur_ai_app WITH PASSWORD 'app_password_123';
GRANT CONNECT ON DATABASE recur_ai_db TO recur_ai_app;
GRANT USAGE ON SCHEMA public TO recur_ai_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO recur_ai_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO recur_ai_app;

