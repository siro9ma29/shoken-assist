/* 特別支援学級版：評価の文の分類・言い換え・欄ごとの組み立てのテスト（SN v1.6〜）
   使い方：node sn/test/kk_bun_test.js
   sn/index.html から「画面に触らない処理」（TEXT-CORE と、個別の指導計画の読み取りの囲み）だけを切り出して動かす。
   文はすべて架空。実際の計画の文は入れないこと。 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const core = html.slice(html.indexOf('/* ===TEXT-CORE-START==='), html.indexOf('/* ===TEXT-CORE-END=== */'));
const kkStart = html.indexOf('   個別の指導計画（様式3-1 .xlsx）の読み取り');
const kk = html.slice(html.lastIndexOf('/* ====', kkStart), html.indexOf('</script>', kkStart));
const ctx = {}; vm.createContext(ctx);
vm.runInContext(core + '\n' + kk + '\nthis.API = { kkPutPhrase, kkSplit, kkKind, kkPart, kkPolite, kkFix, kkSentsOf, kkCompose, kkHas, SUB_BY_KEY };', ctx);
const A = ctx.API;

let ng = 0, n = 0;
const eq = (got, want, label)=>{ n++; if(got !== want){ ng++; console.log(`NG ${label}\n   got : ${got}\n   want: ${want}`); } };

/* 1. 文末を敬体に */
[
  ['名前を書くことができた。', '名前を書くことができました。'],
  ['最後まで取り組んだ', '最後まで取り組みました。'],
  ['友達と遊んだ。', '友達と遊びました。'],
  ['順番を待った。', '順番を待ちました。'],
  ['歌を歌った。', '歌を歌いました。'],
  ['係の仕事を頑張った。', '係の仕事を頑張りました。'],
  ['作品を作った。', '作品を作りました。'],
  ['楽しく体を動かしていた。', '楽しく体を動かしていました。'],
  ['手紙を書いた。', '手紙を書きました。'],
  ['教室にいた。', '教室にいました。'],
  ['発表を行った。', '発表を行いました。'],
  ['公園に行った。', '公園に行きました。'],
  ['とても楽しかった。', 'とても楽しかったです。'],
  ['やり方が分かった。', 'やり方が分かりました。'],
  ['ひらがなを覚えた。', 'ひらがなを覚えました。'],
  ['プールで泳いだ。', 'プールで泳ぎました。'],
  ['意欲的だった。', '意欲的でした。'],
  ['一人で準備ができる。', '一人で準備ができます。'],
  ['自分から話しかけるようになった。', '自分から話しかけるようになりました。'],
  ['すでに敬体で書きました。', 'すでに敬体で書きました。'],
  ['「ありがとう。」と言った。', '「ありがとう。」と言いました。'],
].forEach(([a,b])=>eq(A.kkPolite(a), b, `敬体：${a}`));

/* 2. 種類の見分け */
[
  ['教師の話を最後まで聞き、問いに答えることができた', 'pos'],
  ['後期も支援していきたい', 'teacher'],
  ['今後も指導が必要である', 'teacher'],
  ['後期に評価を記述する', 'teacher'],
  ['個別に声をかけて取り組ませた', 'teacher'],
  ['作品を完成させた', 'act'],
  ['長い文を読むことは難しかった', 'issue'],
  ['友達の物を取ってしまうことがあった', 'issue'],
  ['友達と一緒に歌った', 'act'],
  ['ひらがなの視写', 'memo'],
].forEach(([a,b])=>eq(A.kkKind(a), b, `種類：${a}`));

/* 3. 「〜が、〜」は肯定の側 */
eq(A.kkPart('ひらがなを形よく書くことは難しかったが、手本を見ながら名前を書けるようになった').t, '手本を見ながら名前を書けるようになった', 'が、→後ろ');
eq(A.kkPart('たし算はできたが、ひき算は難しかった').t, 'たし算はできた', 'が、→前');
eq(A.kkPart('友達が、声をかけてくれた').part, '', '主語の「が、」では切らない');

/* 4. 書き癖 */
eq(A.kkFix('本児なりに最後まで取り組んだ', '').t, '自分なりに最後まで取り組んだ', '本児なりに');
eq(A.kkFix('本児は、友達に教えてあげた', '').t, '友達に教えた', '本児は／てあげた');
eq(A.kkFix('下級生に説明してあげることができた', '').t, '下級生に説明することができた', 'してあげる');
eq(A.kkFix('友達に本を貸してあげることができた', '').kuse, true, '直しきれない「てあげる」は要確認');

/* 5. 1文ずつに分ける */
eq(A.kkSplit('・数を数えた。\n○10まで言えた。「はい。」と答えた。').map(x=>x.t).join('|'), '数を数えた。|10まで言えた。|「はい。」と答えた。', '分割');
eq(A.kkSplit('※面談で確認すること')[0].memo, true, '※はメモ');

/* 6. 要確認・既定の選択 */
const S = ev => A.kkSentsOf({ ev }, 0, '');
eq(S('給食を残さず食べることができた。')[0].on, false, '健康（食事の量）は既定で外す');
eq(S('給食を残さず食べることができた。')[0].chk.join(), 'health', '健康の印');
eq(S('ひまわり学級の友達とゲームをすることができた。')[0].chk.join(), 'name', '学級名の印');
eq(S('ひまわり学級の友達とゲームをすることができた。')[0].on, true, '学級名は既定で使う');
eq(S('友達のたろうくんと遊ぶことができた。')[0].chk.join(), 'name', '人名の印');
eq(S('交流学級で、友達と音読をすることができた。')[0].chk.join(), '', '交流学級は固有名ではない');
eq(S('お店の人に質問することができた。')[0].chk.join(), '', 'お店の人');

/* 7. 欄の組み立て */
const rec = { kk:{ blocks:[
  { sec:'ko', ev:'教師の話を最後まで聞き、問いに答えることができた。', sup:{k:'table', id:'kiku3'} },
  { sec:'ko', ev:'ひらがなを形よく書くことは難しかったが、手本を見ながら自分の名前を書けるようになった。後期も支援していきたい。', sup:{k:'item'} },
  { sec:'ko', ev:'ふりがなを付けた文章を、すらすらと読むことができた。', sup:{k:'table', id:'yomu4'} },
  { sec:'sa', ev:'具体物を使って、繰り上がりのないたし算ができた。後期も支援していきたい。', sup:{k:'table', id:'yomu1'} },
  { sec:'sa', ev:'', sup:{k:'none'} },
], pick:{} } };
const r1 = A.kkCompose(rec, 'ko', { len:150, subject:A.SUB_BY_KEY.ko });
eq(r1.text, '名前を呼んでから伝えると、教師の話を最後まで聞き、問いに答えることができました。また、手本を見ながら自分の名前を書けるようになりました。ふりがなを付けた文章を、すらすらと読むことができました。', '国語の組み立て');
eq(r1.n.teacher, 1, '教師の方針の文を外した数');
const r2 = A.kkCompose(rec, 'sa', { len:150, name:'児童01さん' });
eq(r2.text, '児童01さんは、具体物を使って、繰り上がりのないたし算ができました。', '呼び方（1文目に手立ては付けない）');
const r3 = A.kkCompose({ kk:{ blocks:[{ sec:'sa', ev:'数を数えることができた。10までのたし算ができた。', sup:{k:'table', id:'yomu1'} }], pick:{} } }, 'sa', { len:150 });
eq(r3.text, '読み方を一緒に確かめると、数を数えることができました。10までのたし算ができました。', '手立ての言い回しはブロックの最初の文に1回');
const r4 = A.kkCompose(rec, 'ko', { len:60 });
eq(r4.sents.filter(s=>s.use).length, 2, '字数を超えたら外す（各ブロックの最初の文を残し、後ろから）');
eq(r4.sents.find(s=>s.cut).b, 2, '外したのは最後のブロック');
const recP = JSON.parse(JSON.stringify(rec)); recP.kk.pick = { '1.1': 1 };
eq(A.kkCompose(recP, 'ko', { len:500 }).text.includes('後期も支援していきたい'), true, '担任が選んだ文は入る（言い換えはしない）');
const r5 = A.kkCompose({ kk:{ blocks:[{ sec:'sh', ev:'町たんけんで、お店の人に質問することができた。', sup:{k:'table', id:'yomu1'} }], pick:{} } }, 'sh', { len:150 });
eq(r5.text, '町たんけんで、読み方を一緒に確かめると、お店の人に質問することができました。', '場面の後ろに手立てを入れる');
eq(A.kkHas(rec, 'sa'), true, 'kkHas');
eq(A.kkHas(rec, 'on'), false, 'kkHas（計画にない欄）');

console.log(`${n - ng} / ${n} OK`);
process.exit(ng ? 1 : 0);
