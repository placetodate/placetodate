import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, googleProvider, db } from './firebaseConfig';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, increment, deleteDoc, collection, addDoc, serverTimestamp, getDocs, query } from "firebase/firestore";
import Login from './pages/Login';
import Events, { type EventItem } from './pages/Events';
import CreateEvent from './pages/CreateEvent';
import EventDetails from './pages/EventDetails';
import Profile from './pages/Profile';
import Matches, { type MatchProfile } from './pages/Matches';
import MatchProfileView from './pages/MatchProfile';

type MainView = 'events' | 'createEvent' | 'eventDetails' | 'profile' | 'matches' | 'matchProfile';
type NavView = 'events' | 'matches' | 'profile';

type ProfileData = {
  name: string;
  age: number;
  location: string;
  goal: string;
  about: string;
  interests: string[];
  photos: string[];
  avatar: string;
  positions?: string[];
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loginCount, setLoginCount] = useState<number | null>(null);
  const [view, setView] = useState<MainView>('events');
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<MatchProfile | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: 'Stav',
    age: 28,
    location: 'Tel Aviv',
    goal: 'Looking for a relationship',
    about:
      "I'm a software engineer who loves hiking, photography, and exploring new cultures. I'm looking for someone who is adventurous, kind, and enjoys deep conversations.",
    interests: ['Hiking', 'Photography', 'Travel', 'Tech', 'Foodie', 'Music'],
    photos: [
      'https://i.pravatar.cc/600?img=45',
      'https://i.pravatar.cc/600?img=45&seed=stav1',
      'https://i.pravatar.cc/600?img=45&seed=stav2',
      'https://i.pravatar.cc/600?img=45&seed=stav3',
    ],
    avatar: 'https://i.pravatar.cc/240?img=45',
    positions: ['Software Engineer', 'Full Stack Developer'],
  });

  const handleDeleteEvent = async (event: EventItem) => {
    try {
      await deleteDoc(doc(db, 'events', event.id));
    } catch (err) {
      console.error(err);
    } finally {
      setSelectedEvent(null);
      setEditingEvent(null);
      setView('events');
    }
  };

  const handleNavigate = (target: NavView) => {
    setSelectedEvent(null);
    setEditingEvent(null);
    setView(target);
  };

  const activeNav: NavView =
    view === 'profile' ? 'profile' : view === 'matches' || view === 'matchProfile' ? 'matches' : 'events';
  const handleUpdateProfile = (nextProfile: ProfileData) => {
    setProfileData(nextProfile);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        getDoc(userRef).then(docSnap => {
          if (docSnap.exists()) {
            setLoginCount(docSnap.data().loginCount);
          } else {
            setLoginCount(0);
          }
        });
      } else {
        setLoginCount(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userRef = doc(db, "users", result.user.uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        await updateDoc(userRef, {
          loginCount: increment(1)
        });
      } else {
        await setDoc(userRef, {
          name: result.user.displayName,
          email: result.user.email,
          loginCount: 1,
        });
      }
    } catch (error) {
      console.error("Error signing in with Google: ", error);
    }
  };

  const handleFacebookLogin = () => {
    console.log("Facebook login clicked");
    // Implement Facebook login here
  };

  const handleSignUp = () => {
    console.log("Sign up clicked");
    // Implement Sign up here
  };

  const handleLogin = () => {
    console.log("Login clicked");
    // Implement Login here
  };

  const handleForgotPassword = () => {
    console.log("Forgot password clicked");
    // Implement Forgot password here
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  // Development helper: Seed demonstration events
  const seedDemoEvents = async () => {
    if (!auth.currentUser) {
      console.error('Must be logged in to seed events');
      return;
    }

    const demoEvents = [
      {
        name: 'Sunset Yoga at Tel Aviv Beach',
        description: 'Join us for a relaxing sunset yoga session on the beach. All levels welcome! Bring your mat and enjoy the beautiful sunset while practicing yoga.',
        location: 'Tel Aviv Beach, Tel Aviv',
        locationCoords: { lat: 32.0853, lng: 34.7818 },
        startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
        endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(), // +90 minutes
        interests: ['Wellness', 'Outdoors', 'Yoga'],
        coverUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
        ownerUid: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      },
      {
        name: 'Food & Wine Tasting in Jaffa',
        description: 'Explore the flavors of Jaffa with a guided food and wine tasting tour. Sample local delicacies, wines, and learn about the culinary history of this ancient port city.',
        location: 'Jaffa Old City, Tel Aviv',
        locationCoords: { lat: 32.0544, lng: 34.7522 },
        startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
        endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(), // +3 hours
        interests: ['Food & Drink', 'Culture', 'Wine'],
        coverUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80',
        ownerUid: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      },
      {
        name: 'Live Jazz Night at Rothschild',
        description: 'Enjoy an evening of live jazz music at one of Tel Aviv\'s most vibrant venues. Featuring local musicians and a great atmosphere.',
        location: 'Rothschild Boulevard, Tel Aviv',
        locationCoords: { lat: 32.0640, lng: 34.7740 },
        startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(), // +4 hours
        interests: ['Live Music', 'Jazz', 'Nightlife'],
        coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80',
        ownerUid: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      },
      {
        name: 'Hiking in Ein Gedi Nature Reserve',
        description: 'Discover the beautiful waterfalls and wildlife of Ein Gedi. A moderate hike suitable for all fitness levels. Bring water and comfortable shoes!',
        location: 'Ein Gedi Nature Reserve, Dead Sea',
        locationCoords: { lat: 31.4614, lng: 35.3889 },
        startTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
        endTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(), // +5 hours
        interests: ['Hiking', 'Outdoors', 'Nature'],
        coverUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=80',
        ownerUid: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      },
      {
        name: 'Art Gallery Opening in Neve Tzedek',
        description: 'Join us for the opening of a new contemporary art exhibition featuring local Israeli artists. Wine and light refreshments will be served.',
        location: 'Neve Tzedek, Tel Aviv',
        locationCoords: { lat: 32.0608, lng: 34.7656 },
        startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(), // +3 hours
        interests: ['Art & Culture', 'Gallery', 'Networking'],
        coverUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=1200&q=80',
        ownerUid: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      },
      {
        name: 'Tech Meetup: AI & Startups',
        description: 'Monthly tech meetup discussing the latest trends in AI and startup culture. Great networking opportunity for tech professionals and entrepreneurs.',
        location: 'WeWork, Rothschild Boulevard, Tel Aviv',
        locationCoords: { lat: 32.0640, lng: 34.7740 },
        startTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
        endTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // +2 hours
        interests: ['Tech & Startups', 'Networking', 'AI'],
        coverUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
        ownerUid: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      },
      {
        name: 'Cooking Class: Mediterranean Cuisine',
        description: 'Learn to cook authentic Mediterranean dishes in a hands-on cooking class. All ingredients provided. Take home recipes and new cooking skills!',
        location: 'Culinary Studio, Tel Aviv',
        locationCoords: { lat: 32.0853, lng: 34.7818 },
        startTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days from now
        endTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(), // +3 hours
        interests: ['Food & Drink', 'Cooking', 'Mediterranean'],
        coverUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80',
        ownerUid: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      },
      {
        name: 'Beach Volleyball Tournament',
        description: 'Friendly beach volleyball tournament. Teams of 4. All skill levels welcome. Prizes for winners!',
        location: 'Gordon Beach, Tel Aviv',
        locationCoords: { lat: 32.0853, lng: 34.7818 },
        startTime: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(), // 9 days from now
        endTime: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(), // +4 hours
        interests: ['Sports', 'Beach', 'Volleyball'],
        coverUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
        ownerUid: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      },
    ];

    try {
      for (const event of demoEvents) {
        await addDoc(collection(db, 'events'), event);
      }
      console.log('Demo events seeded successfully!');
    } catch (error) {
      console.error('Error seeding demo events:', error);
    }
  };

  // Development helper: Delete test events
  const deleteTestEvents = async () => {
    if (!auth.currentUser) {
      console.error('Must be logged in to delete events');
      return;
    }

    const testEventNames = ['test 123', 'event one', 'test'];
    
    try {
      const eventsRef = collection(db, 'events');
      const q = query(eventsRef);
      const querySnapshot = await getDocs(q);
      
      let deletedCount = 0;
      for (const docSnap of querySnapshot.docs) {
        const eventData = docSnap.data();
        const eventName = eventData.name?.toLowerCase() || '';
        
        // Delete if name matches test patterns or contains heart emoji
        if (
          testEventNames.some(testName => eventName.includes(testName.toLowerCase())) ||
          eventName.includes('❤️') ||
          eventName.includes('💖') ||
          eventName.includes('heart')
        ) {
          await deleteDoc(doc(db, 'events', docSnap.id));
          deletedCount++;
          console.log(`Deleted: ${eventData.name}`);
        }
      }
      
      console.log(`Deleted ${deletedCount} test event(s)`);
    } catch (error) {
      console.error('Error deleting test events:', error);
    }
  };

  // Make helper functions available globally for development
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).seedDemoEvents = seedDemoEvents;
      (window as any).deleteTestEvents = deleteTestEvents;
    }
  }, [user]);

  return (
    <div className={`App ${user ? '' : 'login-mode'}`}>
      {user ? (
        view === 'events' ? (
          <Events
            currentUserId={user?.uid}
            onAddNewEvent={() => {
              setEditingEvent(null);
              setView('createEvent');
            }}
            onSelectEvent={(ev) => {
              setSelectedEvent(ev);
              setView('eventDetails');
            }}
            onEditEvent={(ev) => {
              setEditingEvent(ev);
              setView('createEvent');
            }}
            onNavigate={handleNavigate}
            activeView={activeNav}
            onLogout={handleLogout}
          />
        ) : view === 'createEvent' ? (
          <CreateEvent
            mode={editingEvent ? 'update' : 'create'}
            initialEvent={editingEvent || undefined}
            onClose={() => {
              setEditingEvent(null);
              setView('events');
            }}
            onNavigate={handleNavigate}
            activeView={activeNav}
          />
        ) : view === 'eventDetails' ? (
          selectedEvent && (
            <EventDetails
              event={selectedEvent}
              onBack={() => {
                setSelectedEvent(null);
                setView('events');
              }}
              canDelete={selectedEvent.ownerUid === user?.uid}
              onDelete={handleDeleteEvent}
              onNavigate={handleNavigate}
              activeView={activeNav}
              onSelectMatch={(match) => {
                setSelectedMatch(match);
                setView('matchProfile');
              }}
            />
          )
        ) : view === 'matches' ? (
          <Matches
            onNavigate={handleNavigate}
            activeView={activeNav}
            onSelectMatch={(match) => {
              setSelectedMatch(match);
              setView('matchProfile');
            }}
          />
        ) : view === 'matchProfile' ? (
          selectedMatch && (
            <MatchProfileView
              match={selectedMatch}
              onBack={() => setView('matches')}
              onNavigate={handleNavigate}
              activeView={activeNav}
            />
          )
        ) : (
          <Profile
            profile={profileData}
            onUpdate={handleUpdateProfile}
            onNavigate={handleNavigate}
            activeView={activeNav}
            onLogout={handleLogout}
          />
        )
      ) : (
        <Login
          onSignUp={handleSignUp}
          onLogin={handleLogin}
          onLoginWithGoogle={handleGoogleLogin}
          onLoginWithFacebook={handleFacebookLogin}
          onForgotPassword={handleForgotPassword}
        />
      )}
    </div>
  );
}

export default App;
