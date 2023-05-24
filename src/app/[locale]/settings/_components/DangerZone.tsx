"use client";

import Button from "~/components/Button";
import Section from "~/components/Section";

export default function DangerZone() {
  return (
    <Section title="Danger zone">
      <div className="grid grid-cols-1 gap-2 px-2">
        <p className="text-gray-400">
          Your data will be deleted from this device but you can still access it
          by using the email sent by Discord. Thanks for trying the app, give us
          some feedback on GitHub!
        </p>
        <Button asChild variant="danger">
          <button
            onClick={(e) => {
              alert("You can't leave yet!");
            }}
          >
            Quit and reset
          </button>
        </Button>
      </div>
    </Section>
  );
}
