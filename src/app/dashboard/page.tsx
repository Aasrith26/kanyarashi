"use client"
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { 
  FileText, 
  Plus, 
  Users, 
  Clock,
  CheckCircle,
  AlertCircle,
  Upload,
  X,
  Save
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import api from "@/lib/api";

interface JobPosting {
  id: string;
  title: string;
  description: string;
  location: string;
  status: string;
  created_at: string;
}

interface AnalysisSession {
  id: string;
  name: string;
  status: string;
  total_resumes: number;
  processed_resumes: number;
  created_at: string;
  completed_at?: string;
  job_title: string;
}

interface JDUploadModal {
  isOpen: boolean;
  title: string;
  description: string;
  requirements: string;
  location: string;
  salary_range: string;
  employment_type: string;
  experience_level: string;
  jdFile: File | null;
}

export default function Dashboard() {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [analysisSessions, setAnalysisSessions] = useState<AnalysisSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jdModal, setJdModal] = useState<JDUploadModal>({
    isOpen: false,
    title: "",
    description: "",
    requirements: "",
    location: "",
    salary_range: "",
    employment_type: "",
    experience_level: "",
    jdFile: null
  });
  const [isCreatingJob, setIsCreatingJob] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/');
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (isSignedIn && user) {
      fetchDashboardData();
    }
  }, [isSignedIn, user]);

  const testApiConnectivity = async () => {
    try {
      console.log('Testing API connectivity...');
      const healthResponse = await axios.get(api.health());
      console.log('Health check response:', healthResponse.data);
      return true;
    } catch (error: any) {
      console.error('API connectivity test failed:', error);
      return false;
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const clerkId = user?.id;
      if (!clerkId) {
        console.log('No clerk ID available');
        return;
      }

      // Test API connectivity first
      const isApiConnected = await testApiConnectivity();
      if (!isApiConnected) {
        setError('Cannot connect to backend API. Please check your connection.');
        return;
      }

      console.log('Fetching dashboard data for clerk ID:', clerkId);
      console.log('API Base URL:', api.baseURL);

      // Fetch job postings
      const jobsUrl = api.jobPostings.list(clerkId);
      console.log('Jobs URL:', jobsUrl);
      const jobsResponse = await axios.get(jobsUrl);
      console.log('Jobs response:', jobsResponse.data);
      setJobPostings(jobsResponse.data);

      // Fetch analysis sessions
      const analysesUrl = api.analysisSessions.list(clerkId);
      console.log('Analyses URL:', analysesUrl);
      const analysesResponse = await axios.get(analysesUrl);
      console.log('Analyses response:', analysesResponse.data);
      setAnalysisSessions(analysesResponse.data);

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      setError(`Failed to load dashboard data: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleJDFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setJdModal(prev => ({ ...prev, jdFile: file }));
    }
  };

  const handleCreateJob = async () => {
    if (!user?.id) return;
    
    try {
      setIsCreatingJob(true);
      
      const formData = new FormData();
      formData.append('clerk_id', user.id);
      
      // Add job data fields
      if (jdModal.title) formData.append('title', jdModal.title);
      if (jdModal.description) formData.append('description', jdModal.description);
      if (jdModal.requirements) formData.append('requirements', jdModal.requirements);
      if (jdModal.salary_range) formData.append('salary_range', jdModal.salary_range);
      if (jdModal.employment_type) formData.append('employment_type', jdModal.employment_type);
      if (jdModal.experience_level) formData.append('experience_level', jdModal.experience_level);
      
      // Add file if uploaded
      if (jdModal.jdFile) {
        formData.append('file', jdModal.jdFile);
      }

      const response = await axios.post(api.jobPostings.create(), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log("Job posting created:", response.data);
      
      // Refresh data
      await fetchDashboardData();
      
      // Reset modal
      setJdModal({
        isOpen: false,
        title: "",
        description: "",
        requirements: "",
        location: "",
        salary_range: "",
        employment_type: "",
        experience_level: "",
        jdFile: null
      });
      
    } catch (error) {
      console.error('Error creating job:', error);
      setError('Failed to create job posting');
    } finally {
      setIsCreatingJob(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                RecurAI
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <UserButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.firstName || 'User'}!
          </h1>
          <p className="text-gray-600">
            Manage your job postings and analyze candidate resumes with AI-powered insights.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{jobPostings.length}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Analyses</p>
                <p className="text-2xl font-bold text-gray-900">{analysisSessions.length}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analysisSessions.filter(s => s.status === 'completed').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analysisSessions.filter(s => s.status === 'processing').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={() => setJdModal(prev => ({ ...prev, isOpen: true }))}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Job Posting
            </Button>
            <div className="relative group">
              <Link href="/upload-resumes">
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                  <Upload className="w-4 h-4 mr-2" />
                  Manage Resumes
                </Button>
              </Link>
              {/* Info tooltip */}
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                Upload new resumes or select from existing ones for analysis. Choose between general analysis or job-specific evaluation.
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
            <Link href="/analyses">
              <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                <FileText className="w-4 h-4 mr-2" />
                View Analyses
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Job Postings */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Job Postings</h2>
              <Link href="/jobs">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  View All
                </Button>
              </Link>
            </div>
            
            <div className="space-y-4">
              {jobPostings.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No job postings yet</p>
                  <Button 
                    onClick={() => setJdModal(prev => ({ ...prev, isOpen: true }))}
                    className="bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    Create Your First Job
                  </Button>
                </div>
              ) : (
                jobPostings.slice(0, 3).map((job) => (
                  <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{job.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{job.location}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {new Date(job.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          job.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Analysis Sessions */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Analyses</h2>
              <Link href="/analyses">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  View All
                </Button>
              </Link>
            </div>
            
            <div className="space-y-4">
              {analysisSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No analyses yet</p>
                  <div className="relative group">
                    <Link href="/upload-resumes">
                      <Button className="bg-gray-900 hover:bg-gray-800 text-white">
                        Manage Resumes to Start
                      </Button>
                    </Link>
                    {/* Info tooltip */}
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Upload new resumes or select from existing ones for analysis. Choose between general analysis or job-specific evaluation.
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
              ) : (
                analysisSessions.slice(0, 3).map((session) => (
                  <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{session.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{session.job_title}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                          <span className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {session.processed_resumes}/{session.total_resumes} processed
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {new Date(session.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {session.status === 'processing' && (
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gray-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(session.processed_resumes / session.total_resumes) * 100}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {session.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : session.status === 'processing' ? (
                          <Clock className="w-5 h-5 text-gray-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-yellow-600" />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* JD Upload Modal */}
      {jdModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Create Job Posting</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setJdModal(prev => ({ ...prev, isOpen: false }))}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* JD File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Job Description (PDF) - Optional
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleJDFileUpload}
                    className="hidden"
                    id="jd-upload"
                  />
                  <label htmlFor="jd-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {jdModal.jdFile ? jdModal.jdFile.name : 'Click to upload JD PDF'}
                    </p>
                  </label>
                </div>
              </div>

              {/* Job Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={jdModal.title}
                  onChange={(e) => setJdModal(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="e.g., Senior Frontend Developer"
                  required
                />
              </div>

              {/* Job Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description *
                </label>
                <textarea
                  value={jdModal.description}
                  onChange={(e) => setJdModal(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="Describe the role, responsibilities, and what makes this opportunity unique..."
                  required
                />
              </div>

              {/* Requirements */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requirements
                </label>
                <textarea
                  value={jdModal.requirements}
                  onChange={(e) => setJdModal(prev => ({ ...prev, requirements: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="List the required skills, qualifications, and experience..."
                />
              </div>

              {/* Location and Salary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={jdModal.location}
                    onChange={(e) => setJdModal(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="e.g., Remote, New York, NY"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salary Range
                  </label>
                  <input
                    type="text"
                    value={jdModal.salary_range}
                    onChange={(e) => setJdModal(prev => ({ ...prev, salary_range: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="e.g., $80,000 - $120,000"
                  />
                </div>
              </div>

              {/* Employment Type and Experience Level */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employment Type
                  </label>
                  <select
                    value={jdModal.employment_type}
                    onChange={(e) => setJdModal(prev => ({ ...prev, employment_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  >
                    <option value="">Select type</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience Level
                  </label>
                  <select
                    value={jdModal.experience_level}
                    onChange={(e) => setJdModal(prev => ({ ...prev, experience_level: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  >
                    <option value="">Select level</option>
                    <option value="entry">Entry Level</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior Level</option>
                    <option value="lead">Lead/Principal</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => setJdModal(prev => ({ ...prev, isOpen: false }))}
                  className="border-gray-300 text-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateJob}
                  disabled={isCreatingJob || !jdModal.title || !jdModal.description}
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  {isCreatingJob ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Create Job Posting
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

