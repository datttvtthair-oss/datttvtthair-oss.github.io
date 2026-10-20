/*
 * Hoạt hình 3D từng bài. Mỗi bài: camera, dụng cụ, nhóm cơ tô cam (focus) và chuỗi tư thế
 * seq: [tư thế, số giây để chuyển TỚI tư thế này, phụ đề]. Chuỗi lặp lại liên tục.
 * Hướng dẫn hệ toạ độ & khoá tư thế: xem đầu file js/anim3d.js.
 */
(function () {
  'use strict';
  const A = window.Anim3D;
  if (!A) return;
  const { P, feet } = A.lib;

  /* ═════════ tiện ích chung ═════════ */
  const hang = { hL: 1, hR: 1 };
  const UP = 0.94; // hông khi đứng thẳng
  // cổ chân sao cho mũi bàn chân (điểm T) đứng yên khi nhón/hạ gót góc p (độ)
  function onBall(T, p) {
    const r = p * Math.PI / 180;
    return [T[0], T[1] + 0.16 * Math.sin(r) + 0.055 * Math.cos(r), T[2] - 0.16 * Math.cos(r) + 0.055 * Math.sin(r)];
  }

  /* ───────── Squat ôm tạ trước ngực ───────── */
  {
    const F = feet(0.17, 22, 0);
    const hold = { wLt: [0.065, -0.15, 0.2], wRt: [-0.065, -0.15, 0.2], eLt: [0.25, -1, 0.15], eRt: [-0.25, -1, 0.15] };
    const up = P(F, hold, { pel: [0, 0.94, 0], tr: [3, 0, 0], hd: 0 });
    const down = P(F, hold, { pel: [0, 0.52, -0.17], tr: [33, 0, 0], hd: -12, kL: [0.55, 0, 1], kR: [-0.55, 0, 1] });
    A.define('goblet-squat', {
      cam: { az: 58, el: 10, dist: 4.2, target: [0, 0.86, 0] },
      focus: ['thigh', 'glute'],
      props: [{ type: 'goblet' }],
      seq: [
        [up, 0.9, 'Ôm tạ sát ngực · hít sâu, siết bụng'],
        [down, 2.0, 'Ngồi thẳng xuống (2 giây) · gối mở theo mũi chân'],
        [down, 0.5, 'Đáy: đùi ngang sàn, lưng thẳng, gót bám sàn'],
        [up, 1.3, 'Đạp cả bàn chân đứng lên · thở ra']
      ]
    });
  }

  /* ───────── Gập hông tạ đơn (RDL) ───────── */
  {
    const F = feet(0.12, 5, 0);
    const up = P(F, { pel: [0, UP, 0], tr: [2, 0, 0], wL: [0.13, 0.80, 0.11], wR: [-0.13, 0.80, 0.11], dbL: [1, 0, 0], dbR: [1, 0, 0] });
    const down = P(F, { pel: [0, 0.80, -0.2], tr: [76, 0, 0], hd: -4, wL: [0.13, 0.4, 0.13], wR: [-0.13, 0.4, 0.13], eL: [0.4, 0, -1], eR: [-0.4, 0, -1], kL: [0.2, 0, 1], kR: [-0.2, 0, 1] });
    A.define('db-rdl', {
      cam: { az: 75, el: 8, dist: 4.2, target: [0, 0.8, 0] },
      focus: ['thigh', 'glute'],
      props: [{ type: 'dumbbell', hand: 'both', len: 0.32 }],
      seq: [
        [up, 0.8, 'Gối hơi chùng, lưng thẳng · hít vào'],
        [down, 2.2, 'Đẩy hông ra sau, tạ trượt sát chân (2 giây)'],
        [down, 0.4, 'Dừng khi đùi sau căng — không cong lưng'],
        [up, 1.3, 'Siết mông đẩy hông về trước · thở ra']
      ]
    });
  }

  /* ───────── Đạp đùi (leg press 45°) ───────── */
  {
    const rail = [0, 0.6, 0.8];
    const pel = [0, 0.5, 0];
    const pose = d => {
      const y = pel[1] + rail[1] * d, z = pel[2] + rail[2] * d;
      return { pel, tr: [-48, 0, 0], hd: 10, aL: [0.15, y, z], aR: [-0.15, y, z], fL: [0, -50], fR: [0, -50], kL: [0.35, 0.6, 0.3], kR: [-0.35, 0.6, 0.3],
        wL: [0.32, 0.42, 0.1], wR: [-0.32, 0.42, 0.1], eL: [1, 0, 0], eR: [-1, 0, 0], plat: [0, y + 0.03, z + 0.09] };
    };
    const ext = pose(0.8), bot = pose(0.42);
    A.define('leg-press', {
      cam: { az: 80, el: 14, dist: 4.4, target: [0, 0.7, 0.3] },
      focus: ['thigh', 'glute'],
      props: [
        { type: 'bench', pos: [0, 0.42, 0.05], seat: 0.45, w: 0.5, back: 0.75, incline: 42, backAt: -0.2 },
        { type: 'platform', key: 'plat', size: [0.7, 0.55, 0.05], rot: -37 },
        { type: 'rod', a: [0.42, 0.55, 0.25], b: [0.42, 1.45, 1.45] }, { type: 'rod', a: [-0.42, 0.55, 0.25], b: [-0.42, 1.45, 1.45] }
      ],
      seq: [
        [ext, 0.8, 'Lưng & hông áp ghế · gối không khoá thẳng'],
        [bot, 2.0, 'Hạ bàn đạp chậm tới gối ~90° (2 giây) · hít vào'],
        [bot, 0.3, 'Lưng dưới vẫn áp ghế'],
        [ext, 1.3, 'Đạp cả bàn chân lên · thở ra']
      ]
    });
  }

  /* ───────── Bulgarian split squat ───────── */
  {
    const base = { aL: [0.13, 0.085, 0.2], fL: [4, 0], aR: [-0.13, 0.56, -0.66], fR: [0, 72], kR: [0, -0.3, 1], kL: [0.15, 0, 1], ...hang, dbL: [0, 0, 1], dbR: [0, 0, 1] };
    const up = P(base, { pel: [0, 0.87, -0.14], tr: [8, 0, 0] });
    const down = P(base, { pel: [0, 0.56, -0.22], tr: [18, 0, 0], hd: -6 });
    A.define('bulgarian-split-squat', {
      cam: { az: 82, el: 8, dist: 4.4, target: [0, 0.75, -0.2] },
      focus: ['thigh', 'glute'],
      props: [{ type: 'bench', pos: [0, 0.42, -0.95], seat: 0.9, w: 0.32 }, { type: 'dumbbell', hand: 'both', len: 0.28 }],
      seq: [
        [up, 0.8, 'Mu bàn chân sau gác ghế · thân hơi nghiêng trước'],
        [down, 1.8, 'Hạ thẳng xuống như thang máy · hít vào'],
        [down, 0.3, 'Đùi trước gần song song sàn · gối sau hướng xuống'],
        [up, 1.3, 'Đạp bằng cả bàn chân TRƯỚC để lên · thở ra']
      ]
    });
  }

  /* ───────── Móc đùi sau máy ngồi ───────── */
  {
    const base = { pel: [0, 0.6, 0], tr: [-6, 0, 0], hd: 5, wL: [0.3, 0.62, 0.12], wR: [-0.3, 0.62, 0.12], eL: [1, 0, 0], eR: [-1, 0, 0], fL: [0, -15], fR: [0, -15] };
    const ext = P(base, { aL: [0.13, 0.62, 0.86], aR: [-0.13, 0.62, 0.86], kL: [0, 1, 0], kR: [0, 1, 0] });
    const flex = P(base, { aL: [0.13, 0.27, 0.2], aR: [-0.13, 0.27, 0.2], kL: [0, 0.6, 1], kR: [0, 0.6, 1], fL: [0, -25], fR: [0, -25] });
    A.define('seated-leg-curl', {
      cam: { az: 82, el: 10, dist: 4.0, target: [0, 0.7, 0.3] },
      focus: ['thigh'],
      props: [
        { type: 'bench', pos: [0, 0.47, -0.02], seat: 0.48, w: 0.5, back: 0.75, incline: 82, backAt: -0.24 },
        { type: 'box', pos: [0, 0.78, 0.22], size: [0.5, 0.07, 0.16], mat: 'pad' },
        { type: 'pad', joint: 'ankL', off: [-0.13, 0.0, -0.06], w: 0.46, r: 0.055, arm: [0, 0.62, 0.4] }
      ],
      seq: [
        [ext, 0.8, 'Gối thẳng trục máy · đệm nằm trên cổ chân'],
        [flex, 1.3, 'Kéo gót xuống, về dưới ghế · thở ra'],
        [flex, 0.5, 'Dừng 1 nhịp — hông không nhấc'],
        [ext, 2.2, 'Trả về chậm 2–3 giây · hít vào']
      ]
    });
  }

  /* ───────── Nhón bắp chân đứng ───────── */
  {
    const T = [0, 0.13, 0.15];
    const mk = p => {
      const aL = onBall([0.12, T[1], T[2]], p), aR = onBall([-0.12, T[1], T[2]], p);
      const py = aL[1] + 0.856;
      return { aL, aR, fL: [0, p], fR: [0, p], pel: [0, py, 0.0], tr: [2, 0, 0], wL: [0.27, py + 0.36, 0.1], wR: [-0.27, py + 0.36, 0.1], eL: [1, -1, -0.2], eR: [-1, -1, -0.2], pads: [0, py + 0.5, 0.0] };
    };
    const low = mk(-18), high = mk(32);
    A.define('standing-calf-raise', {
      cam: { az: 62, el: 6, dist: 4.0, target: [0, 0.8, 0] },
      focus: ['calf'],
      props: [{ type: 'box', pos: [0, 0.05, 0.25], size: [0.6, 0.1, 0.22], mat: 'steel' }, { type: 'box', key: 'pads', pos: [0, 1.5, 0], size: [0.55, 0.08, 0.2], mat: 'pad' },
        { type: 'post', pos: [0.42, 0, -0.32], h: 2.0 }, { type: 'post', pos: [-0.42, 0, -0.32], h: 2.0 }],
      seq: [
        [low, 0.5, 'Nửa trước bàn chân trên mép bậc'],
        [low, 0.9, 'Hạ gót sâu, dừng 1 giây — căng bắp chân'],
        [high, 1.2, 'Nhón lên cao nhất · thở ra'],
        [high, 0.9, 'Dừng 1 giây trên đỉnh'],
        [low, 1.3, 'Hạ chậm, không nảy']
      ]
    });
  }

  /* ───────── Pallof press ───────── */
  {
    const F = feet(0.16, 8, 0);
    const base = P(F, { pel: [0, 0.9, 0], tr: [0, 0, 0], kL: [0.2, 0, 1], kR: [-0.2, 0, 1], eL: [0.6, -1, -0.2], eR: [-0.6, -1, -0.2] });
    const inn = P(base, { wL: [0.03, 1.18, 0.16], wR: [-0.03, 1.18, 0.16] });
    const out = P(base, { wL: [0.02, 1.2, 0.56], wR: [-0.02, 1.2, 0.56] });
    A.define('pallof-press', {
      cam: { az: 30, el: 14, dist: 4.2, target: [-0.3, 0.95, 0.1] },
      focus: ['core'],
      props: [{ type: 'cable', from: [-1.05, 1.2, 0.2], handle: 'single', stack: [-1.15, 0, 0.2] }, { type: 'box', pos: [-1.15, 1.1, 0.2], size: [0.06, 2.2, 0.32], mat: 'dark' }],
      seq: [
        [inn, 0.8, 'Đứng nghiêng với máy, tay cầm sát giữa ngực'],
        [out, 1.2, 'Đẩy thẳng tay ra · thở ra'],
        [out, 2.0, 'Giữ 2 giây — thân không xoay về phía máy'],
        [inn, 1.2, 'Thu tay về chậm · hít vào']
      ]
    });
  }

  /* ───────── Bật nhảy có nhún (CMJ) ───────── */
  {
    const F = feet(0.13, 6, 0);
    const stand = P(F, { pel: [0, UP, 0], tr: [2, 0, 0], wL: [0.22, 0.86, 0.05], wR: [-0.22, 0.86, 0.05] });
    const dip = P(F, { pel: [0, 0.74, -0.1], tr: [32, 0, 0], hd: -10, wL: [0.22, 0.88, -0.42], wR: [-0.22, 0.88, -0.42], eL: [0.3, 1, 0.3], eR: [-0.3, 1, 0.3] });
    const air = { pel: [0, 1.28, 0.02], tr: [-2, 0, 0], aL: [0.13, 0.38, -0.02], aR: [-0.13, 0.38, -0.02], fL: [6, 38], fR: [-6, 38], wL: [0.24, 2.3, 0.12], wR: [-0.24, 2.3, 0.12], eL: [1, 0, -0.2], eR: [-1, 0, -0.2] };
    const land = P(F, { pel: [0, 0.78, -0.08], tr: [22, 0, 0], wL: [0.24, 0.98, 0.32], wR: [-0.24, 0.98, 0.32], eL: [0.5, -1, 0], eR: [-0.5, -1, 0] });
    A.define('cmj', {
      cam: { az: 70, el: 8, dist: 4.8, target: [0, 1.05, 0] },
      focus: ['thigh', 'calf', 'glute'],
      props: [],
      seq: [
        [stand, 1.0, 'Đứng rộng bằng hông, thả lỏng'],
        [dip, 0.45, 'Nhún nhanh 1/4 squat, vung tay ra sau · hít vào'],
        [air, 0.3, 'Bật lên cao nhất, vung tay lên · thở ra'],
        [land, 0.35, 'Tiếp đất êm bằng nửa trước bàn chân, gối hơi khuỵu'],
        [land, 1.0, 'Đứng vững 2 giây — gối không sụp vào trong'],
        [stand, 0.8, 'Đứng thẳng, nghỉ 15–20 giây rồi nhảy tiếp']
      ]
    });
  }

  /* ───────── Deadlift thanh lục giác ───────── */
  {
    const F = feet(0.13, 5, 0);
    const grip = (y, z) => ({ wL: [0.26, y, z], wR: [-0.26, y, z], eL: [0.3, -0.2, -1], eR: [-0.3, -0.2, -1] });
    const top = P(F, grip(0.8, 0.03), { pel: [0, UP, 0], tr: [1, 0, 0] });
    const bot = P(F, grip(0.27, 0.13), { pel: [0, 0.52, -0.1], tr: [44, 0, 0], hd: -14, kL: [0.4, 0, 1], kR: [-0.4, 0, 1] });
    A.define('trap-bar-deadlift', {
      cam: { az: 70, el: 10, dist: 4.4, target: [0, 0.75, 0] },
      focus: ['glute', 'thigh', 'back'],
      props: [{ type: 'trapbar' }],
      seq: [
        [bot, 1.0, 'Đứng giữa thanh, lưng thẳng, ngực mở · hít sâu gồng bụng'],
        [top, 1.4, 'Đẩy sàn ra xa — hông và vai lên cùng lúc'],
        [top, 0.6, 'Đứng thẳng, siết mông · thở ra'],
        [bot, 1.8, 'Hạ thanh có kiểm soát theo đường cũ']
      ]
    });
  }

  /* ───────── Bước lên bục ───────── */
  {
    const box = 0.4;
    const base = { ...hang, dbL: [0, 0, 1], dbR: [0, 0, 1], fL: [3, 0], fR: [-3, 0] };
    const s1 = P(base, { aL: [0.12, box + 0.085, 0.38], aR: [-0.12, 0.085, -0.12], pel: [0, 0.82, 0.02], tr: [14, 0, 0], kL: [0.1, 0, 1] });
    const s2 = P(base, { aL: [0.12, box + 0.085, 0.38], aR: [-0.12, box + 0.2, 0.3], fR: [0, 20], pel: [0, box + 0.93, 0.36], tr: [3, 0, 0], kR: [0, 0, 1] });
    A.define('step-up', {
      cam: { az: 78, el: 8, dist: 4.6, target: [0, 0.95, 0.15] },
      focus: ['glute', 'thigh'],
      props: [{ type: 'box', pos: [0, box / 2, 0.42], size: [0.6, box, 0.42], mat: 'pad' }, { type: 'dumbbell', hand: 'both', len: 0.28 }],
      seq: [
        [s1, 0.8, 'Cả bàn chân trên bục, thân hơi nghiêng trước'],
        [s2, 1.4, 'Đạp qua gót chân trên bục để đứng lên · thở ra'],
        [s2, 0.5, 'Đứng vững 1 nhịp'],
        [s1, 1.6, 'Hạ chân sau xuống chậm · hít vào']
      ]
    });
  }

  /* ───────── Đẩy hông (hip thrust) ───────── */
  {
    const base = { aL: [0.17, 0.085, 0.5], aR: [-0.17, 0.085, 0.5], fL: [6, 0], fR: [-6, 0], kL: [0.3, 1, 0.2], kR: [-0.3, 1, 0.2], eL: [0.6, -0.3, -1], eR: [-0.6, -0.3, -1] };
    const bot = P(base, { pel: [0, 0.27, 0.05], tr: [-55, 0, 0], hd: 25, wL: [0.33, 0.45, 0.1], wR: [-0.33, 0.45, 0.1] });
    const top = P(base, { pel: [0, 0.6, 0.0], tr: [-88, 0, 0], hd: 40, wL: [0.33, 0.78, 0.05], wR: [-0.33, 0.78, 0.05] });
    A.define('hip-thrust', {
      cam: { az: 85, el: 10, dist: 4.3, target: [0, 0.5, 0.0] },
      focus: ['glute'],
      props: [{ type: 'bench', pos: [0, 0.42, -0.55], seat: 0.4, w: 1.1 }, { type: 'barbell', len: 1.5, plateR: 0.2, offset: [0, -0.03, 0] }],
      seq: [
        [bot, 0.8, 'Lưng trên tựa mép ghế, thanh đòn ngang nếp hông'],
        [top, 1.2, 'Cằm hơi cúi, đẩy hông lên — thân phẳng như mặt bàn · thở ra'],
        [top, 1.2, 'Siết mông 1–2 giây, cẳng chân thẳng đứng'],
        [bot, 1.6, 'Hạ hông chậm · hít vào']
      ]
    });
  }

  /* ───────── Móc đùi sau nằm sấp ───────── */
  {
    const base = { pel: [0, 0.72, 0], tr: [90, 0, 0], hd: -25, wL: [0.25, 0.6, 0.62], wR: [-0.25, 0.6, 0.62], eL: [1, 0.3, 0], eR: [-1, 0.3, 0], kL: [0, -1, 0], kR: [0, -1, 0] };
    const ext = P(base, { aL: [0.12, 0.66, -0.86], aR: [-0.12, 0.66, -0.86], fL: [0, 70], fR: [0, 70] });
    const flex = P(base, { aL: [0.12, 1.05, -0.23], aR: [-0.12, 1.05, -0.23], fL: [0, -60], fR: [0, -60], kL: [0, -1, 0.2], kR: [0, -1, 0.2] });
    A.define('lying-leg-curl', {
      cam: { az: 88, el: 12, dist: 4.4, target: [0, 0.75, -0.1] },
      focus: ['thigh'],
      props: [{ type: 'bench', pos: [0, 0.58, 0.15], seat: 1.25, w: 0.42 }, { type: 'pad', joint: 'ankL', off: [-0.12, 0.05, -0.04], w: 0.46, r: 0.05, arm: [0, 0.6, -0.5] }],
      seq: [
        [ext, 0.8, 'Nằm sấp, gối ở mép ghế, hông ép xuống'],
        [flex, 1.3, 'Gập gối kéo gót về mông · thở ra'],
        [flex, 0.4, 'Dừng 1 nhịp — hông không nhấc'],
        [ext, 2.2, 'Trả về chậm 2–3 giây · hít vào']
      ]
    });
  }

  /* ───────── Nhón bắp chân ngồi ───────── */
  {
    const T = [0, 0.13, 0.5];
    const mk = p => {
      const aL = onBall([0.11, T[1], T[2]], p), aR = onBall([-0.11, T[1], T[2]], p);
      return { aL, aR, fL: [0, p], fR: [0, p], pel: [0, 0.56, 0.0], tr: [4, 0, 0], kL: [0, 1, 1], kR: [0, 1, 1], wL: [0.24, 0.78, 0.36], wR: [-0.24, 0.78, 0.36], eL: [1, 0, -0.3], eR: [-1, 0, -0.3], pad: [0, aL[1] + 0.52, 0.42] };
    };
    const low = mk(-18), high = mk(30);
    A.define('seated-calf-raise', {
      cam: { az: 80, el: 8, dist: 3.9, target: [0, 0.5, 0.2] },
      focus: ['calf'],
      props: [{ type: 'bench', pos: [0, 0.48, -0.05], seat: 0.4, w: 0.42 }, { type: 'box', pos: [0, 0.05, 0.57], size: [0.5, 0.1, 0.2], mat: 'steel' }, { type: 'box', key: 'pad', pos: [0, 0.68, 0.42], size: [0.48, 0.07, 0.18], mat: 'pad' }],
      seq: [
        [low, 0.4, 'Đệm đè ngay trên gối'],
        [low, 0.9, 'Hạ gót thấp nhất, dừng 1 giây'],
        [high, 1.1, 'Nhón lên cao nhất · thở ra'],
        [high, 0.9, 'Dừng 1 giây'],
        [low, 1.3, 'Hạ chậm, không nảy']
      ]
    });
  }

  /* ═════════ THÂN TRÊN ═════════ */
  const seatY = h => h + 0.035 + 0.1; // tâm hông khi ngồi trên đệm cao h
  const pron = { dbL: [1, 0, 0], dbR: [1, 0, 0] };
  const neut = { dbL: [0, 0, 1], dbR: [0, 0, 1] };
  const mirror = (w) => [-w[0], w[1], w[2]];
  const both = (key, w, extra) => Object.assign({ [key + 'L']: w, [key + 'R']: mirror(w) }, extra || {});

  /* ───────── Đẩy ngực tạ đơn ghế phẳng ───────── */
  {
    const base = P(neut, pron, { pel: [0, 0.595, 0.15], tr: [-90, 0, 0], hd: 0,
      aL: [0.28, 0.085, 0.52], aR: [-0.28, 0.085, 0.52], fL: [10, 0], fR: [-10, 0], kL: [0.5, 1, 0], kR: [-0.5, 1, 0] });
    const top = P(base, both('w', [0.17, 1.12, -0.25]), both('e', [1, 0, 0.3]));
    const bot = P(base, both('w', [0.36, 0.72, -0.2]), both('e', [1, -0.7, 0.45]));
    A.define('db-bench-press', {
      cam: { az: 62, el: 22, dist: 4.0, target: [0, 0.65, -0.15] },
      focus: ['chest'],
      props: [{ type: 'bench', pos: [0, 0.45, -0.3], seat: 1.25, w: 0.3 }, { type: 'dumbbell', hand: 'both', len: 0.32 }],
      seq: [
        [top, 0.8, 'Bả vai kẹp xuống ghế, chân chắc trên sàn'],
        [bot, 2.0, 'Hạ chậm tới ngang ngực · khuỷu 45–70°, không dang ngang · hít vào'],
        [bot, 0.3, 'Không nảy tạ ở dưới'],
        [top, 1.3, 'Đẩy lên, hai tạ gần chạm nhau · thở ra']
      ]
    });
  }

  /* ───────── Kéo xô trước ngực & kéo xô tay cầm song song ───────── */
  function pulldown(id, grip, focusCap) {
    const sy = seatY(0.45);
    const base = { pel: [0, sy, 0], aL: [0.15, 0.085, 0.48], aR: [-0.15, 0.085, 0.48], fL: [6, 0], fR: [-6, 0], kL: [0.2, 1, 1], kR: [-0.2, 1, 1] };
    const top = P(base, { tr: [-8, 0, 0], hd: -10 }, both('w', [grip, 1.5, 0.04]), both('e', grip > 0.2 ? [1, 0, 0.2] : [0.6, 0.2, 0.6]));
    const bot = P(base, { tr: [-14, 0, 0], hd: -8 }, both('w', [grip > 0.2 ? 0.36 : 0.07, 1.06, 0.12]), both('e', grip > 0.2 ? [0.6, -1, -0.5] : [0.3, -1, -0.6]));
    A.define(id, {
      cam: { az: 48, el: 12, dist: 4.5, target: [0, 1.1, 0.15] },
      focus: ['back'],
      props: [
        { type: 'bench', pos: [0, 0.45, 0], seat: 0.42, w: 0.42 },
        { type: 'box', pos: [0, 0.76, 0.3], size: [0.52, 0.08, 0.12], mat: 'pad' },
        { type: 'post', pos: [0, 0, 0.8], h: 2.36 }, { type: 'rod', a: [0, 2.36, 0.8], b: [0, 2.36, 0.08] },
        { type: 'cable', from: [0, 2.32, 0.08], handle: grip > 0.2 ? 'bar' : 'v', barLen: 1.15, stack: [0, 0, 0.92] },
        { type: 'box', pos: [0, 1.1, 1.0], size: [0.32, 2.2, 0.06], mat: 'dark' }
      ],
      seq: [
        [top, 0.8, 'Đùi chặn chắc dưới đệm, ngực mở'],
        [bot, 1.3, focusCap + ' · thở ra'],
        [bot, 0.4, 'Dừng 1 nhịp — không giật, không nhún vai'],
        [top, 2.0, 'Trả lên chậm tới gần thẳng tay · hít vào']
      ]
    });
  }
  pulldown('lat-pulldown', 0.4, 'Kéo khuỷu xuống "túi quần", thanh về ngực trên');
  pulldown('neutral-pulldown', 0.06, 'Kéo tay cầm về ngực trên, khuỷu sát sườn');

  /* ───────── Kéo cáp ngồi ───────── */
  {
    const sy = seatY(0.4);
    const base = { pel: [0, sy, 0], aL: [0.13, 0.3, 0.78], aR: [-0.13, 0.3, 0.78], fL: [0, -35], fR: [0, -35], kL: [0.1, 1, 0.2], kR: [-0.1, 1, 0.2] };
    const ext = P(base, { tr: [12, 0, 0] }, both('w', [0.06, 0.84, 0.6]), both('e', [0.3, -0.3, 0]));
    const pull = P(base, { tr: [-3, 0, 0] }, both('w', [0.08, 0.82, 0.13]), both('e', [0.3, -0.1, -1]));
    A.define('seated-cable-row', {
      cam: { az: 76, el: 12, dist: 4.4, target: [0, 0.75, 0.4] },
      focus: ['back'],
      props: [
        { type: 'bench', pos: [0, 0.4, 0], seat: 0.5, w: 0.36 },
        { type: 'box', pos: [0, 0.28, 0.92], size: [0.5, 0.42, 0.05], rot: [-20, 0, 0], mat: 'steel' },
        { type: 'cable', from: [0, 0.72, 1.12], handle: 'v', stack: [0, 0, 1.22] },
        { type: 'box', pos: [0, 1.1, 1.3], size: [0.32, 2.2, 0.06], mat: 'dark' }
      ],
      seq: [
        [ext, 0.8, 'Lưng thẳng, ngực mở, gối hơi chùng'],
        [pull, 1.2, 'Kéo tay cầm về rốn, khuỷu sát thân · thở ra'],
        [pull, 0.5, 'Ép hai bả vai lại — thân không ngả ra sau'],
        [ext, 2.0, 'Duỗi tay về trước chậm, lưng vẫn thẳng · hít vào']
      ]
    });
  }

  /* ───────── Đẩy ngực trên tạ đơn ghế dốc 30° ───────── */
  {
    const base = P(pron, { pel: [0, 0.585, 0.05], tr: [-60, 0, 0], hd: 15, aL: [0.25, 0.085, 0.55], aR: [-0.25, 0.085, 0.55], fL: [8, 0], fR: [-8, 0], kL: [0.4, 1, 0.3], kR: [-0.4, 1, 0.3] });
    const top = P(base, both('w', [0.15, 1.32, -0.26]), both('e', [1, 0, 0.3]));
    const bot = P(base, both('w', [0.34, 0.93, -0.22]), both('e', [1, -0.6, 0.4]));
    A.define('incline-db-press', {
      cam: { az: 66, el: 14, dist: 4.2, target: [0, 0.85, -0.1] },
      focus: ['chest'],
      props: [{ type: 'bench', pos: [0, 0.45, 0.2], seat: 0.45, w: 0.32, back: 0.95, incline: 30, backAt: -0.225 }, { type: 'dumbbell', hand: 'both', len: 0.3 }],
      seq: [
        [top, 0.8, 'Ghế dốc ~30°, bả vai kéo ra sau'],
        [bot, 2.0, 'Hạ chậm tới ngang ngực trên · hít vào'],
        [bot, 0.3, 'Khuỷu 45–60° so với thân'],
        [top, 1.3, 'Đẩy lên, không đập hai tạ · thở ra']
      ]
    });
  }

  /* ───────── Nâng tạ đơn sang ngang ───────── */
  {
    const base = P(feet(0.14, 6, 0), neut, { pel: [0, UP, 0], tr: [6, 0, 0] });
    const bot = P(base, both('w', [0.2, 0.84, 0.07]), both('e', [0.3, -0.2, -1]));
    const top = P(base, both('w', [0.72, 1.33, 0.12]), both('e', [0, 0.25, -1]));
    A.define('lateral-raise', {
      cam: { az: 22, el: 8, dist: 4.3, target: [0, 1.05, 0] },
      focus: ['shoulder'],
      props: [{ type: 'dumbbell', hand: 'both', len: 0.26 }],
      seq: [
        [bot, 0.8, 'Gối hơi chùng, thân nghiêng trước rất nhẹ'],
        [top, 1.2, 'Dẫn bằng khuỷu, nâng ra ngang — dừng ở tầm vai · thở ra'],
        [top, 0.3, 'Không nhún vai'],
        [bot, 2.0, 'Hạ chậm 2–3 giây · hít vào']
      ]
    });
  }

  /* ───────── Kéo cáp về mặt (face pull) ───────── */
  {
    const base = P(feet(0.15, 8, 0), { pel: [0, 0.93, 0], tr: [-5, 0, 0], kL: [0.2, 0, 1], kR: [-0.2, 0, 1] });
    const ext = P(base, both('w', [0.07, 1.55, 0.5]), both('e', [0.6, -0.2, 0]));
    const pull = P(base, both('w', [0.25, 1.6, 0.11]), both('e', [1, 0.45, -0.6]));
    A.define('face-pull', {
      cam: { az: 55, el: 12, dist: 4.4, target: [0, 1.2, 0.3] },
      focus: ['shoulder', 'back'],
      props: [{ type: 'cable', from: [0, 1.72, 0.95], handle: 'rope', stack: [0, 0, 1.05] }, { type: 'box', pos: [0, 1.1, 1.12], size: [0.32, 2.2, 0.06], mat: 'dark' }],
      seq: [
        [ext, 0.8, 'Ròng rọc ngang trán, lùi lại cho căng dây'],
        [pull, 1.2, 'Kéo dây về trán, tách hai đầu dây ra hai bên tai · thở ra'],
        [pull, 0.5, 'Khuỷu cao ngang vai, ép bả vai'],
        [ext, 1.8, 'Trả về chậm · hít vào']
      ]
    });
  }

  /* ───────── Đẩy ngực máy & đẩy ngực trên máy ───────── */
  {
    const sy = seatY(0.45);
    const legs = { aL: [0.18, 0.085, 0.42], aR: [-0.18, 0.085, 0.42], fL: [6, 0], fR: [-6, 0], kL: [0.2, 1, 1], kR: [-0.2, 1, 1] };
    const base = P(legs, { pel: [0, sy, 0], tr: [-8, 0, 0] });
    const start = P(base, both('w', [0.25, 1.02, 0.12]), both('e', [1, -0.2, -0.7]));
    const end = P(base, both('w', [0.2, 1.04, 0.46]), both('e', [1, -0.2, -0.3]));
    A.define('machine-chest-press', {
      cam: { az: 62, el: 12, dist: 4.3, target: [0, 0.95, 0.15] },
      focus: ['chest'],
      props: [
        { type: 'bench', pos: [0, 0.45, 0.02], seat: 0.42, w: 0.45, back: 0.75, incline: 82, backAt: -0.21 },
        { type: 'link', hand: 'L', from: [0.5, 1.02, -0.28] }, { type: 'link', hand: 'R', from: [-0.5, 1.02, -0.28] },
        { type: 'post', pos: [0.5, 0, -0.28], h: 1.02 }, { type: 'post', pos: [-0.5, 0, -0.28], h: 1.02 }
      ],
      seq: [
        [start, 0.8, 'Tay cầm ngang giữa ngực, ngồi sát lưng ghế'],
        [end, 1.2, 'Đẩy ra tới gần thẳng tay, không khoá khuỷu · thở ra'],
        [end, 0.3, 'Vai không nhô ra trước'],
        [start, 2.0, 'Trả về chậm tới khi ngực giãn · hít vào']
      ]
    });
    const ib = P(legs, { pel: [0, sy, 0], tr: [-28, 0, 0], hd: 5 });
    const istart = P(ib, both('w', [0.24, 1.05, -0.02]), both('e', [1, -0.4, -0.5]));
    const iend = P(ib, both('w', [0.18, 1.36, 0.14]), both('e', [1, -0.2, -0.2]));
    A.define('incline-machine-press', {
      cam: { az: 64, el: 12, dist: 4.3, target: [0, 1.0, 0.05] },
      focus: ['chest'],
      props: [
        { type: 'bench', pos: [0, 0.45, 0.02], seat: 0.42, w: 0.45, back: 0.8, incline: 62, backAt: -0.21 },
        { type: 'link', hand: 'L', from: [0.46, 0.55, -0.45] }, { type: 'link', hand: 'R', from: [-0.46, 0.55, -0.45] }
      ],
      seq: [
        [istart, 0.8, 'Tay cầm ngang ngực trên, bả vai kẹp'],
        [iend, 1.2, 'Đẩy lên theo quỹ đạo máy · thở ra'],
        [iend, 0.3, 'Không khoá khuỷu'],
        [istart, 2.0, 'Trả về chậm · hít vào']
      ]
    });
  }

  /* ───────── Chèo tạ đơn tì ngực ghế dốc ───────── */
  {
    const base = P(neut, { pel: [0, 0.88, -0.05], tr: [50, 0, 0], hd: -10, aL: [0.14, 0.085, -0.38], aR: [-0.14, 0.085, -0.38], fL: [5, 0], fR: [-5, 0], kL: [0.2, 0, 1], kR: [-0.2, 0, 1] });
    const hangP = P(base, both('w', [0.19, 0.62, 0.32]), both('e', [0.3, 0, -1]));
    const row = P(base, both('w', [0.21, 0.93, 0.08]), both('e', [0.3, 0.5, -1]));
    A.define('chest-supported-row', {
      cam: { az: 80, el: 10, dist: 4.3, target: [0, 0.85, 0.05] },
      focus: ['back'],
      props: [
        { type: 'box', pos: [0, 0.9, 0.22], size: [0.32, 0.06, 0.8], rot: [-40, 0, 0], mat: 'pad' },
        { type: 'post', pos: [0, 0, 0.3], h: 0.86 }, { type: 'box', pos: [0, 0.03, 0.3], size: [0.5, 0.06, 0.9], mat: 'steel' },
        { type: 'dumbbell', hand: 'both', len: 0.3 }
      ],
      seq: [
        [hangP, 0.8, 'Ngực tì ghế dốc, tay buông thẳng'],
        [row, 1.2, 'Kéo khuỷu về phía hông, ép bả vai · thở ra'],
        [row, 0.4, 'Ngực không nhấc khỏi ghế'],
        [hangP, 1.9, 'Hạ chậm tới thẳng tay · hít vào']
      ]
    });
  }

  /* ───────── Đẩy vai tạ đơn ngồi ───────── */
  {
    const sy = seatY(0.45);
    const base = P(pron, { pel: [0, sy, 0], tr: [-4, 0, 0], aL: [0.22, 0.085, 0.45], aR: [-0.22, 0.085, 0.45], fL: [8, 0], fR: [-8, 0], kL: [0.3, 1, 1], kR: [-0.3, 1, 1] });
    const bot = P(base, both('w', [0.33, 1.17, 0.05]), both('e', [1, -0.6, -0.1]));
    const top = P(base, both('w', [0.17, 1.54, 0.03]), both('e', [1, 0, 0]));
    A.define('db-shoulder-press', {
      cam: { az: 28, el: 10, dist: 4.3, target: [0, 1.0, 0] },
      focus: ['shoulder'],
      props: [{ type: 'bench', pos: [0, 0.45, 0.02], seat: 0.42, w: 0.36, back: 0.8, incline: 84, backAt: -0.21 }, { type: 'dumbbell', hand: 'both', len: 0.3 }],
      seq: [
        [bot, 0.8, 'Lưng sát ghế, tạ ngang tai, khuỷu hơi ra trước'],
        [top, 1.2, 'Siết bụng, đẩy thẳng lên gần thẳng tay · thở ra'],
        [top, 0.3, 'Không ưỡn lưng'],
        [bot, 1.9, 'Hạ chậm về ngang tai · hít vào']
      ]
    });
  }

  /* ───────── Bay vai sau trên máy ───────── */
  {
    const sy = seatY(0.45);
    const base = { pel: [0, sy, 0], tr: [6, 0, 0], aL: [0.18, 0.085, 0.36], aR: [-0.18, 0.085, 0.36], fL: [6, 0], fR: [-6, 0], kL: [0.2, 1, 1], kR: [-0.2, 1, 1] };
    const inn = P(base, both('w', [0.1, 1.04, 0.57]), both('e', [1, 0.1, -0.2]));
    const out = P(base, both('w', [0.71, 1.03, 0.12]), both('e', [0.2, 0.2, -1]));
    A.define('reverse-pec-deck', {
      cam: { az: 205, el: 32, dist: 4.2, target: [0, 1.0, 0.2] },
      focus: ['shoulder', 'back'],
      props: [
        { type: 'bench', pos: [0, 0.45, 0], seat: 0.4, w: 0.4 },
        { type: 'box', pos: [0, 1.0, 0.2], size: [0.28, 0.45, 0.07], mat: 'pad' },
        { type: 'post', pos: [0, 0, 0.62], h: 1.6 },
        { type: 'link', hand: 'L', from: [0.08, 1.45, 0.5] }, { type: 'link', hand: 'R', from: [-0.08, 1.45, 0.5] }
      ],
      seq: [
        [inn, 0.8, 'Ngực tựa đệm, tay gần thẳng, tay cầm ngang vai'],
        [out, 1.3, 'Mở hai tay ra sau theo vòng cung · thở ra'],
        [out, 0.4, 'Dừng khi tay ngang thân — không nhún vai'],
        [inn, 1.9, 'Trả về chậm · hít vào']
      ]
    });
  }

  /* ───────── Cuốn tạ đơn tay trước ───────── */
  {
    const base = P(feet(0.13, 6, 0), pron, { pel: [0, UP, 0], tr: [2, 0, 0] });
    const bot = P(base, both('w', [0.21, 0.83, 0.05]), both('e', [0.1, -1, -0.4]));
    const top = P(base, both('w', [0.21, 1.27, 0.17]), both('e', [0.1, -1, -0.4]));
    A.define('biceps-curl', {
      cam: { az: 68, el: 6, dist: 4.1, target: [0, 1.0, 0] },
      focus: ['arm'],
      props: [{ type: 'dumbbell', hand: 'both', len: 0.26 }],
      seq: [
        [bot, 0.8, 'Khuỷu ghim sát sườn, lòng bàn tay hướng trước'],
        [top, 1.1, 'Cuốn lên ngang vai · thở ra'],
        [top, 0.4, 'Siết tay trước — thân không đung đưa'],
        [bot, 2.0, 'Hạ chậm 2–3 giây · hít vào']
      ]
    });
  }

  /* ───────── Cuốn cáp tay trước ───────── */
  {
    const base = P(feet(0.13, 6, 0), { pel: [0, UP, 0], tr: [2, 0, 0] });
    const bot = P(base, both('w', [0.17, 0.83, 0.12]), both('e', [0.1, -1, -0.4]));
    const top = P(base, both('w', [0.17, 1.25, 0.2]), both('e', [0.1, -1, -0.4]));
    A.define('cable-curl', {
      cam: { az: 70, el: 8, dist: 4.2, target: [0, 0.95, 0.2] },
      focus: ['arm'],
      props: [{ type: 'cable', from: [0, 0.12, 0.62], handle: 'bar', barLen: 0.5, stack: [0, 0, 0.72] }, { type: 'box', pos: [0, 1.1, 0.8], size: [0.32, 2.2, 0.06], mat: 'dark' }],
      seq: [
        [bot, 0.8, 'Đứng cách máy nửa bước, khuỷu sát sườn'],
        [top, 1.1, 'Cuốn thanh lên ngang ngực · thở ra'],
        [top, 0.4, 'Siết 1 nhịp — khuỷu đứng yên'],
        [bot, 2.0, 'Hạ chậm tới gần thẳng tay · hít vào']
      ]
    });
  }

  /* ───────── Ép cáp tay sau ───────── */
  {
    const base = P(feet(0.15, 6, 0), { pel: [0, 0.93, -0.03], tr: [12, 0, 0], hd: -4 });
    const up = P(base, both('w', [0.17, 1.08, 0.28]), both('e', [0.1, -1, -0.3]));
    const down = P(base, both('w', [0.17, 0.83, 0.09]), both('e', [0.1, -1, -0.3]));
    A.define('triceps-pushdown', {
      cam: { az: 72, el: 8, dist: 4.3, target: [0, 1.1, 0.15] },
      focus: ['arm'],
      props: [{ type: 'cable', from: [0, 2.15, 0.42], handle: 'bar', barLen: 0.42, stack: [0, 0, 0.55] }, { type: 'box', pos: [0, 1.1, 0.62], size: [0.32, 2.2, 0.06], mat: 'dark' }],
      seq: [
        [up, 0.8, 'Khuỷu sát sườn, cẳng tay ngang sàn'],
        [down, 1.1, 'Ép thẳng tay xuống, siết tay sau · thở ra'],
        [down, 0.4, 'Khuỷu không bay ra trước'],
        [up, 1.9, 'Trả lên chậm · hít vào']
      ]
    });
  }

  /* ───────── Nâng vai ngang bằng cáp (tay trái) ───────── */
  {
    const base = P(feet(0.14, 6, 0), { pel: [0, UP, 0], tr: [2, 0, -6], wR: [-0.36, 1.12, 0.05], eR: [-1, -1, 0] });
    const bot = P(base, { wL: [-0.06, 0.86, 0.17], eL: [0.3, -0.2, -1] });
    const top = P(base, { wL: [0.72, 1.33, 0.1], eL: [0, 0.25, -1] });
    A.define('cable-lateral-raise', {
      cam: { az: 14, el: 8, dist: 4.4, target: [-0.1, 1.05, 0] },
      focus: ['shoulder'],
      props: [{ type: 'cable', from: [-0.42, 0.14, 0.08], to: 'L', handle: 'single', stack: [-0.5, 0, 0.08] }, { type: 'box', pos: [-0.55, 1.1, 0.08], size: [0.06, 2.2, 0.32], mat: 'dark' }],
      seq: [
        [bot, 0.8, 'Ròng rọc thấp nhất, cáp chạy qua trước người'],
        [top, 1.2, 'Nâng tay ra ngang tới tầm vai · thở ra'],
        [top, 0.3, 'Không nhún vai, không xoay thân'],
        [bot, 2.0, 'Hạ chậm 2–3 giây · hít vào — xong đổi tay']
      ]
    });
  }

  /* ───────── Dead bug ───────── */
  {
    const base = { pel: [0, 0.11, 0.2], tr: [-90, 0, 0], hd: 5 };
    const armsUp = P(both('w', [0.185, 0.64, -0.2]), both('e', [1, 0, 0]));
    const table = P(both('a', [0.1, 0.55, 0.62]), { fL: [0, -80], fR: [0, -80] }, both('k', [0, 1, -0.6]));
    const t0 = P(base, armsUp, table);
    const extA = P(t0, { wR: [-0.185, 0.17, -0.74], aL: [0.1, 0.17, 1.05], fL: [0, -40], kL: [0, 1, 0] });
    const extB = P(t0, { wL: [0.185, 0.17, -0.74], aR: [-0.1, 0.17, 1.05], fR: [0, -40], kR: [0, 1, 0] });
    A.define('dead-bug', {
      cam: { az: 90, el: 26, dist: 4.0, target: [0, 0.3, 0.2] },
      focus: ['core'],
      props: [{ type: 'mat', pos: [0, 0.006, 0.15], size: [0.7, 1.9] }],
      seq: [
        [t0, 0.8, 'Lưng dưới ép sàn, hông & gối gập 90°'],
        [extA, 2.0, 'Duỗi tay phải & chân trái thật chậm · thở ra dài'],
        [t0, 1.4, 'Thu về · hít vào'],
        [extB, 2.0, 'Đổi bên: tay trái & chân phải · thở ra'],
        [t0, 1.4, 'Thu về — lưng dưới vẫn ép sàn']
      ]
    });
  }

  /* ───────── Plank nghiêng (chống khuỷu trái) ───────── */
  {
    const arm = { wL: [0.27, 0.05, -0.25], eL: [0, -1, 0], wR: [0.05, 0.6, 0.12], eR: [0.6, 1, 0], fL: [90, 0], fR: [90, 0] };
    const up = P(arm, { ord: 'XYZ', tr: [-75, 90, 0], pel: [0, 0.408, 0.154], aL: [0, 0.093, 0.96], aR: [0, 0.27, 1.0], hd: -5 });
    const low = P(arm, { ord: 'XYZ', tr: [-80, 90, 0], pel: [0, 0.34, 0.16], aL: [0, 0.093, 0.96], aR: [0, 0.27, 1.0], hd: -5 });
    A.define('side-plank', {
      cam: { az: 58, el: 20, dist: 4.0, target: [0, 0.3, 0.3] },
      focus: ['core'],
      props: [{ type: 'mat', pos: [0, 0.006, 0.3], size: [0.7, 1.9] }],
      reps: false,
      seq: [
        [low, 0.8, 'Nằm nghiêng, khuỷu tay ngay dưới vai'],
        [up, 1.2, 'Siết bụng, nâng hông — đầu, hông, chân thành 1 đường'],
        [up, 2.5, 'Giữ, thở đều — hông không võng'],
        [up, 2.5, 'Giữ 20–30 giây rồi đổi bên'],
        [low, 1.2, 'Hạ hông nghỉ']
      ]
    });
  }

  /* ═════════ BÓNG RỔ ═════════ */
  const STANCE = { aL: [0.27, 0.085, 0.02], aR: [-0.27, 0.085, -0.02], fL: [12, 0], fR: [-12, 0], pel: [0, 0.76, -0.06], tr: [20, 0, 0], hd: -14, kL: [0.6, 0, 1], kR: [-0.6, 0, 1] };
  const shift = (pose, dx, dz) => {
    const o = Object.assign({}, pose);
    ['pel', 'aL', 'aR', 'wL', 'wR', 'ball'].forEach(k => { if (o[k]) o[k] = [o[k][0] + dx, o[k][1], o[k][2] + (dz || 0)]; });
    return o;
  };
  const FLOOR = 0.12;

  /* ───────── Dẫn bóng & xử lý bóng ───────── */
  {
    const guardL = { wL: [0.33, 0.98, 0.25], eL: [1, -0.5, 0] }, guardR = { wR: [-0.33, 0.98, 0.25], eR: [-1, -0.5, 0] };
    const rHi = P(STANCE, guardL, { wR: [-0.34, 0.8, 0.34], eR: [-1, -0.2, -0.3], ball: [-0.35, 0.66, 0.38] });
    const rLo = P(STANCE, guardL, { wR: [-0.34, 0.66, 0.36], eR: [-1, -0.2, -0.3], ball: [-0.37, FLOOR, 0.42] });
    const lHi = P(STANCE, guardR, { wL: [0.34, 0.8, 0.34], eL: [1, -0.2, -0.3], ball: [0.35, 0.66, 0.38] });
    const lLo = P(STANCE, guardR, { wL: [0.34, 0.66, 0.36], eL: [1, -0.2, -0.3], ball: [0.37, FLOOR, 0.42] });
    const xR = P(STANCE, guardL, { wR: [-0.12, 0.64, 0.4], eR: [-1, -0.2, -0.3], ball: [0, FLOOR, 0.45], pel: [0.02, 0.75, -0.06] });
    const xL = P(STANCE, guardR, { wL: [0.12, 0.64, 0.4], eL: [1, -0.2, -0.3], ball: [0, FLOOR, 0.45], pel: [-0.02, 0.75, -0.06] });
    const d = 0.26;
    A.define('ball-handling', {
      cam: { az: 24, el: 12, dist: 4.4, target: [0, 0.72, 0.1] },
      focus: ['forearm'],
      props: [{ type: 'ball' }],
      seq: [
        [rHi, 0.6, 'Tay phải · bóng thấp, mắt nhìn lên'], [rLo, d, 'Tay phải · ấn bóng xuống mạnh'], [rHi, d, 'Tay phải'], [rLo, d, 'Tay phải'], [rHi, d, 'Tay phải'],
        [xR, d, 'Chéo bóng (crossover) trước người'], [lHi, d, 'Bắt bóng tay trái'],
        [lLo, d, 'Tay trái · bóng thấp'], [lHi, d, 'Tay trái'], [lLo, d, 'Tay trái'], [lHi, d, 'Tay trái'],
        [xL, d, 'Chéo bóng về tay phải'], [rHi, d, 'Bắt bóng tay phải']
      ]
    });
  }

  /* ───────── Đổi hướng khi dẫn bóng ───────── */
  {
    const base = P(STANCE, { pel: [0, 0.72, -0.06], tr: [24, 0, 0] });
    // bên phải: dẫn tay phải, chân phải chống mạnh
    const r0 = shift(P(base, { wR: [-0.34, 0.78, 0.34], eR: [-1, -0.2, -0.3], ball: [-0.36, 0.64, 0.38], wL: [0.3, 0.95, 0.25] }), 0.45);
    const r1 = shift(P(base, { aR: [-0.36, 0.085, 0.0], tr: [26, 0, -8], pel: [-0.06, 0.68, -0.06], wR: [-0.1, 0.62, 0.4], eR: [-1, -0.2, -0.3], ball: [0.02, FLOOR, 0.45], wL: [0.3, 0.92, 0.25] }), 0.45);
    const l0 = shift(P(base, { wL: [0.34, 0.78, 0.34], eL: [1, -0.2, -0.3], ball: [0.36, 0.64, 0.38], wR: [-0.3, 0.95, 0.25] }), -0.45);
    const l1 = shift(P(base, { aL: [0.36, 0.085, 0.0], tr: [26, 0, 8], pel: [0.06, 0.68, -0.06], wL: [0.1, 0.62, 0.4], eL: [1, -0.2, -0.3], ball: [-0.02, FLOOR, 0.45], wR: [-0.3, 0.92, 0.25] }), -0.45);
    const midL = P(base, { pel: [0, 0.74, 0.0], aL: [0.2, 0.16, 0.2], aR: [-0.3, 0.085, -0.05], fL: [10, 10], wL: [0.32, 0.76, 0.36], eL: [1, -0.2, -0.3], ball: [0.36, FLOOR + 0.2, 0.42], wR: [-0.3, 0.95, 0.25], tr: [28, 0, 0] });
    const midR = P(base, { pel: [0, 0.74, 0.0], aR: [-0.2, 0.16, 0.2], aL: [0.3, 0.085, -0.05], fR: [-10, 10], wR: [-0.32, 0.76, 0.36], eR: [-1, -0.2, -0.3], ball: [-0.36, FLOOR + 0.2, 0.42], wL: [0.3, 0.95, 0.25], tr: [28, 0, 0] });
    A.define('change-direction', {
      cam: { az: 20, el: 16, dist: 5.0, target: [0, 0.7, 0.2] },
      focus: ['thigh', 'glute'],
      props: [{ type: 'ball' }, { type: 'cone', list: [[0.95, 0, 0.6], [-0.95, 0, 0.6]] }],
      seq: [
        [r0, 0.5, 'Tới mốc: hạ thấp người, bóng tay phải'],
        [r1, 0.4, 'Chân phải chống mạnh · chéo bóng sang trái'],
        [midL, 0.35, 'Bước đầu dứt khoát sang hướng mới'],
        [l0, 0.4, 'Tăng tốc tới mốc bên kia, bóng tay trái'],
        [l0, 0.3, 'Hạ trọng tâm trước khi đổi hướng'],
        [l1, 0.4, 'Chân trái chống · chéo bóng sang phải'],
        [midR, 0.35, 'Bước đầu dứt khoát'],
        [r0, 0.4, 'Tăng tốc'],
        [r0, 0.3, 'Lặp lại — chắc bóng rồi mới tăng tốc']
      ]
    });
  }

  /* ───────── Tăng tốc ngắn ───────── */
  {
    const run = (z, lead, lift, lean) => {
      const L = lead === 'L';
      const front = [0, 0.3 * lift + 0.1, z + 0.32], back = [0, 0.14, z - 0.32];
      return {
        pel: [0, 0.86, z], tr: [lean, 0, 0], hd: -6,
        aL: L ? [0.11, front[1], front[2]] : [0.11, back[1], back[2]], aR: L ? [-0.11, back[1], back[2]] : [-0.11, front[1], front[2]],
        fL: [0, L ? -10 : 45], fR: [0, L ? 45 : -10], kL: [0.1, 0, 1], kR: [-0.1, 0, 1],
        wL: L ? [0.24, 0.82, z - 0.35] : [0.22, 1.2, z + 0.32], wR: L ? [-0.22, 1.2, z + 0.32] : [-0.24, 0.82, z - 0.35],
        eL: [0.2, -1, L ? -0.3 : -1], eR: [-0.2, -1, L ? -1 : -0.3]
      };
    };
    const start = { pel: [0, 0.74, -1.25], tr: [38, 0, 0], hd: -10, aL: [0.13, 0.085, -1.0], aR: [-0.13, 0.12, -1.55], fL: [4, 0], fR: [-4, 30], kL: [0.2, 0, 1], kR: [-0.2, 0, 1],
      wL: [0.24, 0.85, -1.55], wR: [-0.22, 1.05, -0.95], eL: [0.2, -1, -1], eR: [-0.2, -1, -0.3] };
    A.define('acceleration', {
      cam: { az: 90, el: 8, dist: 6.0, target: [0, 0.85, 0.1] },
      focus: ['thigh', 'glute', 'calf'],
      props: [{ type: 'cone', list: [[0.6, 0, -1.25], [0.6, 0, 1.6]] }],
      seq: [
        [start, 0.05, 'Tư thế xuất phát: người nghiêng trước'],
        [start, 0.9, 'Sẵn sàng — chỉ làm khi đã khởi động kỹ'],
        [run(-0.85, 'R', 1, 34), 0.28, 'Bước ngắn, nhanh · tay đánh mạnh'],
        [run(-0.3, 'L', 1, 30), 0.26, 'Bước ngắn, nhanh'],
        [run(0.3, 'R', 1, 24), 0.24, 'Thân dựng dần'],
        [run(0.95, 'L', 1, 18), 0.22, '~90% sức, 10–15 m'],
        [run(1.55, 'R', 0.6, 10), 0.3, 'Giảm tốc'],
        [run(1.55, 'R', 0.2, 6), 0.8, 'Đi bộ về, nghỉ 60–90 giây']
      ]
    });
  }

  /* ───────── Di chuyển phòng thủ (trượt ngang) ───────── */
  {
    const arms = { wL: [0.62, 1.0, 0.18], wR: [-0.62, 1.0, 0.18], eL: [1, -0.6, -0.3], eR: [-1, -0.6, -0.3] };
    const base = P(arms, { tr: [16, 0, 0], hd: -8, fL: [14, 0], fR: [-14, 0], kL: [0.6, 0, 1], kR: [-0.6, 0, 1] });
    const st = x => P(base, { pel: [x, 0.7, -0.05], aL: [x + 0.36, 0.085, 0], aR: [x - 0.36, 0.085, 0] }, { wL: [x + 0.62, 1.0, 0.18], wR: [x - 0.62, 1.0, 0.18] });
    const leadOut = (x, dir) => { const p = st(x); p.pel = [x + 0.12 * dir, 0.71, -0.05];
      if (dir > 0) p.aL = [x + 0.62, 0.13, 0]; else p.aR = [x - 0.62, 0.13, 0];
      p.wL = [p.pel[0] + 0.62, 1.0, 0.18]; p.wR = [p.pel[0] - 0.62, 1.0, 0.18]; return p; };
    const wide = (x, dir) => { const p = st(x); p.pel = [x + 0.2 * dir, 0.68, -0.05];
      if (dir > 0) p.aL = [x + 0.66, 0.085, 0]; else p.aR = [x - 0.66, 0.085, 0];
      p.wL = [p.pel[0] + 0.62, 1.0, 0.18]; p.wR = [p.pel[0] - 0.62, 1.0, 0.18]; return p; };
    const s = 0.22;
    const seq = [[st(-0.6), 0.6, 'Tư thế thủ: chân rộng, gối khuỵu, tay mở']];
    let x = -0.6;
    for (let i = 0; i < 3; i++) { seq.push([leadOut(x, 1), s, 'Đẩy bằng chân sau, chân trước dẫn']); seq.push([wide(x, 1), s, 'Không bắt chéo chân']); x += 0.4; seq.push([st(x), s, 'Không chụm chân — đầu ngang bằng']); }
    seq.push([st(x), 0.3, 'Đổi chiều']);
    for (let i = 0; i < 3; i++) { seq.push([leadOut(x, -1), s, 'Trượt về bên kia']); seq.push([wide(x, -1), s, 'Thấp người']); x -= 0.4; seq.push([st(x), s, 'Không nhảy lên, trượt sát sàn']); }
    A.define('defensive-slide', {
      cam: { az: 14, el: 10, dist: 5.2, target: [0, 0.75, 0] },
      focus: ['glute', 'thigh'],
      props: [],
      seq
    });
  }

  /* ───────── Ném rổ kỹ thuật & ném sau dẫn bóng ───────── */
  const HOOP = [0, 3.05, 3.1];
  function shotSeq(pre, z0, jump) {
    const legs = P({ aL: [0.15, 0.085, z0 + 0.05], aR: [-0.15, 0.085, z0 - 0.04], fL: [8, 0], fR: [-12, 0], kL: [0.25, 0, 1], kR: [-0.25, 0, 1] });
    const set = P(legs, { pel: [0, 0.86, z0 - 0.05], tr: [8, 0, 0], hd: -8, wR: [-0.13, 1.24, z0 + 0.26], eR: [-0.3, -1, 0], wL: [0.06, 1.28, z0 + 0.3], eL: [1, -0.5, 0], ball: [-0.05, 1.32, z0 + 0.36] });
    const dip = P(set, { pel: [0, 0.76, z0 - 0.1], tr: [18, 0, 0] });
    const air = jump ? 0.3 : 0;
    const rise = P(set, { pel: [0, 0.94 + air, z0], tr: [2, 0, 0], hd: -14, wR: [-0.13, 1.68 + air, z0 + 0.18], eR: [-0.25, -1, 0], wL: [0.07, 1.72 + air, z0 + 0.2], eL: [1, -0.2, 0], ball: [-0.08, 1.8 + air, z0 + 0.24],
      aL: [0.15, 0.085 + air, z0 + 0.05], aR: [-0.15, 0.085 + air, z0 - 0.04], fL: [8, jump ? 35 : 20], fR: [-12, jump ? 35 : 20] });
    const release = P(rise, { wR: [-0.1, 2.02 + air, z0 + 0.36], eR: [-0.2, -0.6, -0.4], wL: [0.2, 1.75 + air, z0 + 0.22], ball: [-0.08, 2.18 + air, z0 + 0.5] });
    const land = P(set, { pel: [0, 0.88, z0 - 0.02], tr: [6, 0, 0], hd: -14, wR: [-0.12, 1.98, z0 + 0.4], eR: [-0.2, -0.6, -0.4], wL: [0.2, 1.62, z0 + 0.25], eL: [1, -0.2, 0] });
    const apex = P(land, { ball: [-0.04, (2.2 + HOOP[1]) / 2 + 0.85, (z0 + HOOP[2]) / 2] });
    const inRim = P(land, { ball: [HOOP[0], HOOP[1] + 0.05, HOOP[2]] });
    const drop = P(land, { ball: [HOOP[0], 1.2, HOOP[2]] });
    const floor = P(land, { ball: [HOOP[0], FLOOR, HOOP[2] - 0.2] });
    return [
      ...pre(set),
      [dip, 0.35, 'Khuỵu gối, bóng trước ngực · chân – gối – tay một đường'],
      [rise, 0.3, jump ? 'Bật thẳng lên — không trôi người' : 'Duỗi chân, đưa bóng lên điểm ném'],
      [release, 0.18, 'Ra tay mềm, khuỷu thẳng hàng rổ'],
      [apex, 0.45, 'Giữ tay sau khi ném (follow-through)'],
      [inRim, 0.45, 'Vào!'],
      [drop, 0.25, 'Vào!'],
      [floor, 0.2, 'Nhặt bóng, lặp lại'],
      [set, 0.05, '']
    ];
  }
  {
    A.define('shooting-form', {
      cam: { az: 72, el: 8, dist: 7.6, target: [0, 1.85, 1.5] },
      focus: ['arm', 'thigh'],
      props: [{ type: 'ball' }, { type: 'hoop', pos: HOOP }],
      seq: shotSeq(set => [[set, 0.8, 'Đứng gần rổ, cầm bóng một tay, tay kia đỡ']], 0, false)
    });
  }
  {
    const z0 = 0;
    const dr = (x, hi) => P(STANCE, { pel: [x, 0.78, z0 - 0.06], wR: [x - 0.34, hi ? 0.8 : 0.66, z0 + 0.34], eR: [-1, -0.2, -0.3], wL: [x + 0.3, 0.95, z0 + 0.25], ball: [x - 0.36, hi ? 0.66 : FLOOR, z0 + 0.4] ,
      aL: [x + 0.27, 0.085, z0 + 0.02], aR: [x - 0.27, 0.085, z0 - 0.02] });
    const hop = P(STANCE, { pel: [0, 0.82, z0 - 0.06], aL: [0.18, 0.2, z0 + 0.05], aR: [-0.18, 0.2, z0 - 0.04], fL: [8, 20], fR: [-12, 20], wR: [-0.13, 1.22, z0 + 0.28], wL: [0.06, 1.26, z0 + 0.3], eR: [-0.3, -1, 0], eL: [1, -0.5, 0], ball: [-0.05, 1.3, z0 + 0.36] });
    A.define('pullup-jumper', {
      cam: { az: 66, el: 8, dist: 7.8, target: [0.2, 1.85, 1.4] },
      focus: ['thigh', 'arm'],
      props: [{ type: 'ball' }, { type: 'hoop', pos: HOOP }],
      seq: shotSeq(set => [
        [dr(1.1, true), 0.05, 'Dẫn bóng sang ngang'],
        [dr(0.9, false), 0.26, 'Dẫn bóng 1–2 nhịp sang trái'],
        [dr(0.65, true), 0.26, ''],
        [dr(0.4, false), 0.26, 'Nhịp cuối'],
        [hop, 0.3, 'Dừng gọn hai chân (nhảy dừng) · gom bóng'],
        [set, 0.25, 'Vững trước khi lên']
      ], z0, true)
    });
  }

  /* ═════════ KHỞI ĐỘNG / PHỤC HỒI ═════════ */
  const STAND = P(feet(0.14, 6, 0), { pel: [0, UP, 0], tr: [2, 0, 0], wL: [0.22, 0.86, 0.05], wR: [-0.22, 0.86, 0.05] });

  /* ───────── Khởi động trước bóng rổ: nâng gối cao, lunge vặn người, trượt ngang ───────── */
  {
    const knee = side => {
      const L = side === 'L';
      return P(STAND, { pel: [0, 0.97, 0], tr: [4, 0, 0], aL: L ? [0.12, 0.62, 0.3] : [0.12, 0.085, -0.02], aR: L ? [-0.12, 0.09, -0.02] : [-0.12, 0.62, 0.3],
        fL: [0, L ? 30 : 20], fR: [0, L ? 20 : 30], kL: [0, 0.3, 1], kR: [0, 0.3, 1],
        wL: L ? [0.22, 0.88, -0.25] : [0.22, 1.25, 0.3], wR: L ? [-0.22, 1.25, 0.3] : [-0.22, 0.88, -0.25], eL: [0.2, -1, -0.5], eR: [-0.2, -1, -0.5] });
    };
    const lunge = (side, twist) => {
      const L = side === 'L';
      return { pel: [0, 0.6, 0.0], tr: [6, twist, 0], hd: 0, aL: L ? [0.13, 0.085, 0.45] : [0.13, 0.25, -0.62], aR: L ? [-0.13, 0.25, -0.62] : [-0.13, 0.085, 0.45],
        fL: [0, L ? 0 : 65], fR: [0, L ? 65 : 0], kL: L ? [0.1, 0, 1] : [0, -1, 0.4], kR: L ? [0, -1, 0.4] : [-0.1, 0, 1],
        wLt: [0.5, -0.05, 0.2], wRt: [-0.5, -0.05, 0.2], eLt: [0, -1, 0], eRt: [0, -1, 0] };
    };
    A.define('bb-warmup', {
      cam: { az: 50, el: 10, dist: 4.8, target: [0, 0.85, 0.1] },
      focus: ['thigh', 'glute'],
      props: [],
      reps: false,
      seq: [
        [STAND, 0.6, 'Chạy nhẹ 2–3 phút trước, rồi các bài động:'],
        [knee('L'), 0.35, 'Nâng gối cao, tay đánh theo nhịp'], [STAND, 0.3, 'Nâng gối cao'], [knee('R'), 0.35, 'Nâng gối cao'], [STAND, 0.3, 'Nâng gối cao'],
        [knee('L'), 0.35, 'Nâng gối cao'], [STAND, 0.3, 'Nâng gối cao'], [knee('R'), 0.35, 'Nâng gối cao'], [STAND, 0.4, ''],
        [lunge('L', 0), 0.8, 'Lunge: bước dài, gối sau gần chạm sàn'], [lunge('L', 40), 0.7, 'Vặn thân về phía chân trước'], [lunge('L', 0), 0.6, 'Lunge'],
        [STAND, 0.7, 'Đổi chân'], [lunge('R', 0), 0.8, 'Lunge chân phải'], [lunge('R', -40), 0.7, 'Vặn thân'], [lunge('R', 0), 0.6, 'Lunge'],
        [STAND, 0.8, 'Kết thúc: 2–3 lần chạy tăng tốc nhẹ 70–80%']
      ]
    });
  }

  /* ───────── Khởi động trước gym: squat tay không, gập hông, xoay tay ───────── */
  {
    const sq = P(feet(0.17, 20, 0), { pel: [0, 0.55, -0.15], tr: [30, 0, 0], hd: -10, kL: [0.5, 0, 1], kR: [-0.5, 0, 1], wL: [0.12, 1.15, 0.45], wR: [-0.12, 1.15, 0.45], eL: [0.5, -1, 0], eR: [-0.5, -1, 0] });
    const st2 = P(feet(0.17, 20, 0), { pel: [0, UP, 0], tr: [2, 0, 0], wL: [0.12, 1.25, 0.45], wR: [-0.12, 1.25, 0.45], eL: [0.5, -1, 0], eR: [-0.5, -1, 0] });
    const hinge = P(feet(0.12, 5, 0), { pel: [0, 0.86, -0.18], tr: [70, 0, 0], hd: -5, wL: [0.15, 0.42, 0.42], wR: [-0.15, 0.42, 0.42], kL: [0.2, 0, 1], kR: [-0.2, 0, 1], eL: [0.3, 0, -1], eR: [-0.3, 0, -1] });
    const circ = a => {
      const r = 0.24, ang = a * Math.PI / 180;
      return P(STAND, { wL: [0.72, 1.36 + r * Math.sin(ang), r * Math.cos(ang)], wR: [-0.72, 1.36 + r * Math.sin(ang), r * Math.cos(ang)], eL: [0, -1, 0], eR: [0, -1, 0] });
    };
    A.define('gym-warmup', {
      cam: { az: 40, el: 10, dist: 4.6, target: [0, 0.9, 0] },
      focus: ['thigh', 'shoulder'],
      props: [],
      reps: false,
      seq: [
        [STAND, 0.6, '3–5 phút đạp xe / đi bộ dốc trước, rồi:'],
        [st2, 0.5, 'Squat tay không × 8–10'], [sq, 1.0, 'Ngồi xuống, ngực mở'], [st2, 0.9, 'Đứng lên'], [sq, 1.0, 'Squat tay không'], [st2, 0.9, ''],
        [STAND, 0.6, 'Gập hông với tay xuống'], [hinge, 1.1, 'Đẩy hông ra sau, lưng thẳng'], [STAND, 0.9, ''],
        [circ(90), 0.6, 'Xoay tay vòng lớn'], [circ(0), 0.3, 'Xoay tay'], [circ(-90), 0.3, 'Xoay tay'], [circ(-180), 0.3, 'Xoay tay'], [circ(-270), 0.3, 'Xoay tay'],
        [circ(-360), 0.3, 'Xoay tay'], [circ(-450), 0.3, ''], [STAND, 0.6, 'Vào bài đầu: 1–2 hiệp nhẹ 50% → 75% mức tạ']
      ]
    });
  }

  /* ───────── Giãn cơ sau tập: đùi trước, đùi sau, hông, ngực ───────── */
  {
    const quad = P(STAND, { aR: [-0.12, 0.58, -0.32], fR: [0, 60], kR: [0, -1, 0], wR: [-0.16, 0.62, -0.38], eR: [-0.4, 0, -1], wL: [0.32, 1.1, 0.3], eL: [1, -0.4, 0], tr: [0, 0, 0] });
    const ham = { pel: [0, 0.86, -0.25], tr: [55, 0, 0], hd: -5, aL: [0.12, 0.085, 0.4], fL: [0, -35], aR: [-0.12, 0.085, -0.15], fR: [-8, 0], kL: [0, 1, 0.2], kR: [-0.2, 0, 1], wL: [0.1, 0.62, 0.33], wR: [-0.1, 0.62, 0.33], eL: [1, 0, 0], eR: [-1, 0, 0] };
    const hip = { pel: [0, 0.5, -0.05], tr: [-4, 0, 0], hd: 0, aL: [0.13, 0.085, 0.42], fL: [4, 0], aR: [-0.13, 0.13, -0.72], fR: [0, 80], kL: [0.1, 0, 1], kR: [0, -1, 0.3], wL: [0.18, 0.58, 0.32], wR: [-0.18, 0.58, 0.32], eL: [1, 0, 0], eR: [-1, 0, 0] };
    const chest = P(STAND, { tr: [-4, 0, 0], hd: -8, wL: [0.1, 0.78, -0.32], wR: [-0.1, 0.78, -0.32], eL: [1, 0, -0.2], eR: [-1, 0, -0.2] });
    A.define('stretching', {
      cam: { az: 70, el: 10, dist: 4.4, target: [0, 0.8, 0] },
      focus: ['thigh'],
      props: [{ type: 'mat', pos: [0, 0.006, 0.0], size: [0.7, 1.9] }],
      reps: false,
      seq: [
        [STAND, 0.6, 'Giữ mỗi tư thế 30–45 giây, căng nhẹ — không đau'],
        [quad, 1.0, 'Đùi trước: kéo gót về mông, hai gối sát nhau'], [quad, 3.0, 'Thở chậm'],
        [STAND, 0.8, ''],
        [ham, 1.2, 'Đùi sau: gót chân trước chạm sàn, đẩy hông ra sau'], [ham, 3.0, 'Lưng thẳng, cảm nhận đùi sau căng'],
        [STAND, 0.8, ''],
        [hip, 1.4, 'Hông trước: quỳ một gối, đẩy hông về trước'], [hip, 3.0, 'Siết mông bên chân sau'],
        [STAND, 0.9, ''],
        [chest, 1.0, 'Ngực & vai: đan tay sau lưng, mở ngực'], [chest, 2.6, 'Thở chậm'],
        [STAND, 0.8, 'Đổi bên với các bài một chân']
      ]
    });
  }

  /* ───────── Vận động khớp: world's greatest stretch, cổ chân, xoay ngực ───────── */
  {
    const lungeBase = { pel: [0, 0.48, -0.1], tr: [42, 0, 0], hd: -10, aL: [0.15, 0.085, 0.48], fL: [6, 0], aR: [-0.13, 0.15, -0.72], fR: [0, 70], kL: [0.2, 0, 1], kR: [0, -1, 0.3] };
    const wgs1 = P(lungeBase, { wR: [-0.06, 0.06, 0.36], eR: [-1, 0, 0], wL: [0.06, 0.4, 0.36], eL: [0.3, -1, -0.2] });
    const wgs2 = P(lungeBase, { tr: [40, 50, 0], wR: [-0.06, 0.06, 0.36], eR: [-1, 0, 0], wL: [0.55, 1.35, 0.0], eL: [1, 0, 0] });
    const ankle = { pel: [0, 0.48, -0.15], tr: [8, 0, 0], aL: [0.14, 0.085, 0.3], fL: [4, 0], aR: [-0.13, 0.13, -0.62], fR: [0, 80], kL: [0.15, 0, 1], kR: [0, -1, 0.3], wL: [0.17, 0.6, 0.42], wR: [-0.1, 0.6, 0.4], eL: [1, 0, 0], eR: [-1, 0, 0] };
    const ankle2 = P(ankle, { pel: [0, 0.46, -0.02] });
    A.define('mobility', {
      cam: { az: 62, el: 14, dist: 4.4, target: [0, 0.6, 0] },
      focus: ['glute', 'thigh'],
      props: [{ type: 'mat', pos: [0, 0.006, -0.1], size: [0.7, 1.9] }],
      reps: false,
      seq: [
        [wgs1, 0.8, 'World’s greatest stretch: bước lunge sâu, tay phải chống sàn'],
        [wgs1, 1.2, 'Khuỷu tay trái hạ về phía mắt cá chân trước'],
        [wgs2, 1.3, 'Xoay ngực, vươn tay trái lên trần'],
        [wgs2, 1.5, 'Giữ 2 nhịp thở'],
        [wgs1, 1.1, 'Về lại · 5 lần mỗi bên'],
        [ankle, 1.0, 'Cổ chân: quỳ một gối, gót chân trước bám sàn'],
        [ankle2, 0.9, 'Đẩy gối về trước qua mũi chân'], [ankle, 0.8, ''], [ankle2, 0.9, 'Đẩy gối về trước'], [ankle, 0.8, '10 lần mỗi bên']
      ]
    });
  }

  /* ───────── Đi bộ nhẹ (máy chạy bộ) ───────── */
  {
    const D = 0.12; // mặt băng chạy
    const step = (lead, phase) => {
      const L = lead === 'L';
      if (phase === 'strike') return { pel: [0, 0.92 + D, 0], tr: [4, 0, 0], hd: -4,
        aL: L ? [0.1, 0.1 + D, 0.3] : [0.1, 0.13 + D, -0.3], aR: L ? [-0.1, 0.13 + D, -0.3] : [-0.1, 0.1 + D, 0.3],
        fL: [0, L ? -14 : 28], fR: [0, L ? 28 : -14], kL: [0.1, 0, 1], kR: [-0.1, 0, 1],
        wL: L ? [0.21, 0.86, -0.18] : [0.21, 0.92, 0.2], wR: L ? [-0.21, 0.92, 0.2] : [-0.21, 0.86, -0.18], eL: [0.2, -1, -0.4], eR: [-0.2, -1, -0.4] };
      return { pel: [0, 0.95 + D, 0], tr: [4, 0, 0], hd: -4,
        aL: L ? [0.1, 0.085 + D, 0.0] : [0.1, 0.2 + D, 0.02], aR: L ? [-0.1, 0.2 + D, 0.02] : [-0.1, 0.085 + D, 0.0],
        fL: [0, L ? 0 : 6], fR: [0, L ? 6 : 0], kL: [0.1, 0, 1], kR: [-0.1, 0, 1],
        wL: [0.22, 0.88, 0.0], wR: [-0.22, 0.88, 0.0], eL: [0.2, -1, -0.4], eR: [-0.2, -1, -0.4] };
    };
    A.define('walk', {
      cam: { az: 82, el: 8, dist: 4.4, target: [0, 1.0, 0] },
      focus: [],
      props: [{ type: 'box', pos: [0, D / 2, 0.1], size: [0.7, D, 1.7], mat: 'dark' }, { type: 'post', pos: [0.32, 0, 0.9], h: 1.2 }, { type: 'post', pos: [-0.32, 0, 0.9], h: 1.2 },
        { type: 'box', pos: [0, 1.25, 0.9], size: [0.75, 0.1, 0.25], mat: 'steel' }],
      reps: false,
      seq: [
        [step('L', 'strike'), 0.3, 'Đi bộ nhịp vừa — nói chuyện thoải mái được'],
        [step('L', 'mid'), 0.3, 'Đi bộ nhẹ 30–45 phút'],
        [step('R', 'strike'), 0.3, 'Tay vung tự nhiên'],
        [step('R', 'mid'), 0.3, 'Thở bằng mũi, nhịp nhàng']
      ]
    });
  }

  /* ═════════ NHÓM CƠ: đỏ = cơ chính, cam nhạt = cơ hỗ trợ ═════════ */
  const MUS = {
    'goblet-squat': [['quads', 'glutes'], ['adductors', 'abs']],
    'db-rdl': [['hamstrings', 'glutes'], ['lower_back']],
    'leg-press': [['quads', 'glutes'], ['adductors']],
    'bulgarian-split-squat': [['quads', 'glutes'], ['adductors', 'hamstrings']],
    'seated-leg-curl': [['hamstrings'], ['calves']],
    'standing-calf-raise': [['calves'], []],
    'pallof-press': [['obliques', 'abs'], []],
    'cmj': [['quads', 'glutes', 'calves'], ['hamstrings']],
    'trap-bar-deadlift': [['glutes', 'quads', 'hamstrings'], ['lower_back', 'traps', 'forearms']],
    'step-up': [['glutes', 'quads'], ['hamstrings', 'calves']],
    'hip-thrust': [['glutes'], ['hamstrings']],
    'lying-leg-curl': [['hamstrings'], ['calves']],
    'seated-calf-raise': [['calves'], []],
    'db-bench-press': [['chest'], ['delts_front', 'triceps']],
    'lat-pulldown': [['lats'], ['biceps', 'midback']],
    'neutral-pulldown': [['lats'], ['biceps', 'midback']],
    'seated-cable-row': [['midback', 'lats'], ['delts_rear', 'biceps']],
    'incline-db-press': [['chest', 'delts_front'], ['triceps']],
    'lateral-raise': [['delts_side'], ['traps']],
    'face-pull': [['delts_rear', 'midback'], ['traps']],
    'machine-chest-press': [['chest'], ['delts_front', 'triceps']],
    'incline-machine-press': [['chest', 'delts_front'], ['triceps']],
    'chest-supported-row': [['midback', 'lats'], ['delts_rear', 'biceps']],
    'db-shoulder-press': [['delts_front', 'delts_side'], ['triceps', 'traps']],
    'reverse-pec-deck': [['delts_rear'], ['midback', 'traps']],
    'biceps-curl': [['biceps'], ['forearms']],
    'cable-curl': [['biceps'], ['forearms']],
    'triceps-pushdown': [['triceps'], []],
    'cable-lateral-raise': [['delts_side'], ['traps']],
    'dead-bug': [['abs'], ['obliques']],
    'side-plank': [['obliques'], ['abs', 'glutes']],
    'gym-warmup': [[], ['quads', 'glutes', 'delts_side', 'hamstrings']],
    'bb-warmup': [[], ['quads', 'glutes', 'hamstrings', 'calves']],
    'ball-handling': [['forearms'], ['delts_front', 'quads']],
    'change-direction': [['quads', 'glutes', 'adductors'], ['calves']],
    'acceleration': [['glutes', 'hamstrings', 'quads'], ['calves']],
    'defensive-slide': [['glutes', 'adductors', 'quads'], ['calves']],
    'shooting-form': [['triceps', 'delts_front'], ['quads', 'calves']],
    'pullup-jumper': [['quads', 'triceps', 'delts_front'], ['calves', 'glutes']],
    'stretching': [[], ['hamstrings', 'quads', 'chest']],
    'mobility': [[], ['glutes', 'hamstrings', 'calves']],
    'walk': [[], ['calves', 'quads']]
  };
  Object.entries(MUS).forEach(([id, [p, s]]) => A.muscles(id, p, s));

  /* ═════════ HƯỚNG LÒNG BÀN TAY: 'sup' ngửa, 'pro' úp, hoặc [vào trong, lên, ra trước] theo thân ═════════ */
  const PALM = {
    'db-shoulder-press': [0, 0, 1], 'db-bench-press': [0, -1, 0], 'incline-db-press': [0, -1, 0],
    'lat-pulldown': [0, 0, 1], 'neutral-pulldown': [1, 0, 0], 'seated-cable-row': [1, 0, 0], 'chest-supported-row': [1, 0, 0],
    'face-pull': [1, -0.5, 0], 'machine-chest-press': [1, 0, 0], 'incline-machine-press': [1, 0, 0], 'reverse-pec-deck': [1, 0, 0],
    'biceps-curl': 'sup', 'cable-curl': 'sup', 'triceps-pushdown': [1, 0, 0],
    'lateral-raise': [1, -1.2, 0], 'cable-lateral-raise': [1, -1.2, 0],
    'goblet-squat': [1, 1, 0], 'db-rdl': [0, 0, -1], 'trap-bar-deadlift': [1, 0, 0], 'step-up': [1, 0, 0], 'bulgarian-split-squat': [1, 0, 0],
    'pallof-press': [1, 0, 0], 'dead-bug': [1, 0, 0], 'standing-calf-raise': [1, 0, 0], 'ball-handling': [0, -1, 0]
  };
  Object.entries(PALM).forEach(([id, p]) => { const d = A.info(id); if (d) d.palm = p; });
})();
