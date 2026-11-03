/* 给凤头鹦鹉科补冠羽字段。
   背景：crest 在 birds.js 里是**鸮类耳羽**的语义（成对、两侧、外斜），
   凤头鹦鹉的冠羽是头顶正中单束、能竖起来，用 crest 会画成侧边小呆毛。
   所以另开 crown 字段：值 = 冠羽高度（相对头半径），可带 crownStyle / crownCol。

   crownStyle: 'fan' 宽扇形（葵花、粉红）| 'wisp' 细长弯钩（玄凤呆毛）
   crownCol  : 冠羽颜色，省略则用 wing 色
*/
const fs = require('fs');
const nodePath = require('path');
const file = nodePath.join(__dirname, '..', 'data', 'birds.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

// 值按真实冠羽比例：葵花最大、玄凤细长、粉红中等
const CROWN = {
  '粉红凤头鹦鹉': { crown: 0.72, crownStyle: 'fan',  crownCol: '#f2b8c4' },
  '葵花凤头鹦鹉': { crown: 1.05, crownStyle: 'fan',  crownCol: '#f5d94a' },
  '玄凤鹦鹉':     { crown: 1.25, crownStyle: 'wisp', crownCol: '#c8c0ae' },
};

let set = 0, cleared = 0;
for (const g of data.groups) {
  for (const t of g.taxa) {
    for (const s of t.species) {
      const c = CROWN[s.name];
      if (!c) continue;
      Object.assign(s, c);
      // crest 是鸮类耳羽专用，凤头鹦鹉不该有
      const hadCrest = !!s.crest;
      if (hadCrest) { delete s.crest; cleared++; }
      set++;
      console.log(`${s.name}: crown=${c.crown} style=${c.crownStyle}` + (hadCrest ? '  (清除误用 crest)' : ''));
    }
  }
}

fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');

// 校验
const re = JSON.parse(fs.readFileSync(file, 'utf8'));
const bad = [];
for (const g of re.groups) for (const t of g.taxa) for (const s of t.species) {
  if (CROWN[s.name] && !s.crown) bad.push(s.name + ' 缺 crown');
  if (CROWN[s.name] && s.crest) bad.push(s.name + ' 仍有 crest');
}
console.log(`\n设置 crown ${set} 处，清除误用 crest ${cleared} 处`);
console.log('校验:', bad.length ? bad.join(' | ') : '通过');
