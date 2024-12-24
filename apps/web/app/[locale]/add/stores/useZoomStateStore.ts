import { create } from "zustand";

type ZoomStateStore = {
  triggerZoomIn: boolean;
  triggerZoomOut: boolean;
  triggerZoomInitial: boolean;
  setZoomIn: (value: boolean) => void;
  setZoomOut: (value: boolean) => void;
  setZoomInitial: (value: boolean) => void;
};

export const useZoomStateStore = create<ZoomStateStore>((set) => ({
  triggerZoomIn: false,
  triggerZoomOut: false,
  triggerZoomInitial: false,
  setZoomIn: (value) => set({ triggerZoomIn: value }),
  setZoomOut: (value) => set({ triggerZoomOut: value }),
  setZoomInitial: (value) => set({ triggerZoomInitial: value }),
}));
