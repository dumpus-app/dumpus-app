import Button from "~/components/Button";
import Link from "~/components/Link";

export type Props =
  | {
      href: string;
      label: string;
    }
  | { href: null; label: undefined };

export default function Footer({ href, label }: Props) {
  return (
    <div className="w-full space-y-2 p-4 text-center sm:mx-auto sm:max-w-sm">
      <button
        // TODO: show popup
        type="button"
        className="text-gray-400 underline transition-colors hover:text-gray-300"
      >
        Why should I trust the app?
      </button>
      {href && (
        <Button asChild>
          <Link href={href}>{label}</Link>
        </Button>
      )}
    </div>
  );
}
