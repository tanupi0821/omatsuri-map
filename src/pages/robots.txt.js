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
    '',
    `Sitemap: ${new URL('sitemap-index.xml', site).href}`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
