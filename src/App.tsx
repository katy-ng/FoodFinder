import { useEffect, useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Catalog } from './components/Catalog';
import { CampusMap } from './components/CampusMap';
import { Account } from './components/Account';
import type { EventsPayload } from './types';
import { formatNyCalendarHeading } from './lib/dates';

type Tab = 'catalog' | 'map' | 'account';

function AppShell() {
  const [tab, setTab] = useState<Tab>('catalog');
  const [data, setData] = useState<EventsPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/events.json')
      .then((r) => {
        if (!r.ok) throw new Error('Could not load events.');
        return r.json() as Promise<EventsPayload>;
      })
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch(() => {
        if (!cancelled) setLoadError('We could not load the event list. Run npm run dev to generate events.json.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loadError) {
    return (
      <div className="app">
        <header className="app-header">
          <h1 className="brand">SBU FoodFinder</h1>
        </header>
        <main id="main" className="app-main" tabIndex={-1}>
          <p className="empty" role="alert">
            {loadError}
          </p>
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="app">
        <header className="app-header">
          <h1 className="brand">SBU FoodFinder</h1>
        </header>
        <main id="main" className="app-main" tabIndex={-1}>
          <p className="muted" role="status" aria-live="polite">
            Loading campus events…
          </p>
        </main>
      </div>
    );
  }

  const mapEvents = data.events.filter((e) => e.onMapSampleDay);
  const mapHeading = formatNyCalendarHeading(data.mapDay);

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <header className="app-header">
        <div className="app-header__inner">
          <div>
            <h1 className="brand">SBU FoodFinder</h1>
            <p className="tagline">Free food · Campus life · Student orgs</p>
          </div>
        </div>
      </header>

      <main id="main" className="app-main" tabIndex={-1}>
        {tab === 'catalog' ? <Catalog events={data.events} /> : null}
        {tab === 'map' ? <CampusMap mapEvents={mapEvents} mapDayLabel={mapHeading} /> : null}
        {tab === 'account' ? <Account /> : null}
      </main>

      <nav className="tab-bar" aria-label="Primary">
        <button
          type="button"
          className={`tab-bar__btn${tab === 'catalog' ? ' is-active' : ''}`}
          aria-current={tab === 'catalog' ? 'page' : undefined}
          onClick={() => setTab('catalog')}
        >
          <span className="tab-bar__icon" aria-hidden>
            ≡
          </span>
          Catalog
        </button>
        <button
          type="button"
          className={`tab-bar__btn${tab === 'map' ? ' is-active' : ''}`}
          aria-current={tab === 'map' ? 'page' : undefined}
          onClick={() => setTab('map')}
        >
          <span className="tab-bar__icon" aria-hidden>
            ◎
          </span>
          Map
        </button>
        <button
          type="button"
          className={`tab-bar__btn${tab === 'account' ? ' is-active' : ''}`}
          aria-current={tab === 'account' ? 'page' : undefined}
          onClick={() => setTab('account')}
        >
          <span className="tab-bar__icon" aria-hidden>
            ◉
          </span>
          Account
        </button>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
