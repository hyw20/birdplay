/* 合成大西瓜式物理：等质量圆球刚体 + 融合判定，别的都是奢侈。 */
(function (global) {
  'use strict';

  // 基准半径跟渲染层走（birds.js 的 BASE_R），别两处各写一份
  const R = Birds.radiusOf(0);
  const WALL = 14;
  const CEIL = 14;

  function Bird(body) {
    this.x = body.x; this.y = body.y;
    this.vx = body.vx || 0; this.vy = body.vy || 0;
    this.r = R; this.tier = body.tier; this.seed = body.seed >>> 0;
    this.rot = body.rot || 0;
    this.pop = 0;          // 融合弹入动画
    this.landed = false;   // 是否已经接触过东西（地板/墙/别的球）
  }

  function Physics() {
    this.G = 2200;
    this.restitution = 0.12; // 软毛球不该弹
    this.friction = 0.5;
    this.settleV = 100;    // 低于这个速度算「落定了」
    // 判负线 = 堆到这个高度就输。原值 CEIL + R*0.6 ≈ 25，离顶太近，
    // 球在出生点附近被别的球一挤就越过它，于是刚开局就判负。
    // 堆到接近顶部才算输：给足 4.5 个基准半径的高度。
    this.loseLine = CEIL + R * 4.5;
    // 调试开关：用 window.__birds.all() 把整条谱系铺在顶部时，
    // 大球顶部必然越过判负线，会立刻假判负。关掉它只为调试，正常玩法保持 true。
    this.loseCheck = true;
  }

  // 返回 'merge' | 'lose' | null
  Physics.prototype.update = function (dt, world, birds) {
    const step = Math.min(dt, 32) / 1000;
    const G = this.G, E = this.restitution, F = this.friction;

    // 1) 统一积分：先让所有球各自走一步
    for (const b of birds) {
      b.pop = Math.max(0, b.pop - step * 4);
      b.vy += G * step;
      b.vy = Math.min(b.vy, 1400);
      b.x += b.vx * step;
      b.y += b.vy * step;
      // 左右墙 + 地板。顶部敞开（球从上方落入），不设天花板
      if (b.x - b.r < world.left) { b.x = world.left + b.r; if (b.vx < 0) b.vx = -b.vx * E; }
      if (b.x + b.r > world.right) { b.x = world.right - b.r; if (b.vx > 0) b.vx = -b.vx * E; }
      if (b.y + b.r > world.bottom) {
        b.y = world.bottom - b.r;
        if (b.vy > 0) b.vy = -b.vy * E;
        b.vx *= 0.86;
        b.landed = true;
      }
    }

    // 2) 融合判定必须在位置修正**之前**做。
    //    位置修正的作用是把重叠推到刚好不重叠（d == r1+r2），
    //    如果先修正再判定，球就永远差一点点而合不上 —— 这正是
    //    「地面上横着挨着很近却不合成」的原因。
    //    容差取正：静止后 d 稳定在 r1+r2 附近，接触带一点余量即合。
    for (let i = 0; i < birds.length; i++) {
      const a = birds[i];
      if (a.pop > 0) continue;              // 刚融合出的球先别急着再合
      for (let j = i + 1; j < birds.length; j++) {
        const b = birds[j];
        if (b.pop > 0) continue;
        if (a.tier !== b.tier) continue;
        const d = Math.hypot(b.x - a.x, b.y - a.y);
        if (d < a.r + b.r + 1.5) { this.merge(a, b, birds); return 'merge'; }
      }
    }

    // 3) 位置修正：把重叠一次推满（不是一半），多迭代让堆叠收敛。
    //    推力不足时 n 个球会一直挤在同一像素点，既堆不成塔也永不融合。
    for (let it = 0; it < 12; it++) {
      let moved = false;
          for (let i = 0; i < birds.length; i++) {
        const b = birds[i];
        for (let j = i + 1; j < birds.length; j++) {
          const o = birds[j];
          const dx = o.x - b.x, dy = o.y - b.y;
          const d = Math.hypot(dx, dy);
          const min = b.r + o.r;
          if (d >= min) continue;
          moved = true;
          // 完全重合：给确定性分离方向（优先向上，底部已满）
          let nx, ny;
          if (d < 1e-6) { nx = 0; ny = -1; }
          else { nx = dx / d; ny = dy / d; }
          // 限制单次位移，避免球多时一帧把球弹出场地
          const pen = Math.min((min - d) * 0.5, 4);
          b.x -= nx * pen; b.y -= ny * pen;
          o.x += nx * pen; o.y += ny * pen;
          b.landed = o.landed = true;
        }
      }
      if (!moved) break;
    }

    // 修正后把地板钳回去，否则会有人被推到地板下面
    for (const b of birds) {
      if (b.y + b.r > world.bottom) { b.y = world.bottom - b.r; b.landed = true; }
      if (b.x - b.r < world.left) b.x = world.left + b.r;
      if (b.x + b.r > world.right) b.x = world.right - b.r;
    }

    // 3) 冲量：解完位置再改速度，避免同一帧里边推边加速
    for (let i = 0; i < birds.length; i++) {
      const b = birds[i];
      for (let j = i + 1; j < birds.length; j++) {
        const o = birds[j];
        const dx = o.x - b.x, dy = o.y - b.y;
        const d = Math.hypot(dx, dy);
        const min = b.r + o.r;
        if (d >= min || d < 1e-6) continue;
        const nx = dx / d, ny = dy / d;
        const vn = (o.vx - b.vx) * nx + (o.vy - b.vy) * ny;
        if (vn >= 0) continue; // 正在分离，不处理
        // 等质量正碰：各承担一半法向冲量
        const imp = -(1 + E) * vn * 0.5;
        b.vx -= nx * imp; b.vy -= ny * imp;
        o.vx += nx * imp; o.vy += ny * imp;
        // 切向摩擦
        const tx = -ny, ty = nx;
        const vt = (o.vx - b.vx) * tx + (o.vy - b.vy) * ty;
        b.vx += tx * vt * F * 0.5; b.vy += ty * vt * F * 0.5;
        o.vx -= tx * vt * F * 0.5; o.vy -= ty * vt * F * 0.5;
        b.rot += vt * 0.0008;
      }
    }

    // 4) 判负：球必须「落定」且球顶高过警戒线。未落定的球不参与。
    if (this.loseCheck) {
      for (const b of birds) {
        if (b.landed && Math.abs(b.vy) < this.settleV && Math.abs(b.vx) < this.settleV
            && b.y - b.r <= this.loseLine) return 'lose';
      }
    }

    return null;
  };

  Physics.prototype.merge = function (a, b, birds) {
    const ia = birds.indexOf(a), ib = birds.indexOf(b);
    if (ia < 0 || ib < 0) return null;   // 已经合过了，别重复
    const tier = Math.min(Birds.SPECIES.length - 1, a.tier + 1);
    const n = new Bird({
      x: (a.x + b.x) / 2, y: (a.y + b.y) / 2,
      vx: (a.vx + b.vx) * 0.3, vy: (a.vy + b.vy) * 0.3,
      tier, seed: (a.seed * 31 + b.seed + 7) >>> 0,
    });
    n.r = Birds.radiusOf(tier);
    n.pop = 1;
    n.landed = false;
    // 先删旧的再加新的。之前漏了 splice，每次融合球数净增 1，
    // 几秒内就炸到上百个球把场地挤爆。
    birds.splice(ib, 1);
    birds.splice(ia, 1);
    birds.push(n);
    if (this.onMerge) this.onMerge(n, a, b);
    return n;
  };

  Physics.R = R;
  Physics.WALL = WALL;
  Physics.CEIL = CEIL;
  global.Physics = Physics;
  global.Bird = Bird;
  global.World = function (el) {
    return {
      left: WALL, right: el.clientWidth - WALL, top: CEIL,
      w: el.clientWidth, h: el.clientHeight,
    };
  };
})(window);
