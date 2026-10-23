/* 给 data/birds.json 里的鸮类补齐形态字段（face / eyeCol / breast）。
   为什么单独一个脚本：这些字段是从 birds.js 的 SPECIES 抄过来的，
   导图要渲染出和游戏一致的猫头鹰，两边数据必须对齐。
   幂等 —— 重复执行不会重复写。 */
const fs = require('fs');
const nodePath = require('path');
const file = nodePath.join(__dirname, '..', 'data', 'birds.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

// 形态档案：name → { face, eyeCol, breast }
// 与 birds.js 的 SPECIES 保持一致
const MORPH = {
  '雕鸮':       { face: 'flat',  eyeCol: '#e8a83a', breast: 'streak',  brow: 1 },
  '雪鸮':       { face: 'disc',  eyeCol: '#f0d84a', breast: 'barred' },
  '纵纹腹小鸮': { face: 'disc',  eyeCol: '#f0a828', breast: 'barred',  nape: 1 },
  '红角鸮':     { face: 'disc',  eyeCol: '#e8a83a', breast: 'streak' },
  '领角鸮':     { face: 'disc',  eyeCol: '#e8a83a', breast: 'mottled' },
  '灰林鸮':     { face: 'disc',  eyeCol: '#2b2b30', breast: 'barred' },
  '长耳鸮':     { face: 'flat',  eyeCol: '#b06a30', breast: 'mottled' },
  '仓鸮':       { face: 'heart', eyeCol: '#2b2b30', breast: 'mottled', brow: 1 },
  '褐林鸮':     { face: 'flat',  eyeCol: '#4a3a2a', breast: 'mottled' },
};

let patched = 0, missing = [];
for (const g of data.groups) {
  for (const t of g.taxa) {
    for (const sp of t.species) {
      const m = MORPH[sp.name];
      if (!m) continue;
      // 只补缺失的字段，已有的不覆盖
      for (const k of Object.keys(m)) {
        if (sp[k] == null) { sp[k] = m[k]; patched++; }
      }
    }
  }
}

// 反向检查：档案里的物种是否都存在于数据中
for (const name of Object.keys(MORPH)) {
  const found = data.groups.some((g) => g.taxa.some((t) => t.species.some((s) => s.name === name)));
  if (!found) missing.push(name);
}

fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
console.log('补字段 ' + patched + ' 处');
if (missing.length) console.log('档案里有但数据中找不到：' + missing.join(', '));

// 校验：打印所有有形态字段的物种
const owls = [];
for (const g of data.groups) {
  for (const t of g.taxa) {
    for (const s of t.species) {
      if (s.face || s.eyeCol || s.breast) owls.push(`${s.name} face=${s.face} eye=${s.eyeCol} breast=${s.breast}`);
    }
  }
}
console.log('--- 带形态字段的物种 ' + owls.length + ' ---');
owls.forEach((o) => console.log('  ' + o));