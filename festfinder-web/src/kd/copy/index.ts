/**
 * Screen text. Every string is an {en, vi} pair; the English comes from the legacy screen's
 * logic.js when it had the same line. `pick(DICT, lang)` gives the strings of one language.
 */
export type Lang = 'vi' | 'en';
export type Pair = { vi: string; en: string };
export type Dict = Record<string, Pair>;
export type Strings<D extends Dict> = { [K in keyof D]: string };

export function pick<D extends Dict>(dict: D, lang: Lang): Strings<D> {
  const out = {} as Strings<D>;
  for (const k of Object.keys(dict) as (keyof D)[]) out[k] = dict[k][lang];
  return out;
}

/** "{n} sự kiện" with the placeholders filled. */
export function fill(s: string, vars: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

/** Strings every surface uses. */
export const COMMON = {
  signIn: { en: 'Log in', vi: 'Đăng nhập' },
  signOut: { en: 'Sign out', vi: 'Đăng xuất' },
  signedOut: { en: 'Signed out', vi: 'Đã đăng xuất' },
  loggedIn: { en: 'Logged in', vi: 'Đã đăng nhập' },
  welcome: { en: 'Account created — welcome', vi: 'Đã tạo tài khoản — chào bạn' },
  close: { en: 'Close', vi: 'Đóng' },
  back: { en: 'Back', vi: 'Quay lại' },
  more: { en: 'Show more', vi: 'Xem thêm' },
  less: { en: 'Show less', vi: 'Thu gọn' },
  moreN: { en: 'Show {n} more', vi: 'Xem thêm {n}' },
  save: { en: 'Save', vi: 'Lưu' },
  saved: { en: 'Saved', vi: 'Đã lưu' },
  unsave: { en: 'Remove from saved', vi: 'Bỏ lưu' },
  share: { en: 'Share', vi: 'Chia sẻ' },
  linkCopied: { en: 'Link copied', vi: 'Đã chép liên kết' },
  follow: { en: 'Follow', vi: 'Theo dõi' },
  following: { en: 'Following', vi: 'Đang theo dõi' },
  free: { en: 'Free', vi: 'Miễn phí' },
  from: { en: 'from', vi: 'từ' },
  soldOut: { en: 'Sold out', vi: 'Hết vé' },
  ended: { en: 'Ended', vi: 'Đã kết thúc' },
  verified: { en: 'Verified', vi: 'Đã xác minh' },
  interested: { en: '{n} interested', vi: '{n} quan tâm' },
  error: { en: 'Something went wrong', vi: 'Đã có lỗi xảy ra' },
  retry: { en: 'Try again', vi: 'Thử lại' },
  undo: { en: 'Undo', vi: 'Hoàn tác' },
  loading: { en: 'Loading', vi: 'Đang tải' },
  // sign-in
  gateSave: { en: 'Log in to save events', vi: 'Đăng nhập để lưu sự kiện' },
  gateFollow: { en: 'Log in to follow', vi: 'Đăng nhập để theo dõi' },
  gateTickets: { en: 'Log in to buy tickets', vi: 'Đăng nhập để mua vé' },
  withGoogle: { en: 'Continue with Google', vi: 'Tiếp tục với Google' },
  withFacebook: { en: 'Continue with Facebook', vi: 'Tiếp tục với Facebook' },
  withEmail: { en: 'Continue with email', vi: 'Tiếp tục với email' },
  withZalo: { en: 'Continue with Zalo', vi: 'Tiếp tục với Zalo' },
  withWa: { en: 'Continue with WhatsApp', vi: 'Tiếp tục với WhatsApp' },
  withPassword: { en: 'Log in with a password', vi: 'Đăng nhập bằng mật khẩu' },
  emailLabel: { en: 'Email address', vi: 'Địa chỉ email' },
  emailPh: { en: 'you@example.com', vi: 'ban@example.com' },
  zaloLabel: { en: 'Zalo number', vi: 'Số Zalo' },
  waLabel: { en: 'WhatsApp number', vi: 'Số WhatsApp' },
  phonePh: { en: '09xx xxx xxx', vi: '09xx xxx xxx' },
  sendCode: { en: 'Send code', vi: 'Gửi mã' },
  otpTitle: { en: 'Enter the code', vi: 'Nhập mã xác minh' },
  otpSentEmail: { en: 'Sent by email to', vi: 'Đã gửi qua email tới' },
  otpSentZalo: { en: 'Sent on Zalo to', vi: 'Đã gửi qua Zalo tới' },
  otpSentWa: { en: 'Sent on WhatsApp to', vi: 'Đã gửi qua WhatsApp tới' },
  otpHint: { en: '6 digits · expires in 10 minutes', vi: '6 chữ số · hết hạn sau 10 phút' },
  verify: { en: 'Verify', vi: 'Xác minh' },
  passTitle: { en: 'Set a password', vi: 'Đặt mật khẩu' },
  passHint: { en: 'At least 8 characters', vi: 'Tối thiểu 8 ký tự' },
  passLabel: { en: 'Password', vi: 'Mật khẩu' },
  pass2Label: { en: 'Confirm password', vi: 'Nhập lại mật khẩu' },
  createAccount: { en: 'Create account', vi: 'Tạo tài khoản' },
  loginTitle: { en: 'Welcome back', vi: 'Chào mừng trở lại' },
  loginIdLabel: { en: 'Email or Zalo number', vi: 'Email hoặc số Zalo' },
  continue: { en: 'Continue', vi: 'Tiếp tục' },
  errEmail: { en: 'That email doesn’t look right', vi: 'Email chưa đúng định dạng' },
  errPhone: { en: 'Enter a valid phone number', vi: 'Số điện thoại chưa hợp lệ' },
  errId: { en: 'Enter your email or Zalo number', vi: 'Nhập email hoặc số Zalo' },
  errOtp: { en: 'Enter the 6-digit code', vi: 'Nhập mã 6 số' },
  errPass: { en: 'Use at least 8 characters', vi: 'Dùng ít nhất 8 ký tự' },
  errPass2: { en: 'Passwords don’t match', vi: 'Mật khẩu nhập lại không khớp' },
  errLoginPass: { en: 'Enter your password', vi: 'Nhập mật khẩu' },
} satisfies Dict;
