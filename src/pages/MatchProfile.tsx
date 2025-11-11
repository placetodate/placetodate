import React from 'react';
import type { MatchProfile } from './Matches';

type MatchProfileProps = {
  match: MatchProfile;
  onBack: () => void;
  onNavigate: (view: 'events' | 'matches' | 'profile') => void;
  activeView: 'events' | 'matches' | 'profile';
};

function MatchProfileView({ match, onBack, onNavigate, activeView }: MatchProfileProps) {
  const likesCount = 3;

  return (
    <div className="profile-page">
      <header className="profile-header">
        <button className="icon-button" aria-label="Back" onClick={onBack}>
          ←
        </button>
        <h1>Profile</h1>
        <span className="header-spacer" aria-hidden="true" />
      </header>

      <section className="profile-hero">
        <img src={match.avatar} alt={match.name} className="profile-avatar" />
        <h2>{match.name}</h2>
        <p className="profile-meta">
          {match.age}, {match.location}
        </p>
        <p className="profile-goal">{match.goal}</p>
      </section>

      <section className="profile-section">
        <h3>About</h3>
        <p>{match.about}</p>
      </section>

      <section className="profile-section">
        <h3>Interests</h3>
        <div className="profile-pills">
          {match.interests.map((interest) => (
            <span key={interest} className="profile-pill">
              {interest}
            </span>
          ))}
        </div>
      </section>

      <section className="profile-section">
        <h3>Photos</h3>
        <div className="profile-photos">
          {match.photos.map((photo, idx) => (
            <img key={idx} src={photo} alt={`${match.name} ${idx + 1}`} />
          ))}
        </div>
      </section>

      <div className="profile-actions">
        <button className="chip-button primary">Chat</button>
        <button className="chip-button">Request Photos</button>
      </div>

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

export default MatchProfileView;


