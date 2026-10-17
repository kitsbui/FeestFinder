/** Whether the list was opened by the installed app: its start address, or a standalone window. */
export function fromApp(): boolean {
  if (new URLSearchParams(location.search).get('source') === 'app') return true;
  try { return matchMedia('(display-mode: standalone)').matches; } catch { return false; }
}
