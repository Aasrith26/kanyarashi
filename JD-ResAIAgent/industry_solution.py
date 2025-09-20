#!/usr/bin/env python3
"""
Industry-level solution for resume management
"""
import psycopg2
import uuid
from typing import List, Dict, Optional

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

class ResumeManager:
    """
    Industry-level resume management system
    """
    
    def __init__(self):
        self.conn = get_db_connection()
    
    def create_resume_record(self, clerk_id: str, filename: str, s3_key: str, 
                           original_job_posting_id: Optional[str] = None) -> str:
        """
        Create a single resume record that can be analyzed multiple times
        """
        if not self.conn:
            raise Exception("Database connection failed")
        
        cur = self.conn.cursor()
        try:
            # Get user
            cur.execute("SELECT id FROM users WHERE clerk_id = %s", (clerk_id,))
            user = cur.fetchone()
            if not user:
                raise Exception("User not found")
            
            # Create resume record (stored once, referenced everywhere)
            resume_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO resumes (
                    id, user_id, file_name, s3_resume_key, 
                    job_posting_id, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
            """, (resume_id, user[0], filename, s3_key, original_job_posting_id))
            
            self.conn.commit()
            return resume_id
            
        except Exception as e:
            self.conn.rollback()
            raise e
        finally:
            cur.close()
    
    def create_analysis_session(self, clerk_id: str, session_name: str, 
                              job_posting_id: Optional[str] = None) -> str:
        """
        Create analysis session
        """
        if not self.conn:
            raise Exception("Database connection failed")
        
        cur = self.conn.cursor()
        try:
            # Get user
            cur.execute("SELECT id FROM users WHERE clerk_id = %s", (clerk_id,))
            user = cur.fetchone()
            if not user:
                raise Exception("User not found")
            
            # Create analysis session
            session_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO analysis_sessions (
                    id, user_id, session_name, job_posting_id, 
                    status, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, 'pending', NOW(), NOW())
            """, (session_id, user[0], session_name, job_posting_id))
            
            self.conn.commit()
            return session_id
            
        except Exception as e:
            self.conn.rollback()
            raise e
        finally:
            cur.close()
    
    def add_resume_to_analysis(self, resume_id: str, session_id: str) -> None:
        """
        Add existing resume to analysis session (many-to-many relationship)
        """
        if not self.conn:
            raise Exception("Database connection failed")
        
        cur = self.conn.cursor()
        try:
            # Check if already exists
            cur.execute("""
                SELECT COUNT(*) FROM resume_analyses 
                WHERE resume_id = %s AND analysis_session_id = %s
            """, (resume_id, session_id))
            
            if cur.fetchone()[0] > 0:
                print(f"Resume {resume_id} already in session {session_id}")
                return
            
            # Add to analysis
            cur.execute("""
                INSERT INTO resume_analyses (
                    resume_id, analysis_session_id, created_at
                ) VALUES (%s, %s, NOW())
            """, (resume_id, session_id))
            
            self.conn.commit()
            print(f"✅ Added resume {resume_id} to session {session_id}")
            
        except Exception as e:
            self.conn.rollback()
            raise e
        finally:
            cur.close()
    
    def get_available_resumes(self, clerk_id: str, job_posting_id: Optional[str] = None) -> List[Dict]:
        """
        Get resumes available for analysis (not yet analyzed for this context)
        """
        if not self.conn:
            raise Exception("Database connection failed")
        
        cur = self.conn.cursor()
        try:
            # Get user
            cur.execute("SELECT id FROM users WHERE clerk_id = %s", (clerk_id,))
            user = cur.fetchone()
            if not user:
                return []
            
            if job_posting_id:
                # For specific job: get resumes NOT analyzed for this job
                cur.execute("""
                    SELECT r.id, r.file_name, r.s3_resume_key, r.created_at
                    FROM resumes r
                    WHERE r.user_id = %s 
                    AND r.s3_resume_key IS NOT NULL
                    AND r.id NOT IN (
                        SELECT ra.resume_id 
                        FROM resume_analyses ra
                        JOIN analysis_sessions a ON ra.analysis_session_id = a.id
                        WHERE a.job_posting_id = %s AND a.status = 'completed'
                    )
                    ORDER BY r.created_at DESC
                """, (user[0], job_posting_id))
            else:
                # For general analysis: get resumes NOT analyzed in general analysis
                cur.execute("""
                    SELECT r.id, r.file_name, r.s3_resume_key, r.created_at
                    FROM resumes r
                    WHERE r.user_id = %s 
                    AND r.s3_resume_key IS NOT NULL
                    AND r.id NOT IN (
                        SELECT ra.resume_id 
                        FROM resume_analyses ra
                        JOIN analysis_sessions a ON ra.analysis_session_id = a.id
                        WHERE a.job_posting_id IS NULL AND a.status = 'completed'
                    )
                    ORDER BY r.created_at DESC
                """, (user[0],))
            
            resumes = []
            for row in cur.fetchall():
                resumes.append({
                    "id": row[0],
                    "filename": row[1],
                    "s3_key": row[2],
                    "created_at": row[3].isoformat()
                })
            
            return resumes
            
        except Exception as e:
            print(f"Error getting available resumes: {e}")
            return []
        finally:
            cur.close()
    
    def get_resume_analysis_history(self, resume_id: str) -> List[Dict]:
        """
        Get all analysis sessions for a resume
        """
        if not self.conn:
            raise Exception("Database connection failed")
        
        cur = self.conn.cursor()
        try:
            cur.execute("""
                SELECT a.id, a.session_name, a.job_posting_id, a.status, a.created_at
                FROM analysis_sessions a
                JOIN resume_analyses ra ON a.id = ra.analysis_session_id
                WHERE ra.resume_id = %s
                ORDER BY a.created_at DESC
            """, (resume_id,))
            
            history = []
            for row in cur.fetchall():
                history.append({
                    "session_id": row[0],
                    "session_name": row[1],
                    "job_posting_id": row[2],
                    "status": row[3],
                    "created_at": row[4].isoformat()
                })
            
            return history
            
        except Exception as e:
            print(f"Error getting analysis history: {e}")
            return []
        finally:
            cur.close()

def demonstrate_industry_solution():
    """
    Demonstrate the industry-level solution
    """
    print("🏗️ INDUSTRY-LEVEL RESUME MANAGEMENT DEMO")
    print("=" * 50)
    
    manager = ResumeManager()
    
    # Simulate user and resume
    clerk_id = "user_30P5NhXgbqn7VCnXj2ZbkIVjZpn"
    filename = "demo_resume.pdf"
    s3_key = f"{clerk_id}/resumes/shared/{uuid.uuid4()}_{filename}"
    
    try:
        # Step 1: Create resume record (stored once)
        print("\n1. Creating resume record...")
        resume_id = manager.create_resume_record(clerk_id, filename, s3_key)
        print(f"   ✅ Resume created: {resume_id}")
        
        # Step 2: Create general analysis session
        print("\n2. Creating general analysis session...")
        general_session = manager.create_analysis_session(
            clerk_id, "General Analysis", None
        )
        print(f"   ✅ General session: {general_session}")
        
        # Step 3: Add resume to general analysis
        print("\n3. Adding resume to general analysis...")
        manager.add_resume_to_analysis(resume_id, general_session)
        
        # Step 4: Create job-specific analysis session
        print("\n4. Creating job-specific analysis session...")
        job_session = manager.create_analysis_session(
            clerk_id, "Senior Developer Analysis", "job_123"
        )
        print(f"   ✅ Job session: {job_session}")
        
        # Step 5: Add same resume to job analysis
        print("\n5. Adding same resume to job analysis...")
        manager.add_resume_to_analysis(resume_id, job_session)
        
        # Step 6: Check analysis history
        print("\n6. Resume analysis history:")
        history = manager.get_resume_analysis_history(resume_id)
        for h in history:
            job_type = "General" if h["job_posting_id"] is None else f"Job {h['job_posting_id']}"
            print(f"   - {h['session_name']} ({job_type}) - {h['status']}")
        
        # Step 7: Check available resumes for new analysis
        print("\n7. Available resumes for new job analysis:")
        available = manager.get_available_resumes(clerk_id, "job_456")
        print(f"   Found {len(available)} available resumes")
        for resume in available:
            print(f"   - {resume['filename']} (ID: {resume['id']})")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    demonstrate_industry_solution()
