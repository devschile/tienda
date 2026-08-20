// Reemplaza tokens `:word:` por <img> que apuntan al emoji estático de la comunidad.
// Si el archivo `.png` no existe, conserva el texto `:word:` original.
// Los resultados del HEAD se cachean a nivel de módulo para evitar peticiones repetidas.
import { useEffect, useState, type ReactNode } from 'react';

const EMOJI_RE = /(:[a-z0-9_-]+:)/gi;
const EMOJI_URL = (word: string) => `https://static.devschile.cl/emoji/${word}.png`;

const cache = new Map<string, boolean>();

function emojiExists(word: string): Promise<boolean> {
  const cached = cache.get(word);
  if (cached !== undefined) return Promise.resolve(cached);
  return fetch(EMOJI_URL(word), { method: 'HEAD' })
    .then((res) => {
      const exists = res.ok;
      cache.set(word, exists);
      return exists;
    })
    .catch(() => {
      cache.set(word, false);
      return false;
    });
}

function WordToken({ word }: { word: string }) {
  const [found, setFound] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    emojiExists(word).then((exists) => {
      if (active) setFound(exists);
    });
    return () => {
      active = false;
    };
  }, [word]);

  if (found === null) {
    return <span className="inline-block">:{word}:</span>;
  }

  if (!found) {
    return <span className="inline-block">:{word}:</span>;
  }

  return (
    <img
      src={EMOJI_URL(word)}
      alt={word}
      className="inline-block h-[1em] w-auto align-text-bottom"
    />
  );
}

export function EmojiText({ text }: { text: string }) {
  const parts = text.split(EMOJI_RE);
  const nodes: ReactNode[] = parts.map((part, i) => {
    if (part.length > 2 && part.startsWith(':') && part.endsWith(':')) {
      return <WordToken key={i} word={part.slice(1, -1)} />;
    }
    return <span key={i}>{part}</span>;
  });
  return <>{nodes}</>;
}
