// Distribución exacta de un descuento (CLP enteros) sobre las líneas de una
// preferencia de MercadoPago, de modo que la suma de unit_price×quantity sea
// EXACTAMENTE (subtotal − discount). MercadoPago Checkout Pro no admite líneas
// negativas, así que el descuento se prorratea entre los ítems.
//
// Estrategia (garantiza sumas exactas con enteros):
//   1. Prorrateo proporcional con floor por línea (nunca pasa el total objetivo).
//   2. El residuo (target − sumAllocated) se absorbe en las líneas con mayor
//      headroom (línea original − monto asignado), que siempre es suficiente.
//   3. Si la cantidad de la línea no divide el monto a asignar, se factura la
//      línea como 1 ítem a precio total; así no existen fracciones de 1 CLP.

function qtyOf(item) {
  return item.quantity || 1;
}

function distributeDiscount(items, discountAmount) {
  const out = items.map((item) => ({ ...item }));
  const amount = Number(discountAmount) || 0;
  if (amount <= 0 || out.length === 0) return out;

  const total = out.reduce((sum, item) => sum + item.unit_price * qtyOf(item), 0);
  if (total <= 0) return out;

  const target = Math.max(0, total - amount);
  const originalAmount = out.map((item) => item.unit_price * qtyOf(item));

  // Paso 1: prorrateo proporcional con floor.
  let sumAllocated = 0;
  for (let idx = 0; idx < out.length; idx++) {
    const item = out[idx];
    const newLine = Math.max(0, Math.min(Math.floor((originalAmount[idx] / total) * target), originalAmount[idx]));

    if (newLine % qtyOf(item) === 0) {
      item.unit_price = newLine / qtyOf(item);
    } else {
      // Cantidad > 1 y monto no divisible: se factura como 1 ítem a precio total.
      item.unit_price = newLine;
      item.quantity = 1;
    }
    sumAllocated += item.unit_price * item.quantity;
  }

  // Paso 2: absorber el residuo en las líneas con mayor headroom.
  // Preferencia por líneas qty=1 (mueven CLP de a 1) y solo montos que
  // preserven la divisibilidad en líneas con cantidad > 1.
  let residual = target - sumAllocated; // >= 0 por el floor del paso 1
  const order = [...out.keys()].sort((a, b) => {
    const aOne = qtyOf(out[a]) === 1 ? 0 : 1;
    const bOne = qtyOf(out[b]) === 1 ? 0 : 1;
    if (aOne !== bOne) return aOne - bOne;
    return originalAmount[b] - originalAmount[a];
  });
  for (const idx of order) {
    if (residual <= 0) break;
    const item = out[idx];
    const q = qtyOf(item);
    const currentAmount = item.unit_price * q;
    const headroom = Math.max(0, originalAmount[idx] - currentAmount);
    if (headroom <= 0) continue;

    // En líneas con cantidad > 1, solo mover bloques múltiplos de la cantidad.
    const chunk = q > 1 ? Math.floor(Math.min(residual, headroom) / q) * q : Math.min(residual, headroom);
    if (chunk <= 0) continue;

    const newAmount = currentAmount + chunk;
    item.unit_price = newAmount / q; // divisible por construcción
    residual -= chunk;
  }

  return out;
}

module.exports = { distributeDiscount };