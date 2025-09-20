"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Search, 
  Filter,
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  Calendar,
  MapPin,
  DollarSign,
  X
} from "lucide-react";
import axios from "axios";
import NotificationPopup from "@/components/ui/notification-popup";
import { useNotification } from "@/hooks/useNotification";

interface JobPosting {
  id: string;
  title: string;
  description: string;
  requirements?: string;
  location: string;
  salary_range?: string;
  employment_type?: string;
  experience_level?: string;
  status: string;
  created_at: string;
}

export default function JobsPage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  const { notification, hideNotification, showSuccess, showError } = useNotification();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  useEffect(() => {
    if (isSignedIn && user) {
      fetchJobs();
    }
  }, [isSignedIn, user]);

  if (!isSignedIn) {
    router.push('/');
    return null;
  }

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`http://localhost:8000/job-postings/?clerk_id=${user?.id}`);
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewJob = async (jobId: string) => {
    try {
      const response = await axios.get(`http://localhost:8000/job-postings/${jobId}?clerk_id=${user?.id}`);
      setSelectedJob(response.data);
      setIsViewModalOpen(true);
    } catch (error) {
      console.error('Error fetching job details:', error);
    }
  };

  const handleEditJob = async (jobId: string) => {
    try {
      const response = await axios.get(`http://localhost:8000/job-postings/${jobId}?clerk_id=${user?.id}`);
      setSelectedJob(response.data);
      setIsEditModalOpen(true);
    } catch (error) {
      console.error('Error fetching job details:', error);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (confirm('Are you sure you want to delete this job posting?')) {
      try {
        await axios.delete(`http://localhost:8000/job-postings/${jobId}?clerk_id=${user?.id}`);
        await fetchJobs(); // Refresh the list
      } catch (error) {
        console.error('Error deleting job:', error);
        showError('Delete Failed', 'Failed to delete job posting. Please try again.');
      }
    }
  };

  const handleUpdateJob = async (jobData: { id: number; title: string; description: string; location?: string }) => {
    if (!selectedJob) return;
    
    try {
      await axios.put(`http://localhost:8000/job-postings/${selectedJob.id}?clerk_id=${user?.id}`, jobData);
      setIsEditModalOpen(false);
      setSelectedJob(null);
      await fetchJobs(); // Refresh the list
    } catch (error) {
      console.error('Error updating job:', error);
      showError('Update Failed', 'Failed to update job posting. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="w-px h-6 bg-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">Job Postings</h1>
            </div>
            <Button
              onClick={() => router.push('/create-job')}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Job
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>
            </div>
            <Button variant="outline" className="border-gray-300 text-gray-700">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {/* Jobs List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No job postings found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Try adjusting your search terms.' : 'Create your first job posting to get started.'}
            </p>
            <Button
              onClick={() => router.push('/create-job')}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Job Posting
            </Button>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{job.description}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {job.location}
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        {job.salary_range}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {job.employment_type}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      job.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                </div>
                
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Created {new Date(job.created_at).toLocaleDateString()}
                    </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      onClick={() => handleViewJob(job.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      onClick={() => handleEditJob(job.id)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-red-300 text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteJob(job.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* View Job Modal */}
      {isViewModalOpen && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Job Details</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedJob.title}</h3>
                <p className="text-gray-600">{selectedJob.location}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-700">{selectedJob.description}</p>
              </div>

              {selectedJob.requirements && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Requirements</h4>
                  <p className="text-gray-700">{selectedJob.requirements}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedJob.salary_range && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Salary Range</h4>
                    <p className="text-gray-700">{selectedJob.salary_range}</p>
                  </div>
                )}
                {selectedJob.employment_type && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Employment Type</h4>
                    <p className="text-gray-700">{selectedJob.employment_type}</p>
                  </div>
                )}
                {selectedJob.experience_level && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Experience Level</h4>
                    <p className="text-gray-700">{selectedJob.experience_level}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Status</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedJob.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedJob.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Job Modal */}
      {isEditModalOpen && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Edit Job Posting</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const jobData = {
                title: formData.get('title'),
                description: formData.get('description'),
                requirements: formData.get('requirements'),
                location: formData.get('location'),
                salary_range: formData.get('salary_range'),
                employment_type: formData.get('employment_type'),
                experience_level: formData.get('experience_level')
              };
              handleUpdateJob(jobData);
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
                <input
                  type="text"
                  name="title"
                  defaultValue={selectedJob.title}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  name="description"
                  defaultValue={selectedJob.description}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Requirements</label>
                <textarea
                  name="requirements"
                  defaultValue={selectedJob.requirements || ''}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    name="location"
                    defaultValue={selectedJob.location || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range</label>
                  <input
                    type="text"
                    name="salary_range"
                    defaultValue={selectedJob.salary_range || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
                  <select
                    name="employment_type"
                    defaultValue={selectedJob.employment_type || ''}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                  <select
                    name="experience_level"
                    defaultValue={selectedJob.experience_level || ''}
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

              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  className="border-gray-300 text-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  Update Job Posting
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
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
