import React, { useState } from 'react';
import type { EventItem } from './Events';

type EventDetailsProps = {
  event: EventItem;
  onBack: () => void;
  onDelete?: (event: EventItem) => Promise<void> | void;
  canDelete?: boolean;
  onNavigate: (view: 'events' | 'matches' | 'profile') => void;
  activeView: 'events' | 'matches' | 'profile';
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

function EventDetails({
  event,
  onBack,
  onDelete,
  canDelete = false,
  onNavigate,
  activeView,
}: EventDetailsProps) {
  const coverUrl = event.coverUrl || fallbackCover;
  const [isDeleting, setIsDeleting] = useState(false);
  const likesCount = 3;

  const handleDelete = async () => {
    if (!onDelete) return;
    const confirmed = window.confirm(`Delete "${event.name}"? This cannot be undone.`);
    if (!confirmed) return;
    try {
      setIsDeleting(true);
      await onDelete(event);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="event-details-page">
      <header className="event-details-header">
        <button className="icon-button" aria-label="Back to events" onClick={onBack}>
          ←
        </button>
        <h1>Event Details</h1>
        {canDelete && onDelete ? (
          <button
            type="button"
            className="icon-button danger"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            🗑
          </button>
        ) : (
          <span aria-hidden="true" className="header-spacer" />
        )}
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

export default EventDetails;


