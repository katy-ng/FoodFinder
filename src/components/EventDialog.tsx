import { useEffect, useRef } from 'react';
import type { FoodEvent } from '../types';
import { formatEventRange } from '../lib/dates';

interface Props {
  event: FoodEvent | null;
  onClose: () => void;
}

export function EventDialog({ event, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (event) {
      if (!d.open) d.showModal();
    } else if (d.open) d.close();
  }, [event]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    d.addEventListener('cancel', onCancel);
    return () => d.removeEventListener('cancel', onCancel);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      className="event-dialog"
      aria-labelledby={event ? 'event-dialog-title' : undefined}
      onClose={onClose}
    >
      {event ? (
        <div className="event-dialog__inner">
          <header className="event-dialog__head">
            <h2 id="event-dialog-title" className="event-dialog__title">
              {event.name}
            </h2>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close event details">
              ×
            </button>
          </header>
          <div className="event-dialog__body">
            {event.imageUrl ? (
              <img
                className="event-dialog__img"
                src={event.imageUrl}
                alt=""
                loading="lazy"
                decoding="async"
              />
            ) : null}
            <p className="event-dialog__when">{formatEventRange(event.startsOn, event.endsOn)}</p>
            <p className="event-dialog__meta">
              <strong>Where:</strong> {event.locationName}
              {event.locationAddress ? ` · ${event.locationAddress}` : ''}
              {event.coordinatesApproximate ? (
                <span className="muted"> · Map position may be approximate</span>
              ) : null}
            </p>
            <p className="event-dialog__meta">
              <strong>Organization:</strong> {event.organization}
            </p>
            <p className="event-dialog__meta">
              <strong>RSVP:</strong> {event.reservations}
            </p>
            <div className="chip-row" aria-label="Categories">
              {event.categories.map((c) => (
                <span key={c} className="chip">
                  {c}
                </span>
              ))}
            </div>
            <p className="event-dialog__desc">{event.descriptionPlain}</p>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
