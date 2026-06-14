import React, { createContext, useContext, useState, useMemo } from 'react';

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
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  deleteAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      taskName: 'Tugas Mandiri 3 - UI/UX Design',
      courseName: 'Mobile Application Development',
      priority: 'High',
      timeLeft: '1 hour left',
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
      read: false
    },
    {
      id: '2',
      taskName: 'Laporan Praktikum 2 - Relational DB',
      courseName: 'Basis Data',
      priority: 'Medium',
      timeLeft: '23 hours left',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      read: false
    },
    {
      id: '3',
      taskName: 'Quiz 1 - Subnetting & IP Routing',
      courseName: 'Computer Networks',
      priority: 'Low',
      timeLeft: '1 hour left',
      createdAt: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(), // 28 hours ago (yesterday)
      read: true
    },
    {
      id: '4',
      taskName: 'Proyek Akhir Semester - API Integration',
      courseName: 'Web Programming',
      priority: 'High',
      timeLeft: '23 hours left',
      createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(), // 30 hours ago (yesterday)
      read: false
    }
  ]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read && !n.deleted).length;
  }, [notifications]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, deleted: true } : n)
    );
  };

  const deleteAllNotifications = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, deleted: true }))
    );
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      markAsRead, 
      markAllAsRead, 
      deleteNotification, 
      deleteAllNotifications 
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
