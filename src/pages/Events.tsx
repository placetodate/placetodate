import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export type EventItem = {
  id: string;
  name: string;
  description: string;
  location: string;
  startTime?: string;
  endTime?: string;
  coverUrl?: string | null;
  ownerUid?: string;
  locationCoords?: {
    lat: number;
    lng: number;
  } | null;
};

type EventsProps = {
  onAddNewEvent: () => void;
  onSelectEvent: (event: EventItem) => void;
  onEditEvent: (event: EventItem) => void;
  onNavigate: (view: 'events' | 'matches' | 'profile') => void;
  currentUserId?: string | null;
  activeView: 'events' | 'matches' | 'profile';
};

function Events({
  onAddNewEvent,
  onSelectEvent,
  onEditEvent,
  onNavigate,
  currentUserId,
  activeView,
}: EventsProps) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const likesCount = 3;

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('startTime'));
    const unsub = onSnapshot(q, (snap) => {
      const items: EventItem[] = [];
      snap.forEach((doc) => items.push({ id: doc.id, ...(doc.data() as any) }));
      setEvents(items);
    });
    return () => unsub();
  }, []);
  return (
    <div className="events-page">
      <header className="events-header">
        <h1>Events</h1>
        <div className="filters">
          <button className="chip">Today ▾</button>
          <button className="chip">Location ▾</button>
          <button className="chip">Interests ▾</button>
          <button className="chip settings" aria-label="Filters">⚙️</button>
        </div>
      </header>

      <main className="events-list">
        {events.map((ev) => (
          <section key={ev.id} className="event-group">
            <h2 className="group-title">{new Date(ev.startTime || '').toDateString()}</h2>
            <article
              className="event-card clickable"
              role="button"
              tabIndex={0}
              onClick={() => onSelectEvent(ev)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectEvent(ev);
                }
              }}
            >
              <div className="event-text">
                <h3 className="event-title">{ev.name}</h3>
                <p>{ev.description}</p>
              </div>
              <div className="event-media">
                {ev.coverUrl ? (
                  <img className="event-image" src={ev.coverUrl} alt={ev.name} />
                ) : (
                  <img
                    className="event-image placeholder"
                    src="/assets/place_to_date_placeholder.png"
                    alt=""
                    aria-hidden="true"
                  />
                )}
                {ev.ownerUid && ev.ownerUid === currentUserId && (
                  <button
                    type="button"
                    className="event-edit-indicator"
                    aria-label={`Edit ${ev.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditEvent(ev);
                    }}
                  >
                    ✎
                  </button>
                )}
              </div>
            </article>
          </section>
        ))}
      </main>

      <button className="fab add-event" onClick={onAddNewEvent}>
        <span className="fab-icon">＋</span>
        <span className="fab-label">Add New Event</span>
      </button>

      <nav className="bottom-nav">
        <button
          className={`nav-item ${activeView === 'events' ? 'active' : ''}`}
          onClick={() => onNavigate('events')}
        >
          <span className="nav-icon">
            <svg viewBox="0 0 24 24">
              <path d="M5 8.5h14M5 12.5h14M8.5 4v4.5M15.5 4v4.5M6.75 19.5h10.5c1.243 0 2.25-1.007 2.25-2.25V7.75A2.25 2.25 0 0 0 17.25 5.5H6.75A2.25 2.25 0 0 0 4.5 7.75v9.5A2.25 2.25 0 0 0 6.75 19.5Z" />
            </svg>
          </span>
          <span className="nav-label">Events</span>
        </button>
        <button
          className={`nav-item ${activeView === 'matches' ? 'active' : ''}`}
          onClick={() => onNavigate('matches')}
        >
          <span className="nav-icon">
            <svg viewBox="0 0 24 24">
              <path d="M12 20.25s-7.5-4.5-7.5-10.125a4.125 4.125 0 0 1 7.125-2.7l.375.45.375-.45A4.125 4.125 0 0 1 19.5 10.125C19.5 15.75 12 20.25 12 20.25Z" />
            </svg>
          </span>
          {likesCount > 0 && <span className="nav-badge">{likesCount}</span>}
          <span className="nav-label">Matches</span>
        </button>
        <button
          className={`nav-item ${activeView === 'profile' ? 'active' : ''}`}
          onClick={() => onNavigate('profile')}
        >
          <span className="nav-icon">
            <svg viewBox="0 0 24 24">
              <path d="M12 12.25c2.347 0 4.25-1.903 4.25-4.25S14.347 3.75 12 3.75 7.75 5.653 7.75 8s1.903 4.25 4.25 4.25Z" />
              <path d="M5.5 19.25c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5" strokeLinecap="round" />
            </svg>
          </span>
          <span className="nav-label">Profile</span>
        </button>
      </nav>
    </div>
  );
}

export default Events;


