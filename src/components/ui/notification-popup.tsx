"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, CheckCircle, AlertCircle, Info, TriangleAlert } from "lucide-react";

export interface NotificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "success" | "error" | "warning" | "info";
  duration?: number; // Auto-close duration in ms, 0 means no auto-close
  showCloseButton?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  duration = 0,
  showCloseButton = true,
  onConfirm,
  onCancel,
  confirmText = "OK",
  cancelText = "Cancel"
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [isOpen, duration, handleClose]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 200); // Wait for animation to complete
  }, [onClose]);


  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    handleClose();
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case "error":
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      case "warning":
        return <TriangleAlert className="w-6 h-6 text-yellow-600" />;
      default:
        return <Info className="w-6 h-6 text-blue-600" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case "success":
        return "border-green-200";
      case "error":
        return "border-red-200";
      case "warning":
        return "border-yellow-200";
      default:
        return "border-blue-200";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-200"
        onClick={showCloseButton ? handleClose : undefined}
      />
      
      {/* Popup */}
      <div 
        className={`
          relative bg-white rounded-2xl shadow-2xl border-2 ${getBorderColor()} 
          max-w-md w-full mx-4 transform transition-all duration-200
          ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            {getIcon()}
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          </div>
          {showCloseButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-slate-700 leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-slate-200">
          {onCancel && (
            <Button
              variant="outline"
              onClick={handleCancel}
              className="text-slate-600 border-slate-300"
            >
              {cancelText}
            </Button>
          )}
          <Button
            onClick={onConfirm || handleClose}
            className={`
              ${type === "error" ? "bg-red-600 hover:bg-red-700" : 
                type === "warning" ? "bg-yellow-600 hover:bg-yellow-700" :
                type === "success" ? "bg-green-600 hover:bg-green-700" :
                "bg-blue-600 hover:bg-blue-700"}
              text-white
            `}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPopup;
