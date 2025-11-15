import { create } from "zustand";

const useVehicleStore = create((set) => ({
  vehicles: [],
  selectedVehicle: null,

  setVehicles: (list) => set({ vehicles: list }),

  selectVehicle: (vehicle) => set({ selectedVehicle: vehicle }),

  addVehicle: (vehicle) =>
    set((state) => ({
      vehicles: [...state.vehicles, vehicle],
    })),

  removeVehicle: (id) =>
    set((state) => ({
      vehicles: state.vehicles.filter((v) => v.id !== id),
    })),
}));

export default useVehicleStore;
