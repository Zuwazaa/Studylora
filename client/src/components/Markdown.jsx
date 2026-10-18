import "katex/dist/katex.min.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// AI \( \) va \[ \] yozuvlarini ham ishlatadi — remark-math tushunadigan $ ko'rinishiga o'tkazamiz
const normalize = (s) =>
  String(s || "")
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, m) => `$$${m}$$`)
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, m) => `$${m}$`);

export default function Markdown({ children, className = "" }) {
  return (
    <div className={`md ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
        components={{ a: (p) => <a {...p} target="_blank" rel="noreferrer" /> }}
      >
        {normalize(children)}
      </ReactMarkdown>
    </div>
  );
}

// Test savollari kabi qisqa matnlar uchun (paragraf qo'shmasdan)
export function InlineMd({ children }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
      components={{ p: ({ children: c }) => <>{c}</> }}
    >
      {normalize(children)}
    </ReactMarkdown>
  );
}
