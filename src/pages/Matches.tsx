import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faHeart, faUser } from '@fortawesome/free-solid-svg-icons';
import { collection, query, where, onSnapshot, doc, getDoc, orderBy, FirestoreError } from 'firebase/firestore';
import { db } from '../firebaseConfig';

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
  userId?: string; // Firebase user ID - required for chat to work properly
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
  currentUserId?: string | null;
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

function Matches({ onNavigate, activeView, onSelectMatch, currentUserId }: MatchesProps) {
  const [matches, setMatches] = useState<MatchProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const likesCount = matches.length;

  useEffect(() => {
    if (!currentUserId) {
      setIsLoading(false);
      return;
    }

    console.log('Fetching matches for user:', currentUserId);
    
    // Query matches where current user is a participant
    const matchesRef = collection(db, 'matches');
    
    // Try with orderBy first, fallback to without orderBy if index is missing
    let q;
    try {
      q = query(
        matchesRef,
        where('participants', 'array-contains', currentUserId),
        orderBy('lastMessageAt', 'desc')
      );
    } catch (error) {
      // If orderBy fails, use just the where clause
      console.warn('OrderBy not available, using query without orderBy');
      q = query(
        matchesRef,
        where('participants', 'array-contains', currentUserId)
      );
    }

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        console.log('Found', snapshot.size, 'matches');
        const matchesList: MatchProfile[] = [];

        // Process each match document
        for (const matchDoc of snapshot.docs) {
          const matchData = matchDoc.data();
          
          // Get the other user's ID (not the current user)
          const otherUserId = matchData.user1Id === currentUserId 
            ? matchData.user2Id 
            : matchData.user1Id;
          
          const otherUserName = matchData.user1Id === currentUserId 
            ? matchData.user2Name 
            : matchData.user1Name;

          try {
            // Fetch the other user's profile data
            const userDoc = await getDoc(doc(db, 'users', otherUserId));
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              
              // Create MatchProfile from user data
              const matchProfile: MatchProfile = {
                name: userData.name || otherUserName || 'Unknown',
                age: userData.age || 0,
                location: userData.location || userData.homeLocation || '',
                interests: userData.interests || [],
                compatibility: 0, // Could calculate this based on shared interests
                avatar: userData.avatar || userData.photoURL || '',
                goal: userData.goal || '',
                about: userData.about || '',
                photos: userData.photos || [],
                positions: userData.positions || [],
                userId: otherUserId, // Important: include the actual user ID
                sharedEvents: [], // Could fetch shared events if needed
              };
              
              matchesList.push(matchProfile);
            } else {
              // If user document doesn't exist, create a basic match profile
              console.warn('User document not found for:', otherUserId);
              const matchProfile: MatchProfile = {
                name: otherUserName || 'Unknown User',
                age: 0,
                location: '',
                interests: [],
                compatibility: 0,
                avatar: '',
                goal: '',
                about: '',
                photos: [],
                positions: [],
                userId: otherUserId,
                sharedEvents: [],
              };
              matchesList.push(matchProfile);
            }
          } catch (error) {
            console.error('Error fetching user data for match:', error);
          }
        }

        // Sort by lastMessageAt if we didn't use orderBy
        matchesList.sort((a, b) => {
          // This is a simplified sort - in a real app you'd track lastMessageAt in MatchProfile
          return 0; // Keep original order or implement proper sorting
        });

        // If no real matches, show sample matches for demo
        if (matchesList.length === 0) {
          console.log('No real matches found, showing sample matches');
          setMatches(sampleMatches);
        } else {
          setMatches(matchesList);
        }
        
        setIsLoading(false);
      },
      (error: FirestoreError) => {
        console.error('Error fetching matches:', error);
        console.error('Error code:', error?.code);
        
        // If error is about missing index, try without orderBy
        if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
          console.log('Trying query without orderBy');
          const qFallback = query(
            matchesRef,
            where('participants', 'array-contains', currentUserId)
          );
          
          onSnapshot(qFallback, async (snapshot) => {
            // Same processing logic as above
            const matchesList: MatchProfile[] = [];
            for (const matchDoc of snapshot.docs) {
              const matchData = matchDoc.data();
              const otherUserId = matchData.user1Id === currentUserId 
                ? matchData.user2Id 
                : matchData.user1Id;
              const otherUserName = matchData.user1Id === currentUserId 
                ? matchData.user2Name 
                : matchData.user1Name;

              try {
                const userDoc = await getDoc(doc(db, 'users', otherUserId));
                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  const matchProfile: MatchProfile = {
                    name: userData.name || otherUserName || 'Unknown',
                    age: userData.age || 0,
                    location: userData.location || userData.homeLocation || '',
                    interests: userData.interests || [],
                    compatibility: 0,
                    avatar: userData.avatar || userData.photoURL || '',
                    goal: userData.goal || '',
                    about: userData.about || '',
                    photos: userData.photos || [],
                    positions: userData.positions || [],
                    userId: otherUserId,
                    sharedEvents: [],
                  };
                  matchesList.push(matchProfile);
                }
              } catch (err) {
                console.error('Error fetching user data:', err);
              }
            }
            setMatches(matchesList.length > 0 ? matchesList : sampleMatches);
            setIsLoading(false);
          });
        } else {
          // Fall back to sample matches on other errors
          setMatches(sampleMatches);
          setIsLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [currentUserId]);

  return (
    <div className="matches-page">
      <header className="matches-header">
        <h1>Matches</h1>
        <p>People who are excited to meet up. Reach out and plan something fun!</p>
      </header>

      <main className="matches-list">
        {isLoading ? (
          <div className="chat-empty-state">
            <p>Loading matches...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="chat-empty-state">
            <p>No matches yet. Start chatting with people at events!</p>
          </div>
        ) : (
          matches.map((match) => (
            <article
              key={match.userId || match.name}
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
          ))
        )}
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

