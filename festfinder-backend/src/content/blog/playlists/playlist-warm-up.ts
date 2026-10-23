import { playlistPost, type Playlist } from './shared.ts';
import { PLAYLIST_MEDIA_A } from './media-a.ts';

/** A mood (kind mood): the opening hour, deep, organic and melodic, evergreen. */
const warmUp: Playlist = {
  key: 'playlists/playlist-warm-up',
  slug: 'playlist-warm-up',
  kind: 'mood',
  title: {
    vi: 'Playlist warm-up: 10 bài deep và melodic cho giờ mở màn',
    en: 'Warm-up playlist: 10 deep and melodic opening tracks',
  },
  excerpt: {
    vi: 'Playlist warm-up cho giờ đầu đêm: deep house, organic và melodic từ Kiasmos, Bonobo, Four Tet, Lane 8, Ben Böhmer, RÜFÜS DU SOL, Âme và Bicep, năng lượng tăng dần.',
    en: 'Warm-up tracks for the first hour: deep, organic and melodic house from Kiasmos, Bonobo, Four Tet, Lane 8, Ben Böhmer, RÜFÜS DU SOL, Âme and Bicep, by rising energy.',
  },
  cover: PLAYLIST_MEDIA_A.warmUp,
  styles: ['deep-house', 'organic-house', 'melodic-techno', 'progressive-house'],
  style: 'deep-house',
  lead: {
    vi: '**Playlist warm-up** là những bài cho giờ đầu tiên của đêm: chậm vừa đủ để người mới đến không bị dội, đủ groove để họ bắt đầu nhún. Mười bài deep house, organic và melodic, từ ambient techno của Kiasmos đến "Glue" của Bicep, sắp theo năng lượng tăng dần như một set mở màn thật.\n\n*Danh sách bền vững, cập nhật ngày 23/10/2026.*',
    en: '**A warm-up playlist** is music for the first hour of the night: slow enough not to overwhelm people as they arrive, with enough groove to start them moving. Ten deep, organic and melodic tracks, from Kiasmos\'s ambient techno to Bicep\'s "Glue", ordered by rising energy like a real opening set.\n\n*An evergreen list, last updated 23 October 2026.*',
  },
  tracks: [
    {
      youtube: 'HbsbieBog1c', artist: 'Kiasmos', title: 'Blurred', channel: 'Erased Tapes', year: 2017, label: 'Erased Tapes',
      style: { vi: 'Ambient techno, minimal', en: 'Ambient techno, minimal' },
      note: {
        vi: 'Bộ đôi Faroe–Iceland gồm Ólafur Arnalds và Janus Rasmussen phát hành EP Blurred năm 2017 trên Erased Tapes; PopMatters gọi đây là một trong những bản phát hành điện tử giàu cảm xúc nhất năm. Piano, dây và một nhịp techno rất nhẹ: bài để phòng còn vắng mà vẫn có không khí.',
        en: 'The Faroese-Icelandic duo of Ólafur Arnalds and Janus Rasmussen released the Blurred EP in 2017 on Erased Tapes; PopMatters called it one of the most emotionally engaging electronic releases of the year. Piano, strings and the gentlest techno pulse: a track for an empty room that still needs atmosphere.',
      },
    },
    {
      youtube: 'S0Q4gqBUs7c', artist: 'Bonobo', title: 'Kerala', channel: 'Bonobo', label: 'Ninja Tune',
      style: { vi: 'Downtempo, organic house', en: 'Downtempo, organic house' },
      note: {
        vi: 'Một trong các single của Migration, album thứ sáu của Simon Green, phát hành tháng 1/2017 trên Ninja Tune và được thu chủ yếu trên laptop thay vì phòng thu. Giọng hát được cắt nhỏ trên một nhịp gãy mềm: "Kerala" kéo năng lượng lên một chút mà vẫn để mọi người nói chuyện được.',
        en: 'One of the singles from Migration, Simon Green\'s sixth album, released in January 2017 on Ninja Tune and recorded mostly on laptops rather than in a studio. Chopped vocal samples over a soft broken beat: "Kerala" lifts the energy a notch while people can still talk.',
      },
    },
    {
      youtube: 'CUYboWbVe0A', artist: 'Four Tet', title: 'Two Thousand and Seventeen', channel: 'Four Tet', year: 2017,
      style: { vi: 'Electronica, deep house', en: 'Electronica, deep house' },
      note: {
        vi: 'Từ New Energy, album thứ chín của Kieran Hebden, phát hành tháng 9/2017. Một giai điệu gảy lặp lại trên một nhịp chậm, ấm và không vội: kiểu bài khiến người đứng ở quầy bar quay lại nhìn DJ. Giữ âm lượng vừa phải, để giai điệu tự dẫn dắt.',
        en: 'From New Energy, Kieran Hebden\'s ninth Four Tet album, released in September 2017. A looping plucked melody over a slow, warm, unhurried beat: the kind of track that makes people at the bar turn towards the booth. Keep the volume moderate and let the melody lead.',
      },
    },
    {
      youtube: 'CARHyGAsv6Y', artist: 'Lane 8 ft. POLIÇA', title: 'Brightest Lights', channel: 'This Never Happened', year: 2020, label: 'This Never Happened',
      style: { vi: 'Melodic house, progressive', en: 'Melodic house, progressive' },
      note: {
        vi: 'Bài chủ đề của Brightest Lights, album thứ ba của Lane 8, phát hành ngày 10/1/2020 trên label riêng This Never Happened. Giọng hát của POLIÇA trên một bản progressive mềm, các lớp synth mở dần: đây là lúc set bắt đầu có nhịp bốn phách rõ ràng mà chưa cần đẩy mạnh.',
        en: 'The title track of Brightest Lights, Lane 8\'s third album, released on 10 January 2020 on his own This Never Happened label. POLIÇA\'s vocal over soft progressive house, the synth layers opening up gradually: the point where the set finds a clear four-to-the-floor without pushing yet.',
      },
    },
    {
      youtube: 'aVTalm2VjDc', artist: 'Ben Böhmer', title: 'Beyond Beliefs', channel: 'Ben Böhmer', year: 2021, label: 'Anjunadeep',
      style: { vi: 'Melodic house', en: 'Melodic house' },
      note: {
        vi: 'Single năm 2021 của nhà sản xuất người Đức trên Anjunadeep, label mà anh đã ra hai album. Ben Böhmer được biết với melodic house và indie electronica, và "Beyond Beliefs" là ví dụ rõ nhất: bassline tròn, hợp âm buồn, cao trào đến chậm. Đặt ở giữa giờ warm-up khi sàn đã có người.',
        en: 'A 2021 single from the German producer on Anjunadeep, the label behind two of his albums. Ben Böhmer is known for melodic house and indie electronica, and "Beyond Beliefs" shows it plainly: a rounded bassline, melancholy chords, a slow climb. Place it mid-warm-up, once the floor has people on it.',
      },
    },
    {
      youtube: 'oM-XKbdwkrw', artist: 'Yotto', title: 'Hyperfall', channel: 'Anjunadeep', year: 2018, label: 'Anjunadeep',
      style: { vi: 'Progressive house', en: 'Progressive house' },
      note: {
        vi: 'Bài chủ đề của Hyperfall, album đầu tay của nhà sản xuất Phần Lan Yotto, phát hành ngày 7/9/2018 trên Anjunadeep. Ngắn, rõ và có một giai điệu dễ nhớ, đây là bài chuyển từ phần nghe sang phần nhảy: năng lượng tăng lên nhưng vẫn mềm.',
        en: 'The title track of Hyperfall, the Finnish producer Yotto\'s debut album, released on 7 September 2018 on Anjunadeep. Short, clear and carried by a memorable melody, it is the turn from listening to dancing: the energy rises, but it stays soft.',
      },
    },
    {
      youtube: 'Tx9zMFodNtA', artist: 'RÜFÜS DU SOL', title: 'Innerbloom', channel: 'RÜFÜS DU SOL', year: 2015,
      style: { vi: 'Melodic house, alternative dance', en: 'Melodic house, alternative dance' },
      note: {
        vi: 'Phát hành ngày 20/11/2015 làm single thứ ba của album Bloom (2016). Bài được chứng nhận bạch kim ở Úc năm 2017 và đứng thứ năm trong Hottest 100 of the Decade của Triple J năm 2020. Gần mười phút, dựng lên rất chậm: một bài cho người kiên nhẫn, và cho cả phòng hát theo khi giọng hát trở lại.',
        en: 'Released on 20 November 2015 as the third single from the album Bloom (2016). It was certified platinum in Australia in 2017 and placed fifth in Triple J\'s Hottest 100 of the Decade in 2020. Nearly ten minutes with a very slow build: a track for the patient, and for the whole room to sing when the vocal returns.',
      },
    },
    {
      youtube: 'N6uFc451SG0', artist: 'Âme', title: 'Rej', channel: 'Innervisions', label: 'Innervisions (IV02)',
      style: { vi: 'Deep house', en: 'Deep house' },
      note: {
        vi: 'Bản phát hành thứ hai của Innervisions, label Berlin mà bộ đôi Đức Âme cùng sáng lập. "Rej" là một bài deep house kinh điển: bassline thôi miên, bộ gõ khô và một vòng giai điệu lặp gần tám phút. Đây là lúc warm-up thật sự có groove, sẵn sàng để phòng nóng lên.',
        en: 'The second release on Innervisions, the Berlin label the German duo Âme co-founded. "Rej" is a deep house classic: a hypnotic bassline, dry percussion and a melodic loop for almost eight minutes. This is where the warm-up finds a real groove, ready for the room to heat up.',
      },
    },
    {
      youtube: 'A7ZxRs45tTg', artist: 'BICEP', title: 'Glue', channel: 'BICEP', year: 2017, label: 'Ninja Tune',
      style: { vi: 'Breakbeat, deep house', en: 'Breakbeat, deep house' },
      note: {
        vi: 'Từ album đầu tay cùng tên của Bicep, phát hành ngày 1/9/2017 trên Ninja Tune. Nhịp breakbeat chậm, pad hoài niệm thời rave và một câu hát cắt nhỏ: "Glue" là bài nhiều người nhận ra ngay từ vài giây đầu. Khi bạn chơi nó, warm-up đã gần xong.',
        en: 'From Bicep\'s self-titled debut album, released on 1 September 2017 on Ninja Tune. A slow breakbeat, rave-nostalgic pads and a chopped vocal: "Glue" is a track many people recognise within seconds. When you play it, the warm-up is nearly done.',
      },
    },
    {
      youtube: 'Q04ILDXe3QE', artist: 'Jon Hopkins', title: 'Open Eye Signal', channel: 'Pitchfork', year: 2013, label: 'Domino',
      style: { vi: 'Melodic techno', en: 'Melodic techno' },
      note: {
        vi: 'Từ Immunity, album thứ tư của Jon Hopkins, phát hành ngày 3/6/2013 trên Domino và được đề cử Mercury Prize năm đó. Một bài techno dài, nhịp đều và một đường bass cứ siết dần: dùng nó để trao lại phòng cho DJ chính ở mức năng lượng ngay dưới đỉnh, đúng việc của người warm-up.',
        en: 'From Immunity, Jon Hopkins\'s fourth album, released on 3 June 2013 on Domino and shortlisted for that year\'s Mercury Prize. A long, steady techno track with a bassline that keeps tightening: use it to hand the room to the headliner just below the peak, which is exactly the warm-up DJ\'s job.',
      },
    },
  ],
  method: {
    vi: 'Một set warm-up tốt không phải là set chậm, mà là set biết dừng đúng chỗ. Toolroom Academy khuyên bắt đầu ở tốc độ chậm hơn để người mới đến thấy dễ chịu; Magnetic Magazine khuyên DJ mở màn đừng chơi những bài lớn nhất tuần mà hãy tìm bài khiến người nghe bất ngờ; Dubspot nhắc rằng việc của bạn là chuẩn bị phòng cho DJ chính, không phải cướp đỉnh của họ. Chúng tôi chọn mười bài theo đúng ba nguyên tắc đó: không bài nào là anthem sân khấu chính, mỗi bài có một chi tiết nghe được (giai điệu, giọng hát hoặc groove), và thứ tự đi từ ambient đến melodic techno, năng lượng tăng dần, kết thúc ngay dưới đỉnh. Mỗi video là bản chính thức trên kênh của nghệ sĩ, label hoặc nơi công bố, đã kiểm tra phát được qua oEmbed của YouTube. Chúng tôi không ghi BPM vì các nguồn chúng tôi đọc không nêu; nếu bạn mix, hãy để phần mềm phân tích từng bài.',
    en: 'A good warm-up set is not a slow set; it is a set that knows where to stop. Toolroom Academy advises starting at a slower tempo so the room feels inviting to people as they arrive; Magnetic Magazine tells opening DJs not to play the week\'s biggest records but to dig for tracks that surprise; Dubspot reminds you that your job is to prepare the room for the headliner, not to steal their peak. We picked ten tracks on those three rules: no main-stage anthems, each track with something to listen for (a melody, a voice or a groove), and an order that runs from ambient to melodic techno with rising energy, ending just below the peak. Every video is the official upload on the artist\'s, label\'s or publisher\'s channel, checked to play through YouTube\'s oEmbed. We give no BPM because the sources we read do not state it; if you mix, let your software analyse each track.',
  },
  notes: {
    vi: 'Warm-up là phần bị đánh giá thấp nhất của một đêm nhạc. Người đến sớm thường là người nghe kỹ nhất, và họ nhớ lâu nhất DJ đã chọn bài nào lúc phòng còn trống. Playlist này cũng hợp để nghe ở nhà buổi tối, khi làm việc hay trên đường đến club. Nếu bạn đang học DJ, hãy thử nối các bài theo thứ tự trên: chúng đủ gần nhau về cảm xúc để tập chuyển bài dài và mượt.',
    en: 'The warm-up is the most underrated part of a night. The people who come early are often the most attentive listeners, and they remember longest what the DJ chose while the room was still empty. This list also works at home in the evening, while working or on the way to the club. If you are learning to DJ, try mixing the tracks in this order: they sit close enough emotionally to practise long, smooth transitions.',
  },
  related: [
    { slug: 'playlist-peak-time', line: { vi: 'Playlist peak time · phần tiếp theo của đêm', en: 'Peak-time playlist · the next part of the night' } },
    { slug: 'playlist-house', line: { vi: 'Playlist house · nền tảng của dance music', en: 'House playlist · the foundation of dance music' } },
    { slug: 'hoc-dj-tu-so-0', line: { vi: 'Học DJ từ số 0 · từ controller đến set đầu tiên', en: 'Learn to DJ from zero · from the controller to your first set' } },
    { slug: 'playlist-edm', line: { vi: 'Playlist EDM · mọi danh sách của FeestFinder', en: 'EDM playlists · every FeestFinder list' } },
  ],
  facts: [
    { label: { vi: 'Tâm trạng', en: 'Mood' }, value: { vi: 'Mở màn, giờ đầu của đêm', en: 'Opening, the first hour of the night' } },
    { label: { vi: 'Dòng nhạc', en: 'Styles' }, value: { vi: 'Deep house, organic, melodic house, melodic techno', en: 'Deep house, organic, melodic house, melodic techno' } },
    { label: { vi: 'Số bài', en: 'Tracks' }, value: { vi: '10, sắp theo năng lượng tăng dần', en: '10, ordered by rising energy' } },
    { label: { vi: 'Hợp với', en: 'Best for' }, value: { vi: 'Set mở màn, buổi tối ở nhà, tập chuyển bài dài', en: 'Opening sets, evenings at home, practising long blends' } },
    { label: { vi: 'Loại', en: 'Type' }, value: { vi: 'Danh sách bền vững, xem lại mỗi năm', en: 'Evergreen, reviewed every year' } },
    { label: { vi: 'Cập nhật', en: 'Updated' }, value: { vi: '23/10/2026', en: '23 October 2026' } },
  ],
  faq: [
    { q: { vi: 'Nên chơi gì trong set warm-up?', en: 'What should I play in a warm-up set?' }, a: { vi: 'Deep house, organic và melodic house có groove nhưng chưa bùng nổ, bắt đầu chậm hơn DJ chính và tăng dần, tránh các anthem lớn nhất. Ví dụ: Bonobo, Lane 8, Âme, Bicep.', en: 'Deep, organic and melodic house with groove but no explosions, starting slower than the headliner and building gradually, avoiding the biggest anthems. For example Bonobo, Lane 8, Âme, Bicep.' } },
    { q: { vi: 'Set warm-up nên kết thúc ở mức năng lượng nào?', en: 'Where should a warm-up set end?' }, a: { vi: 'Ngay dưới đỉnh: phòng đã đông và đang nhảy, nhưng còn chỗ để DJ chính đẩy lên. Kết thúc bằng bài cao trào nhất là lỗi phổ biến nhất.', en: 'Just below the peak: the room is full and dancing, with space left for the headliner to push. Ending on the biggest track is the most common mistake.' } },
    { q: { vi: 'Danh sách này có BPM không?', en: 'Does this list give BPMs?' }, a: { vi: 'Không, vì các nguồn chúng tôi đọc không nêu BPM. Phần mềm DJ phân tích tốc độ từng bài chính xác hơn mọi danh sách.', en: 'No, because the sources we read do not state them. DJ software analyses each track\'s tempo more accurately than any list.' } },
    { q: { vi: 'Nghe playlist này ở đâu?', en: 'Where can I listen to this playlist?' }, a: { vi: 'Ngay trong bài: mỗi bài có player YouTube chính thức chỉ tải khi bấm phát. Tất cả đều có trên Spotify và Apple Music.', en: 'Right here: each track has its official YouTube player, loading only when you press play. All of them are on Spotify and Apple Music.' } },
    { q: { vi: 'Danh sách có được cập nhật không?', en: 'Is this list updated?' }, a: { vi: 'Đây là danh sách bền vững; chúng tôi xem lại mỗi năm và thay bài khi video chính thức không còn phát được.', en: 'It is an evergreen list; we review it every year and replace a track when its official video stops playing.' } },
  ],
  sources: [
    { title: 'The art of the warm-up (Danny Rhys)', url: 'https://toolroomacademy.com/features/the-art-of-the-warm-up-danny-rhys/', publisher: 'Toolroom Academy' },
    { title: 'Artist advice: etiquette for opening DJs', url: 'https://magneticmag.com/2019/03/artist-advice-etiquette-for-opening-djs/', publisher: 'Magnetic Magazine' },
    { title: 'The art of DJing: tips for opening DJs', url: 'https://blog.dubspot.com/tips-for-opening-djs', publisher: 'Dubspot' },
    { title: 'Migration (Bonobo album)', url: 'https://en.wikipedia.org/wiki/Migration_(Bonobo_album)', publisher: 'Wikipedia' },
    { title: 'Innerbloom', url: 'https://en.wikipedia.org/wiki/Innerbloom', publisher: 'Wikipedia' },
    { title: 'Immunity (Jon Hopkins album)', url: 'https://en.wikipedia.org/wiki/Immunity_(Jon_Hopkins_album)', publisher: 'Wikipedia' },
    { title: 'Kiasmos', url: 'https://en.wikipedia.org/wiki/Kiasmos', publisher: 'Wikipedia' },
    { title: 'New Energy (Four Tet) review', url: 'https://pitchfork.com/reviews/albums/four-tet-new-energy/', publisher: 'Pitchfork' },
  ],
};

export const playlistWarmUp = playlistPost(warmUp);
