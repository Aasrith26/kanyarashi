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

def fix_database_schema():
    """Fix database schema issues (triggers, columns)"""
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        logger.info("🔧 Checking and fixing database schema...")
        
        # Check if updated_at column exists in resumes table
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'resumes' AND column_name = 'updated_at'
        """)
        
        if not cur.fetchone():
            logger.info("➕ Adding updated_at column to resumes table...")
            cur.execute("""
                ALTER TABLE resumes 
                ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            """)
            logger.info("✅ Added updated_at column to resumes table")
        else:
            logger.info("✅ updated_at column already exists in resumes table")

        # Check if updated_at column exists in analysis_sessions table
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'analysis_sessions' AND column_name = 'updated_at'
        """)
        
        if not cur.fetchone():
            logger.info("➕ Adding updated_at column to analysis_sessions table...")
            cur.execute("""
                ALTER TABLE analysis_sessions 
                ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            """)
            logger.info("✅ Added updated_at column to analysis_sessions table")
        else:
            logger.info("✅ updated_at column already exists in analysis_sessions table")

        # Create or replace the trigger function
        logger.info("🔧 Creating/replacing trigger function...")
        cur.execute("""
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        """)
        logger.info("✅ Trigger function created/replaced")

        # Drop existing triggers if they exist
        logger.info("🗑️ Dropping existing triggers...")
        cur.execute("DROP TRIGGER IF EXISTS update_resumes_updated_at ON resumes")
        cur.execute("DROP TRIGGER IF EXISTS update_analysis_sessions_updated_at ON analysis_sessions")
        cur.execute("DROP TRIGGER IF EXISTS update_users_updated_at ON users")
        cur.execute("DROP TRIGGER IF EXISTS update_job_postings_updated_at ON job_postings")

        # Create triggers
        logger.info("🔧 Creating triggers...")
        cur.execute("""
            CREATE TRIGGER update_users_updated_at 
            BEFORE UPDATE ON users 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
        """)
        
        cur.execute("""
            CREATE TRIGGER update_job_postings_updated_at 
            BEFORE UPDATE ON job_postings 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
        """)
        
        cur.execute("""
            CREATE TRIGGER update_resumes_updated_at 
            BEFORE UPDATE ON resumes 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
        """)
        
        cur.execute("""
            CREATE TRIGGER update_analysis_sessions_updated_at 
            BEFORE UPDATE ON analysis_sessions 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
        """)
        
        logger.info("✅ All triggers created successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error fixing database schema: {e}")
        return False
    finally:
        if conn:
            cur.close()
            conn.close()

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
        
        # Fix any schema issues after initial creation
        logger.info("🔧 Applying schema fixes...")
        if fix_database_schema():
            logger.info("✅ Database schema fixes applied successfully!")
        else:
            logger.warning("⚠️ Some schema fixes may have failed, but continuing...")
        
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
