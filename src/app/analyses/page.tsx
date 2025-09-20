"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft,
  Eye,
  Download,
  Share2,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  RotateCcw
} from "lucide-react";
import axios from "axios";
import NotificationPopup from "@/components/ui/notification-popup";
import { useNotification } from "@/hooks/useNotification";

interface AnalysisSession {
  id: string;
  name: string;
  job_title: string;
  status: 'completed' | 'processing' | 'pending' | 'failed';
  total_resumes: number;
  processed_resumes: number;
  created_at: string;
  completed_at?: string;
  top_candidate_score?: number;
}

export default function AnalysesPage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  const { notification, hideNotification, showSuccess, showError, showInfo, showConfirm } = useNotification();
  const [analyses, setAnalyses] = useState<AnalysisSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisSession | null>(null);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    router.push('/');
    return null;
  }

  useEffect(() => {
    if (isSignedIn && user) {
      fetchAnalyses();
    }
  }, [isSignedIn, user]);

  const fetchAnalyses = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`http://localhost:8000/analysis-sessions/?clerk_id=${user?.id}`);
      setAnalyses(response.data);
    } catch (error) {
      console.error('Error fetching analyses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressPercentage = (session: AnalysisSession) => {
    if (session.total_resumes === 0) return 0;
    return Math.round((session.processed_resumes / session.total_resumes) * 100);
  };

  const handleExportAnalysis = async (sessionId: string) => {
    try {
      // For now, we'll just show an alert. In a real app, this would generate a PDF/CSV
      showInfo('Export Feature', 'Export functionality will be implemented. This would generate a PDF report of the analysis results.');
    } catch (error) {
      console.error('Error exporting analysis:', error);
      showError('Export Failed', 'Failed to export analysis. Please try again.');
    }
  };

  const handleShareAnalysis = async (sessionId: string) => {
    try {
      // For now, we'll just copy a shareable link to clipboard
      const shareUrl = `${window.location.origin}/analyse?sessionId=${sessionId}`;
      await navigator.clipboard.writeText(shareUrl);
      showSuccess('Link Copied', 'Shareable link copied to clipboard!');
    } catch (error) {
      console.error('Error sharing analysis:', error);
      showError('Copy Failed', 'Failed to copy share link. Please try again.');
    }
  };

  const handleDeleteAnalysis = (analysis: AnalysisSession) => {
    setSelectedAnalysis(analysis);
    setShowDeleteModal(true);
  };

  const confirmDeleteAnalysis = async () => {
    if (!selectedAnalysis || !user?.id) return;
    
    try {
      await axios.delete(`http://localhost:8000/analysis-sessions/${selectedAnalysis.id}?clerk_id=${user.id}`);
      setAnalyses(analyses.filter(a => a.id !== selectedAnalysis.id));
      setShowDeleteModal(false);
      setSelectedAnalysis(null);
      showSuccess('Session Deleted', 'Analysis session deleted successfully!');
    } catch (error) {
      console.error("Error deleting analysis:", error);
      showError('Delete Failed', 'Failed to delete analysis session. Please try again.');
    }
  };

  const handleResetAnalysis = async (analysis: AnalysisSession) => {
    if (!user?.id) return;
    
    showConfirm(
      'Reset Analysis',
      `Are you sure you want to reset "${analysis.name}"? This will clear all analysis results and start over.`,
      async () => {
        await performResetAnalysis(analysis);
      }
    );
  };

  const performResetAnalysis = async (analysis: AnalysisSession) => {
    
    try {
      await axios.post(`http://localhost:8000/analysis-sessions/${analysis.id}/reset?clerk_id=${user.id}`);
      fetchAnalyses(); // Refresh the list
      showSuccess('Session Reset', 'Analysis session reset successfully!');
    } catch (error) {
      console.error("Error resetting analysis:", error);
      showError('Reset Failed', 'Failed to reset analysis session. Please try again.');
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
              <h1 className="text-xl font-semibold text-gray-900">Analysis Results</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
          </div>
        ) : analyses.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No analyses found</h3>
            <p className="text-gray-600 mb-6">
              Upload resumes and start your first analysis to see results here.
            </p>
            <Button
              onClick={() => router.push('/upload-resumes')}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              Upload Resumes
            </Button>
          </div>
        ) : (
          <div className="grid gap-6">
            {analyses.map((analysis) => (
              <div key={analysis.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{analysis.name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(analysis.status)}`}>
                        {analysis.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{analysis.job_title}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {analysis.total_resumes} resumes
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(analysis.created_at).toLocaleDateString()}
                      </div>
                      {analysis.top_candidate_score && (
                        <div className="flex items-center">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          Top score: {analysis.top_candidate_score}%
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {analysis.status === 'processing' && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Processing resumes...</span>
                          <span>{analysis.processed_resumes}/{analysis.total_resumes}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gray-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${getProgressPercentage(analysis)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {getStatusIcon(analysis.status)}
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {analysis.status === 'completed' && analysis.completed_at && (
                      <span>Completed {new Date(analysis.completed_at).toLocaleString()}</span>
                    )}
                    {analysis.status === 'processing' && (
                      <span>Processing... {getProgressPercentage(analysis)}% complete</span>
                    )}
                    {analysis.status === 'pending' && (
                      <span>Waiting to start</span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {analysis.status === 'completed' && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => router.push(`/analyse?sessionId=${analysis.id}`)}
                          className="border-gray-300 text-gray-700"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Results
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                          onClick={() => handleExportAnalysis(analysis.id)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Export
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                          onClick={() => handleShareAnalysis(analysis.id)}
                        >
                          <Share2 className="w-4 h-4 mr-1" />
                          Share
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-orange-300 text-orange-700 hover:bg-orange-50"
                          onClick={() => handleResetAnalysis(analysis)}
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Reset
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-red-300 text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteAnalysis(analysis)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </>
                    )}
                    {analysis.status === 'processing' && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => router.push(`/analyse?sessionId=${analysis.id}`)}
                          className="border-gray-300 text-gray-700"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Progress
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-red-300 text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteAnalysis(analysis)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </>
                    )}
                    {analysis.status === 'pending' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled
                        className="border-gray-300 text-gray-500"
                      >
                        <Clock className="w-4 h-4 mr-1" />
                        Pending
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Delete Analysis Session</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>"{selectedAnalysis.name}"</strong>? 
              {selectedAnalysis.status === 'processing' ? (
                <>
                  This will stop the analysis process and permanently remove all progress. 
                  Any resumes currently being processed will be lost.
                </>
              ) : (
                <>
                  This action cannot be undone and will permanently remove all analysis results.
                </>
              )}
            </p>
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedAnalysis(null);
                }}
                className="border-gray-300 text-gray-700"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDeleteAnalysis}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
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
