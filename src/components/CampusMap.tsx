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
  const center = useMemo(() => {
    if (mapEvents.length === 0) return [40.915, -73.122] as [number, number];
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
          quick summary, or open full details.
        </p>
      </div>
      <div className="map-wrap" role="application" aria-label="Interactive campus map">
        <MapContainer
          center={center}
          zoom={15}
          className="map-canvas"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {mapEvents.length > 0 ? <FitBounds events={mapEvents} /> : null}
          {mapEvents.map((e) => (
            <Marker
              key={e.id}
              position={[e.latitude, e.longitude]}
              eventHandlers={{
                click: () => setSelected(e),
              }}
            >
              <Popup>
                <div className="map-popup">
                  <strong>{e.name}</strong>
                  <p className="map-popup__when">{formatEventRange(e.startsOn, e.endsOn)}</p>
                  <p className="map-popup__loc">{e.locationName}</p>
                  <button type="button" className="linkish" onClick={() => setSelected(e)}>
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
