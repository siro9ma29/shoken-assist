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
vm.runInContext(core + '\n' + kk + '\nthis.API = { kkPutPhrase, kkSplit, kkKind, kkPart, kkPolite, kkFix, kkSentsOf, kkCompose, kkHas, kkPending, kkResolve, kkResetPick, kkNameKey, kkMatch, kkDupTo, kkKeepSecs, kkRedoPlan, SUB_BY_KEY };', ctx);
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

/* 8. 要確認の文（SN v1.7〜） */
const recC = { kk:{ blocks:[
  { sec:'ko', ev:'さくら学級で、友達と音読することができた。給食を残さず食べることができた。進んで手を挙げた。', sup:{k:'none'} },
  { sec:'sa', ev:'数を数えることができた。', sup:{k:'none'} },
], pick:{} } };
const c1 = A.kkCompose(recC, 'ko', { len:150 });
eq(A.kkPending(c1).map(s=>s.key).join(), '0.0,0.1', '要確認が残っている文（固有の名前・健康）');
eq(c1.n.pend, 2, 'n.pend');
eq(c1.sents.find(s=>s.key==='0.1').use, false, '健康の文は既定で使わない');
recC.kk.pick['0.0'] = 0;
eq(A.kkPending(A.kkCompose(recC, 'ko', { len:150 })).length, 1, '担任が決めた文は要確認から外れる');
eq(A.kkCompose(recC, 'ko', { len:150 }).text.includes('さくら学級'), false, '外した文は入らない');
eq(A.kkResolve(recC, 'ko', { len:150 }), 1, 'OKで残りを確定した数');
eq(recC.kk.pick['0.1'], 0, '確定はいまの選び方のまま（健康の文は使わない）');
eq(A.kkPending(A.kkCompose(recC, 'ko', { len:150 })).length, 0, '確定後は要確認なし');
eq(A.kkResolve(recC, 'sa', { len:150 }), 0, '要確認のない欄は何もしない');
recC.kk.pick['1.0'] = 0;
A.kkResetPick(recC, 'ko');
eq(Object.keys(recC.kk.pick).join(), '1.0', 'おすすめに戻すのは、その欄の文だけ');

/* 7. 計画と児童の照合（SN v1.9〜）。氏名はすべて架空 */
eq(A.kkNameKey('髙橋　一郎さん'), '高橋一郎', '照合の名前：敬称・空白・異体字');
{
  const stu = [ { id:'a', no:'1', name:'青木 一郎さん' }, { id:'b', no:'2', name:'花子さん' }, { id:'c', no:'3', name:'' } ];
  const plans = [
    { name:'青木　一郎', noFromFile:'' },      // 氏名が一致
    { name:'山田 花子', noFromFile:'' },       // 名だけ一致
    { name:'', noFromFile:'3' },               // 番号
    { name:'架空 太郎', noFromFile:'' },       // 見つからない
    { name:'青木一郎', noFromFile:'' },        // 同じ児童がもう1つ
  ];
  const m = A.kkMatch(plans, stu, null);
  eq(m.assign.map(a=>a.to + '/' + a.how + (a.check?'!':'')).join(' '), 'rec:a/name rec:b/part! rec:c/no new/ rec:a/name', '名簿なしの照合');
  eq([...A.kkDupTo(m.assign)].join(), 'rec:a', '同じ児童に2つの計画');
  const ros = [ { no:'1', name:'青木 一郎' }, { no:'4', name:'架空 太郎' }, { no:'5', name:'架空 次郎' } ];
  const m2 = A.kkMatch([ { name:'架空 太郎', noFromFile:'' }, { name:'', noFromFile:'5' }, { name:'', noFromFile:'3' }, { name:'別の 名前', noFromFile:'' } ], stu, ros);
  eq(m2.assign.map(a=>a.to + '/' + a.how + (a.check?'!':'')).join(' '), 'ros:4/name ros:5/no new/! new/!', '名簿ありの照合（名簿にない番号は使わない）');
  eq(m2.targets.filter(t=>t.src === 'ros').map(t=>t.no).join(), '4,5', '名簿の児童のうち学級にいない人だけが行き先に増える');
}
{
  /* 読み込み直し：手直し・OKの欄は残し、ほかは作り直す。評価がなくなった欄は消す */
  const sec = (o)=>Object.assign({ sel:[], out:'', okOut:'', hand:false }, o);
  const rec = { active:['ko','sa','on','gy','gk'], kk:{ blocks:[] }, secs:{
    ko: sec({ out:'前の国語' }), sa: sec({ out:'手で直した算数', hand:true }), on: sec({ out:'OKの音楽', okOut:'OKの音楽' }),
    zu: sec({}), gy: sec({ out:'項目の文', sel:[['x','a']] }), gk: sec({}), ta: sec({ out:'前の体育' }) } };
  rec.active.push('ta');
  eq(A.kkKeepSecs(rec).join(), 'sa,on', '残す欄（手直し・OK）');
  const kk = { blocks:[ { sec:'ko', ev:'新しい国語。' }, { sec:'sa', ev:'新しい算数。' }, { sec:'zu', ev:'新しい図工。' } ], pick:{} };
  const r = A.kkRedoPlan(rec, kk, (rc, k)=>'新:' + k);
  eq([rec.secs.ko.out, rec.secs.sa.out, rec.secs.on.out, rec.secs.zu.out, rec.secs.gy.out, rec.secs.ta.out].join('|'),
     '新:ko|手で直した算数|OKの音楽|新:zu|項目の文|', '読み込み直しの下書き');
  eq(r.drafted + '/' + r.kept.join(), '2/sa,on', '作った欄と残した欄');
  eq(rec.active.join(), 'ko,sa,on,zu,gy,gk', '使う欄（計画の欄＋作業のある欄）');
  /* はじめての取り込み：文章がある欄はそのまま */
  const rec2 = { active:['ko'], secs:{ ko: sec({ out:'先に書いた文' }), sa: sec({}), gy: sec({}), gk: sec({}) } };
  A.kkRedoPlan(rec2, { blocks:[ { sec:'ko', ev:'国語。' }, { sec:'sa', ev:'算数。' } ], pick:{} }, (rc, k)=>'新:' + k);
  eq(rec2.secs.ko.out + '|' + rec2.secs.sa.out, '先に書いた文|新:sa', 'はじめての取り込みは、文章のある欄を残す');
}

console.log(`${n - ng} / ${n} OK`);
process.exit(ng ? 1 : 0);
