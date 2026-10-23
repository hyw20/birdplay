/* 毛绒小鸟：物种谱系 + 程序化绒羽渲染。
   Q 版法则来自参考插画（头大圆身 / 大眼 / 尾羽三束），质感来自羊毛毡玩偶
   （needle-felted 羊毛 + 珠眼 + 手缝线 + 炸毛边缘），全部用 Canvas 画，不依赖贴图。 */
(function (global) {
  'use strict';

  /* 当前主题：全猫头鹰谱系。按真实体型从小到大排成合成链，
     融合时 tier + 1 → 下一级更大的一只。9 级对应 9 种鸮。

     每种不只是换色，各自带形态参数，否则 9 只会长成同一个模子：
       crest  : 耳羽簇。0 = 圆头无耳羽；40 = 一撮小呆羽；90 = 长而醒目的耳羽
       face   : 脸盘形状。heart = 心形（仓鸮，两颊鼓出，中段收腰）
                           disc   = 圆形大盘（雪鸮，占满脸）
                           flat   = 扁盘，偏方（雕鸮，像戴了个面罩）
       eyeCol : 虹膜色。鸮类的眼睛颜色是重要识别特征
                          '#f0a828' 金橙 / '#e8a83a' 琥珀 / '#2b2b30' 近黑
                          '#f0d84a' 明黄 / '#b06a30' 棕橙 / '#e8c24a' 黄
       brow   : 眉斑。仓鸮/雪鸮有浅色"V"字心形眉纹，让它显得在沉思
       breast : 胸腹纹。barred = 横斑（纵纹腹小鸮、灰林鸮，胸口一排横杠）
                          streak  = 纵纹（红角鸮，从头到胸一道竖线）
                          plain  = 净面（雪鸮、仓鸮）
                          mottled= 暗斑（长耳鸮、褐林鸮，细碎麻点）
       nape   : 后颈白斑。纵纹腹小鸮的标志，像戴了个白领子
     色值取自 data/birds.json 的猛禽类群，保持与物种介绍页一致。 */
  const SPECIES = [
    // 纵纹腹小鸮：最小。胸口一排横斑、后颈白斑、黄眼
    { key: 'owl', name: '纵纹腹小鸮', latin: 'Athene noctua',       body: '#9a8a6a', belly: '#e8ddc4', wing: '#7a6c50', beak: '#c9b48a', tail: '#7a6c50',
      crest: 0, face: 'disc',   eyeCol: '#f0a828', brow: 0, breast: 'barred',  nape: 1 },
    // 红角鸮：一身锈红，耳羽长，胸口一道纵纹
    { key: 'owl', name: '红角鸮',     latin: 'Otus sunia',          body: '#b06a45', belly: '#e0c9a8', wing: '#8a5230', beak: '#4a4a50', tail: '#8a5230',
      crest: 90, face: 'disc',  eyeCol: '#e8a83a', brow: 0, breast: 'streak',  nape: 0 },
    // 领角鸮：比红角鸮大一号，颜色偏暖棕，同样是耳羽族
    { key: 'owl', name: '领角鸮',     latin: 'Otus lettia',         body: '#a86f4a', belly: '#ded0b4', wing: '#875634', beak: '#5a5a52', tail: '#875634',
      crest: 90, face: 'disc',  eyeCol: '#e8a83a', brow: 0, breast: 'mottled', nape: 0 },
    // 灰林鸮：一身灰扑扑，胸口横斑，无耳羽
    { key: 'owl', name: '灰林鸮',     latin: 'Strix aluco',         body: '#8a7a62', belly: '#ded3bc', wing: '#6c5e4a', beak: '#c2b28c', tail: '#6c5e4a',
      crest: 0, face: 'disc',   eyeCol: '#2b2b30', brow: 0, breast: 'barred',  nape: 0 },
    // 长耳鸮：耳羽最长、几乎竖到头两侧，眼睛橙红，身形瘦
    { key: 'owl', name: '长耳鸮',     latin: 'Asio otus',           body: '#a8916a', belly: '#e6dcc0', wing: '#8a7654', beak: '#4a4a50', tail: '#8a7654',
      crest: 95, face: 'flat',  eyeCol: '#b06a30', brow: 0, breast: 'mottled', nape: 0 },
    // 仓鸮：心形脸、白底，浅色心形眉纹，看起来永远在沉思
    { key: 'owl', name: '仓鸮',       latin: 'Tyto alba',           body: '#d8c9a8', belly: '#fbf6e8', wing: '#c2ad88', beak: '#e8d8b0', tail: '#c2ad88',
      crest: 0, face: 'heart', eyeCol: '#2b2b30', brow: 1, breast: 'mottled', nape: 0 },
    // 雪鸮：最大之一，纯白带黑斑，明黄眼，圆脸盘
    { key: 'owl', name: '雪鸮',       latin: 'Bubo scandiacus',     body: '#f4f6f7', belly: '#ffffff', wing: '#e8ecee', beak: '#2b2b30', tail: '#e8ecee',
      crest: 0, face: 'disc',   eyeCol: '#f0d84a', brow: 0, breast: 'barred',  nape: 0 },
    // 褐林鸮：深棕，暗麻点，像一块老木头
    { key: 'owl', name: '褐林鸮',     latin: 'Strix leptogrammica', body: '#8a5f3a', belly: '#e0cba4', wing: '#6d4a2c', beak: '#c9b48a', tail: '#6d4a2c',
      crest: 0, face: 'flat',  eyeCol: '#4a3a2a', brow: 0, breast: 'mottled', nape: 0 },
    // 雕鸮：最大，深褐大块纵斑，长耳羽，像戴了面罩的扁脸
    { key: 'owl', name: '雕鸮',       latin: 'Bubo bubo',           body: '#a8794a', belly: '#e0c9a0', wing: '#8a5f36', beak: '#2b2b30', tail: '#8a5f36',
      crest: 90, face: 'flat',  eyeCol: '#e8a83a', brow: 1, breast: 'streak',  nape: 0 },
  ];

  const BASE_R = 19;
  const RATIO = 1.16;
  const radiusOf = (tier) => BASE_R * Math.pow(RATIO, tier);

  // 确定性随机：同一只鸟每次画的绒毛方向完全一致，落定后不会"抖毛"
  function rng(seed) {
    let s = (seed * 1664525 + 1013904223) >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, Math.min(255, (n >> 16) + amt));
    const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
    const b = Math.max(0, Math.min(255, (n & 255) + amt));
    return `rgb(${r},${g},${b})`;
  }

  /* 毛绒渲染。四层叠加，缺一层就变成"刺猬"或"塑料球"：
     ① haloTuft 柔边光晕 —— 在轮廓外先铺一圈低透明度的色雾，把硬边化开
     ② 主体径向渐变 —— 体积感
     ③ furFringe 轮廓纤维 —— 从体表长出的细短毛，长短交错 + 沿重力倒伏
     ④ furNap 内部绒面 —— 极短的切向绒，让平涂变成"摸得到"的表面

     关键与旧版的三点不同：
     - 纤维要"成簇"而不是等距放射：用簇心 + 簇内抖动，避免刺猬感
     - 纤维要细（r*0.02 量级）、要软（带弯曲）、要顺着重力下垂
     - 用 globalCompositeOperation 制造半透明绒雾，而不是一根根硬描边 */

  // ① 柔边光晕：轮廓外一圈几乎透明的同色雾，消除生硬的圆边
  function haloTuft(ctx, x, y, r, color, seed, spread) {
    const rand = rng(seed + 991);
    const s = spread || 0.12;
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < 90; i++) {
      const a = rand() * Math.PI * 2;
      const l = r * s * (0.2 + rand() * 1.0);
      ctx.globalAlpha = 0.06 + rand() * 0.05;
      ctx.strokeStyle = rand() < 0.5 ? shade(color, 22) : shade(color, -6);
      ctx.lineWidth = r * (0.10 + rand() * 0.14);
      const x0 = x + Math.cos(a) * r * 0.92;
      const y0 = y + Math.sin(a) * r * 0.92;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0 + Math.cos(a) * l, y0 + Math.sin(a) * l);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ③ 轮廓纤维：从体表长出的绒毛束
  //    簇心法：先布 n 个簇，簇内再散几根毛 —— 这是"毛绒"与"刺猬"的分界
  function furFringe(ctx, x, y, r, color, seed, opts) {
    const o = opts || {};
    const rand = rng(seed);
    // 簇数与每簇根数都要随半径增长，否则大球的毛会稀得露底
    const clusters = o.clusters || Math.round(r * 0.85) || 12;
    const perCluster = o.per || 5;              // 每簇几根毛
    const lenK = o.lenK || 0.13;                // 毛长系数
    const drop = o.drop == null ? 0.35 : o.drop;// 重力下垂强度

    // 毛长对半径饱和（√r）：大球的毛不该等比拉长，否则远看是一团拉丝
    const baseLen = Math.sqrt(r) * lenK * 2.9;
    ctx.save();
    ctx.lineCap = 'round';
    // 每簇覆盖的角宽
    const arc = (Math.PI * 2) / clusters;
    for (let c = 0; c < clusters; c++) {
      const ca = c * arc + (rand() - 0.5) * arc * 0.7;   // 簇心角度（带抖动）
      // 簇本身有粗细起伏，模拟手作毡球的不规则轮廓
      const clusterLen = baseLen * (0.55 + rand() * 0.95);
      for (let k = 0; k < perCluster; k++) {
        const a = ca + (rand() - 0.5) * arc * 1.15;
        const l = clusterLen * (0.45 + rand() * 0.85);
        const x0 = x + Math.cos(a) * r * (0.93 + rand() * 0.05);
        const y0 = y + Math.sin(a) * r * (0.93 + rand() * 0.05);
        // 毛尖方向 = 法向 + 一点切向扰动 + 重力下垂
        let dx = Math.cos(a), dy = Math.sin(a);
        const tang = (rand() - 0.5) * 0.9;
        const nxx = dx, nyy = dy;
        dx += -nyy * tang;
        dy += nxx * tang;
        dy += drop * 0.45;                          // 重力下垂：正往下、负上翘
        const m = Math.hypot(dx, dy) || 1;
        dx /= m; dy /= m;
        const x1 = x0 + dx * l;
        const y1 = y0 + dy * l;
        // 控制点偏向切向 → 毛有弯曲，不是直线针
        const cx = x0 + dx * l * 0.5 - dy * l * 0.35;
        const cy = y0 + dy * l * 0.5 + dx * l * 0.35;
        // 颜色在体色附近抖动：亮尖 + 暗根，模拟光线下的绒
        const tone = rand();
        ctx.strokeStyle = tone < 0.42 ? shade(color, 30) : tone < 0.78 ? shade(color, -18) : shade(color, 8);
        ctx.globalAlpha = 0.5 + rand() * 0.4;       // 半透明 → 软，不糊
        ctx.lineWidth = Math.max(0.7, r * (0.016 + rand() * 0.022));
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo(cx, cy, x1, y1);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ④ 内部绒面：极短的切向绒毛，把平涂色块变成有绒感的表面
  //    keepOut: 数组 [{x,y,r}]，这些圆内不画绒 —— 给脸留白，别把眼睛糊住
  function furNap(ctx, x, y, r, color, seed, opts) {
    const o = opts || {};
    const rand = rng(seed + 313);
    // 内部绒按"面积 × 密度"布点；绒长随半径饱和
    const n = Math.round(r * r * 0.028 * (o.density || 3.4) + r * 0.6);
    const napLen = Math.sqrt(r) * 0.55;
    const keepOut = o.keepOut || [];
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2;
      const d = Math.sqrt(rand()) * r * 0.88;     // 面积均匀撒点
      const px = x + Math.cos(a) * d;
      const py = y + Math.sin(a) * d;
      // 落在保留区内就跳过：脸要干净
      let skip = false;
      for (const ko of keepOut) {
        if (Math.hypot(px - ko.x, py - ko.y) < ko.r) { skip = true; break; }
      }
      if (skip) continue;
      const l = napLen * (0.5 + rand() * 0.85);
      // 切向为主：贴着表面倒伏，像真正被梳过的绒毛
      const ta = a + Math.PI / 2 + (rand() - 0.5) * 0.5;
      const x1 = px + Math.cos(ta) * l;
      const y1 = py + Math.sin(ta) * l;
      ctx.strokeStyle = rand() < 0.5 ? shade(color, 18) : shade(color, -14);
      ctx.globalAlpha = 0.22 + rand() * 0.22;
      ctx.lineWidth = Math.max(0.6, Math.sqrt(r) * 0.14);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.quadraticCurveTo(px + Math.cos(ta) * l * 0.5, py + Math.sin(ta) * l * 0.5, x1, y1);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 组合：光晕 → 纤维 → 内部绒。供各部件调用
  function fluff(ctx, x, y, r, color, seed, opts) {
    const o = opts || {};
    haloTuft(ctx, x, y, r, color, seed, o.spread);
    furFringe(ctx, x, y, r, color, seed, o);
    furNap(ctx, x, y, r, color, seed, o);
  }
  /* 脸盘：鸮类最重要的识别特征，三种形状差别很大
       heart = 心形（仓鸮）：两颊鼓起、额头收窄、下方收尖
       disc  = 圆盘（雪鸮、林鸮）：正圆，占满脸
       flat  = 扁盘（雕鸮、长耳鸮）：横向拉宽，上下被眉纹切平 */
  function facePlate(ctx, r, shape, color, alpha, cy) {
    const oy = cy || 0;
    ctx.save();
    ctx.globalAlpha = alpha == null ? 0.7 : alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    if (shape === 'heart') {
      // 心形：从左颊起，绕过额头凹口，到右颊，底部收成尖
      ctx.moveTo(0, oy + r * 0.52);
      ctx.quadraticCurveTo(-r * 0.78, oy + r * 0.34, -r * 0.76, oy - r * 0.12);
      ctx.quadraticCurveTo(-r * 0.74, oy - r * 0.62, -r * 0.22, oy - r * 0.60);
      ctx.quadraticCurveTo(0, oy - r * 0.44, r * 0.22, oy - r * 0.60);
      ctx.quadraticCurveTo(r * 0.74, oy - r * 0.62, r * 0.76, oy - r * 0.12);
      ctx.quadraticCurveTo(r * 0.78, oy + r * 0.34, 0, oy + r * 0.52);
    } else if (shape === 'flat') {
      ctx.ellipse(0, oy - r * 0.10, r * 0.78, r * 0.54, 0, 0, Math.PI * 2);
    } else {
      ctx.ellipse(0, oy - r * 0.12, r * 0.72, r * 0.62, 0, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();
  }

  // 珠眼：玻璃珠质感 —— 暗底 + 高光 + 一点反光。iris 决定虹膜色
  function beadEye(ctx, x, y, r, iris) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, iris ? shade(iris, -40) : '#4a4a52');
    g.addColorStop(0.62, iris || '#2a2a32');
    g.addColorStop(1, '#14141a');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath();
    ctx.arc(x - r * 0.34, y - r * 0.38, r * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(x + r * 0.28, y + r * 0.32, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function beak(ctx, x, y, r, color) {
    ctx.save();
    ctx.translate(x, y);
    const h = r * 0.46, w = r * 0.34;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.35);
    ctx.quadraticCurveTo(w, h * 0.1, 0, h);
    ctx.quadraticCurveTo(-w, h * 0.1, 0, -h * 0.35);
    ctx.fill();
    // 上喙压一道缝，嘴才不糊
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = Math.max(0.7, r * 0.05);
    ctx.beginPath();
    ctx.moveTo(-w * 0.85, h * 0.12);
    ctx.lineTo(w * 0.85, h * 0.12);
    ctx.stroke();
    ctx.restore();
  }

  /* 耳羽：成对、尖锐、向上外斜的两束羽条。crest 越大越长、越外张。
     实现要点：
     - 一束 = 若干根自下而上收拢的羽条，尖端交汇，底部张开
     - 每根羽条用二次贝塞尔弯向外侧，不是直线
     - 左右两束镜像对称（s = ±1），中间留出额头，绝不相连
     - 位置在头顶两侧偏外（x ≈ ±0.5r），斜向上约 45° */
  function earTufts(ctx, r, strength, color, seed, cy) {
    const rand = rng(seed);
    const oy = cy || 0;
    const long = strength >= 90;
    /* 束长要克制：真实雕鸮的耳羽约为头高 0.3~0.4 倍，
       之前用 1.15r 长成了兔耳朵。0.62 / 0.40 更接近。 */
    const L = r * (long ? 0.62 : 0.40);          // 束长
    const w = r * (long ? 0.26 : 0.18);          // 束底宽
    const strands = long ? 11 : 7;               // 每束几根羽条
    const tilt = long ? 0.52 : 0.38;             // 外斜角（弧度）

    ctx.save();
    ctx.lineCap = 'round';
    for (const s of [-1, 1]) {
      // 束根落在头顶两侧
      const bx = s * r * (long ? 0.52 : 0.44);
      const by = oy - r * 0.72;
      // 束尖：向上 + 向外斜
      const tipX = bx + s * Math.sin(tilt) * L;
      const tipY = by - Math.cos(tilt) * L;
      for (let i = 0; i < strands; i++) {
        // 羽条在束内的横向偏移：中间最长、两侧渐短 → 形成尖角轮廓
        const f = (i / (strands - 1) - 0.5) * 2;     // -1..1
        const fw = f * w;
        const fl = L * (1 - Math.abs(f) * 0.3);      // 中间的条更长，两侧略短
        const sx = bx + fw * 0.6;
        const sy = by + Math.abs(f) * w * 0.15;
        // 末端同样带外斜，让整束朝一个方向倒
        const ex = sx + s * Math.sin(tilt) * fl;
        const ey = sy - Math.cos(tilt) * fl;
        // 控制点：把羽条弯成弓形，外侧弯得多一点
        const cx = sx + s * (Math.sin(tilt) * fl * 0.4 + Math.abs(f) * w * 0.5);
        const cy = sy - Math.cos(tilt) * fl * 0.55;
        const tone = rand();
        ctx.strokeStyle = tone < 0.45 ? shade(color, 30) : tone < 0.8 ? shade(color, -20) : color;
        ctx.globalAlpha = 0.82 + rand() * 0.18;
        ctx.lineWidth = Math.max(1.1, r * (0.045 + rand() * 0.03));
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(cx, cy, ex, ey);
        ctx.stroke();
      }
      // 束基处铺一小片羽色，让耳羽"长出来"而不是浮在头上
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = shade(color, -6);
      ctx.beginPath();
      ctx.ellipse(bx, by + r * 0.05, w * 0.8, r * 0.13, s * tilt * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 尾羽三束（Q 版画法：圆身 + 向上翘的短尾）
  function tail(ctx, x, y, r, color, seed) {
    const rand = rng(seed + 77);
    for (let i = -1; i <= 1; i++) {
      const a = Math.PI / 2 + i * 0.42;
      const L = r * (0.85 + rand() * 0.25);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a + Math.PI);
      // 尾羽：毛更长更顺，不加光晕（尾羽是扁的不是圆的）
      furFringe(ctx, 0, -L * 0.35, r * 0.3, color, seed + i * 13,
        { lenK: 0.42, clusters: 8, per: 5, drop: 0 });
      furNap(ctx, 0, -L * 0.35, r * 0.28, color, seed + i * 13, { density: 2.6 });
      ctx.restore();
    }
  }

  /* 胸腹纹：胸口的花纹是 Q 版猫头鹰的辨识点之一，四种 */
  function breastPattern(ctx, r, kind, ink) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = ink;
    ctx.lineCap = 'round';
    if (kind === 'barred') {
      // 横斑：胸口一排短横杠，向下越来越短
      const rows = 4;
      for (let i = 0; i < rows; i++) {
        const y = r * (0.16 + i * 0.16);
        const w = r * (0.36 - i * 0.06);
        ctx.lineWidth = Math.max(0.9, r * 0.055);
        ctx.beginPath();
        ctx.moveTo(-w, y);
        ctx.quadraticCurveTo(0, y - r * 0.03, w, y);
        ctx.stroke();
      }
    } else if (kind === 'streak') {
      // 纵纹：从胸口正中往下拉一条深色中线（浅色鸮尤明显）
      ctx.lineWidth = Math.max(0.9, r * 0.06);
      ctx.beginPath();
      ctx.moveTo(0, r * 0.12);
      ctx.quadraticCurveTo(r * 0.04, r * 0.3, 0, r * 0.46);
      ctx.stroke();
    } else if (kind === 'mottled') {
      // 暗斑：细碎的麻点，像老木头上的坑
      ctx.globalAlpha = 0.32;
      ctx.fillStyle = ink;
      const rand = rng(0x9e1d);
      for (let i = 0; i < 16; i++) {
        const a = rand() * Math.PI * 2;
        const d = Math.sqrt(rand()) * r * 0.42;
        const s = r * (0.025 + rand() * 0.035);
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * d, r * 0.24 + Math.sin(a) * d * 0.8, s, s * 0.7, rand() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // 浅色"V"字心形眉纹（仓鸮、雕鸮），让表情像在沉思
  function brow(ctx, r, cy) {
    const oy = cy || 0;
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = '#fffaf0';
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(1.0, r * 0.075);
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * r * 0.12, oy - r * 0.42);
      ctx.quadraticCurveTo(s * r * 0.46, oy - r * 0.44, s * r * 0.58, oy - r * 0.24);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 后颈白斑（纵纹腹小鸮的标志，像戴了白领子）
  function napeSpot(ctx, r) {
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#fff8ea';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      // 在肩侧偏上，像领子的两角
      ctx.ellipse(s * r * 0.56, r * 0.22, r * 0.12, r * 0.085, s * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /* 长颈：天鹅、雁、鹭这些鸟的识别核心就是脖子。
     画法是「脖子在身体之后」—— 先画一条从身体上缘升起的弯曲绒带，
     再把头整体上移到脖子顶端。这样不会变成"圆球插管子"。
     neck: 0 = 无（雀鸟类）, 1 = 短颈（鸭）, 2 = 长颈（天鹅、雁）, 3 = 极长（鹭、鹤）
     neckRibbon 会把本次用到的配置写入 lastNeckCfg（身体椭圆尺寸也要用）。 */
  let lastNeckCfg = { bodyW: 1.24, bodyH: 0.70, rise: 0.40 };
  function neckRibbon(ctx, r, kind, color, seed) {
    if (!kind) return 0;
    /* 脖子。三条硬约束，缺一条就变"雪人"：
       ① 脖子要比身体短得多（天鹅脖子长约 2/3 身体高度，不是 1 倍）
       ② 脖子粗细接近头球，不能是细管子
       ③ 从身体**上缘**长出并向外偏，头悬在前上方，不是正上方 */
    const cfg = {
      /* lean = 脖子在身体上的水平落点。太小 → 脖子像从球心顶出来；
         越大越像真鸟从肩部前方升起。
         3 档是鹭/鹤：脖子要明显更长、更挺，身体要窄一些 ——
         否则宽扁身体 + 短脖子会把涉禽画成趴着的鸭子。 */
      1: { len: 0.22, w: 0.46, bodyW: 1.24, bodyH: 0.70, rise: 0.40, lean: 0.30 },
      2: { len: 0.44, w: 0.42, bodyW: 1.24, bodyH: 0.70, rise: 0.40, lean: 0.30 },
      3: { len: 0.95, w: 0.34, bodyW: 1.02, bodyH: 0.72, rise: 0.46, lean: 0.44 },
    }[kind] || { len: 0.22, w: 0.46, bodyW: 1.24, bodyH: 0.70, rise: 0.40, lean: 0.30 };

    const L = r * cfg.len;
    const w = r * cfg.w;
    const y0 = -r * cfg.rise;        // 从身体上缘长出
    const lean = r * (cfg.lean || 0.30);   // 前端偏移：脖子偏右，头悬在前上方
    const rand = rng(seed + 407);
    ctx.save();
    ctx.lineCap = 'round';
    // 脖子主体：一条向上略前倾的绒带，由多层描边叠出体积
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      const ww = w * (1 - t * 0.28);
      const off = (rand() - 0.5) * w * 0.35;
      ctx.globalAlpha = 0.55 + rand() * 0.3;
      ctx.strokeStyle = i % 3 === 0 ? shade(color, 22) : i % 3 === 1 ? color : shade(color, -16);
      ctx.lineWidth = ww * (0.5 + rand() * 0.5);
      ctx.beginPath();
      ctx.moveTo(lean * 0.5 + off, y0);
      // 先向外拱，再收回：S 形的前半段
      ctx.quadraticCurveTo(lean * 1.35 + off, y0 - L * 0.55, lean + off, y0 - L);
      ctx.stroke();
    }
    /* 脖子暗边：纯白色的鸟（大白鹭、丹顶鹤）脖子和身体同色，
       不加这道暗边就糊成一整块白，看不出颈部结构。
       画在脖子外侧（-x 侧），模拟光线从左上来。 */
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = shade(color, -58);
    ctx.lineWidth = Math.max(1.2, w * 0.30);
    ctx.beginPath();
    ctx.moveTo(lean * 0.5 - w * 0.42, y0);
    ctx.quadraticCurveTo(lean * 1.35 - w * 0.46, y0 - L * 0.55, lean - w * 0.34, y0 - L);
    ctx.stroke();
    ctx.restore();
    lastNeckCfg = cfg;   // 身体尺寸也要用，通过模块级变量带出去
    return L;            // 返回脖子长度，调用方据此上移头部
  }

  /* 画一只鸟。ctx 需已按中心平移（scale 由外部控制）。
     bird.spec 可直接传一个物种对象（导图页要用任意鸟渲染，不占用 tier），
     否则按 bird.tier 从 SPECIES 取。 */
  function draw(ctx, bird, t) {
    const sp = bird.spec || SPECIES[bird.tier];
    const r = bird.r;
    const seed = bird.seed;

    tail(ctx, 0, r * 0.55, r, sp.tail, seed);

    // 双翼：贴在身体两侧的小绒球，比身体毛短一些、服帖一些
    for (const side of [-1, 1]) {
      fluff(ctx, side * r * 0.72, r * 0.12, r * 0.42, sp.wing, seed + 5 + side, {
        lenK: 0.2, clusters: 10, per: 4, drop: 0.6, spread: 0.09,
      });
    }

    // 脖子要在身体之前画，身体的毛会盖住它的根部
    const neckL = neckRibbon(ctx, r, sp.neck, sp.body, seed);

    // 身体：有脖子的水鸟身体是**横向椭圆**（长而扁），不是正圆。
    // 正圆身体 + 上方头球 = 雪人；椭圆身体 + 前端升起的脖子才像天鹅。
    ctx.save();
    const g = ctx.createRadialGradient(-r * 0.28, -r * 0.34, r * 0.15, 0, r * 0.1, r * 1.15);
    g.addColorStop(0, shade(sp.body, 34));
    g.addColorStop(0.65, sp.body);
    g.addColorStop(1, shade(sp.body, -30));
    ctx.beginPath();
    if (neckL) {
      /* 水鸟身体：长而扁，明显宽于高 —— 这是压住"雪人感"的关键。
         涉禽（neck 3）身体更窄，因为它们是高挑站立的，不是趴着的鸭子。 */
      const c = lastNeckCfg;
      ctx.ellipse(0, r * 0.20, r * c.bodyW, r * c.bodyH, 0, 0, Math.PI * 2);
    } else {
      ctx.arc(0, 0, r, 0, Math.PI * 2);
    }
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();

    /* 头部几何：有脖子的鸟，头是一个独立的小球挂在脖子顶端；
       没脖子的鸟（雀类、鸮类）头就是身体本身 —— 保持原来的样子。
       头球不能太小、脖子不能太长，否则远看像"雪人"（两个球 + 一根管子）。
       真实天鹅的头与脖子是平滑过渡的，所以头球取 0.64r、脖子略短。 */
    /* 头球位置：接在脖子顶端。x 偏前（与 lean 对齐），y 紧贴身体上缘。
       头球半径 0.50r —— 再大就成了"雪人脑袋"。 */
    const headX = neckL ? r * (lastNeckCfg.lean || 0.30) : 0;   // 必须与脖顶对齐
    const headC = neckL ? -(r * lastNeckCfg.rise + neckL) : 0;
    const hR = neckL ? r * 0.50 : r;

    if (neckL) {
      /* 头球画在以 (headX, headC) 为中心的局部坐标里 —— 后面所有头部细节
         （眼、喙、耳羽、脸盘）都用这套偏移，不必逐个加 headX。 */
      ctx.save();
      ctx.translate(headX, headC);
      const hg = ctx.createRadialGradient(-hR * 0.28, -hR * 0.34, hR * 0.15, 0, 0, hR * 1.1);
      hg.addColorStop(0, shade(sp.body, 34));
      hg.addColorStop(0.7, sp.body);
      hg.addColorStop(1, shade(sp.body, -26));
      ctx.beginPath();
      ctx.arc(0, 0, hR, 0, Math.PI * 2);
      ctx.fillStyle = hg;
      ctx.fill();
      fluff(ctx, 0, 0, hR, sp.body, seed + 91, {
        lenK: 0.15, clusters: Math.max(6, Math.round(hR * 0.8)), per: 4, drop: 0.7, spread: 0.11, density: 3.2,
      });
      ctx.restore();
    }

    // 以下都相对于头部中心，用 hR 作尺度单位
    const isOwl = sp.key === 'owl';
    const eyeX = hR * (isOwl ? 0.34 : 0.33);
    const eyeY = headC - hR * (isOwl ? 0.12 : 0.14);
    const eyeR = hR * (isOwl ? 0.27 : 0.235);
    if (isOwl) {
      // 脸盘在绒毛之前铺底，否则会被长出的毛盖住。按物种走各自形状。
      facePlate(ctx, headC ? hR : r, sp.face || 'disc', shade(sp.belly, 8), 0.72, headC);
      if (sp.brow) brow(ctx, r, headC);
    }

    /* 身体绒毛。
       无脖子：绒毛就是整个身体，脸区要留白。
       有脖子：身体是横向椭圆，脸已经移到上面的头球上去了，
               所以这里只给**身体**长毛（横向铺开），脸区留白不适用。 */
    if (neckL) {
      // 椭圆身体：横向拉宽、纵向压扁，让绒毛贴着椭圆长
      const c = lastNeckCfg;
      ctx.save();
      ctx.scale(1, c.bodyH);
      fluff(ctx, 0, r * 0.20 / c.bodyH, r * (c.bodyW - 0.02), sp.body, seed, {
        lenK: 0.14, clusters: 18, per: 4, drop: 0.8, spread: 0.10, density: 3.0,
      });
      ctx.restore();
    } else {
      fluff(ctx, 0, 0, r, sp.body, seed, {
        lenK: 0.17, clusters: 18, per: 5, drop: 0.8, spread: 0.13, density: 3.6,
        keepOut: [
          { x: -eyeX, y: eyeY, r: eyeR * 1.5 },
          { x: eyeX, y: eyeY, r: eyeR * 1.5 },
          { x: 0, y: r * 0.2, r: r * 0.3 },
          // 脸盘区域整体留白：否则绒毛会长到脸盘上，把心形/扁盘糊掉
          ...(isOwl ? [{ x: 0, y: -r * 0.12, r: r * (sp.face === 'flat' ? 0.56 : 0.66) }] : []),
        ],
      });
    }

    // 腹部浅色斑（只在身体上）
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.ellipse(0, r * 0.34, r * 0.5, r * 0.36, 0, 0, Math.PI * 2);
    const bg = ctx.createLinearGradient(0, 0, 0, r * 0.7);
    bg.addColorStop(0, shade(sp.belly, 8));
    bg.addColorStop(1, shade(sp.belly, -22));
    ctx.fillStyle = bg;
    ctx.fill();
    fluff(ctx, 0, r * 0.34, r * 0.44, sp.belly, seed + 21, {
      lenK: 0.2, clusters: 11, per: 4, drop: 0.7, spread: 0.1, density: 2.8,
    });
    ctx.restore();

    // 胸口花纹：横斑 / 纵纹 / 麻点。画在腹部 save/restore 之外，否则会变淡。
    if (isOwl && sp.breast) breastPattern(ctx, r, sp.breast, shade(sp.wing, -46));
    if (isOwl && sp.nape) napeSpot(ctx, r);

    /* 头部细节统一在 (headX, 0) 的平移里画 —— 这样眼睛/喙/耳羽都自动
       跟着头球走，不必逐个加偏移（neckL 为 0 时 headX = 0，行为不变）。 */
    ctx.save();
    ctx.translate(headX, 0);

    // 耳羽：成对、尖锐、向上外斜的两束羽条（角鸮型猫头鹰的招牌）
    if (sp.crest) earTufts(ctx, hR, sp.crest, sp.wing, seed + 40, headC);

    // 珠眼：Q 版的灵魂，占脸很大
    const ex = eyeX, ey = eyeY, er = eyeR;
    beadEye(ctx, -ex, ey, er, sp.eyeCol);
    beadEye(ctx, ex, ey, er, sp.eyeCol);

    // 高光呼吸感：偶尔眨一下
    const blink = Math.sin((t / 1000) * 0.9 + seed) > 0.985 ? 0.12 : 1;
    if (blink < 1) {
      ctx.save();
      ctx.strokeStyle = '#241c14';
      ctx.lineWidth = er * 0.7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-ex - er, ey); ctx.lineTo(-ex + er, ey);
      ctx.moveTo(ex - er, ey); ctx.lineTo(ex + er, ey);
      ctx.stroke();
      ctx.restore();
    }

    beak(ctx, 0, headC + hR * 0.2, hR, sp.beak);
    ctx.restore();
  }

  global.Birds = { SPECIES, radiusOf, draw, shade };
})(window);
