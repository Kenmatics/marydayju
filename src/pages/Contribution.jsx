import React, { useState } from 'react';
import HeaderHome from '../components/HeaderHome';
import Footer from '../components/Footer';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import Dashboard from '../components/Dashboard';
import AdminDashboard from '../components/AdminDashboard';
import styles from './Home.module.css';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

function Contribution() {
  const [view, setView] = useState('landing');
  const [visitorCount] = useState(234);
  const [dateTime] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const [userData, setUserData] = useState(null);

  const handleLoginSuccess = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const data = userDoc.exists() ? { id: userId, ...userDoc.data() } : null;
  
      if (!data) {
        console.error('No user data found!');
        return;
      }
  
      setUserData(data);
  
      if (data.role === 'admin') {
        setView('adminDashboard');
      } else {
        setView('dashboard');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };  

  const handleRegisterSuccess = (nextView) => {
    if (nextView === 'login') {
      setView('login');
    }
  };

  const handleLogout = () => {
    setView('landing');
  };

  return (
    <div>
      <HeaderHome
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        loggedIn={view === 'dashboard'}
        onLoginClick={() => setView('login')}
        onRegisterClick={() => setView('register')}
      />

      <main className={styles.homePage}>
          <section className={styles.home}>
            <h1 className={styles.welcomeText}>Welcome to MaryDayJu Enterprise</h1>
            <p className={styles.tagline}>Your trusted partner in excellence.</p>            
          </section>
        {view === 'landing' && (
          <section className={styles.home}>
          <h2 className={styles.welcomeText}>How Contribution Works</h2>
          <p className={styles.tagline}>Join our daily, weekly, or monthly thrift plans and grow your savings effectively.</p>
          <div className="auth-buttons">
                <button className={styles.startButton} onClick={() => setView('login')}>Login</button>
                <button className={styles.startButton} onClick={() => setView('register')}>Register</button>
          </div>
          </section>
          
        )}        

        {view === 'login' && <LoginForm onLogin={handleLoginSuccess} />}
        {view === 'register' && <RegisterForm onRegister={handleRegisterSuccess} />}
        {view === 'dashboard' && userData && (
          <Dashboard onLogout={handleLogout} userName={userData.name} userId={userData.id} />
        )}
        {view === 'adminDashboard' && userData && (
          <AdminDashboard onLogout={handleLogout} userName={userData.name} />
        )}

        <section id="contact" className={styles.contactSection}>
            <h2 className={styles.welcomeText}>Contact Us</h2>
              <form className={styles.contactForm}>
                <label>
                  Name:
                  <input type="text" name="name" required />
                </label>
        
                <label>
                  Phone Number:
                  <input type="tel" name="phone" required />
                </label>
        
                <label>
                  Location:
                  <input type="text" name="location" required />
                </label>
        
                <label>
                  Message:
                  <textarea name="message" rows="5" required></textarea>
                </label>
        
                <button type="submit">Send Message</button>
              </form>
        </section>
      </main>

      <Footer visitorCount={visitorCount} dateTime={dateTime} />
    </div>
  );
}

export default Contribution;
