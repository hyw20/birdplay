/* 主循环：落球引导、渲染、UI 同步。 */
(function () {
  'use strict';

  const cv = document.getElementById('cv');
  const ctx = cv.getContext('2d');
  const nextCv = document.getElementById('nextCv');
  const nextCtx = nextCv.getContext('2d');
  const field = document.getElementById('field');

  const ui = {
    score: document.getElementById('score'),
    best: document.getElementById('best'),
    nextName: document.getElementById('nextName'),
    hint: document.getElementById('hint'),
    over: document.getElementById('over'),
    overTitle: document.getElementById('overTitle'),
    overSub: document.getElementById('overSub'),
  };

  let W = 0, H = 0, dpr = 1;
  const physics = new Physics();
  let birds = [];
  let nextTier = 0;
  const GUIDE_T = 900;     // 引导线淡出 ms
  let guideAt = -1e9;
  const dropX = { v: 0 };  // 当前待落球的 x
  let pressing = false;    // 指针是否处于按下态（决定 move 能不能改落点）

  // 落球闸门：上一颗没停稳就不许再落
  // 阈值要盖住"一帧的重力增量"：G=2200，dt 上限 32ms → 单帧最多攒 70px/s
  const SETTLE_V = 100;    // px/s
  const BLOCK_T = 220;     // 被闸门挡住时的摆动时长 ms
  let blockAt = -1e9;

  function fit() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = field.clientWidth; H = field.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function onResize() {
    fit();
    placeAt(W / 2);        // 尺寸变了，落点重新居中（placeAt 会按新的 ghost.r 夹回场内）
    guideAt = -1e9;
  }

  function rand32() { return (Math.random() * 4294967296) >>> 0; }

  function reset() {
    birds = [];
    nextTier = 0;
    dropX.v = W / 2;           // 居中；W 由 boot 时的 fit() 给出
    ui.over.classList.remove('on');
    ui.score.textContent = '0';
    ui.best.textContent = Birds.SPECIES[0].name;
    ui.hint.classList.remove('hide');
    physics.result = null;
    physics.loseCheck = true;   // 恢复判负（调试钩子 all() 可能把它关了）
    renderChain();
    dropNext(0);
  }

  // 合成链文案跟着 SPECIES 走，换谱系只改 birds.js 一处
  function renderChain() {
    const ol = document.getElementById('chain');
    if (!ol) return;
    ol.textContent = '';
    Birds.SPECIES.forEach((sp) => {
      const li = document.createElement('li');
      li.textContent = sp.name;
      ol.appendChild(li);
    });
  }

  // 夹取范围跟随 ghost.r：球越大越往里收；场地窄到夹不下时就退回中线
  function placeAt(x) {
    const lo = Physics.WALL + ghost.r;
    const hi = W - Physics.WALL - ghost.r;
    dropX.v = hi <= lo ? W / 2 : Math.max(lo, Math.min(hi, x));
  }

  // 幽灵球（待落）用它表示
  const ghost = { x: 0, y: 0, r: Physics.R, tier: 0, seed: 1, rot: 0, pop: 0, vx: 0, vy: 0 };

  // 默认保持当前落点，只按新 r 重新夹一次；居中由 reset()/onResize() 负责
  function dropNext(tier) {
    nextTier = tier;
    ghost.tier = tier;
    ghost.seed = rand32();
    ghost.r = Birds.radiusOf(tier);
    ghost.y = Physics.CEIL + ghost.r;   // r 变了 y 必须跟着重算
    placeAt(dropX.v);
    ghost.pop = 0;
    ui.nextName.textContent = Birds.SPECIES[tier].name;
    drawNext();
  }

  function drawNext() {
    nextCtx.setTransform(2, 0, 0, 2, 1, 1); // 46px 显示，2x 采样
    nextCtx.clearRect(0, 0, 46, 46);
    nextCtx.save();
    nextCtx.translate(23, 25);
    const s = Math.min(1, 17 / ghost.r);
    nextCtx.scale(s, s);
    Birds.draw(nextCtx, ghost, performance.now());
    nextCtx.restore();
  }

  // 场地里的球是否都停稳了。
  // pop 只是融合的弹入缩放动画，不代表还在动，跳过它。
  function allSettled() {
    for (const b of birds) {
      if (b.pop > 0) continue;
      if (Math.abs(b.vx) > SETTLE_V || Math.abs(b.vy) > SETTLE_V) return false;
    }
    return true;
  }

  // 闸门挡住时不静默无反应：给幽灵球一记摆动 + 变淡
  function blocked() {
    blockAt = performance.now();
  }

  function blockedNow(now) { return now - blockAt < BLOCK_T; }

  function tryDrop() {
    if (ui.over.classList.contains('on')) return false;
    if (!allSettled()) { blocked(); return false; }   // 上一颗还没落定
    spawn();
    ui.hint.classList.add('hide');                    // 只有真落下去才收提示
    return true;
  }

  function spawn() {
    // 从场地上方外侧掉入：出生点在视野外，落进来时刚好出现在顶部。
    // 不要在场地内侧出生 —— 那样球会与刚落的球在警戒线附近挤成一团。
    const b = new Bird({
      x: dropX.v, y: -ghost.r,
      vx: 0, vy: 0, tier: nextTier, seed: ghost.seed,
    });
    b.r = ghost.r;
    birds.push(b);
    dropNext(Math.floor(Math.random() * 3)); // 前三级随机，和大西瓜一样有惊喜
  }

  physics.onMerge = function (n, a, b) {
    ui.score.textContent = String(+ui.score.textContent + 1);
    ui.best.textContent = Birds.SPECIES[n.tier].name;
    burst(n.x, n.y, Birds.SPECIES[n.tier].body);
  };

  function tick(now) {
    const dt = Math.min(now - last, 32); last = now;

    if (!ui.over.classList.contains('on')) {
      const w = { left: Physics.WALL, right: W - Physics.WALL, top: Physics.CEIL, bottom: H };
      const res = physics.update(dt, w, birds);
      if (res === 'merge') dropNext(Math.floor(Math.random() * 3));
      if (res === 'lose') gameOver();
    }

    stepConfetti(dt);
    render(now);
    requestAnimationFrame(tick);
  }

  function render(now) {
    ctx.clearRect(0, 0, W, H);

    // 幽灵球（待落）+ 引导线
    if (!ui.over.classList.contains('on')) {
      const settling = !allSettled();   // 场里还有球在飞 → 幽灵球变淡
      const shake = blockedNow(now);    // 刚被闸门挡住 → 来一记 200ms 的摆动
      ghost.x = dropX.v + (shake ? Math.sin(now * 0.06) * 6 : 0);
      ctx.save();
      ctx.globalAlpha = shake ? 0.45 : settling ? 0.6 : 1;
      ctx.translate(ghost.x, ghost.y);
      Birds.draw(ctx, ghost, now);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - (now - guideAt) / GUIDE_T);
      ctx.strokeStyle = 'rgba(190,150,105,.7)';
      ctx.setLineDash([6, 8]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(dropX.v, ghost.y + ghost.r + 6);
      ctx.lineTo(dropX.v, H - 10);
      ctx.stroke();
      ctx.restore();
    }

    // 真实球
    for (const b of birds) {
      ctx.save();
      ctx.translate(b.x, b.y);
      if (b.pop > 0) {
        const k = 1 + Math.sin(b.pop * Math.PI) * 0.35;
        ctx.scale(k, k);
      }
      ctx.rotate(b.rot);
      Birds.draw(ctx, b, now);
      ctx.restore();
    }

    // 纸屑：融合瞬间的小羽毛飞出来
    ctx.save();
    for (const p of confetti) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.a);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.s, p.s * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  // 羽毛纸屑系统
  const confetti = [];
  function burst(x, y, color) {
    for (let i = 0; i < 10; i++) {
      confetti.push({
        x, y,
        vx: (Math.random() - 0.5) * 320, vy: -Math.random() * 260,
        a: Math.random() * 6.28, s: 2 + Math.random() * 3,
        life: 1, color,
      });
    }
  }
  function stepConfetti(dt) {
    for (let i = confetti.length - 1; i >= 0; i--) {
      const p = confetti[i];
      p.life -= dt / 700;
      if (p.life <= 0) { confetti.splice(i, 1); continue; }
      p.vy += 900 * dt / 1000;
      p.x += p.vx * dt / 1000;
      p.y += p.vy * dt / 1000;
      p.a += dt * 0.006;
    }
  }

  function gameOver() {
    ui.over.classList.add('on');
    ui.overTitle.textContent = '树枝撑不住啦';
    ui.overSub.textContent = `最高合成：${ui.best.textContent} · 合成 ${ui.score.textContent} 次`;
    burst(W / 2, 80, '#f2a45f');
  }

  // ---- 输入 ----
  // 落点语义：pointerdown 的位置就是落点；pointermove 只在"没按下"时改预览位置，
  // 否则触摸拖动会在按下期间偷偷把落点挪走。
  function localX(e) {
    return e.clientX - cv.getBoundingClientRect().left;
  }

  field.addEventListener('pointerdown', (e) => {
    if (ui.over.classList.contains('on')) return;
    pressing = true;
    try { field.setPointerCapture(e.pointerId); } catch (_) { /* 老浏览器没有就算了 */ }
    placeAt(localX(e));       // 先落点，再过闸门：被挡住时球也跟着挪到位
    guideAt = performance.now();
    tryDrop();
  });
  field.addEventListener('pointermove', (e) => {
    if (ui.over.classList.contains('on') || pressing) return;
    placeAt(localX(e));
    guideAt = performance.now();
  });
  const release = () => { pressing = false; };
  field.addEventListener('pointerup', release);
  field.addEventListener('pointercancel', release);
  field.addEventListener('lostpointercapture', release);
  window.addEventListener('blur', release);

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (e.repeat) return;               // 长按不放不该连发
      tryDrop();                          // 和点击走同一个闸门
      return;
    }
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
      e.preventDefault();
      const step = Math.max(6, ghost.r * 0.6);   // 步进跟着球的大小走
      placeAt(dropX.v + (e.code === 'ArrowLeft' ? -step : step));
      guideAt = performance.now();
      return;
    }
    if (e.code === 'KeyR') reset();
  });

  document.getElementById('reset').addEventListener('click', reset);
  document.getElementById('again').addEventListener('click', reset);

  // 调试钩子：控制台铺一排鸟看完整个谱系，不影响正常玩法
  window.__birds = {
    all(tiers) {
      birds = [];
      const list = tiers || Birds.SPECIES.map((_, i) => i);
      const gap = (W - Physics.WALL * 2) / (list.length + 1);
      list.forEach((t, i) => {
        const b = new Bird({ x: Physics.WALL + gap * (i + 1), y: Physics.CEIL + Birds.radiusOf(t) + (t >= 6 ? 60 : 0), tier: t, seed: 1000 + t * 37 });
        b.r = Birds.radiusOf(t);
        birds.push(b);
      });
      // 整条谱系铺在顶部，大球顶部必然越线 → 关掉判负，否则立刻假结算
      physics.loseCheck = false;
      return list.length;
    },
    loseCheck: (on) => { physics.loseCheck = on !== false; return physics.loseCheck; },
    // 纯读取，不带副作用（上面那个会把开关打开）
    isLoseCheckOn: () => physics.loseCheck,
    count: () => birds.length,
    // 调试用：看每只球的实际位置与落地状态
    dump: () => birds.map((b) => ({
      tier: b.tier, x: Math.round(b.x), y: Math.round(b.y), r: Math.round(b.r),
      vx: Math.round(b.vx), vy: Math.round(b.vy), landed: b.landed,
      top: Math.round(b.y - b.r),
    })),
    world: () => ({ W: Math.round(W), H: Math.round(H), loseLine: physics.loseLine, settleV: physics.settleV }),
    // 调试用：手动步进物理，不受 rAF 节流影响
    step: (n, dt) => {
      const w = { left: Physics.WALL, right: W - Physics.WALL, top: Physics.CEIL, bottom: H };
      let res = null;
      for (let i = 0; i < (n || 1); i++) {
        const r = physics.update(dt || 16, w, birds);
        if (r) res = r;
      }
      return res;
    },
    spawnAt: (x, tier) => {
      const t = tier == null ? Math.floor(Math.random() * 3) : tier;
      const b = new Bird({ x, y: -Birds.radiusOf(t), vx: 0, vy: 0, tier: t, seed: (Math.random() * 1e9) >>> 0 });
      b.r = Birds.radiusOf(t);
      birds.push(b);
      return t;
    },
  };

  let last = performance.now();
  window.addEventListener('resize', onResize);
  fit();
  reset();
  requestAnimationFrame(tick);
})();
