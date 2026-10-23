import React, { createContext, useContext, useState, ReactNode } from 'react';

type UserRole = 'citizen' | 'volunteer' | 'authority';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status?: string;
}

interface AuthContextType {
  user: User | null;
  login: (role: UserRole, email: string) => Promise<void>;
  register: (role: UserRole, data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (role: UserRole, email: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setUser({
      id: Math.random().toString(36).substr(2, 9),
      name: email.split('@')[0],
      email,
      role,
      ...(role === 'volunteer' && { status: 'approved' })
    });
  };

  const register = async (role: UserRole, data: any) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setUser({
      id: Math.random().toString(36).substr(2, 9),
      name: data.name,
      email: data.email,
      role,
      ...(role === 'volunteer' && { status: 'pending' })
    });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
