import React, { useState } from 'react';
import HeaderContribution from './HeaderContribution';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ResetPasswordForm from './ResetPasswordForm';
import Dashboard from './Dashboard';
import AdminDashboard from './AdminDashboard';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

function AuthPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [authForm, setAuthForm] = useState('login');
  const [user, setUser] = useState(null);

  const handleLogin = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
  
      if (userSnap.exists()) {
        const userData = userSnap.data();

        // ✅ Save full role
        setUser({
          userId: userId,
          userName: userData.name || 'User',
          role: userData.role || 'user',
        });

        console.log("Logged-in user data:", userData);
      } else {
        console.error('User document not found.');
      }
    } catch (error) {
      console.error('Error fetching user data:', error.message);
    }
  };

  const handleRegister = (data) => {
    if (data === 'login') {
      setAuthForm('login');
    } else {
      console.log('Registered successfully:', data);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setAuthForm('login');
  };

  return (
    <div>
      <HeaderContribution
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        loggedIn={!!user}
        setAuthForm={setAuthForm}
      />

      {!user ? (
        <div className="auth-container">
          {authForm === 'login' && <LoginForm onLogin={handleLogin} />}
          {authForm === 'register' && <RegisterForm onRegister={handleRegister} />}
          {authForm === 'reset' && <ResetPasswordForm onSwitch={setAuthForm} />}
        </div>
      ) : user.role === 'admin' ? (
        <AdminDashboard
          onLogout={handleLogout}
          userName={user.userName}
          userId={user.userId}
        />
      ) : (
        <Dashboard
          onLogout={handleLogout}
          userName={user.userName}
          userId={user.userId}
        />
      )}
    </div>
  );
}

export default AuthPage;
