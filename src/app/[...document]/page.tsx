import type { PageProps } from "~/types";
import RenderMarkdown from "~/components/RenderMarkdown";
import fs from "node:fs/promises";
import path from "node:path";
import type { Metadata, ResolvingMetadata } from "next";

const documents = [
  {
    param: "privacy",
    title: "Privacy Policy",
  },
  {
    param: "terms",
    title: "Terms & Conditions",
  },
  {
    param: "data-deletion",
    title: "Data Deletion",
  },
];

export async function generateStaticParams() {
  return documents.map(({ param }) => ({ document: [param] }));
}

export async function generateMetadata(
  { params: { document } }: PageProps<{ document: string[] }>,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { title } = documents.find(({ param }) => param === document[0])!;

  return {
    title,
  };
}

export default async function Document({
  params: { document },
}: PageProps<{ document: string[] }>) {
  const content = await fs.readFile(
    path.join(process.cwd(), `./src/data/static/${document[0]}.md`),
    "utf-8"
  );

  return (
    <div className="prose prose-invert prose-sky mx-auto px-2 py-8 sm:py-16">
      <RenderMarkdown noClosingTag={false} content={content} />
    </div>
  );
}
