/**
 * robots.txt と Content-Signal の判定
 *
 * REST API から取る `gotouti-media.mjs` と RSS から取る `gotouti-rss.mjs` の
 * 両方で同じ判定が要る。**ここを緩めると相手の意思を無視することになる**ので
 * 1 か所にまとめておく。
 */

export const UA = 'matsuri-map/0.1 (local festival directory; polite crawler)';
export const MIN_DELAY = 2000;

/**
 * **証明書が切れている・ホスト名が合っていない媒体が 82 ある。**
 * 個人や小さな団体の運営なので珍しくない。https が TLS で失敗したときだけ
 * http に落として試す（内容は公開情報なので、暗号化の有無は取得可否に影響しない）。
 */
export const TLS_ERR = /CERT|TLS|SSL|ERR_SSL/i;

export async function fetchMaybeHttp(url, timeout = 20000) {
  try {
    return await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(timeout) });
  } catch (e) {
    const code = e?.cause?.code ?? e?.code ?? '';
    if (!TLS_ERR.test(String(code))) throw e;
    return fetch(String(url).replace(/^https:/, 'http:'), {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(timeout),
      redirect: 'follow',
    });
  }
}

/**
 * robots.txt を読んで {allowed, delayMs, aiTrainNo} を返す。
 *
 * @param {string} host
 * @param {string} path 許可を確かめたいパス（`/wp-json/` や `/feed/`）
 *
 * **Content-Signal は robots.txt の中にコメント風の行として書かれる**ので
 * ファイル全体から探す。`ai-train=no` を宣言している媒体は使わない。
 */
export async function robots(host, path = '/') {
  let text = '';
  try {
    const r = await fetchMaybeHttp(`https://${host}/robots.txt`);
    // robots.txt が無い（404）＝制限なし
    if (!r.ok) return { allowed: true, delayMs: MIN_DELAY, aiTrainNo: false };
    text = await r.text();
  } catch (e) {
    // **名鑑には既に消えた媒体が混ざっている**。DNS が引けないものは
    // 「robots が読めない」ではなく「媒体が無い」。理由を分けて記録する
    const code = e?.cause?.code ?? e?.name ?? '';
    const gone = code === 'ENOTFOUND' || /getaddrinfo/.test(String(e?.cause?.message ?? ''));
    return {
      allowed: false,
      delayMs: MIN_DELAY,
      aiTrainNo: false,
      err: gone ? '媒体が消えている（DNS不可）' : `robots取得不可 (${code})`,
    };
  }
  // HTML が返ってきたら robots.txt ではない（SPA の 200 ページ）
  if (/<html/i.test(text)) return { allowed: true, delayMs: MIN_DELAY, aiTrainNo: false };

  const aiTrainNo = /ai-train\s*=\s*no/i.test(text);

  const lines = text.split(/\r?\n/).map((l) => l.replace(/#.*$/, '').trim());
  // `User-agent: *` の塊だけを見る。自分の名前を名指しした塊は普通は無い
  let applies = false;
  const disallow = [];
  let delay = 0;
  for (const l of lines) {
    const m = l.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const val = m[2].trim();
    if (key === 'user-agent') { applies = val === '*'; continue; }
    if (!applies) continue;
    if (key === 'disallow' && val) disallow.push(val);
    if (key === 'crawl-delay') delay = Math.max(delay, Number(val) * 1000 || 0);
  }
  const blocked = disallow.some((d) => path.startsWith(d) || d === '/');
  return { allowed: !blocked, delayMs: Math.max(MIN_DELAY, delay), aiTrainNo };
}
