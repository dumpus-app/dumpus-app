import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context";
import { getStorageKey } from "~/hooks/use-sql-init";
import type { PackageData } from "~/types/sql";
import { queryClient } from "~/utils/react-query";
import { type CreateSlice } from ".";
import { isCapacitorSupported } from "~/capacitor/utils";
import { RateApp } from "capacitor-rate-app";

export const timeRanges = ["4weeks", "6months", "year", "lifetime"] as const;

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
  lastRatePromptDate: string | null;
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
  getLastRatePromptDate: () => Date | null;
  callPrompt: () => void;
};

const initialState: State = {
  premium: false,
  timeRange: "lifetime",
  goToOnboardingAccess: false,
  loadingData: undefined,
  packages: [],
  selectedID: null,
  lastRatePromptDate: null,
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
  getLastRatePromptDate() {
    const { lastRatePromptDate } = get().config;
    return lastRatePromptDate ? new Date(lastRatePromptDate) : null;
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
      router.replace("/onboarding/access/");
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
  callPrompt: () => {
    const date = get().config.getLastRatePromptDate();

    function isDateOlderThanOneMonth(date: Date): boolean {
      // Get the current date
      const currentDate = new Date();

      // Calculate a date one month from now
      const oneMonthFromNow = new Date(currentDate);
      oneMonthFromNow.setMonth(currentDate.getMonth() + 1);

      // Compare the given date with one month from now
      return date < oneMonthFromNow;
    }

    if (
      !isCapacitorSupported() ||
      (date ? !isDateOlderThanOneMonth(date) : false)
    ) {
      return;
    }

    RateApp.requestReview();

    set((state) => ({
      config: { ...state.config, lastRatePromptDate: new Date().toISOString() },
    }));
  },
});
