import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

// Custom components matching shadcn typography styles
const markdownComponents: Components = {
  h1: ({ node, ...props }) => (
    <h1
      className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance"
      {...props}
    />
  ),
  h2: ({ node, ...props }) => (
    <h2
      className="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0"
      {...props}
    />
  ),
  h3: ({ node, ...props }) => (
    <h3
      className="mt-8 scroll-m-20 text-2xl font-semibold tracking-tight"
      {...props}
    />
  ),
  h4: ({ node, ...props }) => (
    <h4
      className="mt-6 scroll-m-20 text-xl font-semibold tracking-tight"
      {...props}
    />
  ),
  p: ({ node, ...props }) => (
    <p className="leading-7 [&:not(:first-child)]:mt-6" {...props} />
  ),
  ul: ({ node, ...props }) => (
    <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props} />
  ),
  ol: ({ node, ...props }) => (
    <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props} />
  ),
  li: ({ node, ...props }) => <li className="mt-2" {...props} />,
  blockquote: ({ node, ...props }) => (
    <blockquote className="mt-6 border-l-2 pl-6 italic" {...props} />
  ),
  code: ({ node, className, children, ...props }) => {
    const isInline = !className?.includes('language-');
    return isInline ? (
      <code
        className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
        {...props}
      >
        {children}
      </code>
    ) : (
      <code className={`relative rounded font-mono text-sm ${className}`} {...props}>
        {children}
      </code>
    );
  },
  a: ({ node, ...props }) => (
    <a
      className="text-primary font-medium underline underline-offset-4"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  strong: ({ node, ...props }) => (
    <strong className="font-semibold" {...props} />
  ),
};

interface MarkdownProps {
  children: string;
  className?: string;
}

export function Markdown({ children, className }: MarkdownProps) {
  return (
    <div className={className}>
      <ReactMarkdown components={markdownComponents}>
        {children}
      </ReactMarkdown>
    </div>
  );
}