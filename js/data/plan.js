/*
 * Giáo án 7 ngày + giai đoạn + nội dung hướng dẫn. Chỉ dữ liệu.
 *  sets/reps/rest(giây)/rir: thông số gốc của giai đoạn "Tăng tiến".
 *  tier: 'main' = bài chính (giữ lại khi mệt), 'acc' = bài phụ (bỏ trước khi mệt).
 *  work: số giây làm việc ước tính mỗi hiệp (để tính thời lượng); mặc định 45.
 *  unit: 'reps' (mặc định) | 'sec' (tính bằng giây) ; bw: true = không cần ghi tạ.
 *  Bài ở sân / phục hồi dùng dose (chữ) + min (phút ước tính) thay cho sets.
 *  kg: [mức đầu, mục tiêu trước giải, bước tăng, ghi chú] — web tự tính số kg gợi ý cho từng tuần.
 */
window.PLAN = {
  athlete: {
    role: 'Hậu vệ',
    level: 'Mới tập tạ', schedule: '5 buổi gym + 2 buổi bóng rổ / tuần',
    goals: ['Sức mạnh', 'Sức bền', 'Tốc độ', 'Sức bật', 'Đổi hướng', 'Thể lực thi đấu'],
    look: 'Săn chắc, vai và lưng rõ — không tăng cân quá nhiều'
  },
  defaults: {
    tournament: '2026-11-28',   // "cuối tháng 11" — người tập tự đổi ngày thật trong phần Cài đặt
    programStart: '2026-10-19'  // Thứ 2 của tuần bắt đầu
  },

  days: [
    {
      id: 't2', dow: 1, short: 'T2', name: 'Thứ 2', title: 'Chân A', sub: 'Sức mạnh thân dưới & tiếp đất',
      kind: 'gym', legs: true, counts: { gym: 1 }, warmup: 'gym-warmup', cooldown: 'stretching',
      note: 'Bật ngang làm đầu buổi khi chân còn tươi. Nordic để cuối phần chân: đổ thật chậm, tuần đầu chỉ nửa đường. Hôm sau là bóng rổ kỹ thuật (nhẹ).',
      blocks: [{
        kind: 'gym', title: 'Gym — chân A', items: [
          { ex: 'lateral-bound', sets: 3, reps: '4 / bên', rest: 60, rir: 'Đứng vững 1–2 giây', tier: 'main', bw: true, work: 30 },
          { ex: 'goblet-squat', sets: 3, reps: '8–10', rest: 120, rir: '2–3', tier: 'main', kg: [12, 18, 2, '(1 tạ ôm ngực)'] },
          { ex: 'db-rdl', sets: 3, reps: '8–10', rest: 90, rir: '2–3', tier: 'main', kg: [10, 16, 2, 'mỗi tay'] },
          { ex: 'bulgarian-split-squat', sets: 2, reps: '8 / chân', rest: 75, rir: '2–3', tier: 'main', work: 90, kg: [4, 10, 2, 'mỗi tay'] },
          { ex: 'leg-press', sets: 2, reps: '10–12', rest: 90, rir: '2–3', tier: 'acc', kg: [40, 70, 10, 'tải thêm (chưa tính bàn trượt)'] },
          { ex: 'nordic-curl', sets: 2, reps: '4–6', rest: 120, rir: 'Đổ chậm 3–5 giây', tier: 'main', bw: true, work: 40 },
          { ex: 'standing-calf-raise', sets: 2, reps: '12–15', rest: 45, rir: '1–2', tier: 'acc', kg: [20, 40, 5, 'trên máy'] }
        ]
      }]
    },
    {
      id: 't3', dow: 2, short: 'T3', name: 'Thứ 3', title: 'Thân trên A', sub: 'Gym + bóng rổ kỹ thuật & ném',
      kind: 'gym', court: true, counts: { gym: 1, court: 1 }, warmup: 'gym-warmup', cooldown: 'stretching',
      note: 'Nếu tập cùng một buổi: bóng rổ trước, gym sau (kỹ thuật cần cơ thể còn tươi). Tốt nhất là cách nhau từ 4 giờ trở lên. Chạy con thoi để cuối buổi sân.',
      blocks: [
        {
          kind: 'gym', title: 'Gym — thân trên A', items: [
            { ex: 'db-bench-press', sets: 3, reps: '6–10', rest: 120, rir: '2–3', tier: 'main', kg: [10, 16, 2, 'mỗi tay'] },
            { ex: 'lat-pulldown', sets: 3, reps: '8–10', rest: 90, rir: '2–3', tier: 'main', kg: [30, 45, 5, 'cọc tạ'] },
            { ex: 'seated-cable-row', sets: 3, reps: '10–12', rest: 75, rir: '2–3', tier: 'main', kg: [30, 45, 5, 'cọc tạ'] },
            { ex: 'incline-db-press', sets: 2, reps: '10–12', rest: 75, rir: '2–3', tier: 'main', kg: [8, 12, 2, 'mỗi tay'] },
            { ex: 'lateral-raise', sets: 3, reps: '12–15', rest: 45, rir: '1–2', tier: 'acc', kg: [4, 6, 1, 'mỗi tay'] },
            { ex: 'face-pull', sets: 2, reps: '12–15', rest: 45, rir: '2', tier: 'acc', kg: [10, 15, 2.5, 'cọc tạ'] }
          ]
        },
        {
          kind: 'court', title: 'Bóng rổ — kỹ thuật & ném rổ', items: [
            { ex: 'bb-warmup', dose: '10 phút', min: 10, tier: 'main' },
            { ex: 'ball-handling', dose: '10 phút', min: 10, tier: 'main' },
            { ex: 'shooting-form', dose: '20 phút', min: 20, tier: 'main' },
            { ex: 'shuttle-run', dose: '4–6 lượt × 20 giây, nghỉ 40 giây', min: 6, tier: 'acc' }
          ]
        }
      ]
    },
    {
      id: 't4', dow: 3, short: 'T4', name: 'Thứ 4', title: 'Thân trên B', sub: 'Vai & lưng — tạo dáng',
      kind: 'gym', counts: { gym: 1 }, warmup: 'gym-warmup', cooldown: 'stretching',
      note: 'Buổi tạo dáng vai – lưng. Tạ vừa phải, tập chậm và đúng cơ.',
      blocks: [{
        kind: 'gym', title: 'Gym — thân trên B', items: [
          { ex: 'machine-chest-press', sets: 2, reps: '10–12', rest: 90, rir: '2–3', tier: 'main', kg: [25, 40, 5, 'cọc tạ'] },
          { ex: 'chest-supported-row', sets: 3, reps: '10–12', rest: 90, rir: '2–3', tier: 'main', kg: [10, 16, 2, 'mỗi tay'] },
          { ex: 'db-shoulder-press', sets: 3, reps: '8–10', rest: 90, rir: '2–3', tier: 'main', kg: [8, 12, 2, 'mỗi tay'] },
          { ex: 'reverse-pec-deck', sets: 2, reps: '12–15', rest: 60, rir: '2', tier: 'acc', kg: [15, 25, 5, 'cọc tạ'] },
          { ex: 'lateral-raise', sets: 3, reps: '12–15', rest: 45, rir: '1–2', tier: 'acc', kg: [4, 6, 1, 'mỗi tay'] },
          { ex: 'biceps-curl', sets: 2, reps: '10–12', rest: 60, rir: '2', tier: 'acc', kg: [6, 10, 2, 'mỗi tay'] },
          { ex: 'triceps-pushdown', sets: 2, reps: '10–12', rest: 60, rir: '2', tier: 'acc', kg: [15, 25, 5, 'cọc tạ'] }
        ]
      }]
    },
    {
      id: 't5', dow: 4, short: 'T5', name: 'Thứ 5', title: 'Bóng rổ', sub: 'Tốc độ, đổi hướng & thể lực thi đấu',
      kind: 'court', counts: { court: 1 }, cooldown: 'stretching',
      note: 'Buổi sân nặng nhất tuần. Chân B dời sang Thứ 7 (cách 48 giờ) nên hôm nay chạy tăng tốc và con thoi hết sức.',
      blocks: [{
        kind: 'court', title: 'Buổi sân', items: [
          { ex: 'bb-warmup', dose: '10–12 phút', min: 12, tier: 'main' },
          { ex: 'ball-handling', dose: '10 phút', min: 10, tier: 'main' },
          { ex: 'acceleration', dose: '6–8 lần × 10–15 m, nghỉ 60–90 giây', min: 10, tier: 'main' },
          { ex: 'change-direction', dose: '4–6 lượt mỗi chiều', min: 10, tier: 'main' },
          { ex: 'defensive-slide', dose: '4–6 lượt × 15–20 giây', min: 8, tier: 'main' },
          { ex: 'pullup-jumper', dose: '3–4 vị trí × 8 quả', min: 12, tier: 'main' },
          { ex: 'scrimmage', dose: '15–30 phút', min: 20, tier: 'acc', cond: 'Nếu có lịch và còn đủ sức' },
          { ex: 'shuttle-run', dose: '6–8 lượt × 20 giây, nghỉ 40 giây', min: 10, tier: 'main' }
        ]
      }]
    },
    {
      id: 't6', dow: 5, short: 'T6', name: 'Thứ 6', title: 'Thân trên C + Core', sub: 'Vai, lưng, giữ thân & phòng chấn thương',
      kind: 'gym', counts: { gym: 1 }, warmup: 'gym-warmup', cooldown: 'stretching',
      note: 'Buổi nhẹ cho chân nghỉ sau buổi sân. Core và Copenhagen giúp giữ thân vững, phòng căng cơ háng khi đổi hướng.',
      blocks: [{
        kind: 'gym', title: 'Gym — thân trên C + core', items: [
          { ex: 'incline-machine-press', sets: 3, reps: '8–10', rest: 90, rir: '2–3', tier: 'main', kg: [20, 35, 5, 'cọc tạ'] },
          { ex: 'neutral-pulldown', sets: 3, reps: '8–12', rest: 90, rir: '2–3', tier: 'main', kg: [30, 45, 5, 'cọc tạ'] },
          { ex: 'cable-lateral-raise', sets: 2, reps: '12–15 / tay', rest: 45, rir: '1–2', tier: 'acc', work: 70, kg: [2.5, 5, 2.5, 'mỗi tay'] },
          { ex: 'cable-curl', sets: 2, reps: '10–12', rest: 60, rir: '2', tier: 'acc', kg: [10, 17.5, 2.5, 'cọc tạ'] },
          { ex: 'pallof-press', sets: 2, reps: '10 / bên', rest: 45, rir: '—', tier: 'main', work: 60, kg: [7.5, 12.5, 2.5, 'cọc tạ'] },
          { ex: 'dead-bug', sets: 3, reps: '6–8 / bên', rest: 45, rir: '—', tier: 'main', bw: true },
          { ex: 'side-plank', sets: 2, reps: '20–30 giây / bên', rest: 45, rir: '—', tier: 'main', bw: true, unit: 'sec', work: 60 },
          { ex: 'copenhagen-plank', sets: 2, reps: '15–20 giây / bên', rest: 45, rir: '—', tier: 'main', bw: true, unit: 'sec', work: 50 }
        ]
      }]
    },
    {
      id: 't7', dow: 6, short: 'T7', name: 'Thứ 7', title: 'Chân B', sub: 'Tốc độ, sức bật & sức mạnh',
      kind: 'gym', legs: true, counts: { gym: 1 }, warmup: 'gym-warmup', cooldown: 'stretching',
      note: 'Chạy tăng tốc và bật nhảy làm đầu buổi khi chân còn tươi, nghỉ đủ giữa các lần — độ cao / tốc độ giảm rõ thì dừng. Mai Chủ nhật nghỉ.',
      blocks: [{
        kind: 'gym', title: 'Gym — chân B', items: [
          { ex: 'acceleration', sets: 5, reps: '10 m', rest: 75, rir: 'Chạy hết tốc', tier: 'main', bw: true, work: 5 },
          { ex: 'cmj', sets: 3, reps: '3', rest: 75, rir: 'Nhảy hết sức', tier: 'main', bw: true, work: 30 },
          { ex: 'trap-bar-deadlift', sets: 3, reps: '4–6', rest: 150, rir: '2–3', tier: 'main', kg: [40, 70, 5, 'tổng cả thanh'] },
          { ex: 'step-up', sets: 2, reps: '8 / chân', rest: 75, rir: '2–3', tier: 'main', work: 90, kg: [4, 10, 2, 'mỗi tay'] },
          { ex: 'hip-thrust', sets: 3, reps: '8–10', rest: 90, rir: '2–3', tier: 'main', kg: [30, 60, 5, 'tổng cả thanh'] },
          { ex: 'lying-leg-curl', sets: 2, reps: '10–12', rest: 60, rir: '2', tier: 'acc', kg: [15, 25, 5, 'cọc tạ'] },
          { ex: 'seated-calf-raise', sets: 3, reps: '12–15', rest: 45, rir: '1–2', tier: 'acc', kg: [15, 30, 5, 'trên máy'] }
        ]
      }]
    },
    {
      id: 'cn', dow: 0, short: 'CN', name: 'Chủ nhật', title: 'Phục hồi', sub: 'Đi bộ, giãn cơ, ngủ đủ',
      kind: 'rest', counts: {},
      note: 'Phục hồi cũng là tập. Đau cơ âm ỉ là bình thường; đau khớp, đau nhói thì đọc mục An toàn.',
      blocks: [{
        kind: 'rest', title: 'Phục hồi chủ động', items: [
          { ex: 'walk', dose: '30–45 phút', min: 40 },
          { ex: 'stretching', dose: '10–12 phút', min: 12 },
          { ex: 'mobility', dose: '10 phút', min: 10 },
          { ex: 'sleep', dose: '7,5–9 giờ', min: 0 }
        ]
      }]
    }
  ],

  /* Giai đoạn tự tính theo ngày bắt đầu và ngày thi đấu. */
  phases: {
    'lam-quen': {
      name: 'Làm quen', rir: '3–4',
      rule: 'Hai tuần đầu: bớt 1 hiệp mỗi bài (tối thiểu 2), tạ nhẹ, tập trung học đúng động tác.',
      setDelta: -1, minSets: 2
    },
    'tang-tien': {
      name: 'Tăng tiến', rir: null,
      rule: 'Làm đủ số hiệp. Khi mọi hiệp đều chạm đỉnh khoảng số lần mà vẫn còn dư 2 lần → buổi sau tăng mức tạ nhỏ nhất (1–2 kg tạ đơn, 1 nấc máy).',
      setDelta: 0
    },
    'giam-tai': {
      name: 'Giảm tải trước giải', rir: '3–4',
      rule: '9 ngày cuối trước giải: số hiệp còn khoảng một nửa, giữ hoặc giảm nhẹ mức tạ, không thêm bài mới, không tập tới mệt rã.',
      setFactor: 0.5
    },
    'sau-giai': {
      name: 'Sau giải — hồi phục', rir: '3–4',
      rule: 'Tuần đầu sau giải tập nhẹ (một nửa số hiệp), sau đó quay lại giai đoạn Tăng tiến.',
      setFactor: 0.5
    }
  },

  /* Điều chỉnh theo cảm giác trong ngày (check-in đầu buổi). */
  checkins: [
    { id: 'tot', label: 'Sung sức', hint: 'Tập đúng giáo án' },
    { id: 'hoi-met', label: 'Hơi mệt / đau cơ nhẹ', hint: 'Mỗi bài bớt 1 hiệp, giữ mức tạ' },
    { id: 'rat-met', label: 'Rất mệt / ngủ kém', hint: 'Chỉ làm bài chính, tối đa 2 hiệp, giảm tạ 10–20%' },
    { id: 'dau', label: 'Đau khớp / đau nhói', hint: 'Dừng phần gây đau — đọc mục An toàn' }
  ],

  /* Nội dung tab Hướng dẫn. Mỗi mục: tiêu đề + danh sách đoạn. */
  guide: [
    {
      id: 'rir', title: 'Chọn tạ thế nào? (còn dư 2–3 lần)',
      body: [
        'RIR = số lần còn dư. RIR 2 nghĩa là bạn còn làm được khoảng 2 lần nữa đúng kỹ thuật nhưng chủ động dừng.',
        'Hiệp đầu của mỗi bài là hiệp thử. Còn dư hơn 4 lần → tăng tạ. Còn dư dưới 2 lần, hoặc kỹ thuật bắt đầu xấu → giảm tạ.',
        'Mỗi bài có số kg gợi ý cho tuần hiện tại: 2 tuần đầu ở mức nhẹ, sau đó tăng dần đều tới mục tiêu trước giải. Đó là điểm bắt đầu để thử — máy mỗi phòng tập khác nhau, nên vẫn chỉnh theo cảm giác còn dư 2–3 lần.',
        'Không tập đến kiệt sức ở mọi hiệp. Với người mới vừa tập tạ vừa chơi bóng, dừng sớm 2–3 lần giúp hồi phục kịp cho buổi sau.',
        'Ghi lại mức tạ và số lần ở mỗi hiệp. Lần sau nhìn dòng "Lần trước" để biết nên giữ hay tăng.'
      ]
    },
    {
      id: 'warmup', title: 'Khởi động',
      body: [
        'Buổi gym: 3–5 phút đạp xe/đi bộ dốc → khởi động động theo video (khoảng 5 phút) → 1–2 hiệp nhẹ cho bài đầu tiên.',
        'Buổi bóng rổ: chạy nhẹ, giãn cơ động, trượt ngang, 2–3 lần tăng tốc nhẹ trước khi ném hay đấu.',
        'Giãn cơ tĩnh giữ lâu (30 giây trở lên) để dành cho sau buổi tập.'
      ]
    },
    {
      id: 'recovery', title: 'Phục hồi',
      body: [
        'Ngủ 7,5–9 giờ mỗi đêm là yếu tố hồi phục quan trọng nhất.',
        'Chủ nhật: đi bộ 30–45 phút, giãn cơ và vận động khớp nhẹ.',
        'Hai ngày liên tiếp đều thấy mệt nặng, ngủ kém, tim đập nhanh lúc nghỉ → chọn "Rất mệt" khi check-in hoặc nghỉ hẳn 1 ngày.',
        'Đau cơ 24–72 giờ sau buổi tập mới là bình thường, nhất là 2 tuần đầu. Vận động nhẹ giúp đỡ nhanh hơn.'
      ]
    },
    {
      id: 'nutrition', title: 'Dinh dưỡng (tham khảo chung)',
      body: [
        'Mục tiêu săn chắc, không tăng cân nhiều: ăn gần mức duy trì. Cân buổi sáng 2–3 lần/tuần và lấy trung bình: nếu giảm hơn 0,5 kg/tuần thì ăn thêm; tăng hơn 0,25 kg/tuần thì bớt tinh bột/dầu mỡ.',
        'Đạm (protein): khoảng 1,6–2,0 g cho mỗi kg cân nặng mỗi ngày, chia 3–5 bữa (thịt, cá, trứng, sữa, đậu phụ).',
        'Tinh bột (cơm, bún, khoai, yến mạch, chuối) là nhiên liệu cho bóng rổ — ăn nhiều hơn vào ngày có buổi sân.',
        'Nước: khoảng 2,5–3 lít/ngày, thêm khi ra nhiều mồ hôi. Uống 400–500 ml khoảng 2 giờ trước buổi tập.',
        'Bữa chính 2–3 giờ trước buổi tập; sát giờ thì ăn nhẹ (chuối, sữa chua). Sau tập ăn bữa có cả đạm và tinh bột.',
        'Ngày thi đấu: chỉ ăn món quen, bữa chính 3–4 giờ trước trận. Không thử món hay chất bổ sung mới.',
        'Đây là gợi ý chung, không thay cho tư vấn của bác sĩ/chuyên gia dinh dưỡng — nhất là khi có bệnh nền.'
      ]
    },
    {
      id: 'safety', title: 'An toàn: đau cơ hay đau bất thường?',
      body: [
        'Bình thường: mỏi, nóng cơ trong lúc tập; đau cơ âm ỉ cả hai bên 1–3 ngày sau tập, đỡ dần khi vận động nhẹ.',
        'Bất thường — dừng bài đó ngay: đau nhói hoặc sắc tại khớp (gối, vai, lưng dưới, cổ chân); đau rõ một bên; sưng, bầm; tê bì hoặc châm chích lan xuống tay/chân; đau tăng dần khi tập tiếp; nghe tiếng "phựt" kèm đau; đau cả khi nghỉ hoặc ban đêm.',
        'Khi gặp đau bất thường: nghỉ phần đó, không cố tập qua cơn đau. Không đỡ sau 2–3 ngày, hoặc đau nặng, sưng nhiều → đi khám bác sĩ hoặc chuyên viên vật lý trị liệu.',
        'Dừng tập và tìm trợ giúp y tế ngay khi: đau hoặc tức ngực, khó thở bất thường, chóng mặt, choáng, tim đập loạn.',
        'Dùng chốt an toàn trên máy. Tập tạ đơn một mình: hết sức thì hạ tạ sang hai bên, không cố đẩy.',
        'Giáo án này không bảo đảm một kết quả cụ thể về thể chất; tiến bộ tuỳ cơ địa, giấc ngủ, dinh dưỡng và mức độ đều đặn.'
      ]
    },
    {
      id: 'taper', title: 'Trước giải đấu',
      body: [
        'Khoảng 9 ngày cuối: số hiệp giảm còn một nửa, giữ mức tạ quen thuộc, không thêm bài mới. Web tự chuyển sang giai đoạn này theo ngày thi đấu trong Cài đặt.',
        'Từ 3 ngày trước trận: không tập chân nặng. Nếu ngày chân rơi vào khoảng này, web tự chuyển sang bản nhẹ (chỉ bài chính, ít hiệp).',
        'Ngày trước trận: nghỉ, hoặc chỉ khởi động + ném nhẹ 20–30 phút. Ngủ sớm.',
        'Ngày thi đấu: khởi động kỹ 15–20 phút, uống nước đều, ăn món quen.',
        'Đổi ngày thi đấu thật trong phần Cài đặt (tab Tiến độ) để lịch tính đúng.'
      ]
    }
  ]
};
