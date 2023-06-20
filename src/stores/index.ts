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
      backendURL: string;
    } & PackageData)[];
    selectedId: null | string;
  };
}>("config", CONFIG_ATOM_INITIAL_VALUE);

export const selectedPackageAtom = atom((get) => {
  const {
    db: { packages, selectedId },
  } = get(configAtom);
  return packages.find(({ id }) => id === selectedId)!;
});

export const unselectedPackagesAtom = atom((get) => {
  const {
    db: { packages, selectedId },
  } = get(configAtom);
  return packages.filter(({ id }) => id !== selectedId);
});
