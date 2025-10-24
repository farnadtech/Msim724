
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  logout: () => void;
  // Expose setUser to allow other parts of the app (like DataContext) to update user state
  setCurrentUser: (user: User | null) => void;
  // A function to refetch user data from the "database"
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('msim724-user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('msim724-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('msim724-user');
    }
  }, [user]);

  const setCurrentUser = (user: User | null) => {
    setUser(user);
  };
  
  const logout = () => {
    setUser(null);
  };
  
  const refreshUser = useCallback(async () => {
    if (user) {
        const latestUserData = await api.getUserById(user.id);
        if (latestUserData) {
            setUser(latestUserData);
        } else {
            // User might have been deleted, so log them out
            logout();
        }
    }
  }, [user]);


  return (
    <AuthContext.Provider value={{ user, logout, setCurrentUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};