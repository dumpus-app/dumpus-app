"use client";

import Button from "~/components/Button";

export default function Share() {
  return (
    <div className="rounded-t-xl border border-b-0 border-gray-800 bg-gray-900 p-2">
      <Button
        type="button"
        onClick={() => {
          // TODO: share. Extract to utility like useShare
        }}
        className="w-full"
      >
        Share
      </Button>
    </div>
  );
}
