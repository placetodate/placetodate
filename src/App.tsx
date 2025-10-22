import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, googleProvider, db } from './firebaseConfig';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loginCount, setLoginCount] = useState<number | null>(null);

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
        <header className="App-header">
          <h1>Welcome, {user.displayName}!</h1>
          <p>Email: {user.email}</p>
          {loginCount !== null && <p>You have logged in {loginCount} times.</p>}
          <button onClick={handleLogout}>Logout</button>
        </header>
      ) : (
        <div className="login-screen">
          <img src="/assets/events_illustration.png" alt="Meet people at events" className="hero-image" />
          <div className="content">
            <h1>Meet people at events</h1>
            <p>Find people who are going to the same events as you. Meet them there!</p>

            <button className="primary-button" onClick={handleSignUp}>Sign up</button>
            <button className="secondary-button" onClick={handleLogin}>Log in</button>
            <button className="secondary-button" onClick={handleGoogleLogin}>Continue with Google</button>
            <button className="secondary-button" onClick={handleFacebookLogin}>Continue with Facebook</button>
            <a href="#" onClick={handleForgotPassword} className="forgot-password">Forgot Password?</a>
          </div>
          <nav className="bottom-nav">
            <button className="nav-item">🗓️</button>
            <button className="nav-item">👥</button>
            <button className="nav-item">🔍</button>
          </nav>
        </div>
      )}
    </div>
  );
}

export default App;
