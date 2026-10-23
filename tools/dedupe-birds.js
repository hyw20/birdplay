/* 清理 data/birds.json 里的重复物种（同名同科）。
   为什么会有重复：扩增脚本按 name 去重，但它只看「同一个科里有没有」，
   不管别的科。鹦形目拆科时我把粉红凤头鹦鹉同时写进了鹦鹉科和凤头鹦鹉科。
   同类群的重复保留一份；跨类群的同名物种需要人工判断，脚本只报告不删。 */
const fs = require('fs');
const nodePath = require('path');
const file = nodePath.join(__dirname, '..', 'data', 'birds.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

let removed = 0;
const crossDup = [];

for (const g of data.groups) {
  for (const t of g.taxa) {
    const seen = new Set();
    for (let i = t.species.length - 1; i >= 0; i--) {
      const n = t.species[i].name;
      if (seen.has(n)) {
        t.species.splice(i, 1);
        removed++;
        console.log(`移除重复：${g.name} / ${t.name} / ${n}`);
      } else {
        seen.add(n);
      }
    }
  }
}

// 跨类群同名检查（只报告）
const where = {};
for (const g of data.groups) {
  for (const t of g.taxa) {
    for (const s of t.species) {
      (where[s.name] = where[s.name] || []).push(`${g.name}/${t.name}`);
    }
  }
}
for (const [n, locs] of Object.entries(where)) {
  if (locs.length > 1) crossDup.push(`${n}: ${locs.join(' + ')}`);
}

// 空的科直接删掉
for (const g of data.groups) {
  const before = g.taxa.length;
  g.taxa = g.taxa.filter((t) => t.species.length > 0);
  if (g.taxa.length !== before) console.log(`删除空科 ${g.taxa.length + 1} → ${g.taxa.length}`);
}

fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');

// 校验
const re = JSON.parse(fs.readFileSync(file, 'utf8'));
let fams = 0, sps = 0, names = new Set();
for (const g of re.groups) {
  fams += g.taxa.length;
  for (const t of g.taxa) for (const s of t.species) { sps++; names.add(s.name); }
}
console.log(`\n移除重复 ${removed} 处`);
if (crossDup.length) console.log('跨类群同名（未动）：\n  ' + crossDup.join('\n  '));
else console.log('跨类群同名：无');
console.log(`结果：${fams} 科 ${sps} 条记录 / ${names.size} 个唯一物种`);
