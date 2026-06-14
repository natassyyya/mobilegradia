import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { useAuth } from '../hooks/use-auth';
import * as notificationsApi from '../api/notificationsApi';

export interface Notification {
  id: string;
  taskName: string;
  courseName: string;
  priority: 'High' | 'Medium' | 'Low';
  timeLeft: string; // '1 hour left' or '23 hours left'
  createdAt: string;
  read: boolean;
  deleted?: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const mapDBToFrontend = (dbNotif: notificationsApi.DBNotification): Notification => {
    return {
      id: String(dbNotif.id_notification),
      taskName: dbNotif.task?.title || "Unknown Task",
      courseName: dbNotif.task?.course?.name || "Unknown Course",
      priority: (dbNotif.task?.priority as 'High' | 'Medium' | 'Low') || 'Medium',
      timeLeft: dbNotif.time_left === 1 ? '1 hour left' : `${dbNotif.time_left} hours left`,
      createdAt: dbNotif.created_at,
      read: dbNotif.is_read,
      deleted: dbNotif.is_deleted || false
    };
  };

  const loadNotifications = async () => {
    if (!user?.id_user) {
      setNotifications([]);
      return;
    }
    try {
      const data = await notificationsApi.getNotifications(user.id_user);
      setNotifications(data.map(mapDBToFrontend));
    } catch (e) {
      console.error("[NotificationProvider] Failed to load notifications:", e);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user?.id_user]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read && !n.deleted).length;
  }, [notifications]);

  const markAsRead = async (id: string) => {
    // Optimistic UI update
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    try {
      await notificationsApi.markNotificationAsRead(Number(id));
    } catch (e) {
      console.error("[NotificationProvider] markAsRead failed:", e);
      // Revert if failed
      loadNotifications();
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id_user) return;
    // Optimistic UI update
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
    try {
      await notificationsApi.markAllNotificationsAsRead(user.id_user);
    } catch (e) {
      console.error("[NotificationProvider] markAllAsRead failed:", e);
      loadNotifications();
    }
  };

  const deleteNotification = async (id: string) => {
    // Optimistic UI update
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, deleted: true } : n)
    );
    try {
      await notificationsApi.deleteNotification(Number(id));
    } catch (e) {
      console.error("[NotificationProvider] deleteNotification failed:", e);
      loadNotifications();
    }
  };

  const deleteAllNotifications = async () => {
    if (!user?.id_user) return;
    // Optimistic UI update
    setNotifications(prev =>
      prev.map(n => ({ ...n, deleted: true }))
    );
    try {
      await notificationsApi.deleteAllNotifications(user.id_user);
    } catch (e) {
      console.error("[NotificationProvider] deleteAllNotifications failed:", e);
      loadNotifications();
    }
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      markAsRead, 
      markAllAsRead, 
      deleteNotification, 
      deleteAllNotifications,
      refreshNotifications: loadNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
