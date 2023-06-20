import { atom } from "jotai";
import type { PackageData } from "~/types/sql";
import { atomWithLocalStorage } from "~/utils/jotai";

export const initAtom = atom(false);

export const CONFIG_ATOM_INITIAL_VALUE = {
  db: {
    packages: [],
    selectedId: null,
  },
};

export const configAtom = atomWithLocalStorage<{
  db: {
    packages: ({
      id: string;
      packageLink: string;
      UPNKey: string;
      issueDate: string;
    } & PackageData)[];
    selectedId: null | string;
  };
}>("config", CONFIG_ATOM_INITIAL_VALUE);
