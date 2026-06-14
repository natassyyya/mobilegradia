import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../constants/config';

interface WorkspaceContextType {
  activeWorkspaceId: number | null;
  activeWorkspaceName: string | null;
  setActiveWorkspace: (id: number, name: string) => Promise<void>;
  clearActiveWorkspace: () => Promise<void>;
}

export const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<number | null>(null);
  const [activeWorkspaceName, setActiveWorkspaceName] = useState<string | null>(null);

  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        const idVal = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.ACTIVE_WORKSPACE_ID);
        const nameVal = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.ACTIVE_WORKSPACE_NAME);
        if (idVal) {
          setActiveWorkspaceId(parseInt(idVal, 10));
        }
        if (nameVal) {
          setActiveWorkspaceName(nameVal);
        }
      } catch (err) {
        console.error('Failed to load active workspace from AsyncStorage:', err);
      }
    };
    loadWorkspace();
  }, []);

  const setActiveWorkspace = async (id: number, name: string) => {
    try {
      setActiveWorkspaceId(id);
      setActiveWorkspaceName(name);
      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.ACTIVE_WORKSPACE_ID, String(id));
      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.ACTIVE_WORKSPACE_NAME, name);
    } catch (err) {
      console.error('Failed to save active workspace to AsyncStorage:', err);
    }
  };

  const clearActiveWorkspace = async () => {
    try {
      setActiveWorkspaceId(null);
      setActiveWorkspaceName(null);
      await AsyncStorage.removeItem(CONFIG.STORAGE_KEYS.ACTIVE_WORKSPACE_ID);
      await AsyncStorage.removeItem(CONFIG.STORAGE_KEYS.ACTIVE_WORKSPACE_NAME);
    } catch (err) {
      console.error('Failed to clear active workspace from AsyncStorage:', err);
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        activeWorkspaceId,
        activeWorkspaceName,
        setActiveWorkspace,
        clearActiveWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};
