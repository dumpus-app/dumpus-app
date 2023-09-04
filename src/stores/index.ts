import { create, type StateCreator } from "zustand";
import {
  createJSONStorage,
  persist,
  subscribeWithSelector,
} from "zustand/middleware";
import { createConfigSlice, type ConfigSlice } from "./config";
import { createDatabaseSlice, type DatabaseSlice } from "./database";
import { createUISlice, type UISlice } from "./ui";
import { createUsersCacheSlice, type UsersCacheSlice } from "./users-cache";
import { migrateConfig, migrateUsersCache } from "./migrations";
import { shallow } from "zustand/shallow";
import { createPurchasesSlice, type PurchasesSlice } from "./purchases";

export { timeRanges } from "./config";
export { DEFAULT_SAFE_AREA_INSET_COLOR } from "./ui";

type BoundStore = {
  ui: UISlice;
  config: ConfigSlice;
  database: DatabaseSlice;
  purchases: PurchasesSlice;
} & UsersCacheSlice;

export type CreateSlice<TSlice extends {}> = StateCreator<
  BoundStore,
  [["zustand/subscribeWithSelector", never]],
  [],
  TSlice
>;

export const useAppStore = create<BoundStore>()(
  subscribeWithSelector((...args) => ({
    ui: createUISlice(...args),
    config: createConfigSlice(...args),
    ...createUsersCacheSlice(...args),
    database: createDatabaseSlice(...args),
    purchases: createPurchasesSlice(...args),
  })),
);

export function useSelectedPackage() {
  const [packages, selectedID] = useAppStore(
    ({ config }) => [config.packages, config.selectedID],
    shallow,
  );
  const getSelectedPackage = useAppStore(
    ({ config }) => config.getSelectedPackage,
  );
  return getSelectedPackage(packages, selectedID);
}

const configStorage = create(
  persist(
    () => ({
      config: useAppStore.getState().config,
    }),
    {
      name: "config",
      storage: createJSONStorage(() => localStorage),
      version: 3,
      migrate: migrateConfig,
    },
  ),
);

const usersCacheStorage = create(
  persist(
    () => ({
      usersCache: useAppStore.getState().usersCache,
    }),
    {
      name: "users-cache",
      storage: createJSONStorage(() => localStorage),
      version: 0,
      migrate: migrateUsersCache,
    },
  ),
);

export function syncAppStore() {
  useAppStore.setState({
    config: {
      ...useAppStore.getState().config,
      ...configStorage.getState().config,
    },
    usersCache: usersCacheStorage.getState().usersCache,
  });
  return useAppStore.subscribe(({ config, usersCache }) => {
    configStorage.setState({ config });
    usersCacheStorage.setState({ usersCache });
  });
}

if (typeof window !== "undefined") {
  const {
    config: { setPremium },
  } = useAppStore.getState();
  window.setPremium = setPremium;
}
