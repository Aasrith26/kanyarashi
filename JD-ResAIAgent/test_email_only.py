#!/usr/bin/env python3
"""
Test Email System Only (without database)
Tests the email functionality without requiring database tables
"""

import os
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def test_email_sending():
    """Test sending a real email"""
    print("🧪 Testing Email Sending...")
    
    try:
        from email_service import send_feedback_email_async
        
        # Test email sending
        result = await send_feedback_email_async(
            candidate_name="Test Candidate",
            candidate_email="aasrithreddy399@gmail.com",  # Send to yourself for testing
            feedback_content="""
Dear Test Candidate,

Thank you for your application to Innomatics Research Lab. We have carefully reviewed your resume and would like to provide some constructive feedback.

**Our Feedback:**

Your resume demonstrates strong technical skills and relevant experience. We particularly noted your attention to detail and the comprehensive nature of your project descriptions.

To further strengthen your candidacy for future opportunities, we recommend:

1. **Technical Skills Enhancement**: Consider expanding your knowledge in emerging technologies and industry best practices. Online courses and certifications can be valuable additions.

2. **Project Documentation**: While your projects are well-described, consider adding more quantitative results and impact metrics to demonstrate the value you've delivered.

3. **Industry Engagement**: Stay updated with the latest trends in your field through professional networks, conferences, and industry publications.

4. **Continuous Learning**: The technology landscape evolves rapidly. Consider setting up a learning plan to stay current with new tools and methodologies.

We encourage you to continue developing your skills and exploring opportunities in the technology sector. Your dedication to professional growth is commendable.

Best regards,
Innomatics Research Lab Team
            """.strip(),
            job_title="Software Engineer",
            custom_subject="Test Feedback Email - Innomatics Research Lab"
        )
        
        if result.success:
            print("✅ Email sent successfully!")
            print(f"✅ Message ID: {result.message_id}")
            print("📧 Check your email inbox for the test message")
            return True
        else:
            print(f"❌ Email sending failed: {result.error_message}")
            return False
            
    except Exception as e:
        print(f"❌ Email test failed: {e}")
        return False

async def test_feedback_generation():
    """Test feedback generation"""
    print("\n🤖 Testing Feedback Generation...")
    
    try:
        from feedback_generator import generate_candidate_feedback
        
        # Test feedback generation
        response = await generate_candidate_feedback(
            candidate_name="John Doe",
            resume_content="Experienced software engineer with 5 years of experience in Python and JavaScript. Strong background in web development and database design.",
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
        print("\n📝 Generated Feedback Preview:")
        print("-" * 50)
        print(response.feedback_content[:500] + "..." if len(response.feedback_content) > 500 else response.feedback_content)
        print("-" * 50)
        
        return True
        
    except Exception as e:
        print(f"❌ Feedback generation test failed: {e}")
        return False

def test_environment():
    """Test environment configuration"""
    print("🔍 Testing Environment Configuration...")
    
    required_vars = [
        'EMAIL_PROVIDER',
        'FROM_EMAIL',
        'FROM_NAME',
        'SMTP_USERNAME',
        'SMTP_PASSWORD'
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
        else:
            print(f"✅ {var}: {'*' * 10 if 'PASSWORD' in var else os.getenv(var)}")
    
    if missing_vars:
        print(f"❌ Missing required variables: {', '.join(missing_vars)}")
        return False
    
    print("✅ Environment configuration is correct")
    return True

async def main():
    """Run all tests"""
    print("🚀 Email System Test (Without Database)")
    print("=" * 50)
    
    # Test environment
    env_ok = test_environment()
    if not env_ok:
        print("\n❌ Environment test failed. Please check your .env file.")
        return
    
    # Test feedback generation
    feedback_ok = await test_feedback_generation()
    
    # Test email sending
    email_ok = await test_email_sending()
    
    print("\n" + "=" * 50)
    print("📊 Test Results:")
    print(f"Environment: {'✅ PASS' if env_ok else '❌ FAIL'}")
    print(f"Feedback Generation: {'✅ PASS' if feedback_ok else '❌ FAIL'}")
    print(f"Email Sending: {'✅ PASS' if email_ok else '❌ FAIL'}")
    
    if env_ok and feedback_ok and email_ok:
        print("\n🎉 All tests passed! The email system is ready to use.")
        print("\n📧 You can now:")
        print("1. Start the main backend server")
        print("2. Use the feedback email feature in the frontend")
        print("3. Send feedback emails to candidates")
    else:
        print("\n⚠️  Some tests failed. Please check the configuration.")

if __name__ == "__main__":
    asyncio.run(main())
