#!/usr/bin/env python3
"""
Check database structure and data
"""

import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    try:
        conn = psycopg2.connect(
            host="localhost",
            port="5432",
            database="recur_ai_db",
            user="postgres",
            password="prameela@65"
        )
        return conn
    except Exception as e:
        print(f"Database connection failed: {e}")
        return None

def check_resume_analyses():
    conn = get_db_connection()
    if not conn:
        return
    
    try:
        cur = conn.cursor()
        
        # Check table structure
        cur.execute("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'resume_analyses' 
            ORDER BY ordinal_position
        """)
        
        print("📊 Resume Analyses Table Structure:")
        for row in cur.fetchall():
            print(f"  {row[0]}: {row[1]} (nullable: {row[2]})")
        
        # Check actual data
        cur.execute("SELECT * FROM resume_analyses LIMIT 1")
        row = cur.fetchone()
        
        if row:
            print(f"\n📋 Sample Data Row:")
            cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'resume_analyses' ORDER BY ordinal_position")
            columns = [col[0] for col in cur.fetchall()]
            
            for i, (col, val) in enumerate(zip(columns, row)):
                print(f"  {col}: {val} (type: {type(val).__name__})")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    check_resume_analyses()
