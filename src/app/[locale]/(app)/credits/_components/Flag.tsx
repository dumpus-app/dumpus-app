import dynamic from "next/dynamic";

export default function Flag({ code }: { code: string }) {
  const Svg = dynamic(
    () => import(`flagpack-core/svg/l/${code.toUpperCase()}.svg`),
    {
      loading: () => (
        <div className="bg-gray-700" style={{ width: 32, height: 24 }} />
      ),
    },
  );
  return (
    <div className="overflow-hidden rounded">
      <Svg />
    </div>
  );
}
