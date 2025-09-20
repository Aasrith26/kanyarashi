"use client";
import React, { useState, Suspense, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { 
  Sparkles, 
  FileText, 
  Users, 
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowLeft,
  Download,
  Share2,
  Mail,
  MessageSquare
} from "lucide-react";
import axios from "axios";
import api from "@/lib/api";
import { useSearchParams } from 'next/navigation';
import FeedbackModal from "@/components/FeedbackModal";
import BulkFeedbackModal from "@/components/BulkFeedbackModal";

interface Evaluation {
  "Overall Fit": number;
  "Skill Match": number;
  "Project Relevance": number;
  "Problem Solving": number;
  "Tools": number;
  Summary: string;
}

interface Candidate {
  name: string;
  email: string;
  phone: string;
  resume_id: string;
  evaluation: Evaluation;
}

interface AnalysisSession {
  id: string;
  name: string;
  status: string;
  total_resumes: number;
  processed_resumes: number;
  created_at: string;
  completed_at?: string;
}

const ScoreBar = ({ score, label }: { score: number; label: string }) => {
  const getColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-bold text-slate-900">{score}/100</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2">
        <div 
          className={`${getColor(score)} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${score}%` }}
        ></div>
      </div>
    </div>
  );
};

const CandidateCard = ({ 
  candidate, 
  onSendFeedback 
}: { 
  candidate: Candidate; 
  onSendFeedback: (candidate: Candidate) => void;
}) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center space-x-4">
        <div className="min-w-[200px]">
          <div className="text-xl font-bold text-slate-900">{candidate.name}</div>
          <div className="text-sm text-slate-600">{candidate.email}</div>
        </div>
        <div className="flex-1">
          {candidate.phone && (
            <p className="text-sm text-slate-600">Phone: {candidate.phone}</p>
          )}
        </div>
      </div>
      <div className="text-center">
        <p className="text-slate-600 text-sm">Overall Fit</p>
        <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          {candidate.evaluation["Overall Fit"]}
        </p>
      </div>
    </div>
    
    <div className="border-t border-slate-200 pt-4">
      <p className="text-slate-700 mb-6 leading-relaxed">{candidate.evaluation.Summary}</p>
      
      <div className="grid grid-cols-2 gap-4">
        <ScoreBar score={candidate.evaluation["Skill Match"]} label="Skill Match" />
        <ScoreBar score={candidate.evaluation["Project Relevance"]} label="Project Relevance" />
        <ScoreBar score={candidate.evaluation["Problem Solving"]} label="Problem Solving" />
        <ScoreBar score={candidate.evaluation["Tools"]} label="Tools & Tech" />
      </div>
      
      <div className="flex justify-between items-center mt-6">
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-slate-600 border-slate-300"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-slate-600 border-slate-300"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
        
        <Button 
          onClick={() => onSendFeedback(candidate)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
        >
          <Mail className="w-4 h-4 mr-2" />
          Send Feedback
        </Button>
      </div>
    </div>
  </div>
);

const ResultsDisplay = ({ 
  results, 
  isLoading, 
  session, 
  onSendFeedback, 
  onSendBulkFeedback 
}: { 
  results: Candidate[]; 
  isLoading: boolean; 
  session?: AnalysisSession;
  onSendFeedback: (candidate: Candidate) => void;
  onSendBulkFeedback: (candidates: Candidate[]) => void;
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Analyzing Resumes</h3>
          <p className="text-slate-600">Our AI is processing and evaluating candidates...</p>
          {session && (
            <div className="mt-4 w-full max-w-md mx-auto">
              <div className="flex justify-between text-sm text-slate-600 mb-2">
                <span>Progress</span>
                <span>{session.processed_resumes}/{session.total_resumes}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(session.processed_resumes / session.total_resumes) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Results Yet</h3>
          <p className="text-slate-600">Upload resumes and start analysis to see candidate rankings here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Analysis Results</h2>
          <p className="text-sm text-slate-600 mt-1">
            Showing {results.length} candidates
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-slate-600 border-slate-300"
          >
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-slate-600 border-slate-300"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Results
          </Button>
          <Button 
            onClick={() => onSendBulkFeedback(results)}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Send Bulk Feedback
          </Button>
        </div>
      </div>
      
      {results.map((candidate) => (
        <CandidateCard 
          key={candidate.resume_id} 
          candidate={candidate} 
          onSendFeedback={onSendFeedback}
        />
      ))}
    </div>
  );
};

function AnalysePageContent() {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  
  const [analysisResults, setAnalysisResults] = useState<Candidate[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [session, setSession] = useState<AnalysisSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Feedback modal states
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showBulkFeedbackModal, setShowBulkFeedbackModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [selectedCandidates, setSelectedCandidates] = useState<Candidate[]>([]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/');
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (sessionId && isSignedIn && user?.id) {
      fetchAnalysisResults();
    }
  }, [sessionId, isSignedIn, user?.id]);

  const fetchAnalysisResults = async () => {
    if (!sessionId || !user?.id) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const response = await axios.get(api.analysisSessions.get(sessionId, user.id));
      const data = response.data;
      
      setSession(data.session);
      
      // Map backend response to frontend interface
      const mappedResults = data.results.map((result: {
        candidate_name: string;
        candidate_email: string;
        candidate_phone: string;
        resume_id: string;
        overall_fit_score: number;
        skill_match_score: number;
        project_relevance_score: number;
        problem_solving_score: number;
        tools_score: number;
        summary: string;
      }) => ({
        name: result.candidate_name,
        email: result.candidate_email,
        phone: result.candidate_phone,
        resume_id: result.resume_id,
        evaluation: {
          "Overall Fit": result.overall_fit_score,
          "Skill Match": result.skill_match_score,
          "Project Relevance": result.project_relevance_score,
          "Problem Solving": result.problem_solving_score,
          "Tools": result.tools_score,
          "Summary": result.summary
        }
      }));
      
      // Show all results without filtering duplicates
      setAnalysisResults(mappedResults);
      setIsAnalyzing(data.session.status === 'processing');
    } catch (error) {
      console.error('Error fetching analysis results:', error);
      setError('Failed to load analysis results. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendFeedback = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowFeedbackModal(true);
  };

  const handleSendBulkFeedback = (candidates: Candidate[]) => {
    setSelectedCandidates(candidates);
    setShowBulkFeedbackModal(true);
  };

  const handleFeedbackSuccess = () => {
    // Optionally refresh data or show success message
    console.log('Feedback sent successfully');
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="w-px h-6 bg-slate-300"></div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  RecurAI
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Resume Analysis</h1>
          <p className="text-slate-600">
            AI-powered candidate evaluation and ranking results
          </p>
        </div>

        {/* Session Info */}
        {session && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200/50 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">{session.name}</h2>
                <div className="flex items-center space-x-6 text-sm text-slate-600">
                  <span className="flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    {session.total_resumes} total resumes
                  </span>
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Started {new Date(session.created_at).toLocaleString()}
                  </span>
                  {session.completed_at && (
                    <span className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Completed {new Date(session.completed_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {session.status === 'completed' ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span className="font-medium">Completed</span>
                  </div>
                ) : session.status === 'processing' ? (
                  <div className="flex items-center text-blue-600">
                    <Clock className="w-5 h-5 mr-2" />
                    <span className="font-medium">Processing</span>
                  </div>
                ) : (
                  <div className="flex items-center text-yellow-600">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    <span className="font-medium">Pending</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200/50">
          <ResultsDisplay 
            results={analysisResults} 
            isLoading={isAnalyzing} 
            session={session || undefined}
            onSendFeedback={handleSendFeedback}
            onSendBulkFeedback={handleSendBulkFeedback}
          />
        </div>
      </main>

      {/* Feedback Modals */}
      {selectedCandidate && (
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => {
            setShowFeedbackModal(false);
            setSelectedCandidate(null);
          }}
          candidate={selectedCandidate}
          sessionId={sessionId || ''}
          clerkId={user?.id || ''}
          onSuccess={handleFeedbackSuccess}
        />
      )}

      <BulkFeedbackModal
        isOpen={showBulkFeedbackModal}
        onClose={() => {
          setShowBulkFeedbackModal(false);
          setSelectedCandidates([]);
        }}
        candidates={selectedCandidates}
        sessionId={sessionId || ''}
        clerkId={user?.id || ''}
        onSuccess={handleFeedbackSuccess}
      />
    </div>
  );
}

export default function AnalysePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <AnalysePageContent />
    </Suspense>
  );
}
