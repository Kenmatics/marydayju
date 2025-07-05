import React, { useState } from 'react';
import styles from './LoginForm.module.css';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore'; 

function RegisterForm({ onRegister }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: fullName,
        email: user.email,
        role: 'user',        
        selectedPackage: '',
        amountContributed: 0,
        totalAmount: 0,
        paymentConfirmed: false,
        cashedOut: false,
        cashoutSummary: {},
        selectedGrid: Array(100).fill(false),
      });

      onRegister('login');
    } catch (error) {
      console.error('Registration error:', error);
      setErrorMsg(error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.loginForm} onSubmit={handleSubmit}>
      <h3 className={styles.formTitle}>Register</h3>

      <div className={styles.inputGroup}>
        <label className={styles.label}>Full Name</label>
        <input
          type="text"
          placeholder="Example One"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={styles.input}
        />
      </div>

      <div className={styles.inputGroup}>
        <label className={styles.label}>Email</label>
        <input
          type="email"
          placeholder="example@gmail.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
        />
      </div>

      <div className={styles.inputGroup}>
        <label className={styles.label}>Password</label>
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="******"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.input}
        />
      </div>

      <div className={styles.inputGroup}>
        <label className={styles.label}>Confirm Password</label>
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="******"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={styles.input}
        />
      </div>

      <div className={styles.inputGroup}>
        <label className={styles.label}>
          <input
            type="checkbox"
            checked={showPassword}
            onChange={() => setShowPassword(!showPassword)}
          />
          &nbsp; Show Password
        </label>
      </div>

      <button type="submit" disabled={loading} className={styles.button}>
        {loading ? 'Registering...' : 'Register'}
      </button>

      {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}

      <p>
        Already registered?{' '}
        <span style={{ color: 'blue', cursor: 'pointer' }} onClick={() => onRegister('login')}>
          Login
        </span>
      </p>
    </form>
  );
}

export default RegisterForm;
