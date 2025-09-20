#!/usr/bin/env python3
"""
Comprehensive test script for all RecurAI backend routes
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"
TEST_CLERK_ID = "user_test_123"

def test_route(method, endpoint, data=None, params=None, files=None):
    """Test a single route and return the result"""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url, params=params)
        elif method == "POST":
            if files:
                response = requests.post(url, data=data, files=files)
            else:
                response = requests.post(url, json=data, params=params)
        elif method == "PUT":
            response = requests.put(url, json=data, params=params)
        elif method == "DELETE":
            response = requests.delete(url, params=params)
        
        return {
            "status": response.status_code,
            "success": response.status_code < 400,
            "data": response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text,
            "error": None
        }
    except Exception as e:
        return {
            "status": 0,
            "success": False,
            "data": None,
            "error": str(e)
        }

def main():
    print("🧪 Testing All RecurAI Backend Routes")
    print("=" * 50)
    
    # Test 1: Health Check
    print("\n1. Testing Health Check...")
    result = test_route("GET", "/health")
    print(f"   Status: {result['status']} | Success: {result['success']}")
    if result['error']:
        print(f"   Error: {result['error']}")
    
    # Test 2: Root endpoint
    print("\n2. Testing Root Endpoint...")
    result = test_route("GET", "/")
    print(f"   Status: {result['status']} | Success: {result['success']}")
    if result['data']:
        print(f"   Message: {result['data'].get('message', 'N/A')}")
    
    # Test 3: Create User
    print("\n3. Testing User Creation...")
    user_data = {
        "clerk_id": TEST_CLERK_ID,
        "email": "test@recur.ai",
        "first_name": "Test",
        "last_name": "User",
        "company_name": "RecurAI Inc."
    }
    result = test_route("POST", "/users/", data=user_data)
    print(f"   Status: {result['status']} | Success: {result['success']}")
    if result['data']:
        print(f"   Message: {result['data'].get('message', 'N/A')}")
    
    # Test 4: Get User
    print("\n4. Testing Get User...")
    result = test_route("GET", f"/users/{TEST_CLERK_ID}")
    print(f"   Status: {result['status']} | Success: {result['success']}")
    if result['data']:
        print(f"   User: {result['data'].get('first_name', 'N/A')} {result['data'].get('last_name', 'N/A')}")
    
    # Test 5: Create Job Posting
    print("\n5. Testing Job Posting Creation...")
    job_data = {
        "title": "Senior Python Developer",
        "description": "We are looking for a senior Python developer with experience in FastAPI and PostgreSQL.",
        "requirements": "5+ years Python, FastAPI, PostgreSQL, Docker",
        "location": "Remote",
        "salary_range": "$80,000 - $120,000",
        "employment_type": "full-time",
        "experience_level": "senior"
    }
    result = test_route("POST", "/job-postings/", data=job_data, params={"clerk_id": TEST_CLERK_ID})
    print(f"   Status: {result['status']} | Success: {result['success']}")
    if result['data']:
        job_id = result['data'].get('job_id')
        print(f"   Job ID: {job_id}")
    else:
        job_id = None
    
    # Test 6: Get Job Postings
    print("\n6. Testing Get Job Postings...")
    result = test_route("GET", "/job-postings/", params={"clerk_id": TEST_CLERK_ID})
    print(f"   Status: {result['status']} | Success: {result['success']}")
    if result['data']:
        print(f"   Found {len(result['data'])} job postings")
    
    # Test 7: Get Specific Job Posting
    if job_id:
        print("\n7. Testing Get Specific Job Posting...")
        result = test_route("GET", f"/job-postings/{job_id}", params={"clerk_id": TEST_CLERK_ID})
        print(f"   Status: {result['status']} | Success: {result['success']}")
        if result['data']:
            print(f"   Job Title: {result['data'].get('title', 'N/A')}")
    
    # Test 8: Update Job Posting
    if job_id:
        print("\n8. Testing Update Job Posting...")
        update_data = {
            "title": "Senior Python Developer - Updated",
            "description": "Updated description for senior Python developer position.",
            "requirements": "5+ years Python, FastAPI, PostgreSQL, Docker, AWS",
            "location": "Hybrid",
            "salary_range": "$90,000 - $130,000",
            "employment_type": "full-time",
            "experience_level": "senior"
        }
        result = test_route("PUT", f"/job-postings/{job_id}", data=update_data, params={"clerk_id": TEST_CLERK_ID})
        print(f"   Status: {result['status']} | Success: {result['success']}")
        if result['data']:
            print(f"   Message: {result['data'].get('message', 'N/A')}")
    
    # Test 9: Upload Resume (simulate with text file)
    print("\n9. Testing Resume Upload...")
    resume_content = b"This is a test resume content for John Doe, Python Developer with 5 years experience."
    files = {"file": ("test_resume.txt", resume_content, "text/plain")}
    data = {"clerk_id": TEST_CLERK_ID}
    if job_id:
        data["job_posting_id"] = job_id
    
    result = test_route("POST", "/resumes/upload", data=data, files=files)
    print(f"   Status: {result['status']} | Success: {result['success']}")
    if result['data']:
        print(f"   Message: {result['data'].get('message', 'N/A')}")
        resume_id = result['data'].get('resume_id')
    else:
        resume_id = None
    
    # Test 10: Get Resumes
    print("\n10. Testing Get Resumes...")
    result = test_route("GET", "/resumes/", params={"clerk_id": TEST_CLERK_ID})
    print(f"    Status: {result['status']} | Success: {result['success']}")
    if result['data']:
        print(f"    Found {len(result['data'])} resumes")
    
    # Test 11: Get Analysis Sessions
    print("\n11. Testing Get Analysis Sessions...")
    result = test_route("GET", "/analysis-sessions/", params={"clerk_id": TEST_CLERK_ID})
    print(f"    Status: {result['status']} | Success: {result['success']}")
    if result['data']:
        print(f"    Found {len(result['data'])} analysis sessions")
        if result['data']:
            session_id = result['data'][0].get('id')
            print(f"    First Session ID: {session_id}")
    else:
        session_id = None
    
    # Test 12: Get Specific Analysis Session
    if session_id:
        print("\n12. Testing Get Specific Analysis Session...")
        result = test_route("GET", f"/analysis-sessions/{session_id}")
        print(f"    Status: {result['status']} | Success: {result['success']}")
        if result['data']:
            session_data = result['data'].get('session', {})
            print(f"    Session Name: {session_data.get('name', 'N/A')}")
            print(f"    Status: {session_data.get('status', 'N/A')}")
    
    # Test 13: Delete Job Posting
    if job_id:
        print("\n13. Testing Delete Job Posting...")
        result = test_route("DELETE", f"/job-postings/{job_id}", params={"clerk_id": TEST_CLERK_ID})
        print(f"    Status: {result['status']} | Success: {result['success']}")
        if result['data']:
            print(f"    Message: {result['data'].get('message', 'N/A')}")
    
    print("\n" + "=" * 50)
    print("✅ Route testing completed!")
    print("\nIf you see any failures above, those routes need to be fixed.")

if __name__ == "__main__":
    main()
