// Botones reutilizables para exportar CSV y aplicar acciones masivas (archivar/desarchivar)
import { Download, Archive, ArchiveRestore } from 'lucide-react';

interface ExportCSVButtonProps {
  onExport: () => void;
  selectedCount: number;
  label?: string;
}

export function ExportCSVButton({
  onExport,
  selectedCount,
  label = 'Exportar CSV',
}: ExportCSVButtonProps) {
  return (
    <button
      onClick={onExport}
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
    >
      <Download className="h-4 w-4" />
      {selectedCount > 0 ? `Exportar ${selectedCount} seleccionados` : label}
    </button>
  );
}

interface BulkArchiveButtonsProps {
  selectedCount: number;
  onArchive: () => void;
  onUnarchive: () => void;
}

export function BulkArchiveButtons({
  selectedCount,
  onArchive,
  onUnarchive,
}: BulkArchiveButtonsProps) {
  const disabled = selectedCount === 0;
  return (
    <>
      <button
        onClick={onArchive}
        disabled={disabled}
        title="Archivar seleccionados"
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
      >
        <Archive className="h-4 w-4" />
        Archivar {selectedCount > 0 ? selectedCount : ''}
      </button>
      <button
        onClick={onUnarchive}
        disabled={disabled}
        title="Desarchivar seleccionados"
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
      >
        <ArchiveRestore className="h-4 w-4" />
        Desarchivar {selectedCount > 0 ? selectedCount : ''}
      </button>
    </>
  );
}
