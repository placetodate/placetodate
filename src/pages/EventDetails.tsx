import React, { useState } from 'react';
import type { EventItem } from './Events';
import type { MatchProfile } from './Matches';

type EventDetailsProps = {
  event: EventItem;
  onBack: () => void;
  onDelete?: (event: EventItem) => Promise<void> | void;
  canDelete?: boolean;
  onNavigate: (view: 'events' | 'matches' | 'profile') => void;
  activeView: 'events' | 'matches' | 'profile';
  onSelectMatch?: (match: MatchProfile) => void;
};

type Attendee = {
  name: string;
  title: string;
  avatar: string;
};

const DEFAULT_MATCHES: MatchProfile[] = [
  {
    name: 'Shira',
    age: 28,
    location: 'Tel Aviv',
    interests: ['Design', 'Wine', 'Art'],
    compatibility: 91,
    avatar: 'https://i.pravatar.cc/160?img=47',
    goal: 'Looking for shared adventures',
    about: 'Product designer chasing sunsets and pop-up food markets.',
    photos: [
      'https://i.pravatar.cc/600?img=47',
      'https://i.pravatar.cc/600?img=47&seed=shira1',
      'https://i.pravatar.cc/600?img=47&seed=shira2',
    ],
    positions: ['Product Designer', 'Creative Director'],
  },
  {
    name: 'Lior',
    age: 31,
    location: 'Herzliya',
    interests: ['Surfing', 'Photography', 'Travel'],
    compatibility: 88,
    avatar: 'https://i.pravatar.cc/160?img=12',
    goal: 'Ready to plan the next trip',
    about: 'Startup PM who loves cooking classes and sunrise hikes.',
    photos: [
      'https://i.pravatar.cc/600?img=12',
      'https://i.pravatar.cc/600?img=12&seed=lior1',
      'https://i.pravatar.cc/600?img=12&seed=lior2',
    ],
    positions: ['Product Manager', 'Tech Lead'],
  },
  {
    name: 'Noa',
    age: 27,
    location: 'Jerusalem',
    interests: ['Art', 'Jazz', 'Photography'],
    compatibility: 86,
    avatar: 'https://i.pravatar.cc/160?img=32',
    goal: 'Searching for deep conversations',
    about: 'Documentary photographer fascinated by city stories.',
    photos: [
      'https://i.pravatar.cc/600?img=32',
      'https://i.pravatar.cc/600?img=32&seed=noa1',
      'https://i.pravatar.cc/600?img=32&seed=noa2',
    ],
    positions: ['Documentary Photographer', 'Photojournalist'],
  },
];

const DEFAULT_ATTENDEES: { name: string; avatar: string; position?: string }[] = [
  { name: 'Idan', avatar: 'https://i.pravatar.cc/80?img=55', position: 'Software Engineer' },
  { name: 'Maayan', avatar: 'https://i.pravatar.cc/80?img=28', position: 'Designer' },
  { name: 'Lior', avatar: 'https://i.pravatar.cc/80?img=8', position: 'Product Manager' },
  { name: 'Shira', avatar: 'https://i.pravatar.cc/80?img=21', position: 'Marketing Manager' },
  { name: 'Noa', avatar: 'https://i.pravatar.cc/80?img=18', position: 'Photographer' },
];

const fallbackCover = '/assets/events_illustration.png';

function EventDetails({
  event,
  onBack,
  onDelete,
  canDelete = false,
  onNavigate,
  activeView,
  onSelectMatch,
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
            <div key={attendee.name} className="attendee-item" title={attendee.position || attendee.name}>
              <img
                src={attendee.avatar}
                alt={attendee.name}
                className="attendee-avatar"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="event-section">
        <h3>Potential Matches</h3>
        <div className="match-grid">
          {DEFAULT_MATCHES.map((match) => (
            <article
              key={match.name}
              className="match-card"
              role={onSelectMatch ? 'button' : undefined}
              tabIndex={onSelectMatch ? 0 : -1}
              onClick={() => onSelectMatch?.(match)}
              onKeyDown={(e) => {
                if (!onSelectMatch) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectMatch(match);
                }
              }}
            >
              <img src={match.avatar} alt={match.name} />
              <div className="match-card-body">
                <h4>{match.name}</h4>
                <p>{match.goal}</p>
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


