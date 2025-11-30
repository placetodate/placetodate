import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
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
import Chat from './pages/Chat';
import ProtectedRoute from './components/ProtectedRoute';

type NavView = 'events' | 'matches' | 'profile';

type ProfileData = {
  name: string;
  dateOfBirth?: string;
  age?: number;
  gender?: string;
  interestedIn?: string;
  homeLocation?: string;
  education?: string;
  hobbies?: string;
  location: string;
  goal?: string;
  about?: string;
  interests?: string[];
  photos: string[];
  avatar: string;
  makeAllPhotosVisible?: boolean;
  positions?: string[];
};

// Wrapper components for routes that need props
const EventsRoute: React.FC<{ user: User | null }> = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };
  
  return (
    <Events
      currentUserId={user?.uid}
      onAddNewEvent={() => navigate('/events/create')}
      onSelectEvent={(ev) => navigate(`/events/${ev.id}`)}
      onEditEvent={(ev) => navigate(`/events/${ev.id}/edit`)}
      onNavigate={(view) => navigate(`/${view}`)}
      activeView={getActiveView(location.pathname)}
      onLogout={handleLogout}
    />
  );
};

const CreateEventRoute: React.FC<{ user: User | null }> = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id?: string }>();
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [isLoading, setIsLoading] = useState(!!id);

  useEffect(() => {
    if (id) {
      const fetchEvent = async () => {
        try {
          const eventDoc = await getDoc(doc(db, 'events', id));
          if (eventDoc.exists()) {
            setEditingEvent({ id: eventDoc.id, ...eventDoc.data() } as EventItem);
          }
        } catch (error) {
          console.error('Error fetching event:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchEvent();
    }
  }, [id]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <CreateEvent
      mode={editingEvent ? 'update' : 'create'}
      initialEvent={editingEvent || undefined}
      onClose={() => navigate('/events')}
      onNavigate={(view) => navigate(`/${view}`)}
      activeView={getActiveView(location.pathname)}
    />
  );
};

const EventDetailsRoute: React.FC<{ user: User | null }> = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchEvent = async () => {
        try {
          const eventDoc = await getDoc(doc(db, 'events', id));
          if (eventDoc.exists()) {
            setEvent({ id: eventDoc.id, ...eventDoc.data() } as EventItem);
          } else {
            navigate('/events');
          }
        } catch (error) {
          console.error('Error fetching event:', error);
          navigate('/events');
        } finally {
          setIsLoading(false);
        }
      };
      fetchEvent();
    }
  }, [id, navigate]);

  const handleDelete = async (eventToDelete: EventItem) => {
    try {
      await deleteDoc(doc(db, 'events', eventToDelete.id));
      navigate('/events');
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!event) {
    return null;
  }

  return (
    <EventDetails
      event={event}
      onBack={() => navigate('/events')}
      canDelete={event.ownerUid === user?.uid}
      onDelete={handleDelete}
      onNavigate={(view) => navigate(`/${view}`)}
      activeView={getActiveView(location.pathname)}
      onSelectMatch={(match) => navigate(`/matches/${match.name.toLowerCase().replace(/\s+/g, '-')}`, { state: { match, from: location.pathname } })}
      currentUserId={user?.uid}
    />
  );
};

const MatchesRoute: React.FC<{ user: User | null }> = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <Matches
      currentUserId={user?.uid}
      onNavigate={(view) => navigate(`/${view}`)}
      activeView={getActiveView(location.pathname)}
      onSelectMatch={(match) => navigate(`/matches/${match.name.toLowerCase().replace(/\s+/g, '-')}`, { state: { match, from: location.pathname } })}
    />
  );
};

const MatchProfileRoute: React.FC<{ user: User | null }> = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const match = (location.state as any)?.match as MatchProfile | undefined;
  const fromPath = (location.state as any)?.from as string | undefined;
  
  if (!match) {
    // If no match in state, redirect back to matches
    navigate('/matches');
    return null;
  }

  const handleBack = () => {
    // If we know where the user came from, go back there, otherwise go to matches
    if (fromPath) {
      navigate(fromPath);
    } else {
      navigate('/matches');
    }
  };

  const handleChat = (matchToChat: MatchProfile) => {
    navigate(`/chat/${matchToChat.name.toLowerCase().replace(/\s+/g, '-')}`, {
      state: { match: matchToChat, from: location.pathname },
    });
  };

  return (
    <MatchProfileView
      match={match}
      onBack={handleBack}
      onNavigate={(view) => navigate(`/${view}`)}
      activeView={getActiveView(location.pathname)}
      onChat={handleChat}
    />
  );
};

const ChatRoute: React.FC<{ user: User | null }> = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const match = (location.state as any)?.match as MatchProfile | undefined;
  const fromPath = (location.state as any)?.from as string | undefined;

  if (!match || !user) {
    navigate('/matches');
    return null;
  }

  const handleBack = () => {
    if (fromPath) {
      navigate(fromPath);
    } else {
      navigate('/matches');
    }
  };

  return (
    <Chat
      match={match}
      currentUserId={user.uid}
      onBack={handleBack}
      onNavigate={(view) => navigate(`/${view}`)}
      activeView={getActiveView(location.pathname)}
    />
  );
};

const ProfileRoute: React.FC<{ user: User | null; profileData: ProfileData; onUpdateProfile: (profile: ProfileData) => void; profileLoading: boolean }> = ({ user, profileData, onUpdateProfile, profileLoading }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };
  
  if (profileLoading) {
    return <div>Loading profile...</div>;
  }
  
  return (
    <Profile
      profile={profileData}
      onUpdate={onUpdateProfile}
      onNavigate={(view) => navigate(`/${view}`)}
      activeView={getActiveView(location.pathname)}
      onLogout={handleLogout}
      user={user}
    />
  );
};

const LoginRoute: React.FC<{ onGoogleLogin: () => Promise<void> }> = ({ onGoogleLogin }) => {
  const navigate = useNavigate();
  
  const handleGoogleLogin = async () => {
    await onGoogleLogin();
    navigate('/events');
  };

  return (
    <Login
      onSignUp={() => console.log("Sign up clicked")}
      onLogin={() => console.log("Login clicked")}
      onLoginWithGoogle={handleGoogleLogin}
      onLoginWithFacebook={() => console.log("Facebook login clicked")}
      onForgotPassword={() => console.log("Forgot password clicked")}
    />
  );
};

function getActiveView(pathname: string): NavView {
  if (pathname.startsWith('/profile')) return 'profile';
  if (pathname.startsWith('/matches')) return 'matches';
  return 'events';
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loginCount, setLoginCount] = useState<number | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    location: '',
    photos: [],
    avatar: '',
  });
  const [profileLoading, setProfileLoading] = useState(true);

  const loadProfileData = async (userId: string) => {
    try {
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        setProfileData({
          name: data.name || data.displayName || '',
          dateOfBirth: data.dateOfBirth || '',
          age: data.age,
          gender: data.gender || '',
          interestedIn: data.interestedIn || '',
          homeLocation: data.homeLocation || data.location || '',
          education: data.education || '',
          hobbies: data.hobbies || '',
          location: data.location || data.homeLocation || '',
          goal: data.goal || '',
          about: data.about || '',
          interests: data.interests || [],
          photos: data.photos || [],
          avatar: data.avatar || data.photoURL || '',
          makeAllPhotosVisible: data.makeAllPhotosVisible || false,
          positions: data.positions,
        });
      } else {
        // Set default values if profile doesn't exist
        // Try to get from auth user
        const authUser = auth.currentUser;
        setProfileData({
          name: authUser?.displayName || '',
          location: '',
          photos: [],
          avatar: authUser?.photoURL || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdateProfile = async (nextProfile: ProfileData) => {
    if (!user) {
      console.error('No user found, cannot save profile');
      return;
    }
    
    try {
      const userRef = doc(db, "users", user.uid);
      
      // Remove undefined values before saving to Firebase
      const cleanProfile: any = {};
      Object.keys(nextProfile).forEach((key) => {
        const value = (nextProfile as any)[key];
        if (value !== undefined) {
          cleanProfile[key] = value;
        }
      });
      
      // Use setDoc with merge to create or update the document
      await setDoc(userRef, {
        ...cleanProfile,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setProfileData(nextProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
      // If update fails, still update local state
      setProfileData(nextProfile);
      throw error; // Re-throw to let the component know there was an error
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        getDoc(userRef).then(docSnap => {
          if (docSnap.exists()) {
            setLoginCount(docSnap.data().loginCount);
          } else {
            setLoginCount(0);
          }
        });
        // Load profile data
        loadProfileData(currentUser.uid);
      } else {
        setLoginCount(null);
        setProfileLoading(false);
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
          avatar: result.user.photoURL || '',
          photos: [],
          location: '',
        });
      }
      // Load profile data after login
      loadProfileData(result.user.uid);
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

  // Show loading screen while checking auth state
  if (authLoading) {
    return (
      <div className={`App ${user ? '' : 'login-mode'}`} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className={`App ${user ? '' : 'login-mode'}`}>
      <Routes>
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/events" replace />
            ) : (
              <LoginRoute onGoogleLogin={handleGoogleLogin} />
            )
          }
        />
        <Route
          path="/"
          element={
            user ? (
              <Navigate to="/events" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/events"
          element={
            <ProtectedRoute user={user}>
              <EventsRoute user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/create"
          element={
            <ProtectedRoute user={user}>
              <CreateEventRoute user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:id"
          element={
            <ProtectedRoute user={user}>
              <EventDetailsRoute user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:id/edit"
          element={
            <ProtectedRoute user={user}>
              <CreateEventRoute user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/matches"
          element={
            <ProtectedRoute user={user}>
              <MatchesRoute user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/matches/:id"
          element={
            <ProtectedRoute user={user}>
              <MatchProfileRoute user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:id"
          element={
            <ProtectedRoute user={user}>
              <ChatRoute user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute user={user}>
              <ProfileRoute user={user} profileData={profileData} onUpdateProfile={handleUpdateProfile} profileLoading={profileLoading} />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
