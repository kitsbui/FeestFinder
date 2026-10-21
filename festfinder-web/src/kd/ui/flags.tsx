/**
 * The language switch's flags (owner, 2026-10-20): Vietnam's for Vietnamese, the United States'
 * for English. Drawn by theme.css (`kd-flag-vn`, `kd-flag-us`) in their own colours, so no
 * picture is fetched and no script carries them; the link around a flag carries its language's name.
 */
import { cx } from '../cx';

export const VnFlag = ({ className }: { className?: string }) => <span className={cx('kd-flag-svg kd-flag-vn', className)} aria-hidden="true" />;
export const UsFlag = ({ className }: { className?: string }) => <span className={cx('kd-flag-svg kd-flag-us', className)} aria-hidden="true" />;
