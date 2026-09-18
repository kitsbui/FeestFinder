import { L, type Localized } from './i18n.ts';

/** Thrown from handlers; the error hook renders `{ error: { code, message, details } }`. */
export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly text: Localized;
  readonly details?: unknown;

  constructor(status: number, code: string, text: Localized, details?: unknown) {
    super(text.en);
    this.status = status;
    this.code = code;
    this.text = text;
    this.details = details;
  }
}

export const badRequest = (code: string, text: Localized, details?: unknown) => new AppError(400, code, text, details);
export const unauthorized = (text = L('Sign in to continue', 'Đăng nhập để tiếp tục')) => new AppError(401, 'unauthenticated', text);
export const forbidden = (code = 'forbidden', text = L('You do not have access to this', 'Bạn không có quyền truy cập')) => new AppError(403, code, text);
export const notFound = (what = L('Not found', 'Không tìm thấy')) => new AppError(404, 'not_found', what);
export const conflict = (code: string, text: Localized, details?: unknown) => new AppError(409, code, text, details);
export const tooMany = (code: string, text: Localized, details?: unknown) => new AppError(429, code, text, details);

export const readOnlySession = () =>
  new AppError(403, 'read_only_session', L('Read-only while viewing as someone else', 'Chỉ đọc khi đang xem dưới tài khoản khác'));
