"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  X, 
  Send, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Users,
  UserX
} from "lucide-react";
import axios from "axios";
import api from "@/lib/api";

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
  resume_id: string;
  evaluation: Evaluation;
}

interface BulkFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: Candidate[];
  sessionId: string; // Analysis session ID
  clerkId: string;   // User clerk ID
  onSuccess?: () => void;
}

interface BulkResult {
  resume_id: string;
  candidate_name: string;
  candidate_email: string;
  success: boolean;
  error?: string;
}

export default function BulkFeedbackModal({ 
  isOpen, 
  onClose, 
  candidates, 
  sessionId, 
  clerkId,
  onSuccess 
}: BulkFeedbackModalProps) {
  const [step, setStep] = useState<'confirm' | 'sending' | 'results'>('confirm');
  const [customSubject, setCustomSubject] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [results, setResults] = useState<BulkResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSendBulkFeedback = async () => {
    setIsSending(true);
    setError(null);
    setStep('sending');
    
    try {
      const response = await axios.post(
        api.feedback.sendBulk(clerkId),
        {
          resume_ids: candidates.map(c => c.resume_id),
          analysis_session_id: sessionId,
          custom_subject: customSubject || undefined
        }
      );
      
      setResults(response.data.results);
      setStep('results');
      onSuccess?.();
    } catch (error: unknown) {
      console.error('Error sending bulk feedback:', error);
      setError((error as any)?.response?.data?.detail || 'Failed to send bulk feedback emails');
      setStep('confirm');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setStep('confirm');
    setError(null);
    setResults([]);
    setCustomSubject('');
    onClose();
  };

  const successfulCount = results.filter(r => r.success).length;
  const failedCount = results.filter(r => !r.success).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Send Bulk Feedback</h2>
              <p className="text-sm text-slate-600">
                Send feedback emails to {candidates.length} candidates
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-slate-500 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {step === 'confirm' && (
            <div className="space-y-6">
              {/* Custom Subject */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Custom Email Subject (Optional)
                </label>
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Leave empty to use AI-generated subjects for each candidate"
                />
              </div>

              {/* Candidates List */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Candidates to Receive Feedback ({candidates.length})
                </h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {candidates.map((candidate, index) => (
                    <div
                      key={candidate.resume_id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">        
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">                                                                        
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{candidate.name}</p>
                          <p className="text-sm text-slate-600">{candidate.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-900">
                          Score: {candidate.evaluation["Overall Fit"]}/100
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Error State */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                    <p className="text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {/* Warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-amber-600 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800 mb-1">Important Notice</h4>
                    <p className="text-sm text-amber-700">
                      Each candidate will receive a personalized feedback email based on their resume analysis. 
                      This action cannot be undone. Make sure you want to send feedback to all selected candidates.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'sending' && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Sending Feedback Emails</h3>
                <p className="text-slate-600">
                  Sending personalized feedback to {candidates.length} candidates...
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  This may take a few moments
                </p>
              </div>
            </div>
          )}

          {step === 'results' && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-800">{successfulCount}</p>
                  <p className="text-sm text-green-700">Successful</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <UserX className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-800">{failedCount}</p>
                  <p className="text-sm text-red-700">Failed</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                  <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-800">{candidates.length}</p>
                  <p className="text-sm text-blue-700">Total</p>
                </div>
              </div>

              {/* Detailed Results */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Detailed Results</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {results.map((result) => (
                    <div
                      key={result.resume_id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {result.success ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <UserX className="w-5 h-5 text-red-600" />
                        )}
                        <div>
                          <p className="font-medium text-slate-900">{result.candidate_name}</p>
                          <p className="text-sm text-slate-600">{result.candidate_email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {result.success ? (
                          <span className="text-sm font-medium text-green-800">Sent</span>
                        ) : (
                          <span className="text-sm font-medium text-red-800">
                            {result.error || 'Failed'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
          <div className="text-sm text-slate-600">
            {step === 'confirm' && (
              <span>Each candidate will receive personalized feedback</span>
            )}
            {step === 'sending' && (
              <span>Processing feedback emails...</span>
            )}
            {step === 'results' && (
              <span>
                {successfulCount} emails sent successfully, {failedCount} failed
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {step === 'confirm' && (
              <>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="border-slate-300 text-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendBulkFeedback}
                  disabled={isSending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send to All ({candidates.length})
                </Button>
              </>
            )}
            
            {step === 'results' && (
              <Button
                onClick={handleClose}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Done
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
