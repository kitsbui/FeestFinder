/**
 * The sign-in sheet's own lines (design v2 phase 19): loaded with the sheet, not with every page,
 * so the boot JS carries none of them. Lines the sheet shares with other screens stay in COMMON.
 */
export const SIGN_IN = {
  createAccount: { en: 'Create account', vi: 'Tạo tài khoản' },
  errId: { en: 'Enter your email or Zalo number', vi: 'Nhập email hoặc số Zalo' },
  errLoginPass: { en: 'Enter your password', vi: 'Nhập mật khẩu' },
  errPass: { en: 'Use at least 8 characters', vi: 'Dùng ít nhất 8 ký tự' },
  errPass2: { en: 'Passwords don’t match', vi: 'Mật khẩu nhập lại không khớp' },
  loginIdLabel: { en: 'Email or Zalo number', vi: 'Email hoặc số Zalo' },
  loginTitle: { en: 'Welcome back', vi: 'Chào mừng trở lại' },
  otpEmailLink: { en: 'The email also has a link that logs you in with one tap.', vi: 'Email cũng có liên kết bấm một lần là vào.' },
  otpSentEmail: { en: 'Sent by email to', vi: 'Đã gửi qua email tới' },
  pass2Label: { en: 'Confirm password', vi: 'Nhập lại mật khẩu' },
  passHint: { en: 'At least 8 characters', vi: 'Tối thiểu 8 ký tự' },
  passLabel: { en: 'Password', vi: 'Mật khẩu' },
  passTitle: { en: 'Set a password', vi: 'Đặt mật khẩu' },
  withEmail: { en: 'Continue with email', vi: 'Tiếp tục với email' },
  withFacebook: { en: 'Continue with Facebook', vi: 'Tiếp tục với Facebook' },
  withGoogle: { en: 'Continue with Google', vi: 'Tiếp tục với Google' },
  withInstagram: { en: 'Continue with Instagram', vi: 'Tiếp tục với Instagram' },
  withPassword: { en: 'Log in with a password', vi: 'Đăng nhập bằng mật khẩu' },
  withSms: { en: 'Continue with SMS', vi: 'Tiếp tục bằng SMS' },
  withTiktok: { en: 'Continue with TikTok', vi: 'Tiếp tục với TikTok' },
  withWa: { en: 'Continue with WhatsApp', vi: 'Tiếp tục với WhatsApp' },
  withZalo: { en: 'Continue with Zalo', vi: 'Tiếp tục với Zalo' },
} as const;
