// Reemplaza tokens `:word:` por <img> que apuntan al emoji estático de la comunidad.
// Si el archivo `.png` no existe, conserva el texto `:word:` original.
// Los resultados del HEAD se cachean a nivel de módulo para evitar peticiones repetidas.
import { useEffect, useState, type ReactNode } from 'react';

const EMOJI_RE = /(:[a-z0-9_-]+:)/gi;
const EMOJI_URL = (word: string, ext: 'png' | 'gif') =>
  `https://static.devschile.cl/emoji/${word}.${ext}`;

const cache = new Map<string, 'png' | 'gif' | null>();

async function emojiExists(word: string): Promise<'png' | 'gif' | null> {
  const cached = cache.get(word);
  if (cached !== undefined) return cached;
  let ext: 'png' | 'gif' | null = null;
  try {
    const png = await fetch(EMOJI_URL(word, 'png'), { method: 'HEAD' });
    if (png.ok) ext = 'png';
    else {
      const gif = await fetch(EMOJI_URL(word, 'gif'), { method: 'HEAD' });
      if (gif.ok) ext = 'gif';
    }
  } catch {
    ext = null;
  }
  cache.set(word, ext);
  return ext;
}

function WordToken({ word }: { word: string }) {
  const [ext, setExt] = useState<'png' | 'gif' | null>(null);

  useEffect(() => {
    let active = true;
    emojiExists(word).then((result) => {
      if (active) setExt(result);
    });
    return () => {
      active = false;
    };
  }, [word]);

  if (!ext) {
    return <span className="inline-block">:{word}:</span>;
  }

  return (
    <img
      src={EMOJI_URL(word, ext)}
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
