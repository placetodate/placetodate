import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, googleProvider, db } from './firebaseConfig';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, increment, deleteDoc } from "firebase/firestore";
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
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loginCount, setLoginCount] = useState<number | null>(null);
  const [view, setView] = useState<MainView>('events');
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<MatchProfile | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: 'Ethan',
    age: 28,
    location: 'San Francisco',
    goal: 'Looking for a relationship',
    about:
      "I'm a software engineer who loves hiking, photography, and exploring new cultures. I'm looking for someone who is adventurous, kind, and enjoys deep conversations.",
    interests: ['Hiking', 'Photography', 'Travel', 'Tech', 'Foodie', 'Music'],
    photos: [
      'https://i.pravatar.cc/600?img=45',
      'https://i.pravatar.cc/600?img=11',
      'https://i.pravatar.cc/600?img=17',
    ],
    avatar: 'https://i.pravatar.cc/240?img=45',
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
