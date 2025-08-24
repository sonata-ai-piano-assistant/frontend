"use client"
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getUserFromToken } from '../lib/api/user';
import { IUser } from '../types';
import { useRouter } from 'next/navigation';
interface UserContextType {
  user: IUser | null;
  token: string | null;
  setUser: (user: IUser | null) => void;
  setToken: (token: string | null) => void;
  login: (token: string) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken) setToken(storedToken);
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);
  const login = async (token: string) => {
    setToken(token);
    localStorage.setItem('token', token);
    // Optionnel : Vous pouvez récupérer l'utilisateur ici si nécessaire
    const fetchedUser = await getUserFromToken(token);
    setUser(fetchedUser);
    localStorage.setItem('user', JSON.stringify(fetchedUser));
  }

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  return (
    <UserContext.Provider value={{ user, token, setUser, setToken, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
}
