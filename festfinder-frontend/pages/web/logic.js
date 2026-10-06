const WEB = FF.data.web || {};
const TODAY = FF.today();
const S = {
  searchPh:{en:'Search events, artists, venues…',vi:'Tìm sự kiện, nghệ sĩ, địa điểm…'},
  listEvent:{en:'List your event',vi:'Đăng sự kiện'},
  h1a:{en:"What's happening",vi:'Cuối tuần này'}, h1b:{en:'near you?',vi:'có gì chơi?'},
  mqFest:{en:'Festivals',vi:'Lễ hội'}, mqLive:{en:'Live music',vi:'Nhạc sống'}, mqCulture:{en:'Culture',vi:'Văn hoá'}, mqFree:{en:'Free',vi:'Miễn phí'},
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
  events:{en:'events',vi:'sự kiện'}, hypedPeople:{en:'people hyped',vi:'người đang hype'},
  tabExplore:{en:'Explore',vi:'Khám phá'}, tabMap:{en:'List',vi:'Danh sách'},
  tabAbout:{en:'About',vi:'Giới thiệu'},
  statKicker:{en:'Filtered list',vi:'Danh sách đã lọc'},
  statHeadFree:{en:'Free entry, no ticket needed',vi:'Vào cửa miễn phí, không cần vé'},
  statHeadWeekend:{en:'On this weekend',vi:'Diễn ra cuối tuần này'},
  statHeadVenues:{en:'Venues with something on',vi:'Địa điểm đang có sự kiện'},
  statSubFree:{en:'Everything free in your current filters. Open an event for doors, lineup and directions.',vi:'Tất cả sự kiện miễn phí theo bộ lọc hiện tại. Mở một sự kiện để xem giờ mở cửa, đội hình và đường đi.'},
  statSubWeekend:{en:'Friday to Sunday, matching your current filters. Open an event for doors, lineup and directions.',vi:'Từ thứ Sáu đến Chủ nhật, khớp bộ lọc hiện tại. Mở một sự kiện để xem giờ mở cửa, đội hình và đường đi.'},
  statSubVenues:{en:'Grouped by venue.',vi:'Nhóm theo địa điểm.'},
  statEmptyNote:{en:'Nothing matches the filters you have set. Widen the date range or clear the price filter.',vi:'Không có gì khớp bộ lọc hiện tại. Mở rộng khoảng ngày hoặc bỏ lọc giá.'},
  statOpenEvent:{en:'Event page',vi:'Trang sự kiện'},
  statOpenMap:{en:'Open event',vi:'Mở sự kiện'},
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
  logIn:{en:'Log in',vi:'Đăng nhập'}, signUp:{en:'Sign up',vi:'Đăng ký'}, signOut:{en:'Sign out',vi:'Đăng xuất'},
  savedCount:{en:'Saved events',vi:'Sự kiện đã lưu'},
  savedTitle:{en:'Your saved events',vi:'Sự kiện bạn đã lưu'},
  savedExit:{en:'Back to all events',vi:'Xem tất cả sự kiện'},
  savedNone:{en:'Nothing saved yet — tap the heart on any event.',vi:'Chưa lưu sự kiện nào — bấm trái tim trên thẻ sự kiện.'},
  gateSave:{en:'Log in to save events',vi:'Đăng nhập để lưu sự kiện'},
  gateTickets:{en:'Log in to buy tickets',vi:'Đăng nhập để mua vé'},
  gateOrganizer:{en:'Log in to list your event',vi:'Đăng nhập để đăng sự kiện'},
  gateAds:{en:'Log in to book advertising',vi:'Đăng nhập để đặt quảng cáo'},
  joinTitle:{en:'Create your account',vi:'Tạo tài khoản'},
  withGoogle:{en:'Continue with Google',vi:'Tiếp tục với Google'},
  withPassword:{en:'Log in with a password',vi:'Đăng nhập bằng mật khẩu'},
  viaGoogle:{en:'Signed in with Google',vi:'Đăng nhập bằng Google'},
  withEmail:{en:'Continue with email',vi:'Tiếp tục với email'},
  idTitleEmail:{en:'WHAT\u2019S YOUR EMAIL?',vi:'EMAIL CỦA BẠN?'},
  idTitleZalo:{en:'WHAT\u2019S YOUR ZALO NUMBER?',vi:'SỐ ZALO CỦA BẠN?'},
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
  otpHint:{en:'6 digits · expires in 10 minutes',vi:'6 chữ số · hết hạn sau 10 phút'},
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
  socialOr:{en:'or',vi:'hoặc'},
  socialWith:{en:'Continue with',vi:'Tiếp tục với'},
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
  similarTitle:{en:'You might also like',vi:'Có thể bạn cũng thích'},
  factDate:{en:'Date',vi:'Ngày'}, factDoors:{en:'Doors',vi:'Giờ mở cửa'},
  factVenue:{en:'Venue',vi:'Địa điểm'}, factAge:{en:'Age',vi:'Độ tuổi'},
  factPrice:{en:'Entry',vi:'Vào cửa'}, factDist:{en:'Distance',vi:'Khoảng cách'}, factSources:{en:'Sources',vi:'Nguồn'},
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
  done:{en:'Done',vi:'Xong'},
  unfollowedToast:{en:'Unfollowed {n}',vi:'Đã bỏ theo dõi {n}'}, friendsGoing:{en:'going',vi:'sẽ đi'},
  friendsGoingTitle:{en:'Friends going',vi:'Bạn bè sẽ đi'},
  becauseFriends:{en:'Because your friends are going',vi:'Vì bạn bè của bạn sẽ đi'},
  alsoInterested:{en:'is also interested',vi:'cũng đang quan tâm'},
  andOthers:{en:'and {n} others',vi:'và {n} người khác'},
  friendsSaved:{en:'{n} friends saved events since yesterday',vi:'{n} người bạn đã lưu sự kiện từ hôm qua'},
  imGoing:{en:'I\u2019m going',vi:'Tôi sẽ đi'}, youreGoing:{en:'You\u2019re going',vi:'Bạn sẽ đi'},
  goingPrivacy:{en:'Friends can see you are going.',vi:'Bạn bè sẽ thấy bạn sẽ đi.'},
  chat:{en:'Chat',vi:'Nhắn tin'}, follow:{en:'Follow',vi:'Theo dõi'}, followingLabel:{en:'Following',vi:'Đang theo dõi'},
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
    vi:'Liên kết Facebook, Instagram hoặc Zalo để xem bạn bè nào đang đi.'},

  /* ---- the event page as a community ---- */
  hypeTitle:{en:'Hype',vi:'Hype'}, hypeCta:{en:'Hype it',vi:'Hype ngay'}, hypeDone:{en:'Hyped',vi:'Đã hype'},
  hype24:{en:'+{n} in the last 24h',vi:'+{n} trong 24 giờ qua'},
  hypeLeft:{en:'{n} to go',vi:'Còn {n}'},
  hypeToast:{en:'Hyped',vi:'Đã hype'},
  communityBy:{en:'Sent in by {n}',vi:'{n} gửi lên'},
  communityBySomeone:{en:'Sent in by the community',vi:'Cộng đồng gửi lên'},
  claimCta:{en:'I organise this',vi:'Tôi là BTC'}, claimPending:{en:'Claim under review',vi:'Đang chờ duyệt'},
  claimTitle:{en:'Take over this event',vi:'Nhận quản lý sự kiện'}, claimNote:{en:'Who you are, and how we can check',vi:'Bạn là ai, và cách chúng tôi xác minh'},
  claimProof:{en:'Proof link (page or post)',vi:'Link chứng minh (fanpage, bài đăng)'}, claimSend:{en:'Send request',vi:'Gửi yêu cầu'},
  claimShort:{en:'At least 10 characters',vi:'Ít nhất 10 ký tự'},
  updTitle:{en:'From the organiser',vi:'Tin từ BTC'}, photoTitle:{en:'Photo wall',vi:'Tường ảnh'}, discPhoto:{en:'Photo',vi:'Ảnh'},
  storyLabel:{en:'Story',vi:'Story'}, storySaved:{en:'Story image saved',vi:'Đã lưu ảnh story'},
  shareCopiedMessenger:{en:'Link copied — paste it into Messenger',vi:'Đã copy — dán vào Messenger'},
  videoMaking:{en:'Making the video…',vi:'Đang tạo video…'}, videoReady:{en:'Share the video',vi:'Chia sẻ video'},
  videoSaved:{en:'Video saved — post it on TikTok',vi:'Đã lưu video — đăng lên TikTok'},
  videoNone:{en:'This browser can’t make videos — here is the picture',vi:'Trình duyệt không tạo được video — dùng ảnh thay'},
  collectCta:{en:'Add to a collection',vi:'Thêm vào bộ sưu tập'}, gateCollect:{en:'Log in to collect events',vi:'Đăng nhập để lưu bộ sưu tập'},
  colPickTitle:{en:'Save to a collection',vi:'Lưu vào bộ sưu tập'}, colNewTitle:{en:'New collection',vi:'Bộ sưu tập mới'},
  colNewPh:{en:'Collection name',vi:'Tên bộ sưu tập'}, colCreate:{en:'Create',vi:'Tạo'},
  colAll:{en:'All saved',vi:'Tất cả'}, colNew:{en:'New',vi:'Mới'}, colPublic:{en:'Public link',vi:'Link công khai'},
  colShare:{en:'Share',vi:'Chia sẻ'}, colRename:{en:'Rename',vi:'Đổi tên'}, colSaveName:{en:'Save',vi:'Lưu'},
  colDelete:{en:'Delete',vi:'Xoá'}, colDeleteArm:{en:'Tap again to delete',vi:'Bấm lần nữa để xoá'},
  colAdded:{en:'Added to {n}',vi:'Đã thêm vào {n}'}, colRemoved:{en:'Removed from {n}',vi:'Đã bỏ khỏi {n}'},
  colCreated:{en:'{n} created',vi:'Đã tạo {n}'}, colDeleted:{en:'Collection deleted',vi:'Đã xoá bộ sưu tập'},
  colPublicOn:{en:'Public link on',vi:'Đã bật link công khai'}, colPublicOff:{en:'Public link off',vi:'Đã tắt link công khai'},
  colKicker:{en:'Collection',vi:'Bộ sưu tập'}, colEmpty:{en:'Nothing in this collection yet',vi:'Bộ sưu tập chưa có sự kiện'},
  colMissing:{en:'This collection is private or gone',vi:'Bộ sưu tập này đã ẩn hoặc không còn'},
  faqEvent:{en:'Asked & answered',vi:'Hỏi & đáp'},
  resaleTitle:{en:'Resale',vi:'Pass vé'}, resaleCap:{en:'At most face value',vi:'Không quá giá gốc'},
  resaleNone:{en:'No tickets up right now',vi:'Chưa có vé pass'},
  resaleWatch:{en:'Tell me when one comes up',vi:'Báo tôi khi có vé'}, resaleWatching:{en:'We will tell you',vi:'Đang chờ báo'},
  resaleBuy:{en:'Buy',vi:'Mua'}, resaleMine:{en:'Yours',vi:'Vé của bạn'}, resaleLive:{en:'On now',vi:'Đang diễn ra'},
  resaleFee:{en:'+{p}% service fee',vi:'+{p}% phí dịch vụ'}, resaleFace:{en:'Face value {p}',vi:'Giá gốc {p}'},
  resaleSell:{en:'Pass on your ticket',vi:'Pass vé của bạn'},
  discTitle:{en:'Discussion',vi:'Thảo luận'}, discTop:{en:'Helpful',vi:'Hữu ích'}, discNew:{en:'Newest',vi:'Mới nhất'},
  discPh_qa:{en:'Ask the organiser and everyone…',vi:'Hỏi BTC và mọi người…'},
  discPh_talk:{en:'Say something…',vi:'Nói gì đó…'},
  discPh_crew:{en:'Where from, what time?',vi:'Bạn đi từ đâu, mấy giờ?'},
  discPh_trackid:{en:'Describe the track…',vi:'Tả đoạn nhạc…'},
  discPh_memory:{en:'How was the night?',vi:'Đêm đó thế nào?'},
  discPost:{en:'Post',vi:'Đăng'}, discReply:{en:'Reply',vi:'Trả lời'}, discReplyPh:{en:'Write a reply…',vi:'Viết trả lời…'},
  discHelpful:{en:'Helpful',vi:'Hữu ích'}, discReport:{en:'Report',vi:'Báo cáo'}, discDelete:{en:'Delete',vi:'Xoá'},
  discPin:{en:'Pin',vi:'Ghim'}, discUnpin:{en:'Unpin',vi:'Bỏ ghim'}, discHide:{en:'Hide',vi:'Ẩn'}, discShow:{en:'Show',vi:'Hiện lại'},
  discPinned:{en:'Pinned',vi:'Đã ghim'}, discOfficial:{en:'Organiser’s answer',vi:'BTC trả lời'}, discHidden:{en:'Hidden',vi:'Đang ẩn'},
  discRemoved:{en:'Deleted',vi:'Đã xoá'}, discMore:{en:'{n} more replies',vi:'Thêm {n} trả lời'},
  discEmpty:{en:'Nothing here yet',vi:'Chưa có bài nào'}, discClosed:{en:'Closed for new posts',vi:'Đang đóng'},
  discSignin:{en:'Sign in to post',vi:'Đăng nhập để đăng bài'}, discVerify:{en:'Confirm your phone to post',vi:'Xác thực SĐT để đăng bài'}, discAt:{en:'HH:MM',vi:'HH:MM'},
  discMember:{en:'FeestFinder member',vi:'Thành viên FeestFinder'}, discReported:{en:'Reported · thanks',vi:'Đã báo cáo · cảm ơn bạn'},
  ago0:{en:'just now',vi:'vừa xong'}, agoM:{en:'{n}m',vi:'{n} phút'}, agoH:{en:'{n}h',vi:'{n} giờ'}, agoD:{en:'{n}d',vi:'{n} ngày'},
  shareTitle:{en:'Share',vi:'Chia sẻ'}, shareCopy:{en:'Copy link',vi:'Copy link'}, shareMore:{en:'More',vi:'Khác'},
  shareCopiedZalo:{en:'Link copied — paste it into Zalo',vi:'Đã copy — dán vào Zalo'},
  shareBrought:{en:'Your links brought {n} people here',vi:'Link của bạn đã mang về {n} người'},
  ambTitle:{en:'Ambassadors',vi:'Đại sứ'}, ambVisits:{en:'{n} visits',vi:'{n} lượt xem'},
  submitTitle:{en:'Send in an event',vi:'Gửi sự kiện'}, submitNew:{en:'New',vi:'Gửi mới'}, submitMine:{en:'Sent',vi:'Đã gửi'},
  fTitle:{en:'Event name',vi:'Tên sự kiện'}, fGenre:{en:'Genre',vi:'Thể loại'}, fDate:{en:'Date',vi:'Ngày'},
  fStart:{en:'Starts',vi:'Bắt đầu'}, fEnd:{en:'Ends',vi:'Kết thúc'}, fVenue:{en:'Venue',vi:'Địa điểm'},
  fAddress:{en:'Address',vi:'Địa chỉ'}, fArea:{en:'Area',vi:'Khu vực'}, fEntry:{en:'Entry',vi:'Vào cửa'},
  fFree:{en:'Free',vi:'Miễn phí'}, fPaid:{en:'Ticketed',vi:'Có vé'}, fPrice:{en:'Lowest price (₫)',vi:'Giá thấp nhất (₫)'},
  fSource:{en:'Where you saw it',vi:'Link nguồn'}, fTicket:{en:'Ticket link',vi:'Link mua vé'},
  fLineup:{en:'Lineup',vi:'Đội hình'}, fLineupHint:{en:'Separate names with commas',vi:'Cách nhau bằng dấu phẩy'},
  fDesc:{en:'Description',vi:'Mô tả'}, fSend:{en:'Send for review',vi:'Gửi kiểm duyệt'},
  fAuto:{en:'Fill in for me',vi:'Điền giúp tôi'}, fAutoLink:{en:'Paste the event link',vi:'Dán link sự kiện'},
  fAutoGo:{en:'Fill in',vi:'Điền'}, fAutoPoster:{en:'Poster',vi:'Poster'}, fAutoDone:{en:'Filled in — check before sending',vi:'Đã điền — kiểm tra lại trước khi gửi'},
  fAutoBad:{en:'Paste a full link, starting with https://',vi:'Dán link đầy đủ, bắt đầu bằng https://'}, fCity:{en:'City',vi:'Thành phố'}, fEndDate:{en:'Last day',vi:'Ngày kết thúc'},
  fErrRequired:{en:'Fill in name, genre, date, times, venue and the source link',vi:'Điền tên, thể loại, ngày, giờ, địa điểm và link nguồn'},
  submitNone:{en:'Nothing sent yet',vi:'Chưa gửi sự kiện nào'},
  studioLink:{en:'Organiser? Open the studio',vi:'Bạn là BTC? Mở trang quản lý'},

  /* ---- the list of every event: a table or a grid ---- */
  listTitle:{en:'Every event',vi:'Tất cả sự kiện'}, listAll:{en:'All',vi:'Tất cả'}, listAllTime:{en:'Any time',vi:'Mọi lúc'},
  listTable:{en:'Table',vi:'Bảng'}, listGrid:{en:'Grid',vi:'Lưới'}, listMap:{en:'Map',vi:'Bản đồ'},
  mapSearch:{en:'Search this area',vi:'Tìm trong khu vực này'}, mapMore:{en:'{n} of {t} · zoom in',vi:'{n}/{t} · phóng to thêm'},
  mapEmpty:{en:'No events in this area',vi:'Không có sự kiện trong khu vực này'}, mapOpen:{en:'Open event',vi:'Mở sự kiện'},
  mapFailed:{en:'The map could not load',vi:'Không tải được bản đồ'}, mapClose:{en:'Close',vi:'Đóng'},
  artistKicker:{en:'Artist',vi:'Nghệ sĩ'}, artistUpcoming:{en:'Upcoming shows',vi:'Show sắp tới'}, artistPast:{en:'Played before',vi:'Đã diễn'},
  artistNone:{en:'No shows coming up',vi:'Chưa có show sắp tới'}, artistFollowers:{en:'followers',vi:'người theo dõi'}, artistShows:{en:'upcoming',vi:'sắp tới'},
  artistOpen:{en:'Artist page',vi:'Trang nghệ sĩ'},
  artistOrgs:{en:'Worked with',vi:'Đã hợp tác'}, artistVenues:{en:'Played at',vi:'Đã diễn tại'}, artistLineups:{en:'Shared lineups',vi:'Từng diễn chung'},
  artistSimilar:{en:'Similar artists',vi:'Nghệ sĩ tương tự'}, artistGear:{en:'Gear & software',vi:'Thiết bị & phần mềm'}, artistDates:{en:'Dates',vi:'Lịch'}, artistFree:{en:'Free',vi:'Rảnh'}, artistBusy:{en:'Busy',vi:'Bận'}, artistEdit:{en:'Edit profile',vi:'Chỉnh hồ sơ'}, artistBasedIn:{en:'Based in {c}',vi:'Hoạt động tại {c}'},
  artistSince:{en:'since {y}',vi:'từ {y}'}, artistEvents:{en:'{n} events',vi:'{n} sự kiện'}, artistVerified:{en:'Verified',vi:'Đã xác minh'},
  artistTravel:{en:'Travels: {t}',vi:'Đi diễn: {t}'},
  dirTitle:{en:'Artists',vi:'Nghệ sĩ'}, dirSearch:{en:'Search artists',vi:'Tìm nghệ sĩ'}, dirAll:{en:'All',vi:'Tất cả'},
  dirAvailable:{en:'Taking bookings',vi:'Nhận booking'}, dirUpcoming:{en:'Playing soon',vi:'Sắp diễn'}, dirEmpty:{en:'No artists match',vi:'Không có nghệ sĩ nào khớp'},
  dirMore:{en:'More artists',vi:'Xem thêm'}, dirCount:{en:'{n} artists',vi:'{n} nghệ sĩ'}, dirNext:{en:'Next: {t}',vi:'Sắp diễn: {t}'}, dirTab:{en:'Artists',vi:'Nghệ sĩ'},
  orgArtists:{en:'Artists worked with',vi:'Nghệ sĩ đã hợp tác'}, orgVenues:{en:'Venues',vi:'Địa điểm'}, orgOpen:{en:'Open for artist submissions',vi:'Nhận hồ sơ nghệ sĩ'},
  roleTitle:{en:'How do you use music?',vi:'Bạn đến với âm nhạc thế nào?'}, roleFan:{en:'Discover events',vi:'Khám phá sự kiện'}, roleFanSub:{en:'Music fan',vi:'Người yêu nhạc'},
  roleArtist:{en:'Perform music',vi:'Biểu diễn'}, roleArtistSub:{en:'DJ / Producer / Artist',vi:'DJ / Producer / Nghệ sĩ'},
  roleOrg:{en:'Organize events',vi:'Tổ chức sự kiện'}, roleOrgSub:{en:'Promoter / Venue / Festival',vi:'Đơn vị tổ chức / Địa điểm / Lễ hội'},
  roleLater:{en:'You can change this later.',vi:'Bạn có thể đổi lại sau.'}, roleStage:{en:'Stage name',vi:'Nghệ danh'}, roleOrgName:{en:'Organiser name',vi:'Tên nhà tổ chức'},
  roleCity:{en:'Based in',vi:'Thành phố'}, roleCreate:{en:'Create profile',vi:'Tạo hồ sơ'}, roleIsYou:{en:'Already listed? Claim it',vi:'Đã có trên FeestFinder? Nhận quản lý'},
  roleClaim:{en:'Claim',vi:'Nhận'}, roleClaimed:{en:'Managed',vi:'Đã có người quản lý'}, roleBack:{en:'Back',vi:'Quay lại'},
  roleWorkspaceArtist:{en:'Artist workspace',vi:'Khu nghệ sĩ'}, roleWorkspaceOrg:{en:'Organizer workspace',vi:'Khu nhà tổ chức'}, roleBecome:{en:'Artist or organiser?',vi:'Bạn là nghệ sĩ hay nhà tổ chức?'},
  rolePending:{en:'Claim waiting for review',vi:'Yêu cầu đang chờ duyệt'},
  listUpdated:{en:'Updated {t}',vi:'Cập nhật {t}'}, listNew:{en:'{n} new',vi:'{n} sự kiện mới'},
  listEmpty:{en:'Nothing matches',vi:'Không có sự kiện nào khớp'},
  colDate:{en:'Date',vi:'Ngày'}, colTime:{en:'Time',vi:'Giờ'}, colEvent:{en:'Event',vi:'Sự kiện'}, colVenue:{en:'Venue',vi:'Địa điểm'},
  colCity:{en:'City',vi:'Thành phố'}, colPrice:{en:'Price',vi:'Giá'}, colHype:{en:'Hype',vi:'Hype'}, colStatus:{en:'Status',vi:'Trạng thái'},
  stSold:{en:'Sold out',vi:'Hết vé'}, stTonight:{en:'Tonight',vi:'Tối nay'}, stFree:{en:'Free',vi:'Miễn phí'}, stOn:{en:'On sale',vi:'Còn vé'}
};

/** The cities FeestFinder lists events in, from GET /meta/discovery (four Vietnamese ones if it did not answer). */
const DISCOVERY = WEB.discovery || null;
const CITY_LIST = DISCOVERY ? DISCOVERY.cities.map(c => ({ k: c.slug, en: c.name.en, vi: c.name.vi, bbox: c.bbox, center: c.center, currency: c.currency })) : [
  { k:'ho-chi-minh', en:'Ho Chi Minh City', vi:'TP.HCM', bbox:[106.33,10.3,107.6,11.52] }, { k:'ha-noi', en:'Hanoi', vi:'Hà Nội', bbox:[105.28,20.56,106.02,21.39] },
  { k:'da-nang', en:'Da Nang', vi:'Đà Nẵng', bbox:[107.2,14.9,108.75,16.35] }, { k:'nha-trang', en:'Nha Trang', vi:'Nha Trang', bbox:[108.55,11.25,109.48,12.88] }
];
/** Music styles and kinds of night for the list's chips: the ones people filter by most. */
const STYLE_CHIPS = ['techno', 'hard-techno', 'house', 'trance', 'psytrance', 'drum-and-bass', 'hardstyle', 'bass', 'hip-hop'];
const TYPE_CHIPS = ['club', 'festival', 'concert'];
const STYLE_LABEL = {}, TYPE_LABEL = {};
/** /?role=artist or /?role=organizer opens the role picker on that step (the back office links there). */
const ROLE_ASKED = (() => { const q = FF.route && FF.route.query, v = q && q.get('role'); return v === 'artist' || v === 'organizer' ? v : null; })();
/** The icon each kind of link shows on an artist's or organiser's page. */
const LINK_ICON = { spotify:'ph-fill ph-spotify-logo', apple_music:'ph-fill ph-apple-logo', soundcloud:'ph-fill ph-soundcloud-logo', beatport:'ph-bold ph-waveform',
  bandcamp:'ph-bold ph-vinyl-record', youtube:'ph-fill ph-youtube-logo', youtube_music:'ph-fill ph-youtube-logo', instagram:'ph-fill ph-instagram-logo',
  tiktok:'ph-fill ph-tiktok-logo', facebook:'ph-fill ph-facebook-logo', x:'ph-fill ph-x-logo', website:'ph-bold ph-globe-simple' };
const BOOKING_FG = { available:'#0AE448', limited:'#FF8709', touring:'#ABFF84', unavailable:'#8C8B7D' };
((DISCOVERY && DISCOVERY.styles) || []).forEach(x => { STYLE_LABEL[x.key] = x.label; });
((DISCOVERY && DISCOVERY.eventTypes) || []).forEach(x => { TYPE_LABEL[x.key] = x.label; });
/** The box that holds every listed city, for a map with no city chosen. */
const ALL_BOUNDS = CITY_LIST.reduce((b, c) => [Math.min(b[0], c.bbox[0]), Math.min(b[1], c.bbox[1]), Math.max(b[2], c.bbox[2]), Math.max(b[3], c.bbox[3])], [180, 90, -180, -90]);

const DOW = { en:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], vi:['CN','T2','T3','T4','T5','T6','T7'] };
const MON = { en:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  vi:['Th1','Th2','Th3','Th4','Th5','Th6','Th7','Th8','Th9','Th10','Th11','Th12'] };
const MONTH_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
/** When the listings on screen were read from the API. */
const LOADED_AT = FF.now();
const GENRES = ['All','EDM','Festival','Rock','Indie','Hip-Hop','Pop','Jazz','Food','Culture'];

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
  google: { label:'Google', icon:'ph-bold ph-google-logo', color:'#FFFCE1' },
  wa: { label:'WhatsApp', icon:'ph-fill ph-whatsapp-logo', color:'#25D366' },
  fb: { label:'Facebook', icon:'ph-fill ph-facebook-logo', color:'#00BAE2' },
  ig: { label:'Instagram', icon:'ph-fill ph-instagram-logo', color:'#FEC5FB' },
  zalo: { label:'Zalo', icon:'ph-fill ph-chat-circle-dots', color:'#ABFF84' }
};
// The ways in this server offers (GET /auth/providers).
const WAYS = FF.data.ways || { google:true, email:true, password:true };
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
    dist: e.dist != null ? e.dist : e.lat != null ? Math.round(hav(USER.lat, USER.lng, e.lat, e.lng) * 10) / 10 : null });
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
 * /list             every event        /o/<slug>        an organiser
 * /about            about FeestFinder   /saved           saved events
 * /advertise        advertise with us  /stats/<key>     one explore stat
 * /e/<slug>?lang=en, /list?city=…&genre=…&time=…   an event in English; the list, filtered
 */
const eventBy = (key) => EVENTS.filter(e => e.slug === key || e.id === key)[0] || null;
const orgBy = (key) => { for (const id in ORGS) if (ORGS[id].slug === key || id === key) return ORGS[id]; return null; };
const slugOf = (id) => { const e = EVENTS.filter(x => x.id === id)[0]; return e ? (e.slug || e.id) : id; };

/** The screen a URL asks for, as a state patch. */
function routeState(r) {
  const clear = { screen:'explore', detailId:null, orgId:null, artistSlug:null, statView:null, savedView:false, colView:null, pubColSlug:null, adsOpen:false, notifOpen:false, edit:false };
  if (!r) return clear;
  const name = r.name, param = r.param;
  if (name === 'list' || name === 'map') {
    // A shared or redirected list keeps its filters: /list?city=ha-noi&genre=EDM&time=weekend&view=map
    const q = r.query, get = (k) => (q && q.get(k)) || '';
    const city = get('city'), genre = get('genre'), time = get('time'), view = get('view'), style = get('style'), type = get('type');
    const bbox = get('bbox').split(',').map(Number);
    return Object.assign(clear, { screen:'list' },
      CITY_LIST.some(c => c.k === city) ? { listCity: city } : {},
      GENRES.indexOf(genre) > 0 ? { listGenre: genre } : {},
      LIST_TIMES.indexOf(time) >= 0 ? { listTime: time } : {},
      ['grid', 'map'].indexOf(view) >= 0 || name === 'map' ? { listView: view || 'map' } : {},
      /^[a-z-]{2,30}$/.test(style) ? { listStyle: style } : {},
      /^[a-z]{2,20}$/.test(type) ? { listType: type } : {},
      bbox.length === 4 && bbox.every(n => Number.isFinite(n)) ? { mapBbox: bbox } : {});
  }
  if (name === 'about') return Object.assign(clear, { screen:'about' });
  if (name === 'saved') return Object.assign(clear, { savedView:true, colView: (r.query && r.query.get('c')) || null });
  if (name === 'c' && param) return Object.assign(clear, { pubColSlug: param });
  // /a is the artist directory; /a/style/<style> and /a/city/<city> are its curated pages.
  if (name === 'a' && !param) return Object.assign(clear, { screen:'artists', dirStyle:'', dirCity:'' });
  if (name === 'a' && (param === 'style' || param === 'city') && r.parts[2]) {
    return Object.assign(clear, { screen:'artists', dirStyle: param === 'style' ? r.parts[2] : '', dirCity: param === 'city' ? r.parts[2] : '' });
  }
  if (name === 'a' && param) return Object.assign(clear, { screen:'artist', artistSlug: param });
  if (name === 'advertise') return Object.assign(clear, { adsOpen:true });
  if (name === 'stats' && param) return Object.assign(clear, { screen:'stat', statView:param });
  if (name === 'e' && param) { const e = eventBy(param); if (e) return Object.assign(clear, { screen:'detail', detailId:e.id }); }
  if (name === 'o' && param) { const o = orgBy(param); if (o) return Object.assign(clear, { screen:'org', orgId:o.id }); }
  return clear;
}

/**
 * The language a page opens in: Vietnamese, unless the address says ?lang=en or the viewer
 * picked English before on this device. Event and organiser pages carry ?lang=en in their
 * address when in English, so each language has one address that search engines index.
 */
const LANG_KEY = 'ff_lang';
function firstLang() {
  const r = FF.route, q = r && r.query ? r.query.get('lang') : null;
  if (q === 'vi' || q === 'en') return q;
  try { const saved = localStorage.getItem(LANG_KEY); if (saved === 'vi' || saved === 'en') return saved; } catch (e) { /* storage blocked: the default stands */ }
  return 'vi';
}


const LIST_TIMES = ['tonight', 'weekend', '7days', 'month'];

/** The list's filters as the API and the address both write them. */
function listQuery(st) {
  return [st.listCity !== 'all' ? 'city=' + st.listCity : '', st.listGenre !== 'All' ? 'genre=' + encodeURIComponent(st.listGenre) : '',
    st.listTime !== 'all' ? 'time=' + st.listTime : '', st.listStyle ? 'style=' + st.listStyle : '', st.listType ? 'type=' + st.listType : ''].filter(Boolean).join('&');
}

/** The URL for what is on screen. */
function routePath(st) {
  if (st.screen === 'detail' && st.detailId) return FF.href('e', slugOf(st.detailId)) + (st.lang === 'en' ? '?lang=en' : '');
  if (st.screen === 'org' && st.orgId) return FF.href('o', (ORGS[st.orgId] || {}).slug || st.orgId) + (st.lang === 'en' ? '?lang=en' : '');
  if (st.screen === 'artist' && st.artistSlug) return FF.href('a', st.artistSlug) + (st.lang === 'en' ? '?lang=en' : '');
  if (st.screen === 'artists') {
    // One style or one city alone has a page of its own; anything more is the directory's state.
    const only = !st.dirRole && !st.dirAvail && !st.dirSoon && !st.dirQ;
    const path = only && st.dirStyle && !st.dirCity ? FF.href('a', 'style', st.dirStyle) : only && st.dirCity && !st.dirStyle ? FF.href('a', 'city', st.dirCity) : FF.href('a');
    return path + (st.lang === 'en' ? '?lang=en' : '');
  }
  if (st.screen === 'stat' && st.statView) return FF.href('stats', st.statView);
  if (st.screen === 'list') {
    const q = [listQuery(st), st.listView !== 'table' ? 'view=' + st.listView : '',
      st.listView === 'map' && st.mapBbox ? 'bbox=' + st.mapBbox.join(',') : ''].filter(Boolean).join('&');
    return FF.href('list') + (q ? '?' + q : '');
  }
  if (st.screen === 'about') return FF.href('about');
  if (st.adsOpen) return FF.href('advertise');
  if (st.pubColSlug) return FF.href('c', st.pubColSlug) + (st.lang === 'en' ? '?lang=en' : '');
  if (st.savedView) return FF.href('saved') + (st.colView ? '?c=' + st.colView : '');
  return FF.href('');
}

class Component extends DCLogic {
  state = {
    lang: firstLang(),
    screen: 'explore',
    time:'weekend', genre:'All', prices:{}, sort:'date', q:'', limit:6,
    saved: WEB.saved || {}, mapSel: null, loading:true, toast:null,
    user: WEB.user || null, details:{}, pPhotoFile:null,
    edit:false, pName:'', pEmail:'', pZalo:'', pCity:'', pPhoto:'', pErr:'',
    going: WEB.going || {}, friendsOnly:false, friendSheet:null, chatWith:null, chats:{}, chatDraft:'',
    invite:null, inviteSel:{}, following: WEB.following || {}, tipHidden:false,
    plan:{}, ttDay:0,
    reportFor:null, reportCode:'wrong', reportNote:'',
    notifOpen:false,
    notifM: WEB.notifM || { saved:{ push:true, zalo:true, email:false }, tickets:{ push:true, zalo:false, email:false },
      artists:{ push:true, zalo:false, email:true }, friends:{ push:false, zalo:true, email:false },
      weekly:{ push:false, zalo:false, email:true } },
    detailId:null, orgId:null, statView:null,
    adsOpen:false, adBrand:'', adCat:'F&B', adEmail:'', adBudget:'50–150tr₫',
    adPlaces:{ feed:true, banner:true }, adMsg:'', adErr:'',
    adHidden:{},
    collections: WEB.collections || [], colPick:null, colPickList:null, colName:'', colBusy:false, colView:null, colItems:{}, colEdit:null, colArm:null,
    pubCol:null, pubColSlug:null, shareWhat:null, shareVideo:null,
    acct:false, savedView:false, auth:null, authMode:'signup', authMethod:'email', authId:'', authOtp:'',
    authPass:'', authPass2:'', authErr:'', authNote:'', authNext:null, authShowPass:false,
    // The event page's community: discussion, resale, hype, sharing, and sending events in.
    disc:null, discKind:null, discSort:'top', discDraft:'', discSet:'', discHeard:'', discReplyTo:null, discReplyDraft:'', discMore:{}, discBusy:false,
    resale:null, hyped:{}, shareOpen:false, photos:null, discPhoto:null, discPhotoUrl:'', claimOpen:false, claimNote:'', claimProof:'', claimBusy:false,
    artistSlug:null, artists:{},
    // The role picker: asked once of a new account, and from the account menu.
    rolePick: WEB.user && ROLE_ASKED ? ROLE_ASKED : WEB.user && WEB.user.onboarded === false ? 'menu' : null, rpName:'', rpCity:'', rpRoles:{ dj:true }, rpType:'promoter',
    rpSug:null, rpBusy:false, rpErr:'', rpClash:null,
    dirQ:'', dirRole:'', dirStyle:'', dirCity:'', dirAvail:false, dirSoon:false, dirItems:[], dirTotal:0, dirNext:null, dirBusy:false, dirKey:null,
    listView:'table', listCity:'all', listTime:'all', listGenre:'All', listStyle:'', listType:'', listSort:'date', listDesc:false, listAt: LOADED_AT, listAdded:0,
    // The list as the API answered for these filters (null until it has), and the map's events in view.
    board:null, boardTotal:0, boardCursor:null, boardFacets:null, boardBusy:false,
    mapItems:[], mapTotal:0, mapTruncated:false, mapDirty:false, mapBusy:false, mapBbox:null, mapReady:false, mapFailed:false,
    submitOpen:false, submitTab:'new', submitForm:{ genre:'EDM', entry:'paid', city:'ho-chi-minh' }, submitErr:'', submitBusy:false, prefillBusy:false, prefillErr:'', submissions:null
  };

  componentDidMount() {
    document.documentElement.lang = this.state.lang;
    this._t = setTimeout(() => this.setState({ loading:false }), 800);
    const back = FF.data.oauth;
    FF.data.oauth = null;
    if (back) this.oauthBack(back);
    ADS.slice(0, 1).forEach(a => FF.fire(FF.post('/ads/' + a.id + '/impression')));
    const r = FF.route;
    this.setState(routeState(r));
    this.openRoute(r);
    FF.onRoute = (x) => { this.setState(routeState(x)); this.openRoute(x); };
  }

  componentWillUnmount() { clearTimeout(this._t); clearTimeout(this._tt); clearInterval(this._lt); this.dropMap(); }

  /** Cards from the API join the events this page knows, so any of them can open. */
  remember(cards) {
    const out = [];
    cards.forEach(c => {
      ORG_OF[c.id] = c.organizer.id;
      if (!ORGS[c.organizer.id]) ORGS[c.organizer.id] = { id: c.organizer.id, slug: c.organizer.slug, name: c.organizer.name, initials: c.organizer.initials,
        verified: c.organizer.verified, art: c.organizer.art || c.art, followers: 0, since: '', bio: { en:'', vi:'' } };
      const e = toEvent(FF.webEvent(c)), i = EVENTS.findIndex(x => x.id === e.id);
      if (i >= 0) EVENTS[i] = e; else EVENTS.push(e);
      out.push(e);
    });
    return out;
  }

  /** The list for the chosen filters, from the API: a page at a time, so every city fits. */
  loadBoard(more) {
    const st = this.state, key = listQuery(st);
    const cursor = more && st.boardCursor ? '&cursor=' + encodeURIComponent(st.boardCursor) : '';
    this._boardKey = key;
    this.setState({ boardBusy:true });
    return FF.get('/events?' + (key ? key + '&' : '') + (st.listTime === 'all' ? 'time=all&' : '') + 'upcoming=true&limit=60' + cursor).then(out => {
      if (this._boardKey !== key) return;
      const rows = this.remember(out.items);
      const known = {}; (this.state.board || []).forEach(e => { known[e.id] = true; });
      this.setState(s => ({
        board: more ? (s.board || []).concat(rows) : rows, boardTotal: out.total, boardCursor: out.nextCursor, boardFacets: out.facets.city || null, boardBusy:false,
        listAt: FF.now(), listAdded: more || !s.board ? s.listAdded : rows.filter(e => !known[e.id]).length,
      }));
    }, () => this.setState({ boardBusy:false }));
  }

  /** The list re-reads what is on every minute while it is on screen. */
  syncList(on) {
    clearInterval(this._lt);
    this._lt = null;
    if (!on) return;
    this._lt = setInterval(() => { if (!this.state.boardCursor || (this.state.board || []).length <= 60) this.loadBoard(false); }, 60000);
  }

  // ---- the map view: MapLibre, asked for events only when it opens or on "search this area" ----

  /** Opens, keeps or closes the map with the view. */
  syncMap() {
    const st = this.state, want = st.screen === 'list' && st.listView === 'map';
    const el = want && typeof document !== 'undefined' ? document.getElementById('ff-map') : null;
    if (!el) { this.dropMap(); return; }
    // The map's filters are the list's, without the city: the box is the place.
    const key = listQuery(Object.assign({}, st, { listCity: 'all' }));
    if (this._mapEl === el) {
      if (this._map && this._mapCity !== st.listCity) { this._mapCity = st.listCity; this._mapKey = key; this._map.fit(this.cityBox(st.listCity)); }
      else if (this._map && this._mapKey !== key) { this._mapKey = key; this._map.refresh(); }
      return;
    }
    this.dropMap();
    this._mapEl = el;
    this._mapCity = st.listCity;
    this._mapKey = key;
    const g = st.lang;
    FF.loadMap().then(FFMap => {
      if (this._mapEl !== el) return;
      this._map = FFMap.session(el, {
        bounds: st.mapBbox || this.cityBox(st.listCity),
        hue: (genre) => FF.genreHue(genre),
        cities: CITY_LIST.filter(c => c.center).map(c => ({ name: c[g], center: c.center })),
        fetch: (bbox) => {
          const q = listQuery(Object.assign({}, this.state, { listCity: 'all' }));
          return FF.get('/events/map?bbox=' + bbox.join(',') + (q ? '&' + q : '') + '&limit=500');
        },
        onChange: (m) => this.setState({ mapReady: m.ready, mapBusy: m.busy, mapDirty: m.dirty, mapItems: m.items, mapTotal: m.total,
          mapTruncated: m.truncated, mapSel: m.sel, mapBbox: m.bbox }),
      });
    }, () => this.setState({ mapFailed:true }));
  }

  dropMap() {
    if (this._map) { try { this._map.destroy(); } catch (e) { /* already gone with its element */ } }
    this._map = null;
    this._mapEl = null;
  }

  cityBox(slug) { const city = CITY_LIST.find(c => c.k === slug); return city ? city.bbox : ALL_BOUNDS; }

  mapSearch() { if (this._map) this._map.search(); }

  /** Opens an event from the map, reading it first when this page has not seen it yet. */
  openFromMap(id) {
    if (EVENTS.some(e => e.id === id)) return this.openEvent(id);
    FF.get('/events/' + id).then(d => { this.remember([d]); this.openEvent(id); }, e => this.say(FF.errorText(e, this.state.lang)));
  }

  componentDidUpdate(prev) {
    // The runtime passes no previous state: whether the timer runs says if the list was open.
    if ((this.state.screen === 'list') !== !!this._lt) this.syncList(this.state.screen === 'list');
    // The list asks the API whenever its filters change, and the map follows the view.
    if (this.state.screen === 'list' && this._boardKey !== listQuery(this.state)) this.loadBoard(false);
    this.syncMap();
    // Filters and the language change the query, not the page: they replace the history entry.
    const path = routePath(this.state);
    FF.navigate(path, { replace: path.split('?')[0] === location.pathname });
    if (document.documentElement.lang !== this.state.lang) document.documentElement.lang = this.state.lang;
    if (prev.language !== this.props.language) {
      this.setState({ lang: this.props.language === 'Tiếng Việt' ? 'vi' : 'en' });
    }
  }

  /** The viewer's language: kept on this device, and in the address of pages that have an English version. */
  setLang(lang) {
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* storage blocked: it lasts this visit */ }
    this.setState({ lang });
  }

  validId(v, method) {
    const s = (v || '').trim();
    if (method === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
    return /^(0|\+84)\d{8,10}$/.test(s.replace(/[\s.-]/g, ''));
  }
  openAuth(mode, next, note, err) {
    this.setState({
      auth:'method', authMode: mode, authMethod:'email', authBusy:false,
      authId:'', authOtp:'', authPass:'', authPass2:'', authErr: err || '', authShowPass:false,
      authNote: note || '', authNext: next || null, acct:false
    });
  }
  authBack() {
    const s = this.state.auth;
    if (s === 'id' || s === 'loginId') return this.setState({ auth:'method', authErr:'' });
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
    return { user: d.user, saved: d.saved, going: d.going, following: d.following, notifM: d.notifM || this.state.notifM, collections: d.collections || [] };
  }
  async finishAuth() {
    const st = this.state, L = this.L();
    this.setState(Object.assign(await this.reloadWeb(), {
      auth:null, authErr:'', authOtp:'', authPass:'', authPass2:'', authNote:'', authNext:null, authBusy:false
    }));
    this.say(st.authMode === 'login' ? L.loggedInToast : L.welcomeToast);
    this.afterAuth(st.authNext);
    if (this.state.user && this.state.user.onboarded === false) this.setState({ rolePick:'menu' });
    // Signed in on an event page: its discussion now knows who is reading.
    if (this.state.detailId) { this.loadDiscussion(this.state.detailId); this.loadDetail(this.state.detailId); }
  }
  /** What the visitor was doing when sign-in got in the way. */
  afterAuth(next) {
    if (!next) return;
    if (next.indexOf('save:') === 0) {
      const id = next.slice(5);
      FF.fire(FF.put('/me/saves/' + id));
      this.setState(s => ({ saved: Object.assign({}, s.saved, { [id]: true }) }));
    }
    if (next === 'ads') this.setState({ adsOpen:true });
    if (next === 'organizer') setTimeout(() => { window.location.href = '/organizer'; }, 500);
    if (next === 'submit') { this.setState({ submitOpen:true, submitTab:'new', submitErr:'' }); this.loadSubmissions(); }
  }
  /** Back from Google, Facebook or Instagram: the API has already signed in or linked. */
  oauthBack(r) {
    const L = this.L();
    if (r.error) {
      const text = FF.oauthErrorText(r.error, this.state.lang);
      return this.state.user ? this.say(text) : this.openAuth('signup', r.next, '', text);
    }
    if (r.via === 'connect') return this.say(L.connectedToast + ' · ' + (SRC[r.provider] || SRC.google).label);
    this.say(r.via === 'signup' ? L.welcomeToast : L.loggedInToast);
    this.afterAuth(r.next);
  }

  readPhoto(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    this.setState({ pPhoto: URL.createObjectURL(f), pPhotoFile: f });
  }

  socialLogin(src) {
    if (this.state.authBusy) return;
    this.setState({ authBusy:true, authErr:'' });
    FF.oauthStart(src, this.state.authNext).catch((e) => this.authFail(e));
  }
  startConnect(src) {
    if (src === 'google' || src === 'fb' || src === 'ig') return FF.fire(FF.oauthStart(src), (e) => this.say(FF.errorText(e, this.state.lang)));
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
    const after = this._afterPhone;
    this._afterPhone = null;
    if (after) after();
    if (this.state.detailId) this.loadDiscussion(this.state.detailId);
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
    // Arrived on someone's share link: credit them, once.
    const q = FF.route && FF.route.query, ref = q && q.get('ref'), ch = q && q.get('ch');
    if (ref && !this._refSent) {
      this._refSent = true;
      FF.fire(FF.post('/events/' + id + '/track', { type:'view', source:'shared', ref: ref, channel: ch || 'copy' }));
    } else {
      FF.fire(FF.post('/events/' + id + '/track', { type:'view', source:'feed' }));
    }
    if (this._discFor !== id) { this._discFor = id; this.setState({ disc:null, discKind:null, discMore:{}, discReplyTo:null, resale:null, photos:null, discPhoto:null, discPhotoUrl:'' }); }
    this.loadDiscussion(id);
    this.loadResale(id);
    this.loadPhotos(id);
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
  /** One tab of the event's discussion; asked again when the tab or the order changes. */
  loadDiscussion(id, patch) {
    const st = Object.assign({}, this.state, patch || {});
    const key = id + '|' + (st.discKind || '') + '|' + st.discSort;
    this._discKey = key;
    const qs = 'sort=' + st.discSort + (st.discKind ? '&kind=' + st.discKind : '');
    FF.get('/events/' + id + '/discussion?' + qs).then(d => {
      if (this._discKey !== key) return;
      this.setState({ disc: d, discKind: d.kind, discMore:{} });
    }, e => console.warn('[ff] discussion', e));
  }
  loadPhotos(id) {
    FF.get('/events/' + id + '/photos').then(r => { if (this.state.detailId === id) this.setState({ photos: r.items }); }, e => console.warn('[ff] photos', e));
  }
  /** An organiser asks the moderators to move a community event to their account. */
  sendClaim() {
    const st = this.state, L = this.L(), id = st.detailId, note = st.claimNote.trim(), proof = st.claimProof.trim();
    if (note.length < 10) return this.say(L.claimShort);
    const body = { note };
    if (proof) body.proofUrl = /^https?:\/\//.test(proof) ? proof : 'https://' + proof;
    this.setState({ claimBusy:true });
    FF.post('/events/' + id + '/claims', body).then(out => {
      this.setState({ claimBusy:false, claimOpen:false, claimNote:'', claimProof:'' });
      this.say(FF.text(out.message, st.lang));
      this.loadDetail(id);
    }, e => { this.setState({ claimBusy:false }); this.say(FF.errorText(e, st.lang)); });
  }
  loadResale(id) {
    FF.get('/events/' + id + '/resale').then(r => { if (this.state.detailId === id) this.setState({ resale: r }); }, e => console.warn('[ff] resale', e));
  }
  /** Writing needs a phone number proven by a code: open the Zalo step, then carry on. */
  needPhone(after) {
    this._afterPhone = after;
    this.startConnect('zalo');
  }
  /** Runs a write; signs in or proves the phone first when the API asks for it. */
  write(run, retry) {
    const L = this.L();
    if (!this.state.user) { this.openAuth('signup', null, L.discSignin); return Promise.reject(new Error('signin')); }
    return run().catch(e => {
      const code = e && e.code;
      if (code === 'phone_unverified') this.needPhone(retry || (() => this.write(run).catch(() => {})));
      else this.say(FF.errorText(e, this.state.lang));
      throw e;
    });
  }
  postToDiscussion(parentId) {
    const st = this.state, L = this.L(), id = st.detailId;
    const body = (parentId ? st.discReplyDraft : st.discDraft).trim();
    if (!id || !body || st.discBusy) return;
    const payload = parentId ? { parentId, body } : { kind: st.discKind, body };
    if (!parentId && st.discKind === 'trackid') {
      if (st.discSet) payload.setId = st.discSet;
      if (/^([01]\d|2[0-3]):[0-5]\d$/.test(st.discHeard)) payload.heardAt = st.discHeard;
    }
    this.setState({ discBusy:true });
    const photo = !parentId && st.discPhoto && (st.discKind === 'memory' || st.discKind === 'talk') ? st.discPhoto : null;
    const send = async () => {
      if (photo) { const form = new FormData(); form.append('file', photo); payload.photoUrl = (await FF.api('POST', '/uploads?purpose=recap', form)).url; }
      return FF.post('/events/' + id + '/posts', payload);
    };
    this.write(send, () => this.postToDiscussion(parentId)).then(out => {
      if (st.discPhotoUrl) URL.revokeObjectURL(st.discPhotoUrl);
      this.setState(parentId ? { discReplyDraft:'', discReplyTo:null, discBusy:false } : { discDraft:'', discHeard:'', discBusy:false, discPhoto:null, discPhotoUrl:'' });
      this.say(FF.text(out.message, st.lang) || L.discPost);
      this.loadDiscussion(id);
      this.loadDetail(id);
      if (photo) this.loadPhotos(id);
    }, () => this.setState({ discBusy:false }));
  }
  /** More replies to one thread than the first three. */
  loadReplies(postId) {
    FF.get('/posts/' + postId + '/replies').then(r => {
      const m = Object.assign({}, this.state.discMore); m[postId] = r.items;
      this.setState({ discMore: m });
    }, e => this.say(FF.errorText(e, this.state.lang)));
  }
  toggleHype(id) {
    const st = this.state, L = this.L();
    if (!st.user) return this.openAuth('signup', null, L.gateSave);
    const det = st.details[id];
    const was = id in st.hyped ? st.hyped[id] : !!(det && det.viewer && det.viewer.hyped);
    const h = Object.assign({}, st.hyped); h[id] = !was;
    this.setState({ hyped: h });
    (was ? FF.del('/me/hypes/' + id) : FF.put('/me/hypes/' + id)).then(() => {
      if (!was) this.say(L.hypeToast);
      this.loadDetail(id);
    }, e => { const b = Object.assign({}, this.state.hyped); b[id] = was; this.setState({ hyped: b }); this.say(FF.errorText(e, st.lang)); });
  }
  /** The bindings for collections: the picker, the chips and actions on Saved, a public one's header. */
  collectionVals(st, L) {
    const pick = st.colPick, creating = pick === 'new';
    const active = st.savedView && st.colView ? st.collections.find(c => c.id === st.colView) : null;
    const pc = st.pubColSlug && st.pubCol && st.pubCol.slug === st.pubColSlug ? st.pubCol : null;
    const chip = (on) => ({ bg: on ? '#ABFF84' : 'transparent', bd: on ? '#ABFF84' : 'rgba(255,252,225,.19)', fg: on ? '#141514' : '#E6E3C8' });
    const savedN = Object.keys(st.saved).filter(k => st.saved[k]).length;
    return {
      colPickOpen: !!pick,
      colPickTitle: creating ? L.colNewTitle : L.colPickTitle,
      colPickLoading: !!pick && !st.colPickList,
      colPickRows: (st.colPickList || []).map(c => ({
        name: c.name, count: String(c.count),
        icon: creating ? 'ph-bold ph-folder-simple' : c.has ? 'ph-fill ph-check-circle' : 'ph-bold ph-circle',
        iconColor: !creating && c.has ? '#ABFF84' : '#8C8B7D',
        pubIcon: c.isPublic ? 'ph-bold ph-globe-hemisphere-west' : 'ph-bold ph-lock-simple',
        go: creating ? () => this.openCol(c.id) : () => this.toggleCollect(c)
      })),
      colName: st.colName,
      onColName: (e) => this.setState({ colName: e.target.value }),
      onColKey: (e) => { if (e.key === 'Enter') this.createCollection(); },
      colCreate: () => this.createCollection(),
      colCreateBg: st.colName.trim() ? '#ABFF84' : 'rgba(171,255,132,.25)',
      colPickClose: () => this.setState({ colPick:null, colPickList:null, colName:'' }),

      colChipsShow: st.savedView && !!st.user,
      colChips: [{ id:null, name: L.colAll, count: savedN }].concat(st.collections.map(c => ({ id: c.id, name: c.name, count: c.count, pub: c.isPublic })))
        .map(c => Object.assign({ name: c.name, count: String(c.count), lock: c.id && !c.pub, go: () => (c.id ? this.openCol(c.id) : this.setState({ colView:null, colEdit:null, colArm:null })) }, chip((st.colView || null) === c.id))),
      colNewChip: () => this.openCollect('new'),
      colActive: !!active,
      colActiveName: active ? active.name : '',
      colActiveLine: active ? active.count + ' ' + L.events : '',
      colPublicOn: !!(active && active.isPublic),
      colPublicTrack: active && active.isPublic ? '#0AE448' : 'rgba(255,252,225,.19)',
      colPublicKnob: active && active.isPublic ? '18px' : '2px',
      colPublicToggle: () => active && this.patchCol(active, { isPublic: !active.isPublic }, active.isPublic ? L.colPublicOff : L.colPublicOn),
      colShareGo: () => active && active.url && this.shareCollection({ name: active.name, url: active.url, ids: st.colItems[active.id] || [] }),
      colEditing: !!(active && st.colEdit && st.colEdit.id === active.id),
      colNotEditing: !(active && st.colEdit && st.colEdit.id === active.id),
      colEditName: st.colEdit ? st.colEdit.name : '',
      colRenameGo: () => active && this.setState({ colEdit: { id: active.id, name: active.name }, colArm:null }),
      onColEdit: (e) => this.setState({ colEdit: Object.assign({}, st.colEdit, { name: e.target.value }) }),
      onColEditKey: (e) => { if (e.key === 'Enter' && st.colEdit && st.colEdit.name.trim()) this.patchCol(active, { name: st.colEdit.name.trim() }); },
      colEditSave: () => { if (active && st.colEdit && st.colEdit.name.trim()) this.patchCol(active, { name: st.colEdit.name.trim() }); },
      colDeleteGo: () => active && this.deleteCol(active),
      colDeleteLabel: active && st.colArm === active.id ? L.colDeleteArm : L.colDelete,
      colDeleteFg: active && st.colArm === active.id ? '#FF8709' : '#A5A493',
      colEmptyShow: !!(active && st.colItems[active.id] && !st.colItems[active.id].length),

      pubColShow: !!st.pubColSlug,
      headlineShow: !st.pubColSlug,
      pubColName: pc ? (pc.missing ? L.colMissing : pc.name) : '',
      pubColLine: pc && !pc.missing ? [L.colKicker, pc.owner, pc.ids.length + ' ' + L.events].filter(Boolean).join(' · ') : '',
      pubColCanShare: !!(pc && !pc.missing),
      pubColShare: () => pc && !pc.missing && this.shareCollection(pc)
    };
  }
  /** What the share sheet shares: the open event, or a collection. */
  shareTarget() {
    const st = this.state, L = this.L(), w = st.shareWhat;
    if (w && w.kind === 'collection') {
      const evs = (w.ids || []).map(id => EVENTS.find(e => e.id === id)).filter(Boolean);
      return { kind:'collection', title: w.name, text: w.name + ' · ' + evs.length + ' ' + L.events, url: w.url,
        file: 'feestfinder-' + (w.url.split('/c/')[1] || 'collection'),
        story: { genre: (evs[0] && evs[0].genre) || 'All', kicker: L.colKicker + ' · ' + evs.length + ' ' + L.events, title: w.name,
          lines: evs.slice(0, 3).map(e => e.title + ' · ' + this.when(e)), url: w.url.replace(/^https?:\/\//, '') } };
    }
    const e = EVENTS.find(x => x.id === st.detailId);
    if (!e) return null;
    const det = st.details[e.id] || {};
    const kicker = e.genre + (det.hype && det.hype.count ? ' · ' + det.hype.count.toLocaleString(st.lang === 'vi' ? 'vi-VN' : 'en-US') + ' hype' : '');
    const price = e.price === 0 ? L.free : L.from + ' ' + this.short(e.price, e.currency);
    return { kind:'event', id: e.id, title: e.title, text: e.title + ' · ' + this.when(e), url: location.origin + FF.href('e', e.slug || e.id),
      file: e.slug || 'feestfinder',
      story: { genre: e.genre, kicker, title: e.title, lines: [this.when(e), e.venue + (e.area ? ' · ' + e.area : ''), price], url: location.host + '/e/' + (e.slug || e.id) } };
  }
  /** An event's link is tagged with who shared it and where; then it goes to the place picked. */
  share(channel) {
    const L = this.L(), w = this.shareTarget();
    if (!w) return;
    if (channel === 'instagram') return this.shareStory(w, channel);
    if (channel === 'tiktok') return this.shareVideo(w);
    const go = (url) => {
      const u = encodeURIComponent(url), t = encodeURIComponent(w.text);
      const copy = (msg) => { if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => this.say(msg), () => this.say(url)); else this.say(url); };
      const open = (href) => window.open(href, '_blank', 'noopener');
      if (channel === 'facebook') return open('https://www.facebook.com/sharer/sharer.php?u=' + u);
      if (channel === 'threads') return open('https://www.threads.net/intent/post?text=' + encodeURIComponent(w.text + ' ' + url));
      if (channel === 'x') return open('https://x.com/intent/post?text=' + t + '&url=' + u);
      if (channel === 'telegram') return open('https://t.me/share/url?url=' + u + '&text=' + t);
      // Messenger and Zalo open their apps from a phone; on a computer the link is copied to paste in.
      if (channel === 'messenger' && FF.isPhone()) { window.location.href = 'fb-messenger://share/?link=' + u; return; }
      if ((channel === 'native' || channel === 'zalo') && navigator.share) return navigator.share({ title: w.title, text: w.text, url }).catch(() => {});
      return copy(channel === 'zalo' ? L.shareCopiedZalo : channel === 'messenger' ? L.shareCopiedMessenger : L.shareCopied);
    };
    if (w.kind !== 'event') return go(w.url);
    FF.post('/events/' + w.id + '/shares', { channel }).then(out => go(out.url), () => go(w.url));
  }
  /** The vertical story picture, straight to the share sheet while the tap still counts. */
  shareStory(w, channel) {
    const st = this.state, L = this.L();
    if (w.kind === 'event') FF.fire(FF.post('/events/' + w.id + '/shares', { channel }));
    FF.shareStory(w.story, w.file).then(how => { if (how === 'saved') this.say(L.storySaved); }, err => this.say(FF.errorText(err, st.lang)));
  }
  /**
   * A short vertical clip for TikTok. Recording takes a few seconds, longer than a phone
   * lets a tap open the share sheet, so the sheet offers it with a fresh tap once ready;
   * a computer saves it.
   */
  async shareVideo(w) {
    const L = this.L();
    if (this.state.shareVideo && this.state.shareVideo.making) return;
    if (w.kind === 'event') FF.fire(FF.post('/events/' + w.id + '/shares', { channel:'tiktok' }));
    this.setState({ shareVideo: { making:true } });
    let blob = null;
    try { blob = await FF.storyVideo(w.story); } catch (e) { blob = null; }
    if (!blob) {
      this.setState({ shareVideo:null });
      this.say(L.videoNone);
      return FF.shareStory(w.story, w.file).then(how => { if (how === 'saved') this.say(L.storySaved); }, () => {});
    }
    const file = new File([blob], w.file + (blob.type === 'video/mp4' ? '.mp4' : '.webm'), { type: blob.type });
    if (FF.canShareFile(file)) return this.setState({ shareVideo: { file, title: w.title } });
    this.setState({ shareVideo:null });
    await FF.shareFile(file, w.title);
    this.say(L.videoSaved);
  }

  // ---- collections ------------------------------------------------------------------

  /** My collections, each saying whether it holds `eventId`. */
  async loadCollections(eventId) {
    const out = await FF.maybe(FF.get('/me/collections' + (eventId ? '?event=' + eventId : '')), null);
    if (!out) return null;
    this.setState({ collections: out.items });
    return out.items;
  }
  /** The picker for one event, or with `id` 'new' just the form for a new collection. */
  openCollect(id) {
    const L = this.L();
    if (!this.state.user) return this.openAuth('signup', id === 'new' ? null : 'save:' + id, L.gateCollect);
    this.setState({ colPick: id, colPickList: id === 'new' ? this.state.collections : null, colName: '' });
    if (id !== 'new') this.loadCollections(id).then(items => { if (items && this.state.colPick === id) this.setState({ colPickList: items }); });
  }
  dropColItems(id) { this.setState(s => { const ci = Object.assign({}, s.colItems); delete ci[id]; return { colItems: ci }; }); }
  async toggleCollect(c) {
    const st = this.state, L = this.L(), id = st.colPick;
    if (!id || id === 'new' || st.colBusy) return;
    const on = !c.has;
    this.setState({ colBusy:true, colPickList: (st.colPickList || []).map(x => x.id === c.id ? Object.assign({}, x, { has:on, count: x.count + (on ? 1 : -1) }) : x) });
    try {
      if (on) await FF.put('/me/collections/' + c.id + '/events/' + id); else await FF.del('/me/collections/' + c.id + '/events/' + id);
      if (on) this.setState(s => ({ saved: Object.assign({}, s.saved, { [id]: true }) }));
      this.dropColItems(c.id);
      this.say(L[on ? 'colAdded' : 'colRemoved'].replace('{n}', c.name));
      this.loadCollections();
    } catch (e) {
      this.say(FF.errorText(e, st.lang));
      this.loadCollections(id).then(items => { if (items) this.setState({ colPickList: items }); });
    }
    this.setState({ colBusy:false });
  }
  async createCollection() {
    const st = this.state, L = this.L(), name = st.colName.trim(), eventId = st.colPick && st.colPick !== 'new' ? st.colPick : null;
    if (!name || st.colBusy) return;
    this.setState({ colBusy:true });
    try {
      const c = await FF.post('/me/collections', eventId ? { name, eventId } : { name });
      if (eventId) this.setState(s => ({ saved: Object.assign({}, s.saved, { [eventId]: true }) }));
      this.setState({ colName:'', colPickList: [c].concat(st.colPickList || []) });
      this.say(eventId ? L.colAdded.replace('{n}', c.name) : L.colCreated.replace('{n}', c.name));
      await this.loadCollections();
      if (!eventId) this.openCol(c.id);
    } catch (e) { this.say(FF.errorText(e, st.lang)); }
    this.setState({ colBusy:false });
  }
  /** One of my collections, on the Saved page. */
  openCol(id) {
    this.setState({ screen:'explore', savedView:true, colView:id, colPick:null, colPickList:null, colEdit:null, colArm:null, pubColSlug:null, limit:6, loading:false });
    if (id) this.loadCol(id);
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  }
  async loadCol(id) {
    const out = await FF.maybe(FF.get('/me/collections/' + id), null);
    if (!out) return this.setState({ colView:null });
    out.items.forEach(c => { if (!EVENTS.some(x => x.id === c.id)) EVENTS.push(toEvent(FF.webEvent(c))); });
    this.setState(s => ({ colItems: Object.assign({}, s.colItems, { [id]: out.items.map(c => c.id) }), collections: s.collections.map(x => x.id === id ? out.collection : x) }));
  }
  async patchCol(c, body, msg) {
    try {
      const out = await FF.patch('/me/collections/' + c.id, body);
      this.setState(s => ({ collections: s.collections.map(x => x.id === c.id ? out : x), colEdit:null }));
      if (msg) this.say(msg);
      return out;
    } catch (e) { this.say(FF.errorText(e, this.state.lang)); return null; }
  }
  async deleteCol(c) {
    const L = this.L();
    if (this.state.colArm !== c.id) { this.setState({ colArm: c.id }); return this.say(L.colDeleteArm); }
    try {
      await FF.del('/me/collections/' + c.id);
      this.setState(s => ({ collections: s.collections.filter(x => x.id !== c.id), colView:null, colArm:null }));
      this.say(L.colDeleted);
    } catch (e) { this.say(FF.errorText(e, this.state.lang)); }
  }
  /** Someone's public collection, at /c/<slug>. */
  async loadPubCol(slug) {
    const out = await FF.maybe(FF.get('/collections/' + encodeURIComponent(slug)), null);
    if (!out) return this.setState({ pubCol: { slug, missing:true, ids:[] } });
    out.items.forEach(c => { if (!EVENTS.some(x => x.id === c.id)) EVENTS.push(toEvent(FF.webEvent(c))); });
    this.setState({ pubCol: { slug, name: out.name, url: out.url, owner: out.owner.name, mine: out.mine, ids: out.items.map(c => c.id) } });
  }
  shareCollection(c) { this.setState({ shareOpen:true, shareWhat: { kind:'collection', name: c.name, url: c.url, ids: c.ids || [] }, shareVideo:null }); }
  /** Send in an event for the moderators to check. */
  sendSubmission() {
    const st = this.state, L = this.L(), f = st.submitForm;
    const need = [f.title, f.genre, f.date, f.start, f.end, f.venue, f.source];
    if (need.some(x => !x || !String(x).trim())) return this.setState({ submitErr: L.fErrRequired });
    const body = {
      title: f.title.trim(), genre: f.genre, description: (f.desc || '').trim(),
      startsOn: f.date, startTime: f.start, endTime: f.end, city: f.city || 'ho-chi-minh',
      venueName: f.venue.trim(), address: (f.address || '').trim(), area: (f.area || '').trim(),
      entryMode: f.entry, priceFrom: f.entry === 'paid' ? Math.max(0, parseInt(String(f.price || '0').replace(/\D/g, ''), 10) || 0) : 0,
      sourceUrl: f.source.trim(), lineup: (f.lineup || '').split(',').map(x => x.trim()).filter(Boolean)
    };
    if (f.ticket && f.ticket.trim()) body.ticketUrl = f.ticket.trim();
    if (f.endDate && f.endDate > f.date) body.endsOn = f.endDate;
    this.setState({ submitBusy:true, submitErr:'' });
    this.write(() => FF.post('/community/events', body), () => this.sendSubmission()).then(out => {
      this.setState({ submitBusy:false, submitForm:{ genre:'EDM', entry:'paid', city:'ho-chi-minh' }, submitTab:'mine', submissions:null });
      this.say(FF.text(out.message, st.lang));
      this.loadSubmissions();
    }, e => this.setState({ submitBusy:false, submitErr: e && e.code && e.code !== 'phone_unverified' ? FF.errorText(e, st.lang) : '' }));
  }
  /** Let the server read a link or a poster and fill the form; the person checks it before sending. */
  prefill(file) {
    const st = this.state, L = this.L(), link = (st.submitForm.auto || '').trim();
    if (!file && !/^https?:\/\/\S+\.\S+/.test(link)) return this.setState({ prefillErr: L.fAutoBad });
    if (!st.user) return this.openAuth('signup', null, L.gateOrganizer);
    let call;
    if (file) { const form = new FormData(); form.append('file', file); call = () => FF.api('POST', '/community/prefill/poster', form); }
    else call = () => FF.post('/community/prefill', { url: link });
    this.setState({ prefillBusy:true, prefillErr:'' });
    call().then(out => {
      const x = out.fields, f = Object.assign({}, this.state.submitForm), put = (k, v) => { if (v != null && v !== '') f[k] = String(v); };
      put('title', x.title); put('date', x.startsOn); put('endDate', x.endsOn); put('start', x.startTime); put('end', x.endTime);
      put('venue', x.venueName); put('address', x.address); put('area', x.area); put('desc', x.description); put('ticket', x.ticketUrl);
      if (x.genre && GENRES.indexOf(x.genre) > 0) f.genre = x.genre;
      if (x.city) f.city = x.city;
      if (x.entryMode) f.entry = x.entryMode;
      if (x.priceFrom) f.price = String(x.priceFrom);
      if (x.lineup && x.lineup.length) f.lineup = x.lineup.join(', ');
      if (!f.source) f.source = out.sourceUrl || (file ? '' : link);
      this.setState({ prefillBusy:false, submitForm: f });
      this.say(L.fAutoDone);
    }, e => {
      this.setState({ prefillBusy:false, prefillErr: e && e.code === 'phone_unverified' ? '' : FF.errorText(e, st.lang) });
      if (e && e.code === 'phone_unverified') this.needPhone(() => this.prefill(file));
    });
  }
  loadSubmissions() {
    if (!this.state.user) return;
    FF.get('/me/submissions').then(r => this.setState({ submissions: r.items }), e => console.warn('[ff] submissions', e));
  }
  ago(ts) {
    const L = this.L(), m = Math.max(0, Math.round((FF.now().getTime() - new Date(ts).getTime()) / 60000));
    if (m < 1) return L.ago0;
    if (m < 60) return L.agoM.replace('{n}', String(m));
    if (m < 60 * 24) return L.agoH.replace('{n}', String(Math.round(m / 60)));
    return L.agoD.replace('{n}', String(Math.round(m / 1440)));
  }

  loadOrg(id) {
    const o = ORGS[id];
    if (!o || !o.slug) return;
    FF.get('/organizers/' + o.slug).then(prof => {
      Object.assign(o, { bio: prof.bio, verified: prof.verified, followers: prof.stats.followers, since: String(prof.stats.since),
        net: { typeLabel: prof.typeLabel, markets: prof.markets || [], styles: prof.styles || [], open: !!prof.openForSubmissions, links: prof.links || [],
          website: prof.website, artists: prof.artists || [], venues: prof.venues || [] } });
      prof.upcoming.concat(prof.past).forEach(c => { ORG_OF[c.id] = id; if (!EVENTS.some(x => x.id === c.id)) EVENTS.push(toEvent(FF.webEvent(c))); });
      const fo = Object.assign({}, this.state.following);
      if (prof.me) fo['org:' + id] = prof.me.following;
      this.setState({ following: fo });
    }, e => console.warn('[ff] organiser', e));
  }
  fGoing(id) { return FRIENDS.filter(f => f.going.indexOf(id) >= 0); }
  fInterested(id) { return FRIENDS.filter(f => f.interested.indexOf(id) >= 0); }
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

  L() {
    const g = this.state.lang, o = {};
    for (const k in S) o[k] = S[k][g];
    // Dated copy follows the clock, not the day the design was drawn.
    const today = FF.vnDate(FF.now()).split('-'), m = +today[1];
    o.kicker = g === 'vi' ? 'TP. Hồ Chí Minh · Tháng ' + m + '/' + today[0] : 'Ho Chi Minh City · ' + MONTH_EN[m - 1] + ' ' + today[0];
    return o;
  }
  say(m) { clearTimeout(this._tt); this.setState({ toast:m }); this._tt = setTimeout(() => this.setState({ toast:null }), 2000); }
  refilter(p) { clearTimeout(this._t); this.setState(Object.assign({ loading:true, limit:6, savedView:false, colView:null, pubColSlug:null }, p)); this._t = setTimeout(() => this.setState({ loading:false }), 380); }
  short(n, currency) {
    if (currency && currency !== 'VND') return FF.money(n, currency, this.state.lang);
    return n >= 1000000 ? (n / 1000000).toFixed(n % 1000000 ? 1 : 0) + 'tr₫' : Math.round(n / 1000) + 'K₫';
  }
  when(e) {
    const g = this.state.lang;
    if (+e.dsD === +e.deD) return DOW[g][e.dsD.getDay()] + ', ' + e.dsD.getDate() + ' ' + MON[g][e.dsD.getMonth()] + ' · ' + e.time;
    return DOW[g][e.dsD.getDay()] + ' ' + e.dsD.getDate() + ' – ' + DOW[g][e.deD.getDay()] + ' ' + e.deD.getDate() + ' ' + MON[g][e.deD.getMonth()] + ' · ' + e.time;
  }
  short0(n) { return n >= 1000 ? (Math.round(n / 100) / 10).toFixed(1).replace('.0', '') + 'K' : String(n); }
  /** Fetch what a route needs the first time it is asked for. */
  async openRoute(r) {
    if (!r) return;
    if (r.query && r.query.get('role') === 'artist-on' && this.state.user) this.turnArtistBackOn();
    if (r.name === 'e' && r.param) { const e = eventBy(r.param); if (e) this.loadDetail(e.id); }
    if (r.name === 'o' && r.param) { const o = orgBy(r.param); if (o) this.loadOrg(o.id); }
    if (r.name === 'c' && r.param) this.loadPubCol(r.param);
    if (r.name === 'a' && (!r.param || ((r.param === 'style' || r.param === 'city') && r.parts[2]))) this.loadDirectory();
    else if (r.name === 'a' && r.param) this.loadArtist(r.param);
    if (r.name === 'saved' && r.query && r.query.get('c')) this.loadCol(r.query.get('c'));
  }

  openEvent(id) { this.setState({ screen:'detail', detailId:id, ttDay:0 }); this.loadDetail(id); if (typeof window !== 'undefined') window.scrollTo(0, 0); }
  openOrg(id) { this.setState({ screen:'org', orgId:id }); this.loadOrg(id); if (typeof window !== 'undefined') window.scrollTo(0, 0); }
  /** Back from the back office asking to turn the artist persona back on. */
  turnArtistBackOn() {
    FF.put('/me/roles/artist').then(() => { window.location.href = '/ops/artist'; }, e => this.say(FF.errorText(e, this.state.lang)));
  }
  /** The role picker's answers. Fans just carry on; artists and organisers land in their workspace. */
  rolePickFan() {
    FF.fire(FF.post('/me/onboarding'));
    this.setState(s => ({ rolePick:null, user: s.user ? Object.assign({}, s.user, { onboarded:true }) : s.user }));
  }
  rolePickSuggest(text) {
    clearTimeout(this._rs);
    if (text.trim().length < 2) return this.setState({ rpSug:null });
    this._rs = setTimeout(() => {
      FF.get('/me/roles/suggestions?q=' + encodeURIComponent(text.trim())).then(out => { if (this.state.rpName === text) this.setState({ rpSug: out }); }, () => {});
    }, 250);
  }
  async rolePickCreate() {
    const st = this.state, L = this.L();
    if (st.rpName.trim().length < 2 || st.rpBusy) return;
    this.setState({ rpBusy:true, rpErr:'', rpClash:null });
    try {
      if (st.rolePick === 'artist') {
        const roles = Object.keys(st.rpRoles).filter(k => st.rpRoles[k]);
        await FF.post('/me/roles/artist', { stageName: st.rpName.trim(), roles, basedCity: st.rpCity || null });
        window.location.href = '/ops/artist';
      } else {
        await FF.post('/me/roles/organizer', { name: st.rpName.trim(), type: st.rpType, city: st.rpCity || null });
        window.location.href = '/ops/org';
      }
    } catch (e) {
      // A name already listed comes back with that profile, to claim instead.
      this.setState({ rpBusy:false, rpErr: FF.errorText(e, st.lang), rpClash: e && e.details && e.details.id ? e.details : null });
    }
  }
  async rolePickClaim(id) {
    const st = this.state;
    if (st.rpBusy) return;
    this.setState({ rpBusy:true, rpErr:'' });
    try {
      const out = await FF.post(st.rolePick === 'artist' ? '/me/roles/artist' : '/me/roles/organizer', st.rolePick === 'artist' ? { claimArtistId: id } : { claimOrganizerId: id });
      FF.fire(FF.post('/me/onboarding'));
      this.setState(s => ({ rolePick:null, rpBusy:false, user: s.user ? Object.assign({}, s.user, { onboarded:true, roles: out.roles }) : s.user }));
      this.say(FF.text(out.message, st.lang));
    } catch (e) { this.setState({ rpBusy:false, rpErr: FF.errorText(e, st.lang) }); }
  }
  openDirectory(patch) {
    this.setState(Object.assign({ screen:'artists' }, patch || {}), () => this.loadDirectory());
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  }
  /** The directory under the filters on screen; `more` adds the next page. */
  loadDirectory(more) {
    const st = this.state;
    const q = [st.dirQ ? 'q=' + encodeURIComponent(st.dirQ) : '', st.dirRole ? 'role=' + st.dirRole : '', st.dirStyle ? 'style=' + st.dirStyle : '',
      st.dirCity ? 'city=' + st.dirCity : '', st.dirAvail ? 'booking=available,limited' : '', st.dirSoon ? 'upcoming=1' : ''].filter(Boolean).join('&');
    const offset = more && st.dirNext ? st.dirNext : 0;
    if (!more && this._dirKey === q && st.dirItems.length) return;
    this._dirKey = q;
    this.setState({ dirBusy:true });
    FF.get('/artists?limit=24&offset=' + offset + (q ? '&' + q : '')).then(out => {
      if (this._dirKey !== q) return;
      this.setState(s => ({ dirItems: more ? s.dirItems.concat(out.items) : out.items, dirTotal: out.total, dirNext: out.nextOffset, dirBusy:false }));
    }, e => { this.setState({ dirBusy:false }); this.say(FF.errorText(e, this.state.lang)); });
  }
  setDir(patch) { this.setState(patch, () => this.loadDirectory()); }

  /**
   * A ticket button. Everything goes through /go/<event>, which counts the press and sends it
   * on: to FeestFinder's checkout when one of its tiers is on sale (same tab), otherwise to the
   * seller's page (a new tab, with the partner's tracking when there is one). A free night opens
   * the map. No sign-in for leaving to a seller: that is the seller's to ask.
   */
  buyTickets(e, det, src, tierId) {
    const g = this.state.lang;
    if (e.past) return this.say(g === 'vi' ? 'Sự kiện đã kết thúc' : 'This event has ended');
    if (e.price === 0) {
      const q = e.lat != null && e.lng != null ? e.lat + ',' + e.lng : [e.venue, e.area, (CITY_LIST.find(c => c.k === e.city) || {}).en].filter(Boolean).join(', ');
      window.open('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q), '_blank', 'noopener');
      return this.say(g === 'vi' ? 'Mở Google Maps…' : 'Opening Google Maps…');
    }
    if (e.soldOut) return this.say(g === 'vi' ? 'Đêm này đã hết vé' : 'This date is sold out');
    const go = '/go/' + encodeURIComponent(e.slug || e.id) + '?src=' + src + (tierId ? '&tier=' + encodeURIComponent(tierId) : '');
    if (det) {
      const open = det.tickets && det.tickets.tiers.some(t => t.state === 'onsale' || t.state === 'last');
      if (open) { window.location.href = go; return; }
      if (!det.links || !det.links.go) return this.say(g === 'vi' ? 'Nhà tổ chức chưa đăng link bán vé' : 'The organiser has not posted a ticket link yet');
    }
    window.open(go, '_blank', 'noopener');
    const host = det && det.links && det.links.tickets ? String(det.links.tickets).replace(/^https?:\/\/(www\.)?/, '').split('/')[0] : '';
    this.say((g === 'vi' ? 'Đang mở trang bán vé' : 'Opening the ticket page') + (host ? ' · ' + host : ''));
  }
  openArtist(slug) { this.setState({ screen:'artist', artistSlug:slug }); this.loadArtist(slug); if (typeof window !== 'undefined') window.scrollTo(0, 0); }
  /** An artist's page: their shows join the events this page knows. */
  loadArtist(slug) {
    FF.get('/artists/' + encodeURIComponent(slug)).then(out => {
      const up = this.remember(out.upcoming);
      this.setState(s => ({ artists: Object.assign({}, s.artists, { [slug]: Object.assign({}, out.artist, { upcomingIds: up.map(e => e.id), past: out.past, rel: out.relationships || {}, gear: out.gear || [], availability: out.availability || [] }) }) }));
    }, e => this.say(FF.errorText(e, this.state.lang)));
  }
  openStat(k) { this.setState({ screen:'stat', statView:k }); if (typeof window !== 'undefined') window.scrollTo(0, 0); }
  openOnMap(id) { this.openEvent(id); }
  goBack() { this.setState({ screen:'explore' }); if (typeof window !== 'undefined') window.scrollTo(0, 0); }
  priceOk(e) {
    const p = this.state.prices, keys = Object.keys(p).filter(k => p[k]);
    if (!keys.length) return true;
    return keys.some(k => k === 'free' ? e.price === 0 : k === 'under' ? e.price > 0 && e.price < 500000 : e.price >= 500000);
  }
  list() {
    const st = this.state, q = st.q.trim().toLowerCase();
    const byIds = (ids) => (ids || []).map(id => EVENTS.find(e => e.id === id)).filter(Boolean);
    if (st.pubColSlug) return st.pubCol && st.pubCol.slug === st.pubColSlug ? byIds(st.pubCol.ids) : [];
    if (st.savedView && st.colView) return byIds(st.colItems[st.colView]);
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
      cardBd: e.featured ? 'rgba(10,228,72,.4)' : 'rgba(255,252,225,.19)',
      hasBadge: !!e.badge && !un, badgeLabel: e.badge ? e.badge[st.lang] : '',
      badgeBg: e.featured ? '#0AE448' : '#ABFF84',
      unavailable: un, unavailLabel: e.soldOut ? L.soldOut : L.ended,
      unavailBd: e.soldOut ? '#FF8709' : 'rgba(255,252,225,.38)', unavailFg: e.soldOut ? '#FF8709' : '#A5A493',
      whenLine: this.when(e), whereLine: e.venue + (e.dist != null ? ' · ' + e.dist + ' km' : e.area ? ' · ' + e.area : ''),
      priceLine: e.price === 0 ? L.free : L.from + ' ' + this.short(e.price, e.currency),
      priceColor: e.price === 0 ? '#0AE448' : '#FFFCE1',
      proofShow: this.proof(e.id).show, proofLine: this.proof(e.id).line, proofFaces: this.proof(e.id).faces,
      hypeShort: e.hype >= 1000 ? (e.hype / 1000).toFixed(1) + 'K' : String(e.hype),
      saveBg: st.saved[e.id] ? '#ABFF84' : 'rgba(14,16,15,.6)',
      saveBd: st.saved[e.id] ? '#ABFF84' : 'rgba(255,252,225,.2)',
      saveFg: st.saved[e.id] ? '#141514' : '#FFFCE1',
      open: () => this.openEvent(e.id),
      save: (ev) => { ev.stopPropagation(); if (!st.user) return this.openAuth('signup', 'save:' + e.id, L.gateSave); this.toggleFlag('saved', '/me/saves/', e.id); }
    };
  }

  renderVals() {
    const st = this.state, L = this.L(), g = st.lang, vi1 = g === 'vi';
    FF.lang = g;
    const full = this.list(), grid = full.slice(0, st.limit);
    const heroEv = full.find(e => e.featured && !e.past && !e.soldOut) || full[0];
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
    const tabDefs = [{ k:'explore', label:L.tabExplore }, { k:'list', label:L.tabMap }, { k:'artists', label:L.dirTab }, { k:'about', label:L.tabAbout }];

    const step = st.auth, isLogin = st.authMode === 'login';
    const idStep = step === 'id' || step === 'loginId', passStep = step === 'pass' || step === 'loginPass';
    const authTitles = { method: isLogin ? L.loginTitle : L.joinTitle, id: st.authMethod === 'email' ? L.idTitleEmail : st.authMethod === 'wa' ? L.idTitleWa : L.idTitleZalo,
      otp:L.otpTitle, pass:L.passTitle, loginId:L.loginTitle, loginPass:L.loginPassTitle };
    const authSubs = { method:'', id:L.idSub,
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

    return {
      L,

      signedIn: !!st.user, signedOut: !st.user,
      userInitial: st.user ? (st.user.handle.trim().charAt(0) || '?').toUpperCase() : '',
      userVia: st.user ? (st.user.method === 'google' ? L.viaGoogle : st.user.social ? (g === 'vi' ? 'Liên kết với ' : 'Connected with ') + SRC[st.user.social].label : st.user.method === 'email' ? L.viaEmail : st.user.method === 'wa' ? L.viaWa : L.viaZalo) : '',
      savedCount: String(Object.keys(st.saved).filter(k => st.saved[k]).length),
      acctOpen: st.acct, toggleAcct: () => this.setState({ acct: !st.acct }),
      savedView: st.savedView,
      savedLine: Object.keys(st.saved).filter(k => st.saved[k]).length + ' ' + L.events,
      ...this.collectionVals(st, L),
      openSaved: () => {
        const n = Object.keys(st.saved).filter(k => st.saved[k]).length;
        if (!n) { this.setState({ acct:false }); this.say(L.savedNone); return; }
        this.setState({ acct:false, screen:'explore', savedView:true, limit:6, loading:false });
      },
      exitSaved: () => this.refilter({}),
      userName: st.user ? (st.user.name || st.user.handle) : '',
      editOpen: st.edit,
      hasPhoto: !!(st.user && st.user.photo), noPhoto: !(st.user && st.user.photo),
      photoBg: st.user && st.user.photo ? 'url("' + st.user.photo + '") center/cover no-repeat' : 'rgba(28,29,27,.7)',
      pPhotoBg: st.pPhoto ? 'url("' + st.pPhoto + '") center/cover no-repeat' : 'rgba(28,29,27,.7)', pHasPhoto: !!st.pPhoto, pNoPhoto: !st.pPhoto,
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
      authTitle: authTitles[step] || '', authSub: authSubs[step] || '', authSubShow: !!authSubs[step], authCta: authCtas[step] || '',
      authStepMethod: step === 'method', authStepIdAny: idStep, authStepOtp: step === 'otp',
      authStepPassAny: passStep, authStepPass: step === 'pass', authStepLoginPass: step === 'loginPass',
      authFormShow: !!step && step !== 'method',
      authSwitchShow: step === 'method' && WAYS.password !== false,
      authNote: st.authNote, authNoteShow: !!st.authNote,
      authBarShow: barStep > 0,
      authBar1: barStep >= 1 ? '#0AE448' : 'rgba(255,252,225,.19)',
      authBar2: barStep >= 2 ? '#0AE448' : 'rgba(255,252,225,.19)',
      authBar3: barStep >= 3 ? '#0AE448' : 'rgba(255,252,225,.19)',
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
        bd: st.authOtp.length === i ? '#ABFF84' : st.authOtp[i] ? 'rgba(255,252,225,.45)' : 'rgba(255,252,225,.19)'
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
      authBackIcon: step !== 'method' ? 'ph-bold ph-arrow-left' : 'ph-bold ph-x',
      pickEmail: () => this.setState({ auth:'id', authMethod:'email', authId:'', authErr:'' }),
      authResend: () => this.say(L.otpResent),
      authForgot: () => this.say(L.forgotToast),
      authSwitchQ: '',
      authSwitchLabel: L.withPassword,
      authSwitch: () => this.setState({ auth:'loginId', authMode:'login', authMethod:'email', authId:'', authPass:'', authErr:'' }),

      // Google is the way in; the social networks a visitor can link come after it.
      authGoogleShow: !!WAYS.google,
      authGoogle: () => this.socialLogin('google'),
      authEmailShow: !WAYS.google && !!WAYS.email,
      authOrShow: !!WAYS.google && ['fb','ig','zalo','wa'].some(k => WAYS[k]),
      socialBtns: ['fb','ig','zalo','wa'].filter(k => WAYS[k]).map(k => ({
        label: L.socialWith + ' ' + SRC[k].label, icon: SRC[k].icon, color: SRC[k].color,
        go: k === 'zalo' || k === 'wa'
          ? () => this.setState({ auth:'id', authMethod:k, authId:'', authErr:'', authOtp:'' })
          : () => this.socialLogin(k)
      })),
      cxOpen: !!st.cx,
      cxSrcLabel: st.cx ? SRC[st.cx.src].label : '',
      cxIcon: st.cx ? SRC[st.cx.src].icon : 'ph-fill ph-link',
      cxColor: st.cx ? SRC[st.cx.src].color : '#ABFF84',
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
        return { ch: o[i] || '', bd: o.length === i ? '#ABFF84' : o[i] ? 'rgba(255,252,225,.45)' : 'rgba(255,252,225,.19)' };
      }),
      cxScopes: [
        { icon:'ph-fill ph-user-circle', t:L.cxScope1 },
        { icon:'ph-fill ph-users-three', t:L.cxScope2 },
        { icon:'ph-fill ph-shield-check', t:L.cxScope3 }
      ],
      cxErr: st.cx ? st.cx.err : '', cxErrShow: !!(st.cx && st.cx.err),
      cxSubmit: () => this.cxStep(),
      cxClose: () => this.setState({ cx:null }),
      connectRows: ['google','fb','ig','zalo','wa'].map(k => {
        const on = !!st.user && (st.user.socials || (st.user.social ? [st.user.social] : [])).indexOf(k) >= 0;
        return (on || WAYS[k]) && {
          label: SRC[k].label, icon: SRC[k].icon, color: SRC[k].color,
          state: on ? L.connectedToast : L.connect,
          stateColor: on ? '#0AE448' : '#ABFF84',
          go: () => this.connectSocial(k)
        };
      }).filter(Boolean),
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
      fsColor: fSel ? fSel.color : 'linear-gradient(135deg,#ABFF84,#0AE448)',
      fsIcon: fSel ? SRC[fSel.src].icon : '', fsIconColor: fSel ? SRC[fSel.src].color : '#A5A493',
      fsSrcLabel: fSel ? SRC[fSel.src].label : '',
      fsMutual: fSel ? (fSel.going.length + fSel.interested.length) + ' ' + L.mutual : '',
      fsFollowLabel: fSel && st.following[fSel.id] ? L.followingLabel : L.follow,
      fsFollowBd: fSel && st.following[fSel.id] ? '#0AE448' : 'rgba(255,252,225,.19)',
      fsFollowFg: fSel && st.following[fSel.id] ? '#DFFFD1' : '#A5A493',
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
      chatColor: chatF ? chatF.color : 'linear-gradient(135deg,#ABFF84,#0AE448)',
      chatSrc: chatF ? SRC[chatF.src].label : '',
      chatEmpty: chatLog.length === 0,
      chatMsgs: chatLog.map(m => ({
        text: m.t, align: m.me ? 'flex-end' : 'flex-start',
        bg: m.me ? '#ABFF84' : 'rgba(28,29,27,.85)', fg: m.me ? '#141514' : '#FFFCE1',
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
      closeInvite: () => this.setState({ invite:null, inviteSel:{} }),
      inviteList: FRIENDS.map(f => ({
        name:f.name, initials: initialsOf(f.name), color:f.color,
        icon: SRC[f.src].icon, iconColor: SRC[f.src].color,
        bd: st.inviteSel[f.id] ? '#ABFF84' : 'rgba(255,252,225,.19)',
        tickBg: st.inviteSel[f.id] ? '#ABFF84' : 'transparent',
        tickBd: st.inviteSel[f.id] ? '#ABFF84' : 'rgba(255,252,225,.38)',
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
      langTabs: [{ k:'vi', label:'VI', name:'Tiếng Việt' }, { k:'en', label:'EN', name:'English' }].map(x => ({
        label: x.label, name: x.name, code: x.k, on: g === x.k,
        bg: g === x.k ? 'rgba(255,252,225,.14)' : 'transparent', fg: g === x.k ? '#FFFCE1' : '#8C8B7D',
        go: () => this.setLang(x.k)
      })),
      isExplore: st.screen === 'explore', isList: st.screen === 'list',
      isDetail: st.screen === 'detail', isOrg: st.screen === 'org', isArtist: st.screen === 'artist', isArtists: st.screen === 'artists',
      isStat: st.screen === 'stat', isAbout: st.screen === 'about',
      /* ---- advertising ---- */
      openAds: () => st.user ? this.setState({ adsOpen:true, adErr:'' }) : this.openAuth('signup', 'ads', L.gateAds),
      // Anyone can send an event in; it goes live once a moderator has checked it.
      goOrganizer: () => {
        if (!st.user) return this.openAuth('signup', 'submit', L.gateOrganizer);
        this.setState({ submitOpen:true, submitTab:'new', submitErr:'' });
        this.loadSubmissions();
      },
      goStudio: () => { window.location.href = '/ops/org'; },
      closeAds: () => this.setState({ adsOpen:false }),
      adsOpen: st.adsOpen,
      adBrand: st.adBrand, setAdBrand: (e) => this.setState({ adBrand: e.target.value }),
      adEmail: st.adEmail, setAdEmail: (e) => this.setState({ adEmail: e.target.value }),
      adMsg: st.adMsg, setAdMsg: (e) => this.setState({ adMsg: e.target.value }),
      adCats: [
        { k:'F&B', label:L.adCatFB, icon:'ph-bold ph-coffee' },
        { k:'Fashion', label:L.adCatFashion, icon:'ph-bold ph-t-shirt' },
        { k:'Healthcare', label:L.adCatHealth, icon:'ph-bold ph-heartbeat' }
      ].map(c => {
        const on = st.adCat === c.k;
        return { label:c.label, icon:c.icon,
          bg: on ? 'rgba(171,255,132,.14)' : 'rgba(14,16,15,.6)', bd: on ? '#ABFF84' : 'rgba(255,252,225,.19)',
          fg: on ? '#FFFCE1' : '#E6E3C8',
          pick: () => this.setState({ adCat:c.k }) };
      }),
      adBudgets: ['Dưới 50tr₫','50–150tr₫','150–400tr₫','400tr₫+'].map(b => {
        const on = st.adBudget === b;
        return { label:b,
          bg: on ? 'rgba(171,255,132,.14)' : 'rgba(14,16,15,.6)', bd: on ? '#ABFF84' : 'rgba(255,252,225,.19)',
          fg: on ? '#FFFCE1' : '#E6E3C8',
          pick: () => this.setState({ adBudget:b }) };
      }),
      adPlaces: [
        { k:'feed', label:L.adPlaceFeed }, { k:'banner', label:L.adPlaceBanner },
        { k:'live', label:L.adPlaceLive }
      ].map(p => {
        const on = !!st.adPlaces[p.k];
        return { label:p.label,
          icon: on ? 'ph-fill ph-check-square' : 'ph-bold ph-square',
          color: on ? '#ABFF84' : '#8C8B7D',
          fg: on ? '#FFFCE1' : '#E6E3C8',
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
            const link = det && (det.artistLinks || []).find(x => x.name === a);
            return { name:a,
              hint: on ? (vi1 ? 'Bỏ theo dõi ' + a : 'Unfollow ' + a) : (vi1 ? 'Theo dõi ' + a : 'Follow ' + a),
              bg: on ? 'rgba(171,255,132,.12)' : 'rgba(14,16,15,.6)',
              bd: on ? '#ABFF84' : 'rgba(255,252,225,.32)',
              fg: on ? '#FFFCE1' : '#E6E3C8',
              icon: on ? 'ph-fill ph-bell-ringing' : 'ph-bold ph-plus',
              iconFg: on ? '#FFFCE1' : '#8C8B7D',
              follow: () => {
                if (!st.user) return this.openAuth('signup', null, L.gateSave);
                this.toggleFollow('art', a);
                this.say((on ? L.unfollowedToast : L.followedToast).replace('{n}', a));
              },
              hasPage: !!link, pageLabel: L.artistOpen + ' · ' + a,
              open: (ev) => { if (ev) ev.stopPropagation(); if (link) this.openArtist(link.slug); } };
          }),
          followingAny: e.lineup.some(a => !!st.following['art:' + a]),
          followingLine: L.followingArtists.replace('{n}', String(e.lineup.filter(a => !!st.following['art:' + a]).length)),
          facts: [
            { label:L.factDate, value: DOW[g][e.dsD.getDay()] + ', ' + e.dsD.getDate() + ' ' + MON[g][e.dsD.getMonth()] + ' ' + e.dsD.getFullYear(), icon:'ph-bold ph-calendar-dots' },
            { label:L.factDoors, value:e.time, icon:'ph-bold ph-clock' },
            { label:L.factVenue, value:e.venue, icon:'ph-bold ph-map-pin' },
            { label:L.factDist, value: (e.dist != null ? e.dist + ' km · ' : '') + e.area, icon:'ph-bold ph-navigation-arrow' },
            { label:L.factPrice, value: isFree ? L.free : this.short(e.price, e.currency) + ' ' + (g === 'vi' ? 'trở lên' : 'and up'), icon:'ph-bold ph-ticket' },
            { label:L.factAge, value: det ? (det.age === 'All ages' ? (g === 'vi' ? 'Mọi lứa tuổi' : 'All ages') : det.age) : (isFree ? (g === 'vi' ? 'Mọi lứa tuổi' : 'All ages') : '18+'), icon:'ph-bold ph-user-circle' }
          ].concat(det && det.confidence && det.confidence.sourcesLine ? [{
            // Where the event was confirmed, when more than one place says so.
            label: L.factSources, icon:'ph-fill ph-seal-check',
            value: det.confidence.sourcesLine[g] + ((det.sources || []).some(x => x.host) ? ' · ' + det.sources.filter(x => x.host).slice(0, 3).map(x => x.host).join(', ') : '')
          }] : []),
          priceBig: isFree ? L.free : this.short(e.price, e.currency),
          priceColor: isFree ? '#0AE448' : '#FFFCE1',
          priceSub: isFree ? (g === 'vi' ? 'Không cần vé' : 'No ticket needed') : (g === 'vi' ? 'Giá thấp nhất, chưa gồm phí cổng' : 'Lowest tier, before gateway fees'),
          soldOut: !!e.soldOut,
          cta: e.soldOut ? L.soldOut : isFree ? L.freeEntry : L.getTickets,
          ctaClass: e.soldOut ? '' : 'ff-cta',
          ctaBg: e.soldOut ? '#191919' : isFree ? '#0AE448' : '#ABFF84',
          ctaFg: e.soldOut ? '#8C8B7D' : '#0E100F',
          buy: () => this.buyTickets(e, det, 'detail'),
          ticketNote:L.ticketNote,
          saved: !!st.saved[e.id],
          saveLabel: st.saved[e.id] ? L.savedEvent : L.saveEvent,
          saveBg: st.saved[e.id] ? 'rgba(171,255,132,.14)' : 'transparent',
          saveBd: st.saved[e.id] ? '#ABFF84' : 'rgba(255,252,225,.19)',
          saveFg: st.saved[e.id] ? '#FFFCE1' : '#E6E3C8',
          save: () => {
            if (!st.user) return this.openAuth('signup', 'save:' + e.id, L.gateSave);
            this.toggleFlag('saved', '/me/saves/', e.id);
          },
          share: () => this.setState({ shareOpen:true, shareWhat:null, shareVideo:null }),
          collect: () => this.openCollect(e.id),
          friendsShow: fr.length > 0,
          friendsLine: fr.length + ' ' + L.friendsGoing,
          friendFaces: fr.slice(0, 5).map(f => ({ initials: initialsOf(f.name), color: f.color })),
          mapPin: e.area, openMaps: () => window.open('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(e.lat != null ? e.lat + ',' + e.lng : e.venue + ', ' + e.area), '_blank', 'noopener'),
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
          followOrgBg: st.following['org:' + org.id] ? 'rgba(171,255,132,.12)' : 'transparent',
          followOrgBd: st.following['org:' + org.id] ? '#ABFF84' : 'rgba(255,252,225,.32)',
          followOrgFg: st.following['org:' + org.id] ? '#FFFCE1' : '#E6E3C8',
          followOrgNote: L.followOrgNote,
          similar: (() => {
            if (det && det.similar) return det.similar.map(s => EVENTS.find(x => x.id === s.id)).filter(Boolean);
            const near = EVENTS.filter(x => x.id !== e.id && !x.past && (x.genre === e.genre || x.area === e.area));
            const rest = EVENTS.filter(x => x.id !== e.id && !x.past && near.indexOf(x) < 0).sort((a, b) => b.hype - a.hype);
            return near.concat(rest).slice(0, 3);
          })().map(x => ({
            title:x.title, art:x.art, whenLine: this.when(x),
            priceLine: x.price === 0 ? L.free : L.from + ' ' + this.short(x.price, x.currency),
            open: () => this.openEvent(x.id)
          }))
        };
      })(),

      tt: (() => {
        const e = EVENTS.filter(x => x.id === st.detailId)[0];
        const T = e ? TT[e.id] : null;
        if (!T) return { show:false, days:[], ticks:[], gridLines:[], stages:[], clashes:[], hasPlan:false, hasClash:false, planLine:'', planFg:'#8C8B7D', clashTitle:'' };
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
            bg: i === di ? 'rgba(171,255,132,.14)' : 'transparent',
            bd: i === di ? '#ABFF84' : 'rgba(255,252,225,.19)',
            fg: i === di ? '#FFFCE1' : '#A5A493',
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
                bg: on ? (bad ? 'rgba(255,135,9,.24)' : 'rgba(171,255,132,.22)') : 'rgba(28,29,27,.85)',
                bd: on ? (bad ? '#FF8709' : '#ABFF84') : '#33342F',
                glow: on ? (bad ? '0 0 0 1px rgba(255,135,9,.35)' : '0 0 0 1px rgba(171,255,132,.3)') : 'none',
                fg: on ? '#FFFCE1' : '#E6E3C8',
                timeFg: on ? (bad ? '#FF8709' : '#FFFCE1') : '#8C8B7D',
                icon: bad ? 'ph-fill ph-warning' : 'ph-fill ph-check-circle',
                iconFg: bad ? '#FF8709' : '#FFFCE1',
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
          planFg: picked.length ? '#FFFCE1' : '#8C8B7D',
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
          onsale: { label:L.tierOnSale, fg:'#0AE448', bg:'rgba(10,228,72,.14)', bd:'rgba(10,228,72,.4)' },
          last: { label:L.tierLast, fg:'#FF8709', bg:'rgba(255,135,9,.14)', bd:'rgba(255,135,9,.42)' },
          soldout: { label:L.tierSoldOut, fg:'#A5A493', bg:'rgba(165,164,147,.112)', bd:'rgba(255,252,225,.19)' },
          soon: { label:L.tierSoon, fg:'#DFFFD1', bg:'rgba(10,228,72,.14)', bd:'rgba(10,228,72,.4)' }
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
              priceFg: out ? '#8C8B7D' : '#FFFCE1',
              nameFg: out ? '#A5A493' : '#FFFCE1',
              state: m.label, stFg: m.fg, stBg: m.bg, stBd: m.bd,
              op: out ? '.62' : '1',
              hasLeft: !!t.left && !out,
              left: t.left ? L.tierLeft.replace('{n}', String(t.left)) : '',
              leftFg: t.state === 'last' ? '#FF8709' : '#8C8B7D',
              cta: out ? L.tierSoldOut : soon ? L.tierNotify : L.tierBuy,
              cursor: out ? 'default' : 'pointer',
              ctaBg: out ? 'transparent' : soon ? 'transparent' : t.state === 'last' ? 'rgba(255,135,9,.14)' : 'rgba(255,252,225,.1)',
              ctaBd: out ? 'rgba(255,252,225,.19)' : soon ? '#0AE448' : t.state === 'last' ? 'rgba(255,135,9,.5)' : 'rgba(255,252,225,.32)',
              ctaFg: out ? '#8C8B7D' : soon ? '#DFFFD1' : t.state === 'last' ? '#FF8709' : '#FFFCE1',
              buy: () => {
                if (out) return this.say(L.tierSoldToast);
                if (!st.user) return this.openAuth('signup', 'save:' + e.id, L.gateTickets);
                if (soon) { FF.fire(FF.put('/events/' + e.id + '/tiers/' + t.id + '/watch')); return this.say(L.tierNotifyToast); }
                // A tier on sale here: FeestFinder's checkout, with this tier picked.
                this.buyTickets(e, st.details[e.id] || { tickets: set, links: {} }, 'tier', t.id);
              }
            };
          })
        };
      })(),

      /* ---- the event page's community: hype, FAQ, resale, discussion, sharing ---- */
      comm: (() => {
        const e = EVENTS.filter(x => x.id === st.detailId)[0];
        const det = e ? st.details[e.id] : null;
        if (!e || !det || !det.hype) return { show:false, hype:{}, faq:[], resale:{ items:[] }, disc:{ tabs:[], items:[] }, amb:[], community:{} };
        const money = (n) => (n || 0).toLocaleString(vi1 ? 'vi-VN' : 'en-US') + '₫';
        const hyped = e.id in st.hyped ? st.hyped[e.id] : !!(det.viewer && det.viewer.hyped);
        const H = det.hype;
        const goals = H.goals.map(x => ({
          label: x.threshold.toLocaleString(vi1 ? 'vi-VN' : 'en-US'), reward: x.reward[g] || x.reward.vi,
          icon: x.reached ? 'ph-fill ph-check-circle' : 'ph-bold ph-lock-simple',
          fg: x.reached ? '#ABFF84' : '#A5A493', op: x.reached ? '1' : '.86'
        }));

        // Resale: the list, and what the viewer can do about it.
        const R = st.resale;
        const resale = {
          show: !!(det.resale && det.resale.enabled) || !!(R && R.count),
          live: det.phase === 'live',
          items: R ? R.items.map(it => ({
            price: money(it.price), tier: it.tier ? it.tier[g] : 'GA', seller: it.seller.name,
            face: L.resaleFace.replace('{p}', money(it.faceValue)), mine: it.mine,
            under: it.price < it.faceValue,
            buy: () => {
              if (it.mine) return this.say(L.resaleMine);
              if (!st.user) return this.openAuth('signup', null, L.gateTickets);
              window.location.href = '/app/checkout/' + encodeURIComponent(e.slug || e.id) + '?listing=' + it.id;
            }
          })) : [],
          empty: !!R && R.count === 0,
          fee: L.resaleFee.replace('{p}', String(det.resale ? det.resale.feePct : 5)),
          watching: !!(R && R.watching),
          watchLabel: R && R.watching ? L.resaleWatching : L.resaleWatch,
          watchIcon: R && R.watching ? 'ph-fill ph-bell-ringing' : 'ph-bold ph-bell',
          watch: () => {
            if (!st.user) return this.openAuth('signup', null, L.gateSave);
            const on = !(R && R.watching);
            FF.fire((on ? FF.put : FF.del)('/events/' + e.id + '/resale/watch').then(out => { this.say(FF.text(out.message, g)); this.loadResale(e.id); }), (err) => this.say(FF.errorText(err, g)));
          },
          canSell: !!(det.mine && det.mine.validTickets),
          sell: () => { window.location.href = '/app/tickets'; }
        };

        // Discussion: tabs, the composer, and the threads with their first replies.
        const D = st.disc;
        const team = !!(D && D.me && D.me.isTeam);
        const author = (a) => a ? {
          name: a.name || L.discMember, initials: a.initials, photo: a.photoUrl ? 'url("' + a.photoUrl + '") center/cover no-repeat' : FF.colorFor(a.name || 'ff'),
          badges: a.badges.map(b => ({ label: b.label[g], fg: b.key === 'team' || b.key === 'ff' ? '#0E100F' : '#ABFF84', bg: b.key === 'team' || b.key === 'ff' ? '#ABFF84' : 'rgba(171,255,132,.12)' }))
        } : { name: L.discRemoved, initials: '–', photo: '#1E1F1C', badges: [] };
        const postView = (p, isReply) => {
          const moreList = !isReply && st.discMore[p.id];
          const replies = !isReply ? (moreList || p.replies || []) : [];
          return {
            id: p.id, a: author(p.author), body: p.removed ? L.discRemoved : p.body, bodyFg: p.removed ? '#8C8B7D' : '#E6E3C8',
            hasPhoto: !!p.photoUrl, photo: p.photoUrl || '',
            ago: this.ago(p.createdAt),
            pinned: p.pinned, official: p.official, hidden: p.hidden,
            setLine: p.set ? p.set.artist + (p.heardAt ? ' · ' + p.heardAt : '') : (p.heardAt || ''),
            hasSet: !!(p.set || p.heardAt),
            helpful: p.helpfulCount ? String(p.helpfulCount) : '',
            helpedFg: p.me && p.me.helped ? '#ABFF84' : '#A5A493',
            helpedIcon: p.me && p.me.helped ? 'ph-fill ph-thumbs-up' : 'ph-bold ph-thumbs-up',
            canAct: !p.removed,
            op: p.hidden ? '.6' : '1',
            boxBg: p.official ? 'rgba(171,255,132,.07)' : 'rgba(14,16,15,.5)', boxBd: p.official ? 'rgba(171,255,132,.32)' : '#1E1F1C',
            reportable: !(p.me && p.me.mine) && !p.removed,
            mine: !!(p.me && p.me.mine), mod: team && !p.removed,
            pinLabel: p.pinned ? L.discUnpin : L.discPin, hideLabel: p.hidden ? L.discShow : L.discHide,
            canPin: team && !isReply && !p.removed,
            help: () => {
              if (!st.user) return this.openAuth('signup', null, L.gateSave);
              if (p.me && p.me.mine) return;
              const on = !(p.me && p.me.helped);
              FF.fire((on ? FF.put : FF.del)('/posts/' + p.id + '/helpful').then(() => this.loadDiscussion(e.id)), (err) => this.say(FF.errorText(err, g)));
            },
            report: () => {
              if (!st.user) return this.openAuth('signup', null, L.gateSave);
              FF.fire(FF.post('/posts/' + p.id + '/reports', { code: 'other' }).then(() => this.say(L.discReported)), (err) => this.say(FF.errorText(err, g)));
            },
            remove: () => FF.fire(FF.del('/posts/' + p.id).then(out => { this.say(FF.text(out.message, g)); this.loadDiscussion(e.id); }), (err) => this.say(FF.errorText(err, g))),
            pin: () => FF.fire(FF.patch('/posts/' + p.id, { pinned: !p.pinned }).then(out => { this.say(FF.text(out.message, g)); this.loadDiscussion(e.id); }), (err) => this.say(FF.errorText(err, g))),
            hide: () => FF.fire(FF.patch('/posts/' + p.id, { hidden: !p.hidden }).then(out => { this.say(FF.text(out.message, g)); this.loadDiscussion(e.id); }), (err) => this.say(FF.errorText(err, g))),
            replyOpen: st.discReplyTo === p.id,
            canReply: !isReply && !p.removed,
            reply: () => {
              if (!st.user) return this.openAuth('signup', null, L.discSignin);
              this.setState({ discReplyTo: st.discReplyTo === p.id ? null : p.id, discReplyDraft:'' });
            },
            replies: replies.map(r => postView(r, true)),
            hasMore: !isReply && !moreList && p.replyCount > (p.replies || []).length,
            moreLabel: L.discMore.replace('{n}', String(p.replyCount - (p.replies || []).length)),
            more: () => this.loadReplies(p.id)
          };
        };
        const tabs = D ? D.kinds.map(k => ({
          label: k.label[g] + (k.count ? ' · ' + k.count : ''),
          bg: k.kind === D.kind ? 'rgba(171,255,132,.14)' : 'transparent', bd: k.kind === D.kind ? '#ABFF84' : 'rgba(255,252,225,.19)',
          fg: k.kind === D.kind ? '#FFFCE1' : '#A5A493',
          pick: () => { this.setState({ discKind: k.kind, discReplyTo:null }); this.loadDiscussion(e.id, { discKind: k.kind }); }
        })) : [];
        const open = D ? (D.kinds.find(k => k.kind === D.kind) || {}).open : false;
        const gate = D ? D.me.canWrite : 'signin';
        const T = TT[e.id];
        const sets = [];
        if (T) T.days.forEach(d => d.stages.forEach(sg => sg.s.forEach(x => sets.push({ id: x[3], label: x[0] + ' · ' + sg[g] }))));
        const disc = {
          tabs, items: D ? D.items.map(p => postView(p, false)) : [],
          loading: !D, empty: !!D && D.items.length === 0,
          sortTop: st.discSort === 'top',
          sortTopFg: st.discSort === 'top' ? '#FFFCE1' : '#8C8B7D', sortNewFg: st.discSort === 'new' ? '#FFFCE1' : '#8C8B7D',
          setTop: () => { this.setState({ discSort:'top' }); this.loadDiscussion(e.id, { discSort:'top' }); },
          setNew: () => { this.setState({ discSort:'new' }); this.loadDiscussion(e.id, { discSort:'new' }); },
          composer: open && gate === 'ok', closed: !!D && !open,
          gateShow: open && gate !== 'ok', gateLabel: gate === 'verify_phone' ? L.discVerify : L.discSignin,
          gateGo: () => gate === 'verify_phone' ? this.needPhone(null) : this.openAuth('signup', null, L.discSignin),
          draft: st.discDraft, onDraft: (ev) => this.setState({ discDraft: ev.target.value }),
          placeholder: L['discPh_' + (D ? D.kind : 'talk')],
          trackid: !!D && D.kind === 'trackid' && sets.length > 0,
          setChips: sets.map(x => ({
            label: x.label, bg: st.discSet === x.id ? 'rgba(0,186,226,.16)' : 'transparent', bd: st.discSet === x.id ? '#00BAE2' : 'rgba(255,252,225,.19)',
            fg: st.discSet === x.id ? '#FFFCE1' : '#A5A493', pick: () => this.setState({ discSet: st.discSet === x.id ? '' : x.id })
          })),
          heard: st.discHeard, onHeard: (ev) => this.setState({ discHeard: ev.target.value }),
          send: () => this.postToDiscussion(null), sendOp: st.discDraft.trim() && !st.discBusy ? '1' : '.5',
          photoOk: !!D && (D.kind === 'memory' || D.kind === 'talk'),
          hasPhoto: !!st.discPhotoUrl, photoPreview: st.discPhotoUrl,
          onPhoto: (ev) => {
            const file = ev.target.files && ev.target.files[0]; ev.target.value = '';
            if (!file) return;
            if (st.discPhotoUrl) URL.revokeObjectURL(st.discPhotoUrl);
            this.setState({ discPhoto: file, discPhotoUrl: URL.createObjectURL(file) });
          },
          dropPhoto: () => { if (st.discPhotoUrl) URL.revokeObjectURL(st.discPhotoUrl); this.setState({ discPhoto:null, discPhotoUrl:'' }); },
          replyDraft: st.discReplyDraft, onReplyDraft: (ev) => this.setState({ discReplyDraft: ev.target.value }),
          sendReply: () => this.postToDiscussion(st.discReplyTo),
          count: D ? String(D.total) : ''
        };

        const mine = det.mine || {};
        return {
          show: true,
          community: (() => {
            const C = det.community, claim = mine.claim;
            return {
              show: !!C, line: C ? (C.submittedBy && C.submittedBy.name ? L.communityBy.replace('{n}', C.submittedBy.name) : L.communityBySomeone) : '',
              claimShow: !!(C && C.claimable) && !(claim && claim.pending), pending: !!(claim && claim.pending), claimLabel: L.claimCta,
              claim: () => {
                if (!st.user) return this.openAuth('signup', null, L.gateOrganizer);
                if (!claim || !claim.organiser) { window.location.href = '/studio'; return; }
                this.setState({ claimOpen:true });
              }
            };
          })(),
          updates: (det.updates || []).map(u => ({
            kind: u.kindLabel ? u.kindLabel[g] : '', body: u.body, ago: this.ago(u.createdAt),
            icon: { delay:'ph-fill ph-clock-countdown', gate:'ph-fill ph-door-open', safety:'ph-fill ph-first-aid-kit', lineup:'ph-fill ph-microphone-stage' }[u.kind] || 'ph-fill ph-megaphone',
            fg: u.kind === 'safety' || u.kind === 'delay' ? '#FF8709' : '#ABFF84'
          })),
          hasUpdates: (det.updates || []).length > 0,
          photos: (st.photos || []).map(x => ({ url: x.url, bg: 'url("' + x.url + '") center/cover no-repeat', caption: x.caption, by: x.author.name || L.discMember })),
          hasPhotos: !!(st.photos && st.photos.length),
          hype: {
            count: H.count.toLocaleString(vi1 ? 'vi-VN' : 'en-US'),
            recent: H.last24h ? L.hype24.replace('{n}', String(H.last24h)) : '',
            hasNext: !!H.next, nextReward: H.next ? (H.next.reward[g] || H.next.reward.vi) : '',
            nextLeft: H.next ? L.hypeLeft.replace('{n}', H.next.left.toLocaleString(vi1 ? 'vi-VN' : 'en-US')) : '',
            pct: H.next ? Math.round(H.next.progress * 100) + '%' : '100%',
            goals, hasGoals: goals.length > 0,
            on: hyped, label: hyped ? L.hypeDone : L.hypeCta,
            bg: hyped ? 'rgba(171,255,132,.14)' : '#ABFF84', fg: hyped ? '#FFFCE1' : '#0E100F', bd: hyped ? '#ABFF84' : '#ABFF84',
            icon: hyped ? 'ph-fill ph-fire' : 'ph-bold ph-fire',
            toggle: () => this.toggleHype(e.id)
          },
          faq: (det.faq || []).map(f => ({ q: f.question, a: f.answer })),
          hasFaq: (det.faq || []).length > 0,
          resale, disc,
          amb: (det.ambassadors || []).map((a, i) => ({ rank: String(i + 1), name: a.name, initials: a.initials, color: FF.colorFor(a.name + i), visits: L.ambVisits.replace('{n}', String(a.visits)) })),
          hasAmb: (det.ambassadors || []).length > 0,
          brought: mine.broughtVisits ? L.shareBrought.replace('{n}', String(mine.broughtVisits)) : '',
          hasBrought: !!mine.broughtVisits
        };
      })(),

      claimOpen: st.claimOpen,
      claimF: {
        note: st.claimNote, onNote: (ev) => this.setState({ claimNote: ev.target.value }),
        proof: st.claimProof, onProof: (ev) => this.setState({ claimProof: ev.target.value }),
        send: () => this.sendClaim(), label: st.claimBusy ? '…' : L.claimSend,
        close: () => this.setState({ claimOpen:false })
      },
      shareOpen: st.shareOpen,
      closeShare: () => this.setState({ shareOpen:false, shareWhat:null, shareVideo:null }),
      shareTitle: st.shareWhat ? st.shareWhat.name : L.shareTitle,
      shareTargets: [
        { k:'zalo', label:'Zalo', icon:'ph-fill ph-chat-circle-dots', color:'#2AC4E8' },
        { k:'messenger', label:'Messenger', icon:'ph-fill ph-messenger-logo', color:'#A97BFF' },
        { k:'facebook', label:'Facebook', icon:'ph-fill ph-facebook-logo', color:'#1877F2' },
        { k:'instagram', label:'Instagram', icon:'ph-fill ph-instagram-logo', color:'#FEC5FB' },
        { k:'tiktok', label:'TikTok', icon:'ph-fill ph-tiktok-logo', color:'#FFFCE1' },
        { k:'threads', label:'Threads', icon:'ph-bold ph-threads-logo', color:'#FFFCE1' },
        { k:'x', label:'X', icon:'ph-bold ph-x-logo', color:'#FFFCE1' },
        { k:'telegram', label:'Telegram', icon:'ph-fill ph-telegram-logo', color:'#2AABEE' },
        { k:'copy', label:L.shareCopy, icon:'ph-bold ph-link', color:'#ABFF84' },
        { k:'native', label:L.shareMore, icon:'ph-bold ph-share-network', color:'#ABFF84' }
      ].map(t => Object.assign({}, t, { go: () => { this.share(t.k); if (t.k !== 'copy' && t.k !== 'tiktok') this.setState({ shareOpen:false, shareWhat:null }); } })),
      shareVideoMaking: !!(st.shareVideo && st.shareVideo.making),
      shareVideoReady: !!(st.shareVideo && st.shareVideo.file),
      shareVideoGo: () => {
        const v = st.shareVideo;
        if (!v || !v.file) return;
        FF.shareFile(v.file, v.title).then(how => { if (how === 'saved') this.say(L.videoSaved); if (how !== 'cancelled') this.setState({ shareOpen:false, shareWhat:null, shareVideo:null }); });
      },

      submitOpen: st.submitOpen,
      closeSubmit: () => this.setState({ submitOpen:false }),
      submitTabNew: st.submitTab === 'new', submitTabMine: st.submitTab === 'mine',
      submitTabs: [{ k:'new', label:L.submitNew }, { k:'mine', label:L.submitMine + (st.submissions && st.submissions.length ? ' · ' + st.submissions.length : '') }].map(t => ({
        label: t.label, bg: st.submitTab === t.k ? 'rgba(171,255,132,.14)' : 'transparent', bd: st.submitTab === t.k ? '#ABFF84' : 'rgba(255,252,225,.19)',
        fg: st.submitTab === t.k ? '#FFFCE1' : '#A5A493', pick: () => this.setState({ submitTab: t.k })
      })),
      sf: (() => {
        const f = st.submitForm, set = (k) => (ev) => this.setState({ submitForm: Object.assign({}, st.submitForm, { [k]: ev.target.value }), submitErr:'' });
        return {
          title: f.title || '', onTitle: set('title'), date: f.date || '', onDate: set('date'), start: f.start || '', onStart: set('start'),
          end: f.end || '', onEnd: set('end'), venue: f.venue || '', onVenue: set('venue'), address: f.address || '', onAddress: set('address'),
          area: f.area || '', onArea: set('area'), price: f.price || '', onPrice: set('price'), source: f.source || '', onSource: set('source'),
          ticket: f.ticket || '', onTicket: set('ticket'), lineup: f.lineup || '', onLineup: set('lineup'), desc: f.desc || '', onDesc: set('desc'),
          endDate: f.endDate || '', onEndDate: set('endDate'),
          auto: f.auto || '', onAuto: (ev) => this.setState({ submitForm: Object.assign({}, st.submitForm, { auto: ev.target.value }), prefillErr:'' }), autoErr: st.prefillErr, hasAutoErr: !!st.prefillErr, autoGo: () => this.prefill(null), autoBusy: st.prefillBusy, autoLabel: st.prefillBusy ? '…' : L.fAutoGo,
          onPoster: (ev) => { const file = ev.target.files && ev.target.files[0]; ev.target.value = ''; if (file) this.prefill(file); },
          cities: CITY_LIST.map(c => ({
            label: c[g], bg: (f.city || 'ho-chi-minh') === c.k ? 'rgba(171,255,132,.14)' : 'transparent', bd: (f.city || 'ho-chi-minh') === c.k ? '#ABFF84' : 'rgba(255,252,225,.19)', fg: (f.city || 'ho-chi-minh') === c.k ? '#FFFCE1' : '#A5A493',
            pick: () => this.setState({ submitForm: Object.assign({}, st.submitForm, { city: c.k }) })
          })),
          // Bound rather than written in the template, so the browser never parses "{{ }}" as a date.
          tDate: 'date', tTime: 'time',
          paid: f.entry === 'paid',
          genres: GENRES.filter(x => x !== 'All').map(x => ({
            label: x, bg: f.genre === x ? 'rgba(171,255,132,.14)' : 'transparent', bd: f.genre === x ? '#ABFF84' : 'rgba(255,252,225,.19)', fg: f.genre === x ? '#FFFCE1' : '#A5A493',
            pick: () => this.setState({ submitForm: Object.assign({}, st.submitForm, { genre: x }) })
          })),
          entries: [{ k:'paid', label:L.fPaid }, { k:'free', label:L.fFree }].map(x => ({
            label: x.label, bg: f.entry === x.k ? 'rgba(171,255,132,.14)' : 'transparent', bd: f.entry === x.k ? '#ABFF84' : 'rgba(255,252,225,.19)', fg: f.entry === x.k ? '#FFFCE1' : '#A5A493',
            pick: () => this.setState({ submitForm: Object.assign({}, st.submitForm, { entry: x.k }) })
          })),
          err: st.submitErr, hasErr: !!st.submitErr,
          send: () => this.sendSubmission(), sendLabel: st.submitBusy ? '…' : L.fSend,
          mine: (st.submissions || []).map(x => ({
            title: x.title, when: FF.dayLabel(x.startsOn, g) + (x.startTime ? ' · ' + x.startTime : '') + ' · ' + (x.venueName || ''),
            status: x.statusLabel ? x.statusLabel[g] : x.status,
            stFg: x.status === 'live' ? '#0E100F' : x.status === 'rejected' ? '#FF8709' : '#FFFCE1',
            stBg: x.status === 'live' ? '#ABFF84' : x.status === 'rejected' ? 'rgba(255,135,9,.14)' : 'rgba(255,252,225,.1)',
            reason: x.reason ? x.reason[g] : '', hasReason: !!x.reason,
            open: () => { if (x.status === 'live') { this.setState({ submitOpen:false }); const ev = eventBy(x.slug); if (ev) this.openEvent(ev.id); else window.location.href = FF.href('e', x.slug); } }
          })),
          mineEmpty: !!st.submissions && st.submissions.length === 0
        };
      })(),

      reportOpen: !!st.reportFor,
      openReport: () => this.setState({ reportFor: st.detailId, reportCode:'wrong', reportNote:'' }),
      closeReport: () => this.setState({ reportFor:null }),
      reportCodes: REPORT_CODES.map(c => {
        const on = st.reportCode === c.k;
        return { label: c[g], icon:c.icon,
          bg: on ? 'rgba(171,255,132,.1)' : 'rgba(14,16,15,.6)',
          bd: on ? '#ABFF84' : 'rgba(255,252,225,.19)',
          fg: on ? '#FFFCE1' : '#E6E3C8',
          iconFg: on ? '#FFFCE1' : '#8C8B7D',
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
            color: on ? '#ABFF84' : 'rgba(255,252,225,.32)',
            bg: on ? 'rgba(171,255,132,.1)' : 'transparent',
            bd: on ? 'rgba(171,255,132,.4)' : '#1E1F1C',
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
          followBg: following ? 'transparent' : '#ABFF84',
          followFg: following ? '#FFFCE1' : '#0E100F',
          followBd: following ? '#ABFF84' : '#ABFF84',
          follow: () => {
            if (!st.user) return this.openAuth('signup', null, L.gateSave);
            this.toggleFollow('org', o.id);
            this.say((following ? L.unfollowedToast : L.followedToast).replace('{n}', o.name));
          },
          ...(() => {
            const n = o.net || { markets: [], styles: [], links: [], artists: [], venues: [] };
            return {
              typeLine: [n.typeLabel ? n.typeLabel[g] : '', n.markets.map(m => (m.label || {})[g] || m.slug).join(', ')].filter(Boolean).join(' · '),
              hasTypeLine: !!(n.typeLabel || n.markets.length),
              styleChips: n.styles.map(x => ({ label: x.label[g] || x.label.en })), hasStyles: n.styles.length > 0,
              openShow: !!n.open, openLabel: L.orgOpen,
              links: n.links.map(l => ({ label: l.label[g] || l.label.en, url: l.url, icon: LINK_ICON[l.kind] || LINK_ICON.website }))
                .concat(n.website ? [{ label: n.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''), url: n.website, icon: LINK_ICON.website }] : []),
              hasLinks: n.links.length > 0 || !!n.website,
              artistsTitle: L.orgArtists, hasArtists: n.artists.length > 0,
              artistRows: n.artists.map(a => ({ name: a.name, line: L.artistEvents.replace('{n}', String(a.events)), open: () => this.openArtist(a.slug) })),
              venuesTitle: L.orgVenues, hasVenues: n.venues.length > 0,
              venueRows: n.venues.map(v => ({ name: v.name, line: [(v.cityLabel || {})[g], L.artistEvents.replace('{n}', String(v.events))].filter(Boolean).join(' · ') }))
            };
          })(),
          upTitle:L.orgUpcoming, pastTitle:L.orgPast,
          upEmpty: up.length === 0, noUpcoming:L.orgNoUpcoming,
          hasPast: past.length > 0,
          upcoming: up.map(x => ({
            title:x.title, art:x.art, genre:x.genre, whenLine: this.when(x),
            whereLine: x.venue + (x.dist != null ? ' · ' + x.dist + ' km' : ''),
            priceLine: x.price === 0 ? L.free : L.from + ' ' + this.short(x.price, x.currency),
            priceColor: x.price === 0 ? '#0AE448' : '#FFFCE1',
            open: () => this.openEvent(x.id)
          })),
          pastRows: past
        };
      })(),
      artist: (() => {
        const a = st.artists[st.artistSlug];
        const none = { hasMeta:false, meta:'', verified:false, verifiedLabel:'', hasBooking:false, bookingLabel:'', bookingFg:'', hasBio:false, bio:'', hasLinks:false, links:[],
          editShow:false, editLabel:'', edit: () => {}, hasOrgs:false, orgs:[], orgsTitle:'', hasVenues:false, venues:[], venuesTitle:'', hasLineups:false, lineups:[], lineupsTitle:'',
          hasSimilar:false, similar:[], similarTitle:'', hasGear:false, gear:[], gearTitle:'', hasDates:false, dates:[], datesTitle:'' };
        if (!a) return Object.assign(none, { name: st.artistSlug || '', kicker: L.artistKicker, stats: [], upcoming: [], upEmpty: false, hasPast: false, pastRows: [], followLabel: L.follow,
          followBg:'#ABFF84', followFg:'#0E100F', followBd:'#ABFF84', follow: () => {}, upTitle: L.artistUpcoming, pastTitle: L.artistPast, noUpcoming: L.artistNone, art: FF.genreArt('EDM'), initials: '' });
        const rel = a.rel || {};
        const lineDays = (x) => L.artistEvents.replace('{n}', String(x.events)) + (x.lastOn ? ' · ' + x.lastOn.split('-').slice(0, 2).reverse().join('/') : '');
        const following = st.following['art:' + a.name] !== undefined ? !!st.following['art:' + a.name] : a.following;
        const ups = (a.upcomingIds || []).map(id => EVENTS.find(e => e.id === id)).filter(Boolean);
        const style = (k) => { const x = STYLE_LABEL[k]; return x ? x[g] || x.en : k; };
        return {
          name: a.name, initials: FF.initials(a.name), art: a.imageUrl ? 'url("' + a.imageUrl + '") center/cover no-repeat' : FF.genreArt(ups[0] ? ups[0].genre : 'EDM'),
          kicker: [(a.roles || []).length ? a.roles.map(r => r.label[g] || r.label.en).join(' / ') : L.artistKicker].concat(a.styles.slice(0, 3).map(style)).join(' · '),
          meta: [a.basedIn ? L.artistBasedIn.replace('{c}', (a.basedIn.label || {})[g] || a.basedIn.city) : '', a.activeSince ? L.artistSince.replace('{y}', String(a.activeSince)) : '',
            a.travel ? L.artistTravel.replace('{t}', a.travel.label[g] || a.travel.label.en) : ''].filter(Boolean).join(' · '),
          hasMeta: !!(a.basedIn || a.activeSince || a.travel),
          verified: !!a.verified, verifiedLabel: L.artistVerified,
          hasBooking: !!a.booking, bookingLabel: a.booking ? a.booking.label[g] || a.booking.label.en : '', bookingFg: a.booking ? BOOKING_FG[a.booking.key] || '#ABFF84' : '',
          hasBio: !!(a.bio && (a.bio[g] || a.bio.en)), bio: a.bio ? a.bio[g] || a.bio.en || '' : '',
          links: (a.links || []).map(l => ({ label: l.label[g] || l.label.en, url: l.url, icon: LINK_ICON[l.kind] || LINK_ICON.website }))
            .concat(a.website ? [{ label: a.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''), url: a.website, icon: LINK_ICON.website }] : []),
          hasLinks: (a.links || []).length > 0 || !!a.website,
          editShow: !!a.editable, editLabel: L.artistEdit, edit: () => { window.location.href = '/ops/artist'; },
          orgsTitle: L.artistOrgs, hasOrgs: (rel.organizers || []).length > 0,
          orgs: (rel.organizers || []).map(o => ({ name: o.name, line: lineDays(o), art: o.art || FF.genreArt('EDM'), initials: FF.initials(o.name),
            open: () => { const known = Object.values(ORGS).find(x => x.id === o.id); if (known) this.openOrg(known.id); else window.location.href = FF.href('o', o.slug); } })),
          venuesTitle: L.artistVenues, hasVenues: (rel.venues || []).length > 0,
          venues: (rel.venues || []).map(v => ({ name: v.name, line: [(v.cityLabel || {})[g], lineDays(v)].filter(Boolean).join(' · ') })),
          lineupsTitle: L.artistLineups, hasLineups: (rel.sharedLineups || []).length > 0,
          lineups: (rel.sharedLineups || []).map(x => ({ name: x.name, line: lineDays(x), open: () => this.openArtist(x.slug) })),
          similarTitle: L.artistSimilar, hasSimilar: (rel.similar || []).length > 0,
          similar: (rel.similar || []).map(x => ({ name: x.name, initials: FF.initials(x.name), art: FF.genreArt('EDM'), line: x.score + '/100', open: () => this.openArtist(x.slug) })),
          datesTitle: L.artistDates, hasDates: (a.availability || []).length > 0,
          dates: (a.availability || []).map(w => {
            const d = (x) => x.split('-').slice(1).reverse().join('/');
            const free = w.kind === 'available';
            return { label: (w.from === w.to ? d(w.from) : d(w.from) + ' – ' + d(w.to)) + (w.cityLabel ? ' · ' + (w.cityLabel[g] || w.cityLabel.en) : ''),
              state: free ? L.artistFree : L.artistBusy, fg: free ? '#ABFF84' : '#FF8709', bd: free ? 'rgba(171,255,132,.45)' : 'rgba(255,135,9,.45)' };
          }),
          gearTitle: L.artistGear, hasGear: (a.gear || []).length > 0,
          gear: (a.gear || []).map(x => ({ name: [x.brand, x.name].filter(Boolean).join(' '), line: (x.categoryLabel || {})[g] || x.category, hasUrl: !!x.url, url: x.url || '' })),
          stats: [
            { value: String(ups.length), label: L.artistShows },
            { value: this.short0(a.followers + (following && !a.following ? 1 : !following && a.following ? -1 : 0)), label: L.artistFollowers },
            { value: a.cities.map(c => (c.label || {})[g] || c.slug).join(', ') || '—', label: L.colCity }
          ],
          followLabel: following ? L.followingLabel : L.follow,
          followBg: following ? 'transparent' : '#ABFF84', followFg: following ? '#FFFCE1' : '#0E100F', followBd: '#ABFF84',
          follow: () => {
            if (!st.user) return this.openAuth('signup', null, L.gateSave);
            this.toggleFollow('art', a.name);
            this.say((following ? L.unfollowedToast : L.followedToast).replace('{n}', a.name));
          },
          upTitle: L.artistUpcoming, pastTitle: L.artistPast, noUpcoming: L.artistNone,
          upEmpty: ups.length === 0, hasPast: (a.past || []).length > 0,
          upcoming: ups.map(x => ({
            title:x.title, art:x.art, genre: (x.styles || []).length ? style(x.styles[0]) : x.genre, whenLine: this.when(x),
            whereLine: x.venue + ' · ' + ((CITY_LIST.find(c => c.k === x.city) || {})[g] || ''),
            priceLine: x.price === 0 ? L.free : L.from + ' ' + this.short(x.price, x.currency),
            priceColor: x.price === 0 ? '#0AE448' : '#FFFCE1',
            open: () => this.openEvent(x.id)
          })),
          pastRows: (a.past || []).map(p => ({
            title: p.title, art: FF.genreArt('EDM'),
            whenLine: p.startsOn.split('-').reverse().join('/') + ' · ' + [p.venue, (p.cityLabel || {})[g]].filter(Boolean).join(' · '),
            open: () => (EVENTS.some(e => e.id === p.id) ? this.openEvent(p.id) : (window.location.href = FF.href('e', p.slug)))
          }))
        };
      })(),
      role: (() => {
        const u = st.user, roles = (u && u.roles) || {};
        const step = st.rolePick, chipOn = (on) => ({ bg: on ? '#ABFF84' : 'transparent', fg: on ? '#0E100F' : '#E6E3C8', bd: on ? '#ABFF84' : 'rgba(255,252,225,.19)' });
        const sug = st.rpSug ? (step === 'artist' ? st.rpSug.artists : st.rpSug.organizers) : [];
        return {
          open: !!step && !!u, menu: step === 'menu', form: step === 'artist' || step === 'organizer', isArtist: step === 'artist', isOrganizer: step === 'organizer',
          title: L.roleTitle, later: L.roleLater,
          cards: [
            { k:'fan', label: L.roleFan, sub: L.roleFanSub, icon:'ph-bold ph-headphones', go: () => this.rolePickFan() },
            { k:'artist', label: L.roleArtist, sub: L.roleArtistSub, icon:'ph-bold ph-microphone-stage', go: () => this.setState({ rolePick:'artist', rpName:'', rpSug:null, rpErr:'', rpClash:null }) },
            { k:'organizer', label: L.roleOrg, sub: L.roleOrgSub, icon:'ph-bold ph-storefront', go: () => this.setState({ rolePick:'organizer', rpName:'', rpSug:null, rpErr:'', rpClash:null }) }
          ],
          close: () => this.rolePickFan(),
          back: () => this.setState({ rolePick:'menu', rpErr:'' }), backLabel: L.roleBack,
          nameLabel: step === 'artist' ? L.roleStage : L.roleOrgName, name: st.rpName,
          onName: (e) => { const v = e.target.value; this.setState({ rpName: v }); this.rolePickSuggest(v); },
          roleChips: ['dj', 'producer', 'live', 'band'].map(k => Object.assign({ label: { dj:'DJ', producer:'Producer', live:'Live act', band: g === 'vi' ? 'Ban nhạc' : 'Band' }[k],
            pick: () => this.setState(s => ({ rpRoles: Object.assign({}, s.rpRoles, { [k]: !s.rpRoles[k] }) })) }, chipOn(!!st.rpRoles[k]))),
          typeChips: [['promoter', g === 'vi' ? 'Đơn vị tổ chức' : 'Promoter'], ['venue', g === 'vi' ? 'Club / địa điểm' : 'Club or venue'], ['festival', g === 'vi' ? 'Lễ hội' : 'Festival'], ['collective', 'Collective']]
            .map(([k, label]) => Object.assign({ label, pick: () => this.setState({ rpType: k }) }, chipOn(st.rpType === k))),
          cityLabel: L.roleCity,
          cityChips: CITY_LIST.map(c => Object.assign({ label: c[g], pick: () => this.setState(s => ({ rpCity: s.rpCity === c.k ? '' : c.k })) }, chipOn(st.rpCity === c.k))),
          hasSug: sug.length > 0, sugTitle: L.roleIsYou,
          sug: sug.map(x => ({ name: x.name, line: x.owned || x.managed ? L.roleClaimed : (x.events ? L.artistEvents.replace('{n}', String(x.events)) : ''),
            claimLabel: L.roleClaim, claim: () => this.rolePickClaim(x.id) })),
          hasErr: !!st.rpErr, err: st.rpErr,
          hasClash: !!st.rpClash, clashLabel: L.roleClaim + ' · ' + (st.rpClash ? st.rpClash.name : ''), clashClaim: () => st.rpClash && this.rolePickClaim(st.rpClash.id),
          createLabel: L.roleCreate, create: () => this.rolePickCreate(),
          // The account menu: where each persona works, or the way to become one.
          artistLink: roles.artist === 'active', artistLabel: L.roleWorkspaceArtist, goArtist: () => { window.location.href = '/ops/artist'; },
          orgLink: roles.organizer === 'active', orgLabel: L.roleWorkspaceOrg, goOrg: () => { window.location.href = '/ops/org'; },
          pending: roles.artist === 'pending' || roles.organizer === 'pending', pendingLabel: L.rolePending,
          offer: roles.artist !== 'active' && roles.organizer !== 'active', offerLabel: L.roleBecome,
          reopen: () => this.setState({ rolePick:'menu', acct:false })
        };
      })(),
      dir: (() => {
        const chip = (on) => ({ bg: on ? '#ABFF84' : 'transparent', fg: on ? '#0E100F' : '#E6E3C8', bd: on ? '#ABFF84' : 'rgba(255,252,225,.19)' });
        const styles = ((WEB.discovery && WEB.discovery.styles) || []).slice(0, 16);
        const title = st.dirStyle && STYLE_LABEL[st.dirStyle] ? (g === 'vi' ? L.dirTitle + ' ' + (STYLE_LABEL[st.dirStyle][g] || STYLE_LABEL[st.dirStyle].en) : (STYLE_LABEL[st.dirStyle][g] || STYLE_LABEL[st.dirStyle].en) + ' ' + L.dirTitle.toLowerCase())
          : st.dirCity ? L.dirTitle + ' · ' + ((CITY_LIST.find(c => c.k === st.dirCity) || {})[g] || st.dirCity) : L.dirTitle;
        return {
          title, countLine: L.dirCount.replace('{n}', String(st.dirTotal)), searchPh: L.dirSearch, q: st.dirQ,
          onSearch: (e) => { const v = e.target.value; this.setState({ dirQ: v }); clearTimeout(this._dq); this._dq = setTimeout(() => this.loadDirectory(), 300); },
          roles: [{ k:'', label: L.dirAll }].concat(['dj', 'producer', 'live', 'band'].map(k => ({ k, label: { dj:'DJ', producer:'Producer', live:'Live act', band: g === 'vi' ? 'Ban nhạc' : 'Band' }[k] })))
            .map(r => Object.assign({ label: r.label, pick: () => this.setDir({ dirRole: r.k }) }, chip(st.dirRole === r.k))),
          styles: [{ key:'', label:{ en: L.dirAll, vi: L.dirAll } }].concat(styles)
            .map(x => Object.assign({ label: x.label[g] || x.label.en, pick: () => this.setDir({ dirStyle: x.key }) }, chip(st.dirStyle === x.key))),
          cities: [{ k:'', label: L.dirAll }].concat(CITY_LIST.map(c => ({ k:c.k, label:c[g] })))
            .map(c => Object.assign({ label: c.label, pick: () => this.setDir({ dirCity: c.k }) }, chip(st.dirCity === c.k))),
          toggles: [
            Object.assign({ label: L.dirAvailable, icon:'ph-bold ph-calendar-check', pick: () => this.setDir({ dirAvail: !st.dirAvail }) }, chip(st.dirAvail)),
            Object.assign({ label: L.dirUpcoming, icon:'ph-bold ph-microphone-stage', pick: () => this.setDir({ dirSoon: !st.dirSoon }) }, chip(st.dirSoon))
          ],
          cards: st.dirItems.map(a => ({
            name: a.name, initials: FF.initials(a.name), verified: a.verified,
            art: a.imageUrl ? 'url("' + a.imageUrl + '") center/cover no-repeat' : FF.genreArt((a.styles[0] && a.styles[0].genre) || 'EDM'),
            line: [a.roles.map(r => r.label[g] || r.label.en).join(' / '), a.basedIn ? (a.basedIn.label || {})[g] || a.basedIn.city : ''].filter(Boolean).join(' · '),
            styles: a.styles.slice(0, 3).map(x => x.label[g] || x.label.en).join(' · '),
            hasNext: !!a.nextShow,
            next: a.nextShow ? L.dirNext.replace('{t}', a.nextShow.title + ' · ' + a.nextShow.startsOn.split('-').slice(1).reverse().join('/') + (a.nextShow.cityLabel ? ' · ' + (a.nextShow.cityLabel[g] || '') : '')) : '',
            hasBooking: !!a.booking && a.booking.key !== 'unavailable', booking: a.booking ? a.booking.label[g] || a.booking.label.en : '', bookingFg: a.booking ? BOOKING_FG[a.booking.key] : '',
            open: () => this.openArtist(a.slug)
          })),
          empty: !st.dirBusy && st.dirItems.length === 0, emptyLabel: L.dirEmpty,
          moreShow: !!st.dirNext, moreLabel: L.dirMore, more: () => this.loadDirectory(true)
        };
      })(),
      goBack: () => this.goBack(),
      backLabel: L.back,

      screenTabs: tabDefs.map(t => ({
        label:t.label,
        bg: st.screen === t.k ? '#ABFF84' : 'transparent',
        fg: st.screen === t.k ? '#141514' : '#A5A493',
        go: () => { if (t.k === 'artists') this.openDirectory(); else this.setState({ screen:t.k }); }
      })),
      query: st.q, onQuery: (e) => this.refilter({ q: e.target.value }),

      statCards: [
        { k:'free', value: String(statFree.length), label: L.statFree, color:'#0AE448' },
        { k:'weekend', value: String(statWeekend.length), label: L.statWeekend, color:'#ABFF84' },
        { k:'venues', value: String(statVenueKeys.length), label: L.statVenues, color:'#ABFF84' }
      ].map(s => ({ value:s.value, label:s.label, color:s.color, hint: L.statCardHint, open: () => this.openStat(s.k) })),

      statAccent: statK === 'free' ? '#0AE448' : statK === 'venues' ? '#0AE448' : '#ABFF84',
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
              meta: (first.dist != null ? first.dist + ' km · ' : '') + list.map(e => e.title).slice(0, 2).join(' · '),
              hasTag: false, tag:'', tagBg:'transparent', tagBd:'transparent', tagFg:'#A5A493',
              stat: String(list.length), statFg:'#DFFFD1', statLabel: L.statEventsOn,
              cta: L.statOpenMap, ctaIcon:'ph-bold ph-arrow-right',
              open: () => this.openOnMap(first.id)
            };
          });
        }
        return (statK === 'free' ? statFree : statWeekend).map(e => ({
          title: e.title, art: e.art, icon: e.price === 0 ? 'ph-fill ph-ticket' : 'ph-fill ph-music-notes',
          meta: this.when(e) + ' · ' + e.venue + (e.dist != null ? ' · ' + e.dist + ' km' : ''),
          hasTag: e.price === 0 || e.soldOut,
          tag: e.soldOut ? L.soldOut : L.free,
          tagBg: e.soldOut ? 'rgba(255,135,9,.14)' : 'rgba(10,228,72,.14)',
          tagBd: e.soldOut ? 'rgba(255,135,9,.5)' : 'rgba(10,228,72,.5)',
          tagFg: e.soldOut ? '#FF8709' : '#0AE448',
          stat: e.hype >= 1000 ? (e.hype / 1000).toFixed(1) + 'K' : String(e.hype),
          statFg:'#FFFCE1', statLabel: L.statHype,
          cta: L.statOpenEvent, ctaIcon:'ph-bold ph-arrow-right',
          open: () => this.openEvent(e.id)
        }));
      })(),

      aboutFacts: [
        { value: vi1 ? '48.200' : '48,200', label: vi1 ? 'người đã xem sự kiện ở TP.HCM trong 30 ngày qua' : 'people browsed events in Ho Chi Minh City in the last 30 days', color:'#ABFF84' },
        { value: vi1 ? '2 giờ' : '2 hours', label: vi1 ? 'thời gian duyệt trung bình cho một tin mới' : 'median time to check and publish a new listing', color:'#ABFF84' },
        { value: '0₫', label: vi1 ? 'phí đặt vé — vé do nhà tổ chức bán' : 'booking fee — tickets are sold by the organiser', color:'#0AE448' }
      ],
      contactCards: [
        { title: L.abContactUsers, body: L.abContactUsersBody, icon:'ph-fill ph-chat-circle-dots', color:'#ABFF84', tint:'rgba(171,255,132,.13)',
          link:'hello@feestfinder.com', href:'mailto:hello@feestfinder.com', linkIcon:'ph-bold ph-envelope-simple', hasAction:false },
        { title: L.abContactOrg, body: L.abContactOrgBody, icon:'ph-fill ph-megaphone', color:'#0AE448', tint:'rgba(10,228,72,.14)',
          link:'organisers@feestfinder.com', href:'mailto:organisers@feestfinder.com', linkIcon:'ph-bold ph-envelope-simple', hasAction:false },
        { title: L.abContactBrand, body: L.abContactBrandBody, icon:'ph-fill ph-briefcase', color:'#DFFFD1', tint:'rgba(10,228,72,.14)',
          link:'partners@feestfinder.com', href:'mailto:partners@feestfinder.com', linkIcon:'ph-bold ph-envelope-simple',
          hasAction:true, actionLabel: L.abAdvertise, action: () => this.setState({ screen:'explore', adsOpen:true, adErr:'' }) }
      ],
      socialLinks: [
        { label:'Facebook', handle:'/festfinder.vn', href:'https://facebook.com/festfinder.vn', icon:'ph-fill ph-facebook-logo', color:'#00BAE2' },
        { label:'Instagram', handle:'@festfinder.vn', href:'https://instagram.com/festfinder.vn', icon:'ph-fill ph-instagram-logo', color:'#FEC5FB' },
        { label:'TikTok', handle:'@festfinder', href:'https://tiktok.com/@festfinder', icon:'ph-fill ph-tiktok-logo', color:'#FFFCE1' },
        { label:'Zalo', handle:'FeestFinder OA', href:'https://zalo.me/festfinder', icon:'ph-fill ph-chat-circle-text', color:'#ABFF84' }
      ],
      aboutMeta: [
        { label: L.abOffice, value:'48 Lê Lợi, Bến Nghé, Quận 1, TP.HCM' },
        { label: L.abHotline, value: vi1 ? '1900 8386 · đến 02:00 đêm lễ hội' : '1900 8386 · until 02:00 on festival nights' },
        { label: L.abHours, value: vi1 ? 'Thứ Hai – Thứ Bảy, 09:00 – 18:00' : 'Monday to Saturday, 09:00 – 18:00' }
      ],

      timeOptions: timeDefs.map(t => ({
        label:t.label, icon:t.icon, count: String(countFor(t.k)),
        bg: st.time === t.k && !st.q ? 'rgba(171,255,132,.14)' : 'transparent',
        bd: st.time === t.k && !st.q ? '#ABFF84' : 'rgba(255,252,225,.19)',
        fg: st.time === t.k && !st.q ? '#FFFCE1' : '#A5A493',
        countColor: st.time === t.k && !st.q ? '#ABFF84' : '#8C8B7D',
        pick: () => this.refilter({ time:t.k, q:'' })
      })),
      // The band under the headline: the genres in their hues, then the districts in outline.
      marquee: [0, 1].flatMap(() => [['fest', L.mqFest], ['edm', 'EDM'], ['live', L.mqLive], ['culture', L.mqCulture], ['brand', L.mqFree]]
        .map(([t, label]) => ({ tone: 'ff-t-' + t, label }))),
      marqueeAreas: [0, 1].flatMap(() => ['Quận 1', 'Thảo Điền', 'Quận 7', 'Thủ Đức', 'Quận 11', 'Quận 3'].map(label => ({ label }))),
      genreOptions: GENRES.map(n => {
        // Each genre wears its own hue; the chosen one is filled with it.
        const hue = n === 'All' ? '#FFFCE1' : FF.genreHue(n), on = st.genre === n;
        return {
          name: n === 'All' ? L.all : n,
          bg: on ? hue : 'transparent',
          bd: on ? hue : 'rgba(255,252,225,.19)',
          fg: on ? '#0E100F' : hue,
          pick: () => this.refilter({ genre:n })
        };
      }),
      priceOptions: priceDefs.map(p => ({
        label:p.label,
        bg: st.prices[p.k] ? 'rgba(171,255,132,.1)' : 'transparent',
        bd: st.prices[p.k] ? '#ABFF84' : 'rgba(255,252,225,.19)',
        fg: st.prices[p.k] ? '#FFFCE1' : '#A5A493',
        boxBd: st.prices[p.k] ? '#ABFF84' : 'rgba(255,252,225,.38)',
        boxBg: st.prices[p.k] ? '#ABFF84' : 'transparent',
        tick: st.prices[p.k] ? '1' : '0',
        pick: () => { const n = Object.assign({}, st.prices); n[p.k] = !n[p.k]; this.refilter({ prices:n }); }
      })),
      sortOptions: sortDefs.map(s => ({
        label:s.label,
        bg: st.sort === s.k ? '#ABFF84' : 'transparent',
        bd: st.sort === s.k ? '#ABFF84' : 'rgba(255,252,225,.19)',
        fg: st.sort === s.k ? '#141514' : '#A5A493',
        pick: () => this.setState({ sort:s.k })
      })),
      resetFilters: () => this.refilter({ time:'weekend', genre:'All', prices:{}, q:'', sort:'date' }),

      hero: heroEv ? Object.assign({}, this.card(heroEv, L), {
        badge: heroEv.badge ? heroEv.badge[g] : L.free,
        hypeLine: heroEv.hype.toLocaleString(vi1 ? 'vi-VN' : 'en-US') + ' ' + L.hypedPeople,
        cta: heroEv.price === 0 ? L.freeEntry : L.getTickets,
        buy: (ev) => { ev.stopPropagation(); this.buyTickets(heroEv, st.details[heroEv.id] || null, 'hero'); }
      }) : null,
      countLine: full.length + ' ' + (full.length === 1 && !vi1 ? 'event' : L.events) + (st.q ? ' · "' + st.q + '"' : ''),
      loading: st.loading, skeletons: [{}, {}, {}, {}, {}, {}],
      showGrid: !st.loading && full.length > 0,
      gridEmpty: !st.loading && full.length === 0,
      grid: grid.map(e => this.card(e, L)),
      loadMoreDisplay: full.length > st.limit ? 'block' : 'none',
      loadMore: () => this.setState({ limit: st.limit + 6 }),

      /* ---- every event, as a table, a grid or a map ---- */
      board: (() => {
        const on = (x) => ({ bg: x ? 'rgba(171,255,132,.14)' : 'rgba(25,25,25,.6)', bd: x ? '#ABFF84' : 'rgba(255,252,225,.19)', fg: x ? '#FFFCE1' : '#A5A493' });
        const upcoming = EVENTS.filter(e => !e.past);
        const inCity = (c) => upcoming.filter(e => c === 'all' || (e.city || 'ho-chi-minh') === c);
        // The API's answer for these filters; until it arrives, the listings the page opened with.
        const fromApi = !!st.board && this._boardKey === listQuery(st);
        const rows = fromApi ? st.board.filter(e => !e.past) : inCity(st.listCity)
          .filter(e => st.listTime === 'all' || e.tags.includes(st.listTime))
          .filter(e => st.listGenre === 'All' || e.genre === st.listGenre)
          .filter(e => !st.listStyle || (e.styles || []).includes(st.listStyle))
          .filter(e => !st.listType || e.eventType === st.listType);
        const key = { date: (e) => +e.dsD * 1e4 + (parseInt(e.time, 10) || 0), price: (e) => e.price, hype: (e) => e.hype }[st.listSort];
        rows.sort((a, b) => (key(a) - key(b)) * (st.listDesc ? -1 : 1));
        const facets = st.boardFacets;
        const cityCount = (k) => (facets ? (k === 'all' ? Object.keys(facets).reduce((n, c) => n + facets[c], 0) : facets[k] || 0) : inCity(k).length);
        const cityName = (c) => { const x = CITY_LIST.find(y => y.k === (c || 'ho-chi-minh')); return x ? x[g] : ''; };
        const sortBy = (k) => () => this.setState(st.listSort === k ? { listDesc: !st.listDesc } : { listSort: k, listDesc: k !== 'date' });
        const arrow = (k) => st.listSort === k ? (st.listDesc ? ' ↓' : ' ↑') : '';
        const status = (e) => e.soldOut ? { label: L.stSold, fg:'#FF8709', bg:'rgba(255,135,9,.12)' }
          : e.tags.includes('tonight') ? { label: L.stTonight, fg:'#0E100F', bg:'#ABFF84' }
          : e.badge ? { label: e.badge[g], fg:'#FFFCE1', bg:'rgba(255,252,225,.1)' }
          : e.price === 0 ? { label: L.stFree, fg:'#0AE448', bg:'rgba(10,228,72,.12)' }
          : { label: L.stOn, fg:'#A5A493', bg:'transparent' };
        const isMap = st.listView === 'map';
        const text = (loc, fallback) => (loc && (loc[g] || loc.vi || loc.en)) || fallback;
        // The drawer for the dot someone tapped.
        const sel = isMap && st.mapSel ? st.mapItems.find(x => x.id === st.mapSel) : null;
        const day = (iso) => { const p = String(iso || '').split('-').map(Number); const d = new Date(p[0], p[1] - 1, p[2]); return DOW[g][d.getDay()] + ' ' + p[2] + '/' + p[1]; };
        const conf = sel && sel.confidence;
        const note = st.mapTruncated ? L.mapMore.replace('{n}', String(st.mapItems.length)).replace('{t}', String(st.mapTotal))
          : st.mapReady && !st.mapBusy && !st.mapItems.length ? L.mapEmpty : '';
        return {
          table: st.listView === 'table', grid: st.listView === 'grid', mapView: isMap, empty: rows.length === 0 && !isMap,
          count: (fromApi && st.boardCursor ? st.boardTotal : rows.length) + ' ' + L.events,
          updated: L.listUpdated.replace('{t}', FF.hhmm(st.listAt)),
          added: st.listAdded ? L.listNew.replace('{n}', String(st.listAdded)) : '', hasAdded: st.listAdded > 0,
          more: !isMap && fromApi && !!st.boardCursor, moreLabel: L.loadMore, loadMore: () => this.loadBoard(true),
          views: [{ k:'table', label:L.listTable, icon:'ph-bold ph-rows' }, { k:'grid', label:L.listGrid, icon:'ph-bold ph-squares-four' }, { k:'map', label:L.listMap, icon:'ph-bold ph-map-trifold' }]
            .map(v => Object.assign({ label: v.label, icon: v.icon, pick: () => this.setState({ listView: v.k }) }, on(st.listView === v.k))),
          cities: [{ k:'all', label: L.listAll }].concat(CITY_LIST.map(c => ({ k: c.k, label: c[g] })))
            .map(c => Object.assign({ label: c.label + ' · ' + cityCount(c.k), pick: () => this.setState({ listCity: c.k, listAdded: 0, mapSel: null }) }, on(st.listCity === c.k))),
          times: [{ k:'all', label: L.listAllTime }, { k:'tonight', label: L.tonight }, { k:'weekend', label: L.weekend }, { k:'7days', label: L.next7 }, { k:'month', label: L.month }]
            .map(t => Object.assign({ label: t.label, pick: () => this.setState({ listTime: t.k }) }, on(st.listTime === t.k))),
          genres: GENRES.map(x => Object.assign({ label: x === 'All' ? L.listAll : x, pick: () => this.setState({ listGenre: x }) }, on(st.listGenre === x))),
          // Kinds of night and music styles: one of each can be on at once.
          styles: [{ kind:'', k:'', label: L.listAll }]
            .concat(TYPE_CHIPS.map(k => ({ kind:'type', k, label: text(TYPE_LABEL[k], k) })))
            .concat(STYLE_CHIPS.map(k => ({ kind:'style', k, label: text(STYLE_LABEL[k], k) })))
            .map(c => Object.assign({ label: c.label,
              pick: () => this.setState(c.kind === 'type' ? { listType: st.listType === c.k ? '' : c.k } : c.kind === 'style' ? { listStyle: st.listStyle === c.k ? '' : c.k } : { listType:'', listStyle:'' }) },
            on(c.kind === 'type' ? st.listType === c.k : c.kind === 'style' ? st.listStyle === c.k : !st.listType && !st.listStyle))),
          heads: [
            { label: L.colDate + arrow('date'), sort: sortBy('date'), cursor:'pointer' }, { label: L.colTime, sort: () => {}, cursor:'default' },
            { label: L.colEvent, sort: () => {}, cursor:'default' }, { label: L.colVenue, sort: () => {}, cursor:'default' },
            { label: L.colCity, sort: () => {}, cursor:'default' }, { label: L.colPrice + arrow('price'), sort: sortBy('price'), cursor:'pointer' },
            { label: L.colHype + arrow('hype'), sort: sortBy('hype'), cursor:'pointer' }, { label: L.colStatus, sort: () => {}, cursor:'default' }
          ],
          rows: isMap ? [] : rows.map(e => {
            const sx = status(e);
            return {
              date: DOW[g][e.dsD.getDay()] + ' ' + e.dsD.getDate() + '/' + (e.dsD.getMonth() + 1) + (+e.deD !== +e.dsD ? ' – ' + e.deD.getDate() + '/' + (e.deD.getMonth() + 1) : ''),
              time: e.time, title: e.title, genre: (e.styles || []).length ? text(STYLE_LABEL[e.styles[0]], e.genre) : e.genre, genreFg: FF.genreHue(e.genre),
              venue: e.venue, area: e.area, city: cityName(e.city),
              price: e.price === 0 ? L.free : this.short(e.price, e.currency), priceFg: e.price === 0 ? '#0AE448' : '#FFFCE1',
              hype: e.hype >= 1000 ? (e.hype / 1000).toFixed(1) + 'K' : String(e.hype),
              status: sx.label, stFg: sx.fg, stBg: sx.bg,
              open: () => this.openEvent(e.id)
            };
          }),
          cards: isMap ? [] : rows.map(e => Object.assign({}, this.card(e, L), { cityLine: cityName(e.city) + ' · ' + e.area })),
          map: {
            searchShow: st.mapDirty && st.mapReady && !st.mapBusy, search: () => this.mapSearch(), searchLabel: L.mapSearch,
            note, hasNote: !!note, failed: st.mapFailed, failedLabel: L.mapFailed,
            hasSel: !!sel,
            sel: sel ? {
              art: FF.artOf({ coverUrl: sel.coverUrl, genre: sel.genre, art: sel.art }),
              title: sel.title,
              when: day(sel.startsOn) + (sel.endsOn && sel.endsOn !== sel.startsOn ? ' – ' + day(sel.endsOn) : '') + (sel.startTime ? ' · ' + sel.startTime : ''),
              where: [sel.venue, text(sel.cityLabel, '')].filter(Boolean).join(' · '),
              styles: (sel.styles || []).slice(0, 3).map(k => ({ label: text(STYLE_LABEL[k], k), fg: FF.genreHue(sel.genre) })),
              conf: conf ? (conf.sourcesLine ? text(conf.sourcesLine, '') : conf.label === 'verified' || conf.label === 'highly_verified' ? text(conf.labelText, '') : '') : '',
              hasConf: !!(conf && (conf.sourcesLine || conf.label === 'verified' || conf.label === 'highly_verified')),
              price: sel.isFree ? L.free : L.from + ' ' + this.short(sel.priceFrom, sel.currency), priceFg: sel.isFree ? '#0AE448' : '#FFFCE1',
              open: () => this.openFromMap(sel.id), openLabel: L.mapOpen,
              close: () => { if (this._map) this._map.select(null); else this.setState({ mapSel: null }); }
            } : { art:'', title:'', when:'', where:'', styles:[], conf:'', hasConf:false, price:'', priceFg:'', open: () => {}, openLabel:'', close: () => {} }
          }
        };
      })(),

      toast: st.toast
    };
  }
}
