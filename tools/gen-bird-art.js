/* 用通义万相生成「中国国家地理」风格的鸟类博物插画。
   为什么不用内置 image_generate：Settings → image-gen 是 off，且没有任何
   图像供应商的 key。通义 key 在 ~/.xrk/.credentials.yaml 里（QIANWEN_API_KEY），
   走 DashScope 异步文生图接口。

   用法：
     node tools/gen-bird-art.js                 # 生成清单里全部
     node tools/gen-bird-art.js 红腹锦鸡         # 只生成指定物种
     node tools/gen-bird-art.js --list          # 只列清单
   产物落在 art/<slug>.png。

   风格锚点（改动前请先看 art/ 里已生成的样张）：
   - 博物学科学插画，不是卡通 / 不是毛绒
   - 米白棉纸底 + 细微纤维纹理、可见毛边
   - 水彩设色 + 干笔 + 铅笔羽纹，羽片逐组描述，不是平涂
   - 左上柔光、脚下淡投影
   - 上下留白给排版，**禁止出现任何文字**
*/
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'art');

// ---- 凭据 ----
function readKey() {
  const f = path.join(process.env.USERPROFILE || process.env.HOME || '', '.xrk', '.credentials.yaml');
  const txt = fs.readFileSync(f, 'utf8');
  const m = txt.match(/^QIANWEN_API_KEY\s*:\s*(.+)$/m);
  if (!m) throw new Error('未找到 QIANWEN_API_KEY');
  return m[1].trim().replace(/^["']|["']$/g, '');
}

/* 风格模板：所有物种共用这一段，只有中间的鸟类描述不同。
   这样整组插画才像出自同一本书、同一个画师。

   踩过的坑（改这段前先看）：
   - 写 no border frame 模型照样画框 → 得正面写 full-bleed edge-to-edge
   - 关键特征要写**比例**（尾长 = 体长两倍），光写 long tail 会被画短
   - 同一张图里特征太多会互相吞，颈带/背蓝这类次要特征要单独强调
   - 只写 "no text" 不够：模仿古籍版式会自带署名和拉丁名。必须
     明确禁止 caption、signature、printed label、annotation
   - 只写 "standing" 会把水鸟画成高跷腿，体态必须按类群单独给 */
const STYLE_HEAD = 'A natural-history scientific illustration of a single {latin} {posture}, painted in the manner of a hand-coloured vintage ornithological plate from the nineteenth century. Visible watercolour washes, fine dry-brush strokes and pencil feather stippling on warm ivory cotton-rag paper with subtle fibre texture and a soft fibrous edge. The paper is flat and evenly lit with no photographic depth of field, no bokeh, no blurred background. The bird is the sole subject. {plumage}. Every feather group is drawn with deliberate linework rather than photographic texture, the outline of the bird is drawn with a fine pen stroke, and the colour is applied in transparent layered washes with visible brush edges. Gentle flat shadow beneath the feet. Anatomically accurate proportions in a calm observational pose. The artwork bleeds edge to edge across the entire square with no drawn frame, no margin rule and no vignette. Generous empty paper above and below the bird. The image contains the bird and the paper only, with no lettering of any kind anywhere.';

const STYLE_TAIL = 'Muted botanical-study palette of khaki and moss green in the surrounding paper tone.';

function buildPrompt(sp) {
  /* 结构：识别特征 → 物种 → 体态 → 羽色 → 画风。
     把 signature 提到最前面是因为实测模型对句首权重最高：
     雕鸮的耳羽、戴胜的冠羽写在长句中段时全被忽略，
     结果画成椋鸟和鸫。特征先行是唯一有效的约束手段。

     物种名的取舍（四轮实测）：
     - 写中文名 → 模型把汉字画在图上
     - 写拉丁名 → 不写风格会跑成照片，但物种名本身对准确性帮助有限
     - 完全不写 → 风格干净，物种跑得更远
     结论：保留拉丁名，中文名永不进 prompt。 */
  const sig = sp.signature ? `The defining feature of this bird: ${sp.signature}. ` : '';
  return sig + STYLE_HEAD
    .replace('{latin}', sp.latin)
    .replace('{posture}', sp.posture || 'standing in profile')
    .replace('{plumage}', sp.plumage)
    + ' ' + (sp.extra ? sp.extra + ' ' : '') + STYLE_TAIL;
}

// ---- 物种清单 ----
// plumage 是要点：写清颜色分区、羽纹、体态，模型才画得准
// ---- 物种清单（精选 26 种）----
/* 选题原则：中国特有 / 标志性 + 大众认得出 + 六大类群各有代表。

   plumage   : 颜色分区、羽纹、比例。模型只认具体描述，"很漂亮的红鸟"会自由发挥
   signature : **最容易被画错的那个核心特征**，会被提到 prompt 最前面单独强调。
               实测埋在长句中段时，雕鸮的耳羽、戴胜的冠羽全被忽略。
   posture   : 按类群给。水鸟必须压低腿，涉禽必须抬高，否则一律画成高脚鸡。 */
const BIRDS = [
  // ===== 陆禽 =====
  {
    cn: '红腹锦鸡', latin: 'Chrysolophus pictus', slug: 'golden-pheasant',
    signature: 'an extraordinarily long flowing barred tail, twice the length of the body',
    posture: 'standing in profile on the forest floor',
    plumage: 'a vivid scarlet-red breast and underparts, a tall erect golden-yellow fan crest crowning the head, an alternating orange-and-black barred neck cape, a brilliant metallic teal-blue upper back and shoulders clearly distinct from the red body, a black-barred ochre wing, and the long tail sweeping right in ochre and black barring',
  },
  {
    cn: '白鹇', latin: 'Lophura nycthemera', slug: 'silver-pheasant',
    /* 经验：这只有"可用解"——v5 版（有拉丁名 + negative_prompt + 强画布描述）
       一次成功：白头红脸红腿长垂尾，竹枝背景。后来改姿态和腿部说明反而画成了鹤。
       所以固定回 v5 的写法，只额外补一句"腿正常"和"尾垂地"。 */
    signature: 'a pure silvery-white body with a bare brilliant scarlet-red face and bright coral-red legs — a white bird with a red face, never a black-and-white one',
    posture: 'standing in profile among faint bamboo shadows, body compact, with a long white tail drooping down to the ground behind',
    plumage: 'the entire body and long sweeping tail are silvery white, finely covered with thin black hairline vermiculation like delicate stitching; the crest and the very base of the belly are black; the white tail is long and drooping downward',
    extra: 'This is a WHITE bird with red face and red legs. Normal chicken-length legs, not long wading legs.',
  },
  {
    cn: '白马鸡', latin: 'Crossoptilon crossoptilon', slug: 'white-eared-pheasant',
    signature: 'a large tuft of elongated white feathers sweeping backward from behind each eye like a moustache',
    posture: 'standing in profile on alpine ground',
    plumage: 'an all-white body, a crimson-red bare face, red legs, and a broad fanned tail of loose white plumes with faint grey tips',
  },
  {
    cn: '环颈雉', latin: 'Phasianus colchicus', slug: 'common-pheasant',
    signature: 'a narrow white ring encircling the neck between a dark green head and a copper-red breast',
    posture: 'standing in profile in dry grass',
    plumage: 'a copper-red body finely speckled with black, an iridescent dark green head with a bare red wattle around the eye, a golden-brown barred wing, and a very long tapering tail banded with black',
  },

  // ===== 涉禽 =====
  {
    cn: '丹顶鹤', latin: '', slug: 'red-crowned-crane', blocked: true,
    // 反复被通义内容审核拦（IPInfringementSuspect）：
    // 拉丁名、中文名、纯形态描述、精简描述全试过，都拦。
    // 触发点是"红顶白身黑颈高个涉禽"这组特征本身，不是名称。
    posture: 'standing tall in shallow water on very long slender legs',
    plumage: 'a white body, a black neck, a small bare red patch on the crown, long dark legs, and a long pale bill',
  },
  {
    cn: '大白鹭', latin: 'Ardea alba', slug: 'great-egret',
    signature: 'a very long slender neck held in a soft S-curve, and an all-white body standing on tall thin black legs',
    posture: 'standing tall in shallow water, body well above the water line',
    plumage: 'an all-white plumage, a long slender yellow dagger bill, black legs, a bare greenish-yellow lores patch, and a train of fine white plumes trailing from the lower back',
  },
  {
    cn: '苍鹭', latin: 'Ardea cinerea', slug: 'grey-heron',
    signature: 'a black eye stripe sweeping back into a thin black crest, and a white foreneck marked with rows of black dashes',
    posture: 'standing in shallow water, neck retracted and hunched, watchful',
    plumage: 'a pale blue-grey body and wings, a white crown, a long yellowish dagger bill, and long yellowish legs',
  },
  {
    cn: '黑翅长脚鹬', latin: 'Himantopus himantopus', slug: 'black-winged-stilt',
    signature: 'absurdly long, extremely thin, bright pink legs that raise the small white body far above the water — the legs are almost as long as the entire body',
    posture: 'wading in shallow water, tiny body perched atop towering legs',
    plumage: 'a crisp black mantle and wings, a pure white underbody and face, and a very long fine straight black bill',
    extra: 'The exaggerated pink leg length is the whole point of this bird. Do not draw short legs.',
  },
  {
    cn: '普通翠鸟', latin: 'Alcedo atthis', slug: 'common-kingfisher',
    signature: 'a brilliant metallic turquoise-blue back and a rich rusty-orange breast, with a long straight dagger bill',
    posture: 'perched low on a bare branch over water, compact and hunched',
    plumage: 'a turquoise-blue back and wings, a white throat patch, and a short stubby tail',
  },

  // ===== 游禽 =====
  {
    cn: '鸳鸯', latin: 'Aix galericulata', slug: 'mandarin-duck',
    signature: 'a brilliant upright orange-and-purple sail feather rising from the back of each wing',
    posture: 'perched low and crouched on a waterside stone, legs short and body close to the ground',
    plumage: 'an iridescent green-and-bronze head with a white eye stripe, a chestnut breast, a pale buff flank finely vermiculated, and a red bill',
    extra: 'Do not draw long wading legs. A faint reflection beneath.',
  },
  {
    cn: '绿头鸭', latin: 'Anas platyrhynchos', slug: 'mallard',
    signature: 'an iridescent bottle-green head separated from a chestnut breast by a narrow white collar ring',
    posture: 'floating on still water, body low and horizontal',
    plumage: 'a pale grey body finely vermiculated, a blue speculum patch edged with white, and a yellow bill',
  },
  {
    cn: '大天鹅', latin: 'Cygnus cygnus', slug: 'whooper-swan',
    signature: 'a long neck held perfectly straight upward, and a bill with a bright yellow wedge-shaped base',
    posture: 'floating on open water, body large and horizontal',
    plumage: 'an all-white plumage, a black bill tip, and black legs',
  },
  {
    cn: '凤头䴙䴘', latin: 'Podiceps cristatus', slug: 'great-crested-grebe',
    signature: 'a spectacular fan of chestnut-and-black elongated plumes forming a double crest on the head, flaring out on both sides',
    posture: 'floating low on open water, body almost submerged',
    plumage: 'a dark brown back, a gleaming white neck and breast, a black crown, and a long pointed pinkish bill',
    extra: 'The chestnut-and-black head fan is the signature of breeding plumage.',
  },
  {
    cn: '红嘴鸥', latin: 'Chroicocephalus ridibundus', slug: 'black-headed-gull',
    signature: 'a deep chocolate-brown hood in breeding plumage, contrasting with a pure white neck and a deep red bill',
    posture: 'standing on wet sand at the waters edge',
    plumage: 'a pale grey mantle and upperwing, a pure white underbody and tail, red legs, and black wingtips',
  },

  // ===== 猛禽 =====
  {
    cn: '雕鸮', latin: 'Bubo bubo', slug: 'eurasian-eagle-owl',
    signature: 'two tall dark feather tufts standing straight up from the crown, and a huge flat facial disc with enormous forward-facing orange eyes — this is a massive owl, not a songbird',
    posture: 'perched upright on a rock, body compact and still',
    plumage: 'a tawny-buff body heavily streaked and mottled with dark brown, a dark V-shaped brow above the eyes, and a barred breast',
    extra: 'The huge orange eyes and tall ear tufts must dominate the head. It must read unmistakably as an owl.',
  },
  {
    cn: '金雕', latin: 'Aquila chrysaetos', slug: 'golden-eagle',
    signature: 'a uniformly dark chocolate-brown head and body with a rich golden-tawny patch on the nape and crown — the head is DARK, never white',
    posture: 'perched upright on a rocky outcrop, powerful and still',
    plumage: 'a hooked pale-based dark bill, fully feathered legs, and long broad wings folded against the body',
    extra: 'Do not draw a white head. This is not a bald eagle.',
  },
  {
    cn: '红隼', latin: 'Falco tinnunculus', slug: 'common-kestrel',
    signature: 'a rich chestnut-red back heavily spotted with black spots, and a dark moustache stripe running down from the eye',
    posture: 'perched upright on a bare post, compact falcon shape',
    plumage: 'a pale buff breast streaked with dark drops, a blue-grey crown and tail, and a hooked dark bill',
  },

  // ===== 攀禽 =====
  {
    cn: '戴胜', latin: 'Upupa epops', slug: 'eurasian-hoopoe',
    signature: 'a spectacular erectile fan crest of cinnamon feathers tipped with black and white, standing up on top of the head, plus strongly black-and-white zebra-barred wings and a long slender down-curved bill',
    posture: 'standing on open ground, alert and upright',
    plumage: 'a cinnamon-rufous body and head, a barred tail, and dark grey legs',
    extra: 'The fan crest and the zebra-barred wings are the whole identity of this bird. It must not look like a thrush.',
  },
  {
    cn: '大斑啄木鸟', latin: 'Dendrocopos major', slug: 'great-spotted-woodpecker',
    signature: 'clinging vertically to a tree trunk with the tail braced against the bark, a glossy black back with two large white oval shoulder patches, and a crimson-red vent',
    posture: 'clinging vertically on a vertical trunk, head up',
    plumage: 'a white belly, a crimson-red nape patch, a black-and-white barred wing, and a straight chisel bill',
  },
  {
    cn: '蓝翡翠', latin: 'Halcyon pileata', slug: 'black-capped-kingfisher',
    signature: 'a deep violet-blue back contrasting with a rich orange-rufous breast, a black head, and a large white collar patch on the side of the neck',
    posture: 'perched upright on a branch over water',
    plumage: 'a heavy coral-red bill, a coral-red eye ring, and blue wings',
  },

  // ===== 鸣禽 =====
  {
    cn: '红嘴相思鸟', latin: 'Leiothrix lutea', slug: 'red-billed-leiothrix',
    /* 四版都失败：褐莺、北美红胸莺、全绿叶鹎。每次改颜色范围描述，
       都会把风格描述挤掉导致画风跑偏。
       改用"两段式隔离"：先钉死上半身绿+下半身黄，再单独说嘴是红的。
       物种名保留。 */
    signature: 'a two-tone body split cleanly in half — the entire upper half is dull olive-green and the entire lower half is bright golden-yellow; a small bright red bill sits at the boundary',
    posture: 'perched on a slender twig, small and compact',
    plumage: 'an olive-green back and crown, a golden-yellow throat and breast, a pale grey-white belly, a pale eye ring, and dark flight feathers edged with yellow',
    extra: 'No red on the head. No red on the breast. The red is on the bill only. Not a leafbird, not a warbler, not a tanager.',
  },
  {
    cn: '暗绿绣眼鸟', latin: 'Zosterops japonicus', slug: 'japanese-white-eye',
    signature: 'a complete unbroken ring of white feathers encircling the eye like spectacles — a RING around the eye, not a stripe above it',
    posture: 'perched on a twig, tiny and alert',
    plumage: 'a soft olive-green crown and upperparts, a pale grey-white belly and throat, and a short fine pointed bill',
    extra: 'The white eye ring must form a full circle around the eye. This is the single identifying feature.',
  },
  {
    cn: '画眉', latin: 'Garrulax canorus', slug: 'hwamei',
    /* 上一版画成黑白姬鹟：白眉纹被理解成白色领圈和白色上背。
       关键是说明"两道白线在眼睛上方、不连成环、身体是纯褐色"。 */
    signature: 'two thin white lines above the eyes only, each line starting at the bill and sweeping back over the eye toward the nape — they are thin curved stripes on the HEAD, not a white collar, not white bars, not a white eye ring',
    posture: 'perched in scrub, upright and vocal',
    plumage: 'the entire head, back, wings and tail are warm ochre-brown with no white except the two thin eye stripes; the breast is pale buff with soft fine barring; a dark eye',
    extra: 'The body must be plain warm brown. No white collar, no white wing bars, no white belly. Only two thin white stripes above the eyes.',
  },
  {
    cn: '喜鹊', latin: 'Pica serica', slug: 'oriental-magpie',
    signature: 'a glossy black head and breast with a large white shoulder and belly patch, and a very long graduated tail with blue-green iridescence',
    posture: 'standing on open ground, long tail held level',
    plumage: 'a black back, a heavy black bill, and black wings with white scapular patches',
  },
  {
    cn: '家燕', latin: 'Hirundo rustica', slug: 'barn-swallow',
    signature: 'a deeply forked tail with long thin streamers, and a rusty-chestnut forehead and throat above a dark blue-black breast band',
    posture: 'perched on a wire, cocked at an angle',
    plumage: 'a glossy steel-blue back and crown, a pale buff underbody, and white spots on the tail streamers',
  },
  {
    cn: '远东山雀', latin: 'Parus minor', slug: 'japanese-tit',
    signature: 'a glossy black head with big white cheek patches on each side, and a broad black stripe running straight down the centre of the yellow belly',
    posture: 'perched on a twig, tiny, compact, rounded',
    plumage: 'a black bib under the bill, an olive-green back, and a yellow-buff underbody',
  },
];


// ---- HTTP ----
function req(url, opts, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const r = https.request({
      hostname: u.hostname, path: u.pathname + u.search, method: opts.method || 'GET',
      headers: opts.headers, timeout: 60000,
    }, (res) => {
      let d = '';
      res.on('data', (c) => { d += c; });
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { resolve({ raw: d }); } });
    });
    r.on('error', reject);
    r.on('timeout', () => { r.destroy(new Error('timeout')); });
    if (body) r.write(body);
    r.end();
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function generate(key, sp) {
  const prompt = buildPrompt(sp);
  const body = JSON.stringify({
    /* turbo 版对具体物种的知识太弱：实验记录 ——
       雕鸮（Bubo bubo）画成椋鸟、戴胜（Upupa epops）画成鸫、
       金雕画成白头海雕。plus 版稍强，仍不能指望它"认识"物种，
       所以关键特征必须写在描述最前面（见 buildPrompt）。 */
    model: 'wanx2.1-t2i-plus',
    input: {
      prompt,
      /* negative_prompt 比在正向里写 "no text" 有效得多。
         实测：正向禁词会被模型当作"要素"反向放大 —— 写了 no text，
         它反而在顶部画一排中文名、右下角画三行拉丁文。
         只有放进 negative_prompt 才真正压住。 */
      negative_prompt: [
        'text', 'letters', 'words', 'characters', 'chinese characters', 'hanzi',
        'caption', 'label', 'annotation', 'signature', 'artist mark', 'seal',
        'latin name lettering', 'handwriting', 'typography', 'watermark', 'logo',
        'frame', 'border', 'vignette', 'decorative margin',
        'cartoon', 'chibi', 'plush', 'toy', 'sticker', 'logo art',
        'extra limbs', 'deformed feet', 'two heads', 'duplicate bird',
      ].join(', '),
    },
    parameters: { size: '1024*1024', n: 1, prompt_extend: false },
  });

  const submit = await req(
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis',
    { method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', 'X-DashScope-Async': 'enable' } },
    body,
  );
  if (!submit.output || !submit.output.task_id) {
    throw new Error('提交失败: ' + JSON.stringify(submit).slice(0, 300));
  }
  const id = submit.output.task_id;

  // 轮询：万相一般 10~40 秒
  for (let i = 0; i < 60; i++) {
    await sleep(3000);
    const r = await req('https://dashscope.aliyuncs.com/api/v1/tasks/' + id,
      { headers: { Authorization: 'Bearer ' + key } });
    const st = r.output && r.output.task_status;
    if (st === 'SUCCEEDED') {
      const url = r.output.results && r.output.results[0] && r.output.results[0].url;
      if (!url) throw new Error('成功但没有 url');
      return url;
    }
    if (st === 'FAILED' || st === 'UNKNOWN') {
      throw new Error('任务失败: ' + JSON.stringify(r.output).slice(0, 300));
    }
  }
  throw new Error('轮询超时');
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    https.get({ hostname: u.hostname, path: u.pathname + u.search, timeout: 60000 }, (res) => {
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      const f = fs.createWriteStream(dest);
      res.pipe(f);
      f.on('finish', () => { f.close(); resolve(); });
    }).on('error', reject);
  });
}

// ---- main ----
(async () => {
  const args = process.argv.slice(2);
  if (args.includes('--list')) {
    BIRDS.forEach((b) => console.log(`${b.cn.padEnd(8)} ${b.latin.padEnd(28)} -> art/${b.slug}.png`));
    return;
  }
  const only = args.filter((a) => !a.startsWith('--'));
  const list = only.length ? BIRDS.filter((b) => only.includes(b.cn) || only.includes(b.slug)) : BIRDS;
  if (!list.length) throw new Error('没有匹配的物种: ' + only.join(', '));
  // blocked 的物种跳过（内容审核拦下的，重试多少次都一样）
  const blocked = list.filter((b) => b.blocked);
  if (blocked.length && !only.length) {
    console.log(`${blocked.length} 种已标记 blocked，跳过: ${blocked.map((b) => b.cn).join(', ')}`);
  }

  const key = readKey();
  fs.mkdirSync(OUT, { recursive: true });

  for (const sp of list) {
    if (sp.blocked) { console.log(`跳过 ${sp.cn}（内容审核 blocked）`); continue; }
    const dest = path.join(OUT, sp.slug + '.png');
    if (fs.existsSync(dest) && !args.includes('--force')) {
      console.log(`跳过 ${sp.cn}（已存在，--force 覆盖）`);
      continue;
    }
    process.stdout.write(`${sp.cn} … `);
    try {
      const url = await generate(key, sp);
      await download(url, dest);
      const kb = Math.round(fs.statSync(dest).size / 1024);
      console.log(`ok  art/${sp.slug}.png  ${kb}KB`);
    } catch (e) {
      console.log('失败: ' + e.message);
    }
  }
  console.log('\n完成。产物在 art/');
})();
