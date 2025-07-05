import React, { useState } from 'react';
import styles from './LoginForm.module.css';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      onLogin(user.uid);
    } catch (error) {
      console.error('Login error:', error);
      setErrorMsg('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.loginForm} onSubmit={handleSubmit}>
      <h3 className={styles.formTitle}>Login</h3>

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
        {loading ? 'Logging in...' : 'Login'}
      </button>

      {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}

      <p>
        <span
          style={{ color: 'blue', cursor: 'pointer', textDecoration: 'underline' }}
          onClick={() => onLogin('reset')}
        >
          Forgot password?
        </span>
      </p>

      <p>
        Don't have an account?{' '}
        <span
          style={{ color: 'blue', cursor: 'pointer', textDecoration: 'underline' }}
          onClick={() => onLogin('register')}
        >
          Register
        </span>
      </p>
    </form>
  );
}

export default LoginForm;
