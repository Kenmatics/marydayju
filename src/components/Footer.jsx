import React from 'react';
import styles from './Footer.module.css';
import { Link } from 'react-router-dom';

function Footer({ visitorCount, dateTime }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <div className="links">
          <p>Quick Links</p>
            <ul>
              <li><Link to="/" className={styles.navItem} onClick={() => setMenuOpen(false)}>Home</Link></li>
              {/* <li><a href="#about" className={styles.navItem} onClick={() => setMenuOpen(false)}>About</a></li> */}
              {/* <li><a href="#services" className={styles.navItem} onClick={() => setMenuOpen(false)}>Services</a></li> */}
              {/* <li><a href="#tour" className={styles.navItem} onClick={() => setMenuOpen(false)}>Take a Tour</a></li> */}
              <li><a href="#contact" className={styles.navItem} onClick={() => setMenuOpen(false)}>Contact</a></li>
              <li><Link to="/contribution" className={styles.navItem} onClick={() => setMenuOpen(false)}>Contribution</Link></li>
            </ul>
        </div>
        <div className={styles.socials}>
          <p>Socials</p>
          <a href="#">Facebook</a>
          <a href="#">Twitter</a>
          <a href="#">Instagram</a>
          <a href="#">Tiktok</a>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <p>Date/Time: {dateTime.toLocaleString()}</p>
        <p>&copy; {new Date().getFullYear()} MaryDayJu. All rights reserved.</p>
        <p>
          Built with ❤️ by{' '}
          <a href="https://kenmaticssolutionservices.com" target="_blank" rel="noopener noreferrer">
            Kenmatics Solution Services.
          </a>
        </p>
      </div>
    </footer>
  );
}

export default Footer;
