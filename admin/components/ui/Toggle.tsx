// Toggle switch estilo iOS para el admin
interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function Toggle({ checked, onChange, disabled, size = 'md' }: ToggleProps) {
  const track = size === 'sm' ? 'w-8 h-4' : 'w-10 h-5';
  const thumb = size === 'sm'
    ? `w-3 h-3 ${checked ? 'translate-x-4' : 'translate-x-0.5'}`
    : `w-3.5 h-3.5 ${checked ? 'translate-x-5' : 'translate-x-0.5'}`;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex items-center rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 ${track} ${
        checked ? 'bg-slate-700' : 'bg-slate-300'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`inline-block bg-white rounded-full shadow transition-transform duration-150 ${thumb}`} />
    </button>
  );
}
