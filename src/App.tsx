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

type MainView = 'events' | 'createEvent' | 'eventDetails' | 'profile';
type NavView = 'events' | 'matches' | 'profile';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loginCount, setLoginCount] = useState<number | null>(null);
  const [view, setView] = useState<MainView>('events');
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);

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
    if (target === 'profile') {
      setSelectedEvent(null);
      setEditingEvent(null);
      setView('profile');
      return;
    }

    // Matches currently routes to events list.
    setSelectedEvent(null);
    setEditingEvent(null);
    setView('events');
  };

  const activeNav: NavView = view === 'profile' ? 'profile' : 'events';

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
    <div className="App">
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
        ) : (
          <Profile
            onNavigate={handleNavigate}
            activeView={activeNav}
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
