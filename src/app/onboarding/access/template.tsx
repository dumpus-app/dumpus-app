import PageEnter from "~/components/PageEnter";

/** Going from the access methods to one of them animates it in. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <PageEnter>{children}</PageEnter>;
}
