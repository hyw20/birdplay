/* 按物种给 data/birds.json 补 neck 字段（脖子长度档位）。
   neck: 1 = 短颈（鸭类）  2 = 长颈（天鹅、雁、鸬鹚）  3 = 极长（鹭、鹤、鹳、鹬）
   无字段 = 无颈（雀类、鸮类、鸡类、鹦鹉），渲染保持圆球现状。 */
const fs = require('fs');
const nodePath = require('path');
const file = nodePath.join(__dirname, '..', 'data', 'birds.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

// 按「科」给默认档位，再按「种」覆盖特例
const FAMILY_NECK = {
  '鸭科': 2,     // 天鹅、雁是长颈；鸭靠下面按种降到 1
  '䴙䴘科': 1,
  '鸬鹚科': 2,
  '鸥科': 1,
  '鹭科': 3,
  '鹤科': 3,
  '鹳科': 3,
  '秧鸡科': 1,
  '鸻科': 1,
  '鹬科': 2,
  '反嘴鹬科': 2,
  '鸵鸟科': 3,
  '企鹅科': 1,
};

// 鸭科里的短颈特例：真正的鸭（不是天鹅/雁）
const SHORT_NECK = new Set(['绿头鸭', '鸳鸯', '翘鼻麻鸭', '赤麻鸭']);

let set = 0;
for (const g of data.groups) {
  for (const t of g.taxa) {
    const def = FAMILY_NECK[t.name];
    if (def == null) continue;
    for (const sp of t.species) {
      if (sp.neck != null) continue;                 // 已有值不覆盖
      sp.neck = SHORT_NECK.has(sp.name) ? 1 : def;
      set++;
    }
  }
}

fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');

// 校验并打印
const re = JSON.parse(fs.readFileSync(file, 'utf8'));
console.log('设置 neck ' + set + ' 处');
for (const g of re.groups) {
  const rows = [];
  for (const t of g.taxa) {
    for (const s of t.species) {
      if (s.neck) rows.push(`${s.name}=${s.neck}`);
    }
  }
  if (rows.length) console.log(g.name + ': ' + rows.join(', '));
}