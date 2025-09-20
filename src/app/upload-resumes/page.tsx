"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft,
  Upload,
  FileText,
  Search,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  X,
  Users,
  Briefcase
} from "lucide-react";
import axios from "axios";
import NotificationPopup from "@/components/ui/notification-popup";
import { useNotification } from "@/hooks/useNotification";

interface JobPosting {
  id: string;
  title: string;
  location?: string;
  description?: string;
  requirements?: string;
  salary_range?: string;
  employment_type?: string;
  experience_level?: string;
  created_at: string;
}

interface S3Resume {
  s3_key: string;
  filename: string;
  size: number;
  last_modified: string;
  is_analyzed: boolean;
  analysis_status: string;
}

interface SelectedResume {
  filename: string;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export default function UploadResumesPage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  const { notification, hideNotification, showSuccess, showError, showWarning } = useNotification();
  
  // State management
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [s3Resumes, setS3Resumes] = useState<S3Resume[]>([]);
  const [selectedResumes, setSelectedResumes] = useState<SelectedResume[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isLoadingResumes, setIsLoadingResumes] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [isStartingProcess, setIsStartingProcess] = useState(false);

  // Fetch S3 resumes
  const fetchS3Resumes = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setIsLoadingResumes(true);
      const url = selectedJobId 
        ? `http://localhost:8000/resumes/s3/?clerk_id=${user.id}&job_posting_id=${selectedJobId}`
        : `http://localhost:8000/resumes/s3/?clerk_id=${user.id}`;
      
      const response = await axios.get(url);
      console.log('S3 resumes response:', response.data);
      setS3Resumes(response.data);
    } catch (error) {
      console.error('Error fetching S3 resumes:', error);
    } finally {
      setIsLoadingResumes(false);
    }
  }, [user?.id, selectedJobId]);

  // Fetch job postings
  useEffect(() => {
    const fetchJobPostings = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoadingJobs(true);
        const response = await axios.get(`http://localhost:8000/job-postings/?clerk_id=${user.id}`);
        setJobPostings(response.data);
      } catch (error) {
        console.error('Error fetching job postings:', error);
      } finally {
        setIsLoadingJobs(false);
      }
    };

    if (isLoaded && isSignedIn) {
      fetchJobPostings();
    }
  }, [user?.id, isLoaded, isSignedIn]);

  // Fetch S3 resumes when job selection changes
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchS3Resumes();
    }
  }, [fetchS3Resumes, isLoaded, isSignedIn]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    router.push("/");
    return null;
  }

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!user?.id) return;
    
    setIsProcessing(true);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('clerk_id', user.id);
    if (selectedJobId) {
      formData.append('job_posting_id', selectedJobId);
    }

    const newResume: SelectedResume = {
      filename: file.name,
      status: 'uploading'
    };

    setSelectedResumes(prev => [...prev, newResume]);

    try {
      const response = await axios.post('http://localhost:8000/resumes/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSelectedResumes(prev => 
        prev.map(r => 
          r.filename === file.name 
            ? { ...r, status: 'success' as const }
            : r
        )
      );

      // Refresh S3 resumes after successful upload
      await fetchS3Resumes();
    } catch (error) {
      console.error('Error uploading file:', error);
      setSelectedResumes(prev => 
        prev.map(r => 
          r.filename === file.name 
            ? { ...r, status: 'error' as const, error: 'Upload failed' }
            : r
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle resume selection from S3
  const handleSelectResume = async (resume: S3Resume) => {
    if (!user?.id) return;
    
    // Check if resume is already analyzed
    if (resume.is_analyzed) {
      showWarning('Already Analyzed', `This resume has already been analyzed for the selected job posting.`);
      return;
    }
    
    // Check if resume is already selected
    if (selectedResumes.some(sr => sr.filename === resume.filename)) {
      return; // Don't allow duplicate selections
    }
    
    setIsProcessing(true);
    
    const newResume: SelectedResume = {
      filename: resume.filename,
      status: 'uploading'
    };

    setSelectedResumes(prev => [...prev, newResume]);

    try {
      const response = await axios.post('http://localhost:8000/resumes/select', {
        clerk_id: user.id,
        s3_key: resume.s3_key,
        job_posting_id: selectedJobId || null
      });

      setSelectedResumes(prev => 
        prev.map(r => 
          r.filename === resume.filename 
            ? { ...r, status: 'success' as const }
            : r
        )
      );

      // Refresh S3 resumes after successful selection
      await fetchS3Resumes();
    } catch (error) {
      console.error('Error selecting resume:', error);
      setSelectedResumes(prev => 
        prev.map(r => 
          r.filename === resume.filename 
            ? { ...r, status: 'error' as const, error: 'Selection failed' }
            : r
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle select all resumes
  const handleSelectAll = () => {
    const availableResumes = filteredResumes.filter(resume => !resume.is_analyzed);
    availableResumes.forEach(resume => {
      if (!selectedResumes.some(sr => sr.filename === resume.filename)) {
        handleSelectResume(resume);
      }
    });
  };

  // Handle cleanup
  const handleCleanup = async () => {
    if (!user?.id) return;
    
    setIsCleaningUp(true);
    try {
      await axios.post(`http://localhost:8000/resumes/cleanup?clerk_id=${user.id}`);
      await fetchS3Resumes();
      showSuccess('Cleanup Complete', 'Database cleanup completed successfully!');
    } catch (error) {
      console.error('Error during cleanup:', error);
      showError('Cleanup Failed', 'Failed to cleanup database. Please try again.');
    } finally {
      setIsCleaningUp(false);
    }
  };

  // Handle start process
  const handleStartProcess = async () => {
    if (!user?.id || selectedResumes.length === 0) return;
    
    setIsStartingProcess(true);
    try {
      // Get only successfully selected resumes
      const successfulResumes = selectedResumes.filter(r => r.status === 'success');
      
      if (successfulResumes.length === 0) {
        showWarning('No Resumes Selected', 'Please select at least one resume to start the analysis process.');
        return;
      }

      // The resumes are already selected and ready for analysis
      // The analysis will be triggered automatically by the backend
      // when the resumes are selected for a specific job posting
      console.log(`Starting analysis for ${successfulResumes.length} resume(s) with job posting: ${selectedJobId || 'General Analysis'}`);
      
      showSuccess('Analysis Started', `Analysis process started for ${successfulResumes.length} resume(s)!`);
      
      // Clear selected resumes after starting process
      setSelectedResumes([]);
      
      // Redirect to analyses page to see the progress
      router.push('/analyses');
      
    } catch (error) {
      console.error('Error starting process:', error);
      showError('Process Failed', 'Failed to start analysis process. Please try again.');
    } finally {
      setIsStartingProcess(false);
    }
  };

  // Utility functions
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredResumes = s3Resumes.filter(resume =>
    resume.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Resume Management</h1>
                <p className="text-sm text-gray-500">Upload new resumes or select from existing ones</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Job Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center">
              <Briefcase className="h-4 w-4 text-gray-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Select Job Posting</h2>
          </div>
          
          {isLoadingJobs ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
              <span className="ml-2 text-gray-600">Loading jobs...</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <Button
                variant={selectedJobId === "" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedJobId("")}
                className={`px-4 py-2 ${selectedJobId === "" ? "bg-gray-700 text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
              >
                <Users className="h-4 w-4 mr-2" />
                General Analysis
              </Button>
              
              {jobPostings.map((job) => (
                <Button
                  key={job.id}
                  variant={selectedJobId === job.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedJobId(job.id)}
                  className={`px-4 py-2 ${selectedJobId === job.id ? "bg-gray-700 text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  {job.title}
                  {job.location && <span className="ml-1 text-xs opacity-75">({job.location})</span>}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Full Width Layout */}
        <div className="space-y-6">
          {/* Top Row - Upload and Selected Resumes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload New Resumes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center">
                  <Upload className="h-4 w-4 text-gray-500" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Upload New Resumes</h2>
              </div>
              
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                  dragActive ? 'border-gray-500 bg-gray-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  const files = Array.from(e.dataTransfer.files);
                  files.forEach(handleFileUpload);
                }}
              >
                <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">Drop files here or click to upload</p>
                <p className="text-sm text-gray-500 mb-6">Support for PDF, DOC, DOCX files</p>
                <Button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;
                    input.accept = '.pdf,.doc,.docx';
                    input.onchange = (e) => {
                      const files = Array.from((e.target as HTMLInputElement).files || []);
                      files.forEach(handleFileUpload);
                    };
                    input.click();
                  }}
                  className="bg-gray-700 text-white px-6 py-2"
                >
                  Choose Files
                </Button>
              </div>
            </div>


            {/* Selected Resumes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-gray-500" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Selected Resumes</h2>
                {selectedResumes.length > 0 && (
                  <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {selectedResumes.length}
                  </span>
                )}
              </div>
              
              {selectedResumes.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No resumes selected yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedResumes.map((resume, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        {resume.status === 'success' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : resume.status === 'error' ? (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        ) : (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
                        )}
                        <div>
                          <h3 className="font-medium text-gray-900">{resume.filename}</h3>
                          {resume.error && (
                            <p className="text-sm text-red-500">{resume.error}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedResumes(prev => prev.filter((_, i) => i !== index));
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Start Process Button */}
              {selectedResumes.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <Button
                    onClick={handleStartProcess}
                    disabled={isStartingProcess || selectedResumes.every(r => r.status !== 'success')}
                    className="w-full bg-gray-700 text-white py-3 text-lg font-medium"
                  >
                    {isStartingProcess ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Starting Process...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Start Analysis Process
                      </>
                    )}
                  </Button>
                  <p className="text-sm text-gray-500 text-center mt-2">
                    {selectedResumes.filter(r => r.status === 'success').length} resume(s) ready for analysis
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Available Resumes - Full Width */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center">
                  <FileText className="h-4 w-4 text-gray-500" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Available Resumes</h2>
                {filteredResumes.length > 0 && (
                  <div className="flex items-center space-x-6 text-sm">
                    <span className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600 font-medium">{filteredResumes.filter(r => !r.is_analyzed).length} available</span>
                    </span>
                    <span className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-gray-500">{filteredResumes.filter(r => r.is_analyzed).length} analyzed</span>
                    </span>
                  </div>
                )}
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={isProcessing || filteredResumes.filter(r => !r.is_analyzed).length === 0}
                  className="text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Select All ({filteredResumes.filter(r => !r.is_analyzed).length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCleanup}
                  disabled={isCleaningUp}
                  className="text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`h-4 w-4 mr-1.5 ${isCleaningUp ? 'animate-spin' : ''}`} />
                  Cleanup
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchS3Resumes}
                  disabled={isLoadingResumes}
                  className="text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoadingResumes ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search resumes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
              />
            </div>

            {isLoadingResumes ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                <span className="ml-3 text-gray-600 font-medium">Loading resumes...</span>
              </div>
            ) : filteredResumes.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No resumes available</h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  {searchTerm ? 'No resumes match your search criteria.' : 'Upload some resumes first to see them here.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {filteredResumes.map((resume, index) => (
                  <div
                    key={`${resume.s3_key}-${index}`}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200 bg-white"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <FileText className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-gray-900 truncate">{resume.filename}</h3>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(resume.size)} • {formatDate(resume.last_modified)}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {resume.is_analyzed ? (
                        <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-700 font-medium">Already Analyzed</span>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleSelectResume(resume)}
                          disabled={isProcessing || selectedResumes.some(sr => sr.filename === resume.filename)}
                          className={`transition-colors ${
                            selectedResumes.some(sr => sr.filename === resume.filename) 
                              ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                              : 'bg-gray-700 text-white hover:bg-gray-800'
                          }`}
                        >
                          {selectedResumes.some(sr => sr.filename === resume.filename) ? 'Selected' : 'Select'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* How It Works - Full Width */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h2>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-gray-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Upload new resumes or select from existing ones
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-gray-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Selected resumes will be analyzed individually
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-gray-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Each resume gets its own analysis session
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-gray-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Results are sorted by overall fit score
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-gray-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Already analyzed resumes are filtered out
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Notification Popup */}
      <NotificationPopup
        isOpen={notification.isOpen}
        onClose={hideNotification}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        duration={notification.duration}
        showCloseButton={notification.showCloseButton}
        onConfirm={notification.onConfirm}
        onCancel={notification.onCancel}
        confirmText={notification.confirmText}
        cancelText={notification.cancelText}
      />
    </div>
  );
}