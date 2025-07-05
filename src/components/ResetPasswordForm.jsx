import React, { useState } from 'react';
import styles from './LoginForm.module.css';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

function ResetPasswordForm({ onSwitch }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage('');
    setErrorMsg('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset link sent! Check your email.');
    } catch (error) {
      console.error('Reset error:', error);
      setErrorMsg('Failed to send reset link. Make sure the email is correct.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.loginForm} onSubmit={handleReset}>
      <h3 className={styles.formTitle}>Reset Password</h3>

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

      <button type="submit" disabled={loading} className={styles.button}>
        {loading ? 'Sending...' : 'Send Reset Link'}
      </button>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}

      <p>
        Go back to login?{' '}
        <span style={{ color: 'blue', cursor: 'pointer' }} onClick={() => onSwitch('login')}>
          Login
        </span>
      </p>
    </form>
  );
}

export default ResetPasswordForm;
