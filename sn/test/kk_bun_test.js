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
vm.runInContext(core + '\n' + kk + '\nthis.API = { kkPutPhrase, kkSplit, kkKind, kkPart, kkPolite, kkFix, kkSentsOf, kkCompose, kkHas, kkPending, kkResolve, kkResetPick, kkNameKey, kkMatch, kkDupTo, kkKeepSecs, kkRedoPlan, kkSubjKey, kkJoinItems, kkItemHits, kkItemTail, SUB_BY_KEY, scanMemo, lintDB };', ctx);
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

/* SN v1.10：実物の計画で見つかった形（文はすべて架空に作り直したもの） */
[
  ['紙を丸く切ることが難しく、気持ちも沈んだため、のりに変更した', 'teacher'],
  ['口を閉じるよう合図をして意識できるよう声をかけた', 'teacher'],
  ['机の上を片付けさせることで、集中をうながした', 'teacher'],
  ['話のあとに内容をたずねて、聞く意識づけをはかった', 'teacher'],
  ['教師が正しい言い方で言い直すことで修正した', 'teacher'],
  ['教師が声をかけることで、最後まで書くことができた', 'pos'],
  ['友達に声をかけた', 'act'],
  ['練習の時間を十分に確保することができた', 'teacher'],
  ['週の終わりに、集中が続かない傾向が見られる', 'issue'],
  ['気持ちを伝えることが難しく、教師の声掛けを必要とする場面が見られた', 'issue'],
  ['体のふらつきがあり、高い所の活動では苦労していた', 'issue'],
  ['手先の作業は苦手で、支援が必要な場面が多かった', 'issue'],
  ['反面、うまくいかないと返事をしなくなることがあった', 'issue'],
  ['自分で考えることが難しく、友達の言葉をそのまま言うことが多かった', 'issue'],
  ['広い場所で気が散ることはあるものの、周りを見て動くことができた', 'pos'],
].forEach(([a,b])=>eq(A.kkPart(a).kind, b, `種類（v1.10）：${a}`));
eq(A.kkPart('５まではできたが６からは誤答があった').t, '５まではできた', '読点のない「できたが」→前');
eq(A.kkPart('相手が嫌がることをしない大切さを理解できたが、毎日の生活では支援を必要とする場面が見られた').t, '相手が嫌がることをしない大切さを理解できた', '「相手が嫌がる」は課題の語にしない');
eq(A.kkPart('その都度、言葉遣いを教えてきたが、今後も指導が必要').kind, 'teacher', '教師の行動＋様子は教師の行動');
eq(A.kkPart('名前を書こうとする意識は見られるが、形を整えることは難しかった').t, '名前を書こうとする意識が見られる', '前だけ使うときは対比の「は」を「が」に');
eq(A.kkPart('善悪を判断することはできるが、行動を抑えることは難しかった').t, '善悪を判断することができる', '「ことは」も「ことが」に');
eq(A.kkPart('発音を聞かせて修正をはかっている').kind, 'teacher', '「〜をはかっている」は教師の行動');
eq(A.kkPolite('意識づけをはかった'), '意識づけをはかりました。', '敬体：をはかった');
{
  const s = A.kkSentsOf({ ev:'･ひらがなを読めるようになった。', sup:{k:'none'} }, 0, '');
  eq(s[0].text, 'ひらがなを読めるようになりました。', '行頭の半角の中黒を取る');
  const h = A.kkSentsOf({ ev:'自分で食べられる量を減らしてもらうことができた。', sup:{k:'none'} }, 0, '');
  eq(h[0].chk.join(), 'health', '食べる量は健康・家庭');
  const n1 = A.kkSentsOf({ ev:'知的学級の学習で、楽しく歌うことができた。', sup:{k:'none'} }, 0, '');
  eq(n1[0].names.join(), '知的学級', '学級の種類は要確認');
  const n2 = A.kkSentsOf({ ev:'団体種目の「東小タイフーン」に参加することができた。', sup:{k:'none'} }, 0, '');
  eq(n2[0].names.join(), '東小', '学校名入りの種目名');
}

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
eq(A.kkPart('たし算はできたが、ひき算は難しかった').t, 'たし算ができた', 'が、→前（対比の「は」は「が」に）');
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
  eq(m2.assign.map(a=>a.to + '/' + a.how + (a.check?'!':'')).join(' '), 'ros:1/name ros:2/no new/! new/!', '名簿ありの照合（名簿にない番号は使わない）');
  eq(m2.targets.filter(t=>t.src === 'ros').map(t=>t.no).join(), '4,5', '名簿の児童のうち学級にいない人だけが行き先に増える');
  /* 学年ごとに番号が振られた名簿（特別支援学級）：番号が重なっても別の児童として扱い、番号は同じ学年とだけ合わせる */
  const ros3 = [ { no:'1', name:'架空 一子', year:1 }, { no:'2', name:'架空 二郎', year:1 }, { no:'2', name:'架空 三太', year:4 }, { no:'2', name:'架空 四季', year:5 } ];
  const m3 = A.kkMatch([ { name:'架空 三太', noFromFile:'', grade:4 }, { name:'架空 四季', noFromFile:'', grade:5 }, { name:'', noFromFile:'2', grade:1 }, { name:'', noFromFile:'1', grade:0 } ], [], ros3);
  eq(m3.assign.map(a=>a.to + '/' + a.how).join(' '), 'ros:2/name ros:3/name ros:1/no ros:0/no', '学年ごとの番号の名簿：氏名で別の児童に・番号は同じ学年と');
  eq(new Set(m3.targets.map(t=>t.to)).size, 4, '番号が重なっても行き先は別');
  /* 同じ番号で始まるファイル名が2つ以上あるときは、その番号を出席番号として使わない */
  const m4 = A.kkMatch([ { name:'', noFromFile:'2', grade:1 }, { name:'', noFromFile:'2', grade:1 } ], [], ros3);
  eq(m4.assign.map(a=>a.to + '/' + a.how).join(' '), 'new/ new/', 'ファイル名の番号が重なるときは使わない');
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

{
  /* SN v1.12：項目を足した欄の読み込み直し。選んだ項目はそのままで、計画の文章を作り直す */
  const sec = (o)=>Object.assign({ sel:[], out:'', okOut:'', hand:false }, o);
  const rec = { active:['ko','sa','gy','gk'], kk:{ blocks:[ { sec:'ko', ev:'前の国語。' }, { sec:'sa', ev:'前の算数。' } ] }, secs:{
    ko: sec({ out:'前の国語＋項目', sel:[['x','a']] }),
    sa: sec({ out:'OKの算数＋項目', okOut:'OKの算数＋項目', sel:[['x','a']] }),
    gy: sec({ out:'項目だけ', sel:[['x','a']] }), gk: sec({}) } };
  eq(A.kkKeepSecs(rec).join(), 'sa', '残す欄（項目を足した欄のOKも数える）');
  A.kkRedoPlan(rec, { blocks:[ { sec:'ko', ev:'新しい国語。' } ], pick:{} }, (rc, k)=>'新:' + k);
  eq([rec.secs.ko.out, rec.secs.sa.out, rec.secs.gy.out].join('|'), '新:ko|OKの算数＋項目|項目だけ', '項目を足した欄の読み込み直し');
  eq(rec.secs.ko.sel.length, 1, '読み込み直しで選んだ項目は消さない');
}
/* SN v1.12：計画の文章と項目の文章のつなぎ */
[
  ['計画の文です。', '項目の文です。', '計画の文です。また、項目の文です。'],
  ['計画の文です。また、二つ目です。', '項目の文です。', '計画の文です。また、二つ目です。項目の文です。'],
  ['計画の文です。', 'また、項目の文です。', '計画の文です。また、項目の文です。'],
  ['計画の文です。', '項目の文です。また、次です。', '計画の文です。項目の文です。また、次です。'],
  ['', '〇〇さんは、項目の文です。', '〇〇さんは、項目の文です。'],
  ['計画の文です。', '', '計画の文です。'],
].forEach(([a,b,c])=>eq(A.kkJoinItems(a, b), c, `つなぎ：${a}＋${b}`));

/* 外国語・外国語活動の振り分け（SN v1.11〜） */
[
  ['外国語', 6, 'gg'], ['外国語', 5, 'gg'], ['外国語', 4, 'ga'], ['外国語', 0, 'gg'],
  ['外国語活動', 3, 'ga'], ['外国語活動', 5, 'gg'], ['外国語活動', 0, 'ga'],
].forEach(([nm, g, want])=>eq(A.kkSubjKey(nm, g).key, want, `欄の振り分け：${nm}（${g}年）`));
eq(!!A.SUB_BY_KEY.gg && A.SUB_BY_KEY.gg.name, '外国語', '外国語の欄がある');
/* 交流及び共同学習の書き方の違い（SN v1.15〜） */
['交流及び共同学習','交流および共同学習','交流\nおよび\n共同学習','（交流学級）'].forEach(nm=>eq(A.kkSubjKey(nm, 2).key, 'prev', `欄の振り分け：${nm.replace(/\n/g,'⏎')}→直前の教科`));

/* 計画の文に同じ内容がありそうな項目（SN v1.13〜）。use の文だけ・2文字以上の語だけで見る */
{
  const S = (text, use)=>({ text, src: text, use });
  const ids = (sents, k)=>[...A.kkItemHits(sents, A.SUB_BY_KEY[k]).keys()].sort().join(',');
  eq(ids([S('たし算の計算ができました。', true)], 'sa'), 'sa3', '計画の文にあり：算数のたし算');
  eq(ids([S('たし算の計算ができました。', false)], 'sa'), '', '計画の文にあり：使わない文は見ない');
  eq(ids([S('自分の名前を書くことができました。', true), S('友達の話を最後まで聞くことができました。', true)], 'ko').split(',').includes('ko9'), true, '計画の文にあり：名前を書く');
  eq(ids([S('友達の話を最後まで聞くことができました。', true)], 'ko').split(',').includes('ko2'), true, '計画の文にあり：話を聞く');
  eq(ids([S('楽しく過ごしました。', true)], 'sa'), '', '計画の文にあり：当たらない文');
  eq(A.kkItemHits([S('たし算ができました。', true)], null).size, 0, '計画の文にあり：欄がないとき');
  eq(ids([S('好きな食べ物を英語で伝えることができました。', true)], 'gg'), 'gg2', '計画の文にあり：項目の文の終わり（英語で伝え）');
  eq(A.kkItemTail('教師や友達の話を最後まで聞く'), '最後まで聞', '項目の文の終わり');
  eq(A.kkItemTail('整理整頓や掃除をする'), '', '項目の文の終わり：短いときは使わない');
}

/* 項目の追加（SN v1.14〜）。個別の指導計画10人分から足した項目に印が付くか（文はすべて架空） */
{
  const S = (text)=>({ text, src: text, use: true });
  const has = (text, k, id)=>[...A.kkItemHits([S(text)], A.SUB_BY_KEY[k]).keys()].includes(id);
  [
    ['漢字を覚えて書くことができました。', 'ko', 'ko20'],
    ['ひらがなを読めるようになりました。', 'ko', 'ko17'],
    ['正しい持ち方で鉛筆を持って書けるようになりました。', 'ko', 'ko18'],
    ['九九を使ってかけ算ができました。', 'sa', 'sa14'],
    ['〇時、〇時半の時刻を読めるようになりました。', 'sa', 'sa7'],
    ['リコーダーの指づかいに気を付けて練習しました。', 'on', 'on9'],
    ['サーキット運動で３分間走り続けることができました。', 'ta', 'ta11'],
    ['運動会の踊りの練習に意欲的に取り組みました。', 'ta', 'ta10'],
    ['よい言葉を選択肢から選ぶ学習で、ぽかぽか言葉を選べました。', 'do', 'do10'],
    ['畑で野菜の収穫に取り組みました。', 'se', 'se11'],
    ['日直の仕事に喜んで取り組みました。', 'tk', 'tk8'],
    ['課題の解決に向けて、友達と取り組みました。', 'so', 'so8'],
    ['教師や友達と一緒にキャッチボールをして遊びました。', 'ji', 'ji7'],
    // 交流学級・集団での学習（各教科に同じ4項目）
    ['全体指示を聞いて、活動することができました。', 'sa', 'sa18'],
    ['周りの児童の動きを参考にして活動しました。', 'zu', 'zu15'],
    ['交流学級で、大勢の友達との活動を楽しみました。', 'on', 'on16'],
    ['困っていることを教師に伝えようとしました。', 'gg', 'gg13'],
  ].forEach(([t, k, id])=>eq(has(t, k, id), true, `項目の追加（v1.14）：${id} ← ${t}`));
  // まちがって印が付かないこと
  eq(has('音に合わせて正しく歌うことができました。', 'on', 'on15'), false, '項目の追加（v1.14）：「音に合わせて」は「友達の動きを見てまねる」に当てない');
  eq(A.lintDB().join(' / '), '', '文例データの点検（ID の重複・KW の登録・act の文末）');
}

/* メモ読み取り：交流学級・集団での学習の項目は、文に教科名があるときだけ候補にする（SN v1.14〜） */
{
  const kou = (memo)=>A.scanMemo(memo, ['ko','sa','on','zu','ta','do']).filter(h=>h.cat === '交流学級・集団での学習').map(h=>h.id).sort().join(',');
  eq(kou('大勢の友達と一緒に活動を楽しんだ。'), '', 'メモ：教科名がないと交流の項目は候補にしない');
  eq(kou('音楽では、大勢の友達と一緒に活動を楽しんだ。'), 'on16', 'メモ：教科名がある欄の交流の項目だけ候補にする');
  eq(kou('図工の時間に、友達の動きを見てまねた。'), 'zu15', 'メモ：図工（略した名前）でも見分ける');
}

/* セルの中の折り返しの改行をつなぐ（SN v1.15〜。文はすべて架空） */
{
  const sp = ev => A.kkSplit(ev).map(x=>x.t).join('|');
  eq(sp('・先生の話を最後まで聞くこ\nとができた。\n・計算カードを使っ\nて練習した。'), '先生の話を最後まで聞くことができた。|計算カードを使って練習した。', '折り返し：文の途中の改行はつなぐ');
  eq(sp('ひらがなを読むことができた。\n絵本を楽しんで読んだ。'), 'ひらがなを読むことができた。|絵本を楽しんで読んだ。', '折り返し：「。」のあとの改行ではつながない');
  eq(sp('・係の仕事をした\n・発表をした'), '係の仕事をした|発表をした', '折り返し：次の行が「・」で始まればつながない');
  eq(sp('①数を数えることができ\nた。\n②形を見分けた。'), '数を数えることができた。|形を見分けた。', '折り返し：丸数字の行');
  eq(sp('前の段落\n\n次の段落'), '前の段落|次の段落', '折り返し：空の行をはさむときはつながない');
  eq(A.kkPart(A.kkSplit('・話を聞く意識が低く、内容を理解できてい\nないことが多かった。')[0].t).kind, 'issue', '折り返し：つないだ文で種類を見分ける');
}

console.log(`${n - ng} / ${n} OK`);
process.exit(ng ? 1 : 0);
