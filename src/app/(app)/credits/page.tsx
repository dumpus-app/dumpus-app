import PageEnter from "~/components/PageEnter";
import TopNav from "../(nav)/_components/TopNav";
import Back from "./_components/Back";
import Contributors from "./_components/Contributors";
import PageHeader from "./_components/PageHeader";
import Roles from "./_components/Roles";

export default function Page() {
  return (
    <>
      <TopNav />
      <PageEnter className="flex grow flex-col">
        <PageHeader />
        <Back />
        <Roles />
        <Contributors />
      </PageEnter>
    </>
  );
}
