const READINGS = {
  '現在地':'げんざいち','大規模':'だいきぼ','直線':'ちょくせん','位置':'いち','公的':'こうてき','最新':'さいしん',
  '正式名':'せいしきめい','特別':'とくべつ','緊急':'きんきゅう','警戒':'けいかい','内水':'ないすい','氾濫':'はんらん','土砂':'どしゃ',
  '自治体':'じちたい','液状化':'えきじょうか','指定':'してい','避難':'ひなん',
  '土石流':'どせきりゅう','地理院':'ちりいん','現在':'げんざい','減災':'げんさい','災害':'さいがい','洪水':'こうずい','高潮':'たかしお','津波':'つなみ',
  '地震':'じしん','火山':'かざん','火災':'かさい','危険':'きけん','安全':'あんぜん','確認':'かくにん','情報':'じょうほう',
  '場所':'ばしょ','候補':'こうほ','周辺':'しゅうへん','周囲':'しゅうい','区域':'くいき','浸水':'しんすい','水深':'すいしん',
  '大雨':'おおあめ','下水':'げすい','水路':'すいろ','台風':'たいふう','海面':'かいめん','水位':'すいい','河川':'かせん',
  '地図':'ちず','公式':'こうしき','公開':'こうかい','全国':'ぜんこく','共通':'きょうつう','選択':'せんたく','表示':'ひょうじ',
  '移動':'いどう','経路':'けいろ','距離':'きょり','方向':'ほうこう','施設':'しせつ','係員':'かかりいん','消防':'しょうぼう','警察':'けいさつ',
  '開設':'かいせつ','段差':'だんさ','出発前':'しゅっぱつまえ','配慮':'はいりょ','必要':'ひつよう','車椅子':'くるまいす','足腰':'あしこし',
  '不安':'ふあん','文字':'もじ','言語':'げんご','読み上げ':'よみあげ','重要':'じゅうよう','実際':'じっさい','優先':'ゆうせん',
  '検索':'けんさく','住所':'じゅうしょ','建物':'たてもの','名前':'なまえ','入力':'にゅうりょく','結果':'けっか','取得':'しゅとく',
  '保存':'ほぞん','通信':'つうしん','可能':'かのう','不可能':'ふかのう','想定':'そうてい','発生':'はっせい','状況':'じょうきょう',
  '拡大縮小':'かくだいしゅくしょう','地下空間':'ちかくうかん','地下入口':'ちかいりぐち','低層階':'ていそうかい','木造密集地':'もくぞうみっしゅうち',
  '画面操作':'がめんそうさ','通行性':'つうこうせい','通行':'つうこう','東京駅':'とうきょうえき','土地勘':'とちかん','選択肢':'せんたくし',
  '道案内':'みちあんない','端末内':'たんまつない','長押':'ながお','落下物':'らっかぶつ','図記号':'ずきごう',
  '注意':'ちゅうい','画面':'がめん','案内':'あんない','緯度':'いど','経度':'けいど','指示':'しじ','出口':'でぐち','場合':'ばあい','変更':'へんこう','出典':'しゅってん','対応':'たいおう',
  '以上':'いじょう','一覧':'いちらん','共有':'きょうゆう','区分':'くぶん','警報':'けいほう','設定':'せってい','倒壊':'とうかい',
  '道路':'どうろ','判断':'はんだん','一度':'いちど','雨量':'うりょう','河口':'かこう','解除':'かいじょ','階段':'かいだん',
  '拡大':'かくだい','縮小':'しゅくしょう','記号':'きごう','亀裂':'きれつ','国土':'こくど','最後':'さいご','最短':'さいたん',
  '使用':'しよう','自分':'じぶん','斜面':'しゃめん','手動':'しゅどう','種別':'しゅべつ','準備':'じゅんび','順位':'じゅんい',
  '足元':'あしもと','損傷':'そんしょう','側溝':'そっこう','地面':'じめん','生命':'せいめい','本文':'ほんぶん','凡例':'はんれい',
  '未満':'みまん','無理':'むり','擁壁':'ようへき','落石':'らくせき','利用':'りよう','旅行者':'りょこうしゃ','風向':'かざむき','風上':'かざかみ',
  '見':'み','近':'ちか','使':'つか','前':'まえ','離':'はな','人':'ひと','今':'いま','重':'かさ','煙':'けむり','下':'した',
  '火':'ひ','中':'なか','開':'あ','係':'かかり','選':'えら','大人':'おとな','道':'みち','気':'き','示':'しめ','大':'おお',
  '歩':'ある','目':'め','岸':'きし','起':'お','決':'き','出':'で','順':'じゅん','場':'ば','図':'ず','低':'ひく',
  '未':'み','戻':'もど','駅':'えき','遠':'とお','黄':'き','何':'なに','崖':'がけ','強':'つよ','教':'おし','狭':'せま',
  '高':'たか','込':'こ','差':'さ','始':'はじ','私':'わたし','試':'ため','車':'くるま','守':'まも','手':'て','所':'ところ',
  '消':'け','上':'あ','新':'あたら','深':'ふか','身':'み','尋':'たず','性':'せい','正':'ただ','西':'にし','赤':'あか',
  '体':'からだ','濁':'にご','探':'さが','短':'みじか','端末':'たんまつ','地下':'ちか','池':'いけ','土地':'とち','東':'ひがし',
  '頭':'あたま','頭上':'ずじょう','同':'おな','読':'よ','南':'みなみ','南西':'なんせい','南東':'なんとう','迫':'せま',
  '抜':'ぬ','避':'さ','分':'ぶん','文':'ぶん','別':'べつ','保証':'ほしょう','崩':'くず','放送':'ほうそう','方':'かた',
  '木造建物密集地':'もくぞうたてものみっしゅうち','矢印':'やじるし','直接':'ちょくせつ','目指':'めざ','聞':'き','一':'ひと',
  '日本語':'にほんご','時':'とき','防災':'ぼうさい','北':'きた','北西':'ほくせい','北東':'ほくとう','本':'ほん','約':'やく','揺':'ゆ','来':'く',
  '色':'いろ','種類':'しゅるい','意味':'いみ','深さ':'ふかさ','川':'かわ','海':'うみ','陸':'りく','波':'なみ','水':'みず'
};

const entries = Object.entries(READINGS).sort((a, b) => b[0].length - a[0].length);
const escapePattern = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pattern = new RegExp(entries.map(([word]) => escapePattern(word)).join('|'), 'g');

function processTextNode(node) {
  if (!node.nodeValue || !/[一-龯]/.test(node.nodeValue)) return;
  const parent = node.parentElement;
  if (!parent || parent.closest('ruby,rt,script,style,textarea,select,option,[data-no-ruby]')) return;
  const text = node.nodeValue;
  const matches = [...text.matchAll(pattern)];
  if (!matches.length) return;
  const fragment = document.createDocumentFragment();
  let cursor = 0;
  for (const match of matches) {
    if (match.index > cursor) fragment.append(document.createTextNode(text.slice(cursor, match.index)));
    const ruby = document.createElement('ruby');
    ruby.append(document.createTextNode(match[0]));
    const rt = document.createElement('rt');
    rt.textContent = READINGS[match[0]];
    ruby.append(rt);
    fragment.append(ruby);
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) fragment.append(document.createTextNode(text.slice(cursor)));
  // Flex/grid would otherwise lay out each ruby and plain-text run separately.
  // Keep the original phrase together in one normal inline formatting context.
  const display = getComputedStyle(parent).display;
  if (display.includes('flex') || display.includes('grid')) {
    const phrase = document.createElement('span');
    phrase.className = 'ruby-text';
    phrase.append(fragment);
    node.replaceWith(phrase);
  } else {
    node.replaceWith(fragment);
  }
}

export function applyJapaneseRuby(root = document.body) {
  if (document.documentElement.lang !== 'ja' || !root) return;
  if (root.nodeType === Node.TEXT_NODE) return processTextNode(root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(processTextNode);
}

export function startRubySupport() {
  applyJapaneseRuby();
  let queued = false;
  const observer = new MutationObserver(mutations => {
    if (document.documentElement.lang !== 'ja') return;
    const hasNewContent = mutations.some(mutation => mutation.addedNodes.length);
    if (!hasNewContent || queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      applyJapaneseRuby(document.body);
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
