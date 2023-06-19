import RenderMarkdown from "~/components/RenderMarkdown";
import fs from "node:fs/promises";
import path from "node:path";

export const metadata = {
  title: "Terms & Conditions",
};

export default async function Privacy() {
  const content = await fs.readFile(
    path.join(process.cwd(), "./legal/terms.md"),
    "utf-8"
  );

  return (
    <div className="prose prose-invert prose-sky mx-auto px-2 py-8 sm:py-16">
      <RenderMarkdown noClosingTag={false} content={content} />
    </div>
  );
}
