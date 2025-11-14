import React, { useState } from 'react';
import type { EventItem } from './Events';
import type { MatchProfile } from './Matches';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faTrash, faCalendar, faHeart, faUser } from '@fortawesome/free-solid-svg-icons';

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
    sharedEvents: [
      { id: '1', name: 'Sunset Yoga at Tel Aviv Beach', date: 'Mar 15' },
    ],
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
    sharedEvents: [
      { id: '3', name: 'Hiking in Ein Gedi Nature Reserve', date: 'Mar 22' },
    ],
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
    sharedEvents: [
      { id: '5', name: 'Art Gallery Opening in Neve Tzedek', date: 'Mar 18' },
    ],
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
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <h1>Event Details</h1>
        {canDelete && onDelete ? (
          <button
            type="button"
            className="icon-button danger"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <FontAwesomeIcon icon={faTrash} />
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
              <div className="match-avatar">
                <img src={match.avatar} alt={match.name} />
                {match.sharedEvents && match.sharedEvents.length > 0 && (
                  <div className="shared-events-badge">
                    <FontAwesomeIcon icon={faCalendar} className="shared-events-icon" />
                    <span className="shared-events-count">{match.sharedEvents.length}</span>
                  </div>
                )}
              </div>
              <div className="match-card-body">
                <h4>{match.name}</h4>
                <p>{match.goal}</p>
                {match.sharedEvents && match.sharedEvents.length > 0 && (
                  <div className="shared-events-list">
                    {match.sharedEvents.map((event) => (
                      <div key={event.id} className="shared-event-item">
                        <span className="shared-event-date">{event.date}</span>
                        <span className="shared-event-name">{event.name}</span>
                      </div>
                    ))}
                  </div>
                )}
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
            <FontAwesomeIcon icon={faCalendar} />
          </span>
          <span className="nav-label">Events</span>
        </button>
        <button
          className={`nav-item ${activeView === 'matches' ? 'active' : ''}`}
          onClick={() => onNavigate('matches')}
        >
          <span className="nav-icon">
            <FontAwesomeIcon icon={faHeart} />
          </span>
          {likesCount > 0 && <span className="nav-badge">{likesCount}</span>}
          <span className="nav-label">Matches</span>
        </button>
        <button
          className={`nav-item ${activeView === 'profile' ? 'active' : ''}`}
          onClick={() => onNavigate('profile')}
        >
          <span className="nav-icon">
            <FontAwesomeIcon icon={faUser} />
          </span>
          <span className="nav-label">Profile</span>
        </button>
      </nav>
    </div>
  );
}

export default EventDetails;


