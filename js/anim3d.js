/*
 * Anim3D — người mẫu 3D tập luyện chạy ngay trong trang (three.js, không cần file video, không quảng cáo).
 *
 * Hệ toạ độ: Y hướng lên, người mẫu nhìn về +Z, tay/chân TRÁI ở phía +X. Sàn y = 0. Đơn vị mét, góc độ.
 * Một tư thế (pose) gồm:
 *   pel [x,y,z]  tâm hông          tr [cúi, xoay, nghiêng]  thân (cúi + = đổ người về trước)
 *   bend         gập lưng trên (độ)  hd  gật đầu (độ, + = cúi cằm)
 *   aL aR        vị trí cổ chân      fL fR [xoay, nhón] bàn chân (xoay + = mũi chân về +X; nhón + = nhấc gót)
 *   kL kR        hướng đầu gối (vector gợi ý)
 *   wL wR        vị trí cổ tay       eL eR  hướng khuỷu tay (vector gợi ý)
 *   cùng các khoá riêng cho dụng cụ (ball, plat, ...).
 * Đầu gối, khuỷu tay được tính bằng IK hai đoạn → bàn chân bám sàn, tay bám đúng tay cầm.
 */
(function () {
  'use strict';
  const T = window.THREE;
  if (!T) { window.Anim3D = { define() {}, has: () => false, mount: () => null, muscles() {}, list: () => [] }; return; }
  if (T && T.ColorManagement) T.ColorManagement.legacyMode = false; // màu hex hiểu là sRGB → không bị bạc
  const DEG = Math.PI / 180;
  const V = (x, y, z) => new T.Vector3(x, y, z);

  /* Kích thước cơ thể (~1,72 m) */
  const L = {
    ankleH: 0.071, shank: 0.444, thigh: 0.44, hip: 0.107, spine: 0.509,
    sh: 0.188, shDrop: 0.045, neck: 0.061, headR: 0.105, upper: 0.27, fore: 0.26
  };
  const STAND_Y = L.ankleH + L.shank + L.thigh; // 0.955 — số đo khớp khớp với khung người trong js/data/body.js
  // vai / hông / cột sống lấy đúng theo người mẫu (js/data/body.js) để da không bị kéo giãn ở vai
  if (window.BODY_MESH && window.BODY_MESH.rest) {
    const r = window.BODY_MESH.rest;
    L.sh = r.shL[0]; L.hip = r.hipL[0]; L.spine = r.chest[1] - r.pel[1]; L.neck = r.neck[1] - r.chest[1]; L.shDrop = r.chest[1] - r.shL[1];
  }

  const COLORS = {
    bg: 0xf3f5f4, floor: 0xf3f5f4, body: 0xc99274, backdrop: 0xdcefe6, hot: 0xff4a1c, hotGlow: 0xff2a0a, warm: 0xff9c66, shorts: 0x15171b, rimBlue: 0x7cc8ff,
    sole: 0xff8a3d, steel: 0x3b4250, dark: 0x1b1f26, pad: 0x262a32, plate: 0x0e1013, chrome: 0xb9c2cf,
    ball: 0xe46a1f, rim: 0xff5a1f, cable: 0xd6dde6, mat: 0x23272e
  };

  /* ── tiện ích hình học ── */
  function quatTrunk(tr, ord) {
    const e = new T.Euler((tr[0] || 0) * DEG, (tr[1] || 0) * DEG, -(tr[2] || 0) * DEG, ord || 'YXZ');
    return new T.Quaternion().setFromEuler(e);
  }
  function qx(deg) { return new T.Quaternion().setFromAxisAngle(V(1, 0, 0), deg * DEG); }

  function ik(root, target, a, b, pole) {
    const d = target.clone().sub(root);
    let len = d.length();
    const end = target.clone();
    if (len > a + b - 1e-4) { len = a + b - 1e-4; d.setLength(len); end.copy(root).add(d); }
    if (len < Math.abs(a - b) + 1e-3) { len = Math.abs(a - b) + 1e-3; d.setLength(len); end.copy(root).add(d); }
    const dir = d.clone().normalize();
    const cosA = (a * a + len * len - b * b) / (2 * a * len);
    const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
    let p = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir)));
    if (p.lengthSq() < 1e-8) p = V(0, 0, 1).sub(dir.clone().multiplyScalar(dir.z));
    p.normalize();
    const mid = root.clone().add(dir.multiplyScalar(a * cosA)).add(p.multiplyScalar(a * sinA));
    return { mid, end };
  }

  /* Tính toạ độ các khớp từ một tư thế */
  function solve(p) {
    const q = quatTrunk(p.tr || [0, 0, 0], p.ord);
    const qb = q.clone().multiply(qx(p.bend || 0));
    const qh = qb.clone().multiply(qx(p.hd || 0));
    const pel = V(...p.pel);
    const J = { q, qb, qh, pel };
    J.hipL = pel.clone().add(V(L.hip, 0, 0).applyQuaternion(q));
    J.hipR = pel.clone().add(V(-L.hip, 0, 0).applyQuaternion(q));
    J.mid = pel.clone().add(V(0, L.spine * 0.5, 0).applyQuaternion(q));
    J.chest = J.mid.clone().add(V(0, L.spine * 0.5, 0).applyQuaternion(qb));
    J.shL = J.chest.clone().add(V(L.sh, -L.shDrop, 0).applyQuaternion(qb));
    J.shR = J.chest.clone().add(V(-L.sh, -L.shDrop, 0).applyQuaternion(qb));
    J.neck = J.chest.clone().add(V(0, L.neck, 0).applyQuaternion(qb));
    J.head = J.neck.clone().add(V(0, L.headR * 0.95, 0.012).applyQuaternion(qh));
    for (const s of ['L', 'R']) {
      const sign = s === 'L' ? 1 : -1;
      const f = p['f' + s] || [0, 0];
      const qf = new T.Quaternion().setFromEuler(new T.Euler(f[1] * DEG, f[0] * DEG, 0, 'YXZ'));
      const fwd = V(0, 0, 1).applyQuaternion(qf), down = V(0, -1, 0).applyQuaternion(qf);
      const ank = V(...p['a' + s]);
      const kp = p['k' + s] ? V(...p['k' + s]) : fwd.clone().setY(0).normalize().add(V(0.15 * sign, 0, 0));
      const leg = ik(J['hip' + s], ank, L.thigh, L.shank, kp);
      J['knee' + s] = leg.mid; J['ank' + s] = leg.end; J['kp' + s] = kp.clone();
      J['heel' + s] = leg.end.clone().add(fwd.clone().multiplyScalar(-0.05)).add(down.clone().multiplyScalar(0.05));
      J['toe' + s] = leg.end.clone().add(fwd.clone().multiplyScalar(0.16)).add(down.clone().multiplyScalar(0.055));
      // cổ tay: toạ độ thế giới (wL) hoặc theo thân (wLt, gốc ở điểm ngực, trục theo thân)
      const wr = p['h' + s] ? J['sh' + s].clone().add(V(0.01 * sign, -0.52, 0.03)) // tay buông thõng
        : p['w' + s + 't'] ? J.chest.clone().add(V(...p['w' + s + 't']).applyQuaternion(qb))
        : V(...(p['w' + s] || [0.22 * sign, 0.85, 0]));
      const ep = p['e' + s + 't'] ? V(...p['e' + s + 't']).applyQuaternion(qb)
        : p['e' + s] ? V(...p['e' + s]) : V(0.35 * sign, -1, -0.35);
      const arm = ik(J['sh' + s], wr, L.upper, L.fore, ep);
      J['elb' + s] = arm.mid; J['wr' + s] = arm.end; J['ep' + s] = ep.clone();
      const fd = arm.end.clone().sub(arm.mid).normalize();
      J['hand' + s] = arm.end.clone().add(fd.clone().multiplyScalar(0.055));
      J['fdir' + s] = fd;
    }
    return J;
  }

  /* Nội suy hai tư thế */
  function lerpPose(a, b, t) {
    const out = {};
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    keys.forEach(k => {
      const x = a[k] !== undefined ? a[k] : b[k], y = b[k] !== undefined ? b[k] : a[k];
      if (Array.isArray(x)) out[k] = x.map((v, i) => v + ((y[i] !== undefined ? y[i] : v) - v) * t);
      else if (typeof x === 'number') out[k] = x + (y - x) * t;
      else out[k] = t < 0.5 ? x : y;
    });
    return out;
  }
  const ease = t => 0.5 - 0.5 * Math.cos(Math.PI * t);
  const samePose = (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b);
  // spline Catmull–Rom qua p0 p1 p2 p3 (chạy từ p1 → p2), chặn vọt quá 15% để tay không xuyên dụng cụ
  function splinePose(p0, p1, p2, p3, u) {
    if (samePose(p1, p2)) return p1;
    const out = {}, u2 = u * u, u3 = u2 * u;
    const cr = (a, b, c, d) => {
      const v = 0.5 * (2 * b + (c - a) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (3 * b - a - 3 * c + d) * u3);
      const lo = Math.min(b, c), hi = Math.max(b, c), m = (hi - lo) * 0.15;
      return Math.max(lo - m, Math.min(hi + m, v));
    };
    const keysAll = new Set([...Object.keys(p1), ...Object.keys(p2)]);
    keysAll.forEach(k => {
      const b = p1[k] !== undefined ? p1[k] : p2[k], c = p2[k] !== undefined ? p2[k] : p1[k];
      const a = p0[k] !== undefined ? p0[k] : b, d = p3[k] !== undefined ? p3[k] : c;
      if (Array.isArray(b)) out[k] = b.map((v, i) => cr(Array.isArray(a) && a[i] !== undefined ? a[i] : v, v, c[i] !== undefined ? c[i] : v, Array.isArray(d) && d[i] !== undefined ? d[i] : (c[i] !== undefined ? c[i] : v)));
      else if (typeof b === 'number') out[k] = cr(typeof a === 'number' ? a : b, b, typeof c === 'number' ? c : b, typeof d === 'number' ? d : c);
      else out[k] = u < 0.5 ? b : c;
    });
    return out;
  }

  /* ── thư viện giúp viết tư thế ── */
  const lib = {
    L, STAND_Y,
    /* chân đứng: nửa khoảng cách hai cổ chân w, mũi chân mở toe (độ), lùi z */
    feet(w, toe, z, y) {
      return { aL: [w, y == null ? L.ankleH : y, z || 0], aR: [-w, y == null ? L.ankleH : y, z || 0], fL: [toe || 0, 0], fR: [-(toe || 0), 0] };
    },
    P(...parts) { return Object.assign({}, ...parts); },
    /* chiều cao hông khi hai chân đứng thẳng ở độ cao cổ chân y */
    standY: STAND_Y
  };

  /* ── dựng cảnh ── */
  function mat(color, opts) { return new T.MeshStandardMaterial(Object.assign({ color, roughness: 0.62, metalness: 0.05 }, opts || {})); }

  function placeBetween(mesh, a, b) {
    const d = b.clone().sub(a);
    const len = Math.max(d.length(), 1e-4);
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(V(0, 1, 0), d.divideScalar(len));
    mesh.scale.set(1, len, 1);
  }

  /* ── người mẫu: khung người MakeHuman (CC0) da trắng mịn, đầu trơn không mặt, quần short đen;
        nhóm cơ đang tập phát sáng đỏ/cam, viền sáng xanh — js/data/body.js do tools/build-body.py tạo ── */
  const MUSCLES = ['chest', 'delts_front', 'delts_side', 'delts_rear', 'traps', 'midback', 'lats', 'lower_back', 'abs', 'obliques',
    'biceps', 'triceps', 'forearms', 'glutes', 'quads', 'hamstrings', 'adductors', 'calves'];

  // ma trận khung: gốc o, trục y theo y, trục z gần zref
  function basis(o, y, zref, out) {
    const yy = y.clone().normalize();
    let z = zref.clone().sub(yy.clone().multiplyScalar(zref.dot(yy)));
    if (z.lengthSq() < 1e-8) { z = Math.abs(yy.z) < 0.9 ? V(0, 0, 1) : V(1, 0, 0); z.sub(yy.clone().multiplyScalar(z.dot(yy))); }
    z.normalize();
    const x = V().crossVectors(yy, z);
    return (out || new T.Matrix4()).makeBasis(x, yy, z).setPosition(o);
  }
  const perp = (v, u) => v.clone().sub(u.clone().multiplyScalar(v.dot(u))).normalize();

  let BODY = null; // hình học + khung nghỉ, dựng một lần
  const dec64 = s => { const b = atob(s), a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; };

  /* Chia mịn Catmull–Clark 1 cấp cho lưới tứ giác (mỗi mặt → 4 mặt): bề mặt cơ thể căng mượt như người thật.
     a: { pos, quads, skI, skW (4/đỉnh), mus, mInt (2/đỉnh), lin: { tên: [mảng, số thành phần] } } */
  function subdivide(a) {
    const n = a.pos.length / 3, m = a.quads.length / 4, Q = a.quads;
    const emap = new Map(), eA = [], eB = [], eF0 = [], eF1 = [];
    for (let f = 0; f < m; f++) for (let i = 0; i < 4; i++) {
      const p = Q[f * 4 + i], q = Q[f * 4 + (i + 1) % 4], k = p < q ? p * n + q : q * n + p;
      const e = emap.get(k);
      if (e === undefined) { emap.set(k, eA.length); eA.push(p); eB.push(q); eF0.push(f); eF1.push(-1); } else eF1[e] = f;
    }
    const E = eA.length, N2 = n + E + m, P = a.pos, P2 = new Float32Array(N2 * 3);
    const fp = (f, c) => (P[Q[f * 4] * 3 + c] + P[Q[f * 4 + 1] * 3 + c] + P[Q[f * 4 + 2] * 3 + c] + P[Q[f * 4 + 3] * 3 + c]) / 4;
    for (let f = 0; f < m; f++) for (let c = 0; c < 3; c++) P2[(n + E + f) * 3 + c] = fp(f, c);
    const sF = new Float32Array(n * 3), cF = new Uint16Array(n), sE = new Float32Array(n * 3), cE = new Uint16Array(n), sB = new Float32Array(n * 3), cB = new Uint8Array(n);
    for (let f = 0; f < m; f++) for (let i = 0; i < 4; i++) { const v = Q[f * 4 + i]; cF[v]++; for (let c = 0; c < 3; c++) sF[v * 3 + c] += P2[(n + E + f) * 3 + c]; }
    for (let e = 0; e < E; e++) {
      const p = eA[e], q = eB[e], b = eF1[e] < 0;
      for (let c = 0; c < 3; c++) {
        const mid = (P[p * 3 + c] + P[q * 3 + c]) / 2;
        P2[(n + e) * 3 + c] = b ? mid : (P[p * 3 + c] + P[q * 3 + c] + P2[(n + E + eF0[e]) * 3 + c] + P2[(n + E + eF1[e]) * 3 + c]) / 4;
        sE[p * 3 + c] += mid; sE[q * 3 + c] += mid;
        if (b) { sB[p * 3 + c] += P[q * 3 + c]; sB[q * 3 + c] += P[p * 3 + c]; }
      }
      cE[p]++; cE[q]++; if (b) { cB[p]++; cB[q]++; }
    }
    for (let v = 0; v < n; v++) for (let c = 0; c < 3; c++) {
      const o = P[v * 3 + c];
      if (cB[v] >= 2) P2[v * 3 + c] = 0.75 * o + 0.25 * sB[v * 3 + c] / cB[v];
      else { const k = cF[v] || 1; P2[v * 3 + c] = (sF[v * 3 + c] / k + 2 * sE[v * 3 + c] / (cE[v] || 1) + (k - 3) * o) / k; }
    }
    // thuộc tính: đỉnh cũ giữ nguyên; điểm cạnh = trung bình 2 đầu; điểm mặt = trung bình 4 góc
    const corners = j => (j < n ? [j] : j < n + E ? [eA[j - n], eB[j - n]] : [Q[(j - n - E) * 4], Q[(j - n - E) * 4 + 1], Q[(j - n - E) * 4 + 2], Q[(j - n - E) * 4 + 3]]);
    const out = { pos: P2, lin: {} };
    Object.keys(a.lin).forEach(k => {
      const [src, sz] = a.lin[k], dst = new Float32Array(N2 * sz);
      for (let j = 0; j < N2; j++) { const cs = corners(j); for (let c = 0; c < sz; c++) { let s = 0; cs.forEach(v => { s += src[v * sz + c]; }); dst[j * sz + c] = s / cs.length; } }
      out.lin[k] = [dst, sz];
    });
    // trọng số xương (4) và nhóm cơ (2): cộng dồn rồi giữ các giá trị lớn nhất
    const mixTop = (I, W, k, keep) => {
      const oi = new Float32Array(N2 * keep), ow = new Float32Array(N2 * keep), acc = new Map();
      for (let j = 0; j < N2; j++) {
        const cs = corners(j); acc.clear();
        cs.forEach(v => { for (let c = 0; c < k; c++) { const id = I[v * k + c], w = W[v * k + c]; if (w > 0 && id < 255) acc.set(id, (acc.get(id) || 0) + w / cs.length); } });
        const top = [...acc.entries()].sort((x, y) => y[1] - x[1]).slice(0, keep);
        for (let c = 0; c < keep; c++) { oi[j * keep + c] = top[c] ? top[c][0] : (keep === 2 ? 255 : 0); ow[j * keep + c] = top[c] ? top[c][1] : 0; }
      }
      return [oi, ow];
    };
    [out.skI, out.skW] = mixTop(a.skI, a.skW, 4, 4);
    [out.mus, out.mInt] = mixTop(a.mus, a.mInt, 2, 2);
    const nq = new Uint32Array(m * 16);
    for (let f = 0; f < m; f++) for (let i = 0; i < 4; i++) {
      const v = Q[f * 4 + i], p = Q[f * 4 + (i + 1) % 4], z = Q[f * 4 + (i + 3) % 4];
      const e1 = emap.get(v < p ? v * n + p : p * n + v), e0 = emap.get(z < v ? z * n + v : v * n + z);
      nq.set([v, n + e1, n + E + f, n + e0], (f * 4 + i) * 4);
    }
    out.quads = nq;
    return out;
  }

  // giải mã một lưới (thân hoặc quần) rồi chia mịn `levels` cấp → BufferGeometry có xương
  function meshGeometry(M, levels, extra) {
    const q = new Int16Array(dec64(M.pos).buffer), pos = new Float32Array(M.n * 3);
    for (let i = 0; i < pos.length; i++) { const k = i % 3; pos[i] = M.posMin[k] + (q[i] + 32767) * M.posScale[k]; }
    const f01 = s => Float32Array.from(dec64(s), v => v / 255);
    const sw = dec64(M.skW), w = new Float32Array(sw.length);
    for (let i = 0; i < sw.length; i += 4) { const s = (sw[i] + sw[i + 1] + sw[i + 2] + sw[i + 3]) || 1; for (let j = 0; j < 4; j++) w[i + j] = sw[i + j] / s; }
    let d = { pos, quads: Uint32Array.from(new Uint16Array(dec64(M.quads).buffer)), skI: Float32Array.from(dec64(M.skI)), skW: w,
      mus: Float32Array.from(dec64(M.mus)), mInt: f01(M.mInt), lin: {} };
    extra.forEach(k => { d.lin[k] = [M[k] ? f01(M[k]) : new Float32Array(M.n).fill(k === 'ao' ? 1 : 0), 1]; });
    ['fs', 'fa'].forEach(k => { if (M[k]) d.lin[k] = [Float32Array.from(new Int16Array(dec64(M[k]).buffer), v => v / 30000), 1]; }); // toạ độ thớ cơ
    for (let l = 0; l < levels; l++) d = subdivide(d);
    const g = new T.BufferGeometry(), nv = d.pos.length / 3, nq = d.quads.length / 4;
    const idx = new Uint32Array(nq * 6);
    for (let f = 0; f < nq; f++) { const a = d.quads[f * 4], b = d.quads[f * 4 + 1], c = d.quads[f * 4 + 2], e = d.quads[f * 4 + 3]; idx.set([a, b, c, a, c, e], f * 6); }
    g.setIndex(new T.BufferAttribute(idx, 1));
    g.setAttribute('position', new T.BufferAttribute(d.pos, 3));
    g.setAttribute('skinIndex', new T.Uint16BufferAttribute(Uint16Array.from(d.skI), 4));
    g.setAttribute('skinWeight', new T.BufferAttribute(d.skW, 4));
    g.setAttribute('mus', new T.BufferAttribute(d.mus, 2)); // 2 nhóm cơ mạnh nhất ở mỗi đỉnh
    g.setAttribute('mInt', new T.BufferAttribute(d.mInt, 2));
    extra.forEach(k => g.setAttribute(k, new T.BufferAttribute(d.lin[k][0], 1)));
    ['fs', 'fa'].forEach(k => { if (d.lin[k]) g.setAttribute(k, new T.BufferAttribute(d.lin[k][0], 1)); });
    g.computeVertexNormals();
    g.userData.verts = nv;
    return g;
  }

  function bodyData() {
    if (BODY) return BODY;
    const M = window.BODY_MESH;
    if (!M) return null;
    const g = meshGeometry(M, 1, ['shorts', 'ao', 'lines', 'hd']);
    if (M.headEgg) { // đầu trơn: pháp tuyến theo quả trứng → không lộ nếp mí mắt / môi cũ
      const c = M.headEgg.c, r = M.headEgg.r, pa = g.attributes.position, na = g.attributes.normal, hd = g.attributes.hd;
      for (let i = 0; i < pa.count; i++) {
        const w = Math.min(1, Math.max(0, (hd.getX(i) - 0.3) / 0.5));
        if (w <= 0) continue;
        // đỉnh vùng mặt/sọ nằm đúng trên quả trứng (xoá hố lõm còn sót của mắt, môi cũ)
        const dx = pa.getX(i) - c[0], dy = pa.getY(i) - c[1], dz = pa.getZ(i) - c[2], dl = Math.hypot(dx, dy, dz) || 1;
        const ux = dx / dl, uy = dy / dl, uz = dz / dl;
        const front = uz > 0.25 ? Math.min(1, (uz - 0.25) / 0.2) : 0; // mặt trước (miệng) xuống thấp hơn sau gáy
        const lo = -0.55 - 0.3 * front;
        if (w > 0.95 && uy > lo) {
          const tp = 1 - 0.22 * Math.pow((1 - uy) / 2, 2);
          const rr = 1 / Math.sqrt(Math.pow(ux / (r[0] * tp), 2) + Math.pow(uy / r[1], 2) + Math.pow(uz / (r[2] * tp), 2));
          const k = Math.min(1, (uy - lo) / 0.15);
          pa.setXYZ(i, pa.getX(i) + (c[0] + ux * rr - pa.getX(i)) * k, pa.getY(i) + (c[1] + uy * rr - pa.getY(i)) * k, pa.getZ(i) + (c[2] + uz * rr - pa.getZ(i)) * k);
        }
        let ex = (pa.getX(i) - c[0]) / (r[0] * r[0]), ey = (pa.getY(i) - c[1]) / (r[1] * r[1]), ez = (pa.getZ(i) - c[2]) / (r[2] * r[2]);
        const l = Math.hypot(ex, ey, ez) || 1; ex /= l; ey /= l; ez /= l;
        let nx = na.getX(i) * (1 - w) + ex * w, ny = na.getY(i) * (1 - w) + ey * w, nz = na.getZ(i) * (1 - w) + ez * w;
        const m = Math.hypot(nx, ny, nz) || 1;
        na.setXYZ(i, nx / m, ny / m, nz / m);
      }
    }
    // lớp viền: bỏ các tam giác bị lật mặt ở vùng đầu (nếp mí mắt / môi cũ) để viền không hiện lên mặt
    let gOut = g;
    if (M.headEgg) {
      const pa = g.attributes.position, hd = g.attributes.hd, ix = g.index.array, keep = [], c = M.headEgg.c;
      const A = V(), B = V(), C = V(), n = V(), mid = V();
      for (let t = 0; t < ix.length; t += 3) {
        const a = ix[t], b = ix[t + 1], d = ix[t + 2];
        if (hd.getX(a) + hd.getX(b) + hd.getX(d) > 1.2) {
          A.fromBufferAttribute(pa, a); B.fromBufferAttribute(pa, b); C.fromBufferAttribute(pa, d);
          n.subVectors(B, A).cross(C.clone().sub(A));
          mid.copy(A).add(B).add(C).multiplyScalar(1 / 3).sub(V(...c));
          if (n.dot(mid) <= 0) continue;
        }
        keep.push(a, b, d);
      }
      gOut = new T.BufferGeometry();
      Object.keys(g.attributes).forEach(k => gOut.setAttribute(k, g.attributes[k]));
      gOut.setIndex(new T.BufferAttribute(Uint32Array.from(keep), 1));
    }
    const gs = M.shortsMesh ? meshGeometry(M.shortsMesh, 1, ['ao', 'band', 'stripe', 'inner']) : null;
    const R = {}; Object.keys(M.rest).forEach(k => { R[k] = V(...M.rest[k]); });
    // khung xương lúc nghỉ (gốc, trục dọc y, trục trước z) → lưu nghịch đảo
    const F0 = {}, len0 = {};
    const inv = m => m.clone().invert();
    F0.hips = inv(new T.Matrix4().setPosition(R.pel));
    F0.chest = inv(new T.Matrix4().setPosition(R.mid));
    F0.head = inv(new T.Matrix4().setPosition(R.neck));
    for (const s of ['L', 'R']) {
      const sh = R['sh' + s], el = R['elb' + s], wr = R['wr' + s];
      const uA = el.clone().sub(sh), uF = wr.clone().sub(el);
      const sw2 = wr.clone().sub(sh).normalize();
      const ep = el.clone().sub(sh).sub(sw2.clone().multiplyScalar(el.clone().sub(sh).dot(sw2)));
      const frA = perp(ep.clone().negate(), uA.clone().normalize());
      F0['up' + s] = inv(basis(sh, uA, frA)); len0['up' + s] = uA.length();
      F0['upRot' + s] = new T.Quaternion().setFromRotationMatrix(basis(V(0, 0, 0), uA, frA));
      const foB = basis(el, uF, perp(frA, uF.clone().normalize()));
      F0['fo' + s] = inv(foB); len0['fo' + s] = uF.length();
      F0['foRot' + s] = new T.Quaternion().setFromRotationMatrix(foB);
      const hp = R['hip' + s], kn = R['knee' + s], an = R['ank' + s];
      const uT = kn.clone().sub(hp), uS = an.clone().sub(kn);
      F0['th' + s] = inv(basis(hp, uT, V(0, 0, 1))); len0['th' + s] = uT.length();
      F0['sk' + s] = inv(basis(kn, uS, V(0, 0, 1))); len0['sk' + s] = uS.length();
      F0['thRot' + s] = new T.Quaternion().setFromRotationMatrix(basis(V(0, 0, 0), uT, V(0, 0, 1)));
      F0['skRot' + s] = new T.Quaternion().setFromRotationMatrix(basis(V(0, 0, 0), uS, V(0, 0, 1)));
      F0['eb' + s] = new T.Matrix4().setPosition(el.clone().negate());
      F0['kb' + s] = new T.Matrix4().setPosition(kn.clone().negate());
      const fw = R['toe' + s].clone().sub(an); fw.y = 0;
      F0['ft' + s] = inv(basis(an, fw, V(0, 1, 0)));
      F0['dl' + s] = new T.Matrix4().setPosition(sh.clone().negate());
    }
    const H = {};
    ['L', 'R'].forEach(s => { H[s] = { grip: V(...M.hand[s].grip), pn: V(...M.hand[s].pn).normalize() }; });
    BODY = { geo: g, geoOut: gOut, geoS: gs, R, F0, len0, H, names: M.bones.map(n => n.replace(/^sh([LR])$/, 'sk$1')) };
    return BODY;
  }

  // da người thật; nhóm cơ đang tập hiện thớ cơ đỏ như tranh giải phẫu (cơ phụ: thớ cơ mờ hơn)
  const BULGE_GLSL = [
    'attribute vec2 mus;', 'attribute vec2 mInt;', 'uniform vec4 uFlex;', 'uniform vec4 uFlex2;',
    'float wOf(float id) { return (abs(mus.x - id) < 0.5 ? mInt.x : 0.0) + (abs(mus.y - id) < 0.5 ? mInt.y : 0.0); }',
    // cơ co thì phồng: bắp tay trước khi gập khuỷu, tay sau khi duỗi, đùi sau khi gập gối, bắp chân khi nhón, ngực khi khép tay
    'float muscleBulge() {',
    '  float sl = position.x > 0.0 ? 1.0 : 0.0;',
    '  float fE = mix(uFlex.y, uFlex.x, sl), fK = mix(uFlex.w, uFlex.z, sl), fC = mix(uFlex2.y, uFlex2.x, sl), fP = mix(uFlex2.w, uFlex2.z, sl);',
    '  return smoothstep(0.25, 1.0, wOf(10.0)) * 0.0075 * fE + wOf(12.0) * 0.003 * fE + smoothstep(0.25, 1.0, wOf(11.0)) * 0.004 * (1.0 - fE) + smoothstep(0.25, 1.0, wOf(15.0)) * 0.006 * fK',
    '       + wOf(14.0) * 0.003 * (1.0 - fK) + smoothstep(0.25, 1.0, wOf(17.0)) * 0.007 * fC + smoothstep(0.25, 1.0, wOf(0.0)) * 0.005 * fP;',
    '}'].join('\n') + '\n';

  function bodyMaterial(levels, U) {
    const m = new T.MeshStandardMaterial({ color: COLORS.body, roughness: 0.55, metalness: 0.0, envMapIntensity: 0.55 });
    m.extensions = { derivatives: true };
    m.onBeforeCompile = sh => {
      sh.uniforms.uLvl = { value: levels };
      sh.uniforms.uGlow = U.glow;
      sh.uniforms.uFlex = U.flex; sh.uniforms.uFlex2 = U.flex2;
      sh.vertexShader = BULGE_GLSL + 'attribute float shorts;\nattribute float ao;\nattribute float fs;\nattribute float fa;\nattribute float lines;\nuniform float uLvl[18];\nuniform float uGlow;\nvarying float vHot;\nvarying float vWarm;\nvarying float vShorts;\nvarying float vAO;\nvarying float vS;\nvarying float vSa;\nvarying float vLine;\nvarying float vFore;\nvarying float vBic;\n' +
        sh.vertexShader.replace('#include <begin_vertex>', [
          '#include <begin_vertex>',
          '  int m1 = int(mus.x + 0.5); int m2 = int(mus.y + 0.5);',
          '  float l1 = 0.0; float l2 = 0.0;',
          '  for (int i = 0; i < 18; i++) { if (i == m1) l1 = uLvl[i]; if (i == m2) l2 = uLvl[i]; }',
          '  vHot = clamp((l1 > 0.75 ? mInt.x : 0.0) + (l2 > 0.75 ? mInt.y : 0.0), 0.0, 1.0);',
          '  vWarm = clamp((l1 > 0.25 && l1 < 0.75 ? mInt.x : 0.0) + (l2 > 0.25 && l2 < 0.75 ? mInt.y : 0.0), 0.0, 1.0);',
          '  vShorts = shorts;',
          '  vAO = ao;',
          '  vLine = lines;',
          '  vS = fs;   // toạ độ vuông góc thớ cơ (tính sẵn theo từng cơ)',
          '  vSa = fa;  // toạ độ dọc thớ cơ',
          '  transformed += objectNormal * (vHot * uGlow * 0.003 + muscleBulge());',
          '  vFore = wOf(12.0); vBic = wOf(10.0);'].join('\n'));
      sh.fragmentShader = 'uniform float uGlow;\nvarying float vHot;\nvarying float vWarm;\nvarying float vShorts;\nvarying float vAO;\nvarying float vS;\nvarying float vSa;\nvarying float vLine;\nvarying float vFore;\nvarying float vBic;\n' +
        'vec3 bumpN(vec3 p, vec3 n, float h) { vec3 sx = dFdx(p); vec3 sy = dFdy(p); vec3 r1 = cross(sy, n); vec3 r2 = cross(n, sx); float det = dot(sx, r1); vec2 dh = vec2(dFdx(h), dFdy(h)); vec3 gr = sign(det) * (dh.x * r1 + dh.y * r2); return normalize(abs(det) * n - gr); }\n' +
        sh.fragmentShader
          .replace('#include <color_fragment>', [
            '#include <color_fragment>',
            '  diffuseColor.rgb *= mix(1.0, vAO, 0.5);',
            '  float mk = smoothstep(0.32, 0.46, vHot);',
            '  float mw = smoothstep(0.32, 0.5, vWarm) * 0.45;',
            '  float fs = vS * 1150.0 + 0.45 * sin(vSa * 55.0) + 0.3 * sin(vSa * 170.0 + vS * 140.0);',
            '  float fs2 = vS * 3100.0 + 0.8 * sin(vSa * 90.0 + vS * 500.0);',
            '  float faa = 1.0 - smoothstep(0.9, 2.6, fwidth(fs));       // xa quá thì thớ cơ mờ dần (không nhiễu)',
            '  float faa2 = 1.0 - smoothstep(0.9, 2.6, fwidth(fs2));',
            '  float fs3 = vS * 430.0 + 0.4 * sin(vSa * 40.0);',
            '  float faa3 = 1.0 - smoothstep(0.9, 2.6, fwidth(fs3));',
            '  float stripe = 0.5 + faa * 0.34 * sin(fs) + faa2 * 0.16 * sin(fs2) + faa3 * (1.0 - 0.6 * faa) * 0.26 * sin(fs3) + 0.06 * sin(vSa * 31.0 + vS * 47.0);',
            '  vec3 musC = mix(vec3(0.12, 0.009, 0.006), vec3(0.42, 0.035, 0.02), clamp(stripe, 0.0, 1.0)) * (0.9 + 0.2 * uGlow);   // màu tuyến tính: đỏ thịt',
            '  float edge = 4.0 * mk * (1.0 - mk);',
            '  float mAll = max(mk, mw);',
            '  diffuseColor.rgb = mix(diffuseColor.rgb, musC * mix(1.0, vAO, 0.4) * (1.0 - 0.25 * edge), mAll);',
            '  diffuseColor.rgb *= 1.0 - 0.24 * smoothstep(0.25, 0.8, vLine);   // đường nét giải phẫu',
            '  float vein = 0.0;',
            '  for (int k = 0; k < 3; k++) { float fk = float(k); float c = -0.024 + 0.025 * fk + 0.005 * sin(vSa * 35.0 + fk * 2.1) + 0.0025 * sin(vSa * 95.0 + fk);',
            '    vein = max(vein, 1.0 - smoothstep(0.0012, 0.0032, abs(vS - c))); }',
            '  vein = max(vein, (1.0 - smoothstep(0.0012, 0.003, abs(vS - 0.004 - (vSa - 0.12) * 0.3))) * step(0.06, vSa) * step(vSa, 0.16));',
            '  float vm = (smoothstep(0.3, 0.6, vFore) * smoothstep(0.03, 0.06, vSa) * (1.0 - smoothstep(0.19, 0.23, vSa))',
            '    + smoothstep(0.4, 0.7, vBic) * step(0.012, vS) * step(vS, 0.03) * smoothstep(0.1, 0.13, vSa) * (1.0 - smoothstep(0.22, 0.25, vSa))) * (1.0 - mAll);',
            '  vein *= clamp(vm, 0.0, 1.0) * (1.0 - smoothstep(0.003, 0.008, fwidth(vS)));',
            '  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.86, 0.84, 0.9), vein * 0.6);',
            '  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.045, 0.047, 0.052), smoothstep(0.85, 1.0, vShorts));',
            window.__dbgFib ? '  diffuseColor.rgb = vec3(fract(vS * 40.0), faa, stripe);' : ''].join('\n'))
          .replace('#include <aomap_fragment>', '#include <aomap_fragment>\n  reflectedLight.indirectDiffuse *= vAO;\n  reflectedLight.indirectSpecular *= vAO * vAO;')
          .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  roughnessFactor = mix(roughnessFactor, 0.5, mAll);\n  roughnessFactor = mix(roughnessFactor, 0.85, smoothstep(0.85, 1.0, vShorts));')
          .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n  normal = bumpN(-vViewPosition, normal, (stripe - 0.5) * 0.00028 * mAll + vein * 0.0016);')
          .replace('#include <emissivemap_fragment>', [
            '#include <emissivemap_fragment>',
            '  totalEmissiveRadiance += diffuseColor.rgb * vec3(1.0, 0.5, 0.4) * 0.05 * (1.0 - mAll);   // da hơi trong (ánh hồng)',
            '  totalEmissiveRadiance += vec3(0.5, 0.06, 0.03) * mk * 0.12 * uGlow;'].join('\n'));
    };
    m.customProgramCacheKey = () => 'togi-body-anat-3' + (window.__dbgFib ? 'd' : '');
    return m;
  }

  // quần short: vải thể thao đen mờ có ánh sheen, cạp chun có gân, viền hông xám, mặt trong tối
  function shortsMaterial(levels, U) {
    const m = new T.MeshPhysicalMaterial({ color: 0x18191d, roughness: 0.96, metalness: 0, sheen: 0.0, sheenRoughness: 0.9,
      sheenColor: new T.Color(0x34373d), side: T.DoubleSide, envMapIntensity: 0.12 });
    m.extensions = { derivatives: true };
    m.onBeforeCompile = sh => {
      sh.uniforms.uLvl = { value: levels };
      sh.uniforms.uGlow = U.glow;
      sh.vertexShader = 'attribute vec2 mus;\nattribute vec2 mInt;\nattribute float ao;\nattribute float band;\nattribute float stripe;\nattribute float inner;\nuniform float uLvl[18];\nvarying float vHot;\nvarying float vAO;\nvarying float vBand;\nvarying float vStripe;\nvarying float vInner;\nvarying vec3 vRest;\n' +
        sh.vertexShader.replace('#include <begin_vertex>', [
          '#include <begin_vertex>',
          '  int m1 = int(mus.x + 0.5); int m2 = int(mus.y + 0.5);',
          '  float l1 = 0.0; float l2 = 0.0;',
          '  for (int i = 0; i < 18; i++) { if (i == m1) l1 = uLvl[i]; if (i == m2) l2 = uLvl[i]; }',
          '  vHot = clamp((l1 > 0.75 ? mInt.x : 0.0) + (l2 > 0.75 ? mInt.y : 0.0), 0.0, 1.0);',
          '  vAO = ao; vBand = band; vStripe = stripe; vInner = inner; vRest = position;'].join('\n'));
      sh.fragmentShader = 'uniform float uGlow;\nvarying float vHot;\nvarying float vAO;\nvarying float vBand;\nvarying float vStripe;\nvarying float vInner;\nvarying vec3 vRest;\n' +
        'vec3 fabricBump(vec3 p, vec3 n, float h) { vec3 sx = dFdx(p); vec3 sy = dFdy(p); vec3 r1 = cross(sy, n); vec3 r2 = cross(n, sx); float det = dot(sx, r1); vec2 dh = vec2(dFdx(h), dFdy(h)); vec3 gr = sign(det) * (dh.x * r1 + dh.y * r2); return normalize(abs(det) * n - gr); }\n' +
        sh.fragmentShader
          .replace('#include <color_fragment>', [
            '#include <color_fragment>',
            '  float hotK = smoothstep(0.0, 0.5, vHot);',
            '  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.03, 0.031, 0.034), vBand);',
            '  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.16, 0.165, 0.18), vStripe * 0.9);',
            '  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.03, 0.031, 0.034), vInner);',
            '  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.3, 0.035, 0.015), hotK * 0.0);',
            '  diffuseColor.rgb *= mix(1.0, vAO, 0.5);'].join('\n'))
          .replace('#include <normal_fragment_maps>', [
            '#include <normal_fragment_maps>',
            '  float bh = vBand * 0.0008 * sin(6.2832 * vRest.y / 0.0115);',
            '  normal = fabricBump(-vViewPosition, normal, bh);'].join('\n'))
          .replace('#include <emissivemap_fragment>', [
            '#include <emissivemap_fragment>',
            '  float rimF = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 3.0);',
            '  totalEmissiveRadiance += vec3(0.8, 0.82, 0.85) * rimF * 0.05 * (1.0 - vInner);',
            '  totalEmissiveRadiance += vec3(1.0, 0.13, 0.02) * hotK * (0.008 + 0.022 * uGlow);'].join('\n'));
    };
    m.customProgramCacheKey = () => 'togi-shorts-1';
    return m;
  }

  // hướng lòng bàn tay mong muốn: 'sup' = ngửa về phía gập khuỷu, 'pro' = úp ngược lại,
  // hoặc [vào trong, lên, ra trước] theo thân người (vào trong = về phía giữa người)
  function palmTarget(spec, s, J, z0) {
    if (spec === 'sup') return z0.clone();
    if (spec === 'pro') return z0.clone().negate();
    const sg = s === 'L' ? 1 : -1;
    return V(-sg * spec[0], spec[1], spec[2]).applyQuaternion(J.qb);
  }

  function outlineMaterial(color, w, U, bulge) {
    const m = new T.MeshBasicMaterial({ color, side: T.BackSide });
    m.onBeforeCompile = sh => {
      if (bulge) { sh.uniforms.uFlex = U.flex; sh.uniforms.uFlex2 = U.flex2; sh.vertexShader = BULGE_GLSL + sh.vertexShader; }
      sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  transformed += normalize(objectNormal) * (' + w.toFixed(4) + (bulge ? ' + muscleBulge()' : '') + ');');
    };
    m.customProgramCacheKey = () => 'togi-outline-' + w + (bulge ? 'b' : '');
    return m;
  }

  function makeBody(scene, def) {
    const D = bodyData();
    if (!D) return null;
    const lv = MUSCLES.map(m => (def.focus || []).includes(m) ? 1 : (def.assist || []).includes(m) ? 0.5 : 0);
    const U = { glow: { value: 0.3 }, flex: { value: new T.Vector4() }, flex2: { value: new T.Vector4() } };
    const bones = D.names.map(() => { const b = new T.Bone(); b.matrixAutoUpdate = false; return b; });
    const skel = new T.Skeleton(bones, bones.map(() => new T.Matrix4()));
    const mesh = new T.SkinnedMesh(D.geo, bodyMaterial(lv, U));
    mesh.bind(skel, new T.Matrix4());
    mesh.frustumCulled = false; mesh.castShadow = true;
    scene.add(mesh);
    [[D.geoOut || D.geo, 0x3b2216, 0.0021], [D.geoS, 0x050506, 0.0024]].forEach(([g, c, w]) => { // đường viền
      if (!g) return;
      const ol = new T.SkinnedMesh(g, outlineMaterial(c, w, U, g !== D.geoS));
      ol.bind(skel, new T.Matrix4()); ol.frustumCulled = false;
      scene.add(ol);
    });
    if (D.geoS) { // lớp vải quần, dùng chung bộ xương
      const sm = new T.SkinnedMesh(D.geoS, shortsMaterial(lv, U));
      sm.bind(skel, new T.Matrix4());
      sm.frustumCulled = false; sm.castShadow = true;
      scene.add(sm);
    }
    const idx = {}; D.names.forEach((n, i) => { idx[n] = bones[i]; });
    return { mesh, bones: idx, U, D, palm: def.palm || null };
  }

  const _F = new T.Matrix4(), _S = new T.Matrix4(), _Q = new T.Quaternion();
  function setBone(b, F1, k, F0inv) {
    _S.makeScale(1, k, 1);
    b.matrixWorld.copy(F1).multiply(_S).multiply(F0inv);
  }

  function updateBody(B, J, glow, pose) {
    const { D, bones } = B, F0 = D.F0;
    setBone(bones.hips, _F.makeRotationFromQuaternion(J.q).setPosition(J.pel), 1, F0.hips);
    _S.makeScale(1 + 0.011 * (J.breath || 0), (L.spine / 2) / (D.R.chest.y - D.R.mid.y), 1 + 0.016 * (J.breath || 0));
    bones.chest.matrixWorld.copy(_F.makeRotationFromQuaternion(J.qb).setPosition(J.mid)).multiply(_S).multiply(F0.chest);
    setBone(bones.head, _F.makeRotationFromQuaternion(J.qh).setPosition(J.neck), 1, F0.head);
    const flex = [0, 0, 0, 0], flex2 = [0, 0, 0, 0];
    for (const s of ['L', 'R']) {
      const sh = J['sh' + s], el = J['elb' + s], wr = J['wr' + s];
      const uA = el.clone().sub(sh), uF = wr.clone().sub(el), uFn = uF.clone().normalize();
      const frA = perp(J['ep' + s].clone().negate(), uA.clone().normalize());
      basis(sh, uA, frA, _F);
      const upQ = _Q.setFromRotationMatrix(_F).multiply(F0['upRot' + s].clone().invert());
      setBone(bones['up' + s], _F, uA.length() / D.len0['up' + s], F0['up' + s]);
      // cơ vai: xoay nửa đường giữa thân và cánh tay → vai không bị bẹp khi giơ tay
      const half = J.qb.clone().slerp(upQ, 0.5);
      bones['dl' + s].matrixWorld.makeRotationFromQuaternion(half).setPosition(sh).multiply(F0['dl' + s]);
      const kF = uF.length() / D.len0['fo' + s];
      const z0 = perp(frA, uFn);
      basis(el, uF, z0, _F);
      setBone(bones['fo' + s], _F, kF, F0['fo' + s]);
      // khuỷu: xương phụ xoay nửa góc giữa cánh tay và cẳng tay → khớp gập tròn, không móp
      const foQ = new T.Quaternion().setFromRotationMatrix(_F).multiply(F0['foRot' + s].clone().invert());
      bones['eb' + s].matrixWorld.makeRotationFromQuaternion(upQ.clone().slerp(foQ, 0.5)).setPosition(el).multiply(F0['eb' + s]);
      // lòng bàn tay quay đúng kiểu cầm của bài (ngửa / úp / khép vào trong); độ xoay chia đều dọc cẳng tay
      let ang = 0;
      const want = B.palm ? palmTarget(B.palm, s, J, z0) : null;
      if (want) {
        const wp = want.sub(uFn.clone().multiplyScalar(want.dot(uFn)));
        if (wp.lengthSq() > 1e-4) {
          const rel = new T.Quaternion().setFromRotationMatrix(_F).multiply(F0['foRot' + s].clone().invert());
          const cur = perp(D.H[s].pn.clone().applyQuaternion(rel), uFn);
          wp.normalize();
          ang = Math.atan2(uFn.dot(V().crossVectors(cur, wp)), cur.dot(wp));
        }
      }
      setBone(bones['tw' + s], basis(el, uF, z0.clone().applyAxisAngle(uFn, ang / 2), _F), kF, F0['fo' + s]);
      setBone(bones['ha' + s], basis(el, uF, z0.clone().applyAxisAngle(uFn, ang), _F), kF, F0['fo' + s]);
      J['grip' + s] = D.H[s].grip.clone().applyMatrix4(bones['ha' + s].matrixWorld);
      const hp = J['hip' + s], kn = J['knee' + s], an = J['ank' + s];
      const uT = kn.clone().sub(hp), uS = an.clone().sub(kn);
      setBone(bones['th' + s], basis(hp, uT, J['kp' + s], _F), uT.length() / D.len0['th' + s], F0['th' + s]);
      const thQ = new T.Quaternion().setFromRotationMatrix(basis(V(0, 0, 0), uT, J['kp' + s], _F)).multiply(F0['thRot' + s].clone().invert());
      setBone(bones['sk' + s], basis(kn, uS, J['kp' + s], _F), uS.length() / D.len0['sk' + s], F0['sk' + s]);
      const skQ = new T.Quaternion().setFromRotationMatrix(_F).multiply(F0['skRot' + s].clone().invert());
      bones['kb' + s].matrixWorld.makeRotationFromQuaternion(thQ.slerp(skQ, 0.5)).setPosition(kn).multiply(F0['kb' + s]);
      // độ co cơ: gập khuỷu, gập gối, nhón gót, khép tay ra trước
      const i0 = s === 'L' ? 0 : 1, sg = s === 'L' ? 1 : -1;
      flex[i0] = Math.min(1, Math.max(0, Math.acos(Math.max(-1, Math.min(1, uA.clone().normalize().dot(uFn)))) / 2.3));
      flex[2 + i0] = Math.min(1, Math.max(0, Math.acos(Math.max(-1, Math.min(1, uT.clone().normalize().dot(uS.clone().normalize())))) / 2.2));
      const ft = J['toe' + s].clone().sub(J['heel' + s]).normalize();
      flex2[i0] = Math.min(1, Math.max(0, -ft.y * 2.5));
      const ua = uA.clone().normalize();
      flex2[2 + i0] = Math.min(1, Math.max(0, ua.dot(V(0, 0, 1).applyQuaternion(J.qb)) * 0.9 + ua.dot(V(-sg, 0, 0).applyQuaternion(J.qb)) * 0.7));
      setBone(bones['ft' + s], basis(an, J['toe' + s].clone().sub(J['heel' + s]), V(0, 1, 0), _F), 1, F0['ft' + s]);
    }
    B.U.glow.value = glow;
    B.U.flex.value.set(...flex); B.U.flex2.value.set(...flex2);
  }

  /* ── đường sáng chỉ quỹ đạo đúng (như ảnh mẫu): tay / chân / thân đang làm việc ── */
  const CHAINS = { armL: ['shL', 'elbL', 'wrL'], armR: ['shR', 'elbR', 'wrR'], legL: ['hipL', 'kneeL', 'ankL'], legR: ['hipR', 'kneeR', 'ankR'], torso: ['pel', 'chest', 'neck'] };
  function guideChains(def) {
    if (def.guide) return def.guide;
    const f = new Set(def.focus || []);
    const legs = ['quads', 'glutes', 'hamstrings', 'adductors', 'calves'].some(m => f.has(m));
    const arms = ['chest', 'delts_front', 'delts_side', 'delts_rear', 'traps', 'midback', 'lats', 'biceps', 'triceps', 'forearms'].some(m => f.has(m));
    const core = ['abs', 'obliques', 'lower_back'].some(m => f.has(m));
    return [].concat(arms ? ['armL', 'armR'] : [], legs ? ['legL', 'legR'] : [], !arms && !legs && core ? ['torso'] : []);
  }
  function makeGuides(scene, def) {
    const names = guideChains(def);
    const coreM = new T.MeshBasicMaterial({ color: 0x8dff7a, transparent: true, opacity: 0.95, depthTest: false, toneMapped: false });
    const glowM = new T.MeshBasicMaterial({ color: 0x3dff45, transparent: true, opacity: 0.22, depthTest: false, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false });
    const chains = names.map(n => {
      const c = CHAINS[n], parts = [];
      for (let i = 0; i < c.length - 1; i++) {
        const a = new T.Mesh(new T.CylinderGeometry(0.0065, 0.0065, 1, 8), coreM);
        const b = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 1, 12), glowM);
        a.renderOrder = 11; b.renderOrder = 10; scene.add(a); scene.add(b);
        parts.push({ p: c[i], q: c[i + 1], a, b });
      }
      const dot = new T.Mesh(new T.SphereGeometry(0.016, 14, 10), coreM); dot.renderOrder = 11; scene.add(dot);
      return { n, side: n.slice(-1), parts, dot, mid: c[1] };
    });
    let on = true;
    return {
      get on() { return on; },
      set on(v) { on = v; },
      update(J, camPos) {
        chains.forEach(ch => {
          // chỉ vẽ bên gần camera (bên kia bị thân che), trừ khi nhìn thẳng
          let vis = on;
          if (vis && (ch.side === 'L' || ch.side === 'R')) {
            const other = J[ch.mid.slice(0, -1) + (ch.side === 'L' ? 'R' : 'L')];
            vis = camPos.distanceTo(J[ch.mid]) < camPos.distanceTo(other) + 0.12;
          }
          ch.parts.forEach(pt => { pt.a.visible = pt.b.visible = vis; if (vis) { placeBetween(pt.a, J[pt.p], J[pt.q]); placeBetween(pt.b, J[pt.p], J[pt.q]); } });
          ch.dot.visible = vis; if (vis) ch.dot.position.copy(J[ch.mid]);
        });
      }
    };
  }

  /* ── dụng cụ ── */
  function makeProps(scene, defs) {
    const steel = mat(COLORS.steel, { metalness: 0.5, roughness: 0.4 });
    const dark = mat(COLORS.dark), pad = mat(COLORS.pad), plate = mat(COLORS.plate, { roughness: 0.5 }), chrome = mat(COLORS.chrome, { metalness: 0.8, roughness: 0.25 });
    const out = [];
    const box = (w, h, d, m) => { const me = new T.Mesh(m === pad ? rboxG(w, h, d, 0.03) : new T.BoxGeometry(w, h, d), m); me.castShadow = true; me.receiveShadow = true; scene.add(me); return me; };
    const frame = mat(0x9aa1ab, { metalness: 0.65, roughness: 0.32 }), rubber = mat(0x1b1c1f, { roughness: 0.82 });
    // khối bo tròn (đệm da, chân cao su): w × h × d, bán kính góc r
    function rboxG(w, h, d, r) {
      const b = Math.max(0.002, Math.min(r, h / 2 - 0.001, w / 2 - 0.002, d / 2 - 0.002)), w0 = w - 2 * b, d0 = d - 2 * b, rr = Math.max(0.004, Math.min(r * 1.4, w0 / 2 - 0.001, d0 / 2 - 0.001));
      const sp = new T.Shape(), x = w0 / 2, z = d0 / 2;
      sp.moveTo(-x + rr, -z); sp.lineTo(x - rr, -z); sp.quadraticCurveTo(x, -z, x, -z + rr); sp.lineTo(x, z - rr); sp.quadraticCurveTo(x, z, x - rr, z);
      sp.lineTo(-x + rr, z); sp.quadraticCurveTo(-x, z, -x, z - rr); sp.lineTo(-x, -z + rr); sp.quadraticCurveTo(-x, -z, -x + rr, -z);
      const g = new T.ExtrudeGeometry(sp, { depth: Math.max(0.001, h - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 4, curveSegments: 5 });
      g.rotateX(-Math.PI / 2); g.computeBoundingBox();
      const c = g.boundingBox.getCenter(V()); g.translate(-c.x, -c.y, -c.z); g.computeVertexNormals();
      return g;
    }
    const part = (geo, m, parent) => { const me = new T.Mesh(geo, m); me.castShadow = true; me.receiveShadow = true; (parent || scene).add(me); return me; };
    const cylM = (r, m, seg) => { const me = new T.Mesh(new T.CylinderGeometry(r, r, 1, seg || 16), m); me.castShadow = true; scene.add(me); return me; };

    function dumbbell(len) {
      const g = new T.Group();
      g.add(new T.Mesh(new T.CylinderGeometry(0.0155, 0.0155, len, 18), chrome));
      const knurl = new T.Mesh(new T.CylinderGeometry(0.0165, 0.0165, len * 0.42, 18), mat(0x8d949e, { metalness: 0.75, roughness: 0.55 }));
      g.add(knurl);
      const hex = new T.Shape(); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + Math.PI / 6; const px = Math.cos(a) * 0.052, py = Math.sin(a) * 0.052; i ? hex.lineTo(px, py) : hex.moveTo(px, py); }
      const hg = new T.ExtrudeGeometry(hex, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.007, bevelSize: 0.006, bevelSegments: 3 });
      hg.rotateX(Math.PI / 2); hg.computeBoundingBox(); hg.translate(...hg.boundingBox.getCenter(V()).negate().toArray()); hg.computeVertexNormals();
      const rubberHead = mat(0x1c1d21, { roughness: 0.7 });
      for (const s of [-1, 1]) {
        const h = new T.Mesh(hg, rubberHead); h.position.y = s * (len / 2 - 0.03); g.add(h);
        const cap = new T.Mesh(new T.CylinderGeometry(0.022, 0.022, 0.004, 20), chrome); cap.position.y = s * (len / 2 + 0.008); g.add(cap);
        const col = new T.Mesh(new T.CylinderGeometry(0.024, 0.024, 0.012, 20), chrome); col.position.y = s * (len / 2 - 0.074); g.add(col);
      }
      g.traverse(o => { if (o.isMesh) o.castShadow = true; });
      scene.add(g); return g;
    }
    function orient(obj, center, axis) {
      obj.position.copy(center);
      obj.quaternion.setFromUnitVectors(V(0, 1, 0), axis.clone().normalize());
    }
    function line(m, r) { return cylM(r || 0.007, m || mat(COLORS.cable, { roughness: 0.3 }), 6); }

    (defs || []).forEach(d => {
      const t = d.type;
      if (t === 'box') {
        const me = box(d.size[0], d.size[1], d.size[2], d.mat === 'steel' ? steel : d.mat === 'dark' ? dark : d.mat === 'chrome' ? chrome : pad);
        me.position.set(...d.pos);
        if (d.rot) me.rotation.set(d.rot[0] * DEG, (d.rot[1] || 0) * DEG, (d.rot[2] || 0) * DEG);
        if (d.key) out.push({ update(P) { const v = P[d.key]; if (v) me.position.set(v[0], v[1], v[2]); if (d.rotKey && P[d.rotKey] != null) me.rotation.x = P[d.rotKey] * DEG; } });
      } else if (t === 'post') { // cột đứng từ sàn
        const me = cylM(d.r || 0.03, steel); placeBetween(me, V(d.pos[0], 0, d.pos[2]), V(d.pos[0], d.h, d.pos[2]));
      } else if (t === 'rod') { // thanh tĩnh giữa 2 điểm
        const me = cylM(d.r || 0.025, d.mat === 'chrome' ? chrome : steel); placeBetween(me, V(...d.a), V(...d.b));
      } else if (t === 'dumbbell') {
        const sides = d.hand === 'both' ? ['L', 'R'] : [d.hand];
        sides.forEach(s => {
          const g = dumbbell(d.len || 0.3);
          out.push({ update(P, J) {
            const ax = P['db' + s] ? V(...P['db' + s]) : (s === 'L' ? V(1, 0, 0) : V(1, 0, 0));
            orient(g, J['grip' + s] || J['hand' + s], ax);
          } });
        });
      } else if (t === 'goblet') {
        const g = dumbbell(0.3);
        out.push({ update(P, J) {
          const c = J.handL.clone().add(J.handR).multiplyScalar(0.5).add(V(0, -0.06, 0.03).applyQuaternion(J.q));
          orient(g, c, V(0, 1, 0).applyQuaternion(J.qb));
        } });
      } else if (t === 'barbell') {
        const g = new T.Group();
        const bar = new T.Mesh(new T.CylinderGeometry(0.014, 0.014, d.len || 1.6, 12), chrome); g.add(bar);
        if (d.plates !== false) for (const s of [-1, 1]) {
          const pl = new T.Mesh(new T.CylinderGeometry(d.plateR || 0.18, d.plateR || 0.18, 0.05, 28), plate);
          pl.position.y = s * ((d.len || 1.6) / 2 - 0.12); g.add(pl);
        }
        g.traverse(o => { if (o.isMesh) o.castShadow = true; });
        scene.add(g);
        out.push({ update(P, J) {
          const c = (J.gripL || J.handL).clone().add(J.gripR || J.handR).multiplyScalar(0.5);
          if (d.offset) c.add(V(...d.offset));
          orient(g, c, J.handL.clone().sub(J.handR));
        } });
      } else if (t === 'trapbar') {
        const g = new T.Group();
        const pts = [];
        for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + Math.PI / 6; pts.push(V(Math.cos(a) * 0.36, 0, Math.sin(a) * 0.3)); }
        for (let i = 0; i < 6; i++) { const m = new T.Mesh(new T.CylinderGeometry(0.014, 0.014, 1, 8), chrome); placeBetween(m, pts[i], pts[(i + 1) % 6]); g.add(m); }
        for (const s of [-1, 1]) {
          const sleeve = new T.Mesh(new T.CylinderGeometry(0.014, 0.014, 0.5, 8), chrome); sleeve.rotation.z = Math.PI / 2; sleeve.position.x = s * 0.55; g.add(sleeve);
          const pl = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 0.05, 28), plate); pl.rotation.z = Math.PI / 2; pl.position.x = s * 0.62; g.add(pl);
        }
        g.traverse(o => { if (o.isMesh) o.castShadow = true; });
        scene.add(g);
        out.push({ update(P, J) {
          const c = J.handL.clone().add(J.handR).multiplyScalar(0.5);
          g.position.copy(c); g.rotation.set(0, (P.tr ? P.tr[1] : 0) * DEG, 0);
        } });
      } else if (t === 'cable') {
        const cab = line();
        const handle = d.handle === 'rope' ? null : cylM(0.014, chrome);
        const ropeL = d.handle === 'rope' ? [line(dark, 0.013), line(dark, 0.013)] : null;
        let stack = null;
        if (d.stack) { stack = box(0.2, 0.3, 0.12, plate); }
        let rest = null;
        out.push({ update(P, J) {
          const from = V(...d.from);
          let to;
          const gL = J.gripL || J.handL, gR = J.gripR || J.handR;
          if (d.to === 'L' || d.to === 'R') to = (d.to === 'L' ? gL : gR).clone();
          else to = gL.clone().add(gR).multiplyScalar(0.5);
          if (ropeL) {
            const knot = to.clone().add(from.clone().sub(to).setLength(0.12));
            placeBetween(cab, from, knot);
            placeBetween(ropeL[0], knot, J.handL); placeBetween(ropeL[1], knot, J.handR);
          } else {
            placeBetween(cab, from, to);
            if (handle) {
              if (d.handle === 'bar' || d.handle === 'v') {
                const half = d.handle === 'v' ? 0.12 : (d.barLen || 0.5) / 2;
                const ax = J.handL.clone().sub(J.handR); if (ax.lengthSq() < 1e-6) ax.set(1, 0, 0); ax.normalize();
                const c = J.handL.clone().add(J.handR).multiplyScalar(0.5);
                placeBetween(handle, c.clone().add(ax.clone().multiplyScalar(-half)), c.clone().add(ax.clone().multiplyScalar(half)));
              } else {
                placeBetween(handle, to.clone().add(V(0, -0.05, 0)), to.clone().add(V(0, 0.05, 0)));
              }
            }
          }
          if (stack) {
            const len = from.distanceTo(to);
            if (rest === null) rest = len;
            const lift = Math.max(0, Math.min(0.6, (len - rest) * (d.ratio || 1)));
            stack.position.set(d.stack[0], 0.2 + lift, d.stack[2]);
          }
        } });
      } else if (t === 'link') { // tay đòn máy: từ điểm tĩnh tới tay
        const me = cylM(d.r || 0.022, steel);
        const grip = cylM(0.02, dark);
        out.push({ update(P, J) {
          const h = (J['grip' + d.hand] || J['hand' + d.hand]).clone();
          placeBetween(me, V(...d.from), h);
          const ax = d.grip ? V(...d.grip) : V(0, 1, 0);
          placeBetween(grip, h.clone().add(ax.clone().multiplyScalar(-0.07)), h.clone().add(ax.clone().multiplyScalar(0.07)));
        } });
      } else if (t === 'pad') { // đệm bám theo một khớp (ví dụ đệm máy móc đùi bám cổ chân)
        const me = cylM(d.r || 0.05, pad);
        out.push({ update(P, J) {
          const c = J[d.joint].clone().add(V(...(d.off || [0, 0, 0])));
          placeBetween(me, c.clone().add(V(-(d.w || 0.35) / 2, 0, 0)), c.clone().add(V((d.w || 0.35) / 2, 0, 0)));
          if (d.arm) { if (!this.arm) this.arm = cylM(0.02, steel); placeBetween(this.arm, V(...d.arm), c); }
        } });
      } else if (t === 'platform') { // bàn đạp leg press / máy calf: theo khoá pose
        const me = box(d.size[0], d.size[1], d.size[2], steel);
        out.push({ update(P) { const v = P[d.key]; if (v) me.position.set(...v); if (d.rot) me.rotation.x = d.rot * DEG; } });
      } else if (t === 'ball') {
        const me = new T.Mesh(new T.SphereGeometry(0.12, 24, 18), mat(COLORS.ball, { roughness: 0.75 }));
        me.castShadow = true; scene.add(me);
        const seam = new T.Mesh(new T.TorusGeometry(0.121, 0.004, 6, 32), mat(0x2a1206)); scene.add(seam);
        out.push({ update(P, J) {
          let v;
          if (P.ball) v = V(...P.ball);
          else if (P.ballIn === 'L' || P.ballIn === 'R') v = J['hand' + P.ballIn].clone().add(V(0, -0.11, 0.02));
          else v = J.handL.clone().add(J.handR).multiplyScalar(0.5).add(V(0, 0.02, 0.08).applyQuaternion(J.q));
          me.position.copy(v); seam.position.copy(v); seam.rotation.set(0.6, 0.3, 0);
        } });
      } else if (t === 'hoop') {
        const pole = cylM(0.06, steel); placeBetween(pole, V(d.pos[0], 0, d.pos[2] + 0.9), V(d.pos[0], 3.4, d.pos[2] + 0.9));
        const board = box(1.8, 1.05, 0.04, mat(0xe8eef9, { transparent: true, opacity: 0.85 })); board.position.set(d.pos[0], 3.35, d.pos[2] + 0.4);
        const rim = new T.Mesh(new T.TorusGeometry(0.23, 0.012, 8, 40), mat(COLORS.rim)); rim.rotation.x = Math.PI / 2; rim.position.set(d.pos[0], 3.05, d.pos[2]); scene.add(rim);
      } else if (t === 'cone') {
        (d.list || [d.pos]).forEach(p => { const c = new T.Mesh(new T.ConeGeometry(0.1, 0.28, 18), mat(COLORS.sole)); c.position.set(p[0], 0.14, p[2]); c.castShadow = true; scene.add(c); });
      } else if (t === 'mat') {
        const me = box(d.size ? d.size[0] : 0.7, 0.012, d.size ? d.size[1] : 1.9, mat(COLORS.mat)); me.position.set(...(d.pos || [0, 0.006, 0]));
        if (d.rotY) me.rotation.y = d.rotY * DEG;
      } else if (t === 'bench') { // ghế: đệm da bo tròn + khung thép chân chữ T + (tuỳ chọn) lưng dốc
        const h = d.h || 0.45, W = d.w || 0.3, Ls = d.seat || 1.2;
        const grp = new T.Group(); grp.position.set(d.pos[0], 0, d.pos[2]); if (d.rotY) grp.rotation.y = d.rotY * DEG; scene.add(grp);
        part(rboxG(W, 0.075, Ls, 0.032), pad, grp).position.set(0, h, 0);
        part(new T.BoxGeometry(0.055, 0.045, Math.max(0.2, Ls - 0.16)), frame, grp).position.set(0, h - 0.06, 0);
        const feet = Ls > 0.5 ? [-(Ls / 2 - 0.12), Ls / 2 - 0.12] : [0];
        feet.forEach(z => {
          part(new T.BoxGeometry(0.05, h - 0.1, 0.05), frame, grp).position.set(0, (h - 0.1) / 2 + 0.04, z);
          part(new T.BoxGeometry(Math.max(0.42, W + 0.2), 0.045, 0.06), frame, grp).position.set(0, 0.045, z);
          for (const sx of [-1, 1]) part(rboxG(0.06, 0.035, 0.075, 0.012), rubber, grp).position.set(sx * (Math.max(0.42, W + 0.2) / 2 - 0.02), 0.018, z);
        });
        if (d.back) { // lưng ghế: dài back, góc incline so với phương ngang, bắt đầu từ mép sau đệm
          const ang = d.incline * DEG, dirZ = d.backDir || -1;
          const z0 = d.backAt != null ? d.backAt : -Ls / 2;
          const bk = part(rboxG(W, 0.075, d.back, 0.032), pad, grp);
          bk.position.set(0, h + Math.sin(ang) * d.back / 2, z0 + dirZ * Math.cos(ang) * d.back / 2);
          bk.rotation.x = -dirZ * ang;
          const st = part(new T.BoxGeometry(0.045, 0.045, 1), frame, grp); // thanh chống lưng ghế
          const a0 = V(0, 0.07, z0 + dirZ * 0.05), a1 = V(0, h + Math.sin(ang) * d.back * 0.55 - 0.06, z0 + dirZ * Math.cos(ang) * d.back * 0.55);
          st.position.copy(a0).add(a1).multiplyScalar(0.5); st.scale.z = a0.distanceTo(a1); st.lookAt(grp.localToWorld(a1.clone()));
        }
      }
    });
    return out;
  }

  // nền studio: xám ấm phía trên, tối dần xuống sàn (giống ảnh mẫu)
  let BG = null;
  function studioBg() {
    if (BG) return BG;
    const c = document.createElement('canvas'); c.width = 4; c.height = 256;
    const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#3a3e45'); gr.addColorStop(0.5, '#2a2d32'); gr.addColorStop(1, '#2a2d32');
    g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
    BG = new T.CanvasTexture(c); BG.encoding = T.sRGBEncoding;
    return BG;
  }

  // ánh sáng môi trường kiểu studio chụp ảnh: hộp đèn mềm phía trước-trên, đèn viền xanh phía sau, sàn hắt nhẹ
  function studioEnv(renderer) {
    const env = new T.Scene();
    env.add(new T.Mesh(new T.SphereGeometry(20, 32, 16), new T.MeshBasicMaterial({ side: T.BackSide, color: 0x9a9c9e })));
    const panel = (w, h, pos, col, k) => {
      const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(col).multiplyScalar(k), side: T.DoubleSide }));
      m.position.set(...pos); m.lookAt(0, 1, 0); env.add(m);
    };
    panel(7, 5, [3.5, 7, 6], 0xffffff, 3.2);     // hộp đèn chính
    panel(5, 3, [-6, 3, 4], 0xf1f4ff, 1.1);      // đèn phụ
    panel(3, 8, [-6, 4, -5], 0xffffff, 1.2);     // đèn viền trái-sau
    panel(3, 8, [6, 4, -5], 0xffffff, 0.8);      // đèn viền phải-sau
    panel(30, 30, [0, -0.5, 0], 0xe9e3dc, 1.0);  // sàn hắt (ấm, sáng)
    const pm = new T.PMREMGenerator(renderer);
    const rt = pm.fromScene(env, 0.035);
    pm.dispose();
    env.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    return rt.texture;
  }

  /* ── registry & player ── */
  const REG = {};
  function define(id, def) { REG[id] = def; }
  function has(id) { return !!REG[id] && !!T; }

  function webglOK() {
    try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
  }

  const VIEWS = [['Nghiêng', 'a'], ['Bên', 's'], ['Trước', 'f']];

  function mount(root, id, opts) {
    const def = REG[id];
    if (!def || !T || !webglOK()) return null;
    opts = opts || {};
    root.innerHTML = `
      <div class="a3">
        <div class="a3-stage"></div>
        <div class="a3-cap" aria-live="polite"></div>
        <div class="a3-rep"></div>
        <div class="a3-bar">
          <button type="button" class="a3-btn a3-play" aria-label="Tạm dừng">❚❚</button>
          <button type="button" class="a3-btn a3-speed" aria-label="Tốc độ">1×</button>
          <button type="button" class="a3-btn a3-guide" aria-pressed="true" title="Bật/tắt đường sáng chỉ quỹ đạo đúng">Quỹ đạo</button>
          ${opts.compact ? '' : `<span class="a3-views">${VIEWS.map(([lab, k]) => `<button type="button" class="a3-btn a3-view" data-v="${k}">${lab}</button>`).join('')}</span>
          <span class="a3-hint">Kéo để xoay</span>`}${opts.extra ? `<span class="a3-extra">${opts.extra}</span>` : ''}
        </div>
      </div>`;
    const stage = root.querySelector('.a3-stage');
    const capEl = root.querySelector('.a3-cap');
    const repEl = root.querySelector('.a3-rep');
    const renderer = new T.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: !!opts.preserve });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.85;
    stage.appendChild(renderer.domElement);
    const scene = new T.Scene();
    scene.background = new T.Color(COLORS.bg);
    const envTex = studioEnv(renderer);
    scene.environment = envTex;
    const cam = new T.PerspectiveCamera(32, 16 / 9, 0.05, 50);
    scene.add(new T.HemisphereLight(0xffffff, 0xd9cfc4, 0.36));
    const sun = new T.DirectionalLight(0xfff6ee, 1.3);
    sun.position.set(2.0, 5, 4.2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.radius = 7; sun.shadow.bias = -0.0004;
    Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 0.5, far: 15 });
    scene.add(sun);
    const fill = new T.DirectionalLight(0xf2f5ff, 0.45); fill.position.set(-3, 2, 3); scene.add(fill);
    const rim = new T.DirectionalLight(0xffffff, 0.5); rim.position.set(-2, 3, -4); scene.add(rim);
    // nền trắng: sàn trong suốt chỉ giữ bóng đổ mềm; vòng tròn bạc hà nhạt phía sau người mẫu (như tranh minh hoạ)
    const floor = new T.Mesh(new T.PlaneGeometry(80, 80), new T.ShadowMaterial({ opacity: 0.16 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
    const backdrop = new T.Mesh(new T.CircleGeometry(1, 96), new T.MeshBasicMaterial({ color: COLORS.backdrop, toneMapped: false, depthWrite: false }));
    backdrop.renderOrder = -1; scene.add(backdrop);

    const B = makeBody(scene, def);
    if (!B) { renderer.dispose(); root.innerHTML = ''; return null; }
    let glow = 0.3;
    const P = makeProps(scene, def.props);
    const G = makeGuides(scene, def);

    // chuỗi động tác
    const keys = def.seq.map(k => ({ p: k[0], d: k[1], cap: k[2] || '' }));
    const total = keys.reduce((s, k) => s + k.d, 0);
    let speed = 1, playing = true, t = 0, last = performance.now(), rep = 1, raf = 0, dead = false;

    // camera
    const camDef = Object.assign({ az: 40, el: 10, dist: 4.3, target: [0, 0.9, 0] }, def.cam || {}, opts.cam || {});
    // bài tập lưng: góc nhìn mặc định quay ra sau lưng để thấy rõ cơ đang tập
    const BACK = ['lats', 'midback', 'traps', 'delts_rear', 'lower_back'];
    if (!opts.cam && (def.focus || []).length && def.focus.every(m => BACK.includes(m)) && Math.abs(((camDef.az + 540) % 360) - 180) < 90) camDef.az = 180 - camDef.az;
    let az = camDef.az, el = camDef.el;
    const target = V(...camDef.target);
    function placeCam() {
      const d = camDef.dist * (opts.zoom || 1) * (cam.aspect < 1.5 ? 1.12 : 1); // khung 4:3 trên điện thoại → lùi camera chút
      cam.position.set(target.x + d * Math.cos(el * DEG) * Math.sin(az * DEG), target.y + d * Math.sin(el * DEG), target.z + d * Math.cos(el * DEG) * Math.cos(az * DEG));
      cam.lookAt(target);
      // vòng tròn nền: luôn ở sau người mẫu, quay về phía camera, chiếm ~85% chiều cao khung
      const back = cam.position.clone().sub(target).normalize().multiplyScalar(-2.2);
      backdrop.position.copy(target).add(back);
      backdrop.lookAt(cam.position);
      backdrop.scale.setScalar(0.43 * 2 * (d + 2.2) * Math.tan(cam.fov / 2 * DEG) * Math.min(1, cam.aspect * 1.05));
    }
    placeCam();

    function poseAt(time) {
      let acc = 0;
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (time <= acc + k.d || i === keys.length - 1) {
          const n = keys.length, at = j => keys[((j % n) + n) % n].p;
          const u = k.d > 0 ? Math.min(1, Math.max(0, (time - acc) / k.d)) : 1;
          const ue = u + (ease(u) - u) * 0.45; // vẫn chậm lại chút ở đầu/cuối mỗi nhịp, nhưng không dừng hẳn
          if (window.__noSpline) return { pose: lerpPose(at(i - 1), k.p, ease(u)), cap: k.cap, idx: i, u: ease(u) };
          return { pose: splinePose(at(i - 2), at(i - 1), k.p, at(i + 1), ue), cap: k.cap, idx: i, u: ue };
        }
        acc += k.d;
      }
      return { pose: keys[0].p, cap: keys[0].cap, idx: 0 };
    }

    // nhịp gắng sức (phụ đề có "thở ra" hoặc "giữ") → cơ đang tập sáng mạnh, phồng nhẹ
    const effortOf = cap => (/thở ra|giữ|Giữ|Siết|siết/.test(cap) ? 1 : 0.22);
    let lastJ = null;
    // nội suy theo góc khớp: cánh tay / cẳng tay, đùi / cẳng chân xoay quanh khớp (cổ tay, cổ chân đi theo cung tròn như người thật);
    // tay / chân đang cố định (cùng vị trí ở hai tư thế) thì giữ nguyên chỗ
    const keyJ = keys.map(() => null);
    const solvedKey = j => { const n = keys.length, jj = ((j % n) + n) % n; return keyJ[jj] || (keyJ[jj] = solve(keys[jj].p)); };
    const crV = (a, b, c, d, u) => {
      const u2 = u * u, u3 = u2 * u, f = (A, B, C, D) => 0.5 * (2 * B + (C - A) * u + (2 * A - 5 * B + 4 * C - D) * u2 + (3 * B - A - 3 * C + D) * u3);
      return V(f(a.x, b.x, c.x, d.x), f(a.y, b.y, c.y, d.y), f(a.z, b.z, c.z, d.z)).normalize();
    };
    function jointSpace(pose, idx, u) {
      if (keys.length < 2 || window.__noSpline) return pose;
      const Jc = solve(pose), K = [solvedKey(idx - 2), solvedKey(idx - 1), solvedKey(idx), solvedKey(idx + 1)], out = Object.assign({}, pose);
      const chain = (s, root, mid, end, l1, l2, tKey, pKey) => {
        if (K[1][end + s].distanceTo(K[2][end + s]) < 0.01) return;
        const d1 = K.map(k => k[mid + s].clone().sub(k[root + s]).normalize()), d2 = K.map(k => k[end + s].clone().sub(k[mid + s]).normalize());
        const a = crV(d1[0], d1[1], d1[2], d1[3], u), b = crV(d2[0], d2[1], d2[2], d2[3], u);
        const r0 = Jc[root + s], m = r0.clone().addScaledVector(a, l1), e = m.clone().addScaledVector(b, l2);
        const dir = e.clone().sub(r0).normalize(), pole = m.clone().sub(r0);
        pole.sub(dir.multiplyScalar(pole.dot(dir)));
        if (pole.lengthSq() < 1e-6) return;
        out[tKey + s] = [e.x, e.y, e.z]; out[pKey + s] = [pole.x, pole.y, pole.z];
        delete out[tKey + s + 't']; delete out[pKey + s + 't']; if (tKey === 'w') delete out['h' + s];
      };
      for (const s of ['L', 'R']) {
        chain(s, 'sh', 'elb', 'wr', L.upper, L.fore, 'w', 'e');
        chain(s, 'hip', 'knee', 'ank', L.thigh, L.shank, 'a', 'k');
      }
      return out;
    }
    function alive(pose, time) {
      if (def.still || window.__noAlive) return { pose, breath: 0 };
      const b = time * 2 * Math.PI / 3.6, q = Object.assign({}, pose);
      q.tr = (pose.tr || [0, 0, 0]).slice(); q.tr[0] += 0.5 * Math.sin(b); q.tr[2] += 0.35 * Math.sin(b * 0.5 + 1);
      q.hd = (pose.hd || 0) + 0.9 * Math.sin(b + 0.8);
      if (pose.pel && pose.pel[1] > STAND_Y - 0.12 && !def.still) { // đứng: dồn trọng tâm rất nhẹ sang hai bên
        q.pel = pose.pel.slice(); q.pel[0] += 0.004 * Math.sin(b * 0.5); q.pel[1] -= 0.002 * (1 + Math.sin(b));
      }
      return { pose: q, breath: Math.sin(b) };
    }
    function draw(instant) {
      const r0 = poseAt(t), live = alive(jointSpace(r0.pose, r0.idx, r0.u), t);
      const r = { pose: live.pose, cap: r0.cap, idx: r0.idx };
      const J = solve(r.pose);
      J.breath = live.breath;
      const target = effortOf(r.cap);
      glow = instant ? target : glow + (target - glow) * 0.08;
      lastJ = J;
      updateBody(B, J, glow, r.pose);
      P.forEach(p => p.update(r.pose, J));
      G.update(J, cam.position);
      if (capEl.textContent !== r.cap) capEl.textContent = r.cap;
      repEl.textContent = def.reps === false ? '' : 'Lần ' + rep;
      renderer.render(scene, cam);
    }

    function size() {
      const w = stage.clientWidth || 320, h = Math.round(w * (opts.aspect || (w < 560 ? 0.75 : 9 / 16)));
      stage.style.height = h + 'px';
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = '100%'; renderer.domElement.style.height = h + 'px';
      cam.aspect = w / h; cam.updateProjectionMatrix(); placeCam();
    }
    size();
    const ro = new ResizeObserver(() => { size(); draw(); });
    ro.observe(stage);

    function frame(now) {
      if (dead) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (playing) {
        t += dt * speed;
        if (t >= total) { t -= total; rep = rep % 9 + 1; }
      }
      draw();
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    // điều khiển
    const playBtn = root.querySelector('.a3-play');
    playBtn.addEventListener('click', () => {
      playing = !playing;
      playBtn.textContent = playing ? '❚❚' : '▶';
      playBtn.setAttribute('aria-label', playing ? 'Tạm dừng' : 'Phát');
    });
    const spBtn = root.querySelector('.a3-speed');
    spBtn.addEventListener('click', () => {
      speed = speed === 1 ? 0.5 : speed === 0.5 ? 1.5 : 1;
      spBtn.textContent = (speed === 0.5 ? '0,5' : speed === 1.5 ? '1,5' : '1') + '×';
    });
    const gBtn = root.querySelector('.a3-guide');
    gBtn.addEventListener('click', () => { G.on = !G.on; gBtn.setAttribute('aria-pressed', G.on); draw(); });
    const presets = { a: [camDef.az, camDef.el], s: [def.side != null ? def.side : 90, 6], f: [def.front != null ? def.front : 0, 8] };
    root.querySelectorAll('.a3-view').forEach(b => b.addEventListener('click', () => {
      [az, el] = presets[b.dataset.v]; placeCam();
      root.querySelectorAll('.a3-view').forEach(x => x.setAttribute('aria-pressed', x === b));
    }));
    let drag = null;
    stage.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, az, el }; stage.setPointerCapture(e.pointerId); });
    stage.addEventListener('pointermove', e => {
      if (!drag) return;
      az = drag.az - (e.clientX - drag.x) * 0.4;
      el = Math.max(-5, Math.min(60, drag.el + (e.clientY - drag.y) * 0.25));
      placeCam();
    });
    const endDrag = () => { drag = null; };
    stage.addEventListener('pointerup', endDrag); stage.addEventListener('pointercancel', endDrag);
    stage.style.touchAction = 'pan-y';

    return {
      setTime(sec) { t = ((sec % total) + total) % total; draw(true); },
      pause() { playing = false; },
      view(k) { [az, el] = presets[k]; placeCam(); draw(); },
      setAngle(a, e) { az = a; el = e; placeCam(); draw(); },
      angle: () => [az, el],
      joints: () => lastJ,
      scene,
      look(tg, d) { target.set(tg[0], tg[1], tg[2]); camDef.dist = d; placeCam(); draw(true); },
      total,
      destroy() {
        dead = true; cancelAnimationFrame(raf); ro.disconnect();
        scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); });
        envTex.dispose();
        renderer.dispose(); renderer.forceContextLoss && renderer.forceContextLoss();
        root.innerHTML = '';
      }
    };
  }

    // gán nhóm cơ chính (đỏ) & phụ (cam nhạt) cho một bài
  function muscles(id, primary, secondary) { if (REG[id]) { REG[id].focus = primary || []; REG[id].assist = secondary || []; } }
  window.Anim3D = { define, has, mount, muscles, lib, solve, L, MUSCLES, list: () => Object.keys(REG), info: id => REG[id], debugBody: () => bodyData() };
})();
