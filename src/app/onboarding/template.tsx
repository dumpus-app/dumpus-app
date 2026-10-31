import PageEnter from "~/components/PageEnter";

/** Each onboarding step fades and lifts in between the header and footer. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <PageEnter>{children}</PageEnter>;
}
