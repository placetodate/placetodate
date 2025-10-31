import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebaseConfig';

type EventsProps = {
  onAddNewEvent: () => void;
};

type EventItem = {
  id: string;
  name: string;
  description: string;
  location: string;
  startTime?: string;
  endTime?: string;
  coverUrl?: string | null;
};

function Events({ onAddNewEvent }: EventsProps) {
  const [events, setEvents] = useState<EventItem[]>([]);

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
            <article className="event-card">
              <div className="event-text">
                <h3 className="event-title">{ev.name}</h3>
                <p>{ev.description}</p>
              </div>
              {ev.coverUrl ? (
                <img className="event-image" src={ev.coverUrl} alt={ev.name} />
              ) : (
                <div className="event-image placeholder" aria-hidden="true">🎉</div>
              )}
            </article>
          </section>
        ))}
      </main>

      <div className="cta-add">
        <button className="fab" onClick={onAddNewEvent}>
          <span className="icon">＋</span>
          <span>Add New Event</span>
        </button>
      </div>

      <nav className="bottom-nav">
        <button className="nav-item active">📅
          <div className="nav-label">Events</div>
        </button>
        <button className="nav-item">👥
          <div className="nav-label">Matches</div>
        </button>
        <button className="nav-item">👤
          <div className="nav-label">Profile</div>
        </button>
      </nav>
    </div>
  );
}

export default Events;


