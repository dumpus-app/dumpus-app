import { atom } from "jotai";
import { colors } from "../../tailwind.config";

export const bottomNavHeightAtom = atom(0);

export const showSharePopupAtom = atom(false);

export const generatingShareImageAtom = atom(true);

export const showInAppPurchasesDialogAtom = atom(false);

export const DEFAULT_SAFE_AREA_INSET_COLOR = colors.gray[950];

export const safeAreaTopColorAtom = atom<string>(DEFAULT_SAFE_AREA_INSET_COLOR);
export const safeAreaBottomColorAtom = atom<string>(
  DEFAULT_SAFE_AREA_INSET_COLOR
);
