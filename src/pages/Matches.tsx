import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faHeart, faUser } from '@fortawesome/free-solid-svg-icons';

export type MatchProfile = {
  name: string;
  age: number;
  location: string;
  interests: string[];
  compatibility: number;
  avatar: string;
  goal: string;
  about: string;
  photos: string[];
  positions?: string[];
  sharedEvents?: Array<{
    id: string;
    name: string;
    date: string;
    image?: string;
  }>;
};

type MatchesProps = {
  onNavigate: (view: 'events' | 'matches' | 'profile') => void;
  activeView: 'events' | 'matches' | 'profile';
  onSelectMatch: (match: MatchProfile) => void;
};

const sampleMatches: MatchProfile[] = [
  {
    name: 'Maayan',
    age: 29,
    location: 'Tel Aviv',
    interests: ['Hiking', 'Live Music', 'Food'],
    compatibility: 92,
    avatar: 'https://i.pravatar.cc/300?img=47',
    goal: 'Looking for shared adventures',
    about:
      'Product designer who spends weekends chasing sunsets along the coast. I love live music, impromptu road trips, and discovering new street food spots.',
    photos: [
      'https://i.pravatar.cc/600?img=47',
      'https://i.pravatar.cc/600?img=47&seed=maayan1',
      'https://i.pravatar.cc/600?img=47&seed=maayan2',
      'https://i.pravatar.cc/600?img=47&seed=maayan3',
    ],
    positions: ['Product Designer', 'UI/UX Consultant'],
    sharedEvents: [
      { id: '1', name: 'Sunset Yoga at Tel Aviv Beach', date: 'Mar 15' },
      { id: '2', name: 'Live Jazz Night at Rothschild', date: 'Mar 20' },
    ],
  },
  {
    name: 'Idan',
    age: 31,
    location: 'Herzliya',
    interests: ['Surfing', 'Art Galleries', 'Music'],
    compatibility: 88,
    avatar: 'https://i.pravatar.cc/300?img=12',
    goal: 'Seeking a partner-in-crime for beach getaways',
    about:
      'Startup founder by day, wave chaser by dawn. I collect vinyl records, experiment in the kitchen, and never turn down a weekend hike.',
    photos: [
      'https://i.pravatar.cc/600?img=12',
      'https://i.pravatar.cc/600?img=12&seed=idan1',
      'https://i.pravatar.cc/600?img=12&seed=idan2',
      'https://i.pravatar.cc/600?img=12&seed=idan3',
    ],
    positions: ['Startup Founder', 'Tech Entrepreneur'],
    sharedEvents: [
      { id: '3', name: 'Hiking in Ein Gedi Nature Reserve', date: 'Mar 22' },
      { id: '4', name: 'Beach Volleyball Tournament', date: 'Mar 25' },
    ],
  },
  {
    name: 'Noa',
    age: 27,
    location: 'Jerusalem',
    interests: ['Coffee Tastings', 'Photography', 'Art'],
    compatibility: 85,
    avatar: 'https://i.pravatar.cc/300?img=28',
    goal: 'Excited to meet someone curious and kind',
    about:
      'Documentary photographer fascinated by stories behind people and places. I host coffee tasting nights and always travel with a journal.',
    photos: [
      'https://i.pravatar.cc/600?img=28',
      'https://i.pravatar.cc/600?img=28&seed=noa1',
      'https://i.pravatar.cc/600?img=28&seed=noa2',
      'https://i.pravatar.cc/600?img=28&seed=noa3',
    ],
    positions: ['Documentary Photographer', 'Photojournalist'],
    sharedEvents: [
      { id: '5', name: 'Art Gallery Opening in Neve Tzedek', date: 'Mar 18' },
      { id: '6', name: 'Food & Wine Tasting in Jaffa', date: 'Mar 24' },
    ],
  },
];

function Matches({ onNavigate, activeView, onSelectMatch }: MatchesProps) {
  const likesCount = 3;

  return (
    <div className="matches-page">
      <header className="matches-header">
        <h1>Matches</h1>
        <p>People who are excited to meet up. Reach out and plan something fun!</p>
      </header>

      <main className="matches-list">
        {sampleMatches.map((match) => (
          <article
            key={match.name}
            className="match-card"
            onClick={() => onSelectMatch(match)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
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
            <div className="match-body">
              <div className="match-title">
                <h2>{match.name}</h2>
                <span>{match.age}</span>
              </div>
              <p className="match-location">{match.location}</p>
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
              <div className="match-interests">
                {match.interests.map((interest) => (
                  <span key={interest} className="match-chip">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
            <div className="match-actions">
              <span className="compatibility-pill">{match.compatibility}% match</span>
              <button
                type="button"
                className="chip-button primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMatch(match);
                }}
              >
                View profile
              </button>
            </div>
          </article>
        ))}
      </main>

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

export default Matches;

