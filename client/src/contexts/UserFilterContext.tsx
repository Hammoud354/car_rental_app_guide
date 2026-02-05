import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';

interface UserFilterContextType {
  selectedUserId: number | null; // null means "All Users"
  setSelectedUserId: (userId: number | null) => void;
  isSuperAdmin: boolean;
  effectiveUserId: number; // The actual userId to use in queries
}

const UserFilterContext = createContext<UserFilterContextType | undefined>(undefined);

export function UserFilterProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  
  // Load selected user from localStorage
  const [selectedUserId, setSelectedUserIdState] = useState<number | null>(() => {
    if (!isSuperAdmin) return null;
    const stored = localStorage.getItem('selectedUserId');
    return stored ? parseInt(stored, 10) : null;
  });

  // Save to localStorage when changed
  const setSelectedUserId = (userId: number | null) => {
    setSelectedUserIdState(userId);
    if (userId === null) {
      localStorage.removeItem('selectedUserId');
    } else {
      localStorage.setItem('selectedUserId', userId.toString());
    }
  };

  // Reset filter when user logs out or is not super admin
  useEffect(() => {
    if (!isSuperAdmin) {
      setSelectedUserIdState(null);
      localStorage.removeItem('selectedUserId');
    }
  }, [isSuperAdmin]);

  // Effective userId: if super admin has selected a specific user, use that; otherwise use current user's ID
  const effectiveUserId = isSuperAdmin && selectedUserId !== null 
    ? selectedUserId 
    : user?.id ?? 0;

  return (
    <UserFilterContext.Provider value={{ selectedUserId, setSelectedUserId, isSuperAdmin, effectiveUserId }}>
      {children}
    </UserFilterContext.Provider>
  );
}

export function useUserFilter() {
  const context = useContext(UserFilterContext);
  if (context === undefined) {
    throw new Error('useUserFilter must be used within a UserFilterProvider');
  }
  return context;
}
