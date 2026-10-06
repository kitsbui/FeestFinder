/**
 * Form parts: fields, the segmented control, ticket-tier options, the quantity stepper and
 * the switch. None of them holds state: the screen that uses them does.
 */
import type { ComponentProps, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { MinusIcon, PlusIcon } from '@phosphor-icons/react/ssr';
import { cx } from '../cx';

export function FieldLabel({ htmlFor, children, hint, className }: { htmlFor?: string; children: ReactNode; hint?: ReactNode; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={cx('flex items-baseline justify-between gap-3', className)}>
      <span className="kd-flabel">{children}</span>
      {hint != null ? <span className="kd-s kd-num">{hint}</span> : null}
    </label>
  );
}

interface FieldLook {
  icon?: ReactNode;
  end?: ReactNode;
  glass?: boolean;
  invalid?: boolean;
  boxClass?: string;
}

export function Input({ icon, end, glass, invalid, boxClass, className, ...rest }: FieldLook & ComponentProps<'input'>) {
  return (
    <div className={cx('kd-field', glass && 'kd-field-glass', boxClass)} data-invalid={invalid || undefined}>
      {icon}
      <input className={className} aria-invalid={invalid || undefined} {...rest} />
      {end}
    </div>
  );
}

export function TextArea({ glass, invalid, boxClass, className, ...rest }: FieldLook & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className={cx('kd-field kd-field-tall', glass && 'kd-field-glass', boxClass)} data-invalid={invalid || undefined}>
      <textarea className={className} aria-invalid={invalid || undefined} {...rest} />
    </div>
  );
}

/** A native select in a field: for forms. Pickers on browsing screens use a Menu instead. */
export function Select({ icon, glass, invalid, boxClass, className, children, ...rest }: FieldLook & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cx('kd-field pr-3', glass && 'kd-field-glass', boxClass)} data-invalid={invalid || undefined}>
      {icon}
      <select className={className} aria-invalid={invalid || undefined} {...rest}>{children}</select>
    </div>
  );
}

export function FieldError({ children, id }: { children?: ReactNode; id?: string }) {
  if (!children) return null;
  return <p id={id} role="alert" className="kd-s text-hot">{children}</p>;
}

/** Two or three options. More than that is a dropdown. */
export function Segmented<T extends string>({ value, options, onChange, full, label, className }: {
  value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void; full?: boolean; label: string; className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={cx('kd-seg', full && 'kd-seg-full', className)}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

/** A selectable card (ticket tier): name and price on top, note and status below. */
export function Option({ checked, disabled, onSelect, title, price, note, status, className }: {
  checked: boolean; disabled?: boolean; onSelect?: () => void; title: ReactNode; price?: ReactNode; note?: ReactNode; status?: ReactNode; className?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      disabled={disabled}
      onClick={onSelect}
      className={cx('kd-opt', className)}
    >
      <span className="kd-hs min-w-0">{title}</span>
      <span className="kd-mb kd-num text-right">{price}</span>
      <span className="kd-s min-w-0">{note}</span>
      <span className="justify-self-end">{status}</span>
    </button>
  );
}

export function Stepper({ value, min = 1, max, onChange, label, decLabel, incLabel }: {
  value: number; min?: number; max: number; onChange: (n: number) => void; label: string; decLabel: string; incLabel: string;
}) {
  return (
    <div className="kd-qty" role="group" aria-label={label}>
      <button type="button" aria-label={decLabel} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}>
        <MinusIcon size={16} aria-hidden="true" />
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" aria-label={incLabel} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>
        <PlusIcon size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

/** On/off: the track colour and the knob position both change. */
export function Switch({ checked, onChange, label, disabled, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean; id?: string }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className="kd-switch disabled:opacity-40"
      onClick={() => onChange(!checked)}
    />
  );
}

/** A labelled switch row, the way settings lists show them. */
export function SwitchRow({ label, note, checked, onChange, disabled }: { label: ReactNode; note?: ReactNode; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  const text = typeof label === 'string' ? label : undefined;
  return (
    <div className="flex items-center gap-4 min-h-14 border-b border-line">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="kd-hs">{label}</span>
        {note ? <span className="kd-s">{note}</span> : null}
      </div>
      <Switch checked={checked} onChange={onChange} label={text ?? ''} disabled={disabled} />
    </div>
  );
}
