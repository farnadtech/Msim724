import React, { createContext, useState, useEffect, useCallback } from 'react';
import { User, SimCard, Package, Transaction } from '../types';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from './NotificationContext';

interface DataContextType {
  users: User[];
  simCards: SimCard[];
  packages: Package[];
  transactions: Transaction[];
  loading: boolean;
  addSimCard: (simData: Omit<SimCard, 'id' | 'sellerId' | 'status'>) => Promise<void>;
  purchaseSim: (simId: string, buyerId: number) => Promise<void>;
  placeBid: (simId: string, bidderId: number, amount: number) => Promise<void>;
  processTransaction: (userId: number, amount: number, type: Transaction['type'], description: string) => Promise<void>;
  updateUserPackage: (userId: number, packageId: number) => Promise<void>;
  updateUser: (userId: number, updatedData: Partial<User>) => Promise<void>;
  updateSimCard: (simId: string, updatedData: Partial<SimCard>) => Promise<void>;
  addPackage: (packageData: Omit<Package, 'id'>) => Promise<void>;
  updatePackage: (packageId: number, updatedData: Partial<Package>) => Promise<void>;
}

export const DataContext = createContext<DataContextType>({
    users: [],
    simCards: [],
    packages: [],
    transactions: [],
    loading: true,
    addSimCard: async () => {},
    purchaseSim: async () => {},
    placeBid: async () => {},
    processTransaction: async () => {},
    updateUserPackage: async () => {},
    updateUser: async () => {},
    updateSimCard: async () => {},
    addPackage: async () => {},
    updatePackage: async () => {},
});

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, refreshUser } = useAuth();
  const { showNotification } = useNotification();
  const [users, setUsers] = useState<User[]>([]);
  const [simCards, setSimCards] = useState<SimCard[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    // We don't set loading to true here to avoid UI flickering on refetches
    try {
      const [usersData, simCardsData, packagesData, transactionsData] = await Promise.all([
        api.getUsers(),
        api.getSimCards(),
        api.getPackages(),
        api.getTransactions(),
      ]);
      setUsers(usersData);
      setSimCards(simCardsData);
      setPackages(packagesData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      showNotification('خطا در بارگذاری اطلاعات.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addSimCard = async (simData: Omit<SimCard, 'id' | 'sellerId' | 'status'>) => {
    if (!user) {
        throw new Error('برای ثبت سیمکارت باید وارد شوید.');
    }
    await api.addSimCard(simData, user.id);
    await fetchData();
    await refreshUser(); // Refresh user data in AuthContext to reflect balance changes
  };
  
  const processTransaction = async (userId: number, amount: number, type: Transaction['type'], description: string) => {
    await api.processTransaction(userId, amount, type, description);
    await fetchData();
    // Refresh user in auth context separately to ensure header/etc. are updated immediately
    await refreshUser();
  };
  
  const updateUserPackage = async (userId: number, packageId: number) => {
    await api.updateUserPackage(userId, packageId);
    await fetchData();
    await refreshUser();
  };
  
   const purchaseSim = async (simId: string, buyerId: number) => {
    await api.purchaseSim(simId, buyerId);
    await fetchData();
    await refreshUser();
  };

  const placeBid = async (simId: string, bidderId: number, amount: number) => {
    await api.placeBid(simId, bidderId, amount);
    await fetchData();
    await refreshUser();
  };

  const updateUser = async (userId: number, updatedData: Partial<User>) => {
    await api.updateUser(userId, updatedData);
    await fetchData();
  }

  const updateSimCard = async (simId: string, updatedData: Partial<SimCard>) => {
    await api.updateSimCard(simId, updatedData);
    await fetchData();
  }

  const addPackage = async (packageData: Omit<Package, 'id'>) => {
    await api.addPackage(packageData);
    await fetchData();
  };

  const updatePackage = async (packageId: number, updatedData: Partial<Package>) => {
    await api.updatePackage(packageId, updatedData);
    await fetchData();
  };

  const value = {
    users,
    simCards,
    packages,
    transactions,
    loading,
    addSimCard,
    purchaseSim,
    placeBid,
    processTransaction,
    updateUserPackage,
    updateUser,
    updateSimCard,
    addPackage,
    updatePackage,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
