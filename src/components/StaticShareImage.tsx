export type Props = {
  title: string;
};

export default function StaticShareImage({ title }: Props) {
  return (
    <div tw="h-full w-full flex flex-col bg-gray-950">
      <div tw="h-4 bg-brand-300 flex-shrink-0" />
      <div tw="flex-1 text-white">Content</div>
    </div>
  );
}
