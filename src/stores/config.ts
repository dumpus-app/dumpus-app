import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { useDatabaseStore, type DatabaseStoreInterface } from "./db";
import type { PackageData } from "~/types/sql";
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

type PublicState = {
  premium: boolean;
  timeRange: TimeRange;
  goToOnboardingAccess: boolean;
  db: {
    packages: Package[];
    selectedID: null | string;
  };
};

type PrivateState = {
  initialized: boolean;
  db: DatabaseStoreInterface["db"];
};

type DerivedPrivateState = {
  [Property in keyof PrivateState as `_${Property}`]: PrivateState[Property];
};

type DerivedActions = {
  [Property in keyof PublicState as `set${Capitalize<Property>}`]: (
    v: PublicState[Property] extends object
      ? Partial<PublicState[Property]>
      : PublicState[Property]
  ) => void;
};

type State = PublicState & DerivedPrivateState;

const DEFAULT_STATE: State = {
  _initialized: false,
  _db: null,
  premium: false,
  timeRange: "Lifetime",
  goToOnboardingAccess: false,
  db: {
    packages: [],
    selectedID: null,
  },
};

type Actions = DerivedActions & {
  setSelectedID: (v: PublicState["db"]["selectedID"]) => void;
  setPackage: (id: Package["id"], v: Partial<Package>) => Package | null;
  reset: () => void;
  deletePackage: (id: Package["id"]) => void;
  addPackage: (pkg: Package) => void;
};

type Getters = {
  defaultState: PublicState;
  dbExtremityDates: [string, string] | undefined;
  timeRangeDates: [string, string];
  selectedPackage: Package;
  unselectedPackages: Package[];
};

type Computed = {
  computed: {
    [Property in keyof Getters]: Readonly<Getters[Property]>;
  };
};

export const useConfigStore = create(
  persist(
    immer<State & Actions & Computed>((set, get) => ({
      ...DEFAULT_STATE,
      computed: {
        get defaultState() {
          return DEFAULT_STATE;
        },
        get dbExtremityDates() {
          const db = get()._db;

          const results = db?.exec(
            "SELECT MIN(day) AS start, MAX(day) AS end FROM activity"
          );

          return results?.[0].values[0] as unknown as any;
        },
        get timeRangeDates() {
          const { timeRange } = get();
          const extremityDates = get().computed.dbExtremityDates;

          const firstDateLimit = new Date(extremityDates?.[0] || "2015-05-13");
          const endDate = extremityDates
            ? new Date(extremityDates[1])
            : new Date();

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

          return [formatDate(firstDate), formatDate(endDate)] as const;
        },
        get selectedPackage() {
          const {
            db: { packages, selectedID },
          } = get();
          return packages.find(({ id }) => id === selectedID)!;
        },
        get unselectedPackages() {
          const {
            db: { packages, selectedID },
          } = get();
          return packages.filter(({ id }) => id !== selectedID);
        },
      },
      init: () => {
        if (get()._initialized) return;
        set((state) => {
          state._initialized = true;
        });

        useDatabaseStore.subscribe(({ db }) => {
          set((state) => {
            state._db = db;
          });
        });
      },
      reset: () => {
        set((state) => {
          state = { ...state, ...get().computed.defaultState };
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
      addPackage: (pkg) => {
        set((state) => {
          state.db.packages.push(pkg);
        });
      },
      deletePackage: (id) => {
        localStorage.removeItem(getStorageKey(id));

        const index = get().db.packages.findIndex((pkg) => pkg.id === id);
        set((state) => {
          state.db.packages.splice(index, 1);
        });

        if (get().db.packages.length === 0) {
          get().setSelectedID(null);
          get().setGoToOnboardingAccess(true);
          window.location.href = "/";
        } else {
          get().setSelectedID(get().db.packages[0].id);
          window.location.reload();
        }
      },
    })),
    {
      name: "config",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([key]) => !["_initialized", "_db", "computed"].includes(key)
          )
        ),
    }
  )
);

if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  // @ts-ignore
  window.setPremium = useConfigStore.getState().setPremium;
}
