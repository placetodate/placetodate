import React from 'react';
import type { EventItem } from './Events';

type EventDetailsProps = {
  event: EventItem;
  onBack: () => void;
};

type Attendee = {
  name: string;
  title: string;
  avatar: string;
};

const DEFAULT_MATCHES: Attendee[] = [
  {
    name: 'Sophia',
    title: 'Software Engineer',
    avatar: 'https://i.pravatar.cc/160?img=47',
  },
  {
    name: 'Ethan',
    title: 'Product Manager',
    avatar: 'https://i.pravatar.cc/160?img=12',
  },
  {
    name: 'Olivia',
    title: 'Data Scientist',
    avatar: 'https://i.pravatar.cc/160?img=32',
  },
];

const DEFAULT_ATTENDEES: { name: string; avatar: string }[] = [
  { name: 'Leo', avatar: 'https://i.pravatar.cc/80?img=55' },
  { name: 'Amelia', avatar: 'https://i.pravatar.cc/80?img=28' },
  { name: 'Lucas', avatar: 'https://i.pravatar.cc/80?img=8' },
  { name: 'Mia', avatar: 'https://i.pravatar.cc/80?img=21' },
  { name: 'Noah', avatar: 'https://i.pravatar.cc/80?img=18' },
];

const fallbackCover = '/assets/events_illustration.png';

function EventDetails({ event, onBack }: EventDetailsProps) {
  const coverUrl = event.coverUrl || fallbackCover;

  return (
    <div className="event-details-page">
      <header className="event-details-header">
        <button className="icon-button" aria-label="Back to events" onClick={onBack}>
          ←
        </button>
        <h1>Event Details</h1>
        <span aria-hidden="true" className="header-spacer" />
      </header>

      <section className="event-hero" style={{ backgroundImage: `url(${coverUrl})` }}>
        <div className="event-hero-overlay" />
        <div className="event-hero-content">
          <h2>{event.name}</h2>
          {event.location && <p>{event.location}</p>}
        </div>
      </section>

      <section className="event-section">
        <h3>Attendees</h3>
        <div className="attendee-list" aria-label="Attendees">
          {DEFAULT_ATTENDEES.map((attendee) => (
            <img
              key={attendee.name}
              src={attendee.avatar}
              alt={attendee.name}
              className="attendee-avatar"
            />
          ))}
        </div>
      </section>

      <section className="event-section">
        <h3>Potential Matches</h3>
        <div className="match-grid">
          {DEFAULT_MATCHES.map((match) => (
            <article key={match.name} className="match-card">
              <img src={match.avatar} alt={match.name} />
              <div className="match-card-body">
                <h4>{match.name}</h4>
                <p>{match.title}</p>
                <div className="match-card-actions">
                  <button type="button" className="chip-button primary">
                    Chat
                  </button>
                  <button type="button" className="chip-button">
                    Message
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

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

export default EventDetails;


