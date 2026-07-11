import type { MDXComponents } from 'mdx/types';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h2: (p) => <h2 className="mt-10 text-2xl font-bold text-ink" {...p} />,
    h3: (p) => <h3 className="mt-8 text-xl font-bold text-ink" {...p} />,
    p: (p) => <p className="mt-4 leading-relaxed text-ink-muted" {...p} />,
    ul: (p) => <ul className="mt-4 list-disc space-y-2 pl-6 text-ink-muted" {...p} />,
    ol: (p) => <ol className="mt-4 list-decimal space-y-2 pl-6 text-ink-muted" {...p} />,
    li: (p) => <li className="leading-relaxed" {...p} />,
    a: (p) => <a className="text-primary underline underline-offset-2" {...p} />,
    blockquote: (p) => <blockquote className="mt-6 border-l-2 border-primary pl-4 italic text-ink" {...p} />,
    strong: (p) => <strong className="font-bold text-ink" {...p} />,
    ...components,
  };
}
