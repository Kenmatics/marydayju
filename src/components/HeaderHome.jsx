import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './HeaderHome.module.css';

function HeaderHome() {
  const [menuOpen, setMenuOpen] = useState(false);

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
          <a href="#about" className={styles.navItem} onClick={() => setMenuOpen(false)}>About</a>
          <a href="#services" className={styles.navItem} onClick={() => setMenuOpen(false)}>Services</a>
          <a href="#tour" className={styles.navItem} onClick={() => setMenuOpen(false)}>Take a Tour</a>
          <a href="#contact" className={styles.navItem} onClick={() => setMenuOpen(false)}>Contact</a>
          <Link to="/contribution" className={styles.navItem} onClick={() => setMenuOpen(false)}>Contribution</Link>
        </nav>
      </div>
    </header>
  );
}

export default HeaderHome;
