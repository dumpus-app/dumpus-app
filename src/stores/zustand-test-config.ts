import type { PackageData } from "~/types/sql";
import { type CreateSlice } from "./zustand-test";
import { getStorageKey } from "~/hooks/use-sql-init";

export const timeRanges = ["4 weeks", "6 months", "Year", "Lifetime"] as const;

export type TimeRange = (typeof timeRanges)[number];

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
  packages: Package[];
  selectedID: null | string;
};

type Actions = {
  reset: () => void;
  setPremium: (v: boolean) => void;
  setTimeRange: (v: TimeRange) => void;
  setGoToOnboardingAccess: (v: boolean) => void;
  setPackages: (v: Package[]) => void;
  setSelectedID: (v: string | null) => void;
  setPackage: (id: Package["id"], v: Partial<Package>) => Package | null;
  addPackage: (pkg: Package) => void;
  deletePackage: (id: Package["id"]) => void;
  getTimeRangeDates: (
    timeRange: State["timeRange"],
    extremityDates: [string, string] | undefined
  ) => [string, string, string, string];
  getSelectedPackage: (
    packages: State["packages"],
    selectedID: State["selectedID"]
  ) => Package;
  getUnselectedPackages: (
    packages: State["packages"],
    selectedID: State["selectedID"]
  ) => Package[];
};

const initialState: State = {
  premium: false,
  timeRange: "Lifetime",
  goToOnboardingAccess: false,
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
  getTimeRangeDates: (timeRange, extremityDates) => {
    const firstDateLimit = new Date(extremityDates?.[0] || "2015-05-13");
    const endDate = extremityDates ? new Date(extremityDates[1]) : new Date();

    const firstDate = new Date();

    switch (timeRange) {
      case "4 weeks":
        firstDate.setDate(firstDate.getDate() - 4 * 7);
        break;
      case "6 months":
        firstDate.setMonth(firstDate.getMonth() - 6);
        break;
      case "Year":
        firstDate.setFullYear(firstDate.getFullYear() - 1);
        break;
      case "Lifetime":
        firstDate.setTime(firstDateLimit.getTime());
        break;
    }

    function formatDate(date: Date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    }

    return [
      formatDate(firstDate),
      formatDate(endDate),
      formatDate(firstDateLimit),
      formatDate(endDate),
    ];
  },
  reset: () =>
    set((state) => ({ config: { ...state.config, ...initialState } })),
  setPremium: (v) =>
    set((state) => ({ config: { ...state.config, premium: v } })),
  setTimeRange: (v) =>
    set((state) => ({ config: { ...state.config, timeRange: v } })),
  setGoToOnboardingAccess: (v) =>
    set((state) => ({ config: { ...state.config, goToOnboardingAccess: v } })),
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
  deletePackage: (id) => {
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
      window.location.href = "/";
    } else {
      set((state) => ({
        config: {
          ...state.config,
          selectedID: packages[0].id,
        },
      }));
      window.location.reload();
    }
  },
});
