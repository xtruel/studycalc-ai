import React from "react";
import katex from "katex";

interface MathRendererProps {
  text: string;
}

export default function MathRenderer({ text }: MathRendererProps) {
  if (!text) return null;

  // Normalize different standard math markup syntaxes:
  // - Replace escapes: \[ and \] with $$ (for displays)
  // - Replace escapes: \( and \) with $ (for inlines)
  // - Support inline tags ($ and $$)
  const normalizedText = text
    .replace(/\\\[/g, "$$")
    .replace(/\\\]/g, "$$")
    .replace(/\\\(/g, "$")
    .replace(/\\\)/g, "$");

  // Split string based on $$ ... $$ or $ ... $ groups
  const parts = normalizedText.split(/(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g);

  return (
    <>
      {parts.map((part, idx) => {
        // Render Display (block) Math formulas
        if (part.startsWith("$$") && part.endsWith("$$")) {
          const formula = part.slice(2, -2).trim();
          try {
            const html = katex.renderToString(formula, {
              displayMode: true,
              throwOnError: false,
            });
            return (
              <div
                key={idx}
                className="my-3 overflow-x-auto p-3 bg-indigo-50/20 dark:bg-slate-900/60 rounded-xl border border-indigo-100/20 dark:border-slate-800/60 math-display clear-both"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch (e) {
            console.error("KaTeX compile error in display formula:", e);
            return (
              <div key={idx} className="font-mono text-xs my-2 p-2 bg-amber-50 dark:bg-amber-950/20 text-indigo-750 dark:text-amber-400 rounded-lg">
                {formula}
              </div>
            );
          }
        } 
        
        // Render Inline Math formulas
        if (part.startsWith("$") && part.endsWith("$")) {
          const formula = part.slice(1, -1).trim();
          try {
            const html = katex.renderToString(formula, {
              displayMode: false,
              throwOnError: false,
            });
            return (
              <span
                key={idx}
                className="inline-block mx-0.5 math-inline select-all px-1 py-0.5 rounded-md bg-indigo-50/30 dark:bg-slate-850/40 text-indigo-650 dark:text-indigo-400 font-medium"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch (e) {
            console.error("KaTeX compile error in inline formula:", e);
            return (
              <span key={idx} className="font-mono text-[11px] text-indigo-700 bg-amber-100 rounded px-1">
                {formula}
              </span>
            );
          }
        }

        // Render ordinary prose, con supporto leggero a **grassetto** e `codice`
        const segs = part.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
        return (
          <span key={idx} className="whitespace-pre-wrap">
            {segs.map((s, i) => {
              if (s.startsWith("**") && s.endsWith("**")) {
                return <strong key={i} className="font-semibold text-slate-900 dark:text-white">{s.slice(2, -2)}</strong>;
              }
              if (s.startsWith("`") && s.endsWith("`")) {
                return <code key={i} className="font-mono text-[0.92em] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-300">{s.slice(1, -1)}</code>;
              }
              return <React.Fragment key={i}>{s}</React.Fragment>;
            })}
          </span>
        );
      })}
    </>
  );
}
