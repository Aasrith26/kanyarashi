import psycopg2

try:
    # Connect to PostgreSQL as postgres user
    conn = psycopg2.connect(
        host="localhost",
        port="5432",
        database="recur_ai_db",
        user="postgres",
        password=input("Enter postgres password: ")
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
    print("✅ All tests passed! Your PostgreSQL setup is working correctly.")
    
except Exception as e:
    print(f"❌ Database connection failed: {e}")
    print("Please check your PostgreSQL setup and credentials.")
