import { atom } from "jotai";

function getStorage() {
  if (typeof localStorage !== "undefined") {
    return localStorage;
  }
  return null;
}

export function atomWithLocalStorage<T>(key: string, initialValue: T) {
  const getInitialValue = () => {
    const item = getStorage()?.getItem(key) || null;
    if (item !== null) {
      return JSON.parse(item) as T;
    }
    return initialValue;
  };
  const baseAtom = atom(getInitialValue());
  const derivedAtom = atom(
    (get) => get(baseAtom),
    (get, set, update) => {
      const nextValue =
        typeof update === "function" ? update(get(baseAtom)) : update;
      set(baseAtom, nextValue);
      localStorage.setItem(key, JSON.stringify(nextValue));
    }
  );
  return derivedAtom;
}
