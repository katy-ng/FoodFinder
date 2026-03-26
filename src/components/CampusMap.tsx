import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { FoodEvent } from '../types';
import { formatEventRange } from '../lib/dates';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { EventDialog } from './EventDialog';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

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
            <Marker key={e.id} position={[e.latitude, e.longitude]}>
              <Popup>
                <div className="map-popup">
                  <strong>{e.name}</strong>
                  <p className="map-popup__when">{formatEventRange(e.startsOn, e.endsOn)}</p>
                  <p className="map-popup__loc">{e.locationName}</p>
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
