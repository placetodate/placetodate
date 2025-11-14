import React, { useEffect, useMemo, useRef, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faEdit, faCalendar, faHeart, faUser } from '@fortawesome/free-solid-svg-icons';

export type EventItem = {
  id: string;
  name: string;
  description: string;
  location: string;
  startTime?: string;
  endTime?: string;
  coverUrl?: string | null;
  ownerUid?: string;
  locationCoords?: {
    lat: number;
    lng: number;
  } | null;
  interests?: string[];
};

type EventsProps = {
  onAddNewEvent: () => void;
  onSelectEvent: (event: EventItem) => void;
  onEditEvent: (event: EventItem) => void;
  onNavigate: (view: 'events' | 'matches' | 'profile') => void;
  currentUserId?: string | null;
  activeView: 'events' | 'matches' | 'profile';
  onLogout: () => void | Promise<void>;
};

function Events({
  onAddNewEvent,
  onSelectEvent,
  onEditEvent,
  onNavigate,
  currentUserId,
  activeView,
  onLogout,
}: EventsProps) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week'>('all');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [interestFilter, setInterestFilter] = useState<string>('');
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isInterestOpen, setIsInterestOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const dateRef = useRef<HTMLDivElement | null>(null);
  const locationRef = useRef<HTMLDivElement | null>(null);
  const interestRef = useRef<HTMLDivElement | null>(null);
  const settingsRef = useRef<HTMLButtonElement | null>(null);
  const likesCount = 3;

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('startTime'));
    const unsub = onSnapshot(q, (snap) => {
      const items: EventItem[] = [];
      snap.forEach((doc) => items.push({ id: doc.id, ...(doc.data() as any) }));
      setEvents(items);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (isDateOpen && dateRef.current && !dateRef.current.contains(target)) {
        setIsDateOpen(false);
      }
      if (isLocationOpen && locationRef.current && !locationRef.current.contains(target)) {
        setIsLocationOpen(false);
      }
      if (isInterestOpen && interestRef.current && !interestRef.current.contains(target)) {
        setIsInterestOpen(false);
      }
      if (isSettingsOpen && settingsRef.current && !settingsRef.current.contains(target)) {
        const settingsMenu = settingsRef.current.nextElementSibling;
        if (settingsMenu && !settingsMenu.contains(target)) {
          setIsSettingsOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDateOpen, isLocationOpen, isInterestOpen, isSettingsOpen]);

  const locationOptions = useMemo(() => {
    const set = new Set<string>();
    events.forEach((event) => {
      if (event.location) {
        set.add(event.location);
      }
    });

    return Array.from(set).sort();
  }, [events]);

  const interestOptions = useMemo(() => {
    const set = new Set<string>();
    events.forEach((event) => {
      if (Array.isArray(event.interests)) {
        event.interests.forEach((interest) => set.add(interest));
      }
    });

    if (set.size === 0) {
      ['Outdoors', 'Food & Drink', 'Live Music', 'Art & Culture', 'Wellness', 'Tech & Startups'].forEach(
        (interest) => set.add(interest),
      );
    }

    return Array.from(set).sort();
  }, [events]);

  const filteredEvents = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);
    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    return events.filter((event) => {
      const eventDate = event.startTime ? new Date(event.startTime) : null;
      if (dateFilter === 'today' && (!eventDate || eventDate < startOfToday || eventDate >= endOfToday)) {
        return false;
      }
      if (dateFilter === 'week' && (!eventDate || eventDate < startOfToday || eventDate >= endOfWeek)) {
        return false;
      }
      if (locationFilter) {
        const matchLocation = event.location?.toLowerCase().includes(locationFilter.toLowerCase());
        if (!matchLocation) return false;
      }
      if (interestFilter) {
        const interestMatch =
          event.description?.toLowerCase().includes(interestFilter.toLowerCase()) ||
          event.name?.toLowerCase().includes(interestFilter.toLowerCase());
        if (!interestMatch) return false;
      }
      return true;
    });
  }, [events, dateFilter, locationFilter, interestFilter]);

  const handleResetFilters = () => {
    setDateFilter('all');
    setLocationFilter('');
    setInterestFilter('');
    setIsDateOpen(false);
    setIsLocationOpen(false);
    setIsInterestOpen(false);
  };

  const handleDateSelect = (value: 'all' | 'today' | 'week') => {
    setDateFilter(value);
    setIsDateOpen(false);
  };

  const handleLocationSelect = (value: string) => {
    setLocationFilter(value);
    setIsLocationOpen(false);
  };

  const handleInterestSelect = (value: string) => {
    setInterestFilter(value);
    setIsInterestOpen(false);
  };

  const handleCustomLocation = () => {
    const value = window.prompt('Filter by location (leave blank to reset):', locationFilter);
    if (value !== null) {
      setLocationFilter(value.trim());
    }
    setIsLocationOpen(false);
  };

  const handleCustomInterest = () => {
    const value = window.prompt('Filter by interest keyword (leave blank to reset):', interestFilter);
    if (value !== null) {
      setInterestFilter(value.trim());
    }
    setIsInterestOpen(false);
  };

  const dateLabel =
    dateFilter === 'all' ? 'Any time ▾' : dateFilter === 'today' ? 'Today ▾' : 'This week ▾';
  const locationLabel = locationFilter ? `${locationFilter} ▾` : 'Location ▾';
  const interestLabel = interestFilter ? `${interestFilter} ▾` : 'Interests ▾';
  return (
    <div className="events-page">
      <header className="events-header">
        <h1>Events</h1>
        <div className="filters">
          <div className={`filter-chip ${isDateOpen ? 'open' : ''}`} ref={dateRef}>
            <button type="button" className="chip" onClick={() => setIsDateOpen((prev) => !prev)}>
              {dateLabel}
            </button>
            {isDateOpen && (
              <div className="filters-menu">
                <button type="button" onClick={() => handleDateSelect('all')}>
                  Any time
                </button>
                <button type="button" onClick={() => handleDateSelect('today')}>
                  Today
                </button>
                <button type="button" onClick={() => handleDateSelect('week')}>
                  This week
                </button>
              </div>
            )}
          </div>

          <div className={`filter-chip ${isLocationOpen ? 'open' : ''}`} ref={locationRef}>
            <button type="button" className="chip" onClick={() => setIsLocationOpen((prev) => !prev)}>
              {locationLabel}
            </button>
            {isLocationOpen && (
              <div className="filters-menu">
                <button type="button" onClick={() => handleLocationSelect('')}>
                  All locations
                </button>
                {locationOptions.map((option) => (
                  <button key={option} type="button" onClick={() => handleLocationSelect(option)}>
                    {option}
                  </button>
                ))}
                <button type="button" className="custom-option" onClick={handleCustomLocation}>
                  Custom…
                </button>
              </div>
            )}
          </div>

          <div className={`filter-chip ${isInterestOpen ? 'open' : ''}`} ref={interestRef}>
            <button type="button" className="chip" onClick={() => setIsInterestOpen((prev) => !prev)}>
              {interestLabel}
            </button>
            {isInterestOpen && (
              <div className="filters-menu">
                <button type="button" onClick={() => handleInterestSelect('')}>
                  All interests
                </button>
                {interestOptions.map((option) => (
                  <button key={option} type="button" onClick={() => handleInterestSelect(option)}>
                    {option}
                  </button>
                ))}
                <button type="button" className="custom-option" onClick={handleCustomInterest}>
                  Custom…
                </button>
              </div>
            )}
          </div>

          <div className={`filter-chip ${isSettingsOpen ? 'open' : ''}`}>
                    <button
                      className="chip settings"
                      aria-label="Settings"
                      onClick={() => setIsSettingsOpen((prev) => !prev)}
                      ref={settingsRef}
                    >
                      <FontAwesomeIcon icon={faCog} />
                    </button>
            {isSettingsOpen && (
              <div className="filters-menu settings-menu">
                <button type="button" onClick={() => {
                  setIsSettingsOpen(false);
                  onNavigate('profile');
                }}>
                  Profile
                </button>
                <button type="button" onClick={() => {
                  setIsSettingsOpen(false);
                  onLogout();
                }}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="events-list">
        {filteredEvents.map((ev) => (
          <section key={ev.id} className="event-group">
            <h2 className="group-title">{new Date(ev.startTime || '').toDateString()}</h2>
            <article
              className="event-card clickable"
              role="button"
              tabIndex={0}
              onClick={() => onSelectEvent(ev)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectEvent(ev);
                }
              }}
            >
              <div className="event-text">
                <h3 className="event-title">{ev.name}</h3>
                <p>{ev.description}</p>
              </div>
              <div className="event-media">
                {ev.coverUrl ? (
                  <img className="event-image" src={ev.coverUrl} alt={ev.name} />
                ) : (
                  <img
                    className="event-image placeholder"
                    src="/assets/place_to_date_placeholder.png"
                    alt=""
                    aria-hidden="true"
                  />
                )}
                {ev.ownerUid && ev.ownerUid === currentUserId && (
                  <button
                    type="button"
                    className="event-edit-indicator"
                    aria-label={`Edit ${ev.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditEvent(ev);
                    }}
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                )}
              </div>
            </article>
          </section>
        ))}
      </main>

      <button className="fab add-event" onClick={onAddNewEvent}>
        <span className="fab-icon">＋</span>
        <span className="fab-label">Add New Event</span>
      </button>

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

export default Events;


