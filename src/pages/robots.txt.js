/**
 * robots.txt
 *
 * sitemap の URL は公開先によって変わる。public/ に置くと直し忘れるので、
 * astro.config.mjs の `site` から組み立てて出す。
 */
export function GET({ site }) {
  const body = [
    'User-agent: *',
    'Allow: /',
    // **検索ページの絞り込み結果はクロールさせない。**
    // `/search/?pref=富山県&city=射水市` のような組み合わせは事実上無限にあり、
    // 中身は `/a/<県>/<市>/` と同じ。canonical で `/search/` に寄せてはいるが、
    // Google はそれでも 1 本ずつ取りに来る（131 本が「代替ページ」として計上された）。
    // 新しいサイトはクロール量を絞られていて、いま 3,421 ページが
    // 「検出したがまだ登録していない」状態。**その予算を実ページに回す。**
    // `/search/` 本体には `?` が無いので、これでは塞がれない
    'Disallow: /search/?',
    '',
    `Sitemap: ${new URL('sitemap-index.xml', site).href}`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
