-- Migration script to add feedback_emails table
-- Run this script to add the feedback email functionality to your existing database

-- Create feedback_emails table
CREATE TABLE IF NOT EXISTS feedback_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
    analysis_session_id UUID REFERENCES analysis_sessions(id) ON DELETE CASCADE,
    recruiter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    candidate_email VARCHAR(255) NOT NULL,
    candidate_name VARCHAR(255) NOT NULL,
    feedback_content TEXT NOT NULL,
    email_subject VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'sent', -- sent, failed, bounced, delivered, opened
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    email_provider_message_id VARCHAR(500), -- For tracking with email provider
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feedback_emails_resume_id ON feedback_emails(resume_id);
CREATE INDEX IF NOT EXISTS idx_feedback_emails_session_id ON feedback_emails(analysis_session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_emails_recruiter_id ON feedback_emails(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_feedback_emails_candidate_email ON feedback_emails(candidate_email);
CREATE INDEX IF NOT EXISTS idx_feedback_emails_status ON feedback_emails(status);
CREATE INDEX IF NOT EXISTS idx_feedback_emails_sent_at ON feedback_emails(sent_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_feedback_emails_updated_at 
    BEFORE UPDATE ON feedback_emails 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the table was created successfully
SELECT 'feedback_emails table created successfully' as status;
