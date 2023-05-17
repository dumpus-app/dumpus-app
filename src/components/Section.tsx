import Link from "~/components/Link";

export type Props = {
  title: string;
  href?: string;
  children: React.ReactNode;
  id?: string;
};

export default function Section({ title, href, children, id }: Props) {
  return (
    <section id={id} className="py-4">
      <div className="mb-2 flex items-center justify-between px-2">
        <div className="text-lg font-bold text-white">{title}</div>
        {href ? (
          <Link href={href} className="text-brand-300 hover:underline">
            More
          </Link>
        ) : (
          <div />
        )}
      </div>
      {children}
    </section>
  );
}
