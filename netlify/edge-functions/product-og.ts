// Edge Function (Deno) — inyecta meta OG específica de producto en el HTML de la SPA
// para URLs /p/<id>. Corres antes del redirect catch-all de la SPA, así tanto los
// crawlers social (que no ejecutan JS) como los humanos reciben el mismo HTML con
// sus meta tags, y la URL /p/<id> se mantiene en la barra de direcciones.
import type { Context } from 'https://edge.netlify.com';

interface OgData {
  id: string;
  name: string;
  description: string | null;
  long_description: string | null;
  category: string | null;
  price: number;
  price_display: string;
  currency: string;
  availability: string;
  cover_url: string | null;
  url: string;
  image: string;
}

const DEFAULT_SITE_NAME = 'Tienda devsChile';

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const stripMarkdown = (text: string): string =>
  text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const buildMetaBlock = (data: OgData, origin: string): string => {
  const productUrl = `${origin}${data.url}`;
  const imageUrl = `${origin}${data.image}`;
  const title = `${data.name} — ${DEFAULT_SITE_NAME}`;

  let description = (data.description || '').trim();
  if (!description && data.long_description) {
    description = stripMarkdown(data.long_description).slice(0, 160);
  }
  if (!description) {
    description = data.category
      ? `Producto ${data.category} en la Tienda devsChile`
      : 'Producto en la Tienda devsChile';
  }
  description = `${description} · ${data.price_display}`;

  return `
    <!-- Open Graph (producto: ${data.id}) -->
    <meta property="og:type"          content="product" />
    <meta property="og:site_name"     content="${DEFAULT_SITE_NAME}" />
    <meta property="og:title"         content="${escapeHtml(title)}" />
    <meta property="og:description"   content="${escapeHtml(description)}" />
    <meta property="og:url"           content="${escapeHtml(productUrl)}" />
    <meta property="og:image"         content="${escapeHtml(imageUrl)}" />
    <meta property="og:image:width"   content="1200" />
    <meta property="og:image:height"  content="630" />
    <meta property="og:image:alt"     content="${escapeHtml(data.name)}" />
    <meta property="og:locale"        content="es_CL" />
    <meta property="product:price:amount"    content="${data.price}" />
    <meta property="product:price:currency"  content="${data.currency}" />
    <meta property="product:availability"    content="${data.availability}" />

    <!-- Twitter / X Card -->
    <meta name="twitter:card"         content="summary_large_image" />
    <meta name="twitter:title"        content="${escapeHtml(title)}" />
    <meta name="twitter:description"  content="${escapeHtml(description)}" />
    <meta name="twitter:image"        content="${escapeHtml(imageUrl)}" />
`;
};

// Reemplaza el bloque OG/Twitter estático de index.html por el bloque del producto.
const injectMeta = (html: string, metaBlock: string): string => {
  const start = '<!-- Open Graph';
  const end = '<!-- Fuentes -->';
  const startIdx = html.indexOf(start);
  const endIdx = html.indexOf(end);
  if (startIdx === -1 || endIdx === -1) return html;
  const before = html.slice(0, startIdx);
  const after = html.slice(endIdx);
  return `${before}${metaBlock}${after}`;
};

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/p\/([^/]+)\/?$/);
  if (!match) return context.next();

  const id = match[1];
  const origin = url.origin;

  let data: OgData;
  try {
    const res = await fetch(`${origin}/.netlify/functions/og-data/${id}`);
    if (!res.ok) return context.rewrite('/');
    data = await res.json();
  } catch (e) {
    console.error('product-og edge error:', (e as Error).message);
    return context.next();
  }

  const response = await context.next();
  const html = await response.text();

  const metaBlock = buildMetaBlock(data, origin);
  const newHtml = injectMeta(html, metaBlock);

  const headers = new Headers(response.headers);
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.delete('content-length');

  return new Response(newHtml, { status: response.status, headers });
};
