import { PackageAPIUserResponse } from "~/types/package-api";
import { atomWithLocalStorage } from "~/utils/jotai";

export const USERS_CACHE_ATOM_INITIAL_VALUE = [];

export const usersCacheAtom = atomWithLocalStorage<PackageAPIUserResponse[]>(
  "users-cache",
  []
);
