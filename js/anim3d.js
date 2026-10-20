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

  const COLORS = {
    bg: 0x2a2d32, floor: 0x2b2e33, body: 0xc4c8ce, hot: 0xff4a1c, hotGlow: 0xff2a0a, warm: 0xff9c66, shorts: 0x15171b, rimBlue: 0x7cc8ff,
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
  function bodyData() {
    if (BODY) return BODY;
    const M = window.BODY_MESH;
    if (!M) return null;
    const dec = s => { const b = atob(s), a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; };
    const q = new Int16Array(dec(M.pos).buffer);
    const pos = new Float32Array(M.n * 3);
    for (let i = 0; i < pos.length; i++) { const k = i % 3; pos[i] = M.posMin[k] + (q[i] + 32767) * M.posScale[k]; }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(pos, 3));
    g.setIndex(new T.BufferAttribute(new Uint16Array(dec(M.idx).buffer), 1));
    g.setAttribute('skinIndex', new T.Uint16BufferAttribute(Uint16Array.from(dec(M.skI)), 4));
    const sw = dec(M.skW), w = new Float32Array(sw.length);
    for (let i = 0; i < sw.length; i += 4) {
      const s = (sw[i] + sw[i + 1] + sw[i + 2] + sw[i + 3]) || 1;
      for (let j = 0; j < 4; j++) w[i + j] = sw[i + j] / s;
    }
    g.setAttribute('skinWeight', new T.BufferAttribute(w, 4));
    const f01 = s => Float32Array.from(dec(s), v => v / 255);
    g.setAttribute('mus', new T.BufferAttribute(Float32Array.from(dec(M.mus)), 2)); // 2 nhóm cơ mạnh nhất ở mỗi đỉnh
    g.setAttribute('mInt', new T.BufferAttribute(f01(M.mInt), 2));
    g.setAttribute('shorts', new T.BufferAttribute(f01(M.shorts), 1));
    g.setAttribute('ao', M.ao ? new T.BufferAttribute(f01(M.ao), 1) : new T.BufferAttribute(new Float32Array(M.n).fill(1), 1)); // bóng trong khe cơ
    g.computeVertexNormals();
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
      const fw = R['toe' + s].clone().sub(an); fw.y = 0;
      F0['ft' + s] = inv(basis(an, fw, V(0, 1, 0)));
      F0['dl' + s] = new T.Matrix4().setPosition(sh.clone().negate());
    }
    const H = {};
    ['L', 'R'].forEach(s => { H[s] = { grip: V(...M.hand[s].grip), pn: V(...M.hand[s].pn).normalize() }; });
    BODY = { geo: g, R, F0, len0, H, names: M.bones.map(n => n.replace(/^sh([LR])$/, 'sk$1')) };
    return BODY;
  }

  function bodyMaterial(levels, U) {
    const m = new T.MeshStandardMaterial({ color: COLORS.body, roughness: 0.46, metalness: 0.0, envMapIntensity: 0.8 });
    m.onBeforeCompile = sh => {
      sh.uniforms.uLvl = { value: levels };
      sh.uniforms.uGlow = U.glow;
      sh.vertexShader = 'attribute vec2 mus;\nattribute vec2 mInt;\nattribute float shorts;\nattribute float ao;\nuniform float uLvl[18];\nuniform float uGlow;\nvarying float vHot;\nvarying float vWarm;\nvarying float vShorts;\nvarying float vAO;\n' +
        sh.vertexShader.replace('#include <begin_vertex>', [
          '#include <begin_vertex>',
          '  int m1 = int(mus.x + 0.5); int m2 = int(mus.y + 0.5);',
          '  float l1 = 0.0; float l2 = 0.0;',
          '  for (int i = 0; i < 18; i++) { if (i == m1) l1 = uLvl[i]; if (i == m2) l2 = uLvl[i]; }',
          '  vHot = clamp((l1 > 0.75 ? mInt.x : 0.0) + (l2 > 0.75 ? mInt.y : 0.0), 0.0, 1.0);',
          '  vWarm = clamp((l1 > 0.25 && l1 < 0.75 ? mInt.x : 0.0) + (l2 > 0.25 && l2 < 0.75 ? mInt.y : 0.0), 0.0, 1.0);',
          '  vShorts = shorts;',
          '  vAO = ao;',
          '  transformed += objectNormal * (vHot * uGlow * 0.004);'].join('\n'));
      sh.fragmentShader = 'uniform float uGlow;\nvarying float vHot;\nvarying float vWarm;\nvarying float vShorts;\nvarying float vAO;\n' +
        sh.fragmentShader
          .replace('#include <color_fragment>', [
            '#include <color_fragment>',
            '  diffuseColor.rgb *= mix(1.0, vAO, 0.65);',
            '  float hotK = smoothstep(0.0, 0.5, vHot);',
            '  vec3 hotC = mix(vec3(0.8, 0.07, 0.02), vec3(1.0, 0.24, 0.05), smoothstep(0.45, 1.0, vHot));',
            '  diffuseColor.rgb = mix(diffuseColor.rgb, hotC, hotK);',
            '  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.6, 0.38), smoothstep(0.0, 0.6, vWarm) * 0.7);',
            '  diffuseColor.rgb = mix(diffuseColor.rgb, mix(vec3(0.045, 0.047, 0.052), vec3(0.34, 0.04, 0.02), hotK * 0.45), vShorts);'].join('\n'))
          .replace('#include <aomap_fragment>', '#include <aomap_fragment>\n  reflectedLight.indirectDiffuse *= vAO;\n  reflectedLight.indirectSpecular *= vAO * vAO;')
          .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  roughnessFactor = mix(roughnessFactor, 0.85, vShorts);')
          .replace('#include <emissivemap_fragment>', [
            '#include <emissivemap_fragment>',
            '  float rimF = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 3.0);',
            '  totalEmissiveRadiance += vec3(0.42, 0.66, 1.0) * rimF * (0.5 - 0.38 * vShorts);',
            '  totalEmissiveRadiance += vec3(1.0, 0.13, 0.02) * smoothstep(0.0, 0.5, vHot) * (0.3 + 0.75 * uGlow) * (1.0 - 0.8 * vShorts);',
            '  totalEmissiveRadiance += vec3(1.0, 0.4, 0.15) * smoothstep(0.0, 0.6, vWarm) * 0.1;'].join('\n'));
    };
    m.customProgramCacheKey = () => 'togi-body-3';
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

  function makeBody(scene, def) {
    const D = bodyData();
    if (!D) return null;
    const lv = MUSCLES.map(m => (def.focus || []).includes(m) ? 1 : (def.assist || []).includes(m) ? 0.5 : 0);
    const U = { glow: { value: 0.3 } };
    const bones = D.names.map(() => { const b = new T.Bone(); b.matrixAutoUpdate = false; return b; });
    const skel = new T.Skeleton(bones, bones.map(() => new T.Matrix4()));
    const mesh = new T.SkinnedMesh(D.geo, bodyMaterial(lv, U));
    mesh.bind(skel, new T.Matrix4());
    mesh.frustumCulled = false; mesh.castShadow = true;
    scene.add(mesh);
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
    setBone(bones.chest, _F.makeRotationFromQuaternion(J.qb).setPosition(J.mid), (L.spine / 2) / (D.R.chest.y - D.R.mid.y), F0.chest);
    setBone(bones.head, _F.makeRotationFromQuaternion(J.qh).setPosition(J.neck), 1, F0.head);
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
      setBone(bones['sk' + s], basis(kn, uS, J['kp' + s], _F), uS.length() / D.len0['sk' + s], F0['sk' + s]);
      setBone(bones['ft' + s], basis(an, J['toe' + s].clone().sub(J['heel' + s]), V(0, 1, 0), _F), 1, F0['ft' + s]);
    }
    B.U.glow.value = glow;
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
    const box = (w, h, d, m) => { const me = new T.Mesh(new T.BoxGeometry(w, h, d), m); me.castShadow = true; me.receiveShadow = true; scene.add(me); return me; };
    const cylM = (r, m, seg) => { const me = new T.Mesh(new T.CylinderGeometry(r, r, 1, seg || 16), m); me.castShadow = true; scene.add(me); return me; };

    function dumbbell(len) {
      const g = new T.Group();
      const bar = new T.Mesh(new T.CylinderGeometry(0.016, 0.016, len, 12), chrome);
      g.add(bar);
      for (const s of [-1, 1]) {
        const h = new T.Mesh(new T.CylinderGeometry(0.055, 0.055, 0.075, 8), plate);
        h.position.y = s * (len / 2 - 0.02); g.add(h);
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
      } else if (t === 'bench') { // ghế: đệm ngồi + (tuỳ chọn) lưng dốc
        const h = d.h || 0.45;
        const seat = box(d.w || 0.3, 0.07, d.seat || 1.2, pad);
        seat.position.set(d.pos[0], h, d.pos[2]);
        if (d.rotY) seat.rotation.y = d.rotY * DEG;
        const leg1 = box(0.06, h - 0.04, 0.06, steel); leg1.position.set(d.pos[0], (h - 0.04) / 2, d.pos[2] - (d.seat || 1.2) / 2 + 0.1);
        const leg2 = box(0.06, h - 0.04, 0.06, steel); leg2.position.set(d.pos[0], (h - 0.04) / 2, d.pos[2] + (d.seat || 1.2) / 2 - 0.1);
        if (d.back) { // lưng ghế: dài back, góc incline so với phương ngang, bắt đầu từ mép sau đệm
          const bk = box(d.w || 0.3, 0.07, d.back, pad);
          const ang = d.incline * DEG;
          const z0 = d.pos[2] + (d.backAt != null ? d.backAt : -(d.seat || 1.2) / 2);
          const dirZ = d.backDir || -1;
          bk.position.set(d.pos[0], h + Math.sin(ang) * d.back / 2, z0 + dirZ * Math.cos(ang) * d.back / 2);
          bk.rotation.x = -dirZ * ang;
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
    env.add(new T.Mesh(new T.SphereGeometry(20, 32, 16), new T.MeshBasicMaterial({ side: T.BackSide, color: 0x2b2e34 })));
    const panel = (w, h, pos, col, k) => {
      const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(col).multiplyScalar(k), side: T.DoubleSide }));
      m.position.set(...pos); m.lookAt(0, 1, 0); env.add(m);
    };
    panel(7, 5, [3.5, 7, 6], 0xffffff, 3.2);     // hộp đèn chính
    panel(5, 3, [-6, 3, 4], 0xf1f4ff, 1.1);      // đèn phụ
    panel(3, 8, [-6, 4, -5], 0xb4d4ff, 1.5);     // viền xanh trái-sau
    panel(3, 8, [6, 4, -5], 0xb4d4ff, 1.0);      // viền xanh phải-sau
    panel(30, 30, [0, -0.5, 0], 0x3a3d43, 1.0);  // sàn hắt
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
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.98;
    stage.appendChild(renderer.domElement);
    const scene = new T.Scene();
    scene.background = studioBg();
    scene.fog = new T.Fog(COLORS.bg, 5, 14);
    const envTex = studioEnv(renderer);
    scene.environment = envTex;
    const cam = new T.PerspectiveCamera(32, 16 / 9, 0.05, 50);
    scene.add(new T.HemisphereLight(0xe4ebf5, 0x2a2c30, 0.14));
    const sun = new T.DirectionalLight(0xfffaf3, 1.2);
    sun.position.set(2.2, 5, 3.8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.radius = 5; sun.shadow.bias = -0.0004;
    Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 0.5, far: 15 });
    scene.add(sun);
    const rim = new T.DirectionalLight(0xa9cfff, 0.4); rim.position.set(-3, 3, -3.5); scene.add(rim);
    const rim2 = new T.DirectionalLight(0xa9cfff, 0.25); rim2.position.set(3.5, 2, -2.5); scene.add(rim2);
    // sàn studio: cùng tông với nền, chỉ hiện bóng đổ mềm
    const floor = new T.Mesh(new T.PlaneGeometry(80, 80), mat(COLORS.floor, { roughness: 0.95, metalness: 0 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

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
    let az = camDef.az, el = camDef.el;
    const target = V(...camDef.target);
    function placeCam() {
      const d = camDef.dist * (opts.zoom || 1) * (cam.aspect < 1.5 ? 1.12 : 1); // khung 4:3 trên điện thoại → lùi camera chút
      cam.position.set(target.x + d * Math.cos(el * DEG) * Math.sin(az * DEG), target.y + d * Math.sin(el * DEG), target.z + d * Math.cos(el * DEG) * Math.cos(az * DEG));
      cam.lookAt(target);
    }
    placeCam();

    function poseAt(time) {
      let acc = 0;
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (time <= acc + k.d || i === keys.length - 1) {
          const prev = keys[(i - 1 + keys.length) % keys.length].p;
          const u = k.d > 0 ? Math.min(1, Math.max(0, (time - acc) / k.d)) : 1;
          return { pose: lerpPose(prev, k.p, ease(u)), cap: k.cap, idx: i };
        }
        acc += k.d;
      }
      return { pose: keys[0].p, cap: keys[0].cap, idx: 0 };
    }

    // nhịp gắng sức (phụ đề có "thở ra" hoặc "giữ") → cơ đang tập sáng mạnh, phồng nhẹ
    const effortOf = cap => (/thở ra|giữ|Giữ|Siết|siết/.test(cap) ? 1 : 0.22);
    let lastJ = null;
    function draw(instant) {
      const r = poseAt(t);
      const J = solve(r.pose);
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
