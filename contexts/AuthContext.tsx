

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import api from '../services/api';
import { supabase } from '../services/supabaseClient';

interface AuthContextType {
  user: User | null;
  logout: () => void;
  setCurrentUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const userProfile = await api.getUserProfile(session.user.id);
        setUser(userProfile);
      }
      setLoading(false);
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      // This listener handles magic link login automatically.
      // When the user clicks the link, they are redirected, the supabase client
      // picks up the session from the URL, and this event fires.
      if (event === 'SIGNED_IN' && session?.user) {
        const userProfile = await api.getUserProfile(session.user.id);
        setUser(userProfile);
        // If it's a new user, the profile might not exist yet.
        // The SignupPage component will handle creating it.
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const setCurrentUser = (user: User | null) => {
    setUser(user);
  };
  
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };
  
  const refreshUser = useCallback(async () => {
    if (user && user.authUserId) {
      const latestUserData = await api.getUserProfile(user.authUserId);
      if (latestUserData) {
          setUser(latestUserData);
      } else {
          // User might have been deleted, so log them out
          await logout();
      }
    }
  }, [user]);


  return (
    <AuthContext.Provider value={{ user, logout, setCurrentUser, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};