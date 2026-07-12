import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, LayoutGroup, useMotionValue, useTransform } from 'motion/react';
import {
  Star,
  Trash2,
  Upload,
  Loader2,
  ImageIcon,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { adminFetch } from '../../utils/adminFetch';

interface ProductImage {
  id: string;
  url: string;
  filename: string;
  is_cover: boolean;
  position: number;
  size: number;
}
interface Props {
  productId: string;
}

const MAX_SIZE_MB = 8;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function ImageSkeleton() {
  return (
    <motion.div
      className="grid grid-cols-3 gap-2 p-2"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={i}
          variants={{
            hidden: { opacity: 0, scale: 0.7, y: 16 },
            visible: { opacity: 1, scale: 1, y: 0 },
          }}
          transition={{ type: 'spring', bounce: 0.45, duration: 0.5 }}
          className="rounded-lg overflow-hidden border border-slate-200"
        >
          <div className="aspect-square bg-gradient-to-br from-slate-200 to-slate-100 animate-pulse" />
          <div className="flex items-center justify-between px-2 py-1.5 bg-white gap-2">
            <div className="h-3 w-12 bg-slate-200 rounded animate-pulse" />
            <div className="h-3 w-4 bg-slate-200 rounded animate-pulse" />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ── Tilt card (3D hover) ──────────────────────────────────────────────────────
function TiltCard({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-40, 40], [6, -6]);
  const rotateY = useTransform(x, [-40, 40], [-6, 6]);

  const onMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 600 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      whileHover={{ scale: 1.06, zIndex: 10 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', bounce: 0.3, duration: 0.25 }}
      className={`cursor-zoom-in ${className ?? ''}`}
    >
      {children}
    </motion.div>
  );
}

// ── Zoom modal ────────────────────────────────────────────────────────────────
function ZoomModal({
  images,
  heroId,
  startIndex,
  onClose,
}: {
  images: ProductImage[];
  heroId: string;
  startIndex: number;
  onClose: () => void;
}) {
  const [[idx, dir], setPage] = useState<[number, number]>([startIndex, 0]);
  const img = images[idx];
  const isHero = img.id === heroId;

  const paginate = (d: number) => setPage([(idx + d + images.length) % images.length, d]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') paginate(-1);
      if (e.key === 'ArrowRight') paginate(1);
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    // Backdrop
    <motion.div
      className="fixed inset-0 z-[70] flex items-center justify-center"
      initial={{ backgroundColor: 'rgba(0,0,0,0)' }}
      animate={{ backgroundColor: 'rgba(0,0,0,0.88)' }}
      exit={{ backgroundColor: 'rgba(0,0,0,0)' }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
    >
      {/* Close */}
      <motion.button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/10 hover:bg-white/25 text-white"
        initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
        transition={{ type: 'spring', bounce: 0.5, delay: 0.15 }}
        whileHover={{ scale: 1.15, rotate: 90 }}
        whileTap={{ scale: 0.85 }}
      >
        <X className="h-5 w-5" />
      </motion.button>

      {/* Counter */}
      <motion.div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full bg-white/10 text-white text-sm font-medium tabular-nums"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ type: 'spring', bounce: 0.4, delay: 0.1 }}
      >
        {idx + 1} / {images.length}
      </motion.div>

      {/* Image — uses layoutId when showing the hero, slide for navigation */}
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <AnimatePresence mode="wait" custom={dir}>
          {isHero ? (
            <motion.img
              key="hero"
              layoutId={`img-${heroId}`}
              src={img.url}
              alt={img.filename}
              className="max-h-[82vh] max-w-[82vw] object-contain rounded-xl shadow-2xl block"
              transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
            />
          ) : (
            <motion.img
              key={idx}
              src={img.url}
              alt={img.filename}
              custom={dir}
              variants={{
                enter: (d: number) => ({
                  x: d > 0 ? '45%' : '-45%',
                  opacity: 0,
                  scale: 0.88,
                  rotate: d > 0 ? 4 : -4,
                }),
                center: { x: 0, opacity: 1, scale: 1, rotate: 0 },
                exit: (d: number) => ({
                  x: d > 0 ? '-45%' : '45%',
                  opacity: 0,
                  scale: 0.88,
                  rotate: d > 0 ? -4 : 4,
                }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }}
              className="max-h-[82vh] max-w-[82vw] object-contain rounded-xl shadow-2xl block"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Filename + cover */}
      <motion.div
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 text-white/50 text-xs whitespace-nowrap"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ delay: 0.2 }}
      >
        {img.filename}
        {img.is_cover && <span className="ml-2 text-amber-400 font-semibold">⭐ portada</span>}
      </motion.div>

      {/* Arrows */}
      {images.length > 1 && (
        <>
          {(
            [
              [-1, 'left-4', ChevronLeft],
              [1, 'right-4', ChevronRight],
            ] as const
          ).map(([d, pos, Icon]) => (
            <motion.button
              key={pos}
              onClick={(e) => {
                e.stopPropagation();
                paginate(d);
              }}
              className={`absolute ${pos} top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-white/10 hover:bg-white/25 text-white`}
              initial={{ opacity: 0, x: d > 0 ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: d > 0 ? 20 : -20 }}
              transition={{ type: 'spring', bounce: 0.4, delay: 0.1 }}
              whileHover={{ scale: 1.15, x: d > 0 ? 3 : -3 }}
              whileTap={{ scale: 0.85 }}
            >
              <Icon className="h-6 w-6" />
            </motion.button>
          ))}

          {/* Dots */}
          <motion.div
            className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.2 }}
          >
            {images.map((_, i) => (
              <motion.button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setPage([i, i > idx ? 1 : -1]);
                }}
                className="rounded-full bg-white"
                animate={{
                  width: i === idx ? 20 : 6,
                  height: 6,
                  opacity: i === idx ? 1 : 0.35,
                }}
                transition={{ type: 'spring', bounce: 0.45, duration: 0.35 }}
              />
            ))}
          </motion.div>
        </>
      )}
    </motion.div>
  );
}

// ── ImageManager ──────────────────────────────────────────────────────────────
export function ImageManager({ productId }: Props) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<{ idx: number; heroId: string } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [coverBurst, setCoverBurst] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadImages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch<{ data: ProductImage[] }>(`images?productId=${productId}`);
      setImages(res.data ?? []);
    } catch {
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const uploadFile = async (file: File) => {
    if (!ACCEPTED.includes(file.type)) {
      setUploadError('Tipo no soportado. Usa JPG, PNG o WebP.');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setUploadError(`Máx ${MAX_SIZE_MB} MB.`);
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      await adminFetch('upload', {
        method: 'POST',
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          base64,
          productId,
          setAsCover: images.length === 0,
        }),
      });
      await loadImages();
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Error al subir');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) uploadFile(f);
    e.target.value = '';
  };

  const setCover = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActionId(id);
    try {
      await adminFetch(`images/${id}`, { method: 'PUT', body: JSON.stringify({ is_cover: true }) });
      setCoverBurst(id);
      setTimeout(() => setCoverBurst(null), 700);
      await loadImages();
    } finally {
      setActionId(null);
    }
  };

  const deleteImage = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar esta imagen?')) return;
    setActionId(id);
    try {
      await adminFetch(`images/${id}`, { method: 'DELETE' });
      await loadImages();
    } finally {
      setActionId(null);
    }
  };

  return (
    <LayoutGroup>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between">
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide">
            Imágenes
            <AnimatePresence mode="wait">
              {images.length > 0 && (
                <motion.span
                  key={images.length}
                  className="ml-1.5 text-slate-400 normal-case font-normal"
                  initial={{ opacity: 0, scale: 0.5, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ type: 'spring', bounce: 0.6, duration: 0.4 }}
                >
                  ({images.length})
                </motion.span>
              )}
            </AnimatePresence>
          </label>

          <motion.button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 disabled:opacity-40"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
          >
            <AnimatePresence mode="wait">
              {uploading ? (
                <motion.span
                  key="spin"
                  initial={{ opacity: 0, scale: 0.4, rotate: -180 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.4 }}
                >
                  <Loader2 className="h-3 w-3 animate-spin" />
                </motion.span>
              ) : (
                <motion.span
                  key="up"
                  initial={{ opacity: 0, scale: 0.4, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.4, y: -4 }}
                >
                  <Upload className="h-3 w-3" />
                </motion.span>
              )}
            </AnimatePresence>
            {uploading ? 'Subiendo…' : 'Subir imagen'}
          </motion.button>

          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED.join(',')}
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Error */}
        <AnimatePresence>
          {uploadError && (
            <motion.div
              className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 overflow-hidden"
              initial={{ opacity: 0, height: 0, scaleY: 0.5 }}
              animate={{ opacity: 1, height: 'auto', scaleY: 1 }}
              exit={{ opacity: 0, height: 0, scaleY: 0.5 }}
              transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
            >
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              {uploadError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Body */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="skel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ImageSkeleton />
            </motion.div>
          ) : images.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -12 }}
              transition={{ type: 'spring', bounce: 0.4, duration: 0.5 }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const f = e.dataTransfer.files?.[0];
                if (f) uploadFile(f);
              }}
              onClick={() => fileRef.current?.click()}
            >
              <motion.div
                animate={
                  dragging
                    ? { scale: 1.04, borderColor: '#64748b', backgroundColor: '#f8fafc' }
                    : { scale: 1, borderColor: '#e2e8f0', backgroundColor: 'transparent' }
                }
                transition={{ type: 'spring', bounce: 0.4 }}
                className="flex flex-col items-center justify-center gap-3 h-32 rounded-xl border-2 border-dashed cursor-pointer"
              >
                <motion.div
                  animate={
                    dragging ? { scale: 1.3, y: -4, rotate: -8 } : { scale: 1, y: 0, rotate: 0 }
                  }
                  transition={{ type: 'spring', bounce: 0.5 }}
                >
                  <ImageIcon className="h-7 w-7 text-slate-300" />
                </motion.div>
                <p className="text-xs text-slate-400">
                  {dragging ? '¡Suelta aquí!' : 'Arrastra una imagen o haz clic'}
                </p>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const f = e.dataTransfer.files?.[0];
                if (f) uploadFile(f);
              }}
            >
              <motion.div
                animate={
                  dragging
                    ? { borderColor: '#94a3b8', backgroundColor: '#f8fafc' }
                    : { borderColor: 'transparent', backgroundColor: 'transparent' }
                }
                transition={{ duration: 0.2 }}
                className="grid grid-cols-3 gap-2 p-2 rounded-xl border-2 border-dashed"
              >
                <AnimatePresence mode="popLayout">
                  {images.map((img, i) => (
                    <motion.div
                      key={img.id}
                      layout
                      initial={{ opacity: 0, scale: 0.6, y: 24, rotate: -3 }}
                      animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.45, y: -16, rotate: 8 }}
                      transition={{ type: 'spring', bounce: 0.4, duration: 0.5 }}
                      className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50"
                    >
                      {/* Thumbnail with 3D tilt */}
                      <TiltCard
                        onClick={() => setZoom({ idx: i, heroId: img.id })}
                        className="aspect-square overflow-hidden relative"
                      >
                        <motion.img
                          layoutId={`img-${img.id}`}
                          src={img.url}
                          alt={img.filename}
                          className="w-full h-full object-cover"
                          transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                        />
                        {/* Cover burst overlay */}
                        <AnimatePresence>
                          {coverBurst === img.id && (
                            <motion.div
                              className="absolute inset-0 bg-amber-400/30 flex items-center justify-center"
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 1.5 }}
                              transition={{ duration: 0.4 }}
                            >
                              <motion.span
                                initial={{ scale: 0, rotate: -30 }}
                                animate={{ scale: 1.6, rotate: 0 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ type: 'spring', bounce: 0.6 }}
                                className="text-2xl"
                              >
                                ⭐
                              </motion.span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </TiltCard>

                      {/* Actions bar */}
                      <div className="flex items-center justify-between px-2 py-1.5 bg-white">
                        <motion.button
                          type="button"
                          title={img.is_cover ? 'Portada actual' : 'Establecer como portada'}
                          disabled={img.is_cover || actionId === img.id}
                          onClick={(e) => setCover(e, img.id)}
                          className={`flex items-center gap-1 text-[11px] font-medium rounded px-1.5 py-0.5 transition-colors disabled:cursor-default ${
                            img.is_cover
                              ? 'text-amber-600 bg-amber-50'
                              : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'
                          }`}
                          whileHover={!img.is_cover ? { scale: 1.1 } : {}}
                          whileTap={!img.is_cover ? { scale: 0.85 } : {}}
                        >
                          {actionId === img.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <motion.div
                              animate={
                                img.is_cover
                                  ? { scale: [1, 1.5, 1], rotate: [0, 20, 0] }
                                  : { scale: 1, rotate: 0 }
                              }
                              transition={{ type: 'spring', bounce: 0.6, duration: 0.5 }}
                            >
                              <Star
                                className="h-3 w-3"
                                fill={img.is_cover ? 'currentColor' : 'none'}
                              />
                            </motion.div>
                          )}
                          portada
                        </motion.button>

                        <motion.button
                          type="button"
                          title="Eliminar"
                          disabled={actionId === img.id}
                          onClick={(e) => deleteImage(e, img.id)}
                          className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                          whileHover={{ scale: 1.2, rotate: 8 }}
                          whileTap={{ scale: 0.75, rotate: -8 }}
                          transition={{ type: 'spring', bounce: 0.6 }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Upload cell */}
                <motion.div
                  layout
                  onClick={() => fileRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-slate-200 cursor-pointer flex items-center justify-center"
                  whileHover={{ scale: 1.08, borderColor: '#94a3b8', backgroundColor: '#f8fafc' }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', bounce: 0.4, duration: 0.25 }}
                >
                  <AnimatePresence mode="wait">
                    {uploading ? (
                      <motion.div
                        key="s"
                        initial={{ opacity: 0, scale: 0.3 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.3 }}
                      >
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="u"
                        initial={{ opacity: 0, scale: 0.3 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.3 }}
                      >
                        <Upload className="h-4 w-4 text-slate-300" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Zoom modal */}
        <AnimatePresence>
          {zoom !== null && (
            <ZoomModal
              images={images}
              heroId={zoom.heroId}
              startIndex={zoom.idx}
              onClose={() => setZoom(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
}
