// Checkbox con estado indeterminate para "Seleccionar todos"
interface Props {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  label?: string;
}

export function SelectCheckbox({ checked, indeterminate, onChange, label }: Props) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        ref={el => { if (el) el.indeterminate = !!indeterminate; }}
        onChange={onChange}
        className="w-4 h-4 rounded border-slate-300 text-slate-800 accent-slate-800 cursor-pointer"
      />
      {label && <span className="text-xs text-slate-500 select-none">{label}</span>}
    </label>
  );
}
