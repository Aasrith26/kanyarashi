import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:your_postgres_password@localhost:5432/recur_ai_db"
)

try:
    # Parse the DATABASE_URL
    # Format: postgresql://user:password@host:port/database
    parts = DATABASE_URL.replace('postgresql://', '').split('/')
    db_name = parts[1]
    user_pass_host = parts[0].split('@')
    user_pass = user_pass_host[0].split(':')
    host_port = user_pass_host[1].split(':')
    
    user = user_pass[0]
    password = user_pass[1]
    host = host_port[0]
    port = host_port[1] if len(host_port) > 1 else '5432'
    
    print(f"Connecting to database: {db_name}")
    print(f"Host: {host}, Port: {port}, User: {user}")
    
    # Connect to PostgreSQL
    conn = psycopg2.connect(
        host=host,
        port=port,
        database=db_name,
        user=user,
        password=password
    )
    
    # Test the connection
    cur = conn.cursor()
    cur.execute("SELECT version();")
    version = cur.fetchone()
    print(f"✅ Database connection successful!")
    print(f"PostgreSQL version: {version[0]}")
    
    # Check if tables exist
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
    """)
    tables = cur.fetchall()
    print(f"✅ Found {len(tables)} tables:")
    for table in tables:
        print(f"  - {table[0]}")
    
    cur.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Database connection failed: {e}")
    print("Please check your PostgreSQL setup and credentials.")
