import React, { createContext, useState, useEffect } from 'react';

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
      // Ambil id_workspace terakhir dari AsyncStorage
    };
    loadWorkspace();
  }, []);

  const setActiveWorkspace = async (id: number, name: string) => {
    setActiveWorkspaceId(id);
    setActiveWorkspaceName(name);
    // Simpan ke AsyncStorage
  };

  const clearActiveWorkspace = async () => {
    setActiveWorkspaceId(null);
    setActiveWorkspaceName(null);
    // Hapus dari AsyncStorage
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
