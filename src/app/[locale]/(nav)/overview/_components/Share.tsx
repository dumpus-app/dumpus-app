"use client";

import Button from "~/components/Button";

export default function Share() {
  return (
    <div className="sticky bottom-[calc(68px+1px)] z-20 rounded-t-xl border border-b-0 border-gray-800 bg-gray-900 p-2">
      <Button
        type="button"
        onClick={() => {
          alert("share");
        }}
        className="w-full"
      >
        Share
      </Button>
    </div>
  );
}
