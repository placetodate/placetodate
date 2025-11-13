import React from 'react';

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
            </div>
            <div className="match-body">
              <div className="match-title">
                <h2>{match.name}</h2>
                <span>{match.age}</span>
              </div>
              <p className="match-location">{match.location}</p>
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

export default Matches;

