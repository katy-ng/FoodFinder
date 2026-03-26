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

/**
 * Main Stony Brook campus, west campus, and Stony Brook University Hospital —
 * southwest corner then northeast corner (WGS84).
 */
const SBU_CAMPUS_BOUNDS = L.latLngBounds(
  [40.886, -73.141],
  [40.93, -73.103],
);

const SBU_MAP_CENTER = SBU_CAMPUS_BOUNDS.getCenter();

function FitBounds({ events }: { events: FoodEvent[] }) {
  const map = useMap();
  useEffect(() => {
    if (events.length === 0) return;
    if (events.length === 1) {
      map.setView([events[0].latitude, events[0].longitude], 16);
      return;
    }
    const b = L.latLngBounds(events.map((e) => [e.latitude, e.longitude]));
    map.fitBounds(b, { padding: [48, 48], maxZoom: 17 });
  }, [map, events]);
  return null;
}

interface Props {
  mapEvents: FoodEvent[];
  mapDayLabel: string;
}

export function CampusMap({ mapEvents, mapDayLabel }: Props) {
  const [selected, setSelected] = useState<FoodEvent | null>(null);
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
        <h2 id="map-heading">Campus map</h2>
        <p className="muted">
          Pins show free-food events starting on <strong>{mapDayLabel}</strong> (Eastern Time). Tap a pin for a
          short summary; use <strong>Full details</strong> in the popup for the full event view.
        </p>
      </div>
      <div className="map-wrap" role="application" aria-label="Interactive campus map">
        <MapContainer
          center={center}
          zoom={15}
          className="map-canvas"
          scrollWheelZoom
          minZoom={14}
          maxZoom={19}
          maxBounds={SBU_CAMPUS_BOUNDS}
          maxBoundsViscosity={1}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            bounds={SBU_CAMPUS_BOUNDS}
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
        <p className="empty">No mapped events for this date in the current dataset.</p>
      ) : null}
      <EventDialog event={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
