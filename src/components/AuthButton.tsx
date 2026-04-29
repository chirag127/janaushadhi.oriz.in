---
// src/components/AuthButton.tsx
// Authentication button (React island)

import { useState, useEffect } from 'react';
import { auth, googleProvider, signInWithGoogle, signOutUser, onAuthStateChanged } from '../lib/firebase';

export default function AuthButton() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign-in error:', error);
      alert('Failed to sign in. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error('Sign-out error:', error);
    }
  };

  if (loading) {
    return <div className="auth-loading">...</div>;
  }

  if (user) {
    return (
      <div className="auth-user">
        <img
          src={user.photoURL || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}
          alt="Profile"
          className="user-avatar"
        />
        <span className="user-name">{user.displayName?.split(' ')[0]}</span>
        <button onClick={handleSignOut} className="sign-out-btn">
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button className="sign-in-btn" onClick={handleSignIn}>
      Sign in
    </button>
  );
}
