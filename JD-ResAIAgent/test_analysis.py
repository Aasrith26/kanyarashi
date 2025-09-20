#!/usr/bin/env python3
"""
Test script to verify analysis functionality
"""

import requests
import json
import time

def test_analysis_system():
    base_url = "http://localhost:8000"
    
    print("🧪 Testing RecurAI Analysis System...")
    
    # Wait for backend to start
    print("⏳ Waiting for backend to start...")
    time.sleep(3)
    
    try:
        # Test 1: Get analysis sessions
        print("\n1️⃣ Testing analysis sessions endpoint...")
        response = requests.get(f"{base_url}/analysis-sessions/?clerk_id=user_30P5NhXgbqn7VCnXj2ZbkIVjZpn")
        if response.status_code == 200:
            sessions = response.json()
            print(f"✅ Found {len(sessions)} analysis sessions")
            
            if sessions:
                session_id = sessions[0]['id']
                print(f"📊 Testing session: {session_id}")
                
                # Test 2: Get specific analysis session
                print("\n2️⃣ Testing specific analysis session...")
                response = requests.get(f"{base_url}/analysis-sessions/{session_id}")
                if response.status_code == 200:
                    session_data = response.json()
                    print(f"✅ Session status: {session_data['session']['status']}")
                    print(f"📈 Results count: {len(session_data['results'])}")
                    
                    if session_data['results']:
                        result = session_data['results'][0]
                        print(f"🎯 Sample result:")
                        print(f"   - Overall Score: {result['overall_score']}")
                        print(f"   - Skill Match: {result['skill_match_score']}")
                        print(f"   - Summary: {result['summary'][:100]}...")
                    else:
                        print("⚠️ No results found in session")
                else:
                    print(f"❌ Failed to get session: {response.status_code}")
        else:
            print(f"❌ Failed to get sessions: {response.status_code}")
            
        # Test 3: Test delete functionality
        print("\n3️⃣ Testing delete functionality...")
        if sessions and len(sessions) > 1:
            test_session_id = sessions[1]['id']
            response = requests.delete(f"{base_url}/analysis-sessions/{test_session_id}")
            if response.status_code == 200:
                print("✅ Delete functionality working")
            else:
                print(f"❌ Delete failed: {response.status_code}")
        
        print("\n🎉 Analysis system test completed!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Backend not running. Please start the backend first.")
    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    test_analysis_system()
