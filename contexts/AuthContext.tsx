

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
    // Let the onAuthStateChange listener handle setting the user to null.
    // This makes it the single source of truth for auth state changes.
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("Error signing out:", error);
    }
  }, []);


  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const userProfile = await api.getUserProfile(session.user);
          setUser(userProfile);
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Wrap in try/catch to prevent unhandled promise rejections
      try {
        if (event === 'SIGNED_IN' && session?.user) {
          const userProfile = await api.getUserProfile(session.user);
          setUser(userProfile);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      } catch (error) {
        console.error("Error in onAuthStateChange listener:", error);
        // On error, assume user is not logged in.
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
  
  const refreshUser = useCallback(async () => {
    try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
            const latestUserData = await api.getUserProfile(authUser);
            if (latestUserData) {
                setUser(latestUserData);
            } else {
                // User might have been deleted, so log them out
                await logout();
            }
        }
    } catch (error) {
        console.error("Error refreshing user data:", error);
        await logout(); // Log out if refresh fails
    }
  }, [logout]);


  return (
    <AuthContext.Provider value={{ user, logout, setCurrentUser, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};