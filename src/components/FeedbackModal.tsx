"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  X, 
  Mail, 
  Send, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  User
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

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: {
    name: string;
    email: string;
    resume_id: string;
    evaluation: Evaluation;
  };
  sessionId: string; // Analysis session ID
  clerkId: string;   // User clerk ID
  onSuccess?: () => void;
}

interface FeedbackPreview {
  candidate_name: string;
  candidate_email: string;
  feedback_content: string;
  subject_suggestion: string;
  tone: string;
  key_areas: string[];
}

export default function FeedbackModal({ 
  isOpen, 
  onClose, 
  candidate, 
  sessionId, 
  clerkId,
  onSuccess 
}: FeedbackModalProps) {
  const [step, setStep] = useState<'preview' | 'customize' | 'sending' | 'sent'>('preview');
  const [feedbackPreview, setFeedbackPreview] = useState<FeedbackPreview | null>(null);
  const [customSubject, setCustomSubject] = useState('');
  const [customFeedback, setCustomFeedback] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && step === 'preview') {
      generateFeedbackPreview();
    }
  }, [isOpen, candidate.resume_id]);

  const generateFeedbackPreview = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await axios.post(
        api.feedback.generate(candidate.resume_id),
        {},
        {
          params: { clerk_id: clerkId }
        }
      );
      
      setFeedbackPreview(response.data);
      setCustomSubject(response.data.subject_suggestion);
      setCustomFeedback(response.data.feedback_content);
    } catch (error) {
      console.error('Error generating feedback preview:', error);
      setError('Failed to generate feedback preview. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendFeedback = async () => {
    setIsSending(true);
    setError(null);
    
    try {
      const response = await axios.post(
        api.feedback.send(candidate.resume_id, clerkId),
        {
          resume_id: candidate.resume_id,
          analysis_session_id: sessionId,
          custom_subject: customSubject,
          custom_feedback: customFeedback
        }
      );
      
      if (response.data.success) {
        setStep('sent');
        setSuccess(true);
        onSuccess?.();
      } else {
        setError(response.data.error || 'Failed to send feedback email');
      }
    } catch (error: unknown) {
      console.error('Error sending feedback:', error);
      setError((error as any)?.response?.data?.detail || 'Failed to send feedback email');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setStep('preview');
    setError(null);
    setSuccess(false);
    setCustomSubject('');
    setCustomFeedback('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Send Feedback Email</h2>
              <p className="text-sm text-slate-600">Provide constructive feedback to {candidate.name}</p>
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
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          {step === 'preview' && (
            <div className="space-y-6">
              {/* Candidate Info */}
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-slate-600" />
                  <div>
                    <h3 className="font-semibold text-slate-900">{candidate.name}</h3>
                    <p className="text-sm text-slate-600">{candidate.email}</p>
                  </div>
                </div>
              </div>

              {/* Recipient Input Field */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Recipient
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={`${candidate.name} <${candidate.email}>`}
                    readOnly
                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 cursor-not-allowed"
                    placeholder="Candidate name and email"
                  />
                </div>
              </div>

              {/* Loading State */}
              {isGenerating && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Generating Feedback</h3>
                    <p className="text-slate-600">Our AI is analyzing the resume and creating personalized feedback...</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                    <p className="text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {/* Feedback Preview */}
              {feedbackPreview && !isGenerating && (
                <div className="space-y-6">
                  {/* Email Subject */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email Subject
                    </label>
                    <input
                      type="text"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter email subject..."
                    />
                  </div>

                  {/* Feedback Content */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Feedback Content
                    </label>
                    <textarea
                      value={customFeedback}
                      onChange={(e) => setCustomFeedback(e.target.value)}
                      rows={12}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Enter feedback content..."
                    />
                  </div>

                  {/* Key Areas */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Key Improvement Areas</h4>
                    <div className="flex flex-wrap gap-2">
                      {feedbackPreview.key_areas.map((area, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'sending' && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Sending Email</h3>
                <p className="text-slate-600">Sending feedback email to {candidate.name}...</p>
              </div>
            </div>
          )}

          {step === 'sent' && success && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Email Sent Successfully!</h3>
                <p className="text-slate-600">
                  Feedback email has been sent to {candidate.name} at {candidate.email}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50 flex-shrink-0">
          <div className="text-sm text-slate-600">
            {step === 'preview' && feedbackPreview && (
              <span>Email will be sent from Innomatics Research Lab</span>
            )}
            {step === 'sent' && (
              <span>Email delivery status will be tracked</span>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {step === 'preview' && (
              <>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="border-slate-300 text-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendFeedback}
                  disabled={!feedbackPreview || isSending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Email
                    </>
                  )}
                </Button>
              </>
            )}
            
            {step === 'sent' && (
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
