-- Industry-level resume management schema migration
-- This solves the S3 path confusion issue

-- Step 1: Create new tables for proper many-to-many relationship
CREATE TABLE IF NOT EXISTS resume_analyses_new (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    analysis_session_id UUID NOT NULL REFERENCES analysis_sessions(id) ON DELETE CASCADE,
    overall_fit_score DECIMAL(5,2),
    skill_match_score DECIMAL(5,2),
    project_relevance_score DECIMAL(5,2),
    problem_solving_score DECIMAL(5,2),
    tools_score DECIMAL(5,2),
    summary TEXT,
    reasoning TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(resume_id, analysis_session_id) -- Prevent duplicate analysis
);

-- Step 2: Migrate existing data
INSERT INTO resume_analyses_new (
    resume_id, analysis_session_id, overall_fit_score, skill_match_score,
    project_relevance_score, problem_solving_score, tools_score, summary, reasoning
)
SELECT 
    resume_id, analysis_session_id, overall_fit_score, skill_match_score,
    project_relevance_score, problem_solving_score, tools_score, summary, reasoning
FROM resume_analyses;

-- Step 3: Drop old table and rename new one
DROP TABLE resume_analyses;
ALTER TABLE resume_analyses_new RENAME TO resume_analyses;

-- Step 4: Create indexes for performance
CREATE INDEX idx_resume_analyses_resume_id ON resume_analyses(resume_id);
CREATE INDEX idx_resume_analyses_session_id ON resume_analyses(analysis_session_id);
CREATE INDEX idx_resume_analyses_composite ON resume_analyses(resume_id, analysis_session_id);

-- Step 5: Update resumes table to remove job_posting_id (resumes are now context-agnostic)
-- Note: We'll keep job_posting_id for now to maintain backward compatibility
-- But in the new system, it represents the "original upload context" not "current analysis context"

-- Step 6: Create a view for easy querying
CREATE OR REPLACE VIEW resume_analysis_summary AS
SELECT 
    r.id as resume_id,
    r.file_name,
    r.s3_resume_key,
    r.user_id,
    COUNT(ra.analysis_session_id) as total_analyses,
    COUNT(CASE WHEN a.job_posting_id IS NULL THEN 1 END) as general_analyses,
    COUNT(CASE WHEN a.job_posting_id IS NOT NULL THEN 1 END) as job_analyses,
    MAX(a.created_at) as last_analyzed_at
FROM resumes r
LEFT JOIN resume_analyses ra ON r.id = ra.resume_id
LEFT JOIN analysis_sessions a ON ra.analysis_session_id = a.id
GROUP BY r.id, r.file_name, r.s3_resume_key, r.user_id;

-- Step 7: Create function to check if resume is available for analysis
CREATE OR REPLACE FUNCTION is_resume_available_for_analysis(
    p_resume_id UUID,
    p_job_posting_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    IF p_job_posting_id IS NULL THEN
        -- Check for general analysis
        RETURN NOT EXISTS (
            SELECT 1 FROM resume_analyses ra
            JOIN analysis_sessions a ON ra.analysis_session_id = a.id
            WHERE ra.resume_id = p_resume_id 
            AND a.job_posting_id IS NULL 
            AND a.status = 'completed'
        );
    ELSE
        -- Check for specific job analysis
        RETURN NOT EXISTS (
            SELECT 1 FROM resume_analyses ra
            JOIN analysis_sessions a ON ra.analysis_session_id = a.id
            WHERE ra.resume_id = p_resume_id 
            AND a.job_posting_id = p_job_posting_id 
            AND a.status = 'completed'
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create function to get available resumes
CREATE OR REPLACE FUNCTION get_available_resumes(
    p_user_id UUID,
    p_job_posting_id UUID DEFAULT NULL
) RETURNS TABLE (
    resume_id UUID,
    file_name VARCHAR,
    s3_resume_key VARCHAR,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT r.id, r.file_name, r.s3_resume_key, r.created_at
    FROM resumes r
    WHERE r.user_id = p_user_id 
    AND r.s3_resume_key IS NOT NULL
    AND is_resume_available_for_analysis(r.id, p_job_posting_id)
    ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_resume_analyses_updated_at
    BEFORE UPDATE ON resume_analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 10: Add comments for documentation
COMMENT ON TABLE resume_analyses IS 'Many-to-many relationship between resumes and analysis sessions. A resume can be analyzed multiple times in different contexts.';
COMMENT ON COLUMN resume_analyses.resume_id IS 'Reference to the resume being analyzed';
COMMENT ON COLUMN resume_analyses.analysis_session_id IS 'Reference to the analysis session';
COMMENT ON FUNCTION is_resume_available_for_analysis IS 'Check if a resume is available for analysis in a specific context';
COMMENT ON FUNCTION get_available_resumes IS 'Get all resumes available for analysis for a user in a specific context';

-- Step 11: Create a cleanup function for orphaned analyses
CREATE OR REPLACE FUNCTION cleanup_orphaned_analyses()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM resume_analyses 
    WHERE analysis_session_id NOT IN (
        SELECT id FROM analysis_sessions
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_orphaned_analyses IS 'Remove analysis records for deleted sessions';

-- Step 12: Grant permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON resume_analyses TO your_app_user;
-- GRANT USAGE ON SCHEMA public TO your_app_user;
