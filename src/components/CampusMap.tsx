import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { FoodEvent } from '../types';
import { formatEventRange } from '../lib/dates';
import { EventDialog } from './EventDialog';

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

function createPizzaMapIcon(eventId: number) {
  const remainingSlices = getPreviewRemainingSlices(eventId);
  const slices = Array.from({ length: TOTAL_PIZZA_SLICES })
    .map((_, i) => {
      const opacity = i < remainingSlices ? 1 : 0.16;
      return `<path d="${buildSlicePath(i)}" class="pizza-map-slice" style="opacity:${opacity}" />`;
    })
    .join('');

  return L.divIcon({
    className: 'pizza-map-div-icon',
    iconSize: [34, 44],
    iconAnchor: [17, 42],
    popupAnchor: [0, -34],
    html: `
      <div class="pizza-map-pin" aria-hidden="true">
        <svg class="pizza-map-pin__icon" viewBox="0 0 100 100" focusable="false">
          <circle class="pizza-map-base" cx="50" cy="50" r="48" />
          ${slices}
          <circle class="pizza-map-center" cx="50" cy="50" r="8" />
        </svg>
        <span class="pizza-map-pin__tip"></span>
      </div>
    `,
  });
}

/** Main Stony Brook University campus (undergraduate core, Union, SAC, South P). WGS84 SW → NE. */
const SBU_CAMPUS_BOUNDS = L.latLngBounds([40.896, -73.126], [40.919, -73.108]);

const SBU_MAP_CENTER = SBU_CAMPUS_BOUNDS.getCenter();

/** Zoom out this many levels after fit so visible ground span is ~1.25× (linear). */
const ZOOM_OUT_AFTER_FIT = Math.log2(1.25);

function FitBounds({ events }: { events: FoodEvent[] }) {
  const map = useMap();
  useEffect(() => {
    if (events.length === 0) return;
    const b = L.latLngBounds(events.map((e) => [e.latitude, e.longitude]));
    if (events.length === 1) {
      map.fitBounds(b.pad(0.06), { padding: [8, 8], maxZoom: 18 });
    } else {
      map.fitBounds(b, { padding: [10, 10], maxZoom: 18 });
    }
    requestAnimationFrame(() => {
      map.setZoom(map.getZoom() - ZOOM_OUT_AFTER_FIT);
    });
  }, [map, events]);
  return null;
}

interface Props {
  mapEvents: FoodEvent[];
  mapDayLabel: string;
}

function paddedBoundsFromPins(events: FoodEvent[]): L.LatLngBounds {
  const b = L.latLngBounds(events.map((e) => [e.latitude, e.longitude]));
  const ne = b.getNorthEast();
  const sw = b.getSouthWest();
  if (ne.lat === sw.lat && ne.lng === sw.lng) return b.pad(0.1);
  return b.pad(0.125);
}

export function CampusMap({ mapEvents, mapDayLabel }: Props) {
  const [selected, setSelected] = useState<FoodEvent | null>(null);
  const maxBounds = useMemo(
    () =>
      mapEvents.length > 0 ? paddedBoundsFromPins(mapEvents) : SBU_CAMPUS_BOUNDS,
    [mapEvents],
  );
  const center = useMemo((): [number, number] => {
    if (mapEvents.length === 0) {
      return [SBU_MAP_CENTER.lat, SBU_MAP_CENTER.lng];
    }
    const lat = mapEvents.reduce((s, e) => s + e.latitude, 0) / mapEvents.length;
    const lng = mapEvents.reduce((s, e) => s + e.longitude, 0) / mapEvents.length;
    return [lat, lng] as [number, number];
  }, [mapEvents]);

  return (
    <section className="panel map-panel" aria-labelledby="map-heading">
      <div className="map-panel__intro">
        <h2 id="map-heading">Map · {mapDayLabel}</h2>
      </div>
      <div className="map-wrap" role="application" aria-label="Interactive campus map">
        <MapContainer
          center={center}
          zoom={15}
          className="map-canvas"
          scrollWheelZoom
          zoomSnap={0}
          minZoom={15}
          maxZoom={19}
          maxBounds={maxBounds}
          maxBoundsViscosity={1}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {mapEvents.length > 0 ? <FitBounds events={mapEvents} /> : null}
          {mapEvents.map((e) => (
            <Marker key={e.id} position={[e.latitude, e.longitude]} icon={createPizzaMapIcon(e.id)}>
              {(() => {
                const remainingSlices = getPreviewRemainingSlices(e.id);
                const foodStatus = getFoodStatusLabel(remainingSlices);

                return (
              <Popup>
                <div className="map-popup">
                  <strong>{e.name}</strong>
                  <p className="map-popup__when">{formatEventRange(e.startsOn, e.endsOn)}</p>
                  <p className="map-popup__loc">{e.locationName}</p>
                  <div className="map-popup__food">
                    <p className="map-popup__food-status">{foodStatus}</p>
                    <div className="chip-row map-popup__chips">
                      {e.foodTypes.length > 0 ? (
                        e.foodTypes.map((foodType) => (
                          <span key={foodType} className="chip chip--sm">
                            {foodType}
                          </span>
                        ))
                      ) : (
                        <span className="map-popup__no-food">No food type listed</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="linkish"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setSelected(e);
                    }}
                  >
                    Full details
                  </button>
                </div>
              </Popup>
                );
              })()}
            </Marker>
          ))}
        </MapContainer>
      </div>
      {mapEvents.length === 0 ? (
        <p className="empty">No pins for this date.</p>
      ) : null}
      <EventDialog event={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
