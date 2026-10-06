/**
 * A QR code as an SVG, drawn from the value the door scanner reads (a ticket's signed token).
 * Black modules on white with the quiet zone the standard asks for, so any phone camera reads it.
 */
import qrcode from 'qrcode-generator';

export function QrCode({ value, size = 176, label, className }: { value: string; size?: number; label: string; className?: string }) {
  const qr = qrcode(0, 'M');
  qr.addData(value);
  qr.make();
  const n = qr.getModuleCount();
  let d = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.isDark(y, x)) d += `M${x} ${y}h1v1h-1z`;
  return (
    <svg viewBox={`-3 -3 ${n + 6} ${n + 6}`} width={size} height={size} role="img" aria-label={label} shapeRendering="crispEdges" className={className}>
      <rect x={-3} y={-3} width={n + 6} height={n + 6} fill="#ffffff" />
      <path d={d} fill="#101010" />
    </svg>
  );
}
