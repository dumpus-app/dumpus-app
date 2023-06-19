import React, { Fragment } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function RenderMarkdown({
  content,
  noClosingTag = true,
}: {
  content: string;
  noClosingTag?: boolean;
}) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={
        noClosingTag
          ? {
              p: Fragment,
            }
          : undefined
      }
    >
      {content}
    </ReactMarkdown>
  );
}
