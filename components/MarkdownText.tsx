// Renderizador simple de Markdown para descripciones de productos.
// Soporta: # Título, ## Subtítulo, - listas, **negrita**, párrafos.
// Sin dependencias externas — puro React.
import type { ReactNode } from 'react';

function inlineMarkdown(text: string): ReactNode[] {
  // Convierte **negrita** a <strong>
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} className="font-semibold text-devs-text">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );
}

interface MarkdownTextProps {
  content: string;
  className?: string;
}

export function MarkdownText({ content, className = '' }: MarkdownTextProps) {
  const lines = content.split('\n');
  const elements: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('# ')) {
      elements.push(
        <h2
          key={i}
          className="font-mono font-bold text-base text-brand-secondary mt-5 mb-2 first:mt-0"
        >
          {line.slice(2)}
        </h2>,
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h3
          key={i}
          className="font-mono font-semibold text-md text-brand pt-4 pb-1.5 uppercase tracking-wide"
        >
          {line.slice(3)}
        </h3>,
      );
    } else if (line.startsWith('- ')) {
      // Recoger ítems consecutivos de lista
      const items: ReactNode[] = [];
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(
          <li key={i} className="text-sm text-devs-muted leading-relaxed">
            {inlineMarkdown(lines[i].slice(2))}
          </li>,
        );
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc list-inside space-y-1 my-2 pl-1">
          {items}
        </ul>,
      );
      continue; // i ya fue incrementado en el bucle interno
    } else if (line.trim() !== '') {
      elements.push(
        <p key={i} className="text-sm text-devs-muted leading-relaxed">
          {inlineMarkdown(line)}
        </p>,
      );
    }

    i++;
  }

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
}
