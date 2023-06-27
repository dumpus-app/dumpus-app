import { ArchiveBoxXMarkIcon } from "@heroicons/react/24/solid";
import EmptyState from "./EmptyState";

export default function NoDataAvailable() {
  return (
    <EmptyState
      title={"No data available"}
      description={"Select another time range to view data"}
      icon={ArchiveBoxXMarkIcon}
    />
  );
}
