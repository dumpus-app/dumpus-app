import type { PackageAPIUserResponse } from "~/types/package-api";
import { CreateSlice } from "./zustand-test";

type State = {
  usersCache: PackageAPIUserResponse[];
};

type Actions = {
  setUsersCache: (v: State["usersCache"]) => void;
};

export type UsersCacheSlice = State & Actions;

export const createUsersCacheSlice: CreateSlice<UsersCacheSlice> = (set) => ({
  usersCache: [],
  setUsersCache: (v) => set(() => ({ usersCache: v })),
});
