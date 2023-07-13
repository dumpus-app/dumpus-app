import { CreateSlice } from ".";
import { colors } from "../../tailwind.config";

type State = {
  bottomNavHeight: number;
  showSharePopup: boolean;
  generatingShareImage: boolean;
  showInAppPurchasesDialog: boolean;
  safeAreaTopColor: string;
  safeAreaBottomColor: string;
};

type Actions = {
  setBottomNavHeight: (v: number) => void;
  setShowSharePopup: (v: boolean) => void;
  setGeneratingShareImage: (v: boolean) => void;
  setShowInAppPurchasesDialog: (v: boolean) => void;
  setSafeAreaTopColor: (v: string) => void;
  setSafeAreaBottomColor: (v: string) => void;
};

export type UISlice = State & Actions;

export const DEFAULT_SAFE_AREA_INSET_COLOR = colors.gray[950];

export const createUISlice: CreateSlice<UISlice> = (set) => ({
  bottomNavHeight: 0,
  showSharePopup: false,
  generatingShareImage: true,
  showInAppPurchasesDialog: false,
  safeAreaTopColor: DEFAULT_SAFE_AREA_INSET_COLOR,
  safeAreaBottomColor: DEFAULT_SAFE_AREA_INSET_COLOR,
  setBottomNavHeight: (bottomNavHeight) =>
    set((state) => ({ ui: { ...state.ui, bottomNavHeight } })),
  setShowSharePopup: (showSharePopup) =>
    set((state) => ({ ui: { ...state.ui, showSharePopup } })),
  setGeneratingShareImage: (generatingShareImage) =>
    set((state) => ({ ui: { ...state.ui, generatingShareImage } })),
  setShowInAppPurchasesDialog: (showInAppPurchasesDialog) =>
    set((state) => ({ ui: { ...state.ui, showInAppPurchasesDialog } })),
  setSafeAreaTopColor: (safeAreaTopColor) =>
    set((state) => ({ ui: { ...state.ui, safeAreaTopColor } })),
  setSafeAreaBottomColor: (safeAreaBottomColor) =>
    set((state) => ({ ui: { ...state.ui, safeAreaBottomColor } })),
});
