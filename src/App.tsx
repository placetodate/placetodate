import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, googleProvider, db } from './firebaseConfig';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import Login from './pages/Login';
import Events from './pages/Events';
import CreateEvent from './pages/CreateEvent';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loginCount, setLoginCount] = useState<number | null>(null);
  const [view, setView] = useState<'events' | 'createEvent'>('events');

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
          <Events onAddNewEvent={() => setView('createEvent')} />
        ) : (
          <CreateEvent onClose={() => setView('events')} />
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
