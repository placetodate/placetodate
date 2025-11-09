import React from 'react';

type ProfileProps = {
  onBack?: () => void;
  onNavigate: (view: 'events' | 'matches' | 'profile') => void;
  activeView: 'events' | 'matches' | 'profile';
};

const mockPhotos = [
  'https://i.pravatar.cc/600?img=45',
  'https://i.pravatar.cc/600?img=11',
  'https://i.pravatar.cc/600?img=17',
];

const interests = ['Hiking', 'Photography', 'Travel', 'Tech', 'Foodie', 'Music'];

function Profile({ onBack, onNavigate, activeView }: ProfileProps) {
  return (
    <div className="profile-page">
      <header className="profile-header">
        {onBack ? (
          <button className="icon-button" aria-label="Back" onClick={onBack}>
            ←
          </button>
        ) : (
          <span className="header-spacer" aria-hidden="true" />
        )}
        <h1>Profile</h1>
        <span className="header-spacer" aria-hidden="true" />
      </header>

      <section className="profile-hero">
        <img src="https://i.pravatar.cc/240?img=45" alt="Ethan" className="profile-avatar" />
        <h2>Ethan</h2>
        <p className="profile-meta">28, San Francisco</p>
        <p className="profile-goal">Looking for a relationship</p>
      </section>

      <section className="profile-section">
        <h3>About</h3>
        <p>
          I'm a software engineer who loves hiking, photography, and exploring new cultures.
          I'm looking for someone who is adventurous, kind, and enjoys deep conversations.
        </p>
      </section>

      <section className="profile-section">
        <h3>Interests</h3>
        <div className="profile-pills">
          {interests.map((interest) => (
            <span key={interest} className="profile-pill">
              {interest}
            </span>
          ))}
        </div>
      </section>

      <section className="profile-section">
        <h3>Photos</h3>
        <div className="profile-photos">
          {mockPhotos.map((url, idx) => (
            <img key={idx} src={url} alt={`Ethan ${idx + 1}`} />
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
        >📅
          <div className="nav-label">Events</div>
        </button>
        <button
          className={`nav-item ${activeView === 'matches' ? 'active' : ''}`}
          onClick={() => onNavigate('matches')}
        >👥
          <div className="nav-label">Matches</div>
        </button>
        <button
          className={`nav-item ${activeView === 'profile' ? 'active' : ''}`}
          onClick={() => onNavigate('profile')}
        >👤
          <div className="nav-label">Profile</div>
        </button>
      </nav>
    </div>
  );
}

export default Profile;


