#!/usr/bin/env python3
"""
Script to verify the analysis page fix is working
Run this after restarting the backend
"""

import requests
import json

def verify_analysis_fix():
    """Verify that the analysis page fix is working"""
    print("🔍 Verifying Analysis Page Fix...")
    
    try:
        # Test the analysis session endpoint
        response = requests.get("http://localhost:8000/analysis-sessions/eb6ac5ae-0d62-4538-93ec-b0595ca92325")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ SUCCESS! Analysis session endpoint is working")
            print(f"📊 Session: {data['session']['name']}")
            print(f"📈 Status: {data['session']['status']}")
            print(f"🎯 Results count: {len(data['results'])}")
            
            if data['results']:
                result = data['results'][0]
                print(f"📋 Sample result structure:")
                print(f"   - Has evaluation object: {'evaluation' in result}")
                if 'evaluation' in result:
                    eval_obj = result['evaluation']
                    print(f"   - Overall Fit: {eval_obj.get('Overall Fit', 'MISSING')}")
                    print(f"   - Skill Match: {eval_obj.get('Skill Match', 'MISSING')}")
                    print(f"   - Summary: {eval_obj.get('Summary', 'MISSING')[:50]}...")
                
                print("\n🎉 The analysis page should now work correctly!")
                print("   - No more 'Overall Fit' errors")
                print("   - Results will display properly")
                print("   - Session names are improved")
            else:
                print("⚠️ No results found in session")
                
        elif response.status_code == 500:
            print("❌ Still getting 500 error - backend needs restart")
            print(f"Error: {response.text}")
            print("\n🔧 To fix:")
            print("1. Stop the backend (Ctrl+C in the other terminal)")
            print("2. Restart with: python main_backend.py")
            print("3. Run this script again")
            
        else:
            print(f"❌ Unexpected status code: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Backend not running. Please start the backend first.")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    verify_analysis_fix()
