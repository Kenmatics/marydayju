import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './HeaderHome.module.css';

function HeaderContribution({
  loggedIn = false,
  userRole = null,
  onLoginClick = () => {},
  onRegisterClick = () => {}
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    window.location.reload();
  };

  return (
    <header className={styles.header}>
      <img src="/src/assets/maryday-banner.jpg" alt="MarydayJu Logo" className={styles.logo} />
      
      <div className={styles.navContainer}>
        <div className={styles.menuToggle} onClick={() => setMenuOpen(!menuOpen)}>
          <span className={menuOpen ? styles.bar1 : ''}></span>
          <span className={menuOpen ? styles.bar2 : ''}></span>
          <span className={menuOpen ? styles.bar3 : ''}></span>
        </div>

        <nav className={`${styles.nav} ${menuOpen ? styles.active : ''}`}>
          <Link to="/" className={styles.navItem} onClick={() => setMenuOpen(false)}>Home</Link>
          
          {loggedIn ? (
            <>
              <Link
                to={userRole === 'admin' ? '/admin-dashboard' : '/dashboard'}
                className={styles.navItem}
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link to="/" className={styles.navItem} onClick={handleLogout}>Logout</Link>
              <a href="#contact" className={styles.navItem} onClick={() => setMenuOpen(false)}>Contact</a>
            </>
          ) : (
            <>
              <a href="#login" className={styles.navItem} onClick={() => { setMenuOpen(false); onLoginClick(); }}>Login</a>
              <a href="#register" className={styles.navItem} onClick={() => { setMenuOpen(false); onRegisterClick(); }}>Register</a>
              <a href="#contact" className={styles.navItem} onClick={() => setMenuOpen(false)}>Contact</a>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default HeaderContribution;
