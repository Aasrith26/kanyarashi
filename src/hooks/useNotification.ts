"use client";

import { useState, useCallback } from "react";

export interface NotificationState {
  isOpen: boolean;
  title: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
  showCloseButton?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const useNotification = () => {
  const [notification, setNotification] = useState<NotificationState>({
    isOpen: false,
    title: "",
    message: "",
    type: "info"
  });

  const showNotification = useCallback((config: Omit<NotificationState, "isOpen">) => {
    setNotification({
      ...config,
      isOpen: true
    });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  const showSuccess = useCallback((title: string, message: string, options?: Partial<NotificationState>) => {
    showNotification({
      title,
      message,
      type: "success",
      duration: 3000,
      ...options
    });
  }, [showNotification]);

  const showError = useCallback((title: string, message: string, options?: Partial<NotificationState>) => {
    showNotification({
      title,
      message,
      type: "error",
      duration: 0, // Don't auto-close errors
      ...options
    });
  }, [showNotification]);

  const showWarning = useCallback((title: string, message: string, options?: Partial<NotificationState>) => {
    showNotification({
      title,
      message,
      type: "warning",
      duration: 4000,
      ...options
    });
  }, [showNotification]);

  const showInfo = useCallback((title: string, message: string, options?: Partial<NotificationState>) => {
    showNotification({
      title,
      message,
      type: "info",
      duration: 3000,
      ...options
    });
  }, [showNotification]);

  const showConfirm = useCallback((
    title: string, 
    message: string, 
    onConfirm: () => void, 
    onCancel?: () => void,
    options?: Partial<NotificationState>
  ) => {
    showNotification({
      title,
      message,
      type: "warning",
      duration: 0,
      onConfirm,
      onCancel,
      confirmText: "Confirm",
      cancelText: "Cancel",
      ...options
    });
  }, [showNotification]);

  return {
    notification,
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm
  };
};
