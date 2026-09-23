const APP = (FF.data.app || {});
const TODAY = FF.today();

const KIND_ICON = {
  food:'ph-fill ph-bowl-food', drink:'ph-fill ph-beer-stein', coffee:'ph-fill ph-coffee',
  market:'ph-fill ph-storefront', bar:'ph-fill ph-martini', latenight:'ph-fill ph-moon-stars',
  sight:'ph-fill ph-buildings', view:'ph-fill ph-binoculars', walk:'ph-fill ph-footprints'
};

const RAW = [];
const FRIENDS = [];
const ADS = [];
const SETS = {};
const SITE = [];
const INSIDE = {};
let LIVE_AD = null;

/** One event card from /events, in the shape this screen's logic reads. */
function toEvent(c) {
  return {
    id: c.id, slug: c.slug, title: c.title, genre: c.genre,
    dateStart: c.startsOn, dateEnd: c.endsOn !== c.startsOn ? c.endsOn : undefined,
    startTime: c.startTime, endTime: c.endTime,
    venue: c.venue.name || '', area: c.venue.area || '', address: c.venue.address || '',
    lat: c.venue.lat, lng: c.venue.lng, km: c.distanceKm,
    price: c.priceFrom || 0, age: c.age || 'All ages', hype: c.hypeCount || 0,
    badge: c.badge ? c.badge.key : null, badgeLabel: c.badge ? c.badge.label : null,
    featured: !!c.featured, soldOut: !!c.soldOut,
    artists: c.artists || [], lineup: c.lineup || [],
    organizer: c.organizer.name, organizerId: c.organizer.id,
    art: c.coverUrl ? 'url("' + c.coverUrl + '") center/cover no-repeat' : (c.art || 'linear-gradient(135deg,#7A55F6,#B6D9FC)'),
    description: c.description || { en:'', vi:'' }
  };
}

/** Refill the module arrays in place, so signing in needs no page reload. */
function applyApp(d) {
  RAW.length = 0;
  (d.events || []).forEach(c => RAW.push(toEvent(c)));
  EVENTS.length = 0;
  RAW.map(normalize).forEach(e => EVENTS.push(e));
  FRIENDS.length = 0;
  (d.friends || []).forEach(f => FRIENDS.push(f));
  ADS.length = 0;
  (d.ads || []).forEach(a => ADS.push(a));
  LIVE_AD = d.liveAd || null;
}
const INTERESTS = ['EDM','Pop','Indie','Hip-Hop','Jazz','Theatre','Art','Food','Markets','Nightlife','Culture'];

const SRC = {
  email: { label:'Email', icon:'ph-fill ph-envelope-simple', color:'#9DA7BA' },
  wa: { label:'WhatsApp', icon:'ph-fill ph-whatsapp-logo', color:'#25D366' },
  fb: { label:'Facebook', icon:'ph-fill ph-facebook-logo', color:'#6FB0F0' },
  ig: { label:'Instagram', icon:'ph-fill ph-instagram-logo', color:'#E88AA8' },
  zalo: { label:'Zalo', icon:'ph-fill ph-chat-circle-dots', color:'#B6D9FC' }
};
/** Notification chrome, keyed by the kinds /me/notifications returns. */
const NOTIF_ICON = {
  smart_alert:'ph-fill ph-bell-ringing', friend_going:'ph-fill ph-users-three', invite:'ph-fill ph-paper-plane-tilt',
  plan_message:'ph-fill ph-chat-circle-text', plan_payment:'ph-fill ph-hand-coins', ticket:'ph-fill ph-ticket',
  order_paid:'ph-fill ph-ticket', set_reminder:'ph-fill ph-clock-countdown', event_reminder:'ph-bold ph-clock-countdown',
  announcement:'ph-fill ph-megaphone', recap:'ph-fill ph-star', wave:'ph-fill ph-hand-waving',
  price_change:'ph-fill ph-tag', tier_watch:'ph-fill ph-ticket', report_update:'ph-fill ph-flag'
};
const NOTIF_COLOR = {
  smart_alert:'#7A55F6', friend_going:'#C4B8F7', invite:'#7FD3C3', plan_message:'#B6D9FC', plan_payment:'#F0A07F',
  ticket:'#B6D9FC', order_paid:'#6CC7B6', set_reminder:'#F0A07F', event_reminder:'#F0A07F',
  announcement:'#7A55F6', recap:'#FFD35C', wave:'#7FD3C3', price_change:'#E46D4C', tier_watch:'#B6D9FC', report_update:'#F4A3A3'
};

const ZONE_ICON = {
  stage:'ph-fill ph-speaker-high', food:'ph-fill ph-bowl-food', entry:'ph-fill ph-door-open',
  medical:'ph-fill ph-first-aid-kit', toilets:'ph-fill ph-drop', bar:'ph-fill ph-martini', other:'ph-fill ph-map-pin'
};
const ZONE_COLOR = {
  stage:'#B6D9FC', food:'#F0A07F', entry:'#6CC7B6', medical:'#F4A3A3', toilets:'#9DA7BA', bar:'#7A55F6', other:'#9DA7BA'
};
function initialsOf(n) { return n.trim().split(/\s+/).slice(0, 2).map(w => w.charAt(0).toUpperCase()).join(''); }
const GENRES = ['All'].concat(APP.genres || []);
/** Smart Alert choices, taken from what is actually listed in the city. */
const AL_ARTISTS = APP.artists || [];
const AL_ORGS = APP.organizers || [];
const AL_AREAS = APP.areas || [];
const AL_CAPS = [{ v:0 }, { v:300000 }, { v:1000000 }, { v:9e9 }];

const S = {
  obLocTitleA:{en:"What's on",vi:'Có gì'}, obLocTitleB:{en:'around you?',vi:'quanh bạn?'},
  obLocBody:{en:'FeestFinder uses your location to show festivals, gigs and nights out within a few kilometres. Nothing is stored on our side.',
    vi:'FeestFinder dùng vị trí của bạn để hiển thị lễ hội, show diễn và điểm chơi đêm trong bán kính vài km. Chúng tôi không lưu lại dữ liệu này.'},
  obAllow:{en:'Use my location',vi:'Dùng vị trí của tôi'}, obPick:{en:'Pick a city instead',vi:'Chọn thành phố khác'},
  obPrivacy:{en:'Location stays on your device. You can change it any time.',vi:'Vị trí chỉ lưu trên thiết bị của bạn. Bạn có thể đổi bất cứ lúc nào.'},
  obIntTitle:{en:'What are you into?',vi:'Bạn thích gì?'},
  obIntBody:{en:'Pick a few. We use them to sort your feed — you can change this later in Profile.',
    vi:'Chọn vài thể loại. Chúng tôi dùng chúng để sắp xếp feed — bạn có thể đổi sau trong mục Cá nhân.'},
  obGo:{en:'Start exploring',vi:'Bắt đầu khám phá'}, obSkip:{en:'Skip for now',vi:'Bỏ qua'},
  hero1:{en:"What's",vi:'Cuối tuần'}, hero2:{en:'happening',vi:'này'}, hero3:{en:'near you?',vi:'có gì chơi?'},
  heroSub:{en:'Festivals, gigs and nights out around you — picked for your vibe.',
    vi:'Lễ hội, show diễn và điểm chơi quanh bạn — chọn theo gu của bạn.'},
  searchPh:{en:'Search events, artists, venues…',vi:'Tìm sự kiện, nghệ sĩ, địa điểm…'},
  artistPh:{en:'Search artists',vi:'Tìm nghệ sĩ'}, noArtists:{en:'No artists match that search',vi:'Không tìm thấy nghệ sĩ nào'},
  tonight:{en:'Tonight',vi:'Tối nay'}, weekend:{en:'This Weekend',vi:'Cuối tuần'}, next7:{en:'Next 7 Days',vi:'7 ngày tới'}, pickDate:{en:'Pick a Date',vi:'Chọn ngày'},
  artist:{en:'Artist',vi:'Nghệ sĩ'}, clear:{en:'Clear',vi:'Xoá'}, done:{en:'Done',vi:'Xong'}, reset:{en:'Reset filters',vi:'Đặt lại bộ lọc'},
  featured:{en:'Featured',vi:'Nổi bật'}, soldOut:{en:'Sold out',vi:'Hết vé'}, ended:{en:'Ended',vi:'Đã kết thúc'},
  free:{en:'Free',vi:'Miễn phí'}, from:{en:'from',vi:'từ'},
  loadingMore:{en:'Loading more events…',vi:'Đang tải thêm…'}, endOfFeed:{en:"That's everything nearby",vi:'Đã hết sự kiện quanh bạn'},
  emptyTitle:{en:'Nothing here yet',vi:'Chưa có gì ở đây'},
  savedTitle:{en:'Saved',vi:'Đã lưu'}, savedEmptyTitle:{en:'No saved events',vi:'Chưa lưu sự kiện nào'},
  savedEmptyBody:{en:'Tap the heart on any event to keep it here.',vi:'Bấm vào trái tim trên sự kiện để lưu lại đây.'},
  savedSubEmpty:{en:'Events you\u2019re keeping an eye on',vi:'Những sự kiện bạn đang để mắt tới'},
  youreInto:{en:"You're into",vi:'Bạn quan tâm'},
  youreIntoSub:{en:'Your feed is sorted around these. Tap to add or remove.',vi:'Feed của bạn được sắp theo những thể loại này. Bấm để thêm hoặc bỏ.'},
  smartAlert:{en:'Smart Alert',vi:'Cảnh báo thông minh'},
  smartAlertSub:{en:'We\u2019ll ping you when something matches — about once a week.',vi:'Chúng tôi sẽ nhắc bạn khi có sự kiện phù hợp — khoảng một lần mỗi tuần.'},
  smartAlertOff:{en:'Alerts are off. Turn them on to hear about matches.',vi:'Đang tắt cảnh báo. Bật lên để nhận sự kiện phù hợp.'},
  alertEdit:{en:'Adjust genres, artists, organizers, areas and price',vi:'Điều chỉnh thể loại, nghệ sĩ, nhà tổ chức, khu vực và giá'},
  alertTitle:{en:'Alert settings',vi:'Thiết lập cảnh báo'},
  alertSub:{en:'Only events matching all of this reach you.',vi:'Chỉ sự kiện khớp tất cả mục này mới gửi cho bạn.'},
  alertGenres:{en:'Genres',vi:'Thể loại'},
  alertArtists:{en:'Artists',vi:'Nghệ sĩ'},
  alertOrgs:{en:'Organizers',vi:'Nhà tổ chức'},
  alertAreas:{en:'Areas',vi:'Khu vực'},
  alertPrice:{en:'Price ceiling',vi:'Giá tối đa'},
  alertAny:{en:'Any',vi:'Tất cả'},
  alertFree:{en:'Free only',vi:'Chỉ miễn phí'},
  alertMatches:{en:'{n} events match right now',vi:'{n} sự kiện đang khớp'},
  alertSave:{en:'Save alert',vi:'Lưu cảnh báo'},
  alertSaved:{en:'Alert updated',vi:'Đã cập nhật cảnh báo'},
  alertOnToast:{en:'Smart Alert on',vi:'Đã bật cảnh báo'},
  alertOffToast:{en:'Smart Alert off',vi:'Đã tắt cảnh báo'},
  alertNone:{en:'Nothing picked yet',vi:'Chưa chọn gì'},
  language:{en:'Language',vi:'Ngôn ngữ'}, languageSub:{en:'Interface language',vi:'Ngôn ngữ giao diện'},
  hyped:{en:'Hyped events',vi:'Sự kiện bạn đã hype'}, following:{en:'Following',vi:'Đang theo dõi'}, listEvent:{en:'List your event',vi:'Đăng sự kiện của bạn'},
  explore:{en:'Explore',vi:'Khám phá'}, saved:{en:'Saved',vi:'Đã lưu'}, map:{en:'Map',vi:'Bản đồ'}, profile:{en:'Profile',vi:'Cá nhân'},
  hype:{en:'Hype',vi:'Hype'}, save:{en:'Save',vi:'Lưu'}, calendar:{en:'Calendar',vi:'Lịch'}, share:{en:'Share',vi:'Chia sẻ'},
  lineup:{en:'Lineup',vi:'Dàn nghệ sĩ'}, about:{en:'About',vi:'Giới thiệu'}, organizer:{en:'Organizer',vi:'Nhà tổ chức'},
  verified:{en:'Verified organizer',vi:'Nhà tổ chức đã xác minh'}, follow:{en:'Follow',vi:'Theo dõi'},
  refundPolicy:{en:'Refunds up to 7 days before the event, minus the payment fee. After that the organizer decides case by case.',vi:'Hoàn tiền tới trước sự kiện 7 ngày, trừ phí thanh toán. Sau đó nhà tổ chức xét từng trường hợp.'},
  reportCta:{en:'Report this listing',vi:'Báo cáo tin này'},
  reportTitle:{en:'Report this listing',vi:'Báo cáo tin này'},
  reportSub:{en:'A moderator reads every report. Listings with two or more get pulled from the feed while we check.',vi:'Mọi báo cáo đều được kiểm duyệt viên đọc. Tin có từ hai báo cáo sẽ được tạm ẩn để kiểm tra.'},
  reportSend:{en:'Send report',vi:'Gửi báo cáo'},
  reportNote:{en:'We come back to you in the app, usually within a day.',vi:'Chúng tôi phản hồi ngay trong app, thường trong một ngày.'},
  reportSent:{en:'Report sent · thank you',vi:'Đã gửi báo cáo · cảm ơn bạn'},
  rWrong:{en:'Details are wrong',vi:'Thông tin sai'},
  rCancelled:{en:'Event was cancelled',vi:'Sự kiện đã huỷ'},
  rScam:{en:'Looks like a scam',vi:'Có dấu hiệu lừa đảo'},
  rDup:{en:'Posted twice',vi:'Đăng trùng hai lần'},
  rPrice:{en:'Price is not what was listed',vi:'Giá khác với tin đăng'},
  notifPrefs:{en:'Notifications',vi:'Thông báo'},
  notifPrefTitle:{en:'Notifications',vi:'Thông báo'},
  notifPrefSub:{en:'One row per kind of update, one column per channel. Everything off means we never contact you.',vi:'Mỗi dòng là một loại thông tin, mỗi cột là một kênh. Tắt hết nghĩa là chúng tôi không liên hệ bạn.'},
  notifKind:{en:'What happens',vi:'Loại thông tin'},
  notifQuiet:{en:'Nothing between 23:00 and 08:00 except changes to an event starting today.',vi:'Không nhắn từ 23:00 đến 08:00, trừ thay đổi của sự kiện diễn ra trong ngày.'},
  notifOnLine:{en:'{n} channels on',vi:'Đang bật {n} kênh'},
  nrSaved:{en:'Reminders for events you saved',vi:'Nhắc về sự kiện bạn đã lưu'},
  nrTickets:{en:'Last tier and price changes',vi:'Hạng vé cuối và thay đổi giá'},
  nrSets:{en:'Set reminders on the night',vi:'Nhắc giờ diễn trong đêm diễn'},
  nrFriends:{en:'What friends are going to',vi:'Bạn bè sẽ đi đâu'},
  nrOrgs:{en:'Organizers you follow',vi:'Nhà tổ chức bạn theo dõi'},
  getTickets:{en:'Get tickets',vi:'Mua vé'}, freeEntry:{en:'Free entry · get directions',vi:'Vào cửa miễn phí · chỉ đường'},
  soldOutCta:{en:'Sold out',vi:'Đã hết vé'}, endedCta:{en:'Event has ended',vi:'Sự kiện đã kết thúc'},
  ctaNote:{en:'You\u2019ll be redirected to our ticketing partner.',vi:'Bạn sẽ được chuyển sang trang của đối tác bán vé.'},
  shareTitle:{en:'Share this',vi:'Chia sẻ'}, shareSub:{en:'Sends a preview card with the date and venue.',vi:'Gửi kèm thẻ xem trước có ngày và địa điểm.'},
  calTitle:{en:'Add to calendar',vi:'Thêm vào lịch'}, remind24:{en:'Remind me 24 hours before',vi:'Nhắc tôi trước 24 giờ'},
  directions:{en:'Directions',vi:'Chỉ đường'},
  linksTitle:{en:'Links',vi:'Liên kết'},
  linkEvent:{en:'Event page',vi:'Trang sự kiện'},
  linkBrand:{en:'Organizer page',vi:'Trang thương hiệu'},
  linkTickets:{en:'Ticket page',vi:'Trang bán vé'},
  linkOpening:{en:'Opening',vi:'Đang mở'},
  mapAll:{en:'All events near you',vi:'Tất cả sự kiện quanh bạn'},
  account:{en:'Account',vi:'Tài khoản'}, signOut:{en:'Sign out',vi:'Đăng xuất'},
  logIn:{en:'Log in',vi:'Đăng nhập'}, signUp:{en:'Sign up',vi:'Đăng ký'},
  authGateTitle:{en:'Log in to unlock',vi:'Đăng nhập để mở khoá'},
  authGateBody:{en:'Saved events, recommendations picked for your taste and ticket checkout all need an account.',
    vi:'Sự kiện đã lưu, gợi ý theo gu của bạn và mua vé đều cần có tài khoản.'},
  gate1:{en:'Keep events in Saved',vi:'Giữ sự kiện trong mục Đã lưu'},
  gate2:{en:'A feed sorted around what you like',vi:'Feed sắp theo gu của bạn'},
  gate3:{en:'Buy tickets without retyping your details',vi:'Mua vé không cần nhập lại thông tin'},
  gateSavedTitle:{en:'Saved needs an account',vi:'Mục đã lưu cần tài khoản'},
  gateSavedBody:{en:'Log in and every event you heart stays here, on any device.',vi:'Đăng nhập để mọi sự kiện bạn thích được giữ lại đây, trên mọi thiết bị.'},
  gateSave:{en:'Log in to save events',vi:'Đăng nhập để lưu sự kiện'},
  gateTickets:{en:'Log in to buy tickets',vi:'Đăng nhập để mua vé'},
  joinTitle:{en:'Create your account',vi:'Tạo tài khoản'},
  joinSub:{en:'Continue with a social account, or verify an email or WhatsApp number.',vi:'Tiếp tục bằng tài khoản mạng xã hội, hoặc xác minh email / số WhatsApp.'},
  withEmail:{en:'Continue with email',vi:'Tiếp tục với email'},
  withZalo:{en:'Continue with Zalo number',vi:'Tiếp tục với số Zalo'},
  idTitleEmail:{en:'WHAT\u2019S YOUR EMAIL?',vi:'EMAIL CỦA BẠN?'},
  idTitleZalo:{en:'WHAT\u2019S YOUR ZALO NUMBER?',vi:'SỐ ZALO CỦA BẠN?'},
  withWa:{en:'Continue with WhatsApp',vi:'Tiếp tục với WhatsApp'},
  idTitleWa:{en:'WHAT\u2019S YOUR WHATSAPP NUMBER?',vi:'SỐ WHATSAPP CỦA BẠN?'},
  waLabel:{en:'WhatsApp number',vi:'Số WhatsApp'}, waPh:{en:'+84 9xx xxx xxx',vi:'+84 9xx xxx xxx'},
  otpSentWa:{en:'Sent on WhatsApp to',vi:'Đã gửi qua WhatsApp tới'},
  viaWa:{en:'Verified on WhatsApp',vi:'Đã xác minh qua WhatsApp'},
  errWa:{en:'Enter a valid phone number',vi:'Số điện thoại chưa hợp lệ'},
  idSub:{en:'We send a 6-digit code to verify it. No spam, ever.',vi:'Chúng tôi gửi mã 6 số để xác minh. Không spam.'},
  emailLabel:{en:'Email address',vi:'Địa chỉ email'}, emailPh:{en:'you@example.com',vi:'ban@example.com'},
  zaloLabel:{en:'Zalo number',vi:'Số Zalo'}, zaloPh:{en:'09xx xxx xxx',vi:'09xx xxx xxx'},
  sendCode:{en:'Send code',vi:'Gửi mã'},
  otpTitle:{en:'Enter the code',vi:'Nhập mã xác minh'},
  otpSentEmail:{en:'Sent by email to',vi:'Đã gửi qua email tới'},
  otpSentZalo:{en:'Sent on Zalo to',vi:'Đã gửi qua Zalo tới'},
  otpHint:{en:'Any 6 digits work here.',vi:'Bản mẫu: nhập 6 số bất kỳ.'},
  otpResend:{en:'Resend code',vi:'Gửi lại mã'}, otpResent:{en:'Code sent again',vi:'Đã gửi lại mã'},
  verify:{en:'Verify',vi:'Xác minh'},
  passTitle:{en:'Set a password',vi:'Đặt mật khẩu'},
  passSub:{en:'At least 8 characters. You\u2019ll use it with your email or Zalo number to log in.',
    vi:'Tối thiểu 8 ký tự. Bạn sẽ dùng cùng email hoặc số Zalo để đăng nhập.'},
  passLabel:{en:'Password',vi:'Mật khẩu'}, pass2Label:{en:'Confirm password',vi:'Nhập lại mật khẩu'},
  createAccount:{en:'Create account',vi:'Tạo tài khoản'},
  loginTitle:{en:'Welcome back',vi:'Chào mừng trở lại'},
  loginSub:{en:'Use the email or Zalo number you registered with.',vi:'Dùng email hoặc số Zalo bạn đã đăng ký.'},
  loginIdLabel:{en:'Email or Zalo number',vi:'Email hoặc số Zalo'},
  loginIdPh:{en:'you@example.com or 09xx xxx xxx',vi:'ban@example.com hoặc 09xx xxx xxx'},
  loginPassTitle:{en:'Enter your password',vi:'Nhập mật khẩu'},
  loginPassSub:{en:'The password you set when you registered.',vi:'Mật khẩu bạn đã đặt khi đăng ký.'},
  continueCta:{en:'Continue',vi:'Tiếp tục'},
  forgot:{en:'Forgot password?',vi:'Quên mật khẩu?'}, forgotToast:{en:'Reset code sent',vi:'Đã gửi mã đặt lại'},
  haveAccount:{en:'Already have an account?',vi:'Đã có tài khoản?'},
  noAccount:{en:'New to FeestFinder?',vi:'Chưa có tài khoản?'},
  viaEmail:{en:'Verified by email',vi:'Đã xác minh qua email'}, viaZalo:{en:'Verified on Zalo',vi:'Đã xác minh qua Zalo'},
  errEmail:{en:'That email doesn\u2019t look right',vi:'Email chưa đúng định dạng'},
  errZalo:{en:'Enter a valid Vietnamese number',vi:'Số điện thoại chưa hợp lệ'},
  errId:{en:'Enter your email or Zalo number',vi:'Nhập email hoặc số Zalo'},
  errOtp:{en:'Enter the 6-digit code',vi:'Nhập mã 6 số'},
  errPass:{en:'Use at least 8 characters',vi:'Dùng ít nhất 8 ký tự'},
  errPass2:{en:'Passwords don\u2019t match',vi:'Mật khẩu nhập lại không khớp'},
  errLoginPass:{en:'Enter your password',vi:'Nhập mật khẩu'},
  welcomeToast:{en:'Account created — welcome',vi:'Đã tạo tài khoản — chào bạn'},
  loggedInToast:{en:'Logged in',vi:'Đã đăng nhập'}, signedOutToast:{en:'Signed out',vi:'Đã đăng xuất'},
  editProfile:{en:'Edit profile',vi:'Sửa thông tin'},
  profileTitle:{en:'Your profile',vi:'Thông tin của bạn'},
  profileSub:{en:'Used on your tickets and to reach you about the events you save.',
    vi:'Dùng trên vé của bạn và để liên hệ về những sự kiện bạn đã lưu.'},
  nameLabel:{en:'Display name',vi:'Tên hiển thị'}, namePh:{en:'Nguyễn Minh',vi:'Nguyễn Minh'},
  cityLabel:{en:'City',vi:'Thành phố'}, cityPh:{en:'Ho Chi Minh City',vi:'TP. Hồ Chí Minh'},
  saveChanges:{en:'Save changes',vi:'Lưu thay đổi'}, cancel:{en:'Cancel',vi:'Huỷ'},
  profileSaved:{en:'Profile updated',vi:'Đã cập nhật thông tin'},
  loginIdNote:{en:'You log in with this',vi:'Bạn đăng nhập bằng thông tin này'},
  uploadPhoto:{en:'Upload profile picture',vi:'Tải ảnh đại diện'},
  changePhoto:{en:'Change picture',vi:'Đổi ảnh'}, removePhoto:{en:'Remove',vi:'Xoá ảnh'},
  photoHint:{en:'A photo or your brand logo. JPG or PNG, square works best.',vi:'Ảnh cá nhân hoặc logo thương hiệu. JPG hoặc PNG, ảnh vuông đẹp nhất.'},
  socialTitle:{en:'Continue with a social account',vi:'Tiếp tục bằng tài khoản mạng xã hội'},
  socialOr:{en:'or use email / WhatsApp number',vi:'hoặc dùng email / số WhatsApp'},
  socialWith:{en:'Continue with',vi:'Tiếp tục với'},
  socialWhy:{en:'We read your name, picture and friend list to find who else is going. Nothing is posted.',
    vi:'Chúng tôi chỉ đọc tên, ảnh và danh sách bạn bè để tìm ai cũng đi. Không đăng gì lên trang của bạn.'},
  connected:{en:'Connected accounts',vi:'Tài khoản đã liên kết'},
  connectHint:{en:'Connect one to see which friends are going.',vi:'Liên kết để xem bạn bè nào sẽ đi.'},
  connect:{en:'Connect',vi:'Liên kết'}, connectedToast:{en:'Connected',vi:'Đã liên kết'},
  disconnectedToast:{en:'Disconnected',vi:'Đã bỏ liên kết'},
  cxTitleWord:{en:'Connect',vi:'Liên kết'},
  cxSubPhone:{en:'Enter the number on this account. We send a 6-digit code to confirm it is yours.',vi:'Nhập số dùng cho tài khoản này. Chúng tôi gửi mã 6 số để xác nhận.'},
  cxSubRedirect:{en:'You log in on their site first, then come back here to confirm the connection.',vi:'Bạn đăng nhập trên trang của họ trước, rồi quay lại đây xác nhận liên kết.'},
  cxGo:{en:'Continue to',vi:'Tiếp tục tới'},
  cxTitleConfirm:{en:'Confirm connection',vi:'Xác nhận liên kết'},
  cxSubConfirm:{en:'Logged in. Confirm what FeestFinder may read:',vi:'Đã đăng nhập. Xác nhận những gì FeestFinder được đọc:'},
  cxScope1:{en:'Your name and profile photo',vi:'Tên và ảnh đại diện'},
  cxScope2:{en:'Your friend list, to find who else is going',vi:'Danh sách bạn bè, để tìm ai cũng đi'},
  cxScope3:{en:'Nothing is ever posted for you',vi:'Không bao giờ đăng gì thay bạn'},
  cxConfirmCta:{en:'Confirm connection',vi:'Xác nhận liên kết'},
  connectFriends:{en:'Connect with friends',vi:'Kết nối với bạn bè'},
  friendsTitle:{en:'Friends',vi:'Bạn bè'},
  friendsGoing:{en:'going',vi:'sẽ đi'},
  friendsGoingTitle:{en:'Friends going',vi:'Bạn bè sẽ đi'},
  friendsFilter:{en:'Friends going',vi:'Có bạn đi'},
  becauseFriends:{en:'Because your friends are going',vi:'Vì bạn bè của bạn sẽ đi'},
  alsoInterested:{en:'is also interested',vi:'cũng đang quan tâm'},
  andOthers:{en:'and {n} others',vi:'và {n} người khác'},
  friendsSaved:{en:'{n} friends saved this since yesterday',vi:'{n} người bạn đã lưu sự kiện này từ hôm qua'},
  youreGoing:{en:'You\u2019re going — friends can see this',vi:'Bạn sẽ đi — bạn bè có thể thấy'},
  calPrivacy:{en:'Adding to your calendar tells friends you\u2019re going.',vi:'Thêm vào lịch sẽ cho bạn bè biết bạn đi.'},
  chat:{en:'Chat',vi:'Nhắn tin'}, follow:{en:'Follow',vi:'Theo dõi'}, followingLabel:{en:'Following',vi:'Đang theo dõi'},
  invite:{en:'Invite',vi:'Mời'}, inviteFriends:{en:'Invite friends',vi:'Mời bạn bè'},
  inviteTitle:{en:'Invite friends',vi:'Mời bạn bè'},
  inviteSub:{en:'Everyone you pick joins one group with the meeting point and the ticket split.',vi:'Người bạn chọn sẽ vào cùng một nhóm có điểm hẹn và phần chia tiền vé.'},
  inviteSend:{en:'Send invites',vi:'Gửi lời mời'},
  inviteSent:{en:'Invites sent to {n} friends',vi:'Đã mời {n} người bạn'},
  inviteSent1:{en:'Invite sent to {n} friend',vi:'Đã mời {n} người bạn'},
  inviteNone:{en:'Pick at least one friend',vi:'Chọn ít nhất một người'},
  planCta:{en:'Start a group',vi:'Tạo nhóm đi cùng'},
  planTitle:{en:'Go together',vi:'Rủ nhau đi cùng'},
  planTabG:{en:'Group',vi:'Nhóm'}, planTabC:{en:'Chat',vi:'Chat'},
  planReqHint:{en:'Send one request and everyone pays into the same reference, so you can see who settled.',vi:'Gửi một yêu cầu, cả nhóm chuyển cùng một nội dung để bạn biết ai đã trả.'},
  planOwedLine:{en:'{n} still owe you {v}',vi:'{n} người còn nợ bạn {v}'},
  payReqTitle:{en:'Request by {m}',vi:'Yêu cầu qua {m}'},
  payReqSub:{en:'{n} people · {v} each',vi:'{n} người · mỗi người {v}'},
  payReqAmount:{en:'Each person pays',vi:'Mỗi người trả'},
  payReqAccount:{en:'Nguyễn Minh · Vietcombank •••• 8842',vi:'Nguyễn Minh · Vietcombank •••• 8842'},
  payReqSend:{en:'Send request in group chat',vi:'Gửi yêu cầu vào chat nhóm'},
  payReqCopy:{en:'Copy the transfer details',vi:'Copy thông tin chuyển khoản'},
  payReqCopied:{en:'Transfer details copied',vi:'Đã copy thông tin chuyển khoản'},
  payReqNote:{en:'The QR carries the amount and the reference. Nothing leaves this group.',vi:'Mã QR đã gẩm số tiền và nội dung. Không ai ngoài nhóm thấy.'},
  payReqSent:{en:'Request sent to the group',vi:'Đã gửi yêu cầu cho nhóm'},
  payMsg:{en:'Ticket money: {v} each. QR is in the chat, reference {r}.',vi:'Tiền vé: {v}/người. Mã QR ở trong chat, nội dung {r}.'},
  walletApple:{en:'Apple Wallet',vi:'Apple Wallet'},
  walletGoogle:{en:'Google Wallet',vi:'Google Wallet'},
  walletAdded:{en:'Pass added · it opens from the lock screen at the gate',vi:'Đã thêm vé · mở ngay từ màn hình khoá khi tới cổng'},
  offOn:{en:'Offline',vi:'Ngoại tuyến'}, offOff:{en:'Online',vi:'Có mạng'},
  offlineSim:{en:'Prototype: switch the connection',vi:'Bản mẫu: đổi trạng thái kết nối'},
  offlineBanner:{en:'No signal. Your tickets, saved events and set times are on the device — everything here still works.',vi:'Không có mạng. Vé, sự kiện đã lưu và giờ diễn đều nằm trên máy — mọi thứ ở đây vẫn dùng được.'},
  ticketOffReady:{en:'Stored on this device · scans with no signal',vi:'Đã lưu trên máy · quét được khi mất mạng'},
  ticketOffNow:{en:'Working offline · this code still scans at the gate',vi:'Đang ngoại tuyến · mã này vẫn quét được ở cổng'},
  liveOfflineOn:{en:'No signal. Set times and the site map are cached; friend positions resume when you reconnect.',vi:'Mất mạng. Giờ diễn và bản đồ đã lưu sẵn; vị trí bạn bè sẽ cập nhật lại khi có mạng.'},
  livePins:{en:'{n} friends on the site',vi:'{n} người bạn đang trong khu'},
  livePinHint:{en:'{n} · tap to wave',vi:'{n} · bấm để chào'},
  planMembers:{en:'Members',vi:'Thành viên'},
  planYou:{en:'You',vi:'Bạn'}, planGoing:{en:'Going',vi:'Đi'}, planPending:{en:'Waiting',vi:'Chờ trả lời'},
  planSpot:{en:'Meeting point',vi:'Điểm hẹn'},
  planSpotHint:{en:'Pick one and everyone gets it in the group.',vi:'Chọn một điểm, cả nhóm nhận được ngay.'},
  planSpotSet:{en:'Meeting point set · {n}',vi:'Đã chốt điểm hẹn · {n}'},
  planSplit:{en:'Ticket split',vi:'Chia tiền vé'},
  planSplitHint:{en:'You booked for the group. Track who has paid you back.',vi:'Bạn ứng vé cho nhóm. Theo dõi ai đã trả lại.'},
  planTotalAll:{en:'Group total',vi:'Tổng nhóm'}, planPer:{en:'Per person',vi:'Mỗi người'},
  planPaid:{en:'Paid',vi:'Đã trả'}, planUnpaid:{en:'Unpaid',vi:'Chưa trả'},
  planPaidCount:{en:'{a}/{b} paid you back',vi:'{a}/{b} đã trả lại'},
  planReminded:{en:'Reminder sent to {n}',vi:'Đã nhắc {n}'},
  planFree:{en:'Free entry — nothing to split.',vi:'Vào cổng miễn phí — không cần chia tiền.'},
  planWaitAll:{en:'Nobody has answered yet.',vi:'Chưa ai trả lời lời mời.'},
  planCreated:{en:'Group started · {n} people',vi:'Đã tạo nhóm · {n} người'},
  planAccepted:{en:'{n} is in',vi:'{n} nhận đi cùng'},
  planRow:{en:'Go-together group',vi:'Nhóm đi cùng'},
  planPeople:{en:'{n} going',vi:'{n} người đi'},
  planChatPh:{en:'Message the group…',vi:'Nhắn cho nhóm…'},
  planChatStart:{en:'Sort out timing, tickets and who rides with who.',vi:'Chốt giờ gặp, ai mua vé, ai chở ai.'},
  inboxOnline:{en:'Online',vi:'Đang online'}, inboxOffline:{en:'Offline',vi:'Ngoại tuyến'},
  inboxInvite:{en:'Invitation sent',vi:'Đã gửi lời mời'},
  inviteCard:{en:'Come with me?',vi:'Đi cùng mình nha?'},
  nInviteSent:{en:'Invitation delivered',vi:'Lời mời đã gửi'},
  nInviteBody:{en:'{n} · in their inbox',vi:'{n} · đã vào hộp thư của họ'},
  followTitle:{en:'Following',vi:'Đang theo dõi'},
  followSub:{en:'You get a notification when these organizers publish something new, and their events come first in your feed.',
    vi:'Bạn nhận thông báo khi những nhà tổ chức này đăng sự kiện mới, và sự kiện của họ được xếp lên đầu feed.'},
  followUn:{en:'Unfollow',vi:'Bỏ theo dõi'}, followDo:{en:'Follow',vi:'Theo dõi'},
  followEmpty:{en:'You are not following anyone yet.',vi:'Bạn chưa theo dõi nhà tổ chức nào.'},
  followNext:{en:'Next',vi:'Sắp tới'}, followNone:{en:'Nothing announced',vi:'Chưa có sự kiện mới'},
  followEvents:{en:'{n} events',vi:'{n} sự kiện'},
  followOff:{en:'Unfollowed {n}',vi:'Đã bỏ theo dõi {n}'}, followOn:{en:'Following {n}',vi:'Đang theo dõi {n}'},
  followDiscover:{en:'Also on FeestFinder',vi:'Cũng có trên FeestFinder'},
  hypedTitle:{en:'Hyped events',vi:'Sự kiện đã hype'},
  hypedSub:{en:'Closest first.',vi:'Gần nhất lên trước.'},
  hypedEmpty:{en:'Nothing hyped yet. Tap 🔥 on an event.',vi:'Chưa hype sự kiện nào. Bấm 🔥 trên một sự kiện.'},
  hypedPast:{en:'Past',vi:'Đã qua'},
  hypedShowPast:{en:'Show past ({n})',vi:'Hiện đã qua ({n})'},
  hypedHidePast:{en:'Hide past ({n})',vi:'Ẩn đã qua ({n})'},
  guideRow:{en:'Before & after the show',vi:'Trước & sau show'},
  guideRowSub:{en:'Eat, drink and what to wear around {n}',vi:'Ăn, uống và mặc gì quanh {n}'},
  guideTitle:{en:'Around this event',vi:'Quanh sự kiện này'},
  guideBefore:{en:'Before doors',vi:'Trước giờ mở cửa'},
  guideAfter:{en:'After the show',vi:'Sau khi show tan'},
  guideExplore:{en:'Worth a detour',vi:'Đáng ghé'},
  guideWear:{en:'What to wear',vi:'Mặc gì'},
  guideAvoid:{en:'Skip',vi:'Tránh'},
  guideTip:{en:'One tip',vi:'Một mẹo'},
  guideLoading:{en:'Reading the neighbourhood…',vi:'Đang đọc khu vực quanh đây…'},
  guideErr:{en:'Could not load suggestions.',vi:'Chưa tải được gợi ý.'},
  guideRetry:{en:'Try again',vi:'Thử lại'},
  guideRefresh:{en:'Other suggestions',vi:'Gợi ý khác'},
  guideAi:{en:'AI suggestions — check opening hours before you go.',vi:'Gợi ý do AI tạo — kiểm tra giờ mở cửa trước khi đi.'},
  bTitle:{en:'FeestFinder besties',vi:'FeestFinder besties'},
  bArmed:{en:'Besties light up at {t}',vi:'Besties sáng đèn lúc {t}'},
  bArmedSub:{en:'An hour in, every checked-in phone here glows at once.',vi:'Sau một giờ, mọi điện thoại đã check-in ở đây cùng sáng lên.'},
  bNow:{en:'Light it now',vi:'Sáng đèn ngay'},
  bHead:{en:'Lift your phone',vi:'Nâng điện thoại lên'},
  bSub:{en:'{n} people here share your taste. Look for the same glow.',vi:'{n} người ở đây cùng gu với bạn. Tìm ánh sáng giống bạn.'},
  bNear:{en:'Closest to you',vi:'Gần bạn nhất'},
  bShared:{en:'Both into',vi:'Cùng thích'},
  bWave:{en:'Wave',vi:'Chào'}, bWaved:{en:'Waved',vi:'Đã chào'},
  bWaveToast:{en:'Wave sent to {n}',vi:'Đã chào {n}'},
  bDismiss:{en:'Dim my screen',vi:'Tắt đèn màn hình'},
  bAfter:{en:'Where to go after',vi:'Sau show đi đâu'},
  chatPh:{en:'Message…',vi:'Nhập tin nhắn…'},
  chatStart:{en:'Say hi — messages stay between the two of you.',vi:'Chào một câu — tin nhắn chỉ hai người thấy.'},
  mutual:{en:'events in common',vi:'sự kiện chung'},
  noFriendsTitle:{en:'No friends connected',vi:'Chưa liên kết bạn bè'},
  noFriendsBody:{en:'Connect Facebook, Instagram or Zalo and we\u2019ll show which of your friends are going.',
    vi:'Liên kết Facebook, Instagram hoặc Zalo để xem bạn bè nào đang đi.'},
  friendsOnPin:{en:'friends going',vi:'bạn sẽ đi'},
  genreLabel:{en:'Genre',vi:'Thể loại'},
  sponsored:{en:'Sponsored',vi:'Được tài trợ'},
  adWhy:{en:'Why this ad?',vi:'Vì sao thấy quảng cáo này?'},
  adWhyBody:{en:'You are browsing festivals in your city. Brands target the city and the genre, never your name or your saved events.',
    vi:'Bạn đang xem lễ hội ở thành phố của bạn. Thương hiệu chỉ nhắm theo thành phố và thể loại, không theo tên hay sự kiện bạn đã lưu.'},
  adHide:{en:'Hide this ad',vi:'Ẩn quảng cáo này'},
  adHidden:{en:'Hidden. Fewer ads from this brand.',vi:'Đã ẩn. Sẽ ít quảng cáo từ thương hiệu này hơn.'},
  liveCta:{en:'Live mode',vi:'Chế độ trực tiếp'},
  recapCta:{en:'Rate the night',vi:'Đánh giá đêm nhạc'},
  liveTitle:{en:'Live mode',vi:'Đang diễn ra'},
  liveNow:{en:'On now',vi:'Đang diễn'},
  liveNext:{en:'Next',vi:'Tiếp theo'},
  liveLeft:{en:'{n} min left',vi:'Còn {n} phút'},
  liveSets:{en:'Set times',vi:'Giờ diễn'},
  liveStageMap:{en:'Site map',vi:'Bản đồ khu vực'},
  liveFriends:{en:'Friends inside',vi:'Bạn bè bên trong'},
  liveMeet:{en:'Meeting point',vi:'Điểm hẹn'},
  liveMeetSet:{en:'Food court, left of Mainstage',vi:'Khu ăn uống, bên trái Mainstage'},
  liveMeetCta:{en:'Send my location',vi:'Gửi vị trí của tôi'},
  liveMeetSent:{en:'Location sent to the group',vi:'Đã gửi vị trí cho nhóm'},
  livePlayed:{en:'Played',vi:'Đã diễn'},
  liveRemind:{en:'Remind me',vi:'Nhắc tôi'},
  liveReminded:{en:'Reminder set · {n}',vi:'Đã đặt nhắc · {n}'},
  liveAt:{en:'at',vi:'đang ở'},
  liveWave:{en:'Wave',vi:'Chào'},
  liveWaved:{en:'Waved at {n}',vi:'Đã chào {n}'},
  liveOffline:{en:'Set times work offline. Everything here is cached.',vi:'Giờ diễn xem được khi mất mạng. Tất cả đã được lưu sẵn.'},
  liveStages:{en:'Stages',vi:'Sân khấu'},
  recapTitle:{en:'That was the night',vi:'Đêm nhạc đã qua'},
  recapSub:{en:'Rate it while it is fresh. The organiser sees the average, never your name.',vi:'Đánh giá khi còn nóng. Nhà tổ chức chỉ thấy điểm trung bình, không thấy tên bạn.'},
  recapRate:{en:'How was it?',vi:'Đêm đó thế nào?'},
  recapStars:{en:'Tap a star',vi:'Chạm vào ngôi sao'},
  recapAspects:{en:'What stood out?',vi:'Điều gì nổi bật?'},
  aspSound:{en:'Sound',vi:'Âm thanh'}, aspCrowd:{en:'Crowd',vi:'Khán giả'},
  aspValue:{en:'Worth the ticket',vi:'Xứng giá vé'}, aspOrg:{en:'Organisation',vi:'Tổ chức'},
  aspQueue:{en:'Queues',vi:'Xếp hàng'}, aspFood:{en:'Food',vi:'Đồ ăn'},
  recapPhotos:{en:'Your photos',vi:'Ảnh của bạn'},
  recapPhotosHint:{en:'Add up to three. They appear on the event page with your first name.',vi:'Thêm tối đa ba ảnh. Ảnh hiện trên trang sự kiện kèm tên bạn.'},
  recapAddPhoto:{en:'Add photo',vi:'Thêm ảnh'},
  recapNight:{en:'Your night',vi:'Đêm của bạn'},
  recapCheckedAt:{en:'Checked in',vi:'Vào cửa'},
  recapSetsSeen:{en:'Sets caught',vi:'Set đã xem'},
  recapFriendsThere:{en:'Friends there',vi:'Bạn bè có mặt'},
  recapSubmit:{en:'Post my rating',vi:'Gửi đánh giá'},
  recapDone:{en:'Rating posted — thank you',vi:'Đã gửi đánh giá — cảm ơn bạn'},
  recapNeedStars:{en:'Pick a star rating first',vi:'Chọn số sao trước đã'},
  recapNextTitle:{en:'Next from this organiser',vi:'Sự kiện tiếp theo của nhà tổ chức'},
  recapNextOther:{en:'Coming up near you',vi:'Sắp tới gần bạn'},
  recapThanks:{en:'Thanks for coming',vi:'Cảm ơn bạn đã đến'},
  photoAdded:{en:'Photo added',vi:'Đã thêm ảnh'},
  myTickets:{en:'My tickets',vi:'Vé của tôi'},
  ticketsTitle:{en:'My tickets',vi:'Vé của tôi'},
  ticketsSub:{en:'Show the QR at the door. It works offline.',vi:'Đưa mã QR ở cổng. Không cần mạng vẫn quét được.'},
  ticketsEmptyTitle:{en:'No tickets yet',vi:'Chưa có vé nào'},
  ticketsEmptyBody:{en:'Tickets you buy land here with a QR code.',vi:'Vé bạn mua sẽ nằm ở đây kèm mã QR.'},
  ticket:{en:'ticket',vi:'vé'}, ticketsWord:{en:'tickets',vi:'vé'},
  ticketValid:{en:'Valid',vi:'Còn hiệu lực'}, ticketUsed:{en:'Checked in',vi:'Đã check-in'},
  checkIn:{en:'Check in',vi:'Check-in'},
  ticketCode:{en:'Ticket code',vi:'Mã vé'},
  checkoutTitle:{en:'Confirm your order',vi:'Xác nhận đơn hàng'},
  qtyLabel:{en:'Tickets',vi:'Số lượng vé'},
  totalLabel:{en:'Total',vi:'Tổng cộng'},
  feeLabel:{en:'Service fee',vi:'Phí dịch vụ'},
  payNow:{en:'Pay and get tickets',vi:'Thanh toán và nhận vé'},
  payNote:{en:'Demo checkout — no card is charged.',vi:'Bản mẫu — không trừ tiền thật.'},
  ticketDone:{en:'Tickets are in My tickets',vi:'Vé đã vào mục Vé của tôi'},
  checkedInToast:{en:'Checked in — enjoy the show',vi:'Đã check-in — chúc bạn vui'},
  notifTitle:{en:'Notifications',vi:'Thông báo'},
  notifEmpty:{en:'Nothing new right now',vi:'Chưa có gì mới'},
  notifReadAll:{en:'Mark all read',vi:'Đánh dấu đã đọc'},
  nTicket:{en:'Your tickets are ready',vi:'Vé của bạn đã sẵn sàng'},
  nFriendGoing:{en:'is going to',vi:'sẽ đi'},
  nAlert:{en:'New matches for your alert',vi:'Có sự kiện khớp cảnh báo của bạn'},
  nSoon:{en:'Coming up soon',vi:'Sắp diễn ra'},
  nGate:{en:'Log in to get notifications',vi:'Đăng nhập để nhận thông báo'}
};

const MONTHS = { en:['January','February','March','April','May','June','July','August','September','October','November','December'],
  vi:['Tháng Một','Tháng Hai','Tháng Ba','Tháng Tư','Tháng Năm','Tháng Sáu','Tháng Bảy','Tháng Tám','Tháng Chín','Tháng Mười','Tháng Mười Một','Tháng Mười Hai'] };
const WD = { en:['M','T','W','T','F','S','S'], vi:['T2','T3','T4','T5','T6','T7','CN'] };
const DAY_SHORT = { en:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], vi:['CN','T2','T3','T4','T5','T6','T7'] };
const MON_SHORT = { en:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  vi:['Th1','Th2','Th3','Th4','Th5','Th6','Th7','Th8','Th9','Th10','Th11','Th12'] };

function d(str) { const p = str.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
function dayKey(x) { return x.getFullYear() + '-' + x.getMonth() + '-' + x.getDate(); }
function haversine(a, b, c, e) {
  const R = 6371, r = Math.PI / 180, dLat = (c - a) * r, dLng = (e - b) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
const USER = APP.here || { lat: 10.7769, lng: 106.7009 };

function weekendRange() {
  const wd = TODAY.getDay();
  const toFri = wd === 0 || wd === 6 ? -(wd === 0 ? 2 : 1) : 5 - wd;
  const fri = new Date(TODAY); fri.setDate(TODAY.getDate() + toFri);
  const sun = new Date(fri); sun.setDate(fri.getDate() + 2);
  return [fri, sun];
}

function normalize(ev) {
  const ds = d(ev.dateStart), de = ev.dateEnd ? d(ev.dateEnd) : ds;
  const [wS, wE] = weekendRange();
  const in7 = new Date(TODAY); in7.setDate(TODAY.getDate() + 7);
  const tags = [];
  if (ds <= TODAY && de >= TODAY) tags.push('tonight');
  if (ds <= wE && de >= wS) tags.push('weekend');
  if (ds <= in7 && de >= TODAY) tags.push('7days');
  return Object.assign({}, ev, {
    ds, de, tags, past: de < TODAY,
    distance: ev.km !== undefined && ev.km !== null
      ? ev.km
      : Math.round(haversine(USER.lat, USER.lng, ev.lat, ev.lng) * 10) / 10
  });
}
const EVENTS = [];
applyApp(APP);

/* ---- routes ------------------------------------------------------------------
 * /app                 explore          /app/e/<slug>        an event
 * /app/saved           saved            /app/live/<slug>     live mode
 * /app/map             map              /app/recap/<slug>    post-event recap
 * /app/profile         profile          /app/plan/<slug>     group plan
 * /app/tickets         wallet           /app/guide/<slug>    local guide
 * /app/notifications   notifications    /app/chat/<id>       a friend thread
 * /app/alerts          smart alert      /app/checkout/<slug> checkout
 * /app/hyped           hyped events     /app/following       organisers followed
 * /app/settings        notification settings
 */
const TABS = ['explore', 'saved', 'map', 'profile'];
const eventBy = (key) => EVENTS.filter(e => e.slug === key || e.id === key)[0] || null;
const slugOf = (id) => { const e = EVENTS.filter(x => x.id === id)[0]; return e ? (e.slug || e.id) : id; };

/** The screen a URL asks for, as a state patch. */
function routeState(r) {
  const clear = {
    tab:'explore', detail:null, ticketsOpen:false, liveOpen:null, recapOpen:null, planOpen:null,
    guideOpen:null, notifOpen:false, alertPanel:false, chatWith:null, checkout:null,
    hypedPanel:false, orgPanel:false, notifPrefOpen:false, edit:false
  };
  if (!r) return clear;
  const name = r.name, param = r.param;
  const ev = param ? eventBy(param) : null;
  if (TABS.indexOf(name) >= 0) return Object.assign(clear, { tab: name });
  if (name === 'tickets') return Object.assign(clear, { ticketsOpen: true });
  if (name === 'notifications') return Object.assign(clear, { notifOpen: true });
  if (name === 'alerts') return Object.assign(clear, { tab:'profile', alertPanel: true });
  if (name === 'settings') return Object.assign(clear, { tab:'profile', notifPrefOpen: true });
  if (name === 'hyped') return Object.assign(clear, { tab:'profile', hypedPanel: true });
  if (name === 'following') return Object.assign(clear, { tab:'profile', orgPanel: true });
  if (name === 'e' && ev) return Object.assign(clear, { detail: ev.id });
  if (name === 'live' && ev) return Object.assign(clear, { liveOpen: ev.id });
  if (name === 'recap' && ev) return Object.assign(clear, { recapOpen: ev.id });
  if (name === 'plan' && ev) return Object.assign(clear, { planOpen: ev.id });
  if (name === 'guide' && ev) return Object.assign(clear, { guideOpen: ev.id, detail: ev.id });
  if (name === 'checkout' && ev) return Object.assign(clear, { checkout: ev.id, detail: ev.id });
  if (name === 'chat' && param) return Object.assign(clear, { chatWith: param });
  return clear;
}

/** The URL for what is on screen — panels win over the tab under them. */
function routePath(st) {
  if (st.checkout) return FF.href('checkout', slugOf(st.checkout));
  if (st.guideOpen) return FF.href('guide', slugOf(st.guideOpen));
  if (st.liveOpen) return FF.href('live', slugOf(st.liveOpen));
  if (st.recapOpen) return FF.href('recap', slugOf(st.recapOpen));
  if (st.planOpen) return FF.href('plan', slugOf(st.planOpen));
  if (st.chatWith) return FF.href('chat', st.chatWith);
  if (st.detail) return FF.href('e', slugOf(st.detail));
  if (st.ticketsOpen) return FF.href('tickets');
  if (st.notifOpen) return FF.href('notifications');
  if (st.alertPanel) return FF.href('alerts');
  if (st.notifPrefOpen) return FF.href('settings');
  if (st.hypedPanel) return FF.href('hyped');
  if (st.orgPanel) return FF.href('following');
  return FF.href(st.tab === 'explore' ? '' : st.tab);
}

class Component extends DCLogic {
  state = Object.assign({
    lang: this.props.language === 'Tiếng Việt' ? 'vi' : 'en',
    stage: this.props.startScreen === 'Explore feed' || APP.user ? 'app' : 'location',
    tab:'explore', time:'weekend', genre:'All', artist:null,
    q:'', artistQ:'', datePanel:false, artistPanel:false,
    calMonth: TODAY.getMonth(), calYear: TODAY.getFullYear(),
    range:[null,null], saved: APP.saved || {}, hyped: APP.hyped || {},
    interests: APP.interests || { EDM:true, Indie:true, Nightlife:true },
    detail:null, sheet:null, toast:null, loading:true, limit:4, loadingMore:false, mapSel:null,
    user: APP.user || null,
    edit:false, pName:'', pEmail:'', pZalo:'', pCity:'', pPhoto:'', pErr:'',
    going: APP.going || {}, friendsOnly:false, friendSheet:null, chatWith:null, chats: APP.chats || {}, chatDraft:'',
    invite:null, inviteSel:{}, following:{}, tipHidden:false,
    plans: APP.plans || {}, planOpen:null, planTab:'group', planDraft:'', planIds: APP.planIds || {},
    aiGuide:{}, guideOpen:null,
    alertOn: APP.alert ? APP.alert.enabled : true, alertPanel:false,
    orgFollow: APP.orgFollow || {}, orgPanel:false,
    hypedPanel:false, showPastHyped:false, inviteLog:[],
    alGenres: APP.alert ? APP.alert.genres : { EDM:true }, alArtists: APP.alert ? APP.alert.artists : {},
    alOrgs: APP.alert ? APP.alert.orgs : {}, alAreas: APP.alert ? APP.alert.areas : {},
    alCap: APP.alert ? APP.alert.cap : 1000000, alMatches: APP.alert ? APP.alert.matches : 0,
    bestieArmed:null, bestieSplash:null, bestieWaved:{},
    genrePanel:false, tickets: APP.tickets || [], ticketsOpen:false, checkout:null, qty:1,
    tierId:null, quote:null, payReqData:null,
    liveOpen:null, liveStage:0, liveReminds:{}, adHidden:{},
    offline:false, payReq:null,
    reportFor:null, reportCode:'wrong', notifPrefOpen:false,
    notifM: APP.notifM || { saved:{ push:true, zalo:true, email:false }, tickets:{ push:true, zalo:false, email:false },
      sets:{ push:true, zalo:false, email:false }, friends:{ push:true, zalo:true, email:false },
      orgs:{ push:false, zalo:true, email:true } },
    recapOpen:null, recapStars:0, recapAspects:{}, recapPhotos:[], recap:null,
    notifOpen:false, notifRead:{}, notifs: APP.notifs || [],
    auth:null, authMode:'signup', authMethod:'email', authId:'', authOtp:'', authPass:'', authPass2:'',
    authErr:'', authNote:'', authNext:null, authShowPass:false, authBusy:false, authChallenge:null, authSignupToken:null,
    liveData:null, detailData:null
  }, routeState(FF.route));

  /** Everything this screen needs after signing in or out. */
  async reloadApp() {
    const d = await FF.loadApp();
    applyApp(d);
    this._orgs = null;
    this.setState({
      user: d.user || null, saved: d.saved || {}, hyped: d.hyped || {}, going: d.going || {},
      interests: d.interests || {}, tickets: d.tickets || [], plans: d.plans || {}, planIds: d.planIds || {},
      chats: d.chats || {}, orgFollow: d.orgFollow || {}, notifs: d.notifs || [],
      notifM: d.notifM || this.state.notifM,
      alertOn: d.alert ? d.alert.enabled : true,
      alGenres: d.alert ? d.alert.genres : {}, alArtists: d.alert ? d.alert.artists : {},
      alOrgs: d.alert ? d.alert.orgs : {}, alAreas: d.alert ? d.alert.areas : {},
      alCap: d.alert ? d.alert.cap : 1000000, alMatches: d.alert ? d.alert.matches : 0
    });
  }

  fail(e) { this.say(FF.errorText(e, this.state.lang)); }

  /** Toggle one of the three per-event flags against the API, rolling back on failure. */
  async flag(kind, id, on) {
    const key = kind === 'saves' ? 'saved' : kind === 'hypes' ? 'hyped' : 'going';
    const cur = Object.assign({}, this.state[key]);
    if (on) cur[id] = true; else delete cur[id];
    this.setState({ [key]: cur });
    try {
      if (on) await FF.put('/me/' + kind + '/' + id);
      else await FF.del('/me/' + kind + '/' + id);
    } catch (e) {
      const back = Object.assign({}, this.state[key]);
      if (on) delete back[id]; else back[id] = true;
      this.setState({ [key]: back });
      this.fail(e);
    }
  }

  get delay() { return Math.round(this.props.loadSpeed ?? 900); }
  componentDidMount() {
    // The feed data is already here; the short delay is the design's own skeleton beat.
    this._t = setTimeout(() => this.setState({ loading:false }), Math.min(this.delay, 300));
    if (FF.data.appError) this.say(FF.errorText(FF.data.appError, this.state.lang));
    // Back and forward replay the screens.
    FF.onRoute = (r) => { this.setState(routeState(r)); this.openRoute(r); };
    this.openRoute(FF.route);
    // Whatever the other tabs need arrives while this one is being read.
    FF.prefetch(() => FF.appRest(this));
  }

  /** Fetch what a route needs the first time it is asked for. */
  async openRoute(r) {
    if (!r) return;
    if (r.name === 'e' || r.name === 'guide' || r.name === 'checkout') {
      const ev = eventBy(r.param);
      if (ev) await this.openDetail(ev.id, { silent: true });
      if (r.name === 'guide' && ev) this.loadGuide(ev);
      if (r.name === 'checkout' && ev) this.startCheckout(ev.id);
    }
    if (r.name === 'live') { const ev = eventBy(r.param); if (ev) await this.openLive(ev.id); }
    if (r.name === 'recap') { const ev = eventBy(r.param); if (ev) await this.openRecap(ev.id); }
    if (r.name === 'plan') { const ev = eventBy(r.param); if (ev) { await FF.appPlans(this); await this.loadPlan(ev.id); } }
    if (r.name === 'chat' && r.param) await this.loadChat(r.param);
    if (r.name === 'tickets') await FF.appTickets(this);
    if (r.name === 'notifications') await FF.appNotifs(this);
    if (r.name === 'profile' || r.name === 'alerts' || r.name === 'settings' || r.name === 'following') await FF.appRest(this);
  }
  componentWillUnmount() { clearTimeout(this._t); clearTimeout(this._tt); clearTimeout(this._lm); clearTimeout(this._pa); clearTimeout(this._pm); clearTimeout(this._bt); }

  setGuide(key, val) {
    const g = Object.assign({}, this.state.aiGuide); g[key] = val;
    this.setState({ aiGuide: g });
  }

  async loadGuide(ev, force) {
    const lang = this.state.lang, key = ev.id + ':' + lang;
    const cur = this.state.aiGuide[key];
    if (cur && (cur.loading || cur.data) && !force) return;
    this.setGuide(key, { loading:true, error:false, data:null });
    try {
      const out = await FF.get('/events/' + ev.id + '/guide?lang=' + lang + (force ? '&refresh=1' : ''));
      this.setGuide(key, { loading:false, error:false, data: out.guide });
    } catch (e) {
      this.setGuide(key, { loading:false, error:true, data:null });
    }
  }

  guideItems(rows) {
    return (Array.isArray(rows) ? rows : []).slice(0, 3).map(r => ({
      name: r.name || '', why: r.why || '', walk: r.walk || '',
      icon: KIND_ICON[r.kind] || 'ph-fill ph-map-pin'
    }));
  }

  orgList() {
    if (this._orgs) return this._orgs;
    const m = {};
    EVENTS.forEach(e => {
      if (!m[e.organizerId]) m[e.organizerId] = { id:e.organizerId, name:e.organizer, art:e.art, genres:[], n:0, next:null };
      const o = m[e.organizerId]; o.n++;
      if (o.genres.indexOf(e.genre) < 0) o.genres.push(e.genre);
      if (!e.past && (!o.next || e.ds < o.next.ds)) o.next = e;
    });
    this._orgs = Object.keys(m).map(k => m[k]).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
    return this._orgs;
  }
  hypeRow(e, isPast) {
    const L = this.L();
    return {
      title: e.title, art: e.art, when: this.fmtWhen(e) + ' · ' + e.startTime,
      venue: e.venue + ' · ' + e.area,
      op: isPast ? '.5' : '1',
      bd: isPast ? '#151A28' : 'rgba(186,215,247,.12)',
      tag: isPast ? L.hypedPast : '',
      showTag: isPast,
      open: () => this.setState({ hypedPanel:false, detail: e.id }),
      unhype: () => this.flag('hypes', e.id, false)
    };
  }

  orgRow(o) {
    const L = this.L(), on = !!this.state.orgFollow[o.id];
    return {
      name: o.name, art: o.art, initials: initialsOf(o.name),
      meta: L.followEvents.replace('{n}', String(o.n)) + ' · ' + o.genres.slice(0, 2).join(', '),
      next: o.next ? (L.followNext + ' · ' + o.next.title) : L.followNone,
      label: on ? L.followUn : L.followDo,
      fg: on ? '#9DA7BA' : '#B6D9FC', bd: on ? 'rgba(186,215,247,.24)' : '#B6D9FC',
      toggle: async () => {
        const f = Object.assign({}, this.state.orgFollow);
        if (on) delete f[o.id]; else f[o.id] = true;
        this.setState({ orgFollow: f });
        try {
          if (on) await FF.del('/me/follows/organizers/' + o.id);
          else await FF.put('/me/follows/organizers/' + o.id);
          this.say((on ? L.followOff : L.followOn).replace('{n}', o.name));
        } catch (e) { this.fail(e); await this.reloadFollows(); }
      },
      openNext: () => { if (o.next) this.setState({ orgPanel:false, detail: o.next.id }); }
    };
  }

  async reloadFollows() {
    const f = await FF.maybe(FF.get('/me/follows'), null);
    if (!f) return;
    const m = {};
    f.organizers.following.forEach(o => { m[o.id] = true; });
    this.setState({ orgFollow: m });
  }

  alChip(key, val, label) {
    const on = !!this.state[key][val];
    return {
      label, bg: on ? '#7A55F6' : 'transparent', fg: on ? '#090B16' : '#C7D3EA', bd: on ? '#7A55F6' : 'rgba(186,215,247,.12)',
      pick: () => {
        const m = Object.assign({}, this.state[key]); if (m[val]) delete m[val]; else m[val] = true;
        this.setState({ [key]: m });
        this.saveAlertSoon();
      }
    };
  }

  /** Alert rules live on the server: it counts the matches and sends the notifications. */
  saveAlertSoon() {
    clearTimeout(this._al);
    this._al = setTimeout(() => this.saveAlertNow(), 500);
  }
  async saveAlertNow() {
    clearTimeout(this._al);
    const st = this.state;
    if (!st.user) return;
    try {
      const out = await FF.put('/me/alert', {
        enabled: st.alertOn,
        genres: Object.keys(st.alGenres).filter(k => st.alGenres[k]),
        artists: Object.keys(st.alArtists).filter(k => st.alArtists[k]),
        organizerIds: Object.keys(st.alOrgs).filter(k => st.alOrgs[k]),
        areas: Object.keys(st.alAreas).filter(k => st.alAreas[k]),
        priceCap: st.alCap >= 9e9 ? null : st.alCap
      });
      this.setState({ alMatches: out.matches });
    } catch (e) { this.fail(e); }
  }

  bestieList(ev) {
    if (!ev) return [];
    const L = this.L(), tags = [ev.genre].concat(ev.artists || []);
    const here = this.state.liveData && this.state.liveData.event.id === ev.id ? this.state.liveData.friendsOnSite : [];
    const list = here.length ? here : this.fGoing(ev.id).slice(0, 3);
    return list.map((b, i) => {
      const waved = !!this.state.bestieWaved[ev.id + b.id];
      return {
        name: b.name, initials: b.initials || initialsOf(b.name), color: b.color || FF.colorFor(b.id),
        away: b.zone ? b.zone : (this.state.lang === 'vi' ? 'đang tới' : 'on the way'),
        shared: tags[(i + 1) % tags.length] || ev.genre,
        label: waved ? L.bWaved : L.bWave,
        fg: waved ? '#090B16' : '#D8ECF8',
        bg: waved ? '#7FD3C3' : 'rgba(255,255,255,.1)',
        bd: waved ? '#7FD3C3' : 'rgba(255,255,255,.28)',
        wave: async () => {
          if (waved) return;
          const w = Object.assign({}, this.state.bestieWaved); w[ev.id + b.id] = true;
          this.setState({ bestieWaved: w });
          try {
            const out = await FF.post('/events/' + ev.id + '/waves/' + b.id);
            this.say(FF.text(out.message, this.state.lang));
          } catch (e) { this.fail(e); }
        }
      };
    });
  }

  componentDidUpdate(prev) {
    if (prev.language !== this.props.language) {
      this.setState({ lang: this.props.language === 'Tiếng Việt' ? 'vi' : 'en' });
    }
    if (prev.startScreen !== this.props.startScreen) {
      this.setState({ stage: this.props.startScreen === 'Explore feed' ? 'app' : 'location' });
    }
    // One place keeps the URL honest, whichever handler changed the screen.
    if (this.state.stage === 'app') FF.navigate(routePath(this.state));
  }

  L() { const g = this.state.lang; const o = {}; for (const k in S) o[k] = S[k][g]; return o; }
  say(msg) { clearTimeout(this._tt); this.setState({ toast: msg }); this._tt = setTimeout(() => this.setState({ toast:null }), 2100); }

  validId(v, method) {
    const s = (v || '').trim();
    if (method === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
    return /^(0|\+84)\d{8,10}$/.test(s.replace(/[\s.-]/g, ''));
  }
  openAuth(mode, next, note) {
    this.setState({
      auth: mode === 'login' ? 'loginId' : 'method', authMode: mode, authMethod:'email',
      authId:'', authOtp:'', authPass:'', authPass2:'', authErr:'', authShowPass:false,
      authNote: note || '', authNext: next || null, sheet:null
    });
  }
  authBack() {
    const s = this.state.auth;
    if (s === 'id') return this.setState({ auth:'method', authErr:'' });
    if (s === 'otp') return this.setState({ auth:'id', authErr:'' });
    if (s === 'pass') return this.setState({ auth:'otp', authErr:'' });
    if (s === 'loginPass') return this.setState({ auth:'loginId', authErr:'' });
    this.setState({ auth:null, authErr:'' });
  }
  /** Real sign-up and sign-in: OTP to the address given, then a password for email. */
  async authStep() {
    const st = this.state, L = this.L(), step = st.auth;
    if (st.authBusy) return;
    const channel = st.authMethod === 'email' ? 'email' : st.authMethod === 'wa' ? 'whatsapp' : 'zalo';
    const busy = (v) => this.setState({ authBusy: v });
    if (step === 'id') {
      if (!this.validId(st.authId, st.authMethod)) return this.setState({ authErr: st.authMethod === 'email' ? L.errEmail : st.authMethod === 'wa' ? L.errWa : L.errZalo });
      busy(true);
      try {
        const out = await FF.post('/auth/otp/start', { identifier: st.authId.trim(), channel });
        this.setState({ auth:'otp', authErr:'', authOtp:'', authChallenge: out.challengeId });
        this.say((st.authMethod === 'email' ? L.otpSentEmail : st.authMethod === 'wa' ? L.otpSentWa : L.otpSentZalo) + ' ' + st.authId.trim());
      } catch (e) { this.setState({ authErr: FF.errorText(e, st.lang) }); } finally { busy(false); }
      return;
    }
    if (step === 'otp') {
      if (!/^\d{6}$/.test(st.authOtp)) return this.setState({ authErr: L.errOtp });
      busy(true);
      try {
        const out = await FF.post('/auth/otp/verify', { challengeId: st.authChallenge, code: st.authOtp });
        // An email that has no password yet goes on to set one; everything else is signed in.
        if (out.next === 'set_password') {
          this.setState({ auth:'pass', authErr:'', authSignupToken: out.signupToken });
          return;
        }
        await this.finishAuth();
      } catch (e) { this.setState({ authErr: FF.errorText(e, st.lang) }); } finally { busy(false); }
      return;
    }
    if (step === 'pass') {
      if (st.authPass.length < 8) return this.setState({ authErr: L.errPass });
      if (st.authPass !== st.authPass2) return this.setState({ authErr: L.errPass2 });
      busy(true);
      try {
        await FF.post('/auth/password', { token: st.authSignupToken, password: st.authPass, passwordConfirm: st.authPass2 });
        await this.finishAuth();
      } catch (e) { this.setState({ authErr: FF.errorText(e, st.lang) }); } finally { busy(false); }
      return;
    }
    if (step === 'loginId') {
      const m = st.authId.includes('@') ? 'email' : 'zalo';
      if (!this.validId(st.authId, m)) return this.setState({ authErr: L.errId });
      return this.setState({ auth:'loginPass', authMethod:m, authErr:'', authPass:'' });
    }
    if (step === 'loginPass') {
      if (!st.authPass.length) return this.setState({ authErr: L.errLoginPass });
      busy(true);
      try {
        await FF.post('/auth/login', { identifier: st.authId.trim(), password: st.authPass });
        await this.finishAuth();
      } catch (e) { this.setState({ authErr: FF.errorText(e, st.lang) }); } finally { busy(false); }
    }
  }
  async finishAuth() {
    const st = this.state, L = this.L(), next = st.authNext;
    await FF.refreshSession();
    await this.reloadApp();
    this.setState({ auth:null, authErr:'', authOtp:'', authPass:'', authPass2:'', authNote:'', authNext:null, authChallenge:null, authSignupToken:null, stage:'app' });
    if (next && next.indexOf('save:') === 0) await this.flag('saves', next.slice(5), true);
    this.say(st.authMode === 'login' ? L.loggedInToast : L.welcomeToast);
  }

  readPhoto(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    this._photoFile = f;
    this.setState({ pPhoto: URL.createObjectURL(f) });
  }

  async socialLogin(src) {
    try {
      await FF.oauthStart(src === 'fb' ? 'facebook' : 'instagram');
    } catch (e) { this.fail(e); }
  }

  startConnect(src) {
    const phone = src === 'zalo' || src === 'wa';
    this.setState({ cx: { src, step: phone ? 'phone' : 'redirect', id:'', otp:'', err:'' } });
  }
  cxSet(patch) { this.setState({ cx: Object.assign({}, this.state.cx, patch) }); }
  async cxStep() {
    const L = this.L(), c = this.state.cx;
    if (!c) return;
    const provider = c.src === 'wa' ? 'whatsapp' : c.src;
    if (c.step === 'phone') {
      if (!this.validId(c.id, 'phone')) return this.cxSet({ err: c.src === 'wa' ? L.errWa : L.errZalo });
      try {
        const out = await FF.post('/me/connections/' + provider + '/start', { phone: c.id.trim() });
        this.cxSet({ step:'otp', err:'', otp:'', challengeId: out.challengeId });
        this.say((c.src === 'wa' ? L.otpSentWa : L.otpSentZalo) + ' ' + c.id.trim());
      } catch (e) { this.cxSet({ err: FF.errorText(e, this.state.lang) }); }
      return;
    }
    if (c.step === 'otp') {
      if (!/^\d{6}$/.test(c.otp)) return this.cxSet({ err: L.errOtp });
      try {
        await FF.post('/me/connections/' + provider + '/verify', { challengeId: c.challengeId, code: c.otp });
        return this.finishConnect();
      } catch (e) { return this.cxSet({ err: FF.errorText(e, this.state.lang) }); }
    }
    if (c.step === 'redirect') {
      // Facebook and Instagram hand the account back through the OAuth callback.
      try { await FF.oauthStart(c.src === 'fb' ? 'facebook' : 'instagram'); } catch (e) { this.cxSet({ err: FF.errorText(e, this.state.lang) }); }
      return;
    }
    if (c.step === 'confirm') return this.finishConnect();
  }

  async finishConnect() {
    const L = this.L(), c = this.state.cx;
    this.setState({ cx:null });
    const me = await FF.maybe(FF.get('/me'), null);
    if (me) {
      const socials = me.connections.map(x => x.provider === 'whatsapp' ? 'wa' : x.provider);
      this.setState({ user: Object.assign({}, this.state.user, { socials, social: socials[0] || '' }) });
    }
    await this.reloadApp();
    this.say(L.connectedToast + ' · ' + SRC[c.src].label);
  }

  async connectSocial(src) {
    const L = this.L(), cur = this.state.user || {};
    const list = (cur.socials || (cur.social ? [cur.social] : [])).slice();
    const i = list.indexOf(src);
    if (i < 0) return this.startConnect(src);
    try {
      await FF.del('/me/connections/' + (src === 'wa' ? 'whatsapp' : src));
      list.splice(i, 1);
      this.setState({ user: Object.assign({}, cur, { socials:list, social:list[0] || '' }) });
      this.say(L.disconnectedToast + ' · ' + SRC[src].label);
      await this.reloadApp();
    } catch (e) { this.fail(e); }
  }

  /** Open a thread and pull its messages. */
  async openChat(friendId) {
    this.setState({ chatWith: friendId, friendSheet:null });
    await this.loadChat(friendId);
  }
  /** Live mode and the recap both read their own endpoint. */
  /** Follow a notification to the screen it points at. */
  goNotif(n) {
    const link = n.link || {};
    if (link.eventId) {
      if (link.screen === 'live') return this.openLive(link.eventId);
      if (link.screen === 'recap') return this.openRecap(link.eventId);
      if (link.screen === 'plan') { this.setState({ planOpen: link.eventId, planTab:'chat' }); return this.loadPlan(link.eventId); }
      return this.openDetail(link.eventId);
    }
    if (link.screen === 'tickets') return this.setState({ ticketsOpen:true });
    if (link.screen === 'chat' && link.friendId) return this.openChat(link.friendId);
    this.setState({ tab:'explore' });
  }

  async openLive(eventId) {
    this.setState({ liveOpen: eventId, ticketsOpen:false, liveStage:0, bestieSplash:null, liveData:null });
    const [d, ad] = await Promise.all([FF.maybe(FF.get('/events/' + eventId + '/live'), null), FF.appLiveAd()]);
    if (ad) LIVE_AD = ad;
    if (d && this.state.liveOpen === eventId) this.setState({ liveData: d });
  }
  async openRecap(eventId) {
    this.setState({ recapOpen: eventId, ticketsOpen:false, bestieSplash:null, recap:null, recapStars:0, recapAspects:{}, recapPhotos:[] });
    const r = await FF.maybe(FF.get('/events/' + eventId + '/recap'), null);
    if (r && this.state.recapOpen === eventId) {
      this.setState({ recap: r, recapStars: r.submitted ? r.submitted.stars : 0 });
    }
  }
  /** Open the checkout sheet for an event, pricing the cheapest tier on sale. */
  async startCheckout(id) {
    if (!this.state.detailData || this.state.detailData.id !== id) {
      const d = await FF.maybe(FF.get('/events/' + id), null);
      if (!d) return;
      this.setState({ detailData: d });
    }
    const tier = this.onSaleTier();
    if (!tier) return this.say(this.state.lang === 'vi' ? 'Chưa mở bán vé' : 'No tier is on sale yet');
    this.setState({ checkout: id, qty:1, tierId: tier.id, quote:null });
    this.quoteSoon(1, tier.id, id);
  }

  /** The cheapest tier actually on sale — what "from X₫" on the card means. */
  onSaleTier() {
    const d = this.state.detailData;
    if (!d || !d.tickets) return null;
    const open = d.tickets.tiers.filter(t => t.state === 'onsale' || t.state === 'last');
    return open.sort((a, b) => a.price - b.price)[0] || null;
  }
  /** The server prices the basket: fees, promos and sold-out tiers all come from it. */
  quoteSoon(qty, tierId, eventId) {
    clearTimeout(this._q);
    const tier = tierId || this.state.tierId;
    const ev = eventId || this.state.checkout;
    if (!tier || !ev) return;
    this._q = setTimeout(async () => {
      const out = await FF.maybe(FF.post('/checkout/quote', { eventId: ev, tierId: tier, qty }), null);
      if (out) this.setState({ quote: out });
    }, 150);
  }

  async addToWallet(platform) {
    const t = this.state.tickets[0];
    if (!t) return;
    try {
      const out = await FF.post('/me/tickets/' + t.ticketId + '/wallet', { platform });
      this.say(FF.text(out.message, this.state.lang) || this.L().walletAdded);
    } catch (e) { this.fail(e); }
  }

  async loadChat(friendId) {
    const out = await FF.maybe(FF.get('/me/chats/' + friendId), null);
    if (!out) return;
    const all = Object.assign({}, this.state.chats);
    all[friendId] = out.items.map(m => m.kind === 'invite' && m.payload
      ? { t: m.body, me: m.fromMe, invite: { id: m.payload.eventId, title: m.payload.title, when: FF.dayLabel(m.payload.startsOn, this.state.lang) } }
      : { t: m.body, me: m.fromMe });
    this.setState({ chats: all });
  }

  fGoing(id) { return FRIENDS.filter(f => f.going.indexOf(id) >= 0); }
  fInterested(id) { return FRIENDS.filter(f => f.interested.indexOf(id) >= 0); }
  /** The plan behind an event, once one exists on the server. */
  planIdFor(eventId) { return this.state.planIds[eventId] || null; }
  async loadPlan(eventId) {
    const id = this.planIdFor(eventId);
    if (!id) return null;
    const p = await FF.maybe(FF.get('/plans/' + id), null);
    if (p) {
      const all = Object.assign({}, this.state.plans);
      all[eventId] = p;
      this.setState({ plans: all });
    }
    return p;
  }
  fView(f) {
    const L = this.L(), thread = this.state.chats[f.id] || [];
    const last = thread.length ? thread[thread.length - 1] : null;
    return { id:f.id, name:f.name, initials: initialsOf(f.name), color:f.color,
      icon: SRC[f.src].icon, iconColor: SRC[f.src].color, srcLabel: SRC[f.src].label,
      dot: f.online ? '#3FB8A3' : '#8A94A8',
      statusLabel: f.online ? L.inboxOnline : L.inboxOffline,
      sub: last ? (last.invite ? L.inboxInvite + ' · ' + last.invite.title : (last.me ? (L.planYou + ': ') : '') + last.t) : (f.online ? L.inboxOnline : L.inboxOffline),
      subFg: last ? '#9DA7BA' : (f.online ? '#3FB8A3' : '#8A94A8'),
      open: () => this.setState({ friendSheet: f.id }) };
  }
  qrRows(code) {
    const N = 13, rows = [];
    let s = 7;  // a readable stand-in for the QR bitmap; the scanned value is the signed token
    for (let i = 0; i < code.length; i++) s = (s * 31 + code.charCodeAt(i)) % 2147483647;
    const rnd = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
    for (let y = 0; y < N; y++) {
      const cells = [];
      for (let x = 0; x < N; x++) {
        const corner = (x < 3 && y < 3) || (x > N - 4 && y < 3) || (x < 3 && y > N - 4);
        cells.push({ bg: corner || rnd() > 0.48 ? '#090B16' : 'transparent' });
      }
      rows.push({ cells });
    }
    return rows;
  }
  proof(id) {
    const g = this.state.lang, L = this.L();
    if (!(this.state.user && this.state.user.social)) return { show:false, faces:[], line:'' };
    const going = this.fGoing(id), ints = this.fInterested(id);
    const src = going.length ? going : ints;
    if (!src.length) return { show:false, faces:[], line:'' };
    const first = src[0].name, rest = src.length - 1;
    let line;
    if (going.length) line = rest ? first + ' + ' + rest + (g === 'vi' ? ' người bạn sẽ đi' : rest === 1 ? ' friend going' : ' friends going') : first + (g === 'vi' ? ' sẽ đi' : ' is going');
    else line = rest ? first + ' ' + L.andOthers.replace('{n}', String(rest)) + ' ' + L.alsoInterested : first + ' ' + L.alsoInterested;
    return { show:true, faces: src.slice(0, 3).map(f => ({ initials: initialsOf(f.name), color: f.color })), line, count: src.length };
  }
  refilter(patch) {
    clearTimeout(this._t);
    this.setState(Object.assign({ loading:true, limit:4 }, patch));
    this._t = setTimeout(() => this.setState({ loading:false }), Math.round(this.delay * 0.5));
  }
  tMinus(t, m) {
    const p = String(t || '19:00').split(':').map(Number);
    let x = p[0] * 60 + (p[1] || 0) - m; if (x < 0) x += 1440;
    return String(Math.floor(x / 60)).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0');
  }
  money(n) { return n.toLocaleString('vi-VN') + '₫'; }
  short(n) { return n >= 1000000 ? (n / 1000000).toFixed(n % 1000000 ? 1 : 0) + 'tr₫' : Math.round(n / 1000) + 'K₫'; }
  fmtWhen(ev) {
    const g = this.state.lang, ds = ev.ds, de = ev.de;
    const one = DAY_SHORT[g][ds.getDay()] + ', ' + ds.getDate() + ' ' + MON_SHORT[g][ds.getMonth()];
    if (+ds === +de) return one;
    return DAY_SHORT[g][ds.getDay()] + ' ' + ds.getDate() + ' – ' + DAY_SHORT[g][de.getDay()] + ' ' + de.getDate() + ' ' + MON_SHORT[g][de.getMonth()];
  }
  fmtTime(ev) { return ev.startTime + (ev.endTime ? ' – ' + ev.endTime : ''); }

  filtered() {
    const st = this.state, q = st.q.trim().toLowerCase();
    let list = EVENTS.filter(ev => {
      if (this.props.hideUnavailable && (ev.soldOut || ev.past)) return false;
      if (q) { /* a text search spans every date, not just the active time filter */ }
      else if (st.time === 'date' && st.range[0]) {
        const a = st.range[0], b = st.range[1] || st.range[0];
        if (!(ev.ds <= b && ev.de >= a)) return false;
      } else if (st.time !== 'date' && !ev.tags.includes(st.time)) return false;
      if (st.genre !== 'All' && ev.genre !== st.genre) return false;
      if (st.artist && !(ev.artists || []).includes(st.artist)) return false;
      if (q) {
        const hay = (ev.title + ' ' + ev.venue + ' ' + ev.area + ' ' + ev.genre + ' ' + (ev.artists || []).join(' ')).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const ints = st.user ? st.interests : {};
    list.sort((a, b) => {
      if (!!a.past !== !!b.past) return a.past ? 1 : -1;
      const af = st.orgFollow[a.organizer] ? 1 : 0, bf = st.orgFollow[b.organizer] ? 1 : 0;
      if (af !== bf) return bf - af;
      if (!!b.featured - !!a.featured) return !!b.featured - !!a.featured;
      const ai = ints[a.genre] ? 1 : 0, bi = ints[b.genre] ? 1 : 0;
      if (bi - ai) return bi - ai;
      return a.ds - b.ds;
    });
    return list;
  }

  async openDetail(id, opts) {
    this.setState({ detail: id, detailData: null });
    if (!(opts && opts.silent)) {
      FF.fire(FF.post('/events/' + id + '/track', { type: 'view', source: this.state.tab === 'map' ? 'map' : this.state.q ? 'search' : 'feed' }));
    }
    FF.appPlans(this);
    const d = await FF.maybe(FF.get('/events/' + id), null);
    if (d && this.state.detail === id) this.setState({ detailData: d });
  }

  cardView(ev, L) {
    const st = this.state, unavailable = ev.soldOut || ev.past;
    return {
      id: ev.id, title: ev.title, genre: ev.genre, art: ev.art, featured: !!ev.featured,
      artOpacity: unavailable ? '.42' : '1',
      cardBd: ev.featured ? 'rgba(102,58,243,.45)' : 'rgba(186,215,247,.12)',
      hasBadge: !!ev.badge && !unavailable,
      badgeLabel: ev.badgeLabel ? ev.badgeLabel[st.lang] : '',
      badgeBg: ev.badge === 'live' ? '#7A55F6' : ev.badge === 'new' ? 'rgba(216,236,248,.92)' : '#B6D9FC',
      badgeFg: '#090B16',
      unavailable, unavailLabel: ev.soldOut ? L.soldOut : L.ended,
      unavailBd: ev.soldOut ? '#E46D4C' : 'rgba(186,215,247,.24)', unavailFg: ev.soldOut ? '#F0A07F' : '#9DA7BA',
      whenLine: this.fmtWhen(ev) + ' · ' + this.fmtTime(ev),
      whereLine: ev.venue + ' · ' + ev.distance + ' km',
      priceLine: ev.price === 0 ? L.free : L.from + ' ' + this.short(ev.price),
      priceColor: ev.price === 0 ? '#269684' : '#D8ECF8',
      proofShow: this.proof(ev.id).show, proofLine: this.proof(ev.id).line, proofFaces: this.proof(ev.id).faces,
      priceShort: ev.price === 0 ? L.free : this.short(ev.price),
      hypeBg: st.hyped[ev.id] ? '#7A55F6' : '#131725', hypeBd: st.hyped[ev.id] ? '#7A55F6' : 'rgba(186,215,247,.12)',
      hypeFg: st.hyped[ev.id] ? '#090B16' : '#8A94A8',
      saveBg: st.saved[ev.id] ? '#B6D9FC' : '#131725', saveBd: st.saved[ev.id] ? '#B6D9FC' : 'rgba(186,215,247,.12)',
      saveFg: st.saved[ev.id] ? '#090B16' : '#8A94A8',
      open: () => this.openDetail(ev.id),
      save: (e) => {
        e.stopPropagation();
        if (!st.user) return this.openAuth('signup', 'save:' + ev.id, L.gateSave);
        const on = !st.saved[ev.id];
        this.flag('saves', ev.id, on);
        this.say(on ? (st.lang === 'vi' ? 'Đã lưu vào Đã lưu' : 'Saved') : (st.lang === 'vi' ? 'Đã bỏ lưu' : 'Removed from Saved'));
      },
      hype: (e) => {
        e.stopPropagation();
        if (!st.user) return this.openAuth('signup', null, L.gateSave);
        const on = !st.hyped[ev.id];
        this.flag('hypes', ev.id, on);
        if (on) this.say(st.lang === 'vi' ? 'Đã hype 🔥' : 'Hyped 🔥');
      }
    };
  }

  renderVals() {
    const st = this.state, L = this.L(), g = st.lang;
    const list = this.filtered();
    const shown = list.slice(0, st.limit);
    const detail = st.detail ? EVENTS.find(e => e.id === st.detail) : null;
    const savedIds = Object.keys(st.saved).filter(k => st.saved[k]);
    const savedEvents = EVENTS.filter(e => st.saved[e.id]);

    const artistCounts = {};
    EVENTS.forEach(e => (e.artists || []).forEach(a => { artistCounts[a] = (artistCounts[a] || 0) + 1; }));
    const aq = st.artistQ.trim().toLowerCase();
    const artistNames = Object.keys(artistCounts).filter(a => !aq || a.toLowerCase().includes(aq)).sort();

    const first = new Date(st.calYear, st.calMonth, 1);
    const lead = (first.getDay() + 6) % 7;
    const dim = new Date(st.calYear, st.calMonth + 1, 0).getDate();
    const eventDays = {};
    EVENTS.forEach(e => { const c = new Date(e.ds); while (c <= e.de) { eventDays[dayKey(c)] = 1; c.setDate(c.getDate() + 1); } });
    const cells = [];
    for (let i = 0; i < lead; i++) cells.push({ label:'', bg:'transparent', fg:'transparent', bd:'transparent', op:'0', dot:'transparent', rangeBg:'transparent', rangeRadius:'0', cursor:'default', pick:() => {} });
    const [rs, re] = st.range;
    for (let i = 1; i <= dim; i++) {
      const cd = new Date(st.calYear, st.calMonth, i);
      const past = cd < TODAY, isToday = +cd === +TODAY;
      const inRange = rs && re && cd > rs && cd < re;
      const isEnd = (rs && +cd === +rs) || (re && +cd === +re);
      cells.push({
        label: String(i),
        bg: isEnd ? '#B6D9FC' : 'transparent',
        fg: isEnd ? '#090B16' : past ? '#8A94A8' : '#D8ECF8',
        bd: isToday && !isEnd ? 'rgba(186,215,247,.24)' : 'transparent',
        op: past ? '.35' : '1',
        dot: eventDays[dayKey(cd)] && !isEnd ? '#7A55F6' : 'transparent',
        rangeBg: inRange ? '#111A2B' : isEnd && re && +rs !== +re ? '#111A2B' : 'transparent',
        rangeRadius: isEnd && re && +rs !== +re ? (+cd === +rs ? '999px 0 0 999px' : '0 999px 999px 0') : '0',
        cursor: past ? 'default' : 'pointer',
        pick: past ? () => {} : () => {
          let nr;
          if (!rs || (rs && re)) nr = [cd, null];
          else nr = cd < rs ? [cd, rs] : [rs, cd];
          this.refilter({ range: nr, time:'date' });
        }
      });
    }
    const rangeLabel = rs ? (re && +rs !== +re
      ? rs.getDate() + '–' + re.getDate() + ' ' + MON_SHORT[g][re.getMonth()]
      : rs.getDate() + ' ' + MON_SHORT[g][rs.getMonth()]) : L.pickDate;

    const timeDefs = [
      { k:'tonight', label:L.tonight, icon:'ph-fill ph-fire' },
      { k:'weekend', label:L.weekend, icon:'ph-bold ph-confetti' },
      { k:'7days', label:L.next7, icon:'ph-bold ph-calendar-dots' },
      { k:'date', label:rangeLabel, icon:'ph-bold ph-calendar-blank' }
    ];

    const shareTargets = [
      { k:'zalo', label:'Zalo', icon:'ph-bold ph-chat-circle-dots', bg:'rgba(49,89,214,.18)', fg:'#6FB0F0' },
      { k:'ig', label:'IG Stories', icon:'ph-bold ph-instagram-logo', bg:'rgba(228,109,76,.16)', fg:'#F0A07F' },
      { k:'tiktok', label:'TikTok', icon:'ph-bold ph-tiktok-logo', bg:'rgba(182,217,252,.16)', fg:'#B6D9FC' },
      { k:'messenger', label:'Messenger', icon:'ph-bold ph-messenger-logo', bg:'rgba(102,58,243,.18)', fg:'#C4B8F7' },
      { k:'fb', label:'Facebook', icon:'ph-bold ph-facebook-logo', bg:'rgba(49,89,214,.18)', fg:'#6FB0F0' },
      { k:'tg', label:'Telegram', icon:'ph-bold ph-telegram-logo', bg:'rgba(182,217,252,.16)', fg:'#B6D9FC' },
      { k:'copy', label: g === 'vi' ? 'Sao chép link' : 'Copy link', icon:'ph-bold ph-link-simple', bg:'rgba(20,24,38,.9)', fg:'#D8ECF8' },
      { k:'more', label: g === 'vi' ? 'Khác' : 'More', icon:'ph-bold ph-dots-three', bg:'rgba(20,24,38,.9)', fg:'#9DA7BA' }
    ].map(s => Object.assign({}, s, { go: () => {
      this.setState({ sheet:null });
      const url = detail ? location.origin + '/e/' + (detail.slug || detail.id) : location.origin;
      if (s.k === 'copy' && navigator.clipboard) {
        navigator.clipboard.writeText(url).catch(() => {});
        return this.say(g === 'vi' ? 'Đã sao chép link' : 'Link copied');
      }
      this.say(g === 'vi' ? 'Đã chia sẻ qua ' + s.label : 'Shared to ' + s.label);
    } }));

    const mapList = list.filter(e => !e.past).filter(e => !(st.friendsOnly && st.user && st.user.social) || this.fGoing(e.id).length > 0);
    const mapSel = st.mapSel ? EVENTS.find(e => e.id === st.mapSel) : null;

    const navDefs = [
      { k:'explore', label:L.explore, icon:'ph-fill ph-compass' },
      { k:'saved', label:L.saved, icon:'ph-fill ph-heart' },
      { k:'map', label:L.map, icon:'ph-fill ph-map-trifold' },
      { k:'profile', label:L.profile, icon:'ph-fill ph-user' }
    ];

    const detailV = detail ? {
      art: detail.art, title: detail.title,
      kicker: detail.genre.toUpperCase() + (detail.badgeLabel ? ' · ' + detail.badgeLabel[g].toUpperCase() : ''),
      whenFull: this.fmtWhen(detail), timeFull: this.fmtTime(detail),
      venue: detail.venue, areaLine: detail.area + ' · ' + detail.distance + ' km' + (g === 'vi' ? '' : ' away'),
      age: (() => {
        const a = st.detailData ? st.detailData.age : detail.age;
        return a === 'All ages' ? (g === 'vi' ? 'Mọi lứa tuổi' : 'All ages') : a;
      })(),
      organizer: detail.organizer,
      description: FF.text(detail.description, g),
      hypeLine: (st.detailData ? st.detailData.hypeCount : detail.hype).toLocaleString('vi-VN') + (g === 'vi' ? ' người đang hype' : ' people are hyped')
    } : null;

    const nInterest = Object.keys(st.interests).filter(k => st.interests[k]).length;

    const step = st.auth, isLogin = st.authMode === 'login';
    const idStep = step === 'id' || step === 'loginId', passStep = step === 'pass' || step === 'loginPass';
    const authTitles = { method:L.joinTitle, id: st.authMethod === 'email' ? L.idTitleEmail : st.authMethod === 'wa' ? L.idTitleWa : L.idTitleZalo,
      otp:L.otpTitle, pass:L.passTitle, loginId:L.loginTitle, loginPass:L.loginPassTitle };
    const authSubs = { method:L.joinSub, id:L.idSub,
      otp: (st.authMethod === 'email' ? L.otpSentEmail : st.authMethod === 'wa' ? L.otpSentWa : L.otpSentZalo) + ' ' + st.authId.trim(),
      pass:L.passSub, loginId:L.loginSub, loginPass:L.loginPassSub };
    const authCtas = { id:L.sendCode, otp:L.verify, pass:L.createAccount, loginId:L.continueCta, loginPass:L.logIn };
    const barStep = step === 'id' ? 1 : step === 'otp' ? 2 : step === 'pass' ? 3 : 0;

    const connected = !!(st.user && st.user.social);
    const friendEvents = connected ? EVENTS.filter(e => !e.past && this.fGoing(e.id).length > 0) : [];
    const dGoing = detail && connected ? this.fGoing(detail.id) : [];
    const dInt = detail && connected ? this.fInterested(detail.id) : [];
    const fSel = st.friendSheet ? FRIENDS.find(f => f.id === st.friendSheet) : null;
    const chatF = st.chatWith ? FRIENDS.find(f => f.id === st.chatWith) : null;
    const chatLog = chatF ? (st.chats[chatF.id] || []) : [];
    const inviteN = Object.keys(st.inviteSel).filter(k => st.inviteSel[k]).length;
    const planEv = st.planOpen ? EVENTS.find(e => e.id === st.planOpen) : null;
    const plan = planEv ? st.plans[planEv.id] : null;
    const pMembers = plan ? plan.members : [];
    const pGoing = pMembers.filter(m => m.status === 'going' && !m.owner);
    const pHeads = plan ? pGoing.length + 1 : 1;
    const pSpots = plan ? plan.meetSpots : [];
    const pSplit = plan ? plan.split : null;
    const pPaidN = pSplit ? pSplit.paidCount : 0;
    const dPlan = detail ? st.plans[detail.id] : null;
    const guideEv = st.guideOpen ? EVENTS.find(e => e.id === st.guideOpen) : null;
    const guideSt = guideEv ? st.aiGuide[guideEv.id + ':' + st.lang] : null;
    const gd = (guideSt && guideSt.data) || {};
    const bEv = st.bestieSplash ? EVENTS.find(e => e.id === st.bestieSplash) : null;
    const bCount = bEv ? Math.max(3, Math.round(bEv.hype / 90)) : 0;
    const hypedAll = EVENTS.filter(e => st.hyped[e.id]);
    const hypedUp = hypedAll.filter(e => !e.past).sort((a, b) => a.ds - b.ds);
    const hypedPast = hypedAll.filter(e => e.past).sort((a, b) => b.ds - a.ds);
    const alJoin = (o, max) => {
      const k = Object.keys(o); if (!k.length) return null;
      return k.length > max ? k.slice(0, max).join(' & ') + ' +' + (k.length - max) : k.join(' & ');
    };
    const alBits = [alJoin(st.alGenres, 2), alJoin(st.alArtists, 1), alJoin(st.alOrgs, 1), alJoin(st.alAreas, 2)].filter(Boolean);
    if (st.alCap === 0) alBits.push(g === 'vi' ? 'Miễn phí' : 'Free');
    else if (st.alCap < 9e9) alBits.push((g === 'vi' ? 'Dưới ' : 'Under ') + this.money(st.alCap));

    const coEv = st.checkout ? EVENTS.find(e => e.id === st.checkout) : null;
    const soonEv = EVENTS.filter(e => !e.past)[0];
    const notifs = st.notifs.map(n => ({
      k: n.id, icon: NOTIF_ICON[n.kind] || 'ph-fill ph-bell', color: NOTIF_COLOR[n.kind] || '#B6D9FC',
      title: FF.text(n.title, g), body: FF.text(n.body, g), unread: n.unread,
      act: () => this.goNotif(n)
    }));

    const dLinks = !detail || !st.detailData ? [] : (() => {
      const links = st.detailData.links || {};
      const host = (u) => String(u).replace(/^https?:\/\//, '').replace(/\/$/, '');
      const defs = [
        { k:'event', icon:'ph-bold ph-calendar-star', color:'#B6D9FC', label:L.linkEvent },
        { k:'brand', icon:'ph-bold ph-globe-simple', color:'#9D84F8', label:L.linkBrand },
        { k:'tickets', icon:'ph-bold ph-ticket', color:'#F0A07F', label:L.linkTickets }
      ];
      return defs.filter(d => links[d.k]).map(d => ({
        icon: d.icon, color: d.color, label: d.label, host: host(links[d.k]),
        go: () => {
          if (d.k === 'tickets') FF.fire(FF.post('/events/' + detail.id + '/track', { type: 'ticket_click', source: 'feed' }));
          window.open(links[d.k], '_blank', 'noopener');
          this.say(L.linkOpening + ' ' + host(links[d.k]));
        }
      }));
    })();

    return {
      detailLinks: dLinks, hasLinks: dLinks.length > 0,

      signedIn: !!st.user, signedOut: !st.user,
      userHandle: st.user ? st.user.handle : '',
      userInitial: st.user ? (st.user.handle.trim().charAt(0) || '?').toUpperCase() : '',
      userVia: st.user ? (st.user.social ? (g === 'vi' ? 'Liên kết với ' : 'Connected with ') + SRC[st.user.social].label : st.user.method === 'email' ? L.viaEmail : st.user.method === 'wa' ? L.viaWa : L.viaZalo) : '',
      gateBullets: [
        { icon:'ph-fill ph-heart', t:L.gate1 },
        { icon:'ph-fill ph-sparkle', t:L.gate2 },
        { icon:'ph-fill ph-ticket', t:L.gate3 }
      ],
      startSignUp: () => this.openAuth('signup', null, ''),
      startLogIn: () => this.openAuth('login', null, ''),
      signOutNow: async () => {
        await FF.fire(FF.del('/auth/session'));
        await FF.refreshSession();
        await this.reloadApp();
        this.setState({ tab:'profile' });
        this.say(L.signedOutToast);
      },
      userName: st.user ? (st.user.name || st.user.handle) : '',
      hasPhoto: !!(st.user && st.user.photo), noPhoto: !(st.user && st.user.photo),
      userPhoto: st.user ? st.user.photo : '',
      photoBg: st.user && st.user.photo ? 'url("' + st.user.photo + '") center/cover no-repeat' : 'rgba(20,24,38,.7)',
      pPhotoBg: st.pPhoto ? 'url("' + st.pPhoto + '") center/cover no-repeat' : 'rgba(20,24,38,.7)',
      editOpen: st.edit,
      openEdit: () => this.setState({ edit:true, pErr:'',
        pName: st.user.name || '', pEmail: st.user.email || '', pZalo: st.user.zalo || '',
        pCity: st.user.city || '', pPhoto: st.user.photo || '' }),
      closeEdit: () => this.setState({ edit:false, pErr:'' }),
      pName: st.pName, pEmail: st.pEmail, pZalo: st.pZalo, pCity: st.pCity,
      onPName: (e) => this.setState({ pName: e.target.value, pErr:'' }),
      onPEmail: (e) => this.setState({ pEmail: e.target.value, pErr:'' }),
      onPZalo: (e) => this.setState({ pZalo: e.target.value, pErr:'' }),
      onPCity: (e) => this.setState({ pCity: e.target.value, pErr:'' }),
      onPhoto: (e) => this.readPhoto(e),
      pPhoto: st.pPhoto, pHasPhoto: !!st.pPhoto, pNoPhoto: !st.pPhoto,
      clearPhoto: () => this.setState({ pPhoto:'' }),
      photoCta: st.pPhoto ? L.changePhoto : L.uploadPhoto,
      pErr: st.pErr, pErrShow: !!st.pErr,
      emailIsLogin: st.user ? st.user.method === 'email' : false,
      zaloIsLogin: st.user ? st.user.method === 'zalo' : false,
      saveProfile: async () => {
        const email = st.pEmail.trim(), zalo = st.pZalo.trim();
        if (email && !this.validId(email, 'email')) return this.setState({ pErr: L.errEmail });
        if (zalo && !this.validId(zalo, 'zalo')) return this.setState({ pErr: L.errZalo });
        let photoUrl = st.pPhoto || null;
        if (this._photoFile) {
          try {
            const form = new FormData();
            form.append('file', this._photoFile);
            photoUrl = (await FF.api('POST', '/uploads?purpose=avatar', form)).url;
            this._photoFile = null;
          } catch (e) { return this.setState({ pErr: FF.errorText(e, g) }); }
        }
        try {
          const out = await FF.patch('/me', { name: st.pName.trim(), email, zalo, city: st.pCity.trim(), photoUrl, locale: g });
          const u = Object.assign({}, st.user, { name: st.pName.trim(), email, zalo, city: st.pCity.trim(), photo: photoUrl || '' });
          u.handle = u.method === 'email' ? (email || u.handle) : (zalo || u.handle);
          this.setState({ user:u, edit:false, pErr:'' });
          this.say(FF.text(out.message, g) || L.profileSaved);
        } catch (e) { this.setState({ pErr: FF.errorText(e, g) }); }
      },

      authOpen: !!step,
      authTitle: authTitles[step] || '', authSub: authSubs[step] || '', authCta: authCtas[step] || '',
      authStepMethod: step === 'method', authStepIdAny: idStep, authStepOtp: step === 'otp',
      authStepPassAny: passStep, authStepPass: step === 'pass', authStepLoginPass: step === 'loginPass',
      authFormShow: !!step && step !== 'method',
      authSwitchShow: step === 'method' || step === 'loginId',
      authNote: st.authNote, authNoteShow: !!st.authNote,
      authBarShow: barStep > 0,
      authBar1: barStep >= 1 ? '#7A55F6' : 'rgba(186,215,247,.12)',
      authBar2: barStep >= 2 ? '#7A55F6' : 'rgba(186,215,247,.12)',
      authBar3: barStep >= 3 ? '#7A55F6' : 'rgba(186,215,247,.12)',
      authIdLabel: step === 'loginId' ? L.loginIdLabel : st.authMethod === 'email' ? L.emailLabel : st.authMethod === 'wa' ? L.waLabel : L.zaloLabel,
      authIdPh: step === 'loginId' ? L.loginIdPh : st.authMethod === 'email' ? L.emailPh : st.authMethod === 'wa' ? L.waPh : L.zaloPh,
      authIdIcon: step === 'loginId' ? 'ph-bold ph-user' : st.authMethod === 'email' ? 'ph-bold ph-envelope-simple' : st.authMethod === 'wa' ? 'ph-bold ph-whatsapp-logo' : 'ph-bold ph-chat-circle-dots',
      authIdType: step === 'loginId' ? 'text' : st.authMethod === 'email' ? 'email' : 'tel',
      authIdValue: st.authId,
      onAuthId: (e) => this.setState({ authId: e.target.value, authErr:'' }),
      authOtpValue: st.authOtp,
      onAuthOtp: (e) => this.setState({ authOtp: e.target.value.replace(/\D/g, '').slice(0, 6), authErr:'' }),
      authOtpCells: [0,1,2,3,4,5].map(i => ({
        ch: st.authOtp[i] || '',
        bd: st.authOtp.length === i ? '#B6D9FC' : st.authOtp[i] ? 'rgba(186,215,247,.28)' : 'rgba(186,215,247,.12)'
      })),
      authPassValue: st.authPass, authPass2Value: st.authPass2,
      onAuthPass: (e) => this.setState({ authPass: e.target.value, authErr:'' }),
      onAuthPass2: (e) => this.setState({ authPass2: e.target.value, authErr:'' }),
      authPassType: st.authShowPass ? 'text' : 'password',
      authPassEye: st.authShowPass ? 'ph-bold ph-eye-slash' : 'ph-bold ph-eye',
      toggleAuthPass: () => this.setState({ authShowPass: !st.authShowPass }),
      authErr: st.authErr, authErrShow: !!st.authErr,
      authSubmit: () => this.authStep(),
      authBack: () => this.authBack(),
      authBackIcon: step === 'method' || step === 'loginId' ? 'ph-bold ph-x' : 'ph-bold ph-arrow-left',
      pickEmail: () => this.setState({ auth:'id', authMethod:'email', authId:'', authErr:'' }),
      pickWa: () => this.setState({ auth:'id', authMethod:'wa', authId:'', authErr:'', authOtp:'' }),
      authResend: () => this.say(L.otpResent),
      authForgot: () => this.say(L.forgotToast),
      authSwitchQ: isLogin ? L.noAccount : L.haveAccount,
      authSwitchLabel: isLogin ? L.signUp : L.logIn,
      authSwitch: () => this.openAuth(isLogin ? 'signup' : 'login', st.authNext, st.authNote),

      socialBtns: ['fb','ig','zalo'].map(k => ({
        label: L.socialWith + ' ' + SRC[k].label, icon: SRC[k].icon, color: SRC[k].color,
        go: k === 'zalo'
          ? () => this.setState({ auth:'id', authMethod:'zalo', authId:'', authErr:'', authOtp:'' })
          : () => this.socialLogin(k)
      })),
      cxOpen: !!st.cx,
      cxSrcLabel: st.cx ? SRC[st.cx.src].label : '',
      cxIcon: st.cx ? SRC[st.cx.src].icon : 'ph-fill ph-link',
      cxColor: st.cx ? SRC[st.cx.src].color : '#B6D9FC',
      cxStepPhone: !!st.cx && st.cx.step === 'phone',
      cxStepOtp: !!st.cx && st.cx.step === 'otp',
      cxStepConfirm: !!st.cx && st.cx.step === 'confirm',
      cxTitle: st.cx ? (st.cx.step === 'otp' ? L.otpTitle : st.cx.step === 'confirm' ? L.cxTitleConfirm : L.cxTitleWord + ' ' + SRC[st.cx.src].label.toUpperCase()) : '',
      cxSub: st.cx ? (st.cx.step === 'phone' ? L.cxSubPhone
        : st.cx.step === 'otp' ? (st.cx.src === 'wa' ? L.otpSentWa : L.otpSentZalo) + ' ' + st.cx.id.trim()
        : st.cx.step === 'confirm' ? L.cxSubConfirm : L.cxSubRedirect) : '',
      cxCta: st.cx ? (st.cx.step === 'phone' ? L.sendCode
        : st.cx.step === 'redirect' ? L.cxGo + ' ' + SRC[st.cx.src].label : L.cxConfirmCta) : '',
      cxIdLabel: st.cx ? (st.cx.src === 'wa' ? L.waLabel : L.zaloLabel) : '',
      cxIdPh: st.cx ? (st.cx.src === 'wa' ? L.waPh : L.zaloPh) : '',
      cxIdValue: st.cx ? st.cx.id : '',
      onCxId: (e) => this.cxSet({ id: e.target.value, err:'' }),
      cxOtpValue: st.cx ? st.cx.otp : '',
      onCxOtp: (e) => this.cxSet({ otp: e.target.value.replace(/\D/g, '').slice(0, 6), err:'' }),
      cxOtpCells: [0,1,2,3,4,5].map(i => {
        const o = (st.cx ? st.cx.otp : '') || '';
        return { ch: o[i] || '', bd: o.length === i ? '#B6D9FC' : o[i] ? 'rgba(186,215,247,.28)' : 'rgba(186,215,247,.12)' };
      }),
      cxScopes: [
        { icon:'ph-fill ph-user-circle', t:L.cxScope1 },
        { icon:'ph-fill ph-users-three', t:L.cxScope2 },
        { icon:'ph-fill ph-shield-check', t:L.cxScope3 }
      ],
      cxErr: st.cx ? st.cx.err : '', cxErrShow: !!(st.cx && st.cx.err),
      cxSubmit: () => this.cxStep(),
      cxClose: () => this.setState({ cx:null }),
      connected, notConnected: !!st.user && !connected,
      connectRows: ['fb','ig','zalo','wa'].map(k => {
        const on = !!st.user && (st.user.socials || (st.user.social ? [st.user.social] : [])).indexOf(k) >= 0;
        return {
          label: SRC[k].label, icon: SRC[k].icon, color: SRC[k].color,
          state: on ? L.connectedToast : L.connect,
          stateColor: on ? '#6CC7B6' : '#B6D9FC',
          go: () => this.connectSocial(k)
        };
      }),
      friendsAll: connected ? FRIENDS.map(f => this.fView(f)) : [],
      friendsCountLine: FRIENDS.length + ' · ' + (g === 'vi' ? 'qua ' : 'via ') + (connected ? SRC[st.user.social].label : ''),

      friendsOnly: st.friendsOnly,
      friendsFilterBg: st.friendsOnly ? '#B6D9FC' : 'rgba(20,24,38,.7)',
      friendsFilterBd: st.friendsOnly ? '#B6D9FC' : 'rgba(186,215,247,.12)',
      friendsFilterFg: st.friendsOnly ? '#090B16' : '#9DA7BA',
      toggleFriendsOnly: () => this.setState({ friendsOnly: !st.friendsOnly, mapSel:null }),
      showFriendsFilter: connected,

      friendRowShow: friendEvents.length > 0,
      friendRow: friendEvents.slice(0, 4).map(e => {
        const fr = this.fGoing(e.id);
        return {
          title: e.title, art: e.art,
          whenLine: this.fmtWhen(e),
          faces: fr.slice(0, 3).map(f => ({ initials: initialsOf(f.name), color: f.color })),
          line: fr.length + ' ' + L.friendsGoing,
          open: () => this.setState({ detail: e.id })
        };
      }),
      tipShow: connected && !st.tipHidden && friendEvents.length > 0,
      tipLine: L.friendsSaved.replace('{n}', '3'),
      hideTip: () => this.setState({ tipHidden:true }),
      tipGo: () => this.setState({ detail: friendEvents.length ? friendEvents[0].id : null }),

      detailFriends: dGoing.map(f => this.fView(f)),
      hasDetailFriends: dGoing.length > 0,
      detailFriendsLine: dGoing.length + ' ' + L.friendsGoing,
      detailProofShow: dInt.length > 0,
      detailProofLine: dInt.length ? (dInt[0].name + (dInt.length > 1 ? ' ' + L.andOthers.replace('{n}', String(dInt.length - 1)) : '') + ' ' + L.alsoInterested) : '',
      imGoing: !!(detail && st.going[detail.id]),
      openInvite: () => { if (!connected) return this.say(L.noFriendsBody); this.setState({ invite: detail ? detail.id : null, inviteSel:{}, sheet:null }); },

      friendSheetOpen: !!fSel,
      closeFriendSheet: () => this.setState({ friendSheet:null }),
      fsName: fSel ? fSel.name : '', fsInitials: fSel ? initialsOf(fSel.name) : '',
      fsColor: fSel ? fSel.color : 'linear-gradient(135deg,#B6D9FC,#7A55F6)',
      fsIcon: fSel ? SRC[fSel.src].icon : '', fsIconColor: fSel ? SRC[fSel.src].color : '#9DA7BA',
      fsSrcLabel: fSel ? SRC[fSel.src].label : '',
      fsMutual: fSel ? (fSel.going.length + fSel.interested.length) + ' ' + L.mutual : '',
      fsFollowLabel: fSel && st.following[fSel.id] ? L.followingLabel : L.follow,
      fsFollowBd: fSel && st.following[fSel.id] ? '#7A55F6' : 'rgba(186,215,247,.12)',
      fsFollowFg: fSel && st.following[fSel.id] ? '#C4B8F7' : '#9DA7BA',
      fsFollow: () => { if (!fSel) return; const fo = Object.assign({}, st.following); fo[fSel.id] = !fo[fSel.id]; this.setState({ following:fo }); },
      fsChat: () => this.openChat(st.friendSheet),
      fsGoingList: fSel ? fSel.going.map(id => { const e = EVENTS.find(x => x.id === id); return { title: e ? e.title : id, when: e ? this.fmtWhen(e) : '', open: () => this.setState({ friendSheet:null, detail:id }) }; }) : [],

      chatOpen: !!chatF,
      chatName: chatF ? chatF.name : '', chatInitials: chatF ? initialsOf(chatF.name) : '',
      chatColor: chatF ? chatF.color : 'linear-gradient(135deg,#B6D9FC,#7A55F6)',
      chatSrc: chatF ? SRC[chatF.src].label : '',
      chatEmpty: chatLog.length === 0,
      chatDot: chatF ? (chatF.online ? '#3FB8A3' : '#8A94A8') : '#8A94A8',
      chatStatus: chatF ? (chatF.online ? L.inboxOnline : L.inboxOffline) : '',
      chatMsgs: chatLog.map((m, i) => ({
        text: m.t, key: i,
        isCard: !!m.invite, isText: !m.invite,
        cardTitle: m.invite ? m.invite.title : '',
        cardWhen: m.invite ? m.invite.when : '',
        openCard: m.invite ? () => this.setState({ chatWith:null, detail: m.invite.id }) : () => {},
        align: m.me ? 'flex-end' : 'flex-start',
        bg: m.me ? '#B6D9FC' : 'rgba(20,24,38,.85)',
        fg: m.me ? '#090B16' : '#D8ECF8',
        radius: m.me ? '16px 16px 4px 16px' : '16px 16px 16px 4px'
      })),
      chatDraft: st.chatDraft,
      onChatDraft: (e) => this.setState({ chatDraft: e.target.value }),
      sendChat: async () => {
        const t = st.chatDraft.trim(); if (!t || !chatF) return;
        const all = Object.assign({}, st.chats);
        all[chatF.id] = (all[chatF.id] || []).concat([{ t, me:true }]);
        this.setState({ chats: all, chatDraft:'' });
        try {
          await FF.post('/me/chats/' + chatF.id, { body: t });
          await this.loadChat(chatF.id);
        } catch (e) { this.fail(e); }
      },
      closeChat: () => this.setState({ chatWith:null, chatDraft:'' }),

      orgPanelOpen: st.orgPanel,
      closeOrgs: () => this.setState({ orgPanel:false }),
      orgFollowed: this.orgList().filter(o => st.orgFollow[o.name]).map(o => this.orgRow(o)),
      orgOthers: this.orgList().filter(o => !st.orgFollow[o.name]).map(o => this.orgRow(o)),
      orgEmpty: !this.orgList().some(o => st.orgFollow[o.name]),

      hypedPanelOpen: st.hypedPanel,
      closeHyped: () => this.setState({ hypedPanel:false }),
      hypedEmpty: hypedUp.length === 0 && hypedPast.length === 0,
      hypedRows: hypedUp.map(e => this.hypeRow(e, false)),
      hypedPastRows: st.showPastHyped ? hypedPast.map(e => this.hypeRow(e, true)) : [],
      hypedHasPast: hypedPast.length > 0,
      hypedPastLabel: (st.showPastHyped ? L.hypedHidePast : L.hypedShowPast).replace('{n}', String(hypedPast.length)),
      togglePastHyped: () => this.setState({ showPastHyped: !st.showPastHyped }),

      guideRowSub: detail ? L.guideRowSub.replace('{n}', detail.area) : '',
      openGuide: () => { if (!detail) return; this.setState({ guideOpen: detail.id }); this.loadGuide(detail); },
      guidePanel: !!guideEv,
      closeGuide: () => this.setState({ guideOpen:null }),
      guideEvTitle: guideEv ? guideEv.title : '',
      guideEvSub: guideEv ? (guideEv.area + ' · ' + guideEv.startTime) : '',
      guideBusy: !!(guideSt && guideSt.loading),
      guideFail: !!(guideSt && guideSt.error),
      guideReady: !!(guideSt && guideSt.data),
      retryGuide: () => { if (guideEv) this.loadGuide(guideEv, true); },
      guideBefore: this.guideItems(gd.before),
      guideAfter: this.guideItems(gd.after),
      guideExplore: this.guideItems(gd.explore),
      guideWearHead: (gd.wear && gd.wear.headline) || '',
      guideWearItems: (gd.wear && Array.isArray(gd.wear.items) ? gd.wear.items : []).slice(0, 4).map(x => ({ text:x })),
      guideAvoid: (gd.wear && gd.wear.avoid) || '',
      guideHasAvoid: !!(gd.wear && gd.wear.avoid),
      guideTipText: gd.tip || '',
      guideHasTip: !!gd.tip,

      bestieOpen: !!bEv,
      bestieEvTitle: bEv ? bEv.title : '',
      bestieSubLine: L.bSub.replace('{n}', String(bCount)),
      bestieRows: this.bestieList(bEv),
      dimBestie: () => this.setState({ bestieSplash:null, bestieArmed:null }),
      bestieToGuide: () => { if (!bEv) return; this.setState({ bestieSplash:null, guideOpen: bEv.id }); this.openDetail(bEv.id); this.loadGuide(bEv); },

      hasDetailPlan: !!dPlan,
      planRowSub: dPlan ? (() => {
        const sp = dPlan.meetSpot ? dPlan.meetSpots.filter(s => s.id === dPlan.meetSpot)[0] : null;
        return FF.text(dPlan.headsLine, g) + (sp ? ' · ' + sp.time : '');
      })() : '',
      openDetailPlan: () => { const id = detail ? detail.id : null; this.setState({ planOpen: id, planTab:'group' }); if (id) this.loadPlan(id); },

      planPanel: !!planEv,
      closePlan: () => this.setState({ planOpen:null, planDraft:'' }),
      planEvTitle: planEv ? planEv.title : '',
      planEvWhen: planEv ? this.fmtWhen(planEv) : '',
      planHeadLine: plan ? FF.text(plan.headsLine, g) : '',
      planOnGroup: st.planTab !== 'chat',
      planOnChat: st.planTab === 'chat',
      planTabGBg: st.planTab !== 'chat' ? '#B6D9FC' : 'transparent',
      planTabGFg: st.planTab !== 'chat' ? '#090B16' : '#9DA7BA',
      planTabCBg: st.planTab === 'chat' ? '#B6D9FC' : 'transparent',
      planTabCFg: st.planTab === 'chat' ? '#090B16' : '#9DA7BA',
      goPlanGroup: () => this.setState({ planTab:'group' }),
      goPlanChat: () => this.setState({ planTab:'chat' }),

      planMemberList: pMembers.map(m => {
        const on = m.status === 'going';
        return {
          initials: m.initials || initialsOf(m.name),
          color: m.photoUrl ? 'url("' + m.photoUrl + '") center/cover no-repeat' : FF.colorFor(m.userId),
          name: m.owner ? L.planYou : m.name,
          status: on ? L.planGoing : L.planPending,
          statusFg: on ? '#7FD3C3' : '#9DA7BA', statusBd: on ? '#1D4E47' : 'rgba(186,215,247,.12)'
        };
      }),

      planSpotList: pSpots.map(s => {
        const on = !!(plan && plan.meetSpot === s.id);
        return {
          name: FF.text(s.name, g), time: s.time,
          icon: { gate:'ph-fill ph-door-open', cafe:'ph-fill ph-coffee', park:'ph-fill ph-motorcycle' }[s.id] || 'ph-fill ph-map-pin',
          bd: on ? '#B6D9FC' : 'rgba(186,215,247,.12)',
          fg: on ? '#B6D9FC' : '#9DA7BA',
          dotBg: on ? '#B6D9FC' : 'transparent',
          dotBd: on ? '#B6D9FC' : 'rgba(186,215,247,.24)',
          tick: on ? '1' : '0',
          pick: async () => {
            const id = this.planIdFor(st.planOpen);
            if (!id) return;
            try {
              await FF.patch('/plans/' + id, { meetSpot: s.id });
              await this.loadPlan(st.planOpen);
              this.say(L.planSpotSet.replace('{n}', s.time));
            } catch (e) { this.fail(e); }
          }
        };
      }),

      planHasSplit: !!(pSplit && pSplit.perHead > 0),
      planNoSplit: !!(pSplit && !pSplit.perHead),
      planTotalVal: pSplit ? this.money(pSplit.total) : '',
      planPerVal: pSplit ? this.money(pSplit.perHead) : '',
      planPaidLine: pSplit ? FF.text(pSplit.paidLine, g) : '',
      planNoneGoing: !pGoing.length,
      planSplitRows: pGoing.map(m => ({
        name: m.name, initials: m.initials || initialsOf(m.name), color: FF.colorFor(m.userId),
        amount: pSplit ? this.money(pSplit.perHead) : '',
        label: m.paid ? L.planPaid : L.planUnpaid,
        fg: m.paid ? '#7FD3C3' : '#C7D3EA', bd: m.paid ? '#1D4E47' : 'rgba(186,215,247,.12)',
        bg: m.paid ? 'rgba(29,78,71,.22)' : 'transparent',
        toggle: async () => {
          const id = this.planIdFor(st.planOpen);
          if (!id) return;
          try {
            await FF.patch('/plans/' + id + '/members/' + m.userId, { paid: !m.paid });
            await this.loadPlan(st.planOpen);
          } catch (e) { this.fail(e); }
        },
        remind: async () => {
          const id = this.planIdFor(st.planOpen);
          if (!id) return;
          try {
            const out = await FF.post('/plans/' + id + '/members/' + m.userId + '/remind');
            this.say(FF.text(out.message, g) || L.planReminded.replace('{n}', m.name));
          } catch (e) { this.fail(e); }
        }
      })),

      planChatEmpty: !!(plan && !plan.messages.length),
      planMsgs: plan ? plan.messages.map(m => ({
        align: m.fromMe ? 'flex-end' : 'flex-start',
        bg: m.fromMe ? '#B6D9FC' : 'rgba(20,24,38,.85)',
        fg: m.fromMe ? '#090B16' : '#D8ECF8',
        radius: m.fromMe ? '16px 16px 5px 16px' : '16px 16px 16px 5px',
        who: m.fromMe ? '' : m.author, showWho: !m.fromMe, text: m.body
      })) : [],
      planDraft: st.planDraft,
      onPlanDraft: (e) => this.setState({ planDraft: e.target.value }),
      sendPlanMsg: async () => {
        const t = st.planDraft.trim();
        const id = this.planIdFor(st.planOpen);
        if (!t || !id) return;
        this.setState({ planDraft:'' });
        try {
          await FF.post('/plans/' + id + '/messages', { body: t });
          await this.loadPlan(st.planOpen);
        } catch (e) { this.fail(e); }
      },
      inviteOpen: !!st.invite,
      closeInvite: () => this.setState({ invite:null, inviteSel:{} }),
      inviteList: FRIENDS.map(f => ({
        name: f.name, initials: initialsOf(f.name), color: f.color,
        icon: SRC[f.src].icon, iconColor: SRC[f.src].color,
        bd: st.inviteSel[f.id] ? '#B6D9FC' : 'rgba(186,215,247,.12)',
        tickBg: st.inviteSel[f.id] ? '#B6D9FC' : 'transparent',
        tickBd: st.inviteSel[f.id] ? '#B6D9FC' : 'rgba(186,215,247,.24)',
        tick: st.inviteSel[f.id] ? '1' : '0',
        pick: () => { const s = Object.assign({}, st.inviteSel); s[f.id] = !s[f.id]; this.setState({ inviteSel:s }); }
      })),
      inviteCta: inviteN ? L.planCta + ' · ' + inviteN : L.planCta,
      sendInvites: async () => {
        if (!inviteN) return this.say(L.inviteNone);
        const evId = st.invite;
        const ids = Object.keys(st.inviteSel).filter(k => st.inviteSel[k]);
        try {
          const out = await FF.post('/events/' + evId + '/invites', { friendIds: ids });
          const planIds = Object.assign({}, st.planIds); planIds[evId] = out.planId;
          const names = ids.map(id => (FRIENDS.filter(f => f.id === id)[0] || {}).name).filter(Boolean);
          this.setState({
            planIds, invite:null, inviteSel:{}, planOpen: evId, planTab:'group',
            inviteLog: [{ evId, names, t: Date.now() }].concat(st.inviteLog)
          });
          await this.loadPlan(evId);
          await this.flag('going', evId, true);
          this.say(FF.text(out.message, g) || L.planCreated.replace('{n}', String(ids.length + 1)));
        } catch (e) { this.fail(e); }
      },
      L, langLabel: g === 'vi' ? 'VI' : 'EN',
      alertLine: alBits.length ? alBits.join(' · ') : L.alertNone,
      alertOn: st.alertOn,
      alertKnobJustify: st.alertOn ? 'flex-end' : 'flex-start',
      alertTrackBg: st.alertOn ? '#7A55F6' : '#2B3347',
      alertKnobBg: st.alertOn ? '#D8ECF8' : '#9DA7BA',
      alertSubLine: st.alertOn ? L.smartAlertSub : L.smartAlertOff,
      alertLineFg: st.alertOn ? '#D8ECF8' : '#9DA7BA',
      toggleAlert: () => {
        const v = !st.alertOn;
        this.setState({ alertOn: v });
        this.say(v ? L.alertOnToast : L.alertOffToast);
        this.saveAlertSoon();
      },
      openAlert: () => this.setState({ alertPanel:true }),
      closeAlert: () => this.setState({ alertPanel:false }),
      alertPanelOpen: st.alertPanel,
      alertGenreChips: GENRES.filter(x => x !== 'All').map(x => this.alChip('alGenres', x, x)),
      alertArtistChips: AL_ARTISTS.map(x => this.alChip('alArtists', x, x)),
      alertOrgChips: AL_ORGS.map(x => this.alChip('alOrgs', x, x)),
      alertAreaChips: AL_AREAS.map(x => this.alChip('alAreas', x, x)),
      alertCapChips: AL_CAPS.map(c => ({
        label: c.v === 0 ? L.alertFree : (c.v >= 9e9 ? L.alertAny : this.money(c.v)),
        bg: st.alCap === c.v ? '#7A55F6' : 'transparent',
        fg: st.alCap === c.v ? '#090B16' : '#C7D3EA',
        bd: st.alCap === c.v ? '#7A55F6' : 'rgba(186,215,247,.12)',
        pick: () => { this.setState({ alCap: c.v }); this.saveAlertSoon(); }
      })),
      alertMatchLine: L.alertMatches.replace('{n}', String(st.alMatches)),
      saveAlert: async () => {
        this.setState({ alertPanel:false, alertOn:true });
        await this.saveAlertNow();
        this.say(L.alertSaved);
      },
      locationLabel: g === 'vi' ? 'Quận 1, TP.HCM' : 'District 1, HCMC',
      isOnboard: st.stage !== 'app', isApp: st.stage === 'app',
      obLocation: st.stage === 'location', obInterests: st.stage === 'interests',
      obReadyOpacity: nInterest ? '1' : '.45',
      grantLocation: () => this.setState({ stage:'interests' }),
      skipLocation: () => this.setState({ stage:'interests' }),
      finishOnboard: () => this.setState({ stage:'app' }),
      toggleLang: () => this.setState({ lang: g === 'vi' ? 'en' : 'vi' }),
      viBg: g === 'vi' ? '#B6D9FC' : 'transparent', viFg: g === 'vi' ? '#090B16' : '#9DA7BA',
      enBg: g === 'en' ? '#B6D9FC' : 'transparent', enFg: g === 'en' ? '#090B16' : '#9DA7BA',
      onLogoTap: () => this.say(g === 'vi' ? 'Chế độ quản trị ở vòng sau' : 'Admin mode lands in the next round'),

      tabExplore: st.tab === 'explore', tabSaved: st.tab === 'saved', tabMap: st.tab === 'map', tabProfile: st.tab === 'profile',
      navItems: navDefs.map(n => ({
        label:n.label, icon:n.icon, color: st.tab === n.k ? '#B6D9FC' : '#8A94A8',
        go: () => { this.setState({ tab:n.k, mapSel:null }); if (n.k === 'profile') FF.appRest(this); }
      })),

      query: st.q, hasQuery: !!st.q,
      onQuery: (e) => this.refilter({ q: e.target.value }),
      clearQuery: () => this.refilter({ q:'' }),

      timeChips: timeDefs.map(t => ({
        label:t.label, icon:t.icon,
        bg: st.time === t.k ? '#B6D9FC' : 'rgba(13,16,28,.6)',
        bd: st.time === t.k ? '#B6D9FC' : 'rgba(186,215,247,.12)',
        fg: st.time === t.k ? '#090B16' : '#9DA7BA',
        glow: st.time === t.k ? '0 6px 20px rgba(182,217,252,.3)' : 'none',
        pick: () => t.k === 'date'
          ? this.setState({ datePanel: !st.datePanel, artistPanel:false, time:'date' })
          : this.refilter({ time:t.k, datePanel:false, range:[null,null] })
      })),
      datePanel: st.datePanel, calCells: cells,
      weekdayNames: WD[g].map(n => ({ n })),
      calTitle: MONTHS[g][st.calMonth] + ' ' + st.calYear,
      calPrevOpacity: st.calMonth <= 8 && st.calYear <= 2026 ? '.35' : '1',
      calPrev: () => { if (st.calMonth <= 8 && st.calYear <= 2026) return; const m = st.calMonth - 1; this.setState(m < 0 ? { calMonth:11, calYear:st.calYear - 1 } : { calMonth:m }); },
      calNext: () => { const m = st.calMonth + 1; this.setState(m > 11 ? { calMonth:0, calYear:st.calYear + 1 } : { calMonth:m }); },
      calSummary: rs ? rangeLabel + ' · ' + list.length + (g === 'vi' ? ' sự kiện' : ' events') : (g === 'vi' ? 'Chọn ngày bắt đầu và kết thúc' : 'Pick a start and end date'),
      calClear: () => this.refilter({ range:[null,null], time:'weekend', datePanel:false }),
      calDone: () => this.setState({ datePanel:false }),

      artistPill: {
        label: st.artist || L.artist,
        bg: st.artist ? '#1A1236' : 'rgba(13,16,28,.6)',
        bd: st.artist ? '#7A55F6' : 'rgba(186,215,247,.12)',
        fg: st.artist ? '#C4B8F7' : '#9DA7BA'
      },
      artistChosen: !!st.artist, artistNotChosen: !st.artist,
      clearArtist: () => this.refilter({ artist:null }),
      toggleArtistPanel: () => this.setState({ artistPanel: !st.artistPanel, datePanel:false }),
      artistPanel: st.artistPanel, artistQuery: st.artistQ,
      onArtistQuery: (e) => this.setState({ artistQ: e.target.value }),
      artistEmpty: artistNames.length === 0,
      artistList: artistNames.map(a => ({
        name:a, count: artistCounts[a] + (g === 'vi' ? ' sự kiện' : ' events'),
        bg: st.artist === a ? '#1A1236' : 'transparent',
        fg: st.artist === a ? '#C4B8F7' : '#D8ECF8',
        pick: () => { this.refilter({ artist:a, artistPanel:false, artistQ:'' }); this.say(g === 'vi' ? 'Lọc theo ' + a : 'Filtered to ' + a); }
      })),

      genrePill: {
        label: st.genre === 'All' ? L.genreLabel : st.genre,
        bg: st.genre !== 'All' ? '#1A1236' : 'rgba(13,16,28,.6)',
        bd: st.genre !== 'All' ? '#7A55F6' : 'rgba(186,215,247,.12)',
        fg: st.genre !== 'All' ? '#D6CFFA' : '#9DA7BA'
      },
      genrePanel: st.genrePanel,
      toggleGenrePanel: () => this.setState({ genrePanel: !st.genrePanel, artistPanel:false, datePanel:false }),
      genreList: GENRES.map(n => ({
        name: n === 'All' ? (g === 'vi' ? 'Tất cả thể loại' : 'All genres') : n,
        count: String(EVENTS.filter(e => n === 'All' || e.genre === n).length),
        bg: st.genre === n ? '#1A1236' : 'transparent',
        fg: st.genre === n ? '#D6CFFA' : '#D8ECF8',
        pick: () => this.refilter({ genre:n, genrePanel:false })
      })),


      /* ---- offline, wallet, payment requests ---- */
      detailFollow: async () => {
        if (!detail) return;
        if (!st.user) return this.openAuth('signup', null, L.gateSave);
        const id = detail.organizerId, on = !!st.orgFollow[id];
        const f = Object.assign({}, st.orgFollow);
        if (on) delete f[id]; else f[id] = true;
        this.setState({ orgFollow:f });
        try {
          if (on) await FF.del('/me/follows/organizers/' + id);
          else await FF.put('/me/follows/organizers/' + id);
          this.say((on ? L.followOff : L.followOn).replace('{n}', detail.organizer));
        } catch (e) { this.fail(e); await this.reloadFollows(); }
      },
      detailFollowLabel: detail && st.orgFollow[detail.organizerId] ? L.following : L.follow,
      detailFollowBd: detail && st.orgFollow[detail.organizerId] ? 'rgba(186,215,247,.24)' : '#B6D9FC',
      detailFollowFg: detail && st.orgFollow[detail.organizerId] ? '#9DA7BA' : '#B6D9FC',
      detailFollowBg: detail && st.orgFollow[detail.organizerId] ? 'rgba(20,24,38,.7)' : 'transparent',

      reportOpen: !!st.reportFor,
      openReport: () => this.setState({ reportFor: detail ? detail.id : 'x', reportCode:'wrong' }),
      closeReport: () => this.setState({ reportFor:null }),
      reportCodes: [
        { k:'wrong', icon:'ph-fill ph-info', label:L.rWrong },
        { k:'cancelled', icon:'ph-fill ph-calendar-x', label:L.rCancelled },
        { k:'scam', icon:'ph-fill ph-warning-octagon', label:L.rScam },
        { k:'dup', icon:'ph-fill ph-copy', label:L.rDup },
        { k:'price', icon:'ph-fill ph-tag', label:L.rPrice }
      ].map(c => {
        const on = st.reportCode === c.k;
        return { label:c.label, icon:c.icon,
          bg: on ? 'rgba(182,217,252,.1)' : 'rgba(20,24,38,.6)',
          bd: on ? '#B6D9FC' : 'rgba(186,215,247,.12)',
          fg: on ? '#D8ECF8' : '#C7D3EA',
          iconFg: on ? '#D8ECF8' : '#9DA7BA',
          dotBg: on ? '#B6D9FC' : 'transparent',
          dotBd: on ? '#B6D9FC' : 'rgba(186,215,247,.24)',
          tick: on ? '1' : '0',
          pick: () => this.setState({ reportCode:c.k }) };
      }),
      sendReport: async () => {
        const id = st.reportFor;
        this.setState({ reportFor:null });
        if (!id || id === 'x') return;
        try {
          const out = await FF.post('/events/' + id + '/reports', { code: st.reportCode });
          this.say(FF.text(out.message, g) || L.reportSent);
        } catch (e) { this.fail(e); }
      },

      notifPrefOpen: st.notifPrefOpen,
      closeNotifPrefs: () => this.setState({ notifPrefOpen:false }),
      notifOnLine: L.notifOnLine.replace('{n}', String(['saved','tickets','sets','friends','orgs']
        .reduce((n, k) => n + ['push','zalo','email'].filter(c => st.notifM[k][c]).length, 0))),
      notifCols: [
        { k:'push', label:'Push', icon:'ph-bold ph-device-mobile' },
        { k:'zalo', label:'Zalo', icon:'ph-bold ph-chat-circle-dots' },
        { k:'email', label:'Email', icon:'ph-bold ph-envelope-simple' }
      ],
      notifRows: [
        { k:'saved', icon:'ph-fill ph-heart', label:L.nrSaved },
        { k:'tickets', icon:'ph-fill ph-ticket', label:L.nrTickets },
        { k:'sets', icon:'ph-fill ph-clock-countdown', label:L.nrSets },
        { k:'friends', icon:'ph-fill ph-users-three', label:L.nrFriends },
        { k:'orgs', icon:'ph-fill ph-buildings', label:L.nrOrgs }
      ].map(r => ({
        label:r.label, icon:r.icon,
        cells: ['push','zalo','email'].map(c => {
          const on = !!st.notifM[r.k][c];
          return {
            icon: on ? 'ph-fill ph-check-circle' : 'ph-bold ph-circle',
            color: on ? '#B6D9FC' : 'rgba(186,215,247,.24)',
            bg: on ? 'rgba(182,217,252,.1)' : 'transparent',
            bd: on ? 'rgba(182,217,252,.4)' : '#151A28',
            toggle: () => {
              const m = Object.assign({}, st.notifM);
              m[r.k] = Object.assign({}, m[r.k]); m[r.k][c] = !on;
              this.setState({ notifM:m });
              // Switching push on is the tap that lets the browser ask for notifications.
              if (c === 'push' && !on && FF.enablePush) FF.enablePush().catch(() => {});
              clearTimeout(this._np);
              this._np = setTimeout(() => FF.fire(FF.put('/me/notification-preferences', { matrix: this.state.notifM }), (e) => this.fail(e)), 500);
            }
          };
        })
      })),
      offlineOn: st.offline,
      toggleOffline: () => {
        this.setState({ offline: !st.offline });
        this.say(st.offline ? (g === 'vi' ? 'Đã có mạng lại' : 'Back online') : (g === 'vi' ? 'Đang giả lập mất mạng' : 'Simulating no signal'));
      },
      offLabel: st.offline ? L.offOn : L.offOff,
      offIcon: st.offline ? 'ph-fill ph-cloud-slash' : 'ph-fill ph-cloud-check',
      offBg: st.offline ? 'rgba(228,109,76,.14)' : 'rgba(38,150,132,.14)',
      offBd: st.offline ? 'rgba(228,109,76,.45)' : 'rgba(38,150,132,.45)',
      offFg: st.offline ? '#F0A07F' : '#6CC7B6',
      liveOffIcon: st.offline ? 'ph-fill ph-cloud-slash' : 'ph-bold ph-cloud-slash',
      liveOffColor: st.offline ? '#F0A07F' : '#9D84F8',
      liveOffText: st.liveData
        ? FF.text(st.offline ? st.liveData.offline.offline : st.liveData.offline.online, g)
        : (st.offline ? L.liveOfflineOn : L.liveOffline),
      walletApple: () => this.addToWallet('apple'),
      walletGoogle: () => this.addToWallet('google'),

      planOwed: !!(pSplit && pSplit.owedCount > 0),
      planOwedLine: pSplit ? FF.text(pSplit.owedLine, g) : '',
      payMethods: [
        { k:'vietqr', label:'VietQR', icon:'ph-fill ph-qr-code', color:'#6FB0F0', tint:'rgba(2,125,234,.16)' },
        { k:'momo', label:'Momo', icon:'ph-fill ph-wallet', color:'#E88AA8', tint:'rgba(232,138,168,.16)' },
        { k:'zalopay', label:'ZaloPay', icon:'ph-fill ph-chat-circle-dots', color:'#B6D9FC', tint:'rgba(182,217,252,.16)' }
      ].map(m => ({
        label:m.label, icon:m.icon, color:m.color,
        bg: st.payReq === m.k ? 'rgba(182,217,252,.1)' : 'rgba(5,6,15,.6)',
        bd: st.payReq === m.k ? '#B6D9FC' : 'rgba(186,215,247,.12)',
        fg: st.payReq === m.k ? '#D8ECF8' : '#C7D3EA',
        pick: async () => {
          this.setState({ payReq:m.k, payReqData:null });
          const id = this.planIdFor(st.planOpen);
          if (!id) return;
          const out = await FF.maybe(FF.post('/plans/' + id + '/payment-requests', { method: m.k }), null);
          if (out) this.setState({ payReqData: out });
        }
      })),
      payReqOpen: !!st.payReq,
      closePayReq: () => this.setState({ payReq:null }),
      payReq: (() => {
        const defs = {
          vietqr: { label:'VietQR', icon:'ph-fill ph-qr-code', color:'#6FB0F0', tint:'rgba(2,125,234,.16)' },
          momo: { label:'Momo', icon:'ph-fill ph-wallet', color:'#E88AA8', tint:'rgba(232,138,168,.16)' },
          zalopay: { label:'ZaloPay', icon:'ph-fill ph-chat-circle-dots', color:'#B6D9FC', tint:'rgba(182,217,252,.16)' }
        };
        const d = defs[st.payReq];
        if (!d || !plan || !pSplit) return { qrRows: [] };
        const pr = st.payReqData;
        return {
          icon: d.icon, color: d.color, tint: d.tint,
          title: L.payReqTitle.replace('{m}', d.label),
          sub: L.payReqSub.replace('{n}', String(pSplit.owedCount)).replace('{v}', this.money(pSplit.perHead)),
          amountLabel: L.payReqAmount, amount: this.money(pSplit.perHead),
          account: pr ? pr.accountLine : L.payReqAccount,
          ref: pr ? pr.reference : '',
          qrRows: this.qrRows(st.payReq + (pr ? pr.reference : '')),
          sendLabel: L.payReqSend, copyLabel: L.payReqCopy,
          note: pr ? FF.text(pr.note, g) : L.payReqNote,
          copy: () => {
            if (pr && navigator.clipboard) navigator.clipboard.writeText(pr.payload || pr.reference).catch(() => {});
            this.setState({ payReq:null });
            this.say(L.payReqCopied);
          },
          send: async () => {
            const id = this.planIdFor(st.planOpen);
            if (!id) return;
            try {
              const out = await FF.post('/plans/' + id + '/payment-requests', { method: st.payReq, post: true });
              this.setState({ payReq:null, planTab:'chat' });
              await this.loadPlan(st.planOpen);
              this.say(FF.text(out.message, g) || L.payReqSent);
            } catch (e) { this.fail(e); }
          }
        };
      })(),

      /* ---- live mode ---- */
      liveOpen: !!st.liveOpen,
      closeLive: () => this.setState({ liveOpen:null, liveData:null }),
      live: (() => {
        const d = st.liveData;
        if (!d) return { sets: [], site: [], friends: [], pins: [], stageTabs: [], friendsEmpty: true };
        const stage = d.stages[Math.min(st.liveStage, d.stages.length - 1)] || { sets: [], name: {} };
        const now = stage.sets.filter(s => s.state === 'now')[0] || stage.sets[0] || null;
        const nxt = stage.next;
        const stateMap = {
          played: { fg:'#9DA7BA', bg:'transparent', label:L.livePlayed },
          now: { fg:'#05060F', bg:'#B6D9FC', label:L.liveNow },
          next: { fg:'#D8ECF8', bg:'rgba(182,217,252,.12)', label:L.liveNext },
          later: { fg:'#C7D3EA', bg:'transparent', label:'' }
        };
        const minsLeft = now && now.endsAt ? Math.max(0, Math.round((new Date(now.endsAt).getTime() - FF.now().getTime()) / 60000)) : 0;
        const zoneOf = (id) => d.zones.filter(z => z.id === id)[0];
        return {
          title: d.event.title, art: d.event.art, venue: d.event.venueName,
          nowStage: FF.text(stage.name, g),
          nowArtist: now ? now.artist : '—', nowTime: now ? now.time : '',
          nowLeft: L.liveLeft.replace('{n}', String(minsLeft)),
          nowPct: Math.round(100 - (minsLeft / 90) * 100) + '%',
          nextLine: nxt ? nxt.time + ' · ' + nxt.artist : '—',
          stageTabs: d.stages.map((s, i) => ({
            label: FF.text(s.name, g),
            bg: i === st.liveStage ? 'rgba(182,217,252,.14)' : 'rgba(20,24,38,.6)',
            bd: i === st.liveStage ? '#B6D9FC' : 'rgba(186,215,247,.12)',
            fg: i === st.liveStage ? '#D8ECF8' : '#9DA7BA',
            pick: () => this.setState({ liveStage:i })
          })),
          sets: stage.sets.map(s => {
            const m = stateMap[s.state] || stateMap.later;
            const on = st.liveReminds[s.setId] !== undefined ? st.liveReminds[s.setId] : s.reminded;
            return {
              time: s.time, artist: s.artist,
              chip: m.label, chipShow: !!m.label,
              chipBg: m.bg, chipFg: m.fg,
              opacity: '1',
              timeFg: s.state === 'played' ? '#9DA7BA' : '#C7D3EA',
              artistFg: s.state === 'played' ? '#9DA7BA' : '#D8ECF8',
              rowBg: s.state === 'now' ? 'rgba(182,217,252,.07)' : 'transparent',
              rowBd: s.state === 'now' ? 'rgba(182,217,252,.4)' : '#151A28',
              remindShow: s.state === 'next' || s.state === 'later',
              remindLabel: on ? L.liveReminded.replace('{n}', s.time) : L.liveRemind,
              remindFg: on ? '#6CC7B6' : '#9DA7BA',
              remind: async () => {
                const r = Object.assign({}, st.liveReminds); r[s.setId] = !on;
                this.setState({ liveReminds:r });
                try {
                  if (on) await FF.del('/me/plan/sets/' + s.setId);
                  else await FF.put('/me/plan/sets/' + s.setId, { remind: true });
                  if (!on) this.say(L.liveReminded.replace('{n}', s.artist + ' · ' + s.time));
                } catch (e) { this.fail(e); }
              }
            };
          }),
          site: d.zones.map(z => ({
            label: z.label, icon: ZONE_ICON[z.kind] || ZONE_ICON.other, color: ZONE_COLOR[z.kind] || ZONE_COLOR.other,
            style: 'position:absolute;left:' + z.x + '%;top:' + z.y + '%;transform:translate(-50%,-50%);width:' + z.w + '%'
          })),
          friends: d.friendsOnSite.map(f => ({
            name: f.name, initials: f.initials || initialsOf(f.name), color: FF.colorFor(f.id),
            at: L.liveAt + ' ' + (f.zone || ''),
            wave: async () => {
              try {
                const out = await FF.post('/events/' + d.event.id + '/waves/' + f.id);
                this.say(FF.text(out.message, g) || L.liveWaved.replace('{n}', f.name.split(' ')[0]));
              } catch (e) { this.fail(e); }
            }
          })),
          friendsEmpty: d.friendsOnSite.length === 0,
          pins: d.friendsOnSite.map((f, i) => {
            const z = f.zoneId ? zoneOf(f.zoneId) : null;
            const bx = z ? z.x : 26 + i * 15;
            const by = z ? z.y : 58;
            return {
              initials: f.initials || initialsOf(f.name), color: FF.colorFor(f.id),
              first: f.name.split(' ')[0],
              hint: L.livePinHint.replace('{n}', f.zone || f.name),
              left: Math.max(8, Math.min(92, bx + (i % 2 ? 9 : -9))) + '%',
              top: Math.max(12, Math.min(88, by + (i % 3 === 0 ? 13 : -11))) + '%',
              tap: async () => {
                try {
                  const out = await FF.post('/events/' + d.event.id + '/waves/' + f.id);
                  this.say(FF.text(out.message, g) || L.liveWaved.replace('{n}', f.name.split(' ')[0]));
                } catch (e) { this.fail(e); }
              }
            };
          }),
          pinsLine: FF.text(d.friendsLine, g),
          meetSpot: L.liveMeetSet,
          sendLoc: async () => {
            const zone = (d.zones.filter(z => z.kind === 'stage')[0] || d.zones[0]);
            if (!zone) return;
            try {
              const out = await FF.post('/events/' + d.event.id + '/share-location', { zoneId: zone.id });
              this.say(FF.text(out.message, g) || L.liveMeetSent);
            } catch (e) { this.fail(e); }
          }
        };
      })(),

      /* ---- post-event recap ---- */
      recapOpen: !!st.recapOpen,
      closeRecap: () => this.setState({ recapOpen:null }),
      recap: (() => {
        const e = EVENTS.filter(x => x.id === st.recapOpen)[0];
        if (!e) return { stars: [], aspects: [], photos: [], stats: [] };
        const r = st.recap && st.recap.event.id === e.id ? st.recap : null;
        const labels = { sound:L.aspSound, crowd:L.aspCrowd, value:L.aspValue, org:L.aspOrg, queue:L.aspQueue, food:L.aspFood };
        const icons = { sound:'ph-fill ph-speaker-high', crowd:'ph-fill ph-users-three', value:'ph-fill ph-ticket',
          org:'ph-fill ph-clipboard-text', queue:'ph-fill ph-line-vertical', food:'ph-fill ph-bowl-food' };
        const asp = (r ? r.aspects : ['sound','crowd','value','org','queue','food']).map(k => ({ k, label: labels[k], icon: icons[k] }));
        const stats = r ? r.stats : { checkedInAt:null, setsSeen:0, friendsThere:0 };
        const nextEv = r ? r.next : null;
        return {
          title:e.title, art:e.art, organizer:e.organizer,
          when: this.fmtWhen(e),
          stars: [1,2,3,4,5].map(n => ({
            icon: n <= st.recapStars ? 'ph-fill ph-star' : 'ph-bold ph-star',
            color: n <= st.recapStars ? '#FFD35C' : 'rgba(186,215,247,.24)',
            pick: () => this.setState({ recapStars:n })
          })),
          starsHint: st.recapStars ? st.recapStars + '/5' : L.recapStars,
          aspects: asp.map(a => {
            const on = !!st.recapAspects[a.k];
            return {
              label:a.label, icon:a.icon,
              bg: on ? 'rgba(182,217,252,.14)' : 'rgba(20,24,38,.6)',
              bd: on ? '#B6D9FC' : 'rgba(186,215,247,.12)',
              fg: on ? '#D8ECF8' : '#C7D3EA',
              toggle: () => { const x = Object.assign({}, st.recapAspects); x[a.k] = !on; this.setState({ recapAspects:x }); }
            };
          }),
          photos: [0,1,2].map(i => ({
            filled: !!st.recapPhotos[i], empty: !st.recapPhotos[i],
            art: st.recapPhotos[i] ? 'url("' + st.recapPhotos[i].preview + '")' : 'none',
            add: () => {
              if (st.recapPhotos[i]) {
                const ph = st.recapPhotos.slice(); ph.splice(i, 1); this.setState({ recapPhotos:ph });
              } else if (this._recapInput) { this._recapIdx = i; this._recapInput.click(); }
            }
          })),
          recapInputRef: (el) => { this._recapInput = el; },
          onRecapPick: async (ev) => {
            const fl = ev.target.files && ev.target.files[0];
            if (!fl) return;
            const preview = URL.createObjectURL(fl);
            const ph = st.recapPhotos.concat([{ preview, url:null }]).slice(0, 3);
            this.setState({ recapPhotos: ph });
            this.say(L.photoAdded);
            try {
              const form = new FormData();
              form.append('file', fl);
              const up = await FF.api('POST', '/uploads?purpose=recap', form);
              this.setState(s => ({ recapPhotos: s.recapPhotos.map(x => x.preview === preview ? { preview, url: up.url } : x) }));
            } catch (err) {
              this.setState(s => ({ recapPhotos: s.recapPhotos.filter(x => x.preview !== preview) }));
              this.fail(err);
            }
          },
          stats: [
            { label:L.recapCheckedAt, value: stats.checkedInAt ? FF.hhmm(stats.checkedInAt) : (e.startTime || '—'), icon:'ph-fill ph-sign-in', color:'#B6D9FC' },
            { label:L.recapSetsSeen, value:String(stats.setsSeen), icon:'ph-fill ph-music-notes', color:'#9D84F8' },
            { label:L.recapFriendsThere, value:String(stats.friendsThere), icon:'ph-fill ph-users-three', color:'#6CC7B6' }
          ],
          submit: async () => {
            if (!st.recapStars) return this.say(L.recapNeedStars);
            try {
              const out = await FF.post('/events/' + e.id + '/recaps', {
                stars: st.recapStars,
                aspects: Object.keys(st.recapAspects).filter(k => st.recapAspects[k]),
                photoUrls: st.recapPhotos.map(x => x.url).filter(Boolean)
              });
              this.setState({ recapOpen:null, recapStars:0, recapAspects:{}, recapPhotos:[], recap:null });
              this.say(FF.text(out.message, g) || L.recapDone);
            } catch (err) { this.fail(err); }
          },
          nextShow: !!nextEv,
          nextLabel: nextEv ? FF.text(nextEv.label, g) : '',
          nextTitle: nextEv ? nextEv.title : '',
          nextArt: nextEv ? nextEv.art : 'none',
          nextWhen: nextEv ? FF.dayLabel(nextEv.startsOn, g) : '',
          openNext: () => { if (nextEv) { this.setState({ recapOpen:null }); this.openDetail(nextEv.id); } }
        };
      })(),
      ticketsOpen: st.ticketsOpen,
      closeTickets: () => this.setState({ ticketsOpen:false }),
      ticketsEmpty: st.tickets.length === 0,
      ticketList: st.tickets.map(t => {
        const e = EVENTS.find(x => x.id === t.eventId) || {};
        return {
          title: e.title || '', art: e.art || 'linear-gradient(135deg,#B6D9FC,#7A55F6)',
          when: e.ds ? this.fmtWhen(e) + ' · ' + this.fmtTime(e) : '',
          venue: (e.venue || '') + ' · ' + (e.area || ''),
          code: t.id, qrRows: this.qrRows(t.id),
          offNote: st.offline ? L.ticketOffNow : L.ticketOffReady,
          offIcon: st.offline ? 'ph-fill ph-cloud-slash' : 'ph-fill ph-check-circle',
          offFg: st.offline ? '#F0A07F' : '#6CC7B6',
          qtyLine: t.qty + ' × ' + (t.qty > 1 ? L.ticketsWord : L.ticket),
          status: t.checked ? L.ticketUsed : L.ticketValid,
          statusBg: t.checked ? 'rgba(157,167,186,.16)' : 'rgba(38,150,132,.16)',
          statusFg: t.checked ? '#9DA7BA' : '#6CC7B6',
          statusBd: t.checked ? 'rgba(186,215,247,.24)' : '#269684',
          checkLabel: t.checked ? L.ticketUsed : L.checkIn,
          checkOp: t.checked ? '.5' : '1',
          check: async () => {
            if (t.checked) return;
            try {
              await FF.put('/events/' + t.eventId + '/presence');
            } catch (e) { return this.fail(e); }
            this.setState({ tickets: st.tickets.map(x => x.id === t.id ? Object.assign({}, x, { checked:true }) : x), bestieArmed: t.eventId });
            this.say(L.checkedInToast);
            clearTimeout(this._bt);
            this._bt = setTimeout(() => {
              const s = this.state;
              if (s.bestieArmed === t.eventId && !s.liveOpen && !s.recapOpen) this.setState({ bestieSplash: t.eventId, ticketsOpen:false });
            }, 6500);
          },
          liveShow: !!t.checked,
          openLive: () => { clearTimeout(this._bt); this.openLive(t.eventId); },
          openRecap: () => { clearTimeout(this._bt); this.openRecap(t.eventId); },
          bestieShow: !!t.checked,
          bestieAt: L.bArmed.replace('{t}', this.tMinus(e.startTime, -60)),
          lightNow: () => this.setState({ bestieSplash: t.eventId, ticketsOpen:false })
        };
      }),

      checkoutOpen: !!st.checkout,
      closeCheckout: () => this.setState({ checkout:null, qty:1 }),
      coTitle: coEv ? coEv.title : '', coArt: coEv ? coEv.art : 'linear-gradient(135deg,#B6D9FC,#7A55F6)',
      coWhen: coEv ? this.fmtWhen(coEv) + ' · ' + this.fmtTime(coEv) : '',
      coVenue: coEv ? coEv.venue : '',
      coQty: String(st.qty),
      coUnit: st.quote ? this.money(st.quote.unitPrice) : (coEv ? this.money(coEv.price) : ''),
      coFee: st.quote ? this.money(st.quote.fee) : (coEv ? this.money(Math.round(coEv.price * st.qty * 0.05)) : ''),
      coTotal: st.quote ? this.money(st.quote.total) : (coEv ? this.money(Math.round(coEv.price * st.qty * 1.05)) : ''),
      qtyMinus: () => { const q = Math.max(1, st.qty - 1); this.setState({ qty:q }); this.quoteSoon(q); },
      qtyPlus: () => { const q = Math.min(6, st.qty + 1); this.setState({ qty:q }); this.quoteSoon(q); },
      confirmCheckout: async () => {
        if (!coEv || !st.tierId) return;
        try {
          const out = await FF.post('/orders', { eventId: coEv.id, tierId: st.tierId, qty: st.qty, paymentMethod: 'vietqr' });
          const tickets = await FF.get('/me/tickets');
          this.setState({
            tickets: tickets.items.map(FF.appTicket),
            checkout:null, qty:1, quote:null, ticketsOpen:true, detail:null
          });
          await this.flag('going', coEv.id, true);
          this.say(FF.text(out.message, g) || L.ticketDone);
        } catch (e) { this.fail(e); }
      },
      notifOpen: st.notifOpen,
      openNotif: () => { if (!st.user) return this.openAuth('signup', null, L.nGate); this.setState({ notifOpen:true }); FF.appNotifs(this); },
      closeNotif: () => this.setState({ notifOpen:false }),
      notifList: notifs.map(n => {
        const read = st.notifRead[n.k] || !n.unread;
        return {
          icon: n.icon, color: n.color, title: n.title, body: n.body,
          dot: read ? 'transparent' : '#B6D9FC',
          bg: read ? 'rgba(13,16,28,.5)' : 'rgba(20,24,38,.75)',
          go: () => {
            const r = Object.assign({}, st.notifRead); r[n.k] = true;
            this.setState({ notifRead:r, notifOpen:false });
            FF.fire(FF.post('/me/notifications/' + n.k + '/read'));
            n.act();
          }
        };
      }),
      notifEmpty: notifs.length === 0,
      notifDot: notifs.filter(n => n.unread && !st.notifRead[n.k]).length ? '1' : '0',
      markAllRead: () => {
        const r = {}; notifs.forEach(n => { r[n.k] = true; });
        this.setState({ notifRead:r });
        FF.fire(FF.post('/me/notifications/read-all'));
      },

      countLine: st.q
        ? list.length + (g === 'vi' ? ' kết quả · mọi ngày' : list.length === 1 ? ' result · all dates' : ' results · all dates')
        : list.length + (g === 'vi' ? ' sự kiện khớp bộ lọc' : list.length === 1 ? ' event matches your filters' : ' events match your filters'),
      resetDisplay: st.genre !== 'All' || st.artist || st.q || st.time !== 'weekend' ? 'block' : 'none',
      resetFilters: () => this.refilter({ genre:'All', artist:null, q:'', time:'weekend', range:[null,null], datePanel:false, artistPanel:false }),

      loading: st.loading, skeletons: [{}, {}, {}],
      showFeed: !st.loading && list.length > 0,
      feedEmpty: !st.loading && list.length === 0,
      emptyBody: st.artist
        ? (g === 'vi' ? 'Không có sự kiện nào của ' + st.artist + ' khớp các bộ lọc còn lại.' : 'No ' + st.artist + ' events match your other filters.')
        : (g === 'vi' ? 'Thử nới bộ lọc thời gian hoặc chọn thể loại khác.' : 'Try widening the time filter or picking another genre.'),
      feed: shown.map(e => this.cardView(e, L)),
      feedAdShow: ADS.filter(a => !st.adHidden[a.id]).length > 0,
      feedAd: (() => {
        const a = ADS.filter(x => !st.adHidden[x.id])[0];
        if (!a) return {};
        if (this._adSeen !== a.id) { this._adSeen = a.id; FF.fire(FF.post('/ads/' + a.id + '/impression')); }
        return {
          brand:a.brand, logo:a.logo, art:a.art,
          head: FF.text(a.headline, g), body: FF.text(a.body, g), cta: FF.text(a.cta, g),
          click: () => {
            FF.fire(FF.post('/ads/' + a.id + '/click'));
            if (a.url) window.open(a.url, '_blank', 'noopener');
            this.say((g === 'vi' ? 'Đang mở ' : 'Opening ') + a.brand);
          },
          why: () => this.say(FF.text(a.why, g) || L.adWhyBody),
          hide: () => {
            FF.fire(FF.post('/ads/' + a.id + '/hide'));
            const h = Object.assign({}, st.adHidden); h[a.id] = true;
            this.setState({ adHidden:h });
            this.say(L.adHidden);
          }
        };
      })(),
      liveAdShow: !!(LIVE_AD && !st.adHidden[LIVE_AD.id]),
      liveAd: LIVE_AD ? {
        brand:LIVE_AD.brand, logo:LIVE_AD.logo, art:LIVE_AD.art,
        head: FF.text(LIVE_AD.headline, g), body: FF.text(LIVE_AD.body, g), cta: FF.text(LIVE_AD.cta, g),
        click: () => {
          FF.fire(FF.post('/ads/' + LIVE_AD.id + '/click'));
          if (LIVE_AD.url) window.open(LIVE_AD.url, '_blank', 'noopener');
          this.say((g === 'vi' ? 'Đang mở ' : 'Opening ') + LIVE_AD.brand);
        },
        hide: () => {
          FF.fire(FF.post('/ads/' + LIVE_AD.id + '/hide'));
          const h = Object.assign({}, st.adHidden); h[LIVE_AD.id] = true;
          this.setState({ adHidden:h });
          this.say(L.adHidden);
        }
      } : {},

      loadingMore: st.loadingMore,
      feedEnd: !st.loadingMore && list.length > 0 && st.limit >= list.length,
      onScroll: (e) => {
        const el = e.target;
        if (st.loadingMore || st.limit >= list.length) return;
        if (el.scrollTop + el.clientHeight > el.scrollHeight - 220) {
          this.setState({ loadingMore:true });
          clearTimeout(this._lm);
          this._lm = setTimeout(() => this.setState({ limit: st.limit + 3, loadingMore:false }), 620);
        }
      },

      savedList: savedEvents.map(e => this.cardView(e, L)),
      savedEmpty: savedEvents.length === 0,
      savedSub: savedEvents.length ? savedIds.length + (g === 'vi' ? ' sự kiện đã lưu' : ' saved events') : L.savedSubEmpty,

      interestChips: INTERESTS.map(n => ({
        name:n,
        bg: st.interests[n] ? '#1A1236' : 'rgba(13,16,28,.6)',
        bd: st.interests[n] ? '#7A55F6' : 'rgba(186,215,247,.12)',
        fg: st.interests[n] ? '#D6CFFA' : '#9DA7BA',
        toggle: () => {
          const i = Object.assign({}, st.interests);
          if (i[n]) delete i[n]; else i[n] = true;
          this.setState({ interests:i });
          if (st.user) {
            clearTimeout(this._int);
            this._int = setTimeout(() => FF.fire(FF.patch('/me', { interests: Object.keys(this.state.interests).filter(k => this.state.interests[k]) })), 600);
          }
        }
      })),
      profileRows: [
        { icon:'ph-fill ph-ticket', iconColor:'#B6D9FC', label:L.myTickets, value: String(st.tickets.length), go: () => { this.setState({ ticketsOpen:true }); FF.appTickets(this); } },
        { icon:'ph-bold ph-user-gear', iconColor:'#B6D9FC', label:L.editProfile, value:'', go: () => { if (st.user) this.setState({ edit:true, pErr:'', pName: st.user.name || '', pEmail: st.user.email || '', pZalo: st.user.zalo || '', pCity: st.user.city || '', pPhoto: st.user.photo || '' }); } },
        { icon:'ph-fill ph-fire', iconColor:'#9D84F8', label:L.hyped, value: String(Object.keys(st.hyped).filter(k => st.hyped[k]).length), go: () => this.setState({ hypedPanel:true }) },
        { icon:'ph-bold ph-user-circle-plus', iconColor:'#9D84F8', label:L.following, value: String(Object.keys(st.orgFollow).length), go: () => this.setState({ orgPanel:true }) },
        { icon:'ph-bold ph-bell', iconColor:'#B6D9FC', label:L.notifPrefs, value:'', go: () => this.setState({ notifPrefOpen:true }) },
        { icon:'ph-bold ph-megaphone', iconColor:'#B6D9FC', label:L.listEvent, value:'', go: () => { window.location.assign('/organizer'); } }
      ],

      mapFilterLine: st.genre !== 'All' ? st.genre + ' · ' + timeDefs.find(t => t.k === st.time).label : L.mapAll,
      mapCount: mapList.length + (g === 'vi' ? ' pin' : ' pins'),
      mapPins: mapList.map(e => {
        const fr = connected ? this.fGoing(e.id) : [];
        return {
        faces: fr.slice(0, 2).map(f => ({ initials: initialsOf(f.name), color: f.color })),
        moreShow: fr.length > 2, more: '+' + (fr.length - 2),
        hasFriends: fr.length > 0,
        op: st.friendsOnly && !fr.length ? '.25' : '1',
        x: (12 + ((e.lng - 106.64) / 0.21) * 78) + '%',
        y: (88 - ((e.lat - 10.71) / 0.15) * 62) + '%',
        price: e.price === 0 ? L.free : this.short(e.price),
        z: st.mapSel === e.id ? 6 : 4,
        bg: st.mapSel === e.id ? '#B6D9FC' : 'rgba(5,6,15,.82)',
        bd: st.mapSel === e.id ? '#B6D9FC' : e.badge === 'live' ? '#7A55F6' : '#B6D9FC',
        fg: st.mapSel === e.id ? '#090B16' : '#D8ECF8',
        glow: st.mapSel === e.id ? '0 6px 20px rgba(182,217,252,.5)' : '0 4px 14px rgba(0,0,0,.5)',
        pick: () => this.setState({ mapSel:e.id })
      }; }),
      mapPreviewFriends: mapSel && connected ? this.fGoing(mapSel.id).map(f => this.fView(f)) : [],
      mapPreviewHasFriends: !!(mapSel && connected && this.fGoing(mapSel.id).length),
      mapPreviewFriendsLine: mapSel && connected ? this.fGoing(mapSel.id).length + ' ' + L.friendsGoing : '',
      mapPreview: mapSel ? {
        art: mapSel.art, title: mapSel.title,
        whenLine: this.fmtWhen(mapSel) + ' · ' + this.fmtTime(mapSel),
        whereLine: mapSel.venue + ' · ' + mapSel.distance + ' km',
        priceShort: mapSel.price === 0 ? L.free : this.short(mapSel.price)
      } : null,
      openMapPreview: () => this.openDetail(st.mapSel),
      closeMapPreview: (e) => { e.stopPropagation(); this.setState({ mapSel:null }); },

      detail: detailV,
      closeDetail: () => this.setState({ detail:null, detailData:null }),
      detailLineup: detail ? (detail.lineup || []).map(n => ({ n })) : [],
      detailActions: detail ? [
        { label:L.hype, icon:'ph-fill ph-fire', bg: st.hyped[detail.id] ? '#1A1236' : 'rgba(20,24,38,.6)', bd: st.hyped[detail.id] ? '#7A55F6' : 'rgba(186,215,247,.12)', fg: st.hyped[detail.id] ? '#C4B8F7' : '#9DA7BA',
          go: () => { if (!st.user) return this.openAuth('signup', null, L.gateSave); this.flag('hypes', detail.id, !st.hyped[detail.id]); } },
        { label:L.save, icon:'ph-fill ph-heart', bg: st.saved[detail.id] ? '#111A2B' : 'rgba(20,24,38,.6)', bd: st.saved[detail.id] ? '#B6D9FC' : 'rgba(186,215,247,.12)', fg: st.saved[detail.id] ? '#D8ECF8' : '#9DA7BA',
          go: () => { if (!st.user) return this.openAuth('signup', 'save:' + detail.id, L.gateSave); this.flag('saves', detail.id, !st.saved[detail.id]); } },
        { label:L.calendar, icon:'ph-bold ph-calendar-plus', bg:'rgba(20,24,38,.6)', bd:'rgba(186,215,247,.12)', fg:'#9DA7BA', go: () => this.setState({ sheet:'cal' }) },
        { label:L.share, icon:'ph-bold ph-share-network', bg:'rgba(20,24,38,.6)', bd:'rgba(186,215,247,.12)', fg:'#9DA7BA', go: () => this.setState({ sheet:'share' }) }
      ] : [],
      ctaLabel: !detail ? '' : detail.soldOut ? L.soldOutCta : detail.past ? L.endedCta : detail.price === 0 ? L.freeEntry : L.getTickets + ' · ' + L.from + ' ' + this.money(detail.price),
      ctaClass: !detail || detail.soldOut || detail.past ? '' : 'ff-cta',
      ctaBg: !detail ? '#B6D9FC' : detail.soldOut || detail.past ? '#131725' : '#B6D9FC',
      ctaFg: !detail ? '#090B16' : detail.soldOut || detail.past ? '#8A94A8' : '#090B16',
      ctaShadow: !detail || detail.soldOut || detail.past ? 'none' : '0 14px 34px rgba(182,217,252,.3)',
      ctaOpacity: !detail || !(detail.soldOut || detail.past) ? '1' : '.6',
      getTickets: async () => {
        if (!detail) return;
        if (detail.soldOut) {
          const tier = this.onSaleTier();
          if (tier) FF.fire(FF.put('/events/' + detail.id + '/tiers/' + tier.id + '/watch'));
          return this.say(g === 'vi' ? 'Hết vé — sẽ nhắc bạn khi có vé' : 'Sold out — we will tell you if tickets appear');
        }
        if (detail.past) return this.say(g === 'vi' ? 'Sự kiện đã kết thúc' : 'This event has ended');
        if (detail.price === 0) {
          const v = st.detailData && st.detailData.venue;
          if (v && v.lat) window.open('https://www.google.com/maps/search/?api=1&query=' + v.lat + ',' + v.lng, '_blank', 'noopener');
          return this.say(g === 'vi' ? 'Mở Google Maps…' : 'Opening Google Maps…');
        }
        if (!st.user) return this.openAuth('signup', null, L.gateTickets);
        FF.fire(FF.post('/events/' + detail.id + '/track', { type: 'ticket_click', source: 'feed' }));
        await this.startCheckout(detail.id);
      },

      sheetShare: st.sheet === 'share', sheetCal: st.sheet === 'cal',
      closeSheet: () => this.setState({ sheet:null }),
      shareTargets,
      shareArt: detail ? detail.art : 'linear-gradient(135deg,#B6D9FC,#7A55F6)',
      shareTitleText: detail ? detail.title : '',
      shareMeta: detail ? this.fmtWhen(detail) + ' · ' + detail.area : '',
      calEventLine: detail ? detail.title + ' · ' + this.fmtWhen(detail) : '',
      calTargets: [
        { label:'Google Calendar', icon:'ph-bold ph-google-logo' },
        { label:'Apple Calendar', icon:'ph-bold ph-apple-logo' },
        { label:'Outlook', icon:'ph-bold ph-microsoft-outlook-logo' }
      ].map(c => Object.assign({}, c, { go: () => {
        this.setState({ sheet:null });
        if (!detail) return;
        if (st.user) this.flag('going', detail.id, true);
        FF.download('/events/' + detail.id + '/calendar.ics');
        this.say((g === 'vi' ? 'Đã thêm vào ' : 'Added to ') + c.label + ' · ' + L.youreGoing);
      } })),
      remind24: async () => {
        this.setState({ sheet:null });
        if (!detail) return;
        if (!st.user) return this.openAuth('signup', null, L.gateSave);
        try {
          const out = await FF.post('/events/' + detail.id + '/remind');
          this.say(FF.text(out.message, g) || (g === 'vi' ? 'Sẽ nhắc bạn trước 24 giờ' : 'We\u2019ll remind you 24h before'));
        } catch (e) { this.fail(e); }
      },

      toast: st.toast
    };
  }
}
