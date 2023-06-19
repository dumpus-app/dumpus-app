import { Prettify } from ".";

export type PackageAPIProcessResponse = Prettify<
  { packageId: string } & (
    | { isAccepted: true; errorMessageCode: null }
    | { isAccepted: false; errorMessageCode: "INVALID_LINK" }
  )
>;

export type PackageAPIStatusResponse = Prettify<
  {
    isUpgraded: boolean;
    processingQueuePosition: {
      user: number;
      total: number;
      userWhenStarted: number;
      totalWhenStarted: number;
    };
  } & (
    | { isErrored: false; errorMessageCode: null }
    | {
        isErrored: true;
        errorMessageCode:
          | "UNKNOWN_PACKAGE_ID"
          | "SERVER_ERROR"
          | "UNAUTHORIZED"
          | "EXPIRED_LINK";
      }
  ) &
    (
      | {
          isDataAvailable: false;
          isProcessing: true;
          processingStep: "LOCKED" | "DOWNLOADING" | "ANALYZING";
        }
      | {
          isDataAvailable: true;
          isProcessing: false;
          processingStep: "PROCESSED";
        }
    )
>;

export type PackageAPIDataResponse = Prettify<
  | { data: ArrayBuffer; errorMessageCode: null }
  | { data: null; errorMessageCode: "UNKNOWN_PACKAGE_ID" | "UNAUTHORIZED" }
>;

export type PackageAPIRemoveResponse = Prettify<{
  isDeleted: boolean;
  errorMessageCode: "UNKNOWN_PACKAGE_ID" | "UNAUTHORIZED";
}>;
