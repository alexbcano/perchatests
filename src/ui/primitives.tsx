import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { X, Check } from 'lucide-react';
import type { ColorKey } from '@/domain/types';
import { COLORS, COLOR_KEYS, luminance } from '@/data/demo/colors';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
export { cx };

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'accent' | 'outline' | 'ghost' | 'danger'; size?: 'sm' | 'md' | 'lg'; block?: boolean };
export function Button({ variant = 'primary', size = 'md', block, className, type = 'button', ...rest }: BtnProps) {
  const v = {
    primary: 'bg-ink text-paper hover:opacity-90',
    accent: 'bg-accent text-accent-ink hover:opacity-90',
    outline: 'border border-ink/80 text-ink hover:bg-ink hover:text-paper',
    ghost: 'text-ink hover:bg-tile',
    danger: 'border border-bad text-bad hover:bg-bad-soft',
  }[variant];
  const s = { sm: 'h-9 px-3 text-[13px]', md: 'h-11 px-5 text-sm', lg: 'h-12 px-6 text-[15px]' }[size];
  return <button type={type} className={cx('inline-flex items-center justify-center gap-2 rounded-sm font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap', v, s, block && 'w-full', className)} {...rest} />;
}

export function IconButton({ label, active, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; active?: boolean }) {
  return (
    <button type="button" aria-label={label} title={label} aria-pressed={active} className={cx('inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors', active ? 'bg-ink text-paper' : 'bg-surface/90 text-ink hover:bg-tile', className)} {...rest}>
      {children}
    </button>
  );
}

export function Chip({ selected, onClick, children, tone = 'ink', disabled }: { selected?: boolean; onClick?: () => void; children: ReactNode; tone?: 'ink' | 'bad'; disabled?: boolean }) {
  return (
    <button type="button" disabled={disabled} aria-pressed={selected} onClick={onClick}
      className={cx('inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] transition-colors disabled:opacity-40',
        selected ? (tone === 'bad' ? 'border-bad bg-bad text-white' : 'border-ink bg-ink text-paper') : 'border-line bg-surface text-ink hover:border-ink/60')}>
      {children}
    </button>
  );
}

export function Pill({ tone = 'neutral', children, title }: { tone?: 'neutral' | 'ok' | 'warn' | 'bad' | 'accent' | 'demo'; children: ReactNode; title?: string }) {
  const t = {
    neutral: 'bg-tile text-ink', ok: 'bg-ok-soft text-ok', warn: 'bg-warn-soft text-warn', bad: 'bg-bad-soft text-bad', accent: 'bg-accent-soft text-accent',
    demo: 'border border-dashed border-muted/70 text-muted',
  }[tone];
  return <span title={title} className={cx('inline-flex h-[22px] items-center gap-1 rounded-full px-2 text-2xs font-medium leading-none whitespace-nowrap', t)}>{children}</span>;
}

export const DemoTag = ({ label = 'Demo' }: { label?: string }) => <Pill tone="demo" title="Dato de demostración: no es información comercial real">{label}</Pill>;

export function Field({ id, label, hint, error, children, optional }: { id: string; label: string; hint?: string; error?: string | null; children: ReactNode; optional?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex items-baseline justify-between text-[13px] font-medium">
        <span>{label}</span>{optional && <span className="text-2xs font-normal text-muted">Opcional</span>}
      </label>
      {children}
      {error ? <p className="text-2xs text-bad">{error}</p> : hint ? <p className="text-2xs text-muted">{hint}</p> : null}
    </div>
  );
}

export const inputCls = 'h-11 w-full rounded-sm border border-line bg-surface px-3 text-sm outline-none transition-colors placeholder:text-muted/70 focus:border-ink';

export function NumberInput({ id, value, onChange, unit, min, max, invalid, onFocus, placeholder }: { id: string; value: number | null; onChange: (v: number | null) => void; unit?: string; min?: number; max?: number; invalid?: boolean; onFocus?: () => void; placeholder?: string }) {
  const [text, setText] = useState(value == null ? '' : String(value).replace('.', ','));
  const last = useRef(value);
  useEffect(() => {
    if (value !== last.current) { last.current = value; setText(value == null ? '' : String(value).replace('.', ',')); }
  }, [value]);
  return (
    <div className="relative">
      <input id={id} inputMode="decimal" value={text} placeholder={placeholder} onFocus={onFocus} aria-invalid={invalid}
        onChange={(e) => {
          const t = e.target.value.replace(/[^0-9.,]/g, '');
          setText(t);
          const n = t === '' ? null : parseFloat(t.replace(',', '.'));
          const v = n == null || Number.isNaN(n) ? null : n;
          last.current = v;
          onChange(v);
        }}
        className={cx(inputCls, 'tabular pr-11', invalid && 'border-bad')} />
      {unit && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">{unit}</span>}
      <span className="sr-only">{min != null && max != null ? `Entre ${min} y ${max}` : ''}</span>
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, options, label, size = 'md' }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string; size?: 'sm' | 'md' }) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex max-w-full overflow-x-auto no-scrollbar rounded-full bg-tile p-1">
      {options.map((o) => (
        <button key={o.value} role="tab" type="button" aria-selected={value === o.value} onClick={() => onChange(o.value)}
          className={cx('rounded-full px-4 font-medium transition-colors whitespace-nowrap', size === 'sm' ? 'h-8 text-xs' : 'h-9 text-[13px]', value === o.value ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink')}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Sheet({ open, onClose, title, children, wide, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean; footer?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="anim-fade absolute inset-0 bg-ink/45" onClick={onClose} aria-hidden />
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
        className={cx('anim-sheet relative flex max-h-[92%] w-full flex-col rounded-t-2xl bg-surface shadow-sheet outline-none sm:rounded-md', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}>
        <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-3.5">
          <h2 className="text-base font-semibold">{title}</h2>
          <IconButton label="Cerrar" onClick={onClose} className="-mr-2 bg-transparent"><X size={18} /></IconButton>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-6 pt-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>
  );
}

export function Confirm({ open, title, body, action, onConfirm, onClose }: { open: boolean; title: string; body: string; action: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title={title} footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button variant="danger" onClick={() => { onConfirm(); onClose(); }}>{action}</Button></>}>
      <p className="text-sm text-muted">{body}</p>
    </Sheet>
  );
}

export function ColorDot({ color, size = 18, ring }: { color: ColorKey; size?: number; ring?: boolean }) {
  return <span title={COLORS[color].name} className={cx('inline-block shrink-0 rounded-full border', ring ? 'border-ink ring-2 ring-ink ring-offset-2 ring-offset-surface' : 'border-ink/15')} style={{ width: size, height: size, background: COLORS[color].hex }} />;
}

export function ColorPicker({ value, onChange, exclude = [], tone = 'ink', label }: { value: ColorKey[]; onChange: (v: ColorKey[]) => void; exclude?: ColorKey[]; tone?: 'ink' | 'bad'; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {COLOR_KEYS.map((c) => {
        const on = value.includes(c), off = exclude.includes(c);
        return (
          <button key={c} type="button" disabled={off} aria-pressed={on} aria-label={COLORS[c].name} title={off ? `${COLORS[c].name} (ya está en la otra lista)` : COLORS[c].name}
            onClick={() => onChange(on ? value.filter((x) => x !== c) : [...value, c])}
            className={cx('relative flex h-8 w-8 items-center justify-center rounded-full border transition-transform disabled:opacity-25', on ? (tone === 'bad' ? 'border-bad ring-2 ring-bad ring-offset-2 ring-offset-surface' : 'border-ink ring-2 ring-ink ring-offset-2 ring-offset-surface') : 'border-ink/15 hover:scale-110')}
            style={{ background: COLORS[c].hex }}>
            {on && (tone === 'bad' ? <X size={14} color={luminance(COLORS[c].hex) > 0.6 ? '#14182b' : '#fff'} /> : <Check size={14} color={luminance(COLORS[c].hex) > 0.6 ? '#14182b' : '#fff'} />)}
          </button>
        );
      })}
    </div>
  );
}

export function Meter({ value, tone = 'ink' }: { value: number; tone?: 'ink' | 'ok' | 'warn' | 'bad' | 'accent' }) {
  const bg = { ink: 'bg-ink', ok: 'bg-ok', warn: 'bg-warn', bad: 'bg-bad', accent: 'bg-accent' }[tone];
  return <div className="h-1.5 w-full overflow-hidden rounded-full bg-tile"><div className={cx('h-full rounded-full', bg)} style={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` }} /></div>;
}

export function PageHeader({ title, lead, action }: { title: string; lead?: string; action?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 pb-6 pt-2">
      <div className="min-w-0">
        <h1 className="display text-[2.1rem] leading-[1.05] sm:text-[2.75rem]">{title}</h1>
        {lead && <p className="mt-2 max-w-[60ch] text-sm text-muted">{lead}</p>}
      </div>
      {action}
    </header>
  );
}

export function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-sm border border-dashed border-line px-6 py-10">
      <h3 className="display text-2xl">{title}</h3>
      <p className="max-w-[52ch] text-sm text-muted">{body}</p>
      {action}
    </div>
  );
}

export function Notice({ tone = 'neutral', children }: { tone?: 'neutral' | 'warn' | 'accent'; children: ReactNode }) {
  const t = { neutral: 'bg-tile text-ink', warn: 'bg-warn-soft text-warn', accent: 'bg-accent-soft text-ink' }[tone];
  return <div className={cx('rounded-sm px-4 py-3 text-[13px] leading-relaxed', t)}>{children}</div>;
}

export function Toast({ text }: { text: string | null }) {
  if (!text) return null;
  return <div role="status" className="anim-sheet pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 lg:bottom-8"><div className="max-w-md rounded-2xl bg-ink px-5 py-2.5 text-center text-[13px] font-medium text-paper shadow-lift">{text}</div></div>;
}

/** Redimensiona una foto en el navegador y la devuelve como data URL (no sale del dispositivo). */
export function readImage(file: File, max = 640): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen')); };
    img.src = url;
  });
}
