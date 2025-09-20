#!/usr/bin/env python3
"""
Database initialization script for Railway deployment
Creates all required tables and indexes
"""

import os
import time
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_db_connection(max_retries=5, delay=2):
    """Get database connection with retry logic"""
    for attempt in range(max_retries):
        try:
            database_url = os.getenv("DATABASE_URL")
            if database_url:
                conn = psycopg2.connect(database_url)
            else:
                # Fallback for local development
                conn = psycopg2.connect(
                    host="localhost",
                    port="5432",
                    database="recur_ai_db", 
                    user="postgres",
                    password="prameela@65"
                )
            logger.info(f"✅ Database connected on attempt {attempt + 1}")
            return conn
        except Exception as e:
            logger.warning(f"Database connection attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                logger.info(f"Retrying in {delay} seconds...")
                time.sleep(delay)
            else:
                logger.error(f"Database connection failed after {max_retries} attempts")
    return None

def init_database():
    """Initialize database with schema"""
    conn = get_db_connection()
    if not conn:
        logger.error("Failed to connect to database")
        return False
    
    try:
        cur = conn.cursor()
        
        # Read schema file
        schema_file = os.path.join(os.path.dirname(__file__), 'schema.sql')
        if not os.path.exists(schema_file):
            logger.error(f"Schema file not found: {schema_file}")
            return False
        
        with open(schema_file, 'r') as f:
            schema_sql = f.read()
        
        # Execute schema
        logger.info("Executing database schema...")
        cur.execute(schema_sql)
        conn.commit()
        
        logger.info("✅ Database schema initialized successfully!")
        
        # Verify tables were created
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        
        tables = cur.fetchall()
        logger.info(f"📋 Created tables: {[table[0] for table in tables]}")
        
        return True
        
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        conn.rollback()
        return False
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    logger.info("🚀 Starting database initialization...")
    success = init_database()
    if success:
        logger.info("🎉 Database initialization completed!")
        exit(0)
    else:
        logger.error("❌ Database initialization failed!")
        exit(1)
