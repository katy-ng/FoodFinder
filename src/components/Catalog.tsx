import { useMemo, useState } from 'react';
import type { FoodEvent } from '../types';
import { formatEventRange } from '../lib/dates';
import { EventDialog } from './EventDialog';

interface Props {
  events: FoodEvent[];
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
            placeholder="Name, location, or keywords"
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
        Showing {filtered.length} of {events.length} free-food listings
      </p>
      <ul className="card-list">
        {filtered.map((e) => (
          <li key={e.id}>
            <article className="card">
              <button
                type="button"
                className="card__main"
                onClick={() => setSelected(e)}
                aria-label={`${e.name}, ${formatEventRange(e.startsOn, e.endsOn)}, ${e.locationName}. View details.`}
              >
                {e.imageUrl ? (
                  <img className="card__thumb" src={e.imageUrl} alt="" loading="lazy" decoding="async" />
                ) : (
                  <div className="card__thumb card__thumb--placeholder" aria-hidden />
                )}
                <div className="card__body">
                  <h3 className="card__title">{e.name}</h3>
                  <p className="card__when">{formatEventRange(e.startsOn, e.endsOn)}</p>
                  <p className="card__loc">{e.locationName}</p>
                  <div className="chip-row card__chips">
                    {e.categories.slice(0, 3).map((c) => (
                      <span key={c} className="chip chip--sm">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            </article>
          </li>
        ))}
      </ul>
      {filtered.length === 0 ? (
        <p className="empty">No events match your filters. Try another category or search term.</p>
      ) : null}
      <EventDialog event={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
