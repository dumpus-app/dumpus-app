import { getStorageKey } from "~/hooks/use-sql-init";
import type { PackageData } from "~/types/sql";
import { type CreateSlice } from ".";
import { queryClient } from "~/utils/react-query";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context";
import i18next from "i18next";

export const timeRanges = ["4 weeks", "6 months", "Year", "Lifetime"] as const;

export type TimeRange = (typeof timeRanges)[number];

type Package = {
  id: string;
  packageLink: string;
  UPNKey: string;
  dateAdded: string;
  backendURL: string;
} & PackageData;

type State = {
  premium: boolean;
  timeRange: TimeRange;
  goToOnboardingAccess: boolean;
  loadingData?: {
    packageLink: string;
    backendURL?: string;
  };
  packages: Package[];
  selectedID: null | string;
};

type Actions = {
  reset: () => void;
  setPremium: (v: boolean) => void;
  setTimeRange: (v: TimeRange) => void;
  setGoToOnboardingAccess: (v: boolean) => void;
  setLoadingData: (v: State["loadingData"]) => void;
  setPackages: (v: Package[]) => void;
  setSelectedID: (v: string | null) => void;
  setPackage: (id: Package["id"], v: Partial<Package>) => Package | null;
  addPackage: (pkg: Package) => void;
  deletePackage: (opts: {
    id: Package["id"];
    router: AppRouterInstance;
  }) => void;
  getSelectedPackage: (
    packages: State["packages"],
    selectedID: State["selectedID"],
  ) => Package;
  getUnselectedPackages: (
    packages: State["packages"],
    selectedID: State["selectedID"],
  ) => Package[];
};

const initialState: State = {
  premium: false,
  timeRange: "Lifetime",
  goToOnboardingAccess: false,
  loadingData: undefined,
  packages: [],
  selectedID: null,
};

export type ConfigSlice = State & Actions;

export const createConfigSlice: CreateSlice<ConfigSlice> = (set, get) => ({
  ...initialState,
  getSelectedPackage(packages, selectedID) {
    return packages.find(({ id }) => id === selectedID)!;
  },
  getUnselectedPackages(packages, selectedID) {
    return packages.filter(({ id }) => id !== selectedID);
  },
  reset: () =>
    set((state) => ({ config: { ...state.config, ...initialState } })),
  setPremium: (v) =>
    set((state) => ({ config: { ...state.config, premium: v } })),
  setTimeRange: (v) =>
    set((state) => ({ config: { ...state.config, timeRange: v } })),
  setGoToOnboardingAccess: (v) =>
    set((state) => ({ config: { ...state.config, goToOnboardingAccess: v } })),
  setLoadingData: (v) =>
    set((state) => ({ config: { ...state.config, loadingData: v } })),
  setPackages: (v) =>
    set((state) => ({ config: { ...state.config, packages: v } })),
  setSelectedID: (v) =>
    set((state) => ({ config: { ...state.config, selectedID: v } })),
  setPackage: (id, v) => {
    const { packages } = get().config;
    const index = packages.findIndex((pkg) => pkg.id === id);
    if (index !== -1) {
      packages[index] = { ...packages[index], ...v };
      set((state) => ({ config: { ...state.config, packages } }));
      return packages[index];
    }
    return null;
  },
  addPackage: (pkg) =>
    set((state) => ({
      config: { ...state.config, packages: [...state.config.packages, pkg] },
    })),
  deletePackage: ({ id, router }) => {
    localStorage.removeItem(getStorageKey(id));

    const { packages } = get().config;

    const index = packages.findIndex((pkg) => pkg.id === id);
    packages.splice(index, 1);
    set((state) => ({ config: { ...state.config, packages } }));

    if (packages.length === 0) {
      set((state) => ({
        config: {
          ...state.config,
          selectedID: null,
          goToOnboardingAccess: true,
        },
      }));
      router.replace(`/${i18next.language}/onboarding/access/`);
    } else {
      set((state) => ({
        config: {
          ...state.config,
          selectedID: packages[0].id,
        },
      }));
      router.refresh();
    }
    queryClient.clear();
  },
});
