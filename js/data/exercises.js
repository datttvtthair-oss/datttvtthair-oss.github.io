/*
 * Thư viện bài tập. Chỉ chứa dữ liệu — giao diện đọc từ window.EXERCISES.
 *  - Ảnh + hoạt hình: người mẫu 3D (img/3d/<id>-*.jpg, js/data/anim.js). Bài có art: hình vẽ thay ảnh.
 *  - video / videoVi / photos: dữ liệu cũ (YouTube, ảnh người thật) — web không còn dùng.
 *  - alts: { id } trỏ tới bài khác trong thư viện (bấm được), { text } là gợi ý chữ.
 */
window.EXERCISES = {

  /* ───────────────────────── CHÂN ───────────────────────── */

  'goblet-squat': {
    vi: 'Squat ôm tạ trước ngực', en: 'Goblet Squat', photos: true,
    video: 'gCESNsDsbqk', videoVi: 'yIiZiZxIbqU',
    muscles: 'Đùi trước, mông, đùi trong; core giữ lưng thẳng',
    equip: '1 tạ đơn (dựng đứng) hoặc kettlebell',
    cue: 'Ôm tạ sát ngực, ngồi thẳng xuống giữa hai gót',
    load: 'Thử tạ đơn 8–12 kg. Hiệp đầu là hiệp thử: còn dư hơn 4 lần thì tăng 2 kg, còn dư dưới 2 lần thì giảm.',
    steps: [
      'Đứng rộng bằng vai hoặc hơn một chút, mũi chân hơi mở ra ngoài (15–30°).',
      'Ôm một đầu tạ đơn sát ngực, khuỷu tay hướng xuống.',
      'Hít sâu, siết bụng, đẩy hông ra sau một chút rồi ngồi thẳng xuống; gối đi theo hướng mũi chân.',
      'Xuống đến khi đùi gần song song sàn (thấp hơn cũng được nếu lưng vẫn thẳng và gót không nhấc).',
      'Đạp cả bàn chân xuống sàn để đứng lên, ngực vẫn mở.'
    ],
    breath: 'Hít vào và giữ hơi khi đi xuống; thở ra khi đã qua đoạn khó lúc đứng lên.',
    mistakes: ['Gối sụp vào trong khi đứng lên', 'Nhấc gót, dồn trọng tâm lên mũi chân', 'Cúi gập lưng, tạ rời khỏi ngực', 'Xuống quá nhanh rồi nảy ở đáy'],
    stop: ['Đau nhói ở gối hoặc lưng dưới', 'Không giữ được lưng thẳng ở 2 lần cuối → giảm tạ', 'Chóng mặt khi đứng lên'],
    alts: [{ id: 'leg-press', why: 'nếu khó giữ thăng bằng hoặc lưng chưa vững' }, { text: 'Box squat: ngồi chạm ghế/bục rồi đứng lên — giúp học độ sâu an toàn' }]
  },

  'db-rdl': {
    vi: 'Gập hông tạ đơn (Romanian Deadlift)', en: 'Dumbbell Romanian Deadlift', photos: true,
    video: 'hQgFixeXdZo', videoVi: 'nE4-LcQ9px4', videoViNote: 'Video tiếng Việt dùng đòn tạ — cùng nguyên lý gập hông.',
    muscles: 'Đùi sau, mông, cơ dựng sống lưng',
    equip: '2 tạ đơn',
    cue: 'Đẩy hông ra sau như đóng cửa bằng mông',
    load: 'Thử 2 tạ 8–12 kg mỗi tay. Cảm giác căng phải nằm ở đùi sau, không phải ở lưng.',
    steps: [
      'Đứng rộng bằng hông, cầm tạ trước đùi, gối hơi chùng (15–20°) và giữ nguyên góc gối suốt động tác.',
      'Siết bụng, kéo vai ra sau nhẹ, lưng thẳng tự nhiên.',
      'Đẩy hông ra sau, thân nghiêng về trước; tạ trượt sát đùi rồi sát ống chân.',
      'Dừng khi đùi sau căng rõ (thường tạ ở khoảng giữa ống chân) — không cần chạm sàn.',
      'Siết mông, đẩy hông về trước để đứng thẳng; không ngả người ra sau.'
    ],
    breath: 'Hít vào trước khi gập xuống, thở ra khi đứng thẳng lên.',
    mistakes: ['Cong lưng để với tạ xuống thấp', 'Khuỵu gối nhiều thành động tác squat', 'Tạ xa người, kéo căng lưng dưới', 'Ngửa người ra sau ở đỉnh'],
    stop: ['Đau lưng dưới (khác với căng đùi sau) → giảm tạ, giảm biên độ', 'Tê hoặc đau lan xuống chân → dừng hẳn'],
    alts: [{ id: 'trap-bar-deadlift', why: 'dễ giữ lưng thẳng hơn nếu có thanh trap bar' }, { text: 'Tập gập hông với gậy dọc lưng (không tạ) để học động tác trước' }]
  },

  'leg-press': {
    vi: 'Đạp đùi trên máy', en: 'Leg Press', photos: true,
    video: 'p5dCqF7wWUw', videoVi: '7XRpflRwrIs',
    muscles: 'Đùi trước, mông',
    equip: 'Máy leg press (45° hoặc ngồi ngang)',
    cue: 'Lưng dưới luôn áp ghế, không khoá thẳng gối',
    load: 'Máy mỗi phòng một khác. Bắt đầu với bàn trượt không tải (hoặc mức nhẹ nhất), thêm 10–20 kg mỗi lần đến khi còn dư 2–3 lần.',
    steps: [
      'Ngồi sát ghế, lưng và hông áp vào đệm. Đặt chân rộng bằng vai, ở giữa bàn đạp.',
      'Mở chốt an toàn, duỗi chân nhưng không khoá thẳng gối.',
      'Hạ bàn đạp từ từ đến khi gối gập khoảng 90°, hoặc dừng sớm hơn nếu hông sắp nhấc khỏi ghế.',
      'Đạp lên bằng cả bàn chân, gối đi theo hướng mũi chân.',
      'Xong hiệp: khoá chốt an toàn rồi mới rời chân.'
    ],
    breath: 'Hít vào khi hạ xuống, thở ra khi đạp lên.',
    mistakes: ['Hạ quá sâu làm hông cuộn, lưng dưới rời ghế', 'Khoá thẳng gối ở trên', 'Đạp bằng mũi chân, nhấc gót', 'Gối sụp vào trong'],
    stop: ['Đau gối nhói', 'Lưng dưới bị kéo rời ghế → giảm biên độ'],
    alts: [{ id: 'goblet-squat' }, { text: 'Hack squat máy hoặc Smith squat nếu máy leg press bận' }]
  },

  'bulgarian-split-squat': {
    vi: 'Squat một chân, chân sau gác ghế', en: 'Bulgarian Split Squat', photos: true,
    video: 'SkNsa3eBwLA',
    muscles: 'Đùi trước, mông (chân trước); thăng bằng, ổn định hông',
    equip: 'Ghế phẳng; 2 tạ đơn khi đã vững',
    cue: 'Thân hơi nghiêng trước, hạ thẳng xuống như thang máy',
    load: 'Tuần đầu tập không tạ. Khi đã vững: 2 tạ 4–8 kg. Bài này rất mỏi — chọn tạ nhẹ hơn bạn nghĩ.',
    steps: [
      'Đứng trước ghế khoảng một sải chân, gác mu bàn chân sau lên ghế.',
      'Đặt chân trước đủ xa để khi hạ xuống gót không nhấc và gối không bị dồn quá xa.',
      'Siết bụng, hạ người thẳng xuống đến khi đùi trước gần song song sàn; gối sau hướng xuống sàn.',
      'Đạp bằng cả bàn chân trước để đứng lên. Làm hết số lần một bên rồi đổi chân.'
    ],
    breath: 'Hít vào khi xuống, thở ra khi lên.',
    mistakes: ['Đứng quá gần ghế làm gối trước bị dồn', 'Gối trước sụp vào trong', 'Đẩy người lên bằng chân sau', 'Vội nên mất thăng bằng — làm chậm lại, có thể vịn cột'],
    stop: ['Đau gối trước nhói', 'Chuột rút hông hoặc đùi chân gác ghế'],
    alts: [{ id: 'step-up' }, { text: 'Split squat hai chân trên sàn (không gác ghế) — dễ giữ thăng bằng hơn' }]
  },

  'seated-leg-curl': {
    vi: 'Móc đùi sau (máy ngồi)', en: 'Seated Leg Curl', photos: true,
    video: 't9sTSr-JYSs',
    muscles: 'Đùi sau',
    equip: 'Máy seated leg curl',
    cue: 'Kéo gót về dưới ghế, trả về thật chậm',
    load: 'Bắt đầu nấc nhẹ (khoảng 15–25 kg trên cọc tạ); tăng 1 nấc khi làm đủ số lần ở mọi hiệp.',
    steps: [
      'Chỉnh ghế để khớp gối thẳng hàng trục xoay của máy; đệm chân nằm trên cổ chân (trên gót giày).',
      'Hạ thanh đè đùi xuống sát đùi để giữ chặt người.',
      'Gập gối, kéo đệm xuống và về sau hết mức có thể.',
      'Dừng 1 nhịp, rồi trả về chậm trong 2–3 giây.'
    ],
    breath: 'Thở ra khi kéo, hít vào khi trả về.',
    mistakes: ['Không chỉnh trục gối → dễ đau gối', 'Nhấc hông khỏi ghế để kéo', 'Thả về nhanh, va cọc tạ'],
    stop: ['Chuột rút đùi sau → dừng, giãn nhẹ', 'Đau phía sau gối'],
    alts: [{ id: 'lying-leg-curl' }, { text: 'Leg curl với bóng hoặc dây kháng lực nếu máy bận' }]
  },

  'standing-calf-raise': {
    vi: 'Nhón bắp chân đứng', en: 'Standing Calf Raise', photos: true,
    video: 'SVtg-1loH4c', videoVi: 'hWGSoyRx8d0',
    muscles: 'Bắp chân (cơ bụng chân)',
    equip: 'Máy calf raise đứng, Smith machine, hoặc bậc + tạ đơn',
    cue: 'Xuống sâu, dừng 1 giây ở đáy, nhón hết cỡ',
    load: 'Bắt đầu bằng trọng lượng cơ thể trên bậc, sau đó lên máy ở mức nhẹ. Bắp chân chịu được nhiều lần — ưu tiên biên độ đầy đủ.',
    steps: [
      'Đặt nửa trước bàn chân lên mép bậc, gối thẳng nhưng không khoá cứng.',
      'Hạ gót xuống thấp nhất có thể, dừng 1 giây để bắp chân giãn.',
      'Nhón lên cao nhất bằng ngón cái và ngón trỏ, dừng 1 giây.',
      'Lặp lại chậm, không nảy.'
    ],
    breath: 'Thở đều; thở ra khi nhón lên.',
    mistakes: ['Nảy nhanh ở đáy, biên độ ngắn', 'Khuỵu gối để đẩy', 'Bàn chân lật ra ngoài'],
    stop: ['Đau gân gót (gân Achilles) → dừng, không cố', 'Chuột rút'],
    alts: [{ id: 'seated-calf-raise' }, { text: 'Nhón gót trên máy leg press' }]
  },

  'pallof-press': {
    vi: 'Pallof Press (chống xoay thân)', en: 'Pallof Press', photos: true,
    video: '5_8d8vHgZvU', videoVi: 'A15rdPx4A2w',
    muscles: 'Core: cơ bụng chéo, cơ bụng sâu — giữ thân không bị xoay',
    equip: 'Máy cáp (tay cầm đơn) hoặc dây kháng lực',
    cue: 'Đẩy tay thẳng ra, thân như cột không xoay',
    load: 'Cáp 5–10 kg: đủ để phải gồng chống xoay nhưng người vẫn đứng yên.',
    steps: [
      'Đặt ròng rọc ngang ngực, đứng nghiêng 90° so với máy, cách máy khoảng một sải tay.',
      'Hai tay ôm tay cầm sát giữa ngực, chân rộng bằng vai, gối hơi chùng.',
      'Siết bụng và mông, đẩy hai tay thẳng ra trước ngực.',
      'Giữ 2 giây, không để thân xoay về phía máy, rồi thu tay về.',
      'Làm đủ số lần rồi quay mặt đổi bên.'
    ],
    breath: 'Thở ra khi đẩy tay ra, hít vào khi thu về; không nín thở lâu.',
    mistakes: ['Thân xoay theo dây cáp', 'Đứng quá gần nên không có lực kéo', 'Nhún vai, gồng cổ'],
    stop: ['Đau lưng dưới → giảm tạ, đứng gần máy hơn'],
    alts: [{ id: 'dead-bug' }, { id: 'side-plank' }]
  },

  'cmj': {
    vi: 'Bật nhảy có nhún', en: 'Countermovement Jump (CMJ)', photos: true,
    video: 'sLvArswhYMQ',
    muscles: 'Toàn chân, mông — sức bật',
    equip: 'Không cần dụng cụ; sàn phẳng, không trơn',
    cue: 'Nhún nhanh, vung tay, bật cao, tiếp đất êm',
    load: 'Chỉ trọng lượng cơ thể. Mỗi lần nhảy hết sức nhưng nghỉ đủ — chất lượng quan trọng hơn số lượng.',
    steps: [
      'Đứng rộng bằng hông, tay thả lỏng.',
      'Nhún nhanh xuống khoảng 1/4 squat, đồng thời vung hai tay ra sau.',
      'Lập tức bật lên cao nhất có thể, vung tay lên trên.',
      'Tiếp đất bằng nửa trước bàn chân rồi cả bàn, gối hơi khuỵu và không sụp vào trong; đứng vững 2 giây.',
      'Nghỉ 15–20 giây giữa các lần nhảy trong một hiệp, không nhảy liên tục.'
    ],
    breath: 'Hít vào khi nhún, thở ra khi bật lên.',
    mistakes: ['Nhún quá sâu, quá chậm', 'Tiếp đất cứng, gối thẳng', 'Gối sụp vào trong khi tiếp đất', 'Nhảy khi chân đã mỏi'],
    stop: ['Đau gối hoặc gân gót khi tiếp đất', 'Độ cao giảm rõ → dừng hiệp'],
    alts: [{ text: 'Bật lên hộp thấp (box jump) — giảm lực tiếp đất' }, { text: 'Squat jump tại chỗ, tay chống hông' }]
  },

  'trap-bar-deadlift': {
    vi: 'Deadlift thanh lục giác', en: 'Trap Bar Deadlift', photos: true,
    video: '1jC_nqcSCp8',
    muscles: 'Mông, đùi trước, đùi sau, lưng — sức mạnh toàn thân',
    equip: 'Thanh trap bar (hex bar) + bánh tạ',
    cue: 'Đứng giữa thanh, đẩy sàn ra xa',
    load: 'Bắt đầu với thanh trống (khoảng 20–25 kg tuỳ phòng tập), thêm 5–10 kg mỗi hiệp khởi động. Chưa có thanh hoặc chưa vững lưng: thay bằng Gập hông tạ đơn.',
    steps: [
      'Đứng giữa thanh, chân rộng bằng hông; cầm giữa tay cầm (dùng tay cầm cao nếu có).',
      'Đẩy hông ra sau, khuỵu gối xuống cầm thanh; lưng thẳng, ngực mở, mắt nhìn sàn phía trước.',
      'Siết lưng như "kẹp nách", hít sâu, gồng bụng.',
      'Đẩy sàn bằng cả bàn chân để đứng thẳng; hông và vai đi lên cùng lúc.',
      'Đứng thẳng, siết mông, không ngả ra sau. Hạ thanh có kiểm soát theo đường ngược lại.'
    ],
    breath: 'Hít sâu, gồng bụng trước mỗi lần kéo; thở ra ở đỉnh; hít lại trước lần tiếp theo.',
    mistakes: ['Cong lưng khi kéo', 'Hông bật lên trước, vai còn ở dưới', 'Giật thanh khỏi sàn', 'Thả rơi thanh mỗi lần'],
    stop: ['Đau lưng dưới nhói', 'Lưng cong ở hai lần cuối → giảm tạ ngay'],
    alts: [{ id: 'db-rdl', why: 'phương án an toàn cho người mới' }, { text: 'Kettlebell deadlift (tạ ấm đặt giữa hai chân)' }]
  },

  'step-up': {
    vi: 'Bước lên bục với tạ đơn', en: 'Dumbbell Step-Up', photos: true,
    video: '7AtIjR-QqVA',
    muscles: 'Mông, đùi trước; thăng bằng một chân',
    equip: 'Bục hoặc ghế chắc chắn (cao ngang dưới gối), 2 tạ đơn',
    cue: 'Đạp bằng chân trên bục, chân dưới chỉ đi theo',
    load: 'Tuần đầu không tạ, sau đó 2 tạ 4–8 kg. Bục cao khoảng 30–40 cm.',
    steps: [
      'Đặt cả bàn chân phải lên bục, thân hơi nghiêng trước.',
      'Đạp qua gót chân trên bục để đứng thẳng lên; chân sau không bật nhún.',
      'Đứng vững trên bục 1 nhịp.',
      'Hạ chân sau xuống chậm, có kiểm soát.',
      'Làm hết số lần một chân rồi đổi chân.'
    ],
    breath: 'Thở ra khi bước lên, hít vào khi hạ xuống.',
    mistakes: ['Bật nhún chân dưới để lên', 'Gối trên bục sụp vào trong', 'Bục quá cao so với khả năng'],
    stop: ['Đau gối', 'Mất thăng bằng liên tục → bỏ tạ, hạ bục'],
    alts: [{ id: 'bulgarian-split-squat' }, { text: 'Lunge lùi (reverse lunge)' }]
  },

  'hip-thrust': {
    vi: 'Đẩy hông', en: 'Hip Thrust', photos: true,
    video: 'LM8XHLYJoYs', videoVi: '9NOrj13Xi_k',
    muscles: 'Mông, đùi sau',
    equip: 'Ghế phẳng + thanh đòn có đệm (hoặc tạ đơn / máy hip thrust)',
    cue: 'Cằm hơi cúi, đẩy hông lên đến khi thân phẳng như mặt bàn',
    load: 'Thử thanh đòn trống 20 kg có đệm, hoặc 1 tạ đơn 10–15 kg đặt trên hông. Máy hip thrust cũng được.',
    steps: [
      'Ngồi trên sàn, lưng trên (ngang bả vai) tựa mép ghế; thanh đòn có đệm đặt ngang nếp hông.',
      'Chân rộng bằng hông, đặt sao cho ở đỉnh động tác cẳng chân gần thẳng đứng.',
      'Cằm hơi cúi, siết bụng, đẩy hông lên đến khi thân và đùi thành một đường thẳng.',
      'Siết mông 1–2 giây ở đỉnh, rồi hạ hông xuống chậm.'
    ],
    breath: 'Hít vào ở dưới, thở ra khi đẩy lên.',
    mistakes: ['Ưỡn lưng dưới thay vì duỗi hông', 'Chân đặt quá xa → đùi sau chuột rút', 'Ngửa đầu ra sau'],
    stop: ['Đau lưng dưới → giảm tạ, cúi cằm, siết bụng hơn', 'Thanh đè đau xương hông → thêm đệm'],
    alts: [{ text: 'Glute bridge trên sàn (nằm ngửa đẩy hông)' }, { text: 'Máy hip thrust / glute drive' }]
  },

  'lying-leg-curl': {
    vi: 'Móc đùi sau nằm sấp (máy)', en: 'Lying Leg Curl', photos: true,
    video: 'jxctD6fL_FQ', videoVi: '8whsd-n6XbI',
    muscles: 'Đùi sau',
    equip: 'Máy lying leg curl',
    cue: 'Hông ép sát ghế, kéo gót về mông',
    load: 'Thử 10–20 kg trên cọc tạ.',
    steps: [
      'Nằm sấp, đầu gối ở ngay mép ghế (thẳng trục máy), đệm chân nằm trên cổ chân.',
      'Nắm tay cầm, ép hông xuống ghế.',
      'Gập gối kéo đệm về phía mông.',
      'Trả về chậm 2–3 giây, không để tạ chạm cọc.'
    ],
    breath: 'Thở ra khi kéo, hít vào khi trả về.',
    mistakes: ['Nhấc hông lên để kéo', 'Thả về nhanh', 'Đặt gối lệch trục máy'],
    stop: ['Chuột rút đùi sau', 'Đau phía sau gối'],
    alts: [{ id: 'seated-leg-curl' }, { text: 'Leg curl với bóng (stability ball)' }]
  },

  'seated-calf-raise': {
    vi: 'Nhón bắp chân ngồi (máy)', en: 'Seated Calf Raise', photos: true,
    video: '6O5hh1rBtx8', videoVi: '3rr-c0_kERA',
    muscles: 'Bắp chân sâu (cơ dép) — quan trọng cho bật nhảy và chạy',
    equip: 'Máy seated calf raise (hoặc ghế + tạ đặt trên đùi)',
    cue: 'Hạ gót sâu, dừng 1 giây, nhón hết cỡ',
    load: 'Thử 10–20 kg. Ưu tiên biên độ đầy đủ.',
    steps: [
      'Ngồi, đặt nửa trước bàn chân lên bậc, đệm đè ngay trên gối.',
      'Mở chốt, hạ gót xuống thấp nhất, dừng 1 giây.',
      'Nhón lên cao nhất, dừng 1 giây.',
      'Lặp lại chậm. Xong hiệp: khoá chốt.'
    ],
    breath: 'Thở đều; thở ra khi nhón lên.',
    mistakes: ['Nảy nhanh, biên độ ngắn', 'Quên khoá chốt khi xong hiệp'],
    stop: ['Đau gân gót'],
    alts: [{ id: 'standing-calf-raise' }, { text: 'Ngồi ghế, tạ đơn đặt trên đùi, nhón gót trên bậc' }]
  },

  /* ─────────────────────── THÂN TRÊN ─────────────────────── */

  'db-bench-press': {
    vi: 'Đẩy ngực tạ đơn ghế phẳng', en: 'Dumbbell Bench Press', photos: true,
    video: 'VmB1G1K7v94', videoVi: 'vpcYwHvbD7k',
    muscles: 'Ngực, vai trước, tay sau',
    equip: 'Ghế phẳng, 2 tạ đơn',
    cue: 'Bả vai kẹp xuống ghế, hạ tạ ngang giữa ngực',
    load: 'Thử 2 tạ 8–12 kg. Tạ đơn an toàn khi tập một mình: hết sức thì hạ tạ sang hai bên.',
    steps: [
      'Ngồi mép ghế, đặt tạ lên đùi. Nằm xuống và dùng đùi đẩy tạ lên ngang ngực.',
      'Kéo bả vai ra sau và xuống, bàn chân đặt chắc trên sàn.',
      'Đẩy tạ lên trên ngực; hai tạ gần chạm nhau nhưng không đập vào nhau.',
      'Hạ chậm đến khi tạ ngang ngực; khuỷu tạo góc khoảng 45–70° với thân (không dang ngang 90°).',
      'Đẩy lên lại. Xong hiệp: đưa tạ về ngực, co gối và ngồi dậy cùng tạ.'
    ],
    breath: 'Hít vào khi hạ, thở ra khi đẩy lên.',
    mistakes: ['Dang khuỷu ngang vai → dễ đau vai', 'Nảy tạ ở dưới, mất kiểm soát', 'Thả tạ rơi tự do khi xong hiệp', 'Nhấc mông khỏi ghế'],
    stop: ['Đau nhói khớp vai trước', 'Tay run mất kiểm soát → dừng hiệp, hạ tạ an toàn'],
    alts: [{ id: 'machine-chest-press', why: 'máy ổn định hơn, hợp người mới' }, { text: 'Hít đất tay chống ghế nếu không có tạ' }]
  },

  'lat-pulldown': {
    vi: 'Kéo xô trước ngực', en: 'Lat Pulldown', photos: true,
    video: 'trZQjegcRx0', videoVi: 'ZXb5HGjK1f8',
    muscles: 'Xô (lưng rộng), lưng giữa, tay trước',
    equip: 'Máy lat pulldown, thanh dài',
    cue: 'Kéo khuỷu tay xuống túi quần, ngực hướng lên thanh',
    load: 'Thử 25–35 kg. Phải ngả người nhiều hoặc giật mới kéo được → quá nặng.',
    steps: [
      'Chỉnh đệm đùi để đùi bị chặn chắc. Cầm thanh rộng hơn vai một chút, lòng bàn tay hướng trước.',
      'Ngồi xuống, ngực mở, người ngả ra sau rất nhẹ (10–15°).',
      'Kéo bả vai xuống trước, rồi kéo thanh về ngực trên; khuỷu đi xuống và ra sau.',
      'Dừng 1 nhịp khi thanh gần chạm ngực trên.',
      'Trả thanh lên chậm đến khi tay gần duỗi thẳng, cảm nhận lưng giãn.'
    ],
    breath: 'Thở ra khi kéo xuống, hít vào khi trả lên.',
    mistakes: ['Kéo ra sau gáy (dễ đau vai)', 'Đung đưa người lấy đà', 'Chỉ kéo bằng tay, nhún vai lên tai', 'Không trả hết biên độ'],
    stop: ['Đau vai hoặc khuỷu nhói', 'Tê tay'],
    alts: [{ id: 'neutral-pulldown' }, { text: 'Hít xà có máy trợ lực (assisted pull-up)' }]
  },

  'seated-cable-row': {
    vi: 'Kéo cáp ngồi', en: 'Seated Cable Row', photos: true,
    video: 'vwHG9Jfu4sw', videoVi: 'TZGAx3yBkMc',
    muscles: 'Lưng giữa, xô, vai sau, tay trước',
    equip: 'Máy cáp ngồi, tay cầm chữ V',
    cue: 'Ngực cao, kéo tay cầm về rốn, ép bả vai',
    load: 'Thử 25–35 kg. Thân đứng yên, không ngả ra sau lấy đà.',
    steps: [
      'Ngồi, đặt chân lên bàn đạp, gối hơi chùng. Cầm tay cầm, lưng thẳng, ngực mở.',
      'Kéo tay cầm về phía bụng trên/rốn, khuỷu tay đi sát thân.',
      'Ép hai bả vai lại 1 nhịp ở cuối.',
      'Duỗi tay về trước chậm, để bả vai trượt ra trước nhưng lưng vẫn thẳng.'
    ],
    breath: 'Thở ra khi kéo, hít vào khi trả về.',
    mistakes: ['Ngả người ra sau rồi giật về', 'Cong lưng ở đầu động tác', 'Nhún vai, kéo bằng tay'],
    stop: ['Đau lưng dưới → giảm tạ, giữ thân yên', 'Đau khuỷu'],
    alts: [{ id: 'chest-supported-row' }, { text: 'Chèo tạ đơn một tay tì ghế (one-arm dumbbell row)' }]
  },

  'incline-db-press': {
    vi: 'Đẩy ngực trên tạ đơn (ghế dốc)', en: 'Incline Dumbbell Press', photos: true,
    video: 'IP4oeKh1Sd4', videoVi: 'V8oPgko2alE',
    muscles: 'Ngực trên, vai trước, tay sau',
    equip: 'Ghế chỉnh dốc khoảng 30°, 2 tạ đơn',
    cue: 'Ghế 30°, hạ tạ ngang ngực trên',
    load: 'Thử 2 tạ 6–10 kg (nhẹ hơn ghế phẳng khoảng 20%).',
    steps: [
      'Chỉnh ghế dốc khoảng 30° (2–3 nấc). Dốc quá cao sẽ thành bài vai.',
      'Lên tạ như bài ghế phẳng: đặt tạ trên đùi rồi ngả lưng.',
      'Bả vai kéo ra sau và xuống, đẩy tạ lên phía trên ngực trên.',
      'Hạ chậm đến ngang ngực trên, khuỷu khoảng 45–60° so với thân.',
      'Đẩy lên, không đập hai tạ vào nhau.'
    ],
    breath: 'Hít vào khi hạ, thở ra khi đẩy.',
    mistakes: ['Ghế dốc quá 45°', 'Dang khuỷu ngang vai', 'Ưỡn lưng quá mức, nhấc mông'],
    stop: ['Đau vai trước nhói'],
    alts: [{ id: 'incline-machine-press' }, { text: 'Đẩy ngực trên với máy Smith ghế dốc' }]
  },

  'lateral-raise': {
    vi: 'Nâng tạ đơn sang ngang', en: 'Dumbbell Lateral Raise', photos: true,
    video: 'PzsMitRdI_8', videoVi: 'KHTf70_IiUw',
    muscles: 'Vai giữa — tạo bề ngang cho vai',
    equip: '2 tạ đơn nhẹ',
    cue: 'Dẫn bằng khuỷu, nâng ra ngang, dừng ở tầm vai',
    load: 'Thử 2 tạ 3–5 kg. Phải đung đưa người mới nâng được → quá nặng.',
    steps: [
      'Đứng thẳng, gối hơi chùng, tạ ở hai bên đùi, thân nghiêng trước rất nhẹ.',
      'Khuỷu hơi cong, nâng tạ sang ngang và hơi ra trước.',
      'Dừng khi tay ngang vai (không cao hơn).',
      'Hạ chậm trong 2–3 giây.'
    ],
    breath: 'Thở ra khi nâng, hít vào khi hạ.',
    mistakes: ['Nhún vai lên tai, dùng cơ cầu vai', 'Lấy đà bằng thân', 'Nâng cao quá vai', 'Thả tạ rơi nhanh'],
    stop: ['Đau nhói trong khớp vai khi nâng → giảm tạ, nâng thấp hơn'],
    alts: [{ id: 'cable-lateral-raise' }, { text: 'Máy nâng vai ngang (lateral raise machine)' }]
  },

  'face-pull': {
    vi: 'Kéo cáp về mặt', en: 'Face Pull', photos: true,
    video: 'rep-qVOkqgk', videoVi: 'y0opXRM2UX4',
    muscles: 'Vai sau, lưng trên, nhóm xoay vai — giữ vai khoẻ',
    equip: 'Máy cáp, tay cầm dây thừng',
    cue: 'Kéo dây về trán, tách hai tay, khuỷu cao',
    load: 'Cáp 7,5–15 kg. Nhẹ, kiểm soát, cảm nhận vai sau.',
    steps: [
      'Đặt ròng rọc ngang trán hoặc cao hơn một chút, gắn dây thừng.',
      'Cầm hai đầu dây (ngón cái hướng về phía bạn), lùi lại cho căng dây, đứng chắc.',
      'Kéo dây về phía trán/mắt; khuỷu cao ngang vai và tách hai đầu dây ra hai bên tai.',
      'Dừng 1 nhịp, ép bả vai, rồi trả về chậm.'
    ],
    breath: 'Thở ra khi kéo, hít vào khi trả về.',
    mistakes: ['Kéo về cổ/ngực, khuỷu thấp', 'Ngả người ra sau', 'Tạ quá nặng nên giật'],
    stop: ['Đau trước vai hoặc khuỷu'],
    alts: [{ id: 'reverse-pec-deck' }, { text: 'Kéo dây kháng lực ra hai bên (band pull-apart)' }]
  },

  'machine-chest-press': {
    vi: 'Đẩy ngực trên máy', en: 'Machine Chest Press', photos: true,
    video: 'sqNwDkUU_Ps', videoVi: 'saiWPVjGD0M',
    muscles: 'Ngực, vai trước, tay sau',
    equip: 'Máy chest press',
    cue: 'Tay cầm ngang giữa ngực, đẩy ra không khoá khuỷu',
    load: 'Thử 15–30 kg trên cọc tạ. Máy ổn định nên dễ học — vẫn dừng khi còn dư 2–3 lần.',
    steps: [
      'Chỉnh ghế để tay cầm ngang giữa ngực (không ngang vai).',
      'Ngồi sát lưng ghế, bả vai kéo ra sau, chân đặt chắc.',
      'Đẩy tay cầm ra trước đến gần thẳng tay, không khoá khuỷu.',
      'Trả về chậm đến khi ngực giãn, không để tạ chạm cọc.'
    ],
    breath: 'Thở ra khi đẩy, hít vào khi trả về.',
    mistakes: ['Ghế quá thấp/cao làm tay cầm sai vị trí', 'Vai nhô ra trước khi đẩy', 'Khoá khuỷu, thả về nhanh'],
    stop: ['Đau vai trước'],
    alts: [{ id: 'db-bench-press' }, { id: 'incline-machine-press' }]
  },

  'chest-supported-row': {
    vi: 'Chèo tạ đơn tì ngực ghế dốc', en: 'Chest-Supported Row', photos: true,
    video: 'H75im9fAUMc', videoVi: 'MaEJYiJsDIo',
    muscles: 'Lưng giữa, xô, vai sau',
    equip: 'Ghế dốc 30–45° + 2 tạ đơn (hoặc máy chèo có đệm ngực / T-bar)',
    cue: 'Ngực tì ghế, kéo khuỷu về hông',
    load: 'Thử 2 tạ 8–12 kg. Ngực tì ghế nên lưng dưới được nghỉ.',
    steps: [
      'Chỉnh ghế dốc 30–45°, nằm sấp, ngực tì vào đệm, chân chống sàn.',
      'Tay buông thẳng cầm tạ, lòng bàn tay hướng vào nhau.',
      'Kéo khuỷu về phía hông, ép bả vai lại ở cuối.',
      'Hạ tạ chậm đến khi tay thẳng, vai giãn ra trước.'
    ],
    breath: 'Thở ra khi kéo, hít vào khi hạ.',
    mistakes: ['Nhấc ngực khỏi ghế để giật tạ', 'Nhún vai', 'Kéo quá ngắn'],
    stop: ['Đau khuỷu hoặc vai'],
    alts: [{ id: 'seated-cable-row' }, { text: 'Máy chèo lưng có đệm ngực (machine row)' }]
  },

  'db-shoulder-press': {
    vi: 'Đẩy vai tạ đơn ngồi', en: 'Seated Dumbbell Shoulder Press', photos: true,
    video: 'rO_iEImwHyo', videoVi: 'lc6BOWanS6Y',
    muscles: 'Vai trước + giữa, tay sau, lưng trên',
    equip: 'Ghế có tựa dựng gần thẳng, 2 tạ đơn',
    cue: 'Tạ ngang tai, đẩy thẳng lên trên đầu',
    load: 'Thử 2 tạ 6–10 kg.',
    steps: [
      'Chỉnh tựa ghế gần thẳng (75–85°). Ngồi sát lưng ghế, chân chắc trên sàn.',
      'Đưa tạ lên ngang tai, khuỷu hơi ra trước thân (không dang ngang hẳn).',
      'Siết bụng, đẩy tạ thẳng lên đến gần thẳng tay.',
      'Hạ chậm về ngang tai/cằm.'
    ],
    breath: 'Thở ra khi đẩy, hít vào khi hạ.',
    mistakes: ['Ưỡn lưng mạnh để đẩy', 'Hạ tạ quá thấp gây đau vai', 'Hai tay đẩy lệch nhau'],
    stop: ['Đau nhói vai', 'Đau lưng dưới vì ưỡn → giảm tạ'],
    alts: [{ text: 'Máy đẩy vai (machine shoulder press)' }, { text: 'Landmine press một tay nếu đẩy thẳng đầu bị đau vai' }]
  },

  'reverse-pec-deck': {
    vi: 'Bay vai sau trên máy', en: 'Reverse Pec Deck', photos: true,
    video: 'JL8nHvZcAK8',
    muscles: 'Vai sau, lưng trên',
    equip: 'Máy pec deck / rear delt',
    cue: 'Tay gần thẳng, mở rộng ra sau như ôm một vòng lớn',
    load: 'Thử 10–20 kg. Nhẹ và chậm.',
    steps: [
      'Ngồi quay mặt vào lưng ghế, chỉnh ghế để tay cầm ngang vai.',
      'Chỉnh tay cầm về vị trí sau cùng (chế độ vai sau). Cầm tay cầm, khuỷu hơi cong.',
      'Mở hai tay ra sau theo vòng cung đến khi tay ngang thân.',
      'Dừng 1 nhịp rồi trả về chậm.'
    ],
    breath: 'Thở ra khi mở tay, hít vào khi trả về.',
    mistakes: ['Ép bả vai quá mạnh nên lưng làm thay vai sau', 'Nhún vai', 'Giật tạ'],
    stop: ['Đau vai trước hoặc trong khớp vai'],
    alts: [{ id: 'face-pull' }, { text: 'Bay vai sau tạ đơn cúi người' }]
  },

  'biceps-curl': {
    vi: 'Cuốn tạ đơn tay trước', en: 'Dumbbell Biceps Curl', photos: true,
    video: 'XE_pHwbst04',
    muscles: 'Tay trước (biceps), cẳng tay',
    equip: '2 tạ đơn',
    cue: 'Khuỷu ghim sát sườn, chỉ cẳng tay di chuyển',
    load: 'Thử 2 tạ 5–8 kg.',
    steps: [
      'Đứng thẳng, tạ hai bên, lòng bàn tay hướng trước.',
      'Giữ khuỷu cố định cạnh thân, cuốn tạ lên đến ngang vai.',
      'Siết tay trước 1 nhịp ở đỉnh.',
      'Hạ chậm 2–3 giây đến khi tay gần thẳng.'
    ],
    breath: 'Thở ra khi cuốn lên, hít vào khi hạ.',
    mistakes: ['Đung đưa thân lấy đà', 'Khuỷu đẩy ra trước', 'Hạ quá nhanh, chỉ làm nửa biên độ'],
    stop: ['Đau khuỷu tay'],
    alts: [{ id: 'cable-curl' }, { text: 'Cuốn tạ búa (hammer curl) nếu đau cổ tay' }]
  },

  'triceps-pushdown': {
    vi: 'Ép cáp tay sau', en: 'Triceps Pushdown', photos: true,
    video: '2-LAMcpzODU', videoVi: 'MMvZGNBzgZI',
    muscles: 'Tay sau (triceps)',
    equip: 'Máy cáp cao, thanh thẳng hoặc dây thừng',
    cue: 'Khuỷu ghim sát sườn, ép thẳng tay xuống',
    load: 'Thử 10–20 kg.',
    steps: [
      'Đứng trước ròng rọc cao, cầm thanh/dây, người hơi nghiêng trước.',
      'Khuỷu sát hai bên sườn, cẳng tay bắt đầu ngang sàn hoặc cao hơn một chút.',
      'Đẩy xuống đến khi tay thẳng hoàn toàn, siết tay sau.',
      'Trả lên chậm đến khi cẳng tay khoảng ngang sàn; khuỷu không dịch chuyển.'
    ],
    breath: 'Thở ra khi đẩy xuống, hít vào khi trả lên.',
    mistakes: ['Khuỷu bay ra trước hoặc ra ngoài', 'Dùng vai và thân đè xuống', 'Biên độ quá ngắn'],
    stop: ['Đau khuỷu tay'],
    alts: [{ text: 'Duỗi tay sau trên đầu với dây cáp (overhead extension)' }, { text: 'Chống ghế (bench dip) nhẹ nếu cáp bận' }]
  },

  'incline-machine-press': {
    vi: 'Đẩy ngực trên bằng máy', en: 'Incline Machine Press', photos: true,
    video: 'ig0NyNlSce4',
    muscles: 'Ngực trên, vai trước, tay sau',
    equip: 'Máy incline chest press (cọc tạ hoặc gắn bánh)',
    cue: 'Bả vai kẹp, đẩy theo đúng quỹ đạo của máy',
    load: 'Thử 15–30 kg (cọc tạ) hoặc 5–10 kg mỗi bên (máy gắn bánh).',
    steps: [
      'Chỉnh ghế để tay cầm ngang ngực trên.',
      'Ngồi sát lưng ghế, bả vai kéo ra sau, chân chắc.',
      'Đẩy tay cầm lên/ra trước đến gần thẳng tay.',
      'Trả về chậm đến khi ngực giãn, không để tạ chạm.'
    ],
    breath: 'Thở ra khi đẩy, hít vào khi trả về.',
    mistakes: ['Ghế sai độ cao', 'Nhô vai ra trước', 'Khoá khuỷu'],
    stop: ['Đau vai trước'],
    alts: [{ id: 'incline-db-press' }, { id: 'machine-chest-press' }]
  },

  'neutral-pulldown': {
    vi: 'Kéo xô tay cầm song song', en: 'Neutral-Grip Lat Pulldown', photos: true,
    video: 'E1FK9APxk54',
    muscles: 'Xô, lưng giữa, tay trước',
    equip: 'Máy pulldown, tay cầm chữ V hoặc thanh tay cầm song song',
    cue: 'Kéo khuỷu sát sườn xuống dưới, ngực hướng lên',
    load: 'Thử 25–35 kg. Cầm song song thường dễ chịu cho vai.',
    steps: [
      'Gắn tay cầm song song, chỉnh đệm đùi, ngồi chắc.',
      'Tay duỗi thẳng, lòng bàn tay hướng vào nhau, ngực mở.',
      'Kéo tay cầm về ngực trên, khuỷu đi sát thân xuống dưới.',
      'Dừng 1 nhịp, trả lên chậm đến gần thẳng tay.'
    ],
    breath: 'Thở ra khi kéo, hít vào khi trả lên.',
    mistakes: ['Ngả người quá nhiều', 'Nhún vai', 'Giật thanh'],
    stop: ['Đau vai hoặc khuỷu'],
    alts: [{ id: 'lat-pulldown' }, { text: 'Hít xà trợ lực, tay cầm song song' }]
  },

  'cable-lateral-raise': {
    vi: 'Nâng vai ngang bằng cáp', en: 'Cable Lateral Raise', photos: true,
    video: 'qitQHqNZbeM',
    muscles: 'Vai giữa',
    equip: 'Máy cáp thấp, tay cầm đơn',
    cue: 'Kéo cáp ra ngang, tay ngang vai là dừng',
    load: 'Thử 2,5–5 kg. Cáp giữ lực đều suốt động tác nên nặng hơn cảm giác.',
    steps: [
      'Đặt ròng rọc thấp nhất. Đứng nghiêng, tay ở xa máy cầm tay cầm (dây cáp chạy qua trước người).',
      'Tay còn lại vịn máy, người hơi nghiêng ra xa máy.',
      'Khuỷu hơi cong, nâng tay ra ngang đến khi ngang vai.',
      'Hạ chậm 2–3 giây. Làm đủ số lần rồi đổi tay.'
    ],
    breath: 'Thở ra khi nâng, hít vào khi hạ.',
    mistakes: ['Nhún vai', 'Nâng cao quá vai', 'Xoay thân để kéo'],
    stop: ['Đau trong khớp vai'],
    alts: [{ id: 'lateral-raise' }, { text: 'Máy nâng vai ngang' }]
  },

  'cable-curl': {
    vi: 'Cuốn cáp tay trước', en: 'Cable Biceps Curl', photos: true,
    video: 'NFzTWp2qpiE',
    muscles: 'Tay trước',
    equip: 'Máy cáp thấp, thanh thẳng/EZ hoặc tay cầm',
    cue: 'Khuỷu đứng yên, cuốn lên và siết 1 nhịp',
    load: 'Thử 10–15 kg.',
    steps: [
      'Đặt ròng rọc thấp, cầm thanh, lòng bàn tay hướng lên.',
      'Đứng thẳng cách máy nửa bước, khuỷu sát sườn.',
      'Cuốn thanh lên đến ngang ngực, siết 1 nhịp.',
      'Hạ chậm đến khi gần thẳng tay.'
    ],
    breath: 'Thở ra khi cuốn, hít vào khi hạ.',
    mistakes: ['Ngả người ra sau', 'Khuỷu đưa ra trước', 'Hạ quá nhanh'],
    stop: ['Đau khuỷu hoặc cổ tay'],
    alts: [{ id: 'biceps-curl' }, { text: 'Cuốn tạ búa (hammer curl)' }]
  },

  'dead-bug': {
    vi: 'Dead bug (giữ core nằm ngửa)', en: 'Dead Bug', photos: true,
    video: 'GbSC02oU3To', videoVi: 'WETokpTyvcA',
    muscles: 'Core sâu, cơ bụng; giữ lưng dưới ổn định',
    equip: 'Thảm',
    cue: 'Lưng dưới ép sàn suốt bài, duỗi tay chân đối bên thật chậm',
    load: 'Không tạ. Khi đã dễ: duỗi chậm hơn, hoặc cầm tạ đơn nhẹ 2–4 kg.',
    steps: [
      'Nằm ngửa, tay đưa thẳng lên trần, hông và gối gập 90° (cẳng chân song song sàn).',
      'Thở ra, ép lưng dưới xuống thảm, siết bụng.',
      'Từ từ duỗi tay phải ra sau đầu và chân trái ra trước, gần chạm sàn — lưng dưới vẫn ép sàn.',
      'Thu về rồi đổi bên. Mỗi bên tính là 1 lần.'
    ],
    breath: 'Thở ra dài khi duỗi tay chân, hít vào khi thu về.',
    mistakes: ['Lưng dưới cong lên khỏi sàn', 'Làm nhanh', 'Nín thở'],
    stop: ['Đau lưng dưới → giảm biên độ duỗi'],
    alts: [{ id: 'pallof-press' }, { text: 'Plank thẳng tay 20–30 giây' }]
  },

  'side-plank': {
    vi: 'Plank nghiêng', en: 'Side Plank', photos: true,
    video: 'NXr4Fw8q60o', videoVi: 'lNLD-lsmQCQ',
    muscles: 'Cơ bụng chéo, cơ hông bên — giúp ổn định khi đổi hướng',
    equip: 'Thảm',
    cue: 'Đầu – hông – chân thành một đường thẳng',
    load: 'Bắt đầu 20 giây mỗi bên. Quá khó: chống gối thay vì bàn chân.',
    steps: [
      'Nằm nghiêng, khuỷu tay ngay dưới vai, hai chân duỗi chồng lên nhau (hoặc chân trên đặt trước).',
      'Siết bụng, nâng hông lên đến khi người thẳng từ đầu đến chân.',
      'Giữ đủ thời gian, không để hông võng xuống.',
      'Đổi bên.'
    ],
    breath: 'Thở đều, chậm, không nín thở.',
    mistakes: ['Hông võng xuống hoặc đẩy ra sau', 'Khuỷu không nằm dưới vai', 'Nín thở'],
    stop: ['Đau vai bên chống → chuyển sang chống gối, giảm thời gian'],
    alts: [{ id: 'pallof-press' }, { text: 'Plank nghiêng chống gối' }]
  },

  /* ──────────────────── KHỞI ĐỘNG / PHỤC HỒI ──────────────────── */

  'gym-warmup': {
    vi: 'Khởi động trước buổi gym', en: 'Dynamic Warm-up', photos: true, kind: 'drill',
    video: 'LKSC_KujZ4g',
    muscles: 'Toàn thân — làm nóng cơ, khớp hông, vai, cổ chân',
    equip: 'Không cần dụng cụ (thêm 3–5 phút xe đạp hoặc máy chạy nếu có)',
    cue: 'Nóng người, hơi ra mồ hôi là đủ',
    load: 'Bài đầu tiên của buổi: làm thêm 1–2 hiệp khởi động nhẹ (khoảng 50% rồi 75% mức tạ chính, 5–8 lần).',
    steps: [
      '3–5 phút xe đạp hoặc đi bộ dốc nhẹ.',
      'Làm theo video: xoay khớp, lunge kèm xoay thân, chạm mũi chân, mở vai.',
      'Vào bài đầu tiên với 1–2 hiệp khởi động nhẹ trước khi vào hiệp chính.'
    ],
    breath: 'Thở đều.',
    mistakes: ['Bỏ khởi động vì vội', 'Giãn cơ tĩnh giữ lâu ngay trước khi tập nặng'],
    stop: ['Đau khớp ngay khi khởi động → đổi bài hoặc nghỉ hôm nay'],
    alts: [{ text: 'Thiếu thời gian: 5 phút đạp xe + hiệp khởi động nhẹ cho từng bài chính' }]
  },

  'stretching': {
    vi: 'Giãn cơ sau tập', en: 'Post-workout Stretch', photos: true, kind: 'drill',
    video: 'IjH_8pdybfs',
    muscles: 'Đùi sau, đùi trước, hông, bắp chân, ngực, vai, lưng',
    equip: 'Thảm',
    cue: 'Giữ mỗi tư thế 30–45 giây, thở chậm, căng nhẹ chứ không đau',
    steps: [
      'Làm theo video ngay sau buổi tập hoặc buổi tối.',
      'Ưu tiên những vùng vừa tập và hông, bắp chân (dùng nhiều khi chơi bóng).',
      'Giãn tới mức căng nhẹ, không nhói.'
    ],
    breath: 'Thở ra chậm để thả lỏng sâu hơn.',
    mistakes: ['Nhún nảy khi giãn', 'Giãn đến mức đau'],
    stop: ['Đau nhói hoặc tê bì'],
    alts: [{ id: 'mobility' }]
  },

  'mobility': {
    vi: 'Vận động khớp cho vận động viên', en: 'Athlete Mobility Routine', photos: true, kind: 'drill',
    video: 'E197ZKakWGI',
    muscles: 'Hông, cổ chân, cột sống ngực, vai',
    equip: 'Thảm',
    cue: 'Chủ động, chậm, có kiểm soát',
    steps: [
      'Làm theo video (khoảng 10 phút).',
      'Dùng vào Chủ nhật, hoặc trước buổi bóng rổ khi thấy người cứng.'
    ],
    breath: 'Thở đều, không nín thở.',
    mistakes: ['Làm nhanh, giật khớp'],
    stop: ['Đau nhói ở khớp'],
    alts: [{ id: 'stretching' }]
  },

  'walk': {
    vi: 'Đi bộ nhẹ', en: 'Easy Walk', photos: true, kind: 'drill', noVideo: true,
    muscles: 'Tim mạch nhẹ — giúp hồi phục',
    equip: 'Giày thoải mái (ngoài trời hoặc máy chạy)',
    cue: 'Vừa đi vừa nói chuyện thoải mái là đúng cường độ',
    steps: ['Đi bộ ngoài trời hoặc trên máy chạy, nhịp vừa phải.', 'Có thể chia làm 2 lần, mỗi lần 15–20 phút.'],
    breath: 'Thở bằng mũi, nhịp nhàng.',
    mistakes: ['Đi quá nhanh biến thành buổi tập mệt'],
    stop: ['Đau chân bất thường'],
    alts: [{ text: 'Đạp xe nhẹ 30 phút' }]
  },

  'sleep': {
    vi: 'Ngủ đủ & chuẩn bị tuần mới', en: 'Sleep & Prep', photos: false, kind: 'drill', noVideo: true, art: 'moon',
    muscles: 'Hồi phục toàn thân',
    equip: '—',
    cue: 'Ngủ 7,5–9 giờ, đi ngủ và thức dậy cùng giờ',
    steps: [
      'Ngủ và thức cố định giờ, hạn chế màn hình 30–60 phút trước khi ngủ.',
      'Mở tab Tiến độ: xem lại tuần trước, ghi chú bài nào cần tăng hoặc giảm tạ.',
      'Chuẩn bị đồ tập, bình nước, bữa ăn cho Thứ 2.'
    ],
    breath: '—',
    mistakes: ['Thức khuya rồi bù bằng cà phê trước buổi tập'],
    stop: [],
    alts: []
  },

  /* ─────────────────────────── BÓNG RỔ ─────────────────────────── */

  'bb-warmup': {
    vi: 'Khởi động trước bóng rổ', en: 'Basketball Dynamic Warm-up', photos: false, kind: 'drill',
    video: 'ut9uYMbziwk',
    muscles: 'Toàn thân, cổ chân, hông, đùi sau',
    equip: 'Sân',
    cue: 'Từ chậm đến nhanh, kết thúc bằng vài lần tăng tốc nhẹ',
    steps: [
      'Chạy nhẹ quanh sân 2–3 phút.',
      'Làm theo video các bài giãn cơ động: nâng gối, đá gót, lunge, xoay hông, trượt ngang.',
      'Kết thúc bằng 2–3 lần chạy tăng tốc 70–80% dọc sân.'
    ],
    breath: 'Thở đều.',
    mistakes: ['Vào ném hoặc vào trận ngay', 'Giãn tĩnh quá lâu trước khi chạy nhanh'],
    stop: ['Đau cổ chân hoặc gối khi bật nhảy nhẹ'],
    alts: [{ id: 'gym-warmup' }]
  },

  'ball-handling': {
    vi: 'Dẫn bóng & xử lý bóng', en: 'Ball Handling', photos: false, kind: 'drill',
    video: 'bvy5u3YgDEk', videoVi: 'X4vHi3tYXiM',
    muscles: 'Kỹ năng tay, phối hợp, thể lực nhẹ',
    equip: '1–2 quả bóng',
    cue: 'Bóng thấp, mắt nhìn lên, đổi tay nhanh nhưng chắc',
    steps: [
      'Dẫn bóng tại chỗ mỗi tay: thấp – cao – nhanh (mỗi bài 30–45 giây, nghỉ 15 giây).',
      'Chéo bóng trước người (crossover), giữa hai chân, sau lưng.',
      'Ghép 2 động tác liên tiếp, rồi dẫn bóng tiến – lùi.',
      'Cuối buổi làm thêm một lượt khi đã hơi mệt để quen xử lý bóng lúc thi đấu.'
    ],
    breath: 'Thở đều, thả lỏng vai.',
    mistakes: ['Nhìn xuống bóng', 'Đứng thẳng người, bóng nảy cao', 'Chỉ tập tay thuận'],
    stop: ['Đau ngón tay hoặc cổ tay'],
    alts: [{ text: 'Không ra sân được: dẫn bóng tại chỗ ở nhà 10 phút' }]
  },

  'change-direction': {
    vi: 'Đổi hướng khi dẫn bóng', en: 'Change of Direction', photos: false, kind: 'drill',
    video: 'jVLexhd2SXI',
    muscles: 'Chân, hông, core — tốc độ đổi hướng',
    equip: 'Bóng, 4–6 cọc hoặc chai nước làm mốc',
    cue: 'Hạ trọng tâm trước khi đổi hướng, bước đầu dứt khoát',
    steps: [
      'Xếp mốc zig-zag cách nhau 3–4 m.',
      'Dẫn bóng đến mốc, hạ thấp người, đổi hướng rồi tăng tốc đến mốc tiếp theo.',
      'Thử các kiểu đổi hướng trong video: chéo bóng, giữa hai chân, xoay người.',
      'Tốc độ vừa trước; chỉ tăng tốc khi đã chắc bóng. Nghỉ 30–45 giây giữa các lượt.'
    ],
    breath: 'Thở đều; nghỉ đủ giữa các lượt.',
    mistakes: ['Đổi hướng khi người còn đứng cao', 'Bước quá rộng, mất thăng bằng', 'Cố làm khi đã quá mệt (dễ lật cổ chân)'],
    stop: ['Đau cổ chân hoặc gối khi xoay', 'Chân nặng, mất tốc độ rõ'],
    alts: [{ id: 'ball-handling' }]
  },

  'acceleration': {
    vi: 'Tăng tốc ngắn', en: 'Short Acceleration Sprints', photos: false, kind: 'drill',
    video: 'CTfCIfWIbjg',
    muscles: 'Chân, mông — bước một nhanh',
    equip: 'Sân',
    cue: 'Nghiêng người trước, bước ngắn và nhanh, tay đánh mạnh',
    steps: [
      'Chỉ làm khi đã khởi động kỹ và chân không đau.',
      'Xuất phát từ tư thế thủ (hoặc đứng), lao 10–15 m với khoảng 90% sức.',
      'Đi bộ về, nghỉ 60–90 giây để lần sau nhanh như lần trước.',
      'Thêm biến thể trong video: xuất phát sau trượt ngang, sau xoay người.'
    ],
    breath: 'Thở sâu khi đi bộ về.',
    mistakes: ['Nghỉ quá ngắn biến bài tốc độ thành bài mệt', 'Làm khi chưa khởi động', 'Ngửa người khi xuất phát'],
    stop: ['Căng hoặc nhói đùi sau → dừng ngay', 'Tốc độ giảm rõ → dừng'],
    alts: [{ text: 'Chân mệt: 4 lần chạy khoảng 70% sức, hoặc bỏ qua hôm nay' }]
  },

  'defensive-slide': {
    vi: 'Di chuyển phòng thủ (trượt ngang)', en: 'Defensive Slides', photos: false, kind: 'drill',
    video: 'QaYwcS00vSA', videoVi: 'QHbmciZbQEs',
    muscles: 'Mông, đùi trong/ngoài, cổ chân',
    equip: 'Sân, vạch kẻ làm mốc',
    cue: 'Thấp người, không chụm chân, đẩy bằng chân sau',
    steps: [
      'Tư thế thủ: chân rộng hơn vai, gối khuỵu, lưng thẳng, tay mở.',
      'Trượt ngang bằng cách đẩy chân sau, chân trước dẫn; không bắt chéo, không chụm chân.',
      'Trượt từ vạch này sang vạch kia (biên → vòng cấm), thêm lùi chéo và close-out như video.',
      'Giữ đầu ngang bằng, không nhấp nhô. Mỗi lượt 15–20 giây, nghỉ khoảng 40 giây.'
    ],
    breath: 'Thở đều, không nín thở.',
    mistakes: ['Đứng cao người', 'Chụm hoặc bắt chéo chân', 'Nhảy lên thay vì trượt'],
    stop: ['Đau háng hoặc cổ chân'],
    alts: [{ text: 'Đi ngang với dây kháng lực quanh gối (band walk)' }]
  },

  'shooting-form': {
    vi: 'Ném rổ kỹ thuật', en: 'Form Shooting', photos: false, kind: 'drill',
    video: 'UcnB9e5O5NY', videoVi: '6FjmQqwBywo',
    muscles: 'Kỹ thuật ném',
    equip: 'Bóng, rổ',
    cue: 'Chân – gối – tay một đường, ra tay mềm, giữ tay sau khi ném',
    steps: [
      'Đứng gần rổ (khoảng 1 m), ném một tay, chú ý khuỷu thẳng hàng với rổ.',
      'Lùi dần ra 2 m, 3 m khi tỷ lệ vào đã ổn định.',
      'Chuyển sang bắt bóng rồi ném (catch & shoot) ở 5 vị trí quanh tầm trung hoặc vạch 3 điểm.',
      'Kết thúc bằng 10 quả ném phạt.'
    ],
    breath: 'Thở ra nhẹ khi ra tay.',
    mistakes: ['Lùi xa quá sớm', 'Khuỷu chĩa ra ngoài', 'Không dùng chân, ném bằng tay'],
    stop: ['Đau vai, khuỷu hoặc cổ tay'],
    alts: [{ id: 'pullup-jumper' }]
  },

  'pullup-jumper': {
    vi: 'Ném sau khi dẫn bóng (pull-up)', en: 'Pull-up Jumper off the Dribble', photos: false, kind: 'drill',
    video: 'xLyFaI491ho',
    muscles: 'Kỹ năng ném + sức bật',
    equip: 'Bóng, rổ',
    cue: 'Dừng gọn hai chân, bật thẳng lên, không trôi người',
    steps: [
      'Dẫn bóng 1–2 nhịp sang trái hoặc phải, dừng hai chân (nhảy dừng hoặc bước 1-2).',
      'Bật lên ném thẳng đứng, tiếp đất gần chỗ bật.',
      'Bắt đầu ở tầm trung với tốc độ vừa; tăng tốc khi đã ổn định.'
    ],
    breath: 'Thở ra nhẹ khi ra tay.',
    mistakes: ['Trôi người về trước hoặc sang ngang', 'Dừng không chắc, mất thăng bằng'],
    stop: ['Đau gối khi dừng gấp'],
    alts: [{ id: 'shooting-form' }]
  },

  'scrimmage': {
    vi: 'Thi đấu mô phỏng', en: 'Scrimmage', photos: false, kind: 'drill', noVideo: true, art: 'court',
    muscles: 'Thể lực thi đấu, áp dụng kỹ năng',
    equip: 'Đồng đội, sân',
    cue: 'Áp dụng đổi hướng và phòng thủ vừa tập',
    steps: [
      'Chỉ đấu khi chân còn khoẻ; đã rất mệt thì bỏ qua.',
      'Tập trung: giao tiếp khi phòng thủ, đổi hướng, ném sau dẫn bóng.',
      'Uống nước mỗi lần nghỉ.'
    ],
    breath: '—',
    mistakes: ['Đấu quá lâu khi đã mệt (dễ chấn thương)'],
    stop: ['Lật cổ chân hoặc va chạm đau → dừng, chườm lạnh'],
    alts: []
  }
};
