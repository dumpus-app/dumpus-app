import "~/app/[locale]/globals.css";
import { Rubik } from "next/font/google";
import RenderMarkdown from "~/components/RenderMarkdown";
import type { InferGetStaticPropsType, GetStaticProps } from "next";
import fs from "node:fs/promises";
import path from "node:path";
import clsx from "clsx";
import Head from "next/head";

const font = Rubik({ subsets: ["latin"] });

export const getStaticProps: GetStaticProps<{
  content: string;
}> = async () => {
  const content = await fs.readFile(
    path.join(process.cwd(), "./legal/privacy.md"),
    "utf-8"
  );
  return { props: { content } };
};

export default function Privacy({
  content,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <div className="bg-gray-950">
      <div
        className={clsx(
          font.className,
          "prose prose-invert prose-sky mx-auto px-2 py-8 sm:py-16"
        )}
      >
        <Head>
          <title>Privacy Policy</title>
        </Head>
        <RenderMarkdown noClosingTag={false} content={content} />
      </div>
    </div>
  );
}
