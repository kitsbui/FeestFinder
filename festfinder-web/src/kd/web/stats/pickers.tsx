'use client';
/**
 * The stat page's two pickers (when, city). Each choice is an address the server worked out;
 * choosing one moves there, and the server renders the stat again.
 */
import { useRouter } from 'next/navigation';
import { useOptimistic, useTransition } from 'react';
import { Picker } from '../../ui/menu';

export interface Choice { value: string; label: string; href: string }

export function StatPicker({ label, value, choices }: { label: string; value: string; choices: Choice[] }) {
  const router = useRouter();
  const [, start] = useTransition();
  // The choice shows at once; the page follows when the server answers.
  const [shown, show] = useOptimistic(value);
  return (
    <Picker
      label={label}
      value={shown}
      options={choices.map((c) => ({ value: c.value, label: c.label }))}
      onChange={(v) => {
        const c = choices.find((x) => x.value === v);
        if (!c || v === shown) return;
        start(() => {
          show(v);
          router.push(c.href, { scroll: false });
        });
      }}
    />
  );
}
