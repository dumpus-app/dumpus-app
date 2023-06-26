import { ArchiveBoxXMarkIcon } from "@heroicons/react/24/solid";

export default function NoDataAvailable() {
  return (
    <div className="my-auto px-2 py-4 desktop-container sm:py-8">
      <div className="text-center">
        <ArchiveBoxXMarkIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-bold text-white sm:text-2xl">
          No data available
        </h3>
        <p className="mt-1 text-gray-400 sm:text-xl">
          Select another time range to view data
        </p>
      </div>
    </div>
  );
}
