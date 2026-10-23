/* 往 data/birds.json 里增补物种。
   为什么用脚本而不是手写 JSON：手写一大坨 JSON 容易在中途被截断、
   丢逗号、丢括号，而且改错一处要重写整段。用脚本按 name 去重插入，
   重复执行也安全。 */
const fs = require('fs');
const nodePath = require('path');
const file = nodePath.join(__dirname, '..', 'data', 'birds.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

// ---- 待增补的物种：[类群key, 科名, 物种对象] ----
const S = (o) => o;

const ADD = {
  terrestrial: [
    ['雉科', S({ name: '石鸡', latin: 'Alectoris chukar', en: 'Chukar Partridge', body: '#b0a08a', belly: '#e0d4bc', wing: '#8f7f6a', beak: '#d94a3a', leg: '#d94a3a', crest: 0, size: 0.95, silhouette: '灰褐圆身、红嘴红腿、脸侧一道黑环，站在岩石上很稳', habitat: '干燥多岩的山坡与灌丛' })],
    ['雉科', S({ name: '白鹇', latin: 'Lophura nycthemera', en: 'Silver Pheasant', body: '#f2f4f6', belly: '#ffffff', wing: '#d8dde2', beak: '#c9b48a', leg: '#d94a3a', crest: 40, size: 1.15, silhouette: '通体雪白带黑细纹、红脸红腿、长尾飘逸，像披了件白袍', habitat: '亚热带常绿林下的密灌' })],
    ['雉科', S({ name: '白马鸡', latin: 'Crossoptilon crossoptilon', en: 'White Eared-Pheasant', body: '#f8f8f4', belly: '#ffffff', wing: '#e8e8e2', beak: '#e8a13a', leg: '#d94a3a', crest: 40, size: 1.25, silhouette: '通身雪白、尾羽蓬松像马尾、红腿红脸，高原上的一团白', habitat: '青藏高原的针叶林与灌丛' })],
    ['雉科', S({ name: '大眼斑雉', latin: 'Argusianus argus', en: 'Great Argus', body: '#8a5a3a', belly: '#c9a882', wing: '#6a4028', beak: '#c9b48a', leg: '#d94a3a', crest: 40, size: 1.4, silhouette: '尾羽长得夸张、上面布满巨大的眼斑，开屏时像一面孔雀窗', habitat: '东南亚热带雨林的地面' })],
    ['沙鸡科', S({ name: '毛腿沙鸡', latin: 'Syrrhaptes paradoxus', en: 'Pallas\'s Sandgrouse', body: '#c9b48a', belly: '#e8dcc0', wing: '#a8926a', beak: '#c9b48a', leg: '#d9c8a8', crest: 0, size: 1.0, silhouette: '沙褐色的鸽子形、腿脚裹着绒羽、尾羽细长如针，像踩在沙上的毛球', habitat: '中亚荒漠与半干旱草原' })],
    ['沙鸡科', S({ name: '黑腹沙鸡', latin: 'Pterocles orientalis', en: 'Black-bellied Sandgrouse', body: '#a8906a', belly: '#3a3a3e', wing: '#8a7454', beak: '#c9b48a', leg: '#7a6a5a', crest: 0, size: 1.05, silhouette: '沙黄背配一块漆黑肚皮、胸口一条黑带，远看像被墨点了一下', habitat: '干燥开阔的荒漠与耕地' })],
    ['冢雉科', S({ name: '灌丛冢雉', latin: 'Alectura lathami', en: 'Australian Brushturkey', body: '#3a3230', belly: '#4a403c', wing: '#2e2725', beak: '#3a3a3e', leg: '#d94a3a', crest: 0, size: 1.2, silhouette: '通体墨黑、头颈一片鲜红裸露皮肤、尾巴扁平竖起，像个小火鸡', habitat: '澳洲东部的雨林与花园' })],
    ['冢雉科', S({ name: '眼斑冢雉', latin: 'Leipoa ocellata', en: 'Malleefowl', body: '#a8906a', belly: '#d8c8a8', wing: '#8a7454', beak: '#8a8a80', leg: '#7a6a5a', crest: 0, size: 1.15, silhouette: '灰褐带眼状斑、走起路来一步一顿，靠堆沙堆发酵孵蛋', habitat: '澳洲南部的半干旱桉树林' })],
    ['沙鸡科', S({ name: '彩沙鸡', latin: 'Pterocles indicus', en: 'Painted Sandgrouse', body: '#c9a878', belly: '#e8d8b8', wing: '#a8885a', beak: '#d9a04a', leg: '#d9c8a8', crest: 0, size: 0.98, silhouette: '沙黄底上绘满细密横纹、胸前一道黑边，像穿了条纹衫', habitat: '南亚的干燥灌丛与石砾地' })],
  ],
  wader: [
    ['鹭科', S({ name: '大蓝鹭', latin: 'Ardea herodias', en: 'Great Blue Heron', body: '#8a9aa8', belly: '#c8d2da', wing: '#5f7080', beak: '#e0b04a', leg: '#4a4a50', crest: 40, size: 1.4, silhouette: '北美最大的鹭，蓝灰披风、头侧黑冠、站着一动不动像雕塑', habitat: '北美海岸、河口与沼泽' })],
    ['鹭科', S({ name: '绿鹭', latin: 'Butorides virescens', en: 'Green Heron', body: '#4a6a54', belly: '#a8825a', wing: '#2f4a38', beak: '#c9b48a', leg: '#d9a04a', crest: 40, size: 0.85, silhouette: '最小的鹭之一，墨绿背配栗褐脖，缩着脖子蹲在枝上像块石头', habitat: '溪流、池塘边的低枝与浅滩' })],
    ['秧鸡科', S({ name: '紫水鸡', latin: 'Porphyrio porphyrio', en: 'Purple Swamphen', body: '#5a4a9a', belly: '#4a3a8a', wing: '#3a5a8a', beak: '#d93a2a', leg: '#e88a9a', crest: 0, size: 1.0, silhouette: '整只紫蓝色、红嘴红腿特别长，在芦苇间走像踩高跷', habitat: '芦苇荡与水生植物茂密的湿地' })],
    ['秧鸡科', S({ name: '普通秧鸡', latin: 'Rallus indicus', en: 'Brown-cheeked Rail', body: '#8a6a44', belly: '#b0a0a8', wing: '#6a5236', beak: '#d9a04a', leg: '#c9a882', crest: 0, size: 0.85, silhouette: '细长侧扁像被压过、纵纹背、嘴细长下弯，最会躲人', habitat: '稻田、沼泽的稠密水草中' })],
    ['鹬科', S({ name: '大杓鹬', latin: 'Numenius madagascariensis', en: 'Far Eastern Curlew', body: '#a8906a', belly: '#e8dcc0', wing: '#8a7454', beak: '#3a3a40', leg: '#7a8a9a', crest: 0, size: 1.25, silhouette: '喙长得离谱、向下大弧弯，站在滩涂上像插了根长勺', habitat: '沿海滩涂，东亚迁徙线上' })],
    ['鹬科', S({ name: '红颈滨鹬', latin: 'Calidris ruficollis', en: 'Red-necked Stint', body: '#b06a4a', belly: '#fbf6ea', wing: '#8a5230', beak: '#26262a', leg: '#26262a', crest: 0, size: 0.65, silhouette: '麻雀大小的鹬、繁殖期头颈一片锈红，成群在滩上小跑', habitat: '滩涂、盐田与浅水边' })],
    ['鹬科', S({ name: '青脚鹬', latin: 'Tringa nebularia', en: 'Common Greenshank', body: '#8a9298', belly: '#f2f4f4', wing: '#6a7278', beak: '#4a5a5a', leg: '#7aa88a', crest: 0, size: 1.0, silhouette: '灰背白腹、腿是独特的青绿色、喙略上翘，走来走去扫水', habitat: '河口、滩涂与浅湖' })],
    ['反嘴鹬科', S({ name: '黑翅长脚鹬', latin: 'Himantopus himantopus', en: 'Black-winged Stilt', body: '#fbfbfa', belly: '#ffffff', wing: '#26292e', beak: '#26262a', leg: '#e88a9a', crest: 0, size: 1.0, silhouette: '红得发亮的超长腿、黑白配色、走路像踩高跷的绅士', habitat: '浅水塘、盐田与稻田' })],
    ['鹤科', S({ name: '白枕鹤', latin: 'Antigone vipio', en: 'White-naped Crane', body: '#9aa4ae', belly: '#e8ecee', wing: '#7a8490', beak: '#c9b06a', leg: '#d98a8a', crest: 0, size: 1.36, silhouette: '灰身、后颈一大块雪白、脸颊一块红斑，像围了条白围巾', habitat: '东北湿地繁殖，长江流域越冬' })],
    ['鹤科', S({ name: '美洲鹤', latin: 'Grus americana', en: 'Whooping Crane', body: '#fbfbfa', belly: '#ffffff', wing: '#f0f0ec', beak: '#c9b06a', leg: '#3a3a3e', crest: 0, size: 1.44, silhouette: '北美最高的大鸟、雪白身躯、头顶一块猩红，极危而优雅', habitat: '北美湿地的极危物种' })],
    ['鸻科', S({ name: '灰斑鸻', latin: 'Pluvialis squatarola', en: 'Grey Plover', body: '#a8b0b8', belly: '#2e3238', wing: '#8a929a', beak: '#26262a', leg: '#3a3a3e', crest: 0, size: 0.9, silhouette: '繁殖期通体银灰配漆黑腹面、白腰，像穿了件燕尾服', habitat: '沿海滩涂与盐田' })],
    ['鸻科', S({ name: '金鸻', latin: 'Pluvialis fulva', en: 'Pacific Golden Plover', body: '#c9a85a', belly: '#2e3238', wing: '#a8884a', beak: '#26262a', leg: '#8a8a90', crest: 0, size: 0.85, silhouette: '背上洒满金色斑点、腹面墨黑、飞得快到看不清翅膀', habitat: '苔原繁殖，滩涂与草地越冬' })],
    ['鹬科', S({ name: '扇尾沙锥', latin: 'Gallinago gallinago', en: 'Common Snipe', body: '#8a7a5a', belly: '#f0ece0', wing: '#6a5a3a', beak: '#4a4a50', leg: '#7a8a6a', crest: 0, size: 0.85, silhouette: '背上四条深色纵纹、喙长如针，受惊时呈锯齿状冲天飞起', habitat: '沼泽、稻田与湿草甸' })],
  ],
  waterfowl: [
    ['鸭科', S({ name: '大天鹅', latin: 'Cygnus cygnus', en: 'Whooper Swan', body: '#fefefc', belly: '#ffffff', wing: '#f2f4f2', beak: '#e8c23a', leg: '#26262a', crest: 0, size: 1.38, silhouette: '嘴黄到尖端转黑、脖子笔挺，叫起来像喇叭一样洪亮', habitat: '北方湖泊繁殖，南方河口越冬' })],
    ['鸭科', S({ name: '豆雁', latin: 'Anser fabalis', en: 'Bean Goose', body: '#7a6a52', belly: '#c8b89a', wing: '#5a4a34', beak: '#3a3a34', leg: '#e8a13a', crest: 0, size: 1.18, silhouette: '深褐大雁、喙黑带橙环、排成 V 字飞过天空，最有秋天气息', habitat: '北方苔原繁殖，平原农田越冬' })],
    ['鸭科', S({ name: '赤麻鸭', latin: 'Tadorna ferruginea', en: 'Ruddy Shelduck', body: '#d98a3a', belly: '#e8a85a', wing: '#f0c88a', beak: '#3a3a34', leg: '#3a3a34', crest: 0, size: 1.12, silhouette: '整只橙褐像烤过、头颈更浅带一道白，飞起来翅膀黑白分明', habitat: '高原湖泊、草原河流' })],
    ['䴙䴘科', S({ name: '黑颈䴙䴘', latin: 'Podiceps nigricollis', en: 'Black-necked Grebe', body: '#26262a', belly: '#f0c84a', wing: '#3a3a40', beak: '#26262a', leg: '#3a3a3e', crest: 40, size: 0.95, silhouette: '黑头黑颈配一对金黄耳簇、体侧栗褐，像戴了副金耳环', habitat: '高原湖泊与咸水湖' })],
    ['鸥科', S({ name: '红嘴鸥', latin: 'Chroicocephalus ridibundus', en: 'Black-headed Gull', body: '#e8ecef', belly: '#ffffff', wing: '#b0bcc8', beak: '#c9302c', leg: '#c9302c', crest: 0, size: 0.95, silhouette: '白身灰翅、红嘴红腿，夏天头上一块巧克力色，冬天变白', habitat: '湖泊、河口的城市水域' })],
    ['鸥科', S({ name: '银鸥', latin: 'Larus argentatus', en: 'Herring Gull', body: '#f0f4f6', belly: '#ffffff', wing: '#9aa8b8', beak: '#e8c24a', leg: '#e8a882', crest: 0, size: 1.25, silhouette: '灰背白身、黄嘴带一块红斑、腿粉红，海边的标准配置', habitat: '海岸、港口与大型湖面' })],
    ['鸬鹚科', S({ name: '普通鸬鹚', latin: 'Phalacrocorax carbo', en: 'Great Cormorant', body: '#262a30', belly: '#1e2228', wing: '#2e3238', beak: '#4a4a50', leg: '#26262a', crest: 0, size: 1.3, silhouette: '通体墨黑、晾翅时张开双臂站着不动、喉咙一块黄，最像渔夫', habitat: '河口、湖泊与海岸岩礁' })],
    ['鸬鹚科', S({ name: '海鸬鹚', latin: 'Urile pelagicus', en: 'Pelagic Cormorant', body: '#1f2228', belly: '#181b20', wing: '#262a30', beak: '#3a3a40', leg: '#26262a', crest: 40, size: 1.1, silhouette: '小巧墨黑、繁殖期头上一撮细羽，站在海崖上摇摇晃晃', habitat: '太平洋沿岸的岩礁与海崖' })],
    ['鸥科', S({ name: '北极鸥', latin: 'Larus hyperboreus', en: 'Glaucous Gull', body: '#fbfcfa', belly: '#ffffff', wing: '#eef0ec', beak: '#e8c24a', leg: '#e88a9a', crest: 0, size: 1.35, silhouette: '北极的大鸥、通体雪白只带一点灰背、腿粉红，像浮在海上的棉花', habitat: '北极苔原繁殖，海岸越冬' })],
    ['鸥科', S({ name: '黑尾鸥', latin: 'Larus crassirostris', en: 'Black-tailed Gull', body: '#f0f2f4', belly: '#ffffff', wing: '#c8ccd2', beak: '#c9a24a', leg: '#3a3a3e', crest: 0, size: 1.2, silhouette: '白身配黑色尾带、黄嘴带一块红斑、腿黑，东亚海岸的常客', habitat: '东亚沿海岛屿与港口' })],
    ['䴙䴘科', S({ name: '角䴙䴘', latin: 'Podiceps auritus', en: 'Horned Grebe', body: '#3a4450', belly: '#f0ece0', wing: '#262e3a', beak: '#e8e8e0', leg: '#5a7a8a', crest: 40, size: 0.9, silhouette: '黑头配金黄耳簇、喉胸一片锈红、腹白，像抹了口红', habitat: '北方湖泊与近海' })],
  ],
  raptor: [
    ['鸱鸮科', S({ name: '红角鸮', latin: 'Otus sunia', en: 'Oriental Scops Owl', body: '#b06a45', belly: '#e0c9a8', wing: '#8a5230', beak: '#4a4a50', leg: '#d9b382', crest: 90, size: 0.8, face: 'disc', eyeCol: '#e8a83a', breast: 'streak', silhouette: '一身锈红、头顶两束短耳羽、胸口一道纵纹，最小最秀气', habitat: '林缘与果园，夜里叫得最响' })],
    ['鸱鸮科', S({ name: '领角鸮', latin: 'Otus lettia', en: 'Collared Scops Owl', body: '#a86f4a', belly: '#ded0b4', wing: '#875634', beak: '#5a5a52', leg: '#d9b382', crest: 90, size: 0.85, face: 'disc', eyeCol: '#e8a83a', breast: 'mottled', silhouette: '暖棕、耳羽明显、脖子一圈浅色领环，眼睛半眯着像在打盹', habitat: '城市公园的老树洞里' })],
    ['鸱鸮科', S({ name: '灰林鸮', latin: 'Strix aluco', en: 'Tawny Owl', body: '#8a7a62', belly: '#ded3bc', wing: '#6c5e4a', beak: '#c2b28c', leg: '#d9c8a8', crest: 0, size: 1.05, face: 'disc', eyeCol: '#2b2b30', breast: 'barred', silhouette: '圆头无耳羽、灰褐带斑、一对黑眼睛，蹲在树洞里像块树皮', habitat: '阔叶林与老公园' })],
    ['鸱鸮科', S({ name: '长耳鸮', latin: 'Asio otus', en: 'Long-eared Owl', body: '#a8916a', belly: '#e6dcc0', wing: '#8a7654', beak: '#4a4a50', leg: '#d9b382', crest: 95, size: 1.1, face: 'flat', eyeCol: '#b06a30', breast: 'mottled', silhouette: '两束耳羽最长几乎竖到头顶、身形瘦高、橙红眼睛，最有"表情"', habitat: '针叶林缘，冬天集群栖树' })],
    ['鸱鸮科', S({ name: '褐林鸮', latin: 'Strix leptogrammica', en: 'Brown Wood Owl', body: '#8a5f3a', belly: '#e0cba4', wing: '#6d4a2c', beak: '#c9b48a', leg: '#c9a882', crest: 0, size: 1.2, face: 'flat', eyeCol: '#4a3a2a', breast: 'mottled', silhouette: '深棕、暗麻点、扁脸盘、无耳羽，像一块长了眼睛的老木头', habitat: '南方常绿阔叶林的老树洞' })],
    ['草鸮科', S({ name: '仓鸮', latin: 'Tyto alba', en: 'Barn Owl', body: '#d8c9a8', belly: '#fbf6e8', wing: '#c2ad88', beak: '#e8d8b0', leg: '#e8dcc0', crest: 0, size: 1.05, face: 'heart', eyeCol: '#2b2b30', brow: 1, breast: 'mottled', silhouette: '心形白脸盘、两颊鼓起、额头凹陷，看起来永远在沉思', habitat: '谷仓、废墟与农田' })],
    ['草鸮科', S({ name: '草鸮', latin: 'Tyto longimembris', en: 'Eastern Grass Owl', body: '#c9b48a', belly: '#f4e8d0', wing: '#a8946a', beak: '#e8d8b0', leg: '#e8dcc0', crest: 0, size: 1.0, face: 'heart', eyeCol: '#4a4a50', breast: 'mottled', silhouette: '比仓鸮更黄褐、脸盘心形更深、腿特别长，是草里潜行的猎手', habitat: '南方高草草原与沼泽草地' })],
    ['鹰科', S({ name: '雀鹰', latin: 'Accipiter nisus', en: 'Eurasian Sparrowhawk', body: '#5a5a5e', belly: '#e8e8e4', wing: '#41414a', beak: '#3a3a40', leg: '#e8c24a', crest: 0, size: 0.95, silhouette: '铁灰背配橙红横纹腹、翅短圆尾长，擅长在林间突然扑出', habitat: '林地边缘与公园' })],
    ['隼科', S({ name: '灰背隼', latin: 'Falco columbarius', en: 'Merlin', body: '#5a6a74', belly: '#f0e8dc', wing: '#414e58', beak: '#4a5a60', leg: '#e8c24a', crest: 0, size: 0.8, silhouette: '铁灰背配纵纹腹、身小翼尖，像袖珍的游隼一样低飞掠过', habitat: '开阔林地与农田' })],
    ['鹰科', S({ name: '苍鹰', latin: 'Accipiter gentilis', en: 'Northern Goshawk', body: '#5a5a5e', belly: '#e8e8e4', wing: '#41414a', beak: '#3a3a40', leg: '#e8c24a', crest: 0, size: 1.25, silhouette: '铁灰背、满身细横纹、眼睛橙红带一道白眉，最冷峻的猎手', habitat: '山地针叶林与林缘' })],
    ['鹰科', S({ name: '黑鸢', latin: 'Milvus migrans', en: 'Black Kite', body: '#5a4a3a', belly: '#8a7a62', wing: '#3f3225', beak: '#e8c24a', leg: '#e8c24a', crest: 0, size: 1.3, silhouette: '展开翅膀尾端像一把剪刀、盘旋时身体不动，最常见的大鸟', habitat: '河流、平原与城市上空' })],
    ['隼科', S({ name: '燕隼', latin: 'Falco subbuteo', en: 'Eurasian Hobby', body: '#4a5560', belly: '#f0e8dc', wing: '#3a4450', beak: '#4a4a50', leg: '#e8c24a', crest: 0, size: 0.85, silhouette: '翅膀尖得像镰刀、腿上一撮橙红羽毛，飞起来像只大燕子', habitat: '开阔林地与农田上空' })],
  ],
  climber: [
    ['啄木鸟科', S({ name: '绿啄木鸟', latin: 'Picus canus', en: 'Grey-headed Woodpecker', body: '#7a8a52', belly: '#c8cbb0', wing: '#5f6f3f', beak: '#4a4a50', leg: '#8a8a90', crest: 40, size: 1.0, silhouette: '橄榄绿背、灰头、头顶一抹红，啄树干时像台小型打桩机', habitat: '阔叶林与公园老树' })],
    ['啄木鸟科', S({ name: '白背啄木鸟', latin: 'Dendrocopos leucotos', en: 'White-backed Woodpecker', body: '#26262a', belly: '#f2f2ee', wing: '#3a3a40', beak: '#4a4a50', leg: '#8a8a90', crest: 40, size: 1.05, silhouette: '黑白相间、背上一条白纵带、屁股通红，是鶌形目里最大的一只', habitat: '老龄阔叶林，偏好枯木' })],
    ['戴胜科', S({ name: '戴胜（亚种）', latin: 'Upupa epops longirostris', en: 'Long-billed Hoopoe', body: '#c9a06a', belly: '#e0c9a0', wing: '#26262a', beak: '#4a4a50', leg: '#8a7a6a', crest: 40, size: 1.0, silhouette: '羽冠比指名亚种更长、喙更细，开冠时像展开一把小扇子', habitat: '开阔草地与果园' })],
    ['翠鸟科', S({ name: '白胸翡翠', latin: 'Halcyon smyrnensis', en: 'White-throated Kingfisher', body: '#2a7a9a', belly: '#c96a3a', wing: '#1f6a86', beak: '#c93a2a', leg: '#d94a2a', crest: 0, size: 0.95, silhouette: '蓝背、红嘴、胸腹一大块雪白，飞起来像一道蓝白光', habitat: '水田、沟渠与林缘' })],
    ['翠鸟科', S({ name: '冠翠鸟', latin: 'Megaceryle lugubris', en: 'Crested Kingfisher', body: '#8a9298', belly: '#f0f2f0', wing: '#5a6268', beak: '#3a3a40', leg: '#8a8a90', crest: 90, size: 1.15, silhouette: '灰白斑驳、头顶一大簇炸开的冠羽，蹲在溪边像戴了顶帽', habitat: '山间溪流与河岸' })],
    ['鹦鹉科', S({ name: '和尚鹦鹉', latin: 'Myiopsitta monachus', en: 'Monk Parakeet', body: '#7aa85a', belly: '#c8d8a8', wing: '#5a8a3a', beak: '#c9b48a', leg: '#8a8a90', crest: 0, size: 0.9, silhouette: '绿身灰胸、橙色嘴、尾巴细长，最爱把巢筑成一大团树枝', habitat: '城市公园，南美原产已归化' })],
    // 鹦形目拆科：凤头鹦鹉科（可竖起的冠羽）与鹦鹉科（无冠）
    ['凤头鹦鹉科', S({ name: '粉红凤头鹦鹉', latin: 'Eolophus roseicapilla', en: 'Galah', body: '#e89aa8', belly: '#f0b8c0', wing: '#c8c8cc', beak: '#e8e0d0', leg: '#8a8a90', crest: 40, size: 1.0, silhouette: '粉红身配灰翅膀、头顶可竖起一小丛粉冠，颜色最甜', habitat: '澳洲内陆开阔地' })],
    ['凤头鹦鹉科', S({ name: '葵花凤头鹦鹉', latin: 'Cacatua galerita', en: 'Sulphur-crested Cockatoo', body: '#fbfbf6', belly: '#ffffff', wing: '#f0f0e8', beak: '#3a3a40', leg: '#8a8a90', crest: 40, size: 1.25, silhouette: '通身雪白、头顶一大丛柠檬黄冠羽能瞬间炸开，气场最强', habitat: '澳洲东部林地与城市公园' })],
    ['凤头鹦鹉科', S({ name: '玄凤鹦鹉', latin: 'Nymphicus hollandicus', en: 'Cockatiel', body: '#b0a89a', belly: '#d8d0c4', wing: '#8a8274', beak: '#8a8a8a', leg: '#8a8a90', crest: 40, size: 0.85, silhouette: '头顶一根竖起的呆毛、腮上一块橙红圆斑，表情最呆萌', habitat: '澳洲内陆的干燥林地' })],
    ['雨燕科', S({ name: '普通雨燕', latin: 'Apus apus', en: 'Common Swift', body: '#3a3a42', belly: '#4a4a52', wing: '#26262a', beak: '#3a3a40', leg: '#3a3a3e', crest: 0, size: 0.75, silhouette: '通体墨黑、翅膀细长如镰刀、几乎不落地，天空就是它的家', habitat: '城市上空，古建筑缝隙筑巢' })],
    ['雨燕科', S({ name: '白腰雨燕', latin: 'Apus pacificus', en: 'Pacific Swift', body: '#3a3a42', belly: '#4a4a52', wing: '#26262a', beak: '#3a3a40', leg: '#3a3a3e', crest: 0, size: 0.78, silhouette: '墨黑身躯配一道雪白腰斑、尾巴分叉，飞起来像一枚黑色飞镖', habitat: '东亚山区与城市上空' })],
    ['戴胜科', S({ name: '绿戴胜', latin: 'Phoeniculus purpureus', en: 'Green Wood Hoopoe', body: '#2a5a4a', belly: '#1f4a3c', wing: '#1a3a30', beak: '#d94a3a', leg: '#d94a3a', crest: 0, size: 0.95, silhouette: '通体墨绿带金属光、长弯的红嘴、长尾下垂，成群吵闹地爬树', habitat: '非洲的稀树草原与林地' })],
    ['翠鸟科', S({ name: '蓝翡翠', latin: 'Halcyon pileata', en: 'Black-capped Kingfisher', body: '#2a4a8a', belly: '#c96a3a', wing: '#1f3a70', beak: '#c93a2a', leg: '#d94a2a', crest: 0, size: 0.95, silhouette: '深蓝背、黑头白领、胸腹橙红，站在水边像块烧红的炭', habitat: '南方水田、池塘与林缘' })],
  ],
  songbird: [
    ['雀科', S({ name: '树麻雀', latin: 'Passer montanus', en: 'Eurasian Tree Sparrow', body: '#a87c4a', belly: '#dcc9a8', wing: '#8a6238', beak: '#4a4038', leg: '#c9a882', crest: 0, size: 0.68, silhouette: '头顶栗红、脸侧白斑带黑点、喉咙一块黑，最眼熟的小邻居', habitat: '城市、村镇的每个角落' })],
    ['山雀科', S({ name: '大山雀', latin: 'Parus major', en: 'Great Tit', body: '#7a8a5a', belly: '#e8e8c0', wing: '#5a6a44', beak: '#26262a', leg: '#8a8a90', crest: 0, size: 0.72, silhouette: '黑头白颊、腹部一道黑纵带直达尾下，像披了条领带', habitat: '林地边缘与公园' })],
    ['山雀科', S({ name: '黄腹山雀', latin: 'Pardaliparus venustulus', en: 'Yellow-bellied Tit', body: '#6a7a52', belly: '#e8d84a', wing: '#4f5f3a', beak: '#26262a', leg: '#8a8a90', crest: 0, size: 0.65, silhouette: '黄肚皮最醒目、头顶黑帽、脸颊雪白，飞来飞去停不住', habitat: '山地阔叶林与竹林' })],
    ['绣眼鸟科', S({ name: '灰腹绣眼鸟', latin: 'Zosterops palpebrosus', en: 'Indian White-eye', body: '#a8b878', belly: '#e8ecd0', wing: '#8a9a5a', beak: '#5a5a3a', leg: '#8a8a70', crest: 0, size: 0.58, silhouette: '橄榄绿小团、眼圈一圈白毛像戴了眼镜、腹部偏灰，最灵动', habitat: '林缘、果园与花园' })],
    ['噪鹛科', S({ name: '黑喉噪鹛', latin: 'Pterorhinus chinensis', en: 'Black-throated Laughingthrush', body: '#8a7a5a', belly: '#c8b89a', wing: '#6a5a3a', beak: '#3a3a40', leg: '#8a6a4a', crest: 0, size: 0.9, silhouette: '喉部一块黑、脸上白斑、尾巴很长，成群吵闹着穿过灌丛', habitat: '南方丘陵灌丛与竹林' })],
    ['鸦科', S({ name: '大嘴乌鸦', latin: 'Corvus macrorhynchos', en: 'Large-billed Crow', body: '#26262a', belly: '#1e1e22', wing: '#2e2e32', beak: '#1a1a1e', leg: '#26262a', crest: 0, size: 1.45, silhouette: '通体墨黑带一点蓝紫光泽、喙粗壮、额头高，最聪明的一只', habitat: '城市、林地与垃圾场' })],
    ['鸦科', S({ name: '松鸦', latin: 'Garrulus glandarius', en: 'Eurasian Jay', body: '#a8825a', belly: '#e0d0b8', wing: '#4a6a9a', beak: '#3a3a34', leg: '#8a7a6a', crest: 0, size: 1.1, silhouette: '粉褐色圆身、翅上一块宝蓝横斑、头顶细纵纹，配色最跳', habitat: '阔叶林与橡树林' })],
    ['鹟科', S({ name: '红喉歌鸲', latin: 'Calliope calliope', en: 'Siberian Rubythroat', body: '#a8875a', belly: '#e8dcc0', wing: '#8a6a44', beak: '#3a3a40', leg: '#c9a882', crest: 0, size: 0.75, silhouette: '喉部一块鲜红像系了红领结、脸侧白眉纹，叫声变化最多', habitat: '灌丛、芦苇与林缘' })],
    ['鹟科', S({ name: '白眉姬鹟', latin: 'Ficedula zanthopygia', en: 'Yellow-rumped Flycatcher', body: '#26262a', belly: '#f0c83a', wing: '#1f1f24', beak: '#3a3a40', leg: '#8a8a90', crest: 0, size: 0.68, silhouette: '黑白配柠檬黄肚皮、翅上一道白斑、眉纹雪白，颜色最利落', habitat: '阔叶林与公园' })],
    ['燕科', S({ name: '家燕', latin: 'Hirundo rustica', en: 'Barn Swallow', body: '#2f3a5a', belly: '#f0e0d0', wing: '#1f2a48', beak: '#26262a', leg: '#3a3a3e', crest: 0, size: 0.72, silhouette: '墨蓝背、橙红喉、尾巴像剪刀，春天屋檐下最准时的信号', habitat: '乡村屋檐与城市屋檐下' })],
    ['燕科', S({ name: '金腰燕', latin: 'Cecropis daurica', en: 'Red-rumped Swallow', body: '#2a3a5a', belly: '#f0e4d8', wing: '#1a2844', beak: '#26262a', leg: '#3a3a3e', crest: 0, size: 0.75, silhouette: '腰上一片橙黄、喉侧一道蓝黑纵纹、尾巴比家燕更长，像换了装的堂兄', habitat: '屋檐下与桥梁缝隙，江南常见' })],
    ['鹎科', S({ name: '红耳鹎', latin: 'Pycnonotus jocosus', en: 'Red-whiskered Bulbul', body: '#3a3230', belly: '#e8e2d4', wing: '#2a2422', beak: '#26262a', leg: '#3a3a3e', crest: 40, size: 0.85, silhouette: '黑头红耳、头顶一撮竖起的冠羽、腹部雪白，像戴了顶小礼帽', habitat: '南方低海拔的灌丛与果园' })],
    ['鹎科', S({ name: '黄绿鹎', latin: 'Pycnonotus flavescens', en: 'Flavescent Bulbul', body: '#7a8a4a', belly: '#e8d88a', wing: '#5f6f3a', beak: '#4a4a50', leg: '#8a8a80', crest: 40, size: 0.82, silhouette: '通体黄绿、头顶竖起一小撮、喉部偏白，像一团嫩芽', habitat: '东南亚的湿润林缘' })],
    ['雀科', S({ name: '山麻雀', latin: 'Passer cinnamomeus', en: 'Russet Sparrow', body: '#b87a3a', belly: '#e8d8b8', wing: '#9a5f28', beak: '#3a3a40', leg: '#c9a882', crest: 0, size: 0.68, silhouette: '雄鸟一身浓栗红配黑喉、雌鸟麻雀样，山村里的一团橘', habitat: '高原与山区的村落、灌丛' })],
    ['绣眼鸟科', S({ name: '红胁绣眼鸟', latin: 'Zosterops erythropleurus', en: 'Chestnut-flanked White-eye', body: '#9db85a', belly: '#e8eec8', wing: '#82a04a', beak: '#5a5a3a', leg: '#8a8a70', crest: 0, size: 0.6, silhouette: '橄榄绿小团、白框眼镜、胁下一抹栗红，迁徙季最活跃', habitat: '林地与灌丛，过境时成群' })],
    ['鹎科', S({ name: '白头鹎', latin: 'Pycnonotus sinensis', en: 'Light-vented Bulbul', body: '#7a8a5a', belly: '#e8e8d8', wing: '#5a6a44', beak: '#26262a', leg: '#8a8a90', crest: 0, size: 0.82, silhouette: '后脑一大块白斑像长了白发、橄榄绿背、叫声清亮', habitat: '城市公园、果园与林缘' })],
  ],
};

/* 自动补出来的科，需要同时给出拉丁名与目。一个科只描述一次。 */
const NEW_FAMILY = {
  '鹬科':   { latin: 'Scolopacidae',      order: '鸻形目' },
  '鸥科':   { latin: 'Laridae',           order: '鸻形目' },
  '草鸮科': { latin: 'Tytonidae',         order: '鸮形目' },
  '雨燕科': { latin: 'Apodidae',          order: '雨燕目' },
  '燕科':   { latin: 'Hirundinidae',      order: '雀形目' },
  '鹎科':   { latin: 'Pycnonotidae',      order: '雀形目' },
  '鸬鹚科': { latin: 'Phalacrocoracidae', order: '鲣鸟目' },
  '凤头鹦鹉科': { latin: 'Cacatuidae', order: '鹦形目' },
  '沙鸡科': { latin: 'Pteroclidae', order: '沙鸡目' },
  '冢雉科': { latin: 'Megapodiidae', order: '鸡形目' },
};

// ---- 插入：按 name 去重；科不存在就自动建 ----
let added = 0, skipped = 0, newFams = 0;
for (const gkey of Object.keys(ADD)) {
  const g = data.groups.find((x) => x.key === gkey);
  if (!g) { console.warn('找不到类群', gkey); continue; }
  for (const [famName, sp] of ADD[gkey]) {
    let fam = g.taxa.find((t) => t.name === famName);
    if (!fam) {
      const meta = NEW_FAMILY[famName];
      if (!meta) { console.warn('科不存在且无元数据：', gkey, famName, '跳过', sp.name); skipped++; continue; }
      fam = { rank: '科', name: famName, latin: meta.latin, order: meta.order, species: [] };
      g.taxa.push(fam);
      newFams++;
      console.log('新建科：' + famName + ' (' + meta.latin + ')');
    }
    if (fam.species.some((s) => s.name === sp.name)) { skipped++; continue; }
    fam.species.push(sp);
    added++;
  }
}

// ---- 迁移：玄凤鹦鹉从鹦鹉科挪到凤头鹦鹉科（按现代分类，凤头鹦鹉自成科）----
{
  const cl = data.groups.find((g) => g.key === 'climber');
  const from = cl.taxa.find((t) => t.name === '鹦鹉科');
  const to = cl.taxa.find((t) => t.name === '凤头鹦鹉科');
  if (from && to) {
    const i = from.species.findIndex((s) => s.name === '玄凤鹦鹉');
    if (i >= 0) {
      to.species.push(from.species[i]);
      from.species.splice(i, 1);
      console.log('迁移：玄凤鹦鹉 鹦鹉科 → 凤头鹦鹉科');
    }
  }
}

fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');

// 校验
const re = JSON.parse(fs.readFileSync(file, 'utf8'));
let tot = 0, fams = 0;
console.log('--- 增补结果 ---');
for (const g of re.groups) {
  const n = g.taxa.reduce((s, t) => s + t.species.length, 0);
  fams += g.taxa.length; tot += n;
  console.log(g.name.padEnd(4), '科=' + String(g.taxa.length).padStart(2), '种=' + String(n).padStart(2));
}
console.log(`新增 ${added}，跳过 ${skipped}，合计 ${fams} 科 ${tot} 种`);
