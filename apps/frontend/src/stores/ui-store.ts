import { create } from 'zustand';

type DialogType = 'upload' | 'template' | 'share' | 'export' | 'progress' | 'generation' | null;

interface UIState {
  zoom: number;
  panX: number;
  panY: number;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  activeDialog: DialogType;
  mediaRefreshTrigger: number;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  openDialog: (dialog: DialogType) => void;
  closeDialog: () => void;
  resetView: () => void;
  triggerMediaRefresh: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  zoom: 1,
  panX: 0,
  panY: 0,
  leftSidebarOpen: true,
  rightSidebarOpen: true,
  activeDialog: null,
  mediaRefreshTrigger: 0,

  setZoom: (zoom: number) => {
    set({ zoom });
  },

  setPan: (x: number, y: number) => {
    set({ panX: x, panY: y });
  },

  toggleLeftSidebar: () => {
    set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen }));
  },

  toggleRightSidebar: () => {
    set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen }));
  },

  openDialog: (dialog: DialogType) => {
    set({ activeDialog: dialog });
  },

  closeDialog: () => {
    set({ activeDialog: null });
  },

  resetView: () => {
    set({ zoom: 1, panX: 0, panY: 0 });
  },

  triggerMediaRefresh: () => {
    set((state) => ({ mediaRefreshTrigger: state.mediaRefreshTrigger + 1 }));
  },
}));
