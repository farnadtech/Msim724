

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

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("Error signing out:", error);
    }
  }, []);


  useEffect(() => {
    // onAuthStateChange is the single source of truth for the user's session.
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session?.user) {
          // A session is active. Fetch the full user profile.
          // If the profile doesn't exist (e.g., auth user but no public user row),
          // getUserProfile will return null, correctly treating them as logged out within our app's context.
          const userProfile = await api.getUserProfile(session.user);
          setUser(userProfile);
        } else {
          // No active session, user is logged out.
          setUser(null);
        }
      } catch (error) {
        console.error("Error handling auth state change:", error);
        setUser(null); // Ensure user is logged out on any error.
      } finally {
        // The auth state has been determined, stop loading.
        // This is crucial for PrivateRoute to work correctly on refresh.
        setLoading(false);
      }
    });

    // Clean up the listener on unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const setCurrentUser = (user: User | null) => {
    setUser(user);
  };
  
  const refreshUser = useCallback(async () => {
    try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
            const latestUserData = await api.getUserProfile(authUser);
            // setUser can accept null, so if latestUserData is null, user logs out.
            setUser(latestUserData);
        } else {
            // No auth user, so clear local user state.
            setUser(null);
        }
    } catch (error) {
        console.error("Error refreshing user data:", error);
        setUser(null); // Clear user on any error
    }
  }, []);


  return (
    <AuthContext.Provider value={{ user, logout, setCurrentUser, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
