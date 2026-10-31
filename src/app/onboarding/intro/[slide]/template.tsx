import PageEnter from "~/components/PageEnter";

/** Each intro slide animates in. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <PageEnter>{children}</PageEnter>;
}
