import { motion } from 'motion/react';

// ── Celda base pulsante ───────────────────────────────────────────────────────
function Pulse({
  w,
  h = 'h-3.5',
  rounded = 'rounded',
  className = '',
}: {
  w: string;
  h?: string;
  rounded?: string;
  className?: string;
}) {
  return <div className={`bg-slate-200 animate-pulse ${w} ${h} ${rounded} ${className}`} />;
}

// ── Fila skeleton de Productos ────────────────────────────────────────────────
export function ProductSkeletonRow({ index }: { index: number }) {
  return (
    <motion.tr
      className="border-b border-slate-100"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1 - index * 0.1, x: 0 }}
      transition={{ type: 'spring', bounce: 0.2, duration: 0.4, delay: index * 0.055 }}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Checkbox */}
      <td className="px-4 py-3.5">
        <Pulse w="w-4" h="h-4" rounded="rounded" />
      </td>
      {/* Imagen */}
      <td className="p-3">
        <Pulse w="w-9" h="h-9" rounded="rounded-lg" />
      </td>
      {/* Nombre + categoría */}
      <td className="px-4 py-3.5">
        <Pulse w={['w-44', 'w-36', 'w-48', 'w-40', 'w-52'][index % 5]} className="mb-2" />
        <Pulse w={['w-20', 'w-16', 'w-24', 'w-18', 'w-14'][index % 5]} h="h-2.5" />
      </td>
      {/* Precio */}
      <td className="px-4 py-3.5">
        <Pulse w="w-20" />
      </td>
      {/* Stock */}
      <td className="px-4 py-3.5 text-center">
        <Pulse w="w-8" h="h-5" rounded="rounded-full" className="mx-auto" />
      </td>
      {/* Toggles × 3 */}
      {[0, 1, 2].map((t) => (
        <td key={t} className="px-3 py-3.5 text-center">
          <Pulse w="w-8" h="h-4" rounded="rounded-full" className="mx-auto" />
        </td>
      ))}
      {/* Botón editar */}
      <td className="pr-4 py-3.5 text-right">
        <Pulse w="w-14" h="h-6" rounded="rounded-lg" className="ml-auto" />
      </td>
    </motion.tr>
  );
}

// ── Fila skeleton de Pedidos ──────────────────────────────────────────────────
export function OrderSkeletonRow({ index }: { index: number }) {
  return (
    <motion.tr
      className="border-b border-slate-100"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1 - index * 0.1, x: 0 }}
      transition={{ type: 'spring', bounce: 0.2, duration: 0.4, delay: index * 0.055 }}
    >
      {/* Checkbox */}
      <td className="px-4 py-3.5">
        <Pulse w="w-4" h="h-4" rounded="rounded" />
      </td>
      {/* # Orden */}
      <td className="px-4 py-3.5">
        <Pulse w="w-20" h="h-3" rounded="rounded" />
      </td>
      {/* Cliente */}
      <td className="px-4 py-3.5">
        <Pulse w={['w-32', 'w-28', 'w-36', 'w-24', 'w-40'][index % 5]} className="mb-2" />
        <Pulse w={['w-36', 'w-40', 'w-28', 'w-44', 'w-32'][index % 5]} h="h-2.5" />
      </td>
      {/* Total */}
      <td className="px-4 py-3.5">
        <Pulse w="w-20" />
      </td>
      {/* Items */}
      <td className="px-4 py-3.5 text-center">
        <Pulse w="w-8" h="h-5" rounded="rounded-full" className="mx-auto" />
      </td>
      {/* Estado badge */}
      <td className="px-4 py-3.5">
        <Pulse w="w-20" h="h-5" rounded="rounded-full" />
      </td>
      {/* Fecha */}
      <td className="px-4 py-3.5">
        <Pulse w="w-28" h="h-3" />
      </td>
      {/* Botón ver */}
      <td className="pr-4 py-3.5 text-right">
        <Pulse w="w-10" h="h-6" rounded="rounded-lg" className="ml-auto" />
      </td>
    </motion.tr>
  );
}
