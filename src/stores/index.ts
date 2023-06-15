import { atom } from "jotai";
import { atomWithLocalStorage } from "~/utils/jotai";

export const initAtom = atom(false);

export const CONFIG_ATOM_INITIAL_VALUE = {
  db: {
    ids: [],
    selectedId: null,
  },
};

export const configAtom = atomWithLocalStorage<{
  db: { ids: string[]; selectedId: null | string };
}>("config", CONFIG_ATOM_INITIAL_VALUE);
