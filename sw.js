/* ==================================================================
   所見文アシスト オフライン対応（Service Worker）
   ------------------------------------------------------------------
   ねらい：ネットで一度開いた端末なら、あとでネットがつながらなくても
           アプリの画面を開けるようにする。

   しくみ：
   ・ネットで開いたとき、3つの版（標準・外国語活動・特別支援学級）の
     HTMLをブラウザの中の「保存場所（Cache Storage）」にしまう。
   ・画面を開くときは、まずネットから最新版を取りに行く（取れたら保存し直す）。
     ネットがない・つながりが遅い（NET_WAIT_MS を超える）ときは、しまっておいた版を出す。
     → ネットがあるときは、いつも最新版が使える。

   扱うのは「アプリの画面（HTML）」だけ。
   児童名・所見などの入力内容は、ここでは一切扱わない（送信もしない）。
   入力内容は、これまでどおり各HTMLの中で localStorage と作業ファイルに保存される。

   後任の方へ：
   ・HTMLを更新するとき、このファイルを書き換える必要はない（ネット優先で取り直すため）。
   ・版を増やしたら PAGES に足す。
   ・しくみを大きく変えたら CACHE_NAME の末尾の番号を上げる（古い保存は自動で消える）。
   ================================================================== */

const CACHE_PREFIX = 'shoken-assist-';
const CACHE_NAME   = CACHE_PREFIX + 'pages-v1';

// しまっておく画面（このファイルの置き場所から見た位置）
const PAGES = ['./', './fl/', './sn/'];

// ネットからの返事をこの時間（ミリ秒）だけ待つ。超えたら、しまっておいた版を出す
const NET_WAIT_MS = 4000;

/* 同じ画面のURLを1つの形にそろえる。
   例）/sn・/sn/・/sn/index.html → /sn/ 　（どの開き方でも同じ保存を使うため） */
function pageKey(url){
  const u = new URL(url);
  let p = u.pathname.replace(/index\.html$/, '');
  if(!p.endsWith('/') && !/\.[a-z0-9]+$/i.test(p)) p += '/';
  return u.origin + p;
}

// ---- 入れたとき：3つの版をまとめてしまう（1つ失敗しても、ほかは続ける） ----
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(PAGES.map(async rel => {
      const key = pageKey(new URL(rel, self.location).href);
      const res = await fetch(key, {cache: 'no-store'});
      if(res.ok) await cache.put(key, res);
    }));
    await self.skipWaiting();   // 待たずにすぐ使い始める
  })());
});

// ---- 使い始めるとき：古い保存を消し、開いている画面もすぐ受け持つ ----
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter(n => n.startsWith(CACHE_PREFIX) && n !== CACHE_NAME)
      .map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

// ---- 画面を開くとき：ネット優先、だめなら保存した版 ----
self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;
  if(req.mode !== 'navigate') return;                       // 画面（HTML）を開くときだけ扱う
  if(new URL(req.url).origin !== self.location.origin) return;

  event.respondWith((async () => {
    const key = pageKey(req.url);
    const cache = await caches.open(CACHE_NAME);

    // ネットから取りに行く。取れたら保存し直す（次にネットがないときのため）
    const net = fetch(req).then(res => {
      if(res.ok && res.type === 'basic'){
        const copy = res.clone();
        event.waitUntil(cache.put(key, copy).catch(() => {}));
      }
      return res;
    });
    event.waitUntil(net.then(() => {}, () => {}));   // 返事が遅れても保存し直しまで続ける

    const cached = await cache.match(key);
    if(!cached) return net;                           // まだしまっていなければ、ネットを待つ

    const timer = new Promise(r => setTimeout(() => r(null), NET_WAIT_MS));
    try{
      const res = await Promise.race([net, timer]);
      return res || cached;                           // 時間切れなら保存した版
    }catch(e){
      return cached;                                  // ネットがなければ保存した版
    }
  })());
});
