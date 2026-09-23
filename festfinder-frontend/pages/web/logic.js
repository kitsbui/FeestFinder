const WEB = FF.data.web || {};
const TODAY = FF.today();
const FAQ_DESIGN = [
  { q:{en:'Which events this weekend are free?',vi:'Cuối tuần này sự kiện nào miễn phí?'},
    a:{en:'Two. HOZO Super Fest runs on the Saigon riverside park from 18 to 20 September, 17:00–23:00, and the Saigon Outcast Night Market in Thảo Điền runs 19–20 September, 16:00–22:00. Both are open to all ages and need no ticket.',
      vi:'Hai sự kiện. HOZO Super Fest tại công viên bờ sông Sài Gòn từ 18 đến 20/9, 17:00–23:00, và Saigon Outcast Night Market ở Thảo Điền ngày 19–20/9, 16:00–22:00. Cả hai mở cho mọi lứa tuổi và không cần vé.'} },
  { q:{en:'How much are Ravolution tickets?',vi:'Vé Ravolution giá bao nhiêu?'},
    a:{en:'From 1.200.000₫ for general admission at SECC in District 7. Doors open at 16:00 and the ticket includes re-entry until 22:00. Tickets are marked low, so the price tier may move before Saturday.',
      vi:'Từ 1.200.000₫ cho vé thường tại SECC, Quận 7. Mở cửa 16:00 và vé bao gồm ra vào lại đến 22:00. Vé đang còn ít nên mức giá có thể thay đổi trước thứ Bảy.'} },
  { q:{en:'Is anything already sold out?',vi:'Có show nào đã hết vé chưa?'},
    a:{en:'Rap Việt Live Stage at Nhà thi đấu Phú Thọ on Sunday 20 September is sold out. Resale is handled by the ticketing partner, not by FeestFinder — we mark a listing sold out within minutes of the organizer updating it.',
      vi:'Rap Việt Live Stage tại Nhà thi đấu Phú Thọ ngày Chủ nhật 20/9 đã hết vé. Việc sang nhượng do đối tác bán vé xử lý, không phải FeestFinder — chúng tôi đánh dấu hết vé trong vài phút sau khi nhà tổ chức cập nhật.'} },
  { q:{en:'How do I get to the riverside park for HOZO?',vi:'Đi tới công viên bờ sông dự HOZO thế nào?'},
    a:{en:'The entrance is on Nguyễn Thiện Thành in Thủ Đức, about 4 km from District 1. Parking near the gates fills before 18:00, so arriving early or by ride-hail is the safer plan on festival nights.',
      vi:'Cổng vào nằm trên đường Nguyễn Thiện Thành, Thủ Đức, cách Quận 1 khoảng 4 km. Bãi xe gần cổng thường đầy trước 18:00, nên đến sớm hoặc đi xe công nghệ sẽ chắc chắn hơn trong các đêm lễ hội.'} }
];

let FAQ = (WEB.faqs && WEB.faqs.length) ? WEB.faqs : FAQ_DESIGN;

const RELATED = [
  { label:{en:'EDM events in Ho Chi Minh City',vi:'Sự kiện EDM ở TP.HCM'}, href:'/vi/ho-chi-minh/edm' },
  { label:{en:'Free events this weekend',vi:'Sự kiện miễn phí cuối tuần này'}, href:'/vi/ho-chi-minh/free/this-weekend' },
  { label:{en:'Live music in District 1',vi:'Nhạc sống ở Quận 1'}, href:'/vi/ho-chi-minh/quan-1/live-music' },
  { label:{en:'Festivals in September 2026',vi:'Lễ hội tháng 9/2026'}, href:'/vi/ho-chi-minh/festival/2026-09' },
  { label:{en:'Indie gigs in Ho Chi Minh City',vi:'Show indie ở TP.HCM'}, href:'/vi/ho-chi-minh/indie' },
  { label:{en:'Night markets in Thảo Điền',vi:'Chợ đêm ở Thảo Điền'}, href:'/vi/ho-chi-minh/thao-dien/night-market' },
  { label:{en:'Hip-hop shows near you',vi:'Show hip-hop quanh bạn'}, href:'/vi/ho-chi-minh/hip-hop' },
  { label:{en:'Events in Thủ Đức',vi:'Sự kiện ở Thủ Đức'}, href:'/vi/ho-chi-minh/thu-duc' }
];

const DEV = [
  { label:'Route', value:'/[locale]/[city]/[genre]/[timeframe] — ISR, revalidate 900s' },
  { label:'Metadata', value:'generateMetadata() per segment; canonical + hreflang vi/en' },
  { label:'Structured data', value:'JSON-LD: ItemList of Event + FAQPage + BreadcrumbList' },
  { label:'Data source', value:"Supabase: events_public view, filtered server-side; no client fetch on first paint" }
];

// Events come from GET /events (see FF.loadWeb at the end of this page).
const RAW = [];

const S = {
  searchPh:{en:'Search events, artists, venues…',vi:'Tìm sự kiện, nghệ sĩ, địa điểm…'},
  listEvent:{en:'List your event',vi:'Đăng sự kiện'},
  kicker:{en:'Ho Chi Minh City · September 2026',vi:'TP. Hồ Chí Minh · Tháng 9/2026'},
  h1a:{en:"What's happening",vi:'Cuối tuần này'}, h1b:{en:'near you?',vi:'có gì chơi?'},
  when:{en:'When',vi:'Thời gian'}, genre:{en:'Genre',vi:'Thể loại'}, price:{en:'Price',vi:'Giá vé'},
  tonight:{en:'Tonight',vi:'Tối nay'}, weekend:{en:'This weekend',vi:'Cuối tuần này'},
  next7:{en:'Next 7 days',vi:'7 ngày tới'}, month:{en:'This month',vi:'Tháng này'},
  free:{en:'Free',vi:'Miễn phí'}, under500:{en:'Under 500K₫',vi:'Dưới 500K₫'}, over500:{en:'500K₫ and up',vi:'Từ 500K₫'},
  reset:{en:'Reset all filters',vi:'Đặt lại toàn bộ bộ lọc'}, sortBy:{en:'Sort',vi:'Sắp xếp'},
  sortDate:{en:'Date',vi:'Ngày'}, sortHype:{en:'Hype',vi:'Hype'}, sortPrice:{en:'Price',vi:'Giá'},
  loadMore:{en:'Load more events',vi:'Tải thêm sự kiện'}, from:{en:'from',vi:'từ'},
  soldOut:{en:'Sold out',vi:'Hết vé'}, ended:{en:'Ended',vi:'Đã kết thúc'}, all:{en:'All',vi:'Tất cả'},
  emptyTitle:{en:'Nothing matches yet',vi:'Chưa có gì phù hợp'},
  emptyBody:{en:'Try a wider date range, or clear the price filter.',vi:'Thử mở rộng khoảng ngày, hoặc bỏ bộ lọc giá.'},
  getTickets:{en:'Get tickets',vi:'Mua vé'}, freeEntry:{en:'Free entry',vi:'Vào cửa miễn phí'},
  mapTitle:{en:'Events near you',vi:'Sự kiện quanh bạn'},
  bcCity:{en:'Ho Chi Minh City',vi:'TP. Hồ Chí Minh'}, bcWeekend:{en:'This weekend',vi:'Cuối tuần này'},
  landingH1:{en:'EDM & festival events in ho chi minh city this weekend',vi:'Sự kiện EDM & lễ hội ở TP.HCM cuối tuần này'},
  updated:{en:'Updated 14 Sep 2026, 09:20',vi:'Cập nhật 14/09/2026, 09:20'},
  verifiedSources:{en:'Organizer-verified listings',vi:'Đã xác minh với nhà tổ chức'},
  landingLede:{en:'Five events are running across Ho Chi Minh City between Friday 18 and Sunday 20 September, from a free three-night festival on the Saigon riverside to an indoor EDM festival at SECC. Below is every confirmed listing with start times, venues, ticket prices and what is already sold out.',
    vi:'Có năm sự kiện diễn ra khắp TP.HCM từ thứ Sáu 18 đến Chủ nhật 20 tháng 9, từ lễ hội ba đêm miễn phí bên bờ sông Sài Gòn đến lễ hội EDM trong nhà tại SECC. Dưới đây là toàn bộ danh sách đã xác nhận kèm giờ bắt đầu, địa điểm, giá vé và những show đã hết vé.'},
  quickAnswer:{en:'The short answer',vi:'Trả lời nhanh'},
  landingListTitle:{en:'Every event, Friday to Sunday',vi:'Toàn bộ sự kiện, thứ Sáu đến Chủ nhật'},
  viewEvent:{en:'View event',vi:'Xem chi tiết'},
  faqTitle:{en:'Frequently asked',vi:'Câu hỏi thường gặp'},
  relatedTitle:{en:'Related searches',vi:'Tìm kiếm liên quan'},
  devTitle:{en:'Handoff notes — this route',vi:'Ghi chú bàn giao — route này'},
  ctaTitle:{en:'Get this list every Thursday',vi:'Nhận danh sách này mỗi Thứ Năm'},
  ctaBody:{en:'One email, the weekend ahead, only the genres and districts you pick. No ticket spam.',
    vi:'Một email, cho cuối tuần sắp tới, chỉ những thể loại và khu vực bạn chọn. Không spam vé.'},
  ctaPrimary:{en:'Open FeestFinder',vi:'Mở FeestFinder'}, ctaSecondary:{en:'Get the weekly email',vi:'Nhận email hàng tuần'},
  events:{en:'events',vi:'sự kiện'}, hypedPeople:{en:'people hyped',vi:'người đang hype'},
  tabExplore:{en:'Explore',vi:'Khám phá'}, tabMap:{en:'Map',vi:'Bản đồ'}, tabLanding:{en:'SEO page',vi:'Trang SEO'},
  tabAbout:{en:'About',vi:'Giới thiệu'},
  statKicker:{en:'Filtered list',vi:'Danh sách đã lọc'},
  statHeadFree:{en:'Free entry, no ticket needed',vi:'Vào cửa miễn phí, không cần vé'},
  statHeadWeekend:{en:'On this weekend',vi:'Diễn ra cuối tuần này'},
  statHeadVenues:{en:'Venues with something on',vi:'Địa điểm đang có sự kiện'},
  statSubFree:{en:'Everything free in your current filters. Open an event for doors, lineup and directions.',vi:'Tất cả sự kiện miễn phí theo bộ lọc hiện tại. Mở một sự kiện để xem giờ mở cửa, đội hình và đường đi.'},
  statSubWeekend:{en:'Friday to Sunday, matching your current filters. Open an event for doors, lineup and directions.',vi:'Từ thứ Sáu đến Chủ nhật, khớp bộ lọc hiện tại. Mở một sự kiện để xem giờ mở cửa, đội hình và đường đi.'},
  statSubVenues:{en:'Grouped by venue. Open one to see it on the map with the route from where you are.',vi:'Nhóm theo địa điểm. Mở một địa điểm để xem trên bản đồ kèm đường đi từ chỗ bạn.'},
  statEmptyNote:{en:'Nothing matches the filters you have set. Widen the date range or clear the price filter.',vi:'Không có gì khớp bộ lọc hiện tại. Mở rộng khoảng ngày hoặc bỏ lọc giá.'},
  statOpenEvent:{en:'Event page',vi:'Trang sự kiện'},
  statOpenMap:{en:'See on map',vi:'Xem trên bản đồ'},
  statHype:{en:'hyped',vi:'đang hype'},
  statEventsOn:{en:'events on',vi:'sự kiện'},
  statCardHint:{en:'Open the full list',vi:'Mở danh sách đầy đủ'},
  abKicker:{en:'About FeestFinder',vi:'Về FeestFinder'},
  abTitle:{en:'One place to see what is on tonight',vi:'Một nơi để biết tối nay có gì'},
  abLede:{en:'FeestFinder lists festivals, live shows and night markets across Ho Chi Minh City. Organisers publish for free, every listing is checked before it goes live, and tickets are sold by the organiser — we add no booking fee.',vi:'FeestFinder tập hợp lễ hội, show nhạc sống và chợ đêm ở TP.HCM. Nhà tổ chức đăng miễn phí, mọi tin đều được kiểm tra trước khi lên sóng, và vé do nhà tổ chức bán — chúng tôi không thu thêm phí đặt vé.'},
  abSocial:{en:'Follow us',vi:'Theo dõi chúng tôi'},
  abNote:{en:'Email is answered within two working days. If something is going wrong at an event tonight, call the hotline instead — it is staffed until 02:00 on festival nights.',vi:'Email được trả lời trong hai ngày làm việc. Nếu đang có vấn đề tại sự kiện tối nay, hãy gọi hotline — trực đến 02:00 trong các đêm lễ hội.'},
  abContactUsers:{en:'For people going out',vi:'Cho người đi chơi'},
  abContactUsersBody:{en:'A missing event, a wrong start time, a listing that looks off — tell us and we correct it, usually the same day.',vi:'Thiếu sự kiện, sai giờ bắt đầu, tin trông không ổn — nhắn cho chúng tôi, thường sửa trong ngày.'},
  abContactOrg:{en:'For organisers',vi:'Cho nhà tổ chức'},
  abContactOrgBody:{en:'Publishing is free. Get verified once and your events keep the badge, with ticket clicks and saves in the organiser console.',vi:'Đăng tin miễn phí. Xác minh một lần là sự kiện của bạn giữ nhãn đã xác minh, kèm số lượt bấm mua vé và lượt lưu trong bảng điều khiển.'},
  abContactBrand:{en:'For brands & press',vi:'Cho thương hiệu & báo chí'},
  abContactBrandBody:{en:'Audience numbers, the rate card and interview requests. Ad placements are labelled and never target a person by name.',vi:'Số liệu khán giả, bảng giá và các yêu cầu phỏng vấn. Quảng cáo luôn được gắn nhãn và không nhắm theo tên người dùng.'},
  abAdvertise:{en:'Advertise',vi:'Đặt quảng cáo'},
  abOffice:{en:'Office',vi:'Văn phòng'},
  abHotline:{en:'Event-night hotline',vi:'Hotline đêm sự kiện'},
  abHours:{en:'Support hours',vi:'Giờ hỗ trợ'},
  statFree:{en:'free events',vi:'sự kiện miễn phí'}, statWeekend:{en:'this weekend',vi:'cuối tuần này'},
  statVenues:{en:'venues nearby',vi:'địa điểm quanh bạn'},
  ansFree:{en:'Free this weekend',vi:'Miễn phí cuối tuần này'},
  ansBiggest:{en:'Biggest event',vi:'Sự kiện lớn nhất'}, ansSoldOut:{en:'Already sold out',vi:'Đã hết vé'},
  logIn:{en:'Log in',vi:'Đăng nhập'}, signUp:{en:'Sign up',vi:'Đăng ký'}, signOut:{en:'Sign out',vi:'Đăng xuất'},
  membersOnly:{en:'Members only',vi:'Dành cho thành viên'},
  savedCount:{en:'Saved events',vi:'Sự kiện đã lưu'},
  savedTitle:{en:'Your saved events',vi:'Sự kiện bạn đã lưu'},
  savedExit:{en:'Back to all events',vi:'Xem tất cả sự kiện'},
  savedNone:{en:'Nothing saved yet — tap the heart on any event.',vi:'Chưa lưu sự kiện nào — bấm trái tim trên thẻ sự kiện.'},
  authGateBody:{en:'Saved events, recommendations picked for your taste and ticket checkout all need an account.',
    vi:'Sự kiện đã lưu, gợi ý theo gu của bạn và mua vé đều cần có tài khoản.'},
  gateSave:{en:'Log in to save events',vi:'Đăng nhập để lưu sự kiện'},
  gateTickets:{en:'Log in to buy tickets',vi:'Đăng nhập để mua vé'},
  gateOrganizer:{en:'Log in to list your event',vi:'Đăng nhập để đăng sự kiện'},
  gateAds:{en:'Log in to book advertising',vi:'Đăng nhập để đặt quảng cáo'},
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
  saveChanges:{en:'Save changes',vi:'Lưu thay đổi'},
  profileSaved:{en:'Profile updated',vi:'Đã cập nhật thông tin'},
  loginIdNote:{en:'You log in with this',vi:'Bạn đăng nhập bằng thông tin này'},
  cancel:{en:'Cancel',vi:'Huỷ'},
  uploadPhoto:{en:'Upload profile picture',vi:'Tải ảnh đại diện'},
  changePhoto:{en:'Change picture',vi:'Đổi ảnh'}, removePhoto:{en:'Remove',vi:'Xoá ảnh'},
  photoHint:{en:'A photo or your brand logo. JPG or PNG, square works best.',vi:'Ảnh cá nhân hoặc logo thương hiệu. JPG hoặc PNG, ảnh vuông đẹp nhất.'},
  socialOr:{en:'or use email / WhatsApp number',vi:'hoặc dùng email / số WhatsApp'},
  socialWith:{en:'Continue with',vi:'Tiếp tục với'},
  socialWhy:{en:'We read your name, picture and friend list to find who else is going. Nothing is posted.',
    vi:'Chúng tôi chỉ đọc tên, ảnh và danh sách bạn bè để tìm ai cũng đi. Không đăng gì lên trang của bạn.'},
  connected:{en:'Connected accounts',vi:'Tài khoản đã liên kết'},
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

  advertise:{en:'Advertise',vi:'Quảng cáo'},
  sponsored:{en:'Sponsored',vi:'Được tài trợ'},
  adWhy:{en:'Why this ad?',vi:'Vì sao thấy quảng cáo này?'},
  adWhyBody:{en:'You are browsing festivals in Ho Chi Minh City this month. Brands can target the city and the genre, never your name or your saved events.',
    vi:'Bạn đang xem lễ hội ở TP.HCM trong tháng này. Thương hiệu chỉ nhắm theo thành phố và thể loại, không theo tên hay sự kiện bạn đã lưu.'},
  adHide:{en:'Hide this ad',vi:'Ẩn quảng cáo này'},
  adHidden:{en:'Hidden. Fewer ads from this brand.',vi:'Đã ẩn. Sẽ ít quảng cáo từ thương hiệu này hơn.'},
  adPartnerTitle:{en:'Advertise on FeestFinder',vi:'Quảng cáo trên FeestFinder'},
  adPartnerSub:{en:'For brands the festival crowd already carries: drinks, clothing, hearing protection, recovery. Tell us who you are and we come back within two working days.',
    vi:'Dành cho thương hiệu mà người đi lễ hội vốn đã dùng: nước uống, quần áo, bảo vệ tai, phục hồi. Cho chúng tôi biết bạn là ai, chúng tôi phản hồi trong hai ngày làm việc.'},
  adBrandLabel:{en:'Brand name',vi:'Tên thương hiệu'},
  adBrandPh:{en:'Zenkai Energy',vi:'Zenkai Energy'},
  adCatLabel:{en:'Category',vi:'Ngành hàng'},
  adCatFB:{en:'Food & drink',vi:'Ăn uống'}, adCatFashion:{en:'Fashion',vi:'Thời trang'}, adCatHealth:{en:'Healthcare',vi:'Sức khoẻ'},
  adEmailLabel:{en:'Work email',vi:'Email công việc'},
  adEmailPh:{en:'you@brand.com',vi:'ban@thuonghieu.com'},
  adBudgetLabel:{en:'Monthly budget',vi:'Ngân sách tháng'},
  adPlaceLabel:{en:'Where you want to appear',vi:'Vị trí bạn muốn xuất hiện'},
  adPlaceFeed:{en:'Feed card',vi:'Thẻ trong feed'},
  adPlaceBanner:{en:'Explore banner',vi:'Banner trang Khám phá'},
  adPlaceLive:{en:'In-event (live mode)',vi:'Trong sự kiện (chế độ trực tiếp)'},
  adMsgLabel:{en:'Anything else',vi:'Thông tin thêm'},
  adMsgPh:{en:'Which festivals, which months, what you are launching.',vi:'Lễ hội nào, tháng nào, bạn đang ra mắt gì.'},
  adSubmit:{en:'Send enquiry',vi:'Gửi yêu cầu'},
  adSubmitted:{en:'Enquiry sent — we reply within two working days',vi:'Đã gửi — chúng tôi phản hồi trong hai ngày làm việc'},
  adErrBrand:{en:'Enter your brand name',vi:'Nhập tên thương hiệu'},
  adErrEmail:{en:'That email doesn\u2019t look right',vi:'Email chưa đúng định dạng'},
  adRates:{en:'Rate card',vi:'Bảng giá'},
  adRate1:{en:'Feed card · 180.000₫ CPM',vi:'Thẻ feed · 180.000₫ CPM'},
  adRate2:{en:'Explore banner · 240.000₫ CPM',vi:'Banner Khám phá · 240.000₫ CPM'},
  adRate3:{en:'In-event · 520.000₫ CPM',vi:'Trong sự kiện · 520.000₫ CPM'},
  adReach:{en:'48,200 people browsed events in Ho Chi Minh City in the last 30 days.',vi:'48.200 người đã xem sự kiện ở TP.HCM trong 30 ngày qua.'},
  back:{en:'Back to events',vi:'Về danh sách sự kiện'},
  aboutTitle:{en:'About this event',vi:'Về sự kiện này'},
  lineupTitle:{en:'Lineup',vi:'Dàn nghệ sĩ'},
  gettingThere:{en:'Getting there',vi:'Đường đến'},
  organisedBy:{en:'Organised by',vi:'Tổ chức bởi'},
  viewOrganiser:{en:'View organiser',vi:'Xem nhà tổ chức'},
  similarTitle:{en:'You might also like',vi:'Có thể bạn cũng thích'},
  factDate:{en:'Date',vi:'Ngày'}, factDoors:{en:'Doors',vi:'Giờ mở cửa'},
  factVenue:{en:'Venue',vi:'Địa điểm'}, factAge:{en:'Age',vi:'Độ tuổi'},
  factPrice:{en:'Entry',vi:'Vào cửa'}, factDist:{en:'Distance',vi:'Khoảng cách'},
  saveEvent:{en:'Save',vi:'Lưu'}, savedEvent:{en:'Saved',vi:'Đã lưu'},
  shareEvent:{en:'Share',vi:'Chia sẻ'}, shareCopied:{en:'Link copied',vi:'Đã copy liên kết'},
  ticketNote:{en:'Tickets are sold by the organiser. FeestFinder does not add a booking fee.',vi:'Vé do nhà tổ chức bán. FeestFinder không thu thêm phí đặt vé.'},
  openInMaps:{en:'Open in Maps',vi:'Mở bản đồ'},
  orgEvents:{en:'events listed',vi:'sự kiện đã đăng'},
  orgFollowers:{en:'followers',vi:'người theo dõi'},
  orgSince:{en:'On FeestFinder since',vi:'Trên FeestFinder từ'},
  orgVerified:{en:'Verified organiser',vi:'Nhà tổ chức đã xác minh'},
  orgUpcoming:{en:'Upcoming',vi:'Sắp diễn ra'}, orgPast:{en:'Past events',vi:'Đã diễn ra'},
  orgNoUpcoming:{en:'Nothing on sale right now. Follow to hear first.',vi:'Hiện chưa có sự kiện nào. Theo dõi để nhận tin sớm nhất.'},
  followedToast:{en:'Following {n}',vi:'Đang theo dõi {n}'},
  followArtistHint:{en:'Tap an artist to follow them',vi:'Bấm vào nghệ sĩ để theo dõi'},
  followingArtists:{en:'Following {n} of this lineup. We will tell you when any of them announce a show in Ho Chi Minh City.',vi:'Đang theo dõi {n} nghệ sĩ trong đội hình này. Khi họ có show ở TP.HCM, chúng tôi sẽ nhắn bạn.'},
  followOrgCta:{en:'Follow this organiser',vi:'Theo dõi nhà tổ chức'},
  followOrgDone:{en:'Following this organiser',vi:'Đang theo dõi nhà tổ chức'},
  followOrgNote:{en:'You hear about their next listing before it reaches the feed.',vi:'Bạn biết tin sự kiện tiếp theo trước khi nó lên feed.'},
  ttTitle:{en:'Set times',vi:'Giờ diễn'},
  ttSub:{en:'Tap the sets you want. Anything that overlaps gets flagged before you commit.',vi:'Bấm chọn những set bạn muốn xem. Trùng giờ sẽ được báo trước.'},
  ttPlan:{en:'{n} in your plan',vi:'{n} set trong lịch của bạn'},
  ttPlanEmpty:{en:'Nothing picked yet',vi:'Chưa chọn set nào'},
  ttClear:{en:'Clear',vi:'Bỏ hêt'},
  ttRemind:{en:'Remind me 15 min before',vi:'Nhắc trước 15 phút'},
  ttRemindDone:{en:'Reminders set for every set in your plan',vi:'Đã đặt nhắc cho mọi set trong lịch'},
  ttClash:{en:'Two sets you picked overlap',vi:'Hai set bạn chọn bị trùng giờ'},
  ttClashLine:{en:'{a} and {b} overlap by {m} minutes',vi:'{a} và {b} trùng nhau {m} phút'},
  tiersTitle:{en:'Tickets',vi:'Các loại vé'},
  tiersRefund:{en:'Refunds up to 7 days before the event, minus the payment fee. After that the organiser decides case by case.',vi:'Hoàn tiền tới trước sự kiện 7 ngày, trừ phí thanh toán. Sau thời điểm đó nhà tổ chức xét từng trường hợp.'},
  tierOnSale:{en:'On sale',vi:'Đang bán'}, tierLast:{en:'Last tier',vi:'Hạng cuối'},
  tierSoldOut:{en:'Sold out',vi:'Hết vé'}, tierSoon:{en:'Not yet open',vi:'Chưa mở bán'},
  tierLeft:{en:'{n} left',vi:'Còn {n}'},
  tierBuy:{en:'Buy',vi:'Mua'}, tierNotify:{en:'Notify me',vi:'Nhắc tôi'},
  tierEarly:{en:'Early bird',vi:'Vé sớm'}, tierGA:{en:'General admission',vi:'Vé thường'},
  tierVIP:{en:'VIP',vi:'VIP'}, tierTable:{en:'Table for four',vi:'Bàn 4 người'},
  tierEarlyNote:{en:'First 500 tickets, gone in 40 hours',vi:'500 vé đầu tiên, hết sau 40 giờ'},
  tierGANote:{en:'Standing, re-entry until 22:00',vi:'Vé đứng, ra vào lại tới 22:00'},
  tierVIPNote:{en:'Raised deck, separate bar and entrance',vi:'Khu cao, quầy bar và cổng riêng'},
  tierTableNote:{en:'Opens when VIP sells out',vi:'Mở bán khi VIP hết vé'},
  tierSoldToast:{en:'That tier is gone. We will tell you if returns come back.',vi:'Hạng này đã hết. Có vé trả lại chúng tôi sẽ nhắn bạn.'},
  tierNotifyToast:{en:'We will message you the moment it opens',vi:'Vừa mở bán là chúng tôi nhắn bạn ngay'},
  reportCta:{en:'Report this listing',vi:'Báo cáo tin này'},
  reportTitle:{en:'Report this listing',vi:'Báo cáo tin này'},
  reportSub:{en:'A moderator reads every report. Listings with two or more reports are pulled from the feed while we check.',vi:'Mọi báo cáo đều được kiểm duyệt viên đọc. Tin có từ hai báo cáo sẽ được tạm ẩn trong lúc kiểm tra.'},
  reportWhat:{en:'What is wrong?',vi:'Vấn đề là gì?'},
  reportMore:{en:'Anything else we should know',vi:'Điều gì khác chúng tôi nên biết'},
  reportMorePh:{en:'Optional — one or two lines is plenty',vi:'Không bắt buộc — một hai dòng là đủ'},
  reportSend:{en:'Send report',vi:'Gửi báo cáo'},
  reportSent:{en:'Report sent. We usually come back within a day.',vi:'Đã gửi báo cáo. Chúng tôi thường phản hồi trong một ngày.'},
  notifPrefs:{en:'Notifications',vi:'Thông báo'},
  notifTitle:{en:'What we message you about',vi:'Chúng tôi nhắn bạn về việc gì'},
  notifSub:{en:'One row per kind of update, one column per channel. Everything off means we never contact you.',vi:'Mỗi dòng là một loại thông tin, mỗi cột là một kênh. Tắt hết nghĩa là chúng tôi không liên hệ bạn.'},
  notifQuiet:{en:'Nothing between 23:00 and 08:00 except changes to an event starting today.',vi:'Không nhắn từ 23:00 đến 08:00, trừ thay đổi của sự kiện diễn ra trong ngày.'},
  notifSaved:{en:'Notification settings saved',vi:'Đã lưu cài đặt thông báo'},
  notifOnLine:{en:'{n} on',vi:'{n} bật'},
  mapSearchArea:{en:'Search this area',vi:'Tìm trong khu này'},
  mapClearArea:{en:'Whole city',vi:'Toàn thành phố'},
  mapZoomIn:{en:'Zoom in',vi:'Phóng to'}, mapZoomOut:{en:'Zoom out',vi:'Thu nhỏ'},
  mapRecenter:{en:'Back to me',vi:'Về vị trí của tôi'},
  mapFree:{en:'Free only',vi:'Chỉ miễn phí'},
  done:{en:'Done',vi:'Xong'},
  unfollowedToast:{en:'Unfollowed {n}',vi:'Đã bỏ theo dõi {n}'},
  friendsTitle:{en:'Friends',vi:'Bạn bè'}, friendsGoing:{en:'going',vi:'sẽ đi'},
  friendsGoingTitle:{en:'Friends going',vi:'Bạn bè sẽ đi'},
  friendsFilter:{en:'Friends going',vi:'Có bạn đi'},
  becauseFriends:{en:'Because your friends are going',vi:'Vì bạn bè của bạn sẽ đi'},
  alsoInterested:{en:'is also interested',vi:'cũng đang quan tâm'},
  andOthers:{en:'and {n} others',vi:'và {n} người khác'},
  friendsSaved:{en:'{n} friends saved events since yesterday',vi:'{n} người bạn đã lưu sự kiện từ hôm qua'},
  imGoing:{en:'I\u2019m going',vi:'Tôi sẽ đi'}, youreGoing:{en:'You\u2019re going',vi:'Bạn sẽ đi'},
  goingPrivacy:{en:'Marking yourself going shows you to friends on the map.',vi:'Đánh dấu sẽ đi sẽ hiện bạn cho bạn bè trên bản đồ.'},
  chat:{en:'Chat',vi:'Nhắn tin'}, follow:{en:'Follow',vi:'Theo dõi'}, followingLabel:{en:'Following',vi:'Đang theo dõi'},
  inviteFriends:{en:'Invite friends',vi:'Mời bạn bè'},
  inviteTitle:{en:'Invite friends',vi:'Mời bạn bè'},
  inviteSub:{en:'They get the event card in chat with your name on it.',vi:'Họ sẽ nhận thẻ sự kiện trong tin nhắn kèm tên bạn.'},
  inviteSend:{en:'Send invites',vi:'Gửi lời mời'},
  inviteSent:{en:'Invites sent to {n} friends',vi:'Đã mời {n} người bạn'},
  inviteSent1:{en:'Invite sent to {n} friend',vi:'Đã mời {n} người bạn'},
  inviteNone:{en:'Pick at least one friend',vi:'Chọn ít nhất một người'},
  chatPh:{en:'Message…',vi:'Nhập tin nhắn…'},
  chatStart:{en:'Say hi — messages stay between the two of you.',vi:'Chào một câu — tin nhắn chỉ hai người thấy.'},
  mutual:{en:'events in common',vi:'sự kiện chung'},
  noFriendsBody:{en:'Connect Facebook, Instagram or Zalo and we\u2019ll show which of your friends are going.',
    vi:'Liên kết Facebook, Instagram hoặc Zalo để xem bạn bè nào đang đi.'}
};

const DOW = { en:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], vi:['CN','T2','T3','T4','T5','T6','T7'] };
const MON = { en:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  vi:['Th1','Th2','Th3','Th4','Th5','Th6','Th7','Th8','Th9','Th10','Th11','Th12'] };
const GENRES = ['All','EDM','Festival','Indie','Hip-Hop','Pop','Jazz','Food','Culture'];

// Set times and ticket tiers, filled per event from GET /events/:id.
const TT = {};
const TIER_SETS = {};
const REPORT_CODES = [
  { k:'wrong', icon:'ph-fill ph-info', en:'Details are wrong', vi:'Thông tin sai' },
  { k:'cancelled', icon:'ph-fill ph-calendar-x', en:'Event was cancelled', vi:'Sự kiện đã huỷ' },
  { k:'scam', icon:'ph-fill ph-warning-octagon', en:'Looks like a scam', vi:'Có dấu hiệu lừa đảo' },
  { k:'duplicate', icon:'ph-fill ph-copy', en:'Posted twice', vi:'Đăng trùng hai lần' },
  { k:'offensive', icon:'ph-fill ph-prohibit', en:'Offensive content', vi:'Nội dung không phù hợp' },
  { k:'price', icon:'ph-fill ph-tag', en:'Price is not what was listed', vi:'Giá khác với tin đăng' }
];
const NOTIF_ROWS = [
  { k:'saved', icon:'ph-fill ph-heart', en:'Reminders for events you saved', vi:'Nhắc về sự kiện bạn đã lưu' },
  { k:'tickets', icon:'ph-fill ph-ticket', en:'Last tier and price changes', vi:'Hạng vé cuối và thay đổi giá' },
  { k:'artists', icon:'ph-fill ph-microphone-stage', en:'Artists and organisers you follow', vi:'Nghệ sĩ và nhà tổ chức bạn theo dõi' },
  { k:'friends', icon:'ph-fill ph-users-three', en:'What friends are going to', vi:'Bạn bè sẽ đi đâu' },
  { k:'weekly', icon:'ph-fill ph-newspaper', en:'Weekly picks for your city', vi:'Gợi ý hàng tuần cho thành phố của bạn' }
];

const SRC = {
  wa: { label:'WhatsApp', icon:'ph-fill ph-whatsapp-logo', color:'#25D366' },
  fb: { label:'Facebook', icon:'ph-fill ph-facebook-logo', color:'#6FB0F0' },
  ig: { label:'Instagram', icon:'ph-fill ph-instagram-logo', color:'#E88AA8' },
  zalo: { label:'Zalo', icon:'ph-fill ph-chat-circle-dots', color:'#B6D9FC' }
};
// Live containers, refilled in place by applyWeb() after sign-in and sign-out.
const FRIENDS = [];
const ORGS = {};
const ORG_OF = {};
const ORG_PAST = {};
const ABOUT = {};
const ADS = [];
function initialsOf(n) { return n.trim().split(/\s+/).slice(0, 2).map(w => w.charAt(0).toUpperCase()).join(''); }

function pd(s) { const p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
function hav(a, b, c, e) {
  const R = 6371, r = Math.PI / 180, x = (c - a) * r, y = (e - b) * r;
  const h = Math.sin(x / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(y / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
const USER = { lat:10.7769, lng:106.7009 };
const WK_START = (() => { const d = new Date(TODAY); const wd = d.getDay(); d.setDate(d.getDate() + (wd === 0 ? -2 : wd === 6 ? -1 : 5 - wd)); return d; })();
const WK_END = (() => { const d = new Date(WK_START); d.setDate(d.getDate() + 2); return d; })();

function toEvent(e) {
  const ds = pd(e.ds), de = e.de ? pd(e.de) : ds;
  const in7 = new Date(TODAY); in7.setDate(TODAY.getDate() + 7);
  const eom = new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0), tags = [];
  if (ds <= TODAY && de >= TODAY) tags.push('tonight');
  if (ds <= WK_END && de >= WK_START) tags.push('weekend');
  if (ds <= in7 && de >= TODAY) tags.push('7days');
  if (ds <= eom && de >= TODAY) tags.push('month');
  return Object.assign({}, e, { dsD:ds, deD:de, tags, past: !!e.past,
    dist: e.dist != null ? e.dist : Math.round(hav(USER.lat, USER.lng, e.lat, e.lng) * 10) / 10 });
}

const EVENTS = [];
function applyWeb(d) {
  EVENTS.splice(0, EVENTS.length, ...(d.events || []).map(toEvent));
  FRIENDS.splice(0, FRIENDS.length, ...(d.friends || []));
  ADS.splice(0, ADS.length, ...(d.ads || []));
  Object.assign(ORGS, d.orgs || {});
  Object.assign(ORG_OF, d.orgOf || {});
}
applyWeb(WEB);

/** GET /events/:id timetable → the prototype's { win, days: [{ en, vi, stages: [{ en, vi, s: [[artist, a, b, setId]] }] }] }. */
function ttFromApi(t) {
  const w = t.days[0].window;
  return { win: [w.startMin, w.endMin], days: t.days.map(d => ({ en: d.label.en, vi: d.label.vi,
    stages: d.stages.map(s => ({ en: s.name.en, vi: s.name.vi, s: s.sets.map(x => [x.artist, x.startMin, x.endMin, x.id]) })) })) };
}

/* ---- routes ------------------------------------------------------------------
 * /                 explore            /e/<slug>        an event
 * /map              map                /o/<slug>        an organiser
 * /about            about FeestFinder   /saved           saved events
 * /advertise        advertise with us  /stats/<key>     one explore stat
 * /vi/ho-chi-minh/this-weekend, /en/…   the city landing page (/city/… still opens it)
 */
const LANDING = ['ho-chi-minh', 'this-weekend'];
const eventBy = (key) => EVENTS.filter(e => e.slug === key || e.id === key)[0] || null;
const orgBy = (key) => { for (const id in ORGS) if (ORGS[id].slug === key || id === key) return ORGS[id]; return null; };
const slugOf = (id) => { const e = EVENTS.filter(x => x.id === id)[0]; return e ? (e.slug || e.id) : id; };

/** The screen a URL asks for, as a state patch. */
function routeState(r) {
  const clear = { screen:'explore', detailId:null, orgId:null, statView:null, savedView:false, adsOpen:false, notifOpen:false, edit:false };
  if (!r) return clear;
  const name = r.name, param = r.param;
  if (name === 'map') return Object.assign(clear, { screen:'map' });
  if (name === 'about') return Object.assign(clear, { screen:'about' });
  if (name === 'city') return Object.assign(clear, { screen:'landing' });
  if ((name === 'vi' || name === 'en') && r.parts.slice(1).join('/') === LANDING.join('/')) return Object.assign(clear, { screen:'landing', lang:name });
  if (name === 'saved') return Object.assign(clear, { savedView:true });
  if (name === 'advertise') return Object.assign(clear, { adsOpen:true });
  if (name === 'stats' && param) return Object.assign(clear, { screen:'stat', statView:param });
  if (name === 'e' && param) { const e = eventBy(param); if (e) return Object.assign(clear, { screen:'detail', detailId:e.id }); }
  if (name === 'o' && param) { const o = orgBy(param); if (o) return Object.assign(clear, { screen:'org', orgId:o.id }); }
  return clear;
}

/** The URL for what is on screen. */
function routePath(st) {
  if (st.screen === 'detail' && st.detailId) return FF.href('e', slugOf(st.detailId));
  if (st.screen === 'org' && st.orgId) return FF.href('o', (ORGS[st.orgId] || {}).slug || st.orgId);
  if (st.screen === 'stat' && st.statView) return FF.href('stats', st.statView);
  if (st.screen === 'map') return FF.href('map');
  if (st.screen === 'about') return FF.href('about');
  if (st.screen === 'landing') return FF.href(st.lang === 'en' ? 'en' : 'vi', ...LANDING);
  if (st.adsOpen) return FF.href('advertise');
  if (st.savedView) return FF.href('saved');
  return FF.href('');
}

class Component extends DCLogic {
  state = {
    lang: this.props.language === 'Tiếng Việt' ? 'vi' : 'en',
    screen: 'explore',
    time:'weekend', genre:'All', prices:{}, sort:'date', q:'', limit:6,
    saved: WEB.saved || {}, mapSel: WEB.mapSel || null, faqOpen:{ 0:true }, loading:true, toast:null,
    user: WEB.user || null, details:{}, pPhotoFile:null,
    edit:false, pName:'', pEmail:'', pZalo:'', pCity:'', pPhoto:'', pErr:'',
    going: WEB.going || {}, friendsOnly:false, friendSheet:null, chatWith:null, chats:{}, chatDraft:'',
    invite:null, inviteSel:{}, following: WEB.following || {}, tipHidden:false,
    plan:{}, ttDay:0,
    mapCx:50, mapCy:50, mapZoom:1, mapLock:null, mapMoved:false, mapGenre:'All', mapFree:false,
    reportFor:null, reportCode:'wrong', reportNote:'',
    notifOpen:false,
    notifM: WEB.notifM || { saved:{ push:true, zalo:true, email:false }, tickets:{ push:true, zalo:false, email:false },
      artists:{ push:true, zalo:false, email:true }, friends:{ push:false, zalo:true, email:false },
      weekly:{ push:false, zalo:false, email:true } },
    detailId:null, orgId:null, statView:null,
    adsOpen:false, adBrand:'', adCat:'F&B', adEmail:'', adBudget:'50–150tr₫',
    adPlaces:{ feed:true, banner:true }, adMsg:'', adErr:'',
    adHidden:{},
    acct:false, savedView:false, auth:null, authMode:'signup', authMethod:'email', authId:'', authOtp:'',
    authPass:'', authPass2:'', authErr:'', authNote:'', authNext:null, authShowPass:false
  };

  componentDidMount() {
    this._t = setTimeout(() => this.setState({ loading:false }), 800);
    if (FF.data.oauthJustConnected) this.say(this.L().connectedToast + ' · ' + SRC[FF.data.oauthJustConnected].label);
    ADS.slice(0, 1).forEach(a => FF.fire(FF.post('/ads/' + a.id + '/impression')));
    const r = FF.route;
    this.setState(routeState(r));
    this.openRoute(r);
    FF.onRoute = (x) => { this.setState(routeState(x)); this.openRoute(x); };
    FF.prefetch(() => FF.webLanding(this));
  }

  /** The answers under the landing page, once they arrive. */
  applyFaqs(rows) { FAQ = rows; this.forceUpdate(); }
  componentWillUnmount() { clearTimeout(this._t); clearTimeout(this._tt); }

  componentDidUpdate(prev) {
    FF.navigate(routePath(this.state));
    if (prev.language !== this.props.language) {
      this.setState({ lang: this.props.language === 'Tiếng Việt' ? 'vi' : 'en' });
    }
  }

  validId(v, method) {
    const s = (v || '').trim();
    if (method === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
    return /^(0|\+84)\d{8,10}$/.test(s.replace(/[\s.-]/g, ''));
  }
  openAuth(mode, next, note) {
    this.setState({
      auth: mode === 'login' ? 'loginId' : 'method', authMode: mode, authMethod:'email',
      authId:'', authOtp:'', authPass:'', authPass2:'', authErr:'', authShowPass:false,
      authNote: note || '', authNext: next || null, acct:false
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
  authFail(e) { this.setState({ authErr: FF.errorText(e, this.state.lang), authBusy:false }); }
  sentLine(method, id, devCode) {
    const L = this.L();
    const base = (method === 'email' ? L.otpSentEmail : method === 'wa' ? L.otpSentWa : L.otpSentZalo) + ' ' + id;
    return devCode ? base + ' · dev code ' + devCode : base;
  }
  authStep() {
    const st = this.state, L = this.L(), step = st.auth;
    if (st.authBusy) return;
    if (step === 'id') {
      if (!this.validId(st.authId, st.authMethod)) return this.setState({ authErr: st.authMethod === 'email' ? L.errEmail : st.authMethod === 'wa' ? L.errWa : L.errZalo });
      this.setState({ authBusy:true });
      return FF.post('/auth/otp/start', { channel: st.authMethod, identifier: st.authId.trim() }).then(out => {
        this.setState({ auth:'otp', authErr:'', authOtp:'', authChallenge: out.challengeId, authBusy:false });
        this.say(this.sentLine(st.authMethod, st.authId.trim(), out.devCode));
      }, e => this.authFail(e));
    }
    if (step === 'otp') {
      if (!/^\d{6}$/.test(st.authOtp)) return this.setState({ authErr: L.errOtp });
      this.setState({ authBusy:true });
      return FF.post('/auth/otp/verify', { challengeId: st.authChallenge, code: st.authOtp }).then(out => {
        if (out.next === 'set_password') return this.setState({ auth:'pass', authErr:'', authSignupToken: out.signupToken, authBusy:false });
        return this.finishAuth();
      }, e => this.authFail(e));
    }
    if (step === 'pass') {
      if (st.authPass.length < 8) return this.setState({ authErr: L.errPass });
      if (st.authPass !== st.authPass2) return this.setState({ authErr: L.errPass2 });
      this.setState({ authBusy:true });
      return FF.post('/auth/password', { token: st.authSignupToken, password: st.authPass, passwordConfirm: st.authPass2 })
        .then(() => this.finishAuth(), e => this.authFail(e));
    }
    if (step === 'loginId') {
      const m = st.authId.includes('@') ? 'email' : 'zalo';
      if (!this.validId(st.authId, m)) return this.setState({ authErr: L.errId });
      return this.setState({ auth:'loginPass', authMethod:m, authErr:'', authPass:'' });
    }
    if (step === 'loginPass') {
      if (!st.authPass.length) return this.setState({ authErr: L.errLoginPass });
      this.setState({ authBusy:true });
      return FF.post('/auth/login', { identifier: st.authId.trim(), password: st.authPass })
        .then(() => this.finishAuth(), e => this.authFail(e));
    }
  }
  /** Reload everything that depends on who is signed in. */
  async reloadWeb() {
    await FF.refreshSession();
    const d = await FF.loadWeb();
    applyWeb(d);
    return { user: d.user, saved: d.saved, going: d.going, following: d.following, notifM: d.notifM || this.state.notifM };
  }
  async finishAuth() {
    const st = this.state, L = this.L(), next = st.authNext;
    const patch = Object.assign(await this.reloadWeb(), {
      auth:null, authErr:'', authOtp:'', authPass:'', authPass2:'', authNote:'', authNext:null, authBusy:false
    });
    if (next && next.indexOf('save:') === 0) {
      const id = next.slice(5);
      FF.fire(FF.put('/me/saves/' + id));
      patch.saved = Object.assign({}, patch.saved, { [id]: true });
    }
    if (next === 'ads') patch.adsOpen = true;
    if (next === 'organizer') setTimeout(() => { window.location.href = '/organizer'; }, 500);
    this.setState(patch);
    this.say(st.authMode === 'login' ? L.loggedInToast : L.welcomeToast);
  }

  readPhoto(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    this.setState({ pPhoto: URL.createObjectURL(f), pPhotoFile: f });
  }

  socialLogin(src) {
    FF.fire(FF.oauthStart(src), (e) => this.setState({ authErr: FF.errorText(e, this.state.lang) }));
  }
  startConnect(src) {
    if (src === 'fb' || src === 'ig') return FF.fire(FF.oauthStart(src), (e) => this.say(FF.errorText(e, this.state.lang)));
    this.setState({ cx: { src, step:'phone', id:'', otp:'', err:'' } });
  }
  cxSet(patch) { this.setState({ cx: Object.assign({}, this.state.cx, patch) }); }
  cxStep() {
    const L = this.L(), c = this.state.cx;
    if (!c) return;
    if (c.step === 'phone') {
      if (!this.validId(c.id, 'phone')) return this.cxSet({ err: c.src === 'wa' ? L.errWa : L.errZalo });
      return FF.post('/me/connections/' + c.src + '/start', { phone: c.id.trim() }).then(out => {
        this.cxSet({ step:'otp', err:'', otp:'', challengeId: out.challengeId });
        this.say(this.sentLine(c.src, c.id.trim(), out.devCode));
      }, e => this.cxSet({ err: FF.errorText(e, this.state.lang) }));
    }
    if (c.step === 'otp') {
      if (!/^\d{6}$/.test(c.otp)) return this.cxSet({ err: L.errOtp });
      return FF.post('/me/connections/' + c.src + '/verify', { challengeId: c.challengeId, code: c.otp })
        .then(() => this.finishConnect(), e => this.cxSet({ err: FF.errorText(e, this.state.lang) }));
    }
    return this.startConnect(c.src);
  }
  async finishConnect() {
    const L = this.L(), c = this.state.cx;
    const patch = await this.reloadWeb();
    this.setState(Object.assign(patch, { cx:null }));
    this.say(L.connectedToast + ' · ' + SRC[c.src].label);
  }
  connectSocial(src) {
    const L = this.L(), cur = this.state.user || {};
    const list = (cur.socials || (cur.social ? [cur.social] : [])).slice();
    if (list.indexOf(src) < 0) return this.startConnect(src);
    FF.del('/me/connections/' + src).then(async () => {
      const patch = await this.reloadWeb();
      this.setState(Object.assign(patch, { acct:false }));
      this.say(L.disconnectedToast + ' · ' + SRC[src].label);
    }, e => this.say(FF.errorText(e, this.state.lang)));
  }

  /** Flip a saved / going flag at once and persist it; roll back if the API refuses. */
  toggleFlag(key, path, id) {
    const on = !this.state[key][id];
    const next = Object.assign({}, this.state[key]); next[id] = on;
    this.setState({ [key]: next });
    FF.fire(on ? FF.put(path + id) : FF.del(path + id), (e) => {
      const back = Object.assign({}, this.state[key]); back[id] = !on;
      this.setState({ [key]: back });
      this.say(FF.errorText(e, this.state.lang));
    });
    return on;
  }
  toggleFollow(kind, id) {
    const k = kind + ':' + id, on = !this.state.following[k];
    const fo = Object.assign({}, this.state.following); fo[k] = on;
    this.setState({ following: fo });
    const path = kind === 'org' ? '/me/follows/organizers/' + id : '/me/follows/artists/' + encodeURIComponent(id);
    FF.fire(on ? FF.put(path) : FF.del(path), (e) => this.say(FF.errorText(e, this.state.lang)));
    if (kind === 'org' && ORGS[id]) ORGS[id].followers = Math.max(0, (ORGS[id].followers || 0) + (on ? 1 : -1));
    return on;
  }
  loadDetail(id) {
    FF.fire(FF.post('/events/' + id + '/track', { type:'view', source:'feed' }));
    FF.get('/events/' + id).then(d => {
      ABOUT[id] = d.description;
      if (d.organizer) {
        ORG_OF[id] = d.organizer.id;
        ORGS[d.organizer.id] = Object.assign({ bio:{ en:'', vi:'' } }, ORGS[d.organizer.id], {
          id: d.organizer.id, slug: d.organizer.slug, name: d.organizer.name, initials: d.organizer.initials,
          art: d.organizer.art || d.art, verified: d.organizer.verified, followers: d.organizer.followersCount, since: String(d.organizer.sinceYear) });
      }
      if (d.timetable) TT[id] = ttFromApi(d.timetable);
      if (d.tickets) TIER_SETS[id] = d.tickets;
      const st = this.state, patch = { details: Object.assign({}, st.details, { [id]: d }) };
      if (d.me) {
        const plan = Object.assign({}, st.plan);
        d.me.plan.setIds.forEach(s => { plan[s] = true; });
        const fo = Object.assign({}, st.following);
        if (d.organizer) fo['org:' + d.organizer.id] = d.me.followingOrganizer;
        d.me.followingArtists.forEach(a => { fo['art:' + a] = true; });
        Object.assign(patch, { plan, following: fo });
      }
      this.setState(patch);
    }, e => console.warn('[ff] detail', e));
  }
  loadOrg(id) {
    const o = ORGS[id];
    if (!o || !o.slug) return;
    FF.get('/organizers/' + o.slug).then(prof => {
      Object.assign(o, { bio: prof.bio, verified: prof.verified, followers: prof.stats.followers, since: String(prof.stats.since) });
      prof.upcoming.concat(prof.past).forEach(c => { ORG_OF[c.id] = id; if (!EVENTS.some(x => x.id === c.id)) EVENTS.push(toEvent(FF.webEvent(c))); });
      const fo = Object.assign({}, this.state.following);
      if (prof.me) fo['org:' + id] = prof.me.following;
      this.setState({ following: fo });
    }, e => console.warn('[ff] organiser', e));
  }
  fGoing(id) { return FRIENDS.filter(f => f.going.indexOf(id) >= 0); }
  fInterested(id) { return FRIENDS.filter(f => f.interested.indexOf(id) >= 0); }
  fView(f) {
    return { id:f.id, name:f.name, initials: initialsOf(f.name), color:f.color,
      icon: SRC[f.src].icon, iconColor: SRC[f.src].color, srcLabel: SRC[f.src].label,
      open: () => this.setState({ friendSheet: f.id }) };
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
    return { show:true, faces: src.slice(0, 3).map(f => ({ initials: initialsOf(f.name), color: f.color })), line };
  }

  L() { const g = this.state.lang, o = {}; for (const k in S) o[k] = S[k][g]; return o; }
  say(m) { clearTimeout(this._tt); this.setState({ toast:m }); this._tt = setTimeout(() => this.setState({ toast:null }), 2000); }
  refilter(p) { clearTimeout(this._t); this.setState(Object.assign({ loading:true, limit:6, savedView:false }, p)); this._t = setTimeout(() => this.setState({ loading:false }), 380); }
  short(n) { return n >= 1000000 ? (n / 1000000).toFixed(n % 1000000 ? 1 : 0) + 'tr₫' : Math.round(n / 1000) + 'K₫'; }
  when(e) {
    const g = this.state.lang;
    if (+e.dsD === +e.deD) return DOW[g][e.dsD.getDay()] + ', ' + e.dsD.getDate() + ' ' + MON[g][e.dsD.getMonth()] + ' · ' + e.time;
    return DOW[g][e.dsD.getDay()] + ' ' + e.dsD.getDate() + ' – ' + DOW[g][e.deD.getDay()] + ' ' + e.deD.getDate() + ' ' + MON[g][e.deD.getMonth()] + ' · ' + e.time;
  }
  short0(n) { return n >= 1000 ? (Math.round(n / 100) / 10).toFixed(1).replace('.0', '') + 'K' : String(n); }
  /** Fetch what a route needs the first time it is asked for. */
  async openRoute(r) {
    if (!r) return;
    if (r.name === 'e' && r.param) { const e = eventBy(r.param); if (e) this.loadDetail(e.id); }
    if (r.name === 'o' && r.param) { const o = orgBy(r.param); if (o) this.loadOrg(o.id); }
    if (r.name === 'city' || r.name === 'vi' || r.name === 'en' || r.name === 'about') await FF.webLanding(this);
  }

  openEvent(id) { this.setState({ screen:'detail', detailId:id, ttDay:0 }); this.loadDetail(id); if (typeof window !== 'undefined') window.scrollTo(0, 0); }
  openOrg(id) { this.setState({ screen:'org', orgId:id }); this.loadOrg(id); if (typeof window !== 'undefined') window.scrollTo(0, 0); }
  openStat(k) { this.setState({ screen:'stat', statView:k }); if (typeof window !== 'undefined') window.scrollTo(0, 0); }
  openOnMap(id) { this.setState({ screen:'map', mapSel:id }); if (typeof window !== 'undefined') window.scrollTo(0, 0); }
  goBack() { this.setState({ screen:'explore' }); if (typeof window !== 'undefined') window.scrollTo(0, 0); }
  priceOk(e) {
    const p = this.state.prices, keys = Object.keys(p).filter(k => p[k]);
    if (!keys.length) return true;
    return keys.some(k => k === 'free' ? e.price === 0 : k === 'under' ? e.price > 0 && e.price < 500000 : e.price >= 500000);
  }
  list() {
    const st = this.state, q = st.q.trim().toLowerCase();
    if (st.savedView) return EVENTS.filter(e => st.saved[e.id]).slice().sort((a, b) => a.dsD - b.dsD);
    const l = EVENTS.filter(e => {
      if (q) {
        const hay = (e.title + ' ' + e.venue + ' ' + e.area + ' ' + e.genre + ' ' + e.lineup.join(' ')).toLowerCase();
        if (!hay.includes(q)) return false;
      } else if (!e.tags.includes(st.time)) return false;
      if (st.genre !== 'All' && e.genre !== st.genre) return false;
      return this.priceOk(e);
    });
    l.sort((a, b) => {
      if (!!a.past !== !!b.past) return a.past ? 1 : -1;
      if (st.sort === 'hype') return b.hype - a.hype;
      if (st.sort === 'price') return a.price - b.price;
      return a.dsD - b.dsD;
    });
    return l;
  }
  card(e, L) {
    const st = this.state, un = e.soldOut || e.past;
    return {
      title:e.title, genre:e.genre, art:e.art, artOpacity: un ? '.4' : '1',
      cardBd: e.featured ? 'rgba(102,58,243,.4)' : 'rgba(186,215,247,.12)',
      hasBadge: !!e.badge && !un, badgeLabel: e.badge ? e.badge[st.lang] : '',
      badgeBg: e.featured ? '#7A55F6' : '#B6D9FC',
      unavailable: un, unavailLabel: e.soldOut ? L.soldOut : L.ended,
      unavailBd: e.soldOut ? '#E46D4C' : 'rgba(186,215,247,.24)', unavailFg: e.soldOut ? '#F0A07F' : '#9DA7BA',
      whenLine: this.when(e), whereLine: e.venue + ' · ' + e.dist + ' km',
      priceLine: e.price === 0 ? L.free : L.from + ' ' + this.short(e.price),
      priceColor: e.price === 0 ? '#269684' : '#D8ECF8',
      proofShow: this.proof(e.id).show, proofLine: this.proof(e.id).line, proofFaces: this.proof(e.id).faces,
      hypeShort: e.hype >= 1000 ? (e.hype / 1000).toFixed(1) + 'K' : String(e.hype),
      saveBg: st.saved[e.id] ? '#B6D9FC' : 'rgba(5,6,15,.6)',
      saveBd: st.saved[e.id] ? '#B6D9FC' : 'rgba(216,236,248,.2)',
      saveFg: st.saved[e.id] ? '#090B16' : '#D8ECF8',
      open: () => this.openEvent(e.id),
      save: (ev) => { ev.stopPropagation(); if (!st.user) return this.openAuth('signup', 'save:' + e.id, L.gateSave); this.toggleFlag('saved', '/me/saves/', e.id); }
    };
  }

  mapXY(e) { return { x: 12 + ((e.lng - 106.64) / 0.21) * 76, y: 86 - ((e.lat - 10.71) / 0.15) * 60 }; }
  inFrame(e, v) {
    const p = this.mapXY(e);
    const x = 50 + (p.x - v.mapCx) * v.mapZoom, y = 50 + (p.y - v.mapCy) * v.mapZoom;
    return x > 2 && x < 98 && y > 6 && y < 98;
  }

  renderVals() {
    const st = this.state, L = this.L(), g = st.lang, vi1 = g === 'vi';
    FF.lang = g;
    const full = this.list(), grid = full.slice(0, st.limit);
    const heroEv = full.find(e => e.featured && !e.past && !e.soldOut) || full[0];
    const weekend = EVENTS.filter(e => e.tags.includes('weekend'));
    const mapList = EVENTS.filter(e => !e.past)
      .filter(e => !(st.friendsOnly && st.user && st.user.social) || this.fGoing(e.id).length > 0)
      .filter(e => st.mapGenre === 'All' || e.genre === st.mapGenre)
      .filter(e => !st.mapFree || e.price === 0)
      .filter(e => !st.mapLock || this.inFrame(e, st.mapLock))
      .slice(0, 7);
    const sel = st.mapSel ? EVENTS.find(e => e.id === st.mapSel) : null;
    const venues = {}; EVENTS.forEach(e => { if (!e.past) venues[e.venue] = 1; });
    const statLive = full.filter(e => !e.past);
    const statFree = statLive.filter(e => e.price === 0);
    const statWeekend = statLive.filter(e => e.tags.includes('weekend'));
    const statVenues = {}; statLive.forEach(e => { (statVenues[e.venue] = statVenues[e.venue] || []).push(e); });
    const statVenueKeys = Object.keys(statVenues);
    const statK = st.statView || 'weekend';

    const countFor = (k) => EVENTS.filter(e => e.tags.includes(k) && (st.genre === 'All' || e.genre === st.genre)).length;
    const timeDefs = [
      { k:'tonight', label:L.tonight, icon:'ph-fill ph-fire' },
      { k:'weekend', label:L.weekend, icon:'ph-bold ph-confetti' },
      { k:'7days', label:L.next7, icon:'ph-bold ph-calendar-dots' },
      { k:'month', label:L.month, icon:'ph-bold ph-calendar-blank' }
    ];
    const priceDefs = [{ k:'free', label:L.free }, { k:'under', label:L.under500 }, { k:'over', label:L.over500 }];
    const sortDefs = [{ k:'date', label:L.sortDate }, { k:'hype', label:L.sortHype }, { k:'price', label:L.sortPrice }];
    const tabDefs = [{ k:'explore', label:L.tabExplore }, { k:'map', label:L.tabMap }, { k:'landing', label:L.tabLanding }, { k:'about', label:L.tabAbout }];

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
    const fSel = st.friendSheet ? FRIENDS.find(f => f.id === st.friendSheet) : null;
    const chatF = st.chatWith ? FRIENDS.find(f => f.id === st.chatWith) : null;
    const chatLog = chatF ? (st.chats[chatF.id] || []) : [];
    const inviteN = Object.keys(st.inviteSel).filter(k => st.inviteSel[k]).length;
    const buy = (price) => {
      if (price === 0) return this.say(g === 'vi' ? 'Mở Google Maps…' : 'Opening Google Maps…');
      if (!st.user) return this.openAuth('signup', null, L.gateTickets);
      this.say(g === 'vi' ? 'Chuyển sang đối tác bán vé…' : 'Redirecting to ticketing partner…');
    };

    return {
      L, langLabel: g === 'vi' ? 'VI' : 'EN',

      signedIn: !!st.user, signedOut: !st.user,
      userHandle: st.user ? st.user.handle : '',
      userInitial: st.user ? (st.user.handle.trim().charAt(0) || '?').toUpperCase() : '',
      userVia: st.user ? (st.user.social ? (g === 'vi' ? 'Liên kết với ' : 'Connected with ') + SRC[st.user.social].label : st.user.method === 'email' ? L.viaEmail : st.user.method === 'wa' ? L.viaWa : L.viaZalo) : '',
      savedCount: String(Object.keys(st.saved).filter(k => st.saved[k]).length),
      acctOpen: st.acct, toggleAcct: () => this.setState({ acct: !st.acct }),
      savedView: st.savedView,
      savedLine: Object.keys(st.saved).filter(k => st.saved[k]).length + ' ' + L.events,
      openSaved: () => {
        const n = Object.keys(st.saved).filter(k => st.saved[k]).length;
        if (!n) { this.setState({ acct:false }); this.say(L.savedNone); return; }
        this.setState({ acct:false, screen:'explore', savedView:true, limit:6, loading:false });
      },
      exitSaved: () => this.refilter({}),
      userName: st.user ? (st.user.name || st.user.handle) : '',
      userCity: st.user ? st.user.city : '',
      editOpen: st.edit,
      hasPhoto: !!(st.user && st.user.photo), noPhoto: !(st.user && st.user.photo),
      userPhoto: st.user ? st.user.photo : '',
      photoBg: st.user && st.user.photo ? 'url("' + st.user.photo + '") center/cover no-repeat' : 'rgba(20,24,38,.7)',
      pPhotoBg: st.pPhoto ? 'url("' + st.pPhoto + '") center/cover no-repeat' : 'rgba(20,24,38,.7)',
      pPhoto: st.pPhoto, pHasPhoto: !!st.pPhoto, pNoPhoto: !st.pPhoto,
      onPhoto: (e) => this.readPhoto(e),
      clearPhoto: () => this.setState({ pPhoto:'', pPhotoFile:null }),
      photoCta: st.pPhoto ? L.changePhoto : L.uploadPhoto,
      openEdit: () => this.setState({ edit:true, acct:false, pErr:'',
        pName: st.user.name || '', pEmail: st.user.email || '', pZalo: st.user.zalo || '',
        pCity: st.user.city || '', pPhoto: st.user.photo || '' }),
      closeEdit: () => this.setState({ edit:false, pErr:'' }),
      pName: st.pName, pEmail: st.pEmail, pZalo: st.pZalo, pCity: st.pCity,
      onPName: (e) => this.setState({ pName: e.target.value, pErr:'' }),
      onPEmail: (e) => this.setState({ pEmail: e.target.value, pErr:'' }),
      onPZalo: (e) => this.setState({ pZalo: e.target.value, pErr:'' }),
      onPCity: (e) => this.setState({ pCity: e.target.value, pErr:'' }),
      pErr: st.pErr, pErrShow: !!st.pErr,
      emailIsLogin: st.user ? st.user.method === 'email' : false,
      zaloIsLogin: st.user ? st.user.method === 'zalo' : false,
      saveProfile: async () => {
        const email = st.pEmail.trim(), zalo = st.pZalo.trim();
        if (email && !this.validId(email, 'email')) return this.setState({ pErr: L.errEmail });
        if (zalo && !this.validId(zalo, 'zalo')) return this.setState({ pErr: L.errZalo });
        try {
          let photoUrl = st.pPhoto && !st.pPhotoFile ? st.pPhoto : null;
          if (st.pPhotoFile) {
            const form = new FormData(); form.append('file', st.pPhotoFile);
            photoUrl = (await FF.api('POST', '/uploads?purpose=avatar', form)).url;
          }
          await FF.patch('/me', { name: st.pName.trim(), email, zalo, city: st.pCity.trim(), photoUrl });
          const patch = await this.reloadWeb();
          this.setState(Object.assign(patch, { edit:false, pErr:'', pPhotoFile:null }));
          this.say(L.profileSaved);
        } catch (e) { this.setState({ pErr: FF.errorText(e, g) }); }
      },
      startSignUp: () => this.openAuth('signup', null, ''),
      startLogIn: () => this.openAuth('login', null, ''),
      signOutNow: () => { FF.del('/auth/session').catch(() => {}).then(() => this.reloadWeb()).then(patch => { this.setState(Object.assign(patch, { acct:false })); this.say(L.signedOutToast); }); },

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
      authClose: () => this.setState({ auth:null, authErr:'' }),
      stopProp: (e) => e.stopPropagation(),
      authBackShow: step !== 'method' && step !== 'loginId',
      authBackIcon: step !== 'method' && step !== 'loginId' ? 'ph-bold ph-arrow-left' : 'ph-bold ph-x',
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
      friendsOnly: st.friendsOnly, showFriendsFilter: connected,
      friendsFilterBg: st.friendsOnly ? 'rgba(182,217,252,.14)' : 'transparent',
      friendsFilterBd: st.friendsOnly ? '#B6D9FC' : 'rgba(186,215,247,.12)',
      friendsFilterFg: st.friendsOnly ? '#D8ECF8' : '#9DA7BA',
      toggleFriendsOnly: () => this.setState({ friendsOnly: !st.friendsOnly, mapSel:null }),
      friendRowShow: friendEvents.length > 0,
      friendRow: friendEvents.slice(0, 4).map(e => {
        const fr = this.fGoing(e.id);
        return { title:e.title, art:e.art, whenLine: this.when(e),
          faces: fr.slice(0, 3).map(f => ({ initials: initialsOf(f.name), color: f.color })),
          line: fr.length + ' ' + L.friendsGoing,
          open: () => this.openEvent(e.id) };
      }),
      tipShow: connected && !st.tipHidden && friendEvents.length > 0,
      tipLine: L.friendsSaved.replace('{n}', '3'),
      hideTip: () => this.setState({ tipHidden:true }),

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
      fsChat: () => {
        const id = st.friendSheet;
        this.setState({ chatWith: id, friendSheet:null });
        FF.get('/me/chats/' + id).then(r => {
          const all = Object.assign({}, this.state.chats);
          all[id] = r.items.filter(m => m.kind === 'text').map(m => ({ t: m.body, me: m.fromMe }));
          this.setState({ chats: all });
        }, e => console.warn('[ff] chat', e));
      },
      fsGoingList: fSel ? fSel.going.map(id => { const e = EVENTS.find(x => x.id === id); return { title: e ? e.title : id, when: e ? this.when(e) : '' }; }) : [],

      chatOpen: !!chatF,
      chatName: chatF ? chatF.name : '', chatInitials: chatF ? initialsOf(chatF.name) : '',
      chatColor: chatF ? chatF.color : 'linear-gradient(135deg,#B6D9FC,#7A55F6)',
      chatSrc: chatF ? SRC[chatF.src].label : '',
      chatEmpty: chatLog.length === 0,
      chatMsgs: chatLog.map(m => ({
        text: m.t, align: m.me ? 'flex-end' : 'flex-start',
        bg: m.me ? '#B6D9FC' : 'rgba(20,24,38,.85)', fg: m.me ? '#090B16' : '#D8ECF8',
        radius: m.me ? '16px 16px 4px 16px' : '16px 16px 16px 4px'
      })),
      chatDraft: st.chatDraft,
      onChatDraft: (e) => this.setState({ chatDraft: e.target.value }),
      sendChat: () => {
        const t = st.chatDraft.trim(); if (!t || !chatF) return;
        const all = Object.assign({}, st.chats);
        all[chatF.id] = (all[chatF.id] || []).concat([{ t, me:true }]);
        this.setState({ chats:all, chatDraft:'' });
        FF.fire(FF.post('/me/chats/' + chatF.id, { body: t }), (e) => this.say(FF.errorText(e, g)));
      },
      closeChat: () => this.setState({ chatWith:null, chatDraft:'' }),

      inviteOpen: !!st.invite,
      openInvite: () => { if (!connected) return this.say(L.noFriendsBody); this.setState({ invite: st.mapSel || 'x', inviteSel:{} }); },
      closeInvite: () => this.setState({ invite:null, inviteSel:{} }),
      inviteList: FRIENDS.map(f => ({
        name:f.name, initials: initialsOf(f.name), color:f.color,
        icon: SRC[f.src].icon, iconColor: SRC[f.src].color,
        bd: st.inviteSel[f.id] ? '#B6D9FC' : 'rgba(186,215,247,.12)',
        tickBg: st.inviteSel[f.id] ? '#B6D9FC' : 'transparent',
        tickBd: st.inviteSel[f.id] ? '#B6D9FC' : 'rgba(186,215,247,.24)',
        tick: st.inviteSel[f.id] ? '1' : '0',
        pick: () => { const s = Object.assign({}, st.inviteSel); s[f.id] = !s[f.id]; this.setState({ inviteSel:s }); }
      })),
      inviteCta: inviteN ? L.inviteSend + ' · ' + inviteN : L.inviteSend,
      sendInvites: () => {
        if (!inviteN) return this.say(L.inviteNone);
        const eventId = st.invite, friendIds = Object.keys(st.inviteSel).filter(k => st.inviteSel[k]);
        this.setState({ invite:null, inviteSel:{} });
        const done = () => this.say((inviteN === 1 ? L.inviteSent1 : L.inviteSent).replace('{n}', String(inviteN)));
        if (!EVENTS.some(e => e.id === eventId)) return done();
        FF.post('/events/' + eventId + '/invites', { friendIds }).then(() => {
          const go = Object.assign({}, this.state.going); go[eventId] = true;
          this.setState({ going: go });
          done();
        }, e => this.say(FF.errorText(e, g)));
      },

      cityLabel: g === 'vi' ? 'TP.HCM' : 'Ho Chi Minh City',
      toggleLang: () => this.setState({ lang: g === 'vi' ? 'en' : 'vi' }),
      isExplore: st.screen === 'explore', isMap: st.screen === 'map', isLanding: st.screen === 'landing',
      isDetail: st.screen === 'detail', isOrg: st.screen === 'org',
      isStat: st.screen === 'stat', isAbout: st.screen === 'about',
      /* ---- advertising ---- */
      openAds: () => st.user ? this.setState({ adsOpen:true, adErr:'' }) : this.openAuth('signup', 'ads', L.gateAds),
      goOrganizer: () => st.user ? (window.location.href = '/organizer') : this.openAuth('signup', 'organizer', L.gateOrganizer),
      closeAds: () => this.setState({ adsOpen:false }),
      adsOpen: st.adsOpen,
      adBrand: st.adBrand, setAdBrand: (e) => this.setState({ adBrand: e.target.value }),
      adEmail: st.adEmail, setAdEmail: (e) => this.setState({ adEmail: e.target.value }),
      adMsg: st.adMsg, setAdMsg: (e) => this.setState({ adMsg: e.target.value }),
      adCats: [
        { k:'F&B', label:L.adCatFB, icon:'ph-bold ph-cup-hot' },
        { k:'Fashion', label:L.adCatFashion, icon:'ph-bold ph-t-shirt' },
        { k:'Healthcare', label:L.adCatHealth, icon:'ph-bold ph-heartbeat' }
      ].map(c => {
        const on = st.adCat === c.k;
        return { label:c.label, icon:c.icon,
          bg: on ? 'rgba(182,217,252,.14)' : 'rgba(5,6,15,.6)', bd: on ? '#B6D9FC' : 'rgba(186,215,247,.12)',
          fg: on ? '#D8ECF8' : '#C7D3EA',
          pick: () => this.setState({ adCat:c.k }) };
      }),
      adBudgets: ['Dưới 50tr₫','50–150tr₫','150–400tr₫','400tr₫+'].map(b => {
        const on = st.adBudget === b;
        return { label:b,
          bg: on ? 'rgba(182,217,252,.14)' : 'rgba(5,6,15,.6)', bd: on ? '#B6D9FC' : 'rgba(186,215,247,.12)',
          fg: on ? '#D8ECF8' : '#C7D3EA',
          pick: () => this.setState({ adBudget:b }) };
      }),
      adPlaces: [
        { k:'feed', label:L.adPlaceFeed }, { k:'banner', label:L.adPlaceBanner },
        { k:'live', label:L.adPlaceLive }
      ].map(p => {
        const on = !!st.adPlaces[p.k];
        return { label:p.label,
          icon: on ? 'ph-fill ph-check-square' : 'ph-bold ph-square',
          color: on ? '#B6D9FC' : '#8A94A8',
          fg: on ? '#D8ECF8' : '#C7D3EA',
          toggle: () => { const x = Object.assign({}, st.adPlaces); x[p.k] = !on; this.setState({ adPlaces:x }); } };
      }),
      adRates: [L.adRate1, L.adRate2, L.adRate3].map(r => ({ label:r })),
      adErrShow: !!st.adErr, adErr: st.adErr,
      submitAd: () => {
        if (!st.adBrand.trim()) return this.setState({ adErr:L.adErrBrand });
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(st.adEmail.trim())) return this.setState({ adErr:L.adErrEmail });
        const placements = Object.keys(st.adPlaces).filter(k => st.adPlaces[k]);
        FF.post('/ad-inquiries', { brand: st.adBrand.trim(), category: st.adCat, email: st.adEmail.trim(), budget: st.adBudget, placements: placements.length ? placements : ['feed'], message: st.adMsg })
          .then(() => { this.setState({ adsOpen:false, adBrand:'', adEmail:'', adMsg:'', adErr:'' }); this.say(L.adSubmitted); },
            e => this.setState({ adErr: FF.errorText(e, g) }));
      },

      bannerAd: (() => {
        const a = ADS.filter(x => !st.adHidden[x.id])[0];
        if (!a) return null;
        return { brand:a.brand, logo:a.logo, art:a.art, head:a.head[g], body:a.body[g], cta:a.cta[g],
          click: () => { FF.fire(FF.post('/ads/' + a.id + '/click')); this.say((g === 'vi' ? 'Đang mở ' : 'Opening ') + a.brand); },
          why: () => this.say(L.adWhyBody),
          hide: () => { const h = Object.assign({}, st.adHidden); h[a.id] = true; this.setState({ adHidden:h }); if (st.user) FF.fire(FF.post('/ads/' + a.id + '/hide')); this.say(L.adHidden); } };
      })(),
      bannerAdShow: ADS.filter(x => !st.adHidden[x.id]).length > 0,


      /* ---- event detail ---- */
      detail: (() => {
        const e = EVENTS.filter(x => x.id === st.detailId)[0];
        if (!e) return {};
        const org = ORGS[ORG_OF[e.id]] || { id:'', slug:'', name:'', initials:'', art:e.art, verified:false, followers:0, bio:{ en:'', vi:'' }, since:'' };
        const det = st.details[e.id];
        const fr = this.fGoing(e.id);
        const about = ABOUT[e.id] && ABOUT[e.id][g] ? ABOUT[e.id][g] : (e.lineup.join(', ') + ' · ' + e.venue);
        const isFree = e.price === 0;
        return {
          title:e.title, art:e.art, genre:e.genre,
          hasBadge: !!e.badge, badgeLabel: e.badge ? e.badge[g] : '',
          whenLine: this.when(e), whereLine: e.venue + ' · ' + e.area,
          about: about,
          lineup: e.lineup.map(a => {
            const on = !!st.following['art:' + a];
            return { name:a,
              hint: on ? (vi1 ? 'Bỏ theo dõi ' + a : 'Unfollow ' + a) : (vi1 ? 'Theo dõi ' + a : 'Follow ' + a),
              bg: on ? 'rgba(182,217,252,.12)' : 'rgba(5,6,15,.6)',
              bd: on ? '#B6D9FC' : 'rgba(186,215,247,.2)',
              fg: on ? '#D8ECF8' : '#C7D3EA',
              icon: on ? 'ph-fill ph-bell-ringing' : 'ph-bold ph-plus',
              iconFg: on ? '#D8ECF8' : '#8A94A8',
              follow: () => {
                if (!st.user) return this.openAuth('signup', null, L.gateSave);
                this.toggleFollow('art', a);
                this.say((on ? L.unfollowedToast : L.followedToast).replace('{n}', a));
              } };
          }),
          followingAny: e.lineup.some(a => !!st.following['art:' + a]),
          followingLine: L.followingArtists.replace('{n}', String(e.lineup.filter(a => !!st.following['art:' + a]).length)),
          facts: [
            { label:L.factDate, value: DOW[g][e.dsD.getDay()] + ', ' + e.dsD.getDate() + ' ' + MON[g][e.dsD.getMonth()] + ' ' + e.dsD.getFullYear(), icon:'ph-bold ph-calendar-dots' },
            { label:L.factDoors, value:e.time, icon:'ph-bold ph-clock' },
            { label:L.factVenue, value:e.venue, icon:'ph-bold ph-map-pin' },
            { label:L.factDist, value: e.dist + ' km · ' + e.area, icon:'ph-bold ph-navigation-arrow' },
            { label:L.factPrice, value: isFree ? L.free : this.short(e.price) + ' ' + (g === 'vi' ? 'trở lên' : 'and up'), icon:'ph-bold ph-ticket' },
            { label:L.factAge, value: det ? (det.age === 'All ages' ? (g === 'vi' ? 'Mọi lứa tuổi' : 'All ages') : det.age) : (isFree ? (g === 'vi' ? 'Mọi lứa tuổi' : 'All ages') : '18+'), icon:'ph-bold ph-user-circle' }
          ],
          priceBig: isFree ? L.free : this.short(e.price),
          priceColor: isFree ? '#269684' : '#D8ECF8',
          priceSub: isFree ? (g === 'vi' ? 'Không cần vé' : 'No ticket needed') : (g === 'vi' ? 'Giá thấp nhất, chưa gồm phí cổng' : 'Lowest tier, before gateway fees'),
          soldOut: !!e.soldOut,
          cta: e.soldOut ? L.soldOut : isFree ? L.freeEntry : L.getTickets,
          ctaClass: e.soldOut ? '' : 'ff-cta',
          ctaBg: e.soldOut ? '#131725' : isFree ? '#269684' : '#B6D9FC',
          ctaFg: e.soldOut ? '#8A94A8' : '#05060F',
          buy: () => {
            if (e.soldOut) return this.say(g === 'vi' ? 'Đêm này đã hết vé' : 'This date is sold out');
            if (!st.user) return this.openAuth('signup', 'save:' + e.id, L.gateTickets);
            FF.fire(FF.post('/events/' + e.id + '/track', { type:'ticket_click', source:'feed' }));
            this.say(g === 'vi' ? 'Đang chuyển tới trang bán vé của nhà tổ chức' : 'Sending you to the organiser checkout');
          },
          ticketNote:L.ticketNote,
          saved: !!st.saved[e.id],
          saveLabel: st.saved[e.id] ? L.savedEvent : L.saveEvent,
          saveBg: st.saved[e.id] ? 'rgba(182,217,252,.14)' : 'transparent',
          saveBd: st.saved[e.id] ? '#B6D9FC' : 'rgba(186,215,247,.12)',
          saveFg: st.saved[e.id] ? '#D8ECF8' : '#C7D3EA',
          save: () => {
            if (!st.user) return this.openAuth('signup', 'save:' + e.id, L.gateSave);
            this.toggleFlag('saved', '/me/saves/', e.id);
          },
          share: () => this.say(L.shareCopied),
          friendsShow: fr.length > 0,
          friendsLine: fr.length + ' ' + L.friendsGoing,
          friendFaces: fr.slice(0, 5).map(f => ({ initials: initialsOf(f.name), color: f.color })),
          mapPin: e.area, openMaps: () => this.say(L.openInMaps + ' · ' + e.venue),
          orgName: org.name, orgInitials: org.initials, orgArt: org.art,
          orgVerified: org.verified, orgVerifiedLabel: L.orgVerified,
          orgMeta: this.short0(org.followers) + ' ' + L.orgFollowers,
          openOrg: () => this.openOrg(org.id),
          followOrg: () => {
            if (!st.user) return this.openAuth('signup', null, L.gateSave);
            this.toggleFollow('org', org.id);
            this.say((st.following['org:' + org.id] ? L.unfollowedToast : L.followedToast).replace('{n}', org.name));
          },
          followOrgLabel: st.following['org:' + org.id] ? L.followOrgDone : L.followOrgCta,
          followOrgIcon: st.following['org:' + org.id] ? 'ph-fill ph-bell-ringing' : 'ph-bold ph-bell',
          followOrgBg: st.following['org:' + org.id] ? 'rgba(182,217,252,.12)' : 'transparent',
          followOrgBd: st.following['org:' + org.id] ? '#B6D9FC' : 'rgba(186,215,247,.2)',
          followOrgFg: st.following['org:' + org.id] ? '#D8ECF8' : '#C7D3EA',
          followOrgNote: L.followOrgNote,
          similar: (() => {
            if (det && det.similar) return det.similar.map(s => EVENTS.find(x => x.id === s.id)).filter(Boolean);
            const near = EVENTS.filter(x => x.id !== e.id && !x.past && (x.genre === e.genre || x.area === e.area));
            const rest = EVENTS.filter(x => x.id !== e.id && !x.past && near.indexOf(x) < 0).sort((a, b) => b.hype - a.hype);
            return near.concat(rest).slice(0, 3);
          })().map(x => ({
            title:x.title, art:x.art, whenLine: this.when(x),
            priceLine: x.price === 0 ? L.free : L.from + ' ' + this.short(x.price),
            open: () => this.openEvent(x.id)
          }))
        };
      })(),

      tt: (() => {
        const e = EVENTS.filter(x => x.id === st.detailId)[0];
        const T = e ? TT[e.id] : null;
        if (!T) return { show:false, days:[], ticks:[], gridLines:[], stages:[], clashes:[], hasPlan:false, hasClash:false, planLine:'', planFg:'#8A94A8', clashTitle:'' };
        const di = Math.min(st.ttDay, T.days.length - 1), day = T.days[di];
        const w0 = T.win[0], w1 = T.win[1], span = w1 - w0;
        const pct = (m) => Math.round((m - w0) / span * 1000) / 10;
        const fmt = (m) => { const h = Math.floor(m / 60) % 24, mm = m % 60; return String(h).padStart(2,'0') + ':' + String(mm).padStart(2,'0'); };
        const idOf = (si, xi) => day.stages[si].s[xi][3];
        const picked = [];
        day.stages.forEach((s, si) => s.s.forEach((x, xi) => {
          if (st.plan[idOf(si, xi)]) picked.push({ id: idOf(si, xi), name:x[0], a:x[1], b:x[2], stage: s[g] });
        }));
        const clashIds = {}, clashes = [];
        for (let i = 0; i < picked.length; i++) for (let j = i + 1; j < picked.length; j++) {
          const p = picked[i], q = picked[j];
          const ov = Math.min(p.b, q.b) - Math.max(p.a, q.a);
          if (ov > 0) {
            clashIds[p.id] = true; clashIds[q.id] = true;
            clashes.push({ line: L.ttClashLine.replace('{a}', p.name).replace('{b}', q.name).replace('{m}', String(ov)) });
          }
        }
        const ticks = []; for (let m = w0; m <= w1; m += 120) ticks.push({ label: fmt(m), left: pct(m) + '%' });
        const gridLines = []; for (let m = w0 + 60; m < w1; m += 60) gridLines.push({ left: pct(m) + '%' });
        return {
          show: true,
          days: T.days.map((d, i) => ({
            label: d[g],
            bg: i === di ? 'rgba(182,217,252,.14)' : 'transparent',
            bd: i === di ? '#B6D9FC' : 'rgba(186,215,247,.12)',
            fg: i === di ? '#D8ECF8' : '#9DA7BA',
            pick: () => this.setState({ ttDay:i })
          })),
          ticks: ticks, gridLines: gridLines,
          stages: day.stages.map((s, si) => ({
            name: s[g],
            sets: s.s.map((x, xi) => {
              const id = idOf(si, xi), on = !!st.plan[id], bad = !!clashIds[id];
              return {
                name: x[0], time: fmt(x[1]) + ' – ' + fmt(x[2]),
                left: pct(x[1]) + '%', width: Math.max(4, pct(x[2]) - pct(x[1])) + '%',
                picked: on,
                hint: on ? (vi1 ? 'Bỏ khỏi lịch' : 'Remove from your plan') : (vi1 ? 'Thêm vào lịch' : 'Add to your plan'),
                bg: on ? (bad ? 'rgba(228,109,76,.24)' : 'rgba(182,217,252,.22)') : 'rgba(20,24,38,.85)',
                bd: on ? (bad ? '#E46D4C' : '#B6D9FC') : '#2C3648',
                glow: on ? (bad ? '0 0 0 1px rgba(228,109,76,.35)' : '0 0 0 1px rgba(182,217,252,.3)') : 'none',
                fg: on ? '#D8ECF8' : '#C7D3EA',
                timeFg: on ? (bad ? '#F0A07F' : '#D8ECF8') : '#8A94A8',
                icon: bad ? 'ph-fill ph-warning' : 'ph-fill ph-check-circle',
                iconFg: bad ? '#F0A07F' : '#D8ECF8',
                toggle: () => {
                  if (!st.user) return this.openAuth('signup', null, L.gateSave);
                  const p = Object.assign({}, st.plan); p[id] = !on; this.setState({ plan:p });
                  FF.fire(on ? FF.del('/me/plan/sets/' + id) : FF.put('/me/plan/sets/' + id, {}), (err) => this.say(FF.errorText(err, g)));
                }
              };
            })
          })),
          hasPlan: picked.length > 0,
          planLine: picked.length ? L.ttPlan.replace('{n}', String(picked.length)) : L.ttPlanEmpty,
          planFg: picked.length ? '#D8ECF8' : '#8A94A8',
          hasClash: clashes.length > 0,
          clashTitle: L.ttClash,
          clashes: clashes,
          clear: () => {
            const p = Object.assign({}, st.plan);
            T.days.forEach(d => d.stages.forEach(s => s.s.forEach(x => { delete p[x[3]]; })));
            this.setState({ plan:p });
            if (st.user) FF.fire(FF.patch('/me/plan/events/' + e.id, { clear:true }));
          },
          remind: () => { if (!st.user) return this.openAuth('signup', null, L.gateSave); FF.fire(FF.patch('/me/plan/events/' + e.id, { remindAll:true })); this.say(L.ttRemindDone); }
        };
      })(),

      tiers: (() => {
        const e = EVENTS.filter(x => x.id === st.detailId)[0];
        const set = e ? TIER_SETS[e.id] : null;
        if (!e || !set || e.price === 0) return { show:false, rows:[], hasUrgency:false, urgency:'', refund:'' };
        const names = { early:L.tierEarly, ga:L.tierGA, vip:L.tierVIP, table:L.tierTable };
        const notes = { early:L.tierEarlyNote, ga:L.tierGANote, vip:L.tierVIPNote, table:L.tierTableNote };
        const stMap = {
          onsale: { label:L.tierOnSale, fg:'#6CC7B6', bg:'rgba(38,150,132,.14)', bd:'rgba(38,150,132,.4)' },
          last: { label:L.tierLast, fg:'#F0A07F', bg:'rgba(228,109,76,.14)', bd:'rgba(228,109,76,.42)' },
          soldout: { label:L.tierSoldOut, fg:'#9DA7BA', bg:'rgba(157,167,186,.112)', bd:'rgba(186,215,247,.12)' },
          soon: { label:L.tierSoon, fg:'#C4B8F7', bg:'rgba(102,58,243,.14)', bd:'rgba(102,58,243,.4)' }
        };
        const urgent = set.tiers.filter(t => t.state === 'last')[0];
        return {
          show: true,
          hasUrgency: !!urgent,
          urgency: urgent && set.urgency ? set.urgency[g] : '',
          refund: L.tiersRefund,
          rows: set.tiers.map(t => {
            const m = stMap[t.state], out = t.state === 'soldout', soon = t.state === 'soon';
            return {
              name: t.name[g], note: t.note ? t.note[g] : (notes[t.key] || ''),
              price: this.short(t.price),
              priceFg: out ? '#8A94A8' : '#D8ECF8',
              nameFg: out ? '#9DA7BA' : '#D8ECF8',
              state: m.label, stFg: m.fg, stBg: m.bg, stBd: m.bd,
              op: out ? '.62' : '1',
              hasLeft: !!t.left && !out,
              left: t.left ? L.tierLeft.replace('{n}', String(t.left)) : '',
              leftFg: t.state === 'last' ? '#F0A07F' : '#8A94A8',
              cta: out ? L.tierSoldOut : soon ? L.tierNotify : L.tierBuy,
              cursor: out ? 'default' : 'pointer',
              ctaBg: out ? 'transparent' : soon ? 'transparent' : t.state === 'last' ? 'rgba(228,109,76,.14)' : 'rgba(186,214,247,.06)',
              ctaBd: out ? 'rgba(186,215,247,.12)' : soon ? '#7A55F6' : t.state === 'last' ? 'rgba(228,109,76,.5)' : 'rgba(186,215,247,.2)',
              ctaFg: out ? '#8A94A8' : soon ? '#C4B8F7' : t.state === 'last' ? '#F0A07F' : '#FFFFFF',
              buy: () => {
                if (out) return this.say(L.tierSoldToast);
                if (!st.user) return this.openAuth('signup', 'save:' + e.id, L.gateTickets);
                if (soon) { FF.fire(FF.put('/events/' + e.id + '/tiers/' + t.id + '/watch')); return this.say(L.tierNotifyToast); }
                FF.fire(FF.post('/events/' + e.id + '/track', { type:'ticket_click', source:'feed' }));
                this.say(g === 'vi' ? 'Đang chuyển tới trang bán vé · ' + t.name[g] : 'Sending you to checkout · ' + t.name[g]);
              }
            };
          })
        };
      })(),

      reportOpen: !!st.reportFor,
      openReport: () => this.setState({ reportFor: st.detailId, reportCode:'wrong', reportNote:'' }),
      closeReport: () => this.setState({ reportFor:null }),
      reportCodes: REPORT_CODES.map(c => {
        const on = st.reportCode === c.k;
        return { label: c[g], icon:c.icon,
          bg: on ? 'rgba(182,217,252,.1)' : 'rgba(5,6,15,.6)',
          bd: on ? '#B6D9FC' : 'rgba(186,215,247,.12)',
          fg: on ? '#D8ECF8' : '#C7D3EA',
          iconFg: on ? '#D8ECF8' : '#8A94A8',
          pick: () => this.setState({ reportCode:c.k }) };
      }),
      reportNote: st.reportNote,
      onReportNote: (ev) => this.setState({ reportNote: ev.target.value }),
      sendReport: () => {
        const id = st.reportFor;
        if (!st.user) { this.setState({ reportFor:null }); return this.openAuth('signup', null, L.gateSave); }
        this.setState({ reportFor:null });
        FF.post('/events/' + id + '/reports', { code: st.reportCode, note: st.reportNote }).then(() => this.say(L.reportSent), e => this.say(FF.errorText(e, g)));
      },

      notifOpen: st.notifOpen,
      openNotifPrefs: () => {
        this.setState({ notifOpen:true, acctOpen:false });
        FF.get('/me/notification-preferences').then(r => this.setState({ notifM: r.matrix }), e => console.warn('[ff] prefs', e));
      },
      closeNotifPrefs: () => {
        this.setState({ notifOpen:false });
        FF.put('/me/notification-preferences', { matrix: st.notifM }).then(() => this.say(L.notifSaved), e => this.say(FF.errorText(e, g)));
      },
      notifOnCount: L.notifOnLine.replace('{n}', String(NOTIF_ROWS.reduce((n, r) => n + ['push','zalo','email'].filter(c => st.notifM[r.k][c]).length, 0))),
      notifCols: [
        { k:'push', label: vi1 ? 'Push' : 'Push', icon:'ph-bold ph-device-mobile' },
        { k:'zalo', label:'Zalo', icon:'ph-bold ph-chat-circle-dots' },
        { k:'email', label:'Email', icon:'ph-bold ph-envelope-simple' }
      ],
      notifRows: NOTIF_ROWS.map(r => ({
        label: r[g], icon: r.icon,
        cells: ['push','zalo','email'].map(c => {
          const on = !!st.notifM[r.k][c];
          return {
            icon: on ? 'ph-fill ph-check-circle' : 'ph-bold ph-circle',
            color: on ? '#B6D9FC' : 'rgba(186,215,247,.2)',
            bg: on ? 'rgba(182,217,252,.1)' : 'transparent',
            bd: on ? 'rgba(182,217,252,.4)' : '#171B29',
            hint: (on ? (vi1 ? 'Tắt ' : 'Turn off ') : (vi1 ? 'Bật ' : 'Turn on ')) + r[g],
            toggle: () => {
              const m = Object.assign({}, st.notifM);
              m[r.k] = Object.assign({}, m[r.k]); m[r.k][c] = !on;
              this.setState({ notifM:m });
            }
          };
        })
      })),

      /* ---- organiser profile ---- */
      org: (() => {
        const o = ORGS[st.orgId];
        if (!o) return {};
        const mine = EVENTS.filter(x => ORG_OF[x.id] === o.id);
        const up = mine.filter(x => !x.past);
        const past = mine.filter(x => x.past).map(x => ({ title:x.title, art:x.art, whenLine: this.when(x), open: () => this.openEvent(x.id) }))
          .concat((ORG_PAST[o.id] || []).map(p => ({ title:p.t, art:p.a, whenLine:p.d[g], open: () => this.say(g === 'vi' ? 'Sự kiện đã kết thúc' : 'This event has ended') })));
        const following = !!st.following['org:' + o.id];
        return {
          name:o.name, initials:o.initials, art:o.art, bio:(o.bio || {})[g] || '',
          verified:o.verified, verifiedLabel:L.orgVerified,
          stats: [
            { value:String(mine.length + (ORG_PAST[o.id] || []).length), label:L.orgEvents },
            { value:this.short0(o.followers), label:L.orgFollowers },
            { value:o.since, label:L.orgSince }
          ],
          following: following,
          followLabel: following ? L.followingLabel : L.follow,
          followBg: following ? 'transparent' : '#B6D9FC',
          followFg: following ? '#D8ECF8' : '#05060F',
          followBd: following ? '#B6D9FC' : '#B6D9FC',
          follow: () => {
            if (!st.user) return this.openAuth('signup', null, L.gateSave);
            this.toggleFollow('org', o.id);
            this.say((following ? L.unfollowedToast : L.followedToast).replace('{n}', o.name));
          },
          upTitle:L.orgUpcoming, pastTitle:L.orgPast,
          upEmpty: up.length === 0, noUpcoming:L.orgNoUpcoming,
          hasPast: past.length > 0,
          upcoming: up.map(x => ({
            title:x.title, art:x.art, genre:x.genre, whenLine: this.when(x),
            whereLine: x.venue + ' · ' + x.dist + ' km',
            priceLine: x.price === 0 ? L.free : L.from + ' ' + this.short(x.price),
            priceColor: x.price === 0 ? '#269684' : '#D8ECF8',
            open: () => this.openEvent(x.id)
          })),
          pastRows: past
        };
      })(),
      goBack: () => this.goBack(),
      backLabel: L.back,

      screenTabs: tabDefs.map(t => ({
        label:t.label,
        bg: st.screen === t.k ? '#B6D9FC' : 'transparent',
        fg: st.screen === t.k ? '#090B16' : '#9DA7BA',
        go: () => { this.setState({ screen:t.k }); if (t.k === 'landing' || t.k === 'about') FF.webLanding(this); }
      })),
      query: st.q, onQuery: (e) => this.refilter({ q: e.target.value }),

      statCards: [
        { k:'free', value: String(statFree.length), label: L.statFree, color:'#269684' },
        { k:'weekend', value: String(statWeekend.length), label: L.statWeekend, color:'#B6D9FC' },
        { k:'venues', value: String(statVenueKeys.length), label: L.statVenues, color:'#9D84F8' }
      ].map(s => ({ value:s.value, label:s.label, color:s.color, hint: L.statCardHint, open: () => this.openStat(s.k) })),

      statAccent: statK === 'free' ? '#269684' : statK === 'venues' ? '#7A55F6' : '#B6D9FC',
      statKicker: L.statKicker,
      statTitle: statK === 'free' ? L.statHeadFree : statK === 'venues' ? L.statHeadVenues : L.statHeadWeekend,
      statSub: statK === 'free' ? L.statSubFree : statK === 'venues' ? L.statSubVenues : L.statSubWeekend,
      statEmpty: statK === 'venues' ? statVenueKeys.length === 0 : (statK === 'free' ? statFree : statWeekend).length === 0,
      statEmptyNote: L.statEmptyNote,
      statChips: (() => {
        const out = [{ label: (statK === 'venues' ? statVenueKeys.length : (statK === 'free' ? statFree : statWeekend).length) + ' · ' + (statK === 'venues' ? L.statVenues : L.events) }];
        const tl = timeDefs.filter(t => t.k === st.time)[0];
        if (tl && !st.q) out.push({ label: tl.label });
        if (st.genre !== 'All') out.push({ label: st.genre });
        if (st.q) out.push({ label: '“' + st.q + '”' });
        return out;
      })(),
      statRows: (() => {
        if (statK === 'venues') {
          return statVenueKeys.map(v => {
            const list = statVenues[v], first = list[0];
            return {
              title: v, art: first.art, icon:'ph-fill ph-map-pin',
              meta: first.dist + ' km · ' + list.map(e => e.title).slice(0, 2).join(' · '),
              hasTag: false, tag:'', tagBg:'transparent', tagBd:'transparent', tagFg:'#9DA7BA',
              stat: String(list.length), statFg:'#C4B8F7', statLabel: L.statEventsOn,
              cta: L.statOpenMap, ctaIcon:'ph-bold ph-map-trifold',
              open: () => this.openOnMap(first.id)
            };
          });
        }
        return (statK === 'free' ? statFree : statWeekend).map(e => ({
          title: e.title, art: e.art, icon: e.price === 0 ? 'ph-fill ph-ticket' : 'ph-fill ph-music-notes',
          meta: this.when(e) + ' · ' + e.venue + ' · ' + e.dist + ' km',
          hasTag: e.price === 0 || e.soldOut,
          tag: e.soldOut ? L.soldOut : L.free,
          tagBg: e.soldOut ? 'rgba(228,109,76,.14)' : 'rgba(38,150,132,.14)',
          tagBd: e.soldOut ? 'rgba(228,109,76,.5)' : 'rgba(38,150,132,.5)',
          tagFg: e.soldOut ? '#F0A07F' : '#6CC7B6',
          stat: e.hype >= 1000 ? (e.hype / 1000).toFixed(1) + 'K' : String(e.hype),
          statFg:'#D8ECF8', statLabel: L.statHype,
          cta: L.statOpenEvent, ctaIcon:'ph-bold ph-arrow-right',
          open: () => this.openEvent(e.id)
        }));
      })(),

      aboutFacts: [
        { value: vi1 ? '48.200' : '48,200', label: vi1 ? 'người đã xem sự kiện ở TP.HCM trong 30 ngày qua' : 'people browsed events in Ho Chi Minh City in the last 30 days', color:'#B6D9FC' },
        { value: vi1 ? '2 giờ' : '2 hours', label: vi1 ? 'thời gian duyệt trung bình cho một tin mới' : 'median time to check and publish a new listing', color:'#9D84F8' },
        { value: '0₫', label: vi1 ? 'phí đặt vé — vé do nhà tổ chức bán' : 'booking fee — tickets are sold by the organiser', color:'#269684' }
      ],
      contactCards: [
        { title: L.abContactUsers, body: L.abContactUsersBody, icon:'ph-fill ph-chat-circle-dots', color:'#B6D9FC', tint:'rgba(182,217,252,.13)',
          link:'hello@festfinder.vn', href:'mailto:hello@festfinder.vn', linkIcon:'ph-bold ph-envelope-simple', hasAction:false },
        { title: L.abContactOrg, body: L.abContactOrgBody, icon:'ph-fill ph-megaphone', color:'#6CC7B6', tint:'rgba(38,150,132,.14)',
          link:'organisers@festfinder.vn', href:'mailto:organisers@festfinder.vn', linkIcon:'ph-bold ph-envelope-simple', hasAction:false },
        { title: L.abContactBrand, body: L.abContactBrandBody, icon:'ph-fill ph-briefcase', color:'#C4B8F7', tint:'rgba(102,58,243,.14)',
          link:'partners@festfinder.vn', href:'mailto:partners@festfinder.vn', linkIcon:'ph-bold ph-envelope-simple',
          hasAction:true, actionLabel: L.abAdvertise, action: () => this.setState({ screen:'explore', adsOpen:true, adErr:'' }) }
      ],
      socialLinks: [
        { label:'Facebook', handle:'/festfinder.vn', href:'https://facebook.com/festfinder.vn', icon:'ph-fill ph-facebook-logo', color:'#6FB0F0' },
        { label:'Instagram', handle:'@festfinder.vn', href:'https://instagram.com/festfinder.vn', icon:'ph-fill ph-instagram-logo', color:'#E88AA8' },
        { label:'TikTok', handle:'@festfinder', href:'https://tiktok.com/@festfinder', icon:'ph-fill ph-tiktok-logo', color:'#D8ECF8' },
        { label:'Zalo', handle:'FeestFinder OA', href:'https://zalo.me/festfinder', icon:'ph-fill ph-chat-circle-text', color:'#B6D9FC' }
      ],
      aboutMeta: [
        { label: L.abOffice, value:'48 Lê Lợi, Bến Nghé, Quận 1, TP.HCM' },
        { label: L.abHotline, value: vi1 ? '1900 8386 · đến 02:00 đêm lễ hội' : '1900 8386 · until 02:00 on festival nights' },
        { label: L.abHours, value: vi1 ? 'Thứ Hai – Thứ Bảy, 09:00 – 18:00' : 'Monday to Saturday, 09:00 – 18:00' }
      ],

      timeOptions: timeDefs.map(t => ({
        label:t.label, icon:t.icon, count: String(countFor(t.k)),
        bg: st.time === t.k && !st.q ? 'rgba(182,217,252,.14)' : 'transparent',
        bd: st.time === t.k && !st.q ? '#B6D9FC' : 'rgba(186,215,247,.12)',
        fg: st.time === t.k && !st.q ? '#D8ECF8' : '#9DA7BA',
        countColor: st.time === t.k && !st.q ? '#B6D9FC' : '#8A94A8',
        pick: () => this.refilter({ time:t.k, q:'' })
      })),
      genreOptions: GENRES.map(n => ({
        name: n === 'All' ? L.all : n,
        bg: st.genre === n ? '#1A1236' : 'transparent',
        bd: st.genre === n ? '#7A55F6' : 'rgba(186,215,247,.12)',
        fg: st.genre === n ? '#D6CFFA' : '#9DA7BA',
        pick: () => this.refilter({ genre:n })
      })),
      priceOptions: priceDefs.map(p => ({
        label:p.label,
        bg: st.prices[p.k] ? 'rgba(182,217,252,.1)' : 'transparent',
        bd: st.prices[p.k] ? '#B6D9FC' : 'rgba(186,215,247,.12)',
        fg: st.prices[p.k] ? '#D8ECF8' : '#9DA7BA',
        boxBd: st.prices[p.k] ? '#B6D9FC' : 'rgba(186,215,247,.24)',
        boxBg: st.prices[p.k] ? '#B6D9FC' : 'transparent',
        tick: st.prices[p.k] ? '1' : '0',
        pick: () => { const n = Object.assign({}, st.prices); n[p.k] = !n[p.k]; this.refilter({ prices:n }); }
      })),
      sortOptions: sortDefs.map(s => ({
        label:s.label,
        bg: st.sort === s.k ? '#B6D9FC' : 'transparent',
        bd: st.sort === s.k ? '#B6D9FC' : 'rgba(186,215,247,.12)',
        fg: st.sort === s.k ? '#090B16' : '#9DA7BA',
        pick: () => this.setState({ sort:s.k })
      })),
      resetFilters: () => this.refilter({ time:'weekend', genre:'All', prices:{}, q:'', sort:'date' }),

      hero: heroEv ? Object.assign({}, this.card(heroEv, L), {
        badge: heroEv.badge ? heroEv.badge[g] : L.free,
        hypeLine: heroEv.hype.toLocaleString(vi1 ? 'vi-VN' : 'en-US') + ' ' + L.hypedPeople,
        cta: heroEv.price === 0 ? L.freeEntry : L.getTickets,
        buy: (ev) => { ev.stopPropagation(); buy(heroEv.price); }
      }) : null,
      countLine: full.length + ' ' + (full.length === 1 && !vi1 ? 'event' : L.events) + (st.q ? ' · "' + st.q + '"' : ''),
      loading: st.loading, skeletons: [{}, {}, {}, {}, {}, {}],
      showGrid: !st.loading && full.length > 0,
      gridEmpty: !st.loading && full.length === 0,
      grid: grid.map(e => this.card(e, L)),
      loadMoreDisplay: full.length > st.limit ? 'block' : 'none',
      loadMore: () => this.setState({ limit: st.limit + 6 }),

      mapCount: mapList.length + ' ' + L.events,
      mapLocked: !!st.mapLock,
      mapMoved: st.mapMoved,
      mapZoomLabel: (Math.round(st.mapZoom * 10) / 10) + '×',
      searchThisArea: () => this.setState({ mapLock:{ mapCx:st.mapCx, mapCy:st.mapCy, mapZoom:st.mapZoom }, mapMoved:false, mapSel:null }),
      clearMapArea: () => this.setState({ mapLock:null, mapMoved:false }),
      mapZoomIn: () => this.setState({ mapZoom: Math.min(2.6, Math.round(st.mapZoom * 1.35 * 10) / 10), mapMoved:true }),
      mapZoomOut: () => this.setState({ mapZoom: Math.max(0.8, Math.round(st.mapZoom / 1.35 * 10) / 10), mapMoved:true }),
      mapRecenter: () => this.setState({ mapCx:50, mapCy:50, mapZoom:1, mapLock:null, mapMoved:false }),
      mapPanUp: () => this.setState({ mapCy: st.mapCy - 8 / st.mapZoom, mapMoved:true }),
      mapPanDown: () => this.setState({ mapCy: st.mapCy + 8 / st.mapZoom, mapMoved:true }),
      mapPanLeft: () => this.setState({ mapCx: st.mapCx - 8 / st.mapZoom, mapMoved:true }),
      mapPanRight: () => this.setState({ mapCx: st.mapCx + 8 / st.mapZoom, mapMoved:true }),
      mapFilters: [
        { k:'All', label: vi1 ? 'Tất cả' : 'All', icon:'ph-bold ph-squares-four' },
        { k:'EDM', label:'EDM', icon:'ph-bold ph-waveform' },
        { k:'Festival', label: vi1 ? 'Lễ hội' : 'Festival', icon:'ph-bold ph-confetti' },
        { k:'Indie', label:'Indie', icon:'ph-bold ph-guitar' },
        { k:'Food', label: vi1 ? 'Ăn uống' : 'Food', icon:'ph-bold ph-fork-knife' }
      ].map(f => {
        const on = st.mapGenre === f.k;
        return { label:f.label, icon:f.icon,
          bg: on ? 'rgba(182,217,252,.14)' : 'rgba(13,16,28,.6)',
          bd: on ? '#B6D9FC' : 'rgba(186,215,247,.12)',
          fg: on ? '#D8ECF8' : '#9DA7BA',
          pick: () => this.setState({ mapGenre:f.k, mapSel:null }) };
      }).concat([{
        label: L.mapFree, icon:'ph-bold ph-gift',
        bg: st.mapFree ? 'rgba(38,150,132,.16)' : 'rgba(13,16,28,.6)',
        bd: st.mapFree ? '#269684' : 'rgba(186,215,247,.12)',
        fg: st.mapFree ? '#6CC7B6' : '#9DA7BA',
        pick: () => this.setState({ mapFree: !st.mapFree, mapSel:null })
      }]),
      mapCards: mapList.map(e => Object.assign({}, this.card(e, L), {
        rowBg: st.mapSel === e.id ? 'rgba(182,217,252,.1)' : 'rgba(13,16,28,.6)',
        rowBd: st.mapSel === e.id ? '#B6D9FC' : 'rgba(186,215,247,.12)',
        select: () => this.setState({ mapSel:e.id })
      })),
      mapPins: (() => {
        const placed = [];
        mapList.forEach(e => {
          let x = 12 + ((e.lng - 106.64) / 0.21) * 76, y = 86 - ((e.lat - 10.71) / 0.15) * 60;
          for (let i = 0; i < 12; i++) {
            const hit = placed.some(p => Math.abs(p.x - x) < 9 && Math.abs(p.y - y) < 7);
            if (!hit) break;
            x += 5.5; y -= 4.5;
          }
          placed.push({ id:e.id, x, y });
        });
        const pinPos = {}; placed.forEach(p => { pinPos[p.id] = { x: Math.round((50 + (p.x - st.mapCx) * st.mapZoom) * 10) / 10, y: Math.round((50 + (p.y - st.mapCy) * st.mapZoom) * 10) / 10 }; });
        return mapList.map(e => {
        const fr = connected ? this.fGoing(e.id) : [];
        return {
        faces: fr.slice(0, 2).map(f => ({ initials: initialsOf(f.name), color: f.color })),
        moreShow: fr.length > 2, more: '+' + (fr.length - 2), hasFriends: fr.length > 0,
        op: st.friendsOnly && !fr.length ? '.25' : '1',
        x: pinPos[e.id].x + '%',
        y: pinPos[e.id].y + '%',
        price: e.price === 0 ? L.free : this.short(e.price),
        z: st.mapSel === e.id ? 6 : 4,
        bg: st.mapSel === e.id ? '#B6D9FC' : 'rgba(5,6,15,.82)',
        bd: st.mapSel === e.id ? '#B6D9FC' : e.featured ? '#7A55F6' : '#B6D9FC',
        fg: st.mapSel === e.id ? '#090B16' : '#D8ECF8',
        glow: st.mapSel === e.id ? '0 6px 22px rgba(182,217,252,.5)' : '0 4px 14px rgba(0,0,0,.5)',
        pick: () => this.setState({ mapSel:e.id })
      }; });
      })(),
      mapSelFriends: sel && connected ? this.fGoing(sel.id).map(f => this.fView(f)) : [],
      mapSelHasFriends: !!(sel && connected && this.fGoing(sel.id).length),
      mapSelFriendsLine: sel && connected ? this.fGoing(sel.id).length + ' ' + L.friendsGoing : '',
      imGoingLabel: sel && st.going[sel.id] ? L.youreGoing : L.imGoing,
      imGoingBg: sel && st.going[sel.id] ? 'rgba(38,150,132,.16)' : 'transparent',
      imGoingBd: sel && st.going[sel.id] ? '#269684' : 'rgba(186,215,247,.24)',
      imGoingFg: sel && st.going[sel.id] ? '#6CC7B6' : '#9DA7BA',
      toggleGoing: () => {
        if (!sel) return;
        if (!st.user) return this.openAuth('signup', null, L.gateSave);
        const on = this.toggleFlag('going', '/me/going/', sel.id);
        this.say(on ? L.youreGoing + ' · ' + L.goingPrivacy : L.imGoing);
      },
      mapSel: sel ? {
        art: sel.art, title: sel.title, whenLine: this.when(sel),
        whereLine: sel.venue + ' · ' + sel.area + ' · ' + sel.dist + ' km',
        cta: sel.price === 0 ? L.freeEntry : L.getTickets,
        buy: (ev) => { ev.stopPropagation(); buy(sel.price); }
      } : null,
      clearMapSel: () => this.setState({ mapSel:null }),

      landingCount: weekend.length + ' ' + L.events,
      answerRows: (() => {
        const wk = weekend.filter(e => !e.past);
        const big = wk.slice().sort((a, b) => b.hype - a.hype)[0];
        const dm = (d) => String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
        return [
          { label: L.ansFree, value: wk.filter(e => e.price === 0).map(e => e.title).join(', ') || '—' },
          { label: L.ansBiggest, value: big ? big.title + ' · ' + big.hype.toLocaleString(vi1 ? 'vi-VN' : 'en-US') + ' ' + L.hypedPeople : '—' },
          { label: L.ansSoldOut, value: wk.filter(e => e.soldOut).map(e => e.title + ' (' + dm(e.dsD) + ')').join(', ') || '—' }
        ];
      })(),

      landingList: weekend.slice().sort((a, b) => a.dsD - b.dsD).map(e => {
        const c = this.card(e, L);
        return Object.assign({}, c, {
          dowShort: DOW[g][e.dsD.getDay()], dayNum: String(e.dsD.getDate()), monShort: MON[g][e.dsD.getMonth()],
          metaLine: e.time + ' · ' + e.venue + ' · ' + e.area,
          lineupLine: e.lineup.slice(0, 4).join(' · ')
        });
      }),
      faqs: FAQ.map((f, i) => ({
        q: f.q[g], a: f.a[g],
        display: st.faqOpen[i] ? 'block' : 'none',
        icon: st.faqOpen[i] ? 'ph-bold ph-minus' : 'ph-bold ph-plus',
        bd: st.faqOpen[i] ? 'rgba(186,215,247,.2)' : 'rgba(186,215,247,.12)',
        toggle: () => { const o = Object.assign({}, st.faqOpen); o[i] = !o[i]; this.setState({ faqOpen:o }); }
      })),
      relatedLinks: RELATED.map(r => ({ label: r.label[g], href: r.href })),
      devRows: DEV.map(d => ({ label: d.label, value: d.value })),
      toast: st.toast
    };
  }
}
