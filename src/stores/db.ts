import { type Database } from "sql.js";
import { create } from "zustand";
import { useConfigStore } from "./config";

export type DatabaseStoreInterface = {
  _initialized: boolean;
  _selectedID: null | string;
  db: null | Database;
  computed: {
    nextID: Readonly<string>;
  };
  setDB: (v: null | Database) => void;
  init: () => void;
};

export const useDatabaseStore = create<DatabaseStoreInterface>((set, get) => ({
  _initialized: false,
  _selectedID: null,
  db: null,
  setDB: (db) => set({ db }),
  computed: {
    get nextID() {
      const id = get()._selectedID;

      return id ? `${parseInt(id) + 1}` : "0";
    },
  },
  init: () => {
    if (get()._initialized) return;
    set({ _initialized: true });

    useConfigStore.subscribe((state) => {
      set({ _selectedID: state.db.selectedID });
    });
  },
}));
