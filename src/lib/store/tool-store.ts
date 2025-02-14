import { create } from "zustand";

type ToolState = {
  activeToolKey: string | null;
  setActiveTool: (key: string | null) => void;
};

export const useToolStore = create<ToolState>((set) => ({
  activeToolKey: null,
  setActiveTool: (key) => set({ activeToolKey: key }),
}));
