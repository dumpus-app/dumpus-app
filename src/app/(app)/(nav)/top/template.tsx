import PageEnter from "~/components/PageEnter";

/** Switching between the DMs, servers and channels lists animates it in. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <PageEnter className="flex grow flex-col">{children}</PageEnter>;
}
