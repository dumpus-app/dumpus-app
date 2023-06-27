import { NoSymbolIcon } from "@heroicons/react/24/solid";
import EmptyState from "./EmptyState";

export default function NotFoundState() {
  return (
    <EmptyState
      title="Not found"
      description="The page you're looking for doesn't exist"
      icon={NoSymbolIcon}
    />
  );
}
