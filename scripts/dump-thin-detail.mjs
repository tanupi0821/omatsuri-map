import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { ROOT } from './import/_lib.mjs';

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e.endsWith('.yml')) out.push(p);
  }
  return out;
}

const thin = [];
for (const p of walk(join(ROOT, 'data', 'festivals'))) {
  const f = parse(readFileSync(p, 'utf8'));
  const o = f.occurrences?.[0] ?? {};
  const bits = {
    住所: !!f.venue?.address,
    緯度経度: f.venue?.lat != null && f.venue?.lng != null,
    開始時刻: !!o.start_time,
    主催: !!f.organizer,
    最寄駅: !!f.station,
    リンク: (f.links ?? []).length > 0,
    写真: (f.photos ?? []).length > 0,
    説明: !!f.description,
    屋台: f.stalls === 'yes' || f.stalls === true || f.stalls === 'no',
  };
  const realVenue = f.venue?.name && !/^.+[市区町村]内$/.test(f.venue.name);
  if (!realVenue && !Object.values(bits).some(Boolean)) {
    thin.push({
      path: p.replace(ROOT, ''),
      id: f.id, name: f.name, kind: f.kind, scale: f.scale,
      pref: f.area?.pref, city: f.area?.city, ward: f.area?.ward,
      venue: f.venue?.name,
      source_url: o.source_url, source_name: o.source_name,
      dates: o.dates,
    });
  }
}
writeFileSync(
  'C:/Users/tanup/AppData/Local/Temp/claude/C--Users-tanup-Documents-claude-code/94de0851-d318-4c52-9f09-0a68a49d7423/scratchpad/thin-detail.json',
  JSON.stringify(thin, null, 2),
);
console.log('total thin:', thin.length);
