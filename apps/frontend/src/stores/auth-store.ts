import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Project {
  id: string;
  name: string;
  slug: string;
  hasPassword?: boolean;
}

interface AuthState {
  token: string | null;
  project: Project | null;
  currentProject: Project | null; // Alias for project for backward compatibility
  isAuthenticated: boolean;
  login: (name: string, password: string) => Promise<void>;
  createProject: (name: string, password: string) => Promise<void>;
  logout: () => void;
  setToken: (token: string, project: Project) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      project: null,
      currentProject: null, // Alias for project
      isAuthenticated: false,

      setToken: (token: string, project: Project) => {
        set({
          token,
          project,
          currentProject: project, // Keep in sync
          isAuthenticated: true,
        });
      },

      login: async (_name: string, _password: string) => {
        // This will be implemented using the API client
        // For now, we just define the interface
        throw new Error('Not implemented - use API client');
      },

      createProject: async (_name: string, _password: string) => {
        // This will be implemented using the API client
        // For now, we just define the interface
        throw new Error('Not implemented - use API client');
      },

      logout: () => {
        set({
          token: null,
          project: null,
          currentProject: null, // Keep in sync
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'gazette-auth-storage',
      partialize: (state) => ({
        token: state.token,
        project: state.project,
        currentProject: state.project, // Keep in sync
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
