import { XCircleIcon } from "@heroicons/react/24/solid";
import EmptyState from "~/components/EmptyState";
import Retry from "./Retry";

export default function Error({ error }: { error: string }) {
  return (
    <>
      <EmptyState
        icon={XCircleIcon}
        title="An error occured"
        description={error}
      />
      <Retry show={true} />
    </>
  );
}
