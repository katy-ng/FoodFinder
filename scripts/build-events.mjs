import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const NY = 'America/New_York';
const MAP_DAY = '2025-11-14';

function nyYmd(iso) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: NY,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function orgSummary(e) {
  const ids = Array.isArray(e.organizationIds) ? e.organizationIds : [];
  const primary = e.submittedByOrganizationId;
  if (ids.length > 1) {
    return `${ids.length} co-hosting student organizations (primary Engage org ID ${primary})`;
  }
  return `Student organization (Campus Engage org ID ${primary})`;
}

function reservationsText(e) {
  const r = e.rsvpSettings;
  if (!r) return 'See event description or Campus Engage for attendance details.';
  if (r.isInviteOnly) return 'Invite-only — RSVP required through Campus Engage.';
  const n = typeof r.totalRsvps === 'number' ? r.totalRsvps : 0;
  const hasForm = Boolean(r.questions && String(r.questions).trim());
  if (hasForm) {
    return n > 0
      ? `RSVP / reminder available on Campus Engage (${n} responses recorded).`
      : 'RSVP / acknowledgment may be requested on Campus Engage.';
  }
  if (n > 0) {
    return `Optional RSVP on Campus Engage · ${n} students have RSVP’d.`;
  }
  return 'No RSVP required (confirm any limits in the full description).';
}

function parseCoord(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number.parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

function loadCsvCoords(csvPath) {
  const raw = readFileSync(csvPath, 'utf8');
  const rows = parse(raw, { columns: true, skip_empty_lines: true, relax_quotes: true });

  /** @type {Map<number, { lat: number, lng: number }>} */
  const byId = new Map();
  /** @type {Map<string, { sumLat: number, sumLng: number, n: number }>} */
  const byLocation = new Map();

  for (const row of rows) {
    if (row.benefit !== 'FreeFood') continue;
    const id = Number.parseInt(String(row.id), 10);
    const lat = parseCoord(row.address_latitude);
    const lng = parseCoord(row.address_longitude);
    const loc = (row.address_name || '').trim();

    if (Number.isFinite(id) && lat != null && lng != null) {
      if (!byId.has(id)) byId.set(id, { lat, lng });
    }

    if (loc && lat != null && lng != null) {
      const key = loc.toLowerCase();
      const cur = byLocation.get(key) || { sumLat: 0, sumLng: 0, n: 0 };
      cur.sumLat += lat;
      cur.sumLng += lng;
      cur.n += 1;
      byLocation.set(key, cur);
    }
  }

  const locationAvg = new Map();
  for (const [k, v] of byLocation) {
    locationAvg.set(k, { lat: v.sumLat / v.n, lng: v.sumLng / v.n });
  }

  return { byId, locationAvg };
}

function coordsForEvent(e, csv) {
  const a = e.address || {};
  let lat = parseCoord(a.latitude);
  let lng = parseCoord(a.longitude);

  if (lat == null || lng == null) {
    const fromId = csv.byId.get(e.id);
    if (fromId) {
      lat = fromId.lat;
      lng = fromId.lng;
    }
  }

  if (lat == null || lng == null) {
    const name = (a.name || '').trim().toLowerCase();
    if (name) {
      const avg = csv.locationAvg.get(name);
      if (avg) {
        lat = avg.lat;
        lng = avg.lng;
      }
    }
  }

  // Campus centroid fallback (Academic Mall area) — only so pins remain discoverable
  if (lat == null || lng == null) {
    const jitter = (e.id % 97) * 0.00008;
    return { lat: 40.915 + jitter, lng: -73.122 - jitter, approximate: true };
  }

  return { lat, lng, approximate: false };
}

const jsonPath = join(root, 'fall2025_events_filtered.json');
const csvPath = join(root, 'fall2025_events_filtered_unnested.csv');
const outDir = join(root, 'public');
const outFile = join(outDir, 'events.json');

const events = JSON.parse(readFileSync(jsonPath, 'utf8'));
const csv = loadCsvCoords(csvPath);

const freeFood = events.filter(
  (e) => Array.isArray(e.benefits) && e.benefits.includes('FreeFood'),
);

const normalized = freeFood.map((e) => {
  const addr = e.address || {};
  const cats = Array.isArray(e.categories) ? [...e.categories] : [];
  if (cats.length === 0 && e.theme) cats.push(e.theme);

  const { lat, lng, approximate } = coordsForEvent(e, csv);
  const startKey = nyYmd(e.startsOn);

  return {
    id: e.id,
    name: e.name,
    descriptionPlain: stripHtml(e.description),
    descriptionHtml: e.description,
    startsOn: e.startsOn,
    endsOn: e.endsOn,
    categories: cats,
    theme: e.theme || 'General',
    organization: orgSummary(e),
    locationName: addr.name || 'Location on campus',
    locationAddress: addr.address || addr.line1 || undefined,
    latitude: lat,
    longitude: lng,
    coordinatesApproximate: approximate,
    imageUrl: e.imageUrl || '',
    reservations: reservationsText(e),
    mapDayStartNy: startKey,
    onMapSampleDay: startKey === MAP_DAY,
  };
});

normalized.sort((a, b) => new Date(a.startsOn) - new Date(b.startsOn));

mkdirSync(outDir, { recursive: true });
writeFileSync(
  outFile,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      mapFilterNote:
        'Map pins are limited to events whose start date (America/New_York) is 2025-11-14.',
      mapDay: MAP_DAY,
      events: normalized,
    },
    null,
    0,
  ),
);

const onMap = normalized.filter((x) => x.onMapSampleDay);
console.log(
  `events.json: ${normalized.length} free-food events; ${onMap.length} on map (${MAP_DAY} start, America/New_York).`,
);
