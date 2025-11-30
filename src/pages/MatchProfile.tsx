import React from 'react';
import type { MatchProfile } from './Matches';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCalendar, faHeart, faUser } from '@fortawesome/free-solid-svg-icons';

type MatchProfileProps = {
  match: MatchProfile;
  onBack: () => void;
  onNavigate: (view: 'events' | 'matches' | 'profile') => void;
  activeView: 'events' | 'matches' | 'profile';
  onChat?: (match: MatchProfile) => void;
};

function MatchProfileView({ match, onBack, onNavigate, activeView, onChat }: MatchProfileProps) {
  const likesCount = 3;

  return (
    <div className="profile-page">
      <header className="profile-header">
                <button className="icon-button" aria-label="Back" onClick={onBack}>
                  <FontAwesomeIcon icon={faArrowLeft} />
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
        {match.positions && match.positions.length > 0 && (
          <p className="profile-positions">
            {match.positions.join(' • ')}
          </p>
        )}
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
        <button 
          className="chip-button primary" 
          onClick={() => onChat && onChat(match)}
        >
          Chat
        </button>
        <button className="chip-button">Request Photos</button>
      </div>

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

export default MatchProfileView;


