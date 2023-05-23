import { atom } from "jotai";
import { type Database } from "sql.js";

export const dbAtom = atom<null | Database>(null);
