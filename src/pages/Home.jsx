import React, { useEffect, useState } from 'react';
import HeaderHome from '../components/HeaderHome';
import Footer from '../components/Footer';
import styles from './Home.module.css';
import { Link } from 'react-router-dom';
import BackgroundSlider from '../components/BackgroundSlider';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

function Home() {
  const [dateTime, setDateTime] = useState(new Date());
  const [visitorCount, setVisitorCount] = useState(123);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const sections = document.querySelectorAll("section");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
        }
      });
    }, { threshold: 0.2 });

    sections.forEach(section => {
      section.classList.add("fade-in");
      observer.observe(section);
    });

    return () => sections.forEach(section => observer.unobserve(section));
  }, []);

  return (
    <div>
      <HeaderHome menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <main className={styles.homePage}>
        <section className={styles.home}>
          <h1 className={styles.welcomeText}>Welcome to MaryDayJu Enterprise</h1>
          <p className={styles.tagline}>Your trusted partner in excellence.</p>
          <Link to="/contribution" onClick={() => setMenuOpen(false)}><button className={styles.startButton}>Get Started</button></Link>
        </section>

        <section className={styles.about}>
          <h2 className={styles.welcomeText}>About Us</h2>
          <p className={styles.tag}> 
            Marydayju Enterprise is a faith-driven business committed to delivering affordable and reliable administrative support and office-related services to schools, individuals, and organizations. <br /> We specialize in printing and design, typing, online registrations, and operate a contribution/thrift system to help people manage money better and save consistently. 
            <br /> Born out of a passion for service, Marydayju was established with a vision to bridge the gap between accessibility and quality.</p> <p className={styles.tag}>We understand how challenging it can be to find essential services, like printing or purchasing basic stationery nearby and affordably. That is why we stepped in, offering both services and merchandise in one trusted space.</p> 
            <br /> <p className={styles.tag}>At our core, we believe in honesty, empowerment, and faith. Every service we provide is a reflection of our commitment to helping people get things done faster, smarter, and more conveniently. <br />
            Marydayju Enterprise is not just a business; it is a helping hand to your everyday needs.
          </p>
        </section>

        <section className={styles.servicesContainer}>
          <h2 className={styles.welcomeText}>Our Services</h2>
          <p className={styles.tagline}>We offer a variety of services which you can book at the comfort of your home.</p>
          <div className={styles.servicesGrid}>
            <div className={styles.serviceCard}>
              <h3>Printing & Design</h3>
              <ul>
                <li>Banner</li>
                <li>Sticker</li>
                <li>Jotter</li>
                <li>Passport</li>
                <li>Mug</li>
                <li>Throw Pillow</li>
                <li>Frame/Picture</li>
                <li>Plastic ID Card</li>
                <li>Invoice/Reciept</li>
                <li>T-Shirt Design</li>
                <li>Printing of Documents</li>
              </ul>
            </div>
            <div className={styles.serviceCard}>
              <h3>Typing/CAC</h3>
              <ul>
                <li>Affidavit</li>
                <li>Newspaper</li>
                <li>CAC Registration</li>
                <li>State of Origin</li>
                <li>Birth Certificate</li>
                <li>CV/Letter</li>
                <li>Stationary</li>
              </ul>
            </div>
            <div className={styles.serviceCard}>
              <h3>Online Registration</h3>
              <ul>
                <li>WAEC/NECO GCE</li>
                <li>Scratch Card</li>
                <li>Post UTME</li>
                <li>Checking of Result</li>
                <li>Recruitment Form (Army, Navy, Air-Force)</li>
              </ul>
            </div>
            <div className={styles.serviceCard}>
              <h3>NIN</h3>
              <ul>
                <li>NIN Registration</li>
                <li>Validation of NIN</li>
                <li>Correction of NIN Details</li>
                <li>Reprinting of NIN Slip</li>
              </ul>
            </div>
            <Link to="/contribution" className={styles.serviceCardLink}>
              <div className={styles.serviceCard}>
                <h3>Contribution/Thrift</h3>
                <ul>
                  <li>Daily</li>
                  <li>Weekly</li>
                  <li>Monthly</li>
                  <li>Corporative</li>
                </ul>
              </div>
            </Link>
          </div>
        </section>

        <section className={styles.tour}>
          <h2 className={styles.welcomeText}>Tour our services</h2>
          <p className={styles.tagline}>Let's take you round our offices.</p>
          <><BackgroundSlider /></>
        </section>

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
      <Footer dateTime={dateTime} visitorCount={visitorCount} />
    </div>
  );
}

export default Home;
