"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Eye, Pencil, SplitSquareHorizontal } from "lucide-react";

// MarkdownEditor — split editor + live preview for blog post content.
type ViewMode = "edit" | "preview" | "split";

export default function MarkdownEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [mode, setMode] = useState<ViewMode>("split");

  const insert = (before: string, after = "", placeholder = "") => {
    const ta = document.getElementById("blog-md-editor") as HTMLTextAreaElement;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end) || placeholder;
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      const newCursor = start + before.length + selected.length + after.length;
      ta.setSelectionRange(newCursor, newCursor);
    });
  };

  const wordCount = useMemo(
    () => (value.trim() ? value.trim().split(/\s+/).length : 0),
    [value],
  );

  return (
    <div className="rounded-2xl border border-maroon/15 bg-white shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-maroon/10 bg-blush/40 px-3 py-2">
        <button type="button" onClick={() => insert("## ", "", "Heading")} className="rounded-md px-2 py-1 text-xs font-semibold text-maroon hover:bg-maroon/10" title="Heading">H2</button>
        <button type="button" onClick={() => insert("### ", "", "Subheading")} className="rounded-md px-2 py-1 text-xs font-semibold text-maroon hover:bg-maroon/10" title="Subheading">H3</button>
        <button type="button" onClick={() => insert("**", "**", "bold text")} className="rounded-md px-2 py-1 text-xs font-semibold text-maroon hover:bg-maroon/10" title="Bold">B</button>
        <button type="button" onClick={() => insert("*", "*", "italic text")} className="rounded-md px-2 py-1 text-xs font-semibold text-maroon hover:bg-maroon/10" title="Italic"><em>I</em></button>
        <button type="button" onClick={() => insert("> ", "", "Quote")} className="rounded-md px-2 py-1 text-xs font-semibold text-maroon hover:bg-maroon/10" title="Blockquote">❝</button>
        <button type="button" onClick={() => insert("- ", "", "list item")} className="rounded-md px-2 py-1 text-xs font-semibold text-maroon hover:bg-maroon/10" title="Bullet list">•</button>
        <button type="button" onClick={() => insert("1. ", "", "numbered item")} className="rounded-md px-2 py-1 text-xs font-semibold text-maroon hover:bg-maroon/10" title="Numbered list">1.</button>
        <button type="button" onClick={() => insert("[", "](https://)", "link text")} className="rounded-md px-2 py-1 text-xs font-semibold text-maroon hover:bg-maroon/10" title="Link">🔗</button>
        <div className="ml-auto flex items-center gap-1 text-xs text-maroon/55">
          <span>{wordCount} words</span>
          <span className="text-maroon/30">·</span>
          <span>~{Math.max(1, Math.round(wordCount / 200))} min read</span>
        </div>
      </div>

      {/* View mode toggle */}
      <div className="flex items-center justify-between border-b border-maroon/10 bg-white px-3 py-2">
        <div className="flex items-center gap-1">
          <ModeBtn current={mode} value="edit" set={setMode} icon={<Pencil className="h-3.5 w-3.5" />} label="Write" />
          <ModeBtn current={mode} value="split" set={setMode} icon={<SplitSquareHorizontal className="h-3.5 w-3.5" />} label="Split" />
          <ModeBtn current={mode} value="preview" set={setMode} icon={<Eye className="h-3.5 w-3.5" />} label="Preview" />
        </div>
        <span className="text-xs text-maroon/45">Markdown supported</span>
      </div>

      {/* Editor + Preview */}
      <div className={`grid ${mode === "split" ? "lg:grid-cols-2" : "grid-cols-1"}`}>
        {mode !== "preview" && (
          <textarea
            id="blog-md-editor"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={"# Your headline\n\nWrite your story in markdown…\n\n- Use ## for headings\n- **bold**, *italic*\n- > for quotes\n- - for bullet lists"}
            spellCheck
            className="min-h-[60vh] w-full resize-y border-0 bg-white p-5 font-mono text-sm leading-relaxed text-maroon placeholder:text-maroon/35 focus:outline-none focus:ring-0"
          />
        )}
        {mode !== "edit" && (
          <div
            className={`min-h-[60vh] overflow-auto bg-blush/30 p-5 ${
              mode === "split" ? "border-l border-maroon/10" : ""
            }`}
          >
            <div className="blog-markdown font-serif text-maroon">
              {value.trim() ? (
                <ReactMarkdown
                  components={{
                    h1: ({ node, ...p }) => <h1 className="mt-6 mb-3 font-serif text-2xl font-semibold text-maroon" {...p} />,
                    h2: ({ node, ...p }) => <h2 className="mt-6 mb-2 font-serif text-xl font-semibold text-maroon" {...p} />,
                    h3: ({ node, ...p }) => <h3 className="mt-4 mb-2 font-serif text-lg font-semibold text-maroon" {...p} />,
                    p: ({ node, ...p }) => <p className="my-3 text-sm leading-relaxed text-maroon/85" {...p} />,
                    ul: ({ node, ...p }) => <ul className="my-3 space-y-1 pl-5 text-sm text-maroon/85 [list-style-type:disc]" {...p} />,
                    ol: ({ node, ...p }) => <ol className="my-3 space-y-1 pl-5 text-sm text-maroon/85 [list-style-type:decimal]" {...p} />,
                    blockquote: ({ node, ...p }) => <blockquote className="my-4 border-l-4 border-magenta/40 pl-4 text-sm italic text-maroon/85" {...p} />,
                    strong: ({ node, ...p }) => <strong className="font-semibold text-maroon" {...p} />,
                    a: ({ node, ...p }) => <a className="text-magenta underline underline-offset-2" {...p} />,
                  }}
                >
                  {value}
                </ReactMarkdown>
              ) : (
                <p className="text-sm italic text-maroon/40">
                  Preview will appear here as you write…
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ModeBtn({
  current,
  value,
  set,
  icon,
  label,
}: {
  current: ViewMode;
  value: ViewMode;
  set: (v: ViewMode) => void;
  icon: React.ReactNode;
  label: string;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => set(value)}
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
        active ? "bg-magenta/10 text-magenta" : "text-maroon/65 hover:bg-maroon/5"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
