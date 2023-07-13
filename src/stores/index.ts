import { create, type StateCreator } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createConfigSlice, type ConfigSlice } from "./config";
import { createDatabaseSlice, type DatabaseSlice } from "./database";
import { createUISlice, type UISlice } from "./ui";
import { createUsersCacheSlice, type UsersCacheSlice } from "./users-cache";

export { timeRanges } from "./config";
export { DEFAULT_SAFE_AREA_INSET_COLOR } from "./ui";

type BoundStore = {
  ui: UISlice;
  config: ConfigSlice;
  database: DatabaseSlice;
} & UsersCacheSlice;

export type CreateSlice<TSlice extends {}> = StateCreator<
  BoundStore,
  [],
  [],
  TSlice
>;

export const useAppStore = create<BoundStore>()((...args) => ({
  ui: createUISlice(...args),
  config: createConfigSlice(...args),
  ...createUsersCacheSlice(...args),
  database: createDatabaseSlice(...args),
}));

export function useSelectedPackage() {
  const [packages, selectedID] = useAppStore(({ config }) => [
    config.packages,
    config.selectedID,
  ]);
  const state = useAppStore((state) => state);
  const getSelectedPackage = useAppStore(
    ({ config }) => config.getSelectedPackage
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
      version: 0,
      migrate: (persistedState, version) => {
        // https://github.com/pmndrs/zustand/blob/main/docs/integrations/persisting-store-data.md#migrate
        return persistedState as any;
      },
    }
  )
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
      migrate: (persistedState, version) => {
        // https://github.com/pmndrs/zustand/blob/main/docs/integrations/persisting-store-data.md#migrate
        return persistedState as any;
      },
    }
  )
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

if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  const {
    config: { setPremium, setPackage },
  } = useAppStore.getState();
  // @ts-ignore
  window.setPremium = setPremium;
  // @ts-ignore
  window.cleanShareImage = (id: string) => {
    setPackage(id, { shareImageData: undefined });
  };
}
