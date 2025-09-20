// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://kanyarashi-production.up.railway.app';

export const api = {
  baseURL: API_BASE_URL,
  
  // Analysis endpoints
  analysisSessions: {
    list: (clerkId: string) => `${API_BASE_URL}/analysis-sessions/?clerk_id=${clerkId}`,
    get: (sessionId: string, clerkId: string) => `${API_BASE_URL}/analysis-sessions/${sessionId}?clerk_id=${clerkId}`,
    delete: (sessionId: string, clerkId: string) => `${API_BASE_URL}/analysis-sessions/${sessionId}?clerk_id=${clerkId}`,
    reset: (sessionId: string, clerkId: string) => `${API_BASE_URL}/analysis-sessions/${sessionId}/reset?clerk_id=${clerkId}`,
  },
  
  // Job posting endpoints
  jobPostings: {
    list: (clerkId: string) => `${API_BASE_URL}/job-postings/?clerk_id=${clerkId}`,
    get: (jobId: string, clerkId: string) => `${API_BASE_URL}/job-postings/${jobId}?clerk_id=${clerkId}`,
    create: () => `${API_BASE_URL}/job-postings/`,
    update: (jobId: string, clerkId: string) => `${API_BASE_URL}/job-postings/${jobId}?clerk_id=${clerkId}`,
    delete: (jobId: string, clerkId: string) => `${API_BASE_URL}/job-postings/${jobId}?clerk_id=${clerkId}`,
  },
  
  // Resume endpoints
  resumes: {
    upload: () => `${API_BASE_URL}/resumes/upload`,
    select: () => `${API_BASE_URL}/resumes/select`,
    s3List: (clerkId: string, jobPostingId?: string) => 
      jobPostingId 
        ? `${API_BASE_URL}/resumes/s3/?clerk_id=${clerkId}&job_posting_id=${jobPostingId}`
        : `${API_BASE_URL}/resumes/s3/?clerk_id=${clerkId}`,
    cleanup: (clerkId: string) => `${API_BASE_URL}/resumes/cleanup?clerk_id=${clerkId}`,
  },
  
  // Feedback endpoints
  feedback: {
    generate: (resumeId: string) => `${API_BASE_URL}/feedback/generate/${resumeId}`,
    send: (resumeId: string, clerkId: string) => `${API_BASE_URL}/feedback/send/${resumeId}?clerk_id=${clerkId}`,
    sendBulk: (clerkId: string) => `${API_BASE_URL}/feedback/send-bulk?clerk_id=${clerkId}`,
  },
  
  // Health check
  health: () => `${API_BASE_URL}/health`,
};

export default api;
