import React, { useState, useEffect } from 'react';
import type { EventItem } from './Events';
import type { MatchProfile } from './Matches';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faTrash, faCalendar, faHeart, faUser } from '@fortawesome/free-solid-svg-icons';
import { collection, getDocs, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import AvatarDisplay from '../components/AvatarDisplay';

type EventDetailsProps = {
  event: EventItem;
  onBack: () => void;
  onDelete?: (event: EventItem) => Promise<void> | void;
  canDelete?: boolean;
  onNavigate: (view: 'events' | 'matches' | 'profile') => void;
  activeView: 'events' | 'matches' | 'profile';
  onSelectMatch?: (match: MatchProfile) => void;
  currentUserId?: string | null;
};

const fallbackCover = '/assets/events_illustration.png';

type AttendeeUser = {
  uid: string;
  name: string;
  avatar?: string;
  age?: number;
  location?: string;
  goal?: string;
  about?: string;
  interests?: string[];
  positions?: string[];
  photos?: string[];
  gender?: string;
  useIconAvatar?: boolean; // Flag to indicate if we should use icon instead of image
  makeAllPhotosVisible?: boolean; // Flag to determine if avatar should be used
};


function EventDetails({
  event,
  onBack,
  onDelete,
  canDelete = false,
  onNavigate,
  activeView,
  onSelectMatch,
  currentUserId,
}: EventDetailsProps) {
  const coverUrl = event.coverUrl || fallbackCover;
  const [isDeleting, setIsDeleting] = useState(false);
  const [attendees, setAttendees] = useState<AttendeeUser[]>([]);
  const [isLoadingAttendees, setIsLoadingAttendees] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isCheckingJoinStatus, setIsCheckingJoinStatus] = useState(true);
  const likesCount = 3;

  useEffect(() => {
    const fetchAttendees = async () => {
      try {
        setIsLoadingAttendees(true);
        // Fetch attendees from the event's attendees subcollection
        const attendeesRef = collection(db, 'events', event.id, 'attendees');
        const attendeesSnapshot = await getDocs(attendeesRef);
        
        const attendeesList: AttendeeUser[] = [];
        
        for (const attendeeDoc of attendeesSnapshot.docs) {
          const attendeeData = attendeeDoc.data();
          const userId = attendeeData.userId || attendeeDoc.id;
          
          // Check if current user has joined
          if (currentUserId && userId === currentUserId) {
            setHasJoined(true);
            // Skip adding current user to the attendees list
            continue;
          }
          
          // Fetch user profile data
          try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              // Get the first photo from profile photos, or fall back to avatar
              const userPhotos = userData.photos || [];
              const userGender = userData.gender;
              const makeAllPhotosVisible = userData.makeAllPhotosVisible !== false; // Default to true if not set
              
              // Determine display image based on makeAllPhotosVisible setting
              // If makeAllPhotosVisible is false, use avatar; otherwise use first photo
              let displayImage = '';
              if (!makeAllPhotosVisible) {
                // Use avatar when makeAllPhotosVisible is unchecked
                displayImage = userData.avatar || userData.photoURL || '';
                // If no avatar but has photos, use first photo as fallback
                if (!displayImage && userPhotos.length > 0) {
                  displayImage = userPhotos[0];
                }
              } else {
                // Use first photo when makeAllPhotosVisible is checked
                displayImage = userPhotos.length > 0 
                  ? userPhotos[0] 
                  : (userData.avatar || userData.photoURL || '');
              }

              attendeesList.push({
                uid: userId,
                name: userData.name || 'Unknown User',
                avatar: displayImage,
                age: userData.age,
                location: userData.location || userData.homeLocation,
                goal: userData.goal,
                about: userData.about,
                interests: userData.interests || [],
                positions: userData.positions || [],
                photos: userPhotos,
                gender: userGender,
                useIconAvatar: !displayImage || displayImage.trim() === '',
              });
            } else {
              // Fallback if user document doesn't exist
              // Try to use photos from attendee data, or fall back to avatar
              const fallbackPhotos = attendeeData.photos || [];
              const fallbackGender = attendeeData.gender;
              const fallbackImage = fallbackPhotos.length > 0
                ? fallbackPhotos[0]
                : (attendeeData.avatar || '');

              attendeesList.push({
                uid: userId,
                name: attendeeData.name || 'Unknown User',
                avatar: fallbackImage,
                photos: fallbackPhotos,
                gender: fallbackGender,
                useIconAvatar: !fallbackImage || fallbackImage.trim() === '',
              });
            }
          } catch (error) {
            console.error(`Error fetching user ${userId}:`, error);
            // Add with minimal data if user fetch fails
            // Try to use photos from attendee data, or fall back to avatar
            const errorPhotos = attendeeData.photos || [];
            const errorGender = attendeeData.gender;
            const errorImage = errorPhotos.length > 0
              ? errorPhotos[0]
              : (attendeeData.avatar || '');

            attendeesList.push({
              uid: userId,
              name: attendeeData.name || 'Unknown User',
              avatar: errorImage,
              photos: errorPhotos,
              gender: errorGender,
              useIconAvatar: !errorImage || errorImage.trim() === '',
            });
          }
        }
        
        setAttendees(attendeesList);
      } catch (error) {
        console.error('Error fetching attendees:', error);
        setAttendees([]);
      } finally {
        setIsLoadingAttendees(false);
        setIsCheckingJoinStatus(false);
      }
    };

    if (event.id) {
      fetchAttendees();
    } else {
      setIsCheckingJoinStatus(false);
    }
  }, [event.id, currentUserId]);

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

  const handleJoinEvent = async () => {
    if (!currentUserId || !event.id || hasJoined || isJoining) return;
    
    try {
      setIsJoining(true);
      
      // Add user to the event's attendees subcollection
      const attendeesRef = collection(db, 'events', event.id, 'attendees');
      await addDoc(attendeesRef, {
        userId: currentUserId,
        joinedAt: serverTimestamp(),
      });
      
      // Update join status - don't add current user to displayed attendees list
      setHasJoined(true);
    } catch (error) {
      console.error('Error joining event:', error);
      alert('Failed to join event. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleAttendeeClick = (attendee: AttendeeUser) => {
    if (!onSelectMatch) return;
    
    // Get display image: first photo from profile, or avatar
    // If no image, we'll use icon in the match profile view
    const displayImage = (attendee.photos && attendee.photos.length > 0)
      ? attendee.photos[0]
      : (attendee.avatar || '');

    // Convert attendee to MatchProfile format
    const matchProfile: MatchProfile = {
      name: attendee.name,
      age: attendee.age || 0,
      location: attendee.location || '',
      interests: attendee.interests || [],
      compatibility: 0, // No compatibility score for attendees
      avatar: displayImage,
      goal: attendee.goal || '',
      about: attendee.about || '',
      photos: attendee.photos && attendee.photos.length > 0 
        ? attendee.photos 
        : (displayImage ? [displayImage] : []),
      positions: attendee.positions || [],
      sharedEvents: [],
    };
    
    onSelectMatch(matchProfile);
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
        {currentUserId && !hasJoined && !isCheckingJoinStatus && (
          <button
            type="button"
            className="join-event-button"
            onClick={handleJoinEvent}
            disabled={isJoining}
          >
            {isJoining ? 'Joining...' : 'Join'}
          </button>
        )}
        <h3>Potential Matches</h3>
        {isLoadingAttendees ? (
          <p style={{ textAlign: 'center', color: '#8a6f7a', padding: '20px' }}>Loading attendees...</p>
        ) : attendees.length === 0 ? (
          <div className="empty-attendees-state">
            <div className="empty-attendees-icon">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M32 20C36.4183 20 40 16.4183 40 12C40 7.58172 36.4183 4 32 4C27.5817 4 24 7.58172 24 12C24 16.4183 27.5817 20 32 20Z" fill="#9CA3AF"/>
                <path d="M32 24C25.3726 24 20 29.3726 20 36V44C20 45.1046 20.8954 46 22 46H42C43.1046 46 44 45.1046 44 44V36C44 29.3726 38.6274 24 32 24Z" fill="#9CA3AF"/>
                <path d="M52 20C56.4183 20 60 16.4183 60 12C60 7.58172 56.4183 4 52 4C47.5817 4 44 7.58172 44 12C44 16.4183 47.5817 20 52 20Z" fill="#9CA3AF" opacity="0.6"/>
                <path d="M52 24C45.3726 24 40 29.3726 40 36V44C40 45.1046 40.8954 46 42 46H52C53.1046 46 54 45.1046 54 44V36C54 29.3726 48.6274 24 52 24Z" fill="#9CA3AF" opacity="0.6"/>
              </svg>
            </div>
            {hasJoined ? (
              <>
                <h4 className="empty-attendees-title">You're the first to join!</h4>
                <p className="empty-attendees-message">Invite your friends or check back later to see who else is coming.</p>
              </>
            ) : (
              <>
                <h4 className="empty-attendees-title">No one has joined yet</h4>
                <p className="empty-attendees-message">Be the first to join this event and invite your friends!</p>
              </>
            )}
          </div>
        ) : (
          <div className="match-grid">
            {attendees.map((attendee) => (
              <article
                key={attendee.uid}
                className="match-card"
                role={onSelectMatch ? 'button' : undefined}
                tabIndex={onSelectMatch ? 0 : -1}
                onClick={() => handleAttendeeClick(attendee)}
                onKeyDown={(e) => {
                  if (!onSelectMatch) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleAttendeeClick(attendee);
                  }
                }}
              >
                <div className="match-avatar">
                  <AvatarDisplay 
                    src={attendee.avatar || ''} 
                    alt={attendee.name} 
                    gender={attendee.gender}
                    className="match-avatar-img"
                    size="medium"
                  />
                </div>
                <div className="match-card-body">
                  <h4>{attendee.name}</h4>
                  <div className="attendee-details">
                    {attendee.age && (
                      <span className="attendee-detail-item">{attendee.age} years old</span>
                    )}
                    {attendee.location && (
                      <span className="attendee-detail-item">{attendee.location}</span>
                    )}
                    {attendee.positions && attendee.positions.length > 0 && (
                      <span className="attendee-detail-item">{attendee.positions[0]}</span>
                    )}
                  </div>
                  {attendee.goal && (
                    <p style={{ fontSize: '14px', color: '#7d6a76', marginTop: '8px', marginBottom: '0' }}>
                      {attendee.goal}
                    </p>
                  )}
                  {attendee.interests && attendee.interests.length > 0 && (
                    <div className="attendee-interests">
                      {attendee.interests.slice(0, 3).map((interest, idx) => (
                        <span key={idx} className="attendee-interest-tag">{interest}</span>
                      ))}
                      {attendee.interests.length > 3 && (
                        <span className="attendee-interest-tag">+{attendee.interests.length - 3}</span>
                      )}
                    </div>
                  )}
                  <div className="match-card-actions">
                    <button type="button" className="chip-button primary">
                      Chat
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
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


