// Netlify Function — genera la imagen OG (1200x630) de un producto bajo demanda.
// URL determinística (/og-image/<id>.png) → se cachea en el CDN de Netlify.
const path = require('path');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { getProductById } = require('./lib/products');

const CANVAS_W = 1200;
const CANVAS_H = 630;

// Paleta de marca (equivalente a tailwind.config.js)
const COLORS = {
  primary: '#b45b38',
  secondary: '#85422b',
  accent: '#d4a373',
  background: '#fdfaf8',
  surface: '#f5ece4',
  text: '#2d1a12',
  muted: '#7a6b63',
  white: '#ffffff',
};

GlobalFonts.registerFromPath(path.join(__dirname, 'fonts', 'Onest.ttf'), 'Onest');
GlobalFonts.registerFromPath(path.join(__dirname, 'fonts', 'FiraMono-Medium.ttf'), 'Fira Mono');

const formatPrice = (n) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(n);

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

const wrapText = (ctx, text, maxWidth) => {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
};

const drawText = (ctx, text, x, y, font, color, maxWidth) => {
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.fillText(text, x, y, maxWidth);
};

async function renderCard(product) {
  const f = product.fields;
  const coverUrl = f.coverImage?.url ?? null;
  const currentPrice = f.on_sale && f.sale_price != null ? f.sale_price : f.price;

  const canvas = createCanvas(CANVAS_W, CANVAS_H);
  const ctx = canvas.getContext('2d');

  // Fondo: gradiente suave cálido
  const gradient = ctx.createLinearGradient(0, 0, CANVAS_W, CANVAS_H);
  gradient.addColorStop(0, COLORS.background);
  gradient.addColorStop(1, COLORS.surface);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Acento diagonal sutil
  ctx.fillStyle = COLORS.accent;
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(560, 0);
  ctx.lineTo(0, 560);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  const leftX = 80;
  const rightX = 600;

  // Badge devsChile (mono, pill)
  const badge = 'devsChile';
  ctx.font = '22px "Fira Mono"';
  const badgeW = ctx.measureText(badge).width + 40;
  ctx.fillStyle = COLORS.primary;
  roundRect(ctx, leftX, 70, badgeW, 48, 24);
  ctx.fill();
  ctx.fillStyle = COLORS.white;
  ctx.fillText(badge, leftX + 20, 70 + 32);

  // Título (Onest, wrap máx. 3 líneas)
  ctx.font = '48px Onest';
  const nameLines = wrapText(ctx, f.name, rightX - leftX - 20).slice(0, 3);
  let nameY = 210;
  for (const line of nameLines) {
    drawText(ctx, line, leftX, nameY, '48px Onest', COLORS.text, rightX - leftX - 20);
    nameY += 62;
  }

  // Categoría
  if (f.category) {
    drawText(
      ctx,
      f.category.toUpperCase(),
      leftX,
      nameY + 10,
      '22px "Fira Mono"',
      COLORS.muted,
      rightX - leftX - 20,
    );
  }

  // Precio
  drawText(
    ctx,
    formatPrice(currentPrice),
    leftX,
    528,
    '52px Onest',
    COLORS.primary,
    rightX - leftX - 20,
  );

  // Dominio
  drawText(
    ctx,
    'tienda.devschile.cl',
    leftX,
    584,
    '24px "Fira Mono"',
    COLORS.muted,
    rightX - leftX - 20,
  );

  // Imagen del producto en panel derecho
  const imgPanel = 560;
  const imgX = rightX + 20;
  const imgY = 35;
  roundRect(ctx, imgX - 5, imgY - 5, imgPanel + 10, imgPanel + 10, 24);
  ctx.fillStyle = COLORS.white;
  ctx.strokeStyle = COLORS.primary;
  ctx.lineWidth = 3;
  ctx.fill();
  ctx.stroke();

  roundRect(ctx, imgX, imgY, imgPanel, imgPanel, 20);
  ctx.save();
  ctx.clip();

  if (coverUrl) {
    try {
      const res = await fetch(coverUrl);
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        const img = await loadImage(buf);
        const scale = Math.max(imgPanel / img.width, imgPanel / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        ctx.drawImage(img, imgX + (imgPanel - dw) / 2, imgY + (imgPanel - dh) / 2, dw, dh);
      }
    } catch (e) {
      console.error('og-image cover fetch failed:', e.message);
    }
  } else {
    ctx.fillStyle = COLORS.surface;
    ctx.fillRect(imgX, imgY, imgPanel, imgPanel);
  }

  ctx.restore();

  return canvas.encode('png');
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'image/png; charset=binary',
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Access-Control-Allow-Origin': '*',
  };

  // path: /.netlify/functions/og-image/<id>.png
  const last = (event.path || '').split('/').filter(Boolean).pop() || '';
  const id = last.replace(/\.png$/i, '');
  if (!id) {
    return { statusCode: 400, headers, body: '' };
  }

  let product;
  try {
    product = await getProductById(process.env.NEON_DATABASE_URL, id);
  } catch (e) {
    console.error('og-image error:', e.message);
    return { statusCode: 500, headers, body: '' };
  }

  if (!product) {
    return { statusCode: 404, headers, body: '' };
  }

  if (event.httpMethod === 'HEAD') {
    return { statusCode: 200, headers, body: '' };
  }

  const image = await renderCard(product);
  return {
    statusCode: 200,
    headers: { ...headers, ETag: `"${product.fields.id}"` },
    body: Buffer.from(image).toString('base64'),
    isBase64Encoded: true,
  };
};
