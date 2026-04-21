import { useMemo, useState } from 'react';
import type { FoodEvent } from '../types';
import { formatEventRange } from '../lib/dates';
import { EventDialog } from './EventDialog';

interface Props {
  events: FoodEvent[];
}

const TOTAL_PIZZA_SLICES = 8;
const PIZZA_CENTER = 50;
const PIZZA_RADIUS = 44;

function toPolarPoint(angleDeg: number, radius: number) {
  const angleRad = (Math.PI / 180) * angleDeg;
  return {
    x: PIZZA_CENTER + radius * Math.cos(angleRad),
    y: PIZZA_CENTER + radius * Math.sin(angleRad),
  };
}

function buildSlicePath(sliceIndex: number) {
  const step = 360 / TOTAL_PIZZA_SLICES;
  const startAngle = -90 + sliceIndex * step;
  const endAngle = startAngle + step;
  const start = toPolarPoint(startAngle, PIZZA_RADIUS);
  const end = toPolarPoint(endAngle, PIZZA_RADIUS);

  return `M ${PIZZA_CENTER} ${PIZZA_CENTER} L ${start.x} ${start.y} A ${PIZZA_RADIUS} ${PIZZA_RADIUS} 0 0 1 ${end.x} ${end.y} Z`;
}

function getPreviewRemainingSlices(eventId: string | number) {
  const seed = String(eventId);
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % (TOTAL_PIZZA_SLICES + 1);
}

function getFoodStatusLabel(remainingSlices: number) {
  if (remainingSlices === 0) return 'All gone';
  if (remainingSlices <= 1) return 'Almost out';
  if (remainingSlices <= 3) return 'Running low';
  if (remainingSlices <= 5) return 'Going fast';
  return 'Plenty left';
}

export function Catalog({ events }: Props) {
  const [category, setCategory] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<FoodEvent | null>(null);

  const categories = useMemo(() => {
    const s = new Set<string>();
    for (const e of events) {
      for (const c of e.categories) s.add(c);
    }
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [events]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      if (category !== 'all' && !e.categories.includes(category)) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        e.descriptionPlain.toLowerCase().includes(q) ||
        e.locationName.toLowerCase().includes(q)
      );
    });
  }, [events, category, query]);

  return (
    <section className="panel" aria-labelledby="catalog-heading">
      <div className="panel__toolbar">
        <h2 id="catalog-heading" className="sr-only">
          Event catalog
        </h2>
        <label className="field">
          <span className="field__label">Search</span>
          <input
            type="search"
            className="input"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </label>
        <label className="field">
          <span className="field__label">Category</span>
          <select
            className="select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="panel__count" role="status" aria-live="polite">
        {filtered.length} / {events.length}
      </p>
      <ul className="card-list">
        {filtered.map((e) => {
          const remainingSlices = getPreviewRemainingSlices(e.id);
          const foodStatus = getFoodStatusLabel(remainingSlices);

          return (
            <li key={e.id}>
              <article className="card">
                <button
                  type="button"
                  className="card__main"
                  onClick={() => setSelected(e)}
                  aria-label={`${e.name}, ${formatEventRange(e.startsOn, e.endsOn)}, ${e.locationName}, food status ${foodStatus}. View details.`}
                >
                  <div className="card__thumb-wrap">
                    <div className="card__thumb">
                      <svg
                        className="pizza-indicator"
                        viewBox="0 0 100 100"
                        role="img"
                        aria-label={`Food remaining preview: ${remainingSlices} of ${TOTAL_PIZZA_SLICES} slices`}
                      >
                        <circle className="pizza-base" cx="50" cy="50" r="48" />
                        {Array.from({ length: TOTAL_PIZZA_SLICES }).map((_, i) => (
                          <path
                            key={i}
                            d={buildSlicePath(i)}
                            className="pizza-slice"
                            style={{ opacity: i < remainingSlices ? 1 : 0.16 }}
                          />
                        ))}
                        <circle className="pizza-center" cx="50" cy="50" r="8" />
                      </svg>
                    </div>
                    <p className="card__food-status" aria-hidden="true">
                      {foodStatus}
                    </p>
                  </div>
                <div className="card__body">
                  <h3 className="card__title">{e.name}</h3>
                  <p className="card__when">{formatEventRange(e.startsOn, e.endsOn)}</p>
                  <p className="card__loc">{e.locationName}</p>
                  <div className="chip-row card__chips">
                    {e.foodTypes.slice(0, 3).map((c) => (
                      <span key={c} className="chip chip--sm">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
                </button>
              </article>
            </li>
          );
        })}
      </ul>
      {filtered.length === 0 ? (
        <p className="empty">No matches.</p>
      ) : null}
      <EventDialog event={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
