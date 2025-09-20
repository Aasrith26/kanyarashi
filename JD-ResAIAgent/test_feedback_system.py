#!/usr/bin/env python3
"""
Test script for the Feedback Email System
Run this script to test the feedback email functionality
"""

import os
import sys
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_environment_variables():
    """Test if all required environment variables are set"""
    print("🔍 Testing Environment Variables...")
    
    required_vars = [
        'EMAIL_PROVIDER',
        'FROM_EMAIL',
        'FROM_NAME',
        'SMTP_USERNAME',
        'SMTP_PASSWORD'
    ]
    
    optional_vars = [
        'SMTP_SERVER',
        'SMTP_PORT',
        'USE_TLS',
        'USE_SSL',
        'REPLY_TO_EMAIL',
        'OPENAI_API_KEY',
        'OPENAI_MODEL'
    ]
    
    missing_required = []
    missing_optional = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_required.append(var)
        else:
            print(f"✅ {var}: {os.getenv(var)}")
    
    for var in optional_vars:
        if not os.getenv(var):
            missing_optional.append(var)
        else:
            print(f"✅ {var}: {'*' * 10}")  # Hide sensitive values
    
    if missing_required:
        print(f"❌ Missing required variables: {', '.join(missing_required)}")
        return False
    
    if missing_optional:
        print(f"⚠️  Missing optional variables: {', '.join(missing_optional)}")
        print("   Some features may not work without these variables")
    
    print("✅ Environment variables test passed!")
    return True

def test_database_connection():
    """Test database connection and feedback_emails table"""
    print("\n🗄️  Testing Database Connection...")
    
    try:
        import psycopg2
        
        # Get database URL from environment
        database_url = os.getenv('DATABASE_URL', 'postgresql://recur_ai_app:app_password_123@localhost:5432/recur_ai_db')
        
        # Test connection
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        
        # Test if feedback_emails table exists
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'feedback_emails'
            );
        """)
        
        table_exists = cur.fetchone()[0]
        
        if table_exists:
            print("✅ feedback_emails table exists")
            
            # Test table structure
            cur.execute("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'feedback_emails'
                ORDER BY ordinal_position;
            """)
            
            columns = cur.fetchall()
            print(f"✅ Table has {len(columns)} columns")
            
        else:
            print("❌ feedback_emails table does not exist")
            print("   Run: psql -d your_database -f database/migrate_feedback_emails.sql")
            return False
        
        cur.close()
        conn.close()
        
        print("✅ Database connection test passed!")
        return True
        
    except ImportError:
        print("❌ psycopg2 not installed. Run: pip install psycopg2-binary")
        return False
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def test_email_service():
    """Test email service configuration"""
    print("\n📧 Testing Email Service...")
    
    try:
        from email_service import EmailConfig, EmailService
        
        # Test configuration
        config = EmailConfig(
            provider=os.getenv('EMAIL_PROVIDER', 'gmail'),
            smtp_server=os.getenv('SMTP_SERVER'),
            smtp_port=int(os.getenv('SMTP_PORT', '587')),
            smtp_username=os.getenv('SMTP_USERNAME'),
            smtp_password=os.getenv('SMTP_PASSWORD'),
            from_email=os.getenv('FROM_EMAIL', 'noreply@innomaticsresearch.com'),
            from_name=os.getenv('FROM_NAME', 'Innomatics Research Lab'),
            reply_to=os.getenv('REPLY_TO_EMAIL'),
            use_tls=os.getenv('USE_TLS', 'true').lower() == 'true',
            use_ssl=os.getenv('USE_SSL', 'false').lower() == 'true'
        )
        
        print(f"✅ Email provider: {config.provider}")
        print(f"✅ From email: {config.from_email}")
        print(f"✅ From name: {config.from_name}")
        
        # Test email service initialization
        email_service = EmailService(config)
        print("✅ Email service initialized successfully")
        
        return True
        
    except ImportError as e:
        print(f"❌ Email service import failed: {e}")
        print("   Make sure all dependencies are installed: pip install jinja2 email-validator")
        return False
    except Exception as e:
        print(f"❌ Email service test failed: {e}")
        return False

def test_feedback_generator():
    """Test feedback generator"""
    print("\n🤖 Testing Feedback Generator...")
    
    try:
        from feedback_generator import FeedbackGenerator, FeedbackRequest
        
        # Test feedback generator initialization
        generator = FeedbackGenerator()
        print("✅ Feedback generator initialized successfully")
        
        # Test feedback request model
        request = FeedbackRequest(
            candidate_name="Test Candidate",
            resume_content="Test resume content",
            analysis_results={
                "Overall Fit": 75,
                "Skill Match": 80,
                "Project Relevance": 70,
                "Problem Solving": 85,
                "Tools": 75,
                "Summary": "Good candidate with strong technical skills"
            },
            job_description="Software Engineer position",
            job_title="Software Engineer"
        )
        
        print("✅ Feedback request model created successfully")
        
        return True
        
    except ImportError as e:
        print(f"❌ Feedback generator import failed: {e}")
        print("   Make sure all dependencies are installed: pip install langchain langchain-openai")
        return False
    except Exception as e:
        print(f"❌ Feedback generator test failed: {e}")
        return False

async def test_feedback_generation():
    """Test actual feedback generation (requires OpenAI API key)"""
    print("\n🧠 Testing Feedback Generation...")
    
    if not os.getenv('OPENAI_API_KEY'):
        print("⚠️  OPENAI_API_KEY not set, skipping feedback generation test")
        return True
    
    try:
        from feedback_generator import generate_candidate_feedback
        
        # Test feedback generation
        response = await generate_candidate_feedback(
            candidate_name="John Doe",
            resume_content="Experienced software engineer with 5 years of experience in Python and JavaScript.",
            analysis_results={
                "Overall Fit": 75,
                "Skill Match": 80,
                "Project Relevance": 70,
                "Problem Solving": 85,
                "Tools": 75,
                "Summary": "Strong technical background with good problem-solving skills"
            },
            job_description="Senior Software Engineer position requiring Python and JavaScript experience",
            job_title="Senior Software Engineer"
        )
        
        print("✅ Feedback generated successfully")
        print(f"✅ Subject: {response.subject_suggestion}")
        print(f"✅ Tone: {response.tone}")
        print(f"✅ Key areas: {', '.join(response.key_areas)}")
        print(f"✅ Content length: {len(response.feedback_content)} characters")
        
        return True
        
    except Exception as e:
        print(f"❌ Feedback generation test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Feedback Email System Test Suite")
    print("=" * 50)
    
    tests = [
        test_environment_variables,
        test_database_connection,
        test_email_service,
        test_feedback_generator,
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Test {test.__name__} failed with exception: {e}")
    
    # Run async test
    try:
        if asyncio.run(test_feedback_generation()):
            passed += 1
        total += 1
    except Exception as e:
        print(f"❌ Async test failed with exception: {e}")
        total += 1
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The feedback email system is ready to use.")
        return 0
    else:
        print("⚠️  Some tests failed. Please check the configuration and dependencies.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
