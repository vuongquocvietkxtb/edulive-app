import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('edulive_token') || '');
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('edulive_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return {
      id: 'usr-teacher-1',
      name: 'Giáo viên Nguyễn Thị Loan',
      email: 'giaovien@edulive.vn',
      role: 'teacher',
      avatar: '👩‍🏫'
    };
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('edulive_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('edulive_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('edulive_token', token);
    } else {
      localStorage.removeItem('edulive_token');
    }
  }, [token]);

  // Login via API
  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Đăng nhập không thành công');
    }
    setUser(data.user);
    setToken(data.token);
    setIsAuthModalOpen(false);
    return data.user;
  };

  // Register via API
  const register = async ({ name, email, password, role }) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Đăng ký không thành công');
    }
    setUser(data.user);
    setToken(data.token);
    setIsAuthModalOpen(false);
    return data.user;
  };

  // Logout
  const logout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('edulive_user');
    localStorage.removeItem('edulive_token');
  };

  // Quick Switch for local testing
  const switchRole = (newRole) => {
    if (newRole === 'teacher') {
      setUser({
        id: 'usr-teacher-1',
        name: 'Giáo viên Nguyễn Thị Loan',
        email: 'giaovien@edulive.vn',
        role: 'teacher',
        avatar: '👩‍🏫'
      });
    } else {
      setUser({
        id: 'usr-student-1',
        name: 'Lê Hải Đăng',
        email: 'hocsinh@edulive.vn',
        role: 'student',
        avatar: '🎓'
      });
    }
  };

  const updateUserName = (name) => {
    setUser(prev => prev ? ({ ...prev, name }) : null);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        switchRole,
        updateUserName,
        isAuthModalOpen,
        setIsAuthModalOpen
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
