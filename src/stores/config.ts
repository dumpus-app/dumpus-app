import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { type TimeRange } from "./db";
import type { PackageData } from "~/types/sql";

type Package = {
  id: string;
  packageLink: string;
  UPNKey: string;
  dateAdded: string;
  backendURL: string;
  shareImageData?: string;
} & PackageData;

type State = {
  premium: boolean;
  timeRange: TimeRange;
  goToOnboardingAccess: boolean;
  db: {
    packages: Package[];
    selectedID: null | string;
  };
};

type DerivedActions = {
  [Property in keyof State as `set${Capitalize<Property>}`]: (
    v: State[Property] extends object
      ? Partial<State[Property]>
      : State[Property]
  ) => void;
};

const DEFAULT_STATE: State = {
  premium: false,
  timeRange: "Lifetime",
  goToOnboardingAccess: false,
  db: {
    packages: [],
    selectedID: null,
  },
};

type Actions = DerivedActions & {
  setSelectedID: (v: State["db"]["selectedID"]) => void;
  setPackage: (id: Package["id"], v: Partial<Package>) => Package | null;
  getDefaultState: () => State;
  reset: () => void;
};

export const configStore = create(
  persist(
    immer<State & Actions>((set, get) => ({
      ...DEFAULT_STATE,
      getDefaultState: () => DEFAULT_STATE,
      reset: () => {
        set((state) => {
          state = { ...state, ...get().getDefaultState() };
        });
      },
      setPremium: (v) =>
        set((state) => {
          state.premium = v;
        }),
      setTimeRange: (v) =>
        set((state) => {
          state.timeRange = v;
        }),
      setGoToOnboardingAccess: (v) =>
        set((state) => {
          state.goToOnboardingAccess = v;
        }),
      setDb: ({ selectedID, packages }) =>
        set((state) => {
          if (selectedID) {
            state.db.selectedID = selectedID;
          }
          if (packages) {
            state.db.packages = packages;
          }
        }),
      setSelectedID: (v) =>
        set((state) => {
          state.db.selectedID = v;
        }),
      setPackage: (id, v) => {
        const index = get().db.packages.findIndex((pkg) => pkg.id === id);
        if (index !== -1) {
          set((state) => {
            state.db.packages[index] = {
              ...state.db.packages[index],
              ...v,
            };
          });
          return get().db.packages[index];
        }
        return null;
      },
    })),
    {
      name: "config:temp",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

if (process.env.NODE_ENV === "development") {
  // @ts-ignore
  window.resetPremium = () => {
    configStore.getState().setPremium(false);
  };
}
