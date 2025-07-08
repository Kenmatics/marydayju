import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import styles from './AdminDashboard.module.css';
// import { getAuth, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserData, setSelectedUserData] = useState(null);
  const [showGrid, setShowGrid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const usersData = snapshot.docs
        .map(doc => ({ ...doc.data(), id: doc.id }))
        .filter(user => user.role !== 'admin');
      setUsers(usersData);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      const userDocRef = doc(db, 'users', selectedUserId);
      const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          setSelectedUserData({ ...docSnapshot.data(), id: docSnapshot.id });
        } else {
          setSelectedUserData(null);
        }
      });

      return () => unsubscribe();
    }
  }, [selectedUserId]);

  const handleConfirmPayment = async () => {
    try {
      setLoading(true);
      const userDocRef = doc(db, 'users', selectedUserId);
      await updateDoc(userDocRef, { paymentConfirmed: true });
      setMessage('✅ Payment confirmed successfully.');
    } catch (error) {
      setMessage('❌ Failed to confirm payment.');
    } finally {
      setLoading(false);
    }
  };

  const handleCashout = async () => {
    if (selectedUserId && selectedUserData) {
      try {
        setLoading(true);

        const userDocRef = doc(db, 'users', selectedUserId);
        const paidDays = selectedUserData.paidDays || {};
        const lockedGrids = {};

        Object.keys(paidDays).forEach(key => {
          lockedGrids[key] = true;
        });

        const newTotal =
          (selectedUserData.totalAmount || 0) - (selectedUserData.amountContributed || 0);
        const cashedOutAmount = selectedUserData.amountContributed || 0;

        await updateDoc(userDocRef, {
          totalAmount: newTotal,
          amountContributed: 0,
          cashedOut: true,
          lockedGrids: lockedGrids,
          cashoutSummary: {
            amount: cashedOutAmount,
            grids: Object.keys(lockedGrids).length,
            date: new Date().toISOString()
          }
        });

        setMessage('✅ Cashout completed.');
      } catch (error) {
        setMessage('❌ Failed to process cashout.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResetUser = async () => {
    if (selectedUserId && selectedUserData) {
      const confirmed = window.confirm('Are you sure you want to reset this user?');
      if (!confirmed) return;
  
      try {
        setLoading(true);
  
        const userDocRef = doc(db, 'users', selectedUserId);
  
        const previouslyPaidDays = selectedUserData.paidDays || {};
        const lockedGrids = {};
  
        Object.keys(previouslyPaidDays).forEach(key => {
          lockedGrids[key] = true;
        });
  
        await updateDoc(userDocRef, {
          selectedPackage: '',
          amountContributed: 0,
          contributionAmount: 0,
          paymentConfirmed: false,
          cashedOut: false,
          cashoutSummary: {},
          selectedGrid: selectedUserData.selectedGrid || Array(100).fill(false),
          lockedGrids: lockedGrids
        });
  
        setMessage('✅ User reset: grids locked, ready for new payments.');
      } catch (error) {
        setMessage('❌ Failed to reset user.');
      } finally {
        setLoading(false);
      }
    }
  };  

  const handleDeleteUser = async () => {
    if (selectedUserId) {
      const confirmed = window.confirm('Are you sure you want to delete this user?');
      if (!confirmed) return;

      try {
        setLoading(true);
        const userDocRef = doc(db, 'users', selectedUserId);
        await deleteDoc(userDocRef);
        setSelectedUserId(null);
        setSelectedUserData(null);
        setMessage('✅ User deleted.');
      } catch (error) {
        setMessage('❌ Failed to delete user.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDownloadReport = () => {
    const reportData = users.map(user => ({
      Name: user.name,
      Email: user.email,
      Package: user.selectedPackage,
      Amount_Contributed: user.amountContributed || 0,
      Contribution_Amount: user.contributionAmount || 0,
      Payment_Confirmed: user.paymentConfirmed ? 'Yes' : 'No',
      Cashed_Out: user.cashedOut ? 'Yes' : 'No',
      Cashout_Date: user.cashoutSummary?.date || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Monthly Contributions');

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const fileData = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    saveAs(fileData, `Monthly_Contributions_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const ContributionGridModal = ({ onClose }) => (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3 className={styles.tag}>Contribution Grid</h3>
        {selectedUserData?.selectedGrid?.length > 0 ? (
          <div className={styles.adminGridContainer}>
            {selectedUserData.selectedGrid.map((cell, index) => (
              <div
                key={index}
                className={`${styles.adminGridCell} ${
                  cell === true ? styles.filledCell : styles.emptyCell
                } ${selectedUserData.paymentConfirmed ? styles.confirmed : ''}`}
              />
            ))}
          </div>
        ) : (
          <p className={styles.tag}>No contribution grid available.</p>
        )}
        <button onClick={onClose} className={styles.closeButton} aria-label="Close grid modal">Close</button>
      </div>
    </div>
  );

  const formatCurrency = (value) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(value || 0);


  return (
    <div className={styles.adminDashboard}>
      <p className={styles.welcome}>Welcome Admin!</p>

      {loading && <p className={styles.loading}>Processing...</p>}
      {message && <p className={styles.message}>{message}</p>}

      <div className={styles.dashboardSections}>
        <div className={styles.userList}>
          <h3 className={styles.tag}>Registered Users</h3>
          <ul>
            {users.map((user) => (
              <li
                key={user.id}
                onClick={() => {
                  setSelectedUserId(user.id);
                  setShowGrid(false);
                  setMessage('');
                }}
                className={user.id === selectedUserId ? styles.selected : ''}
              >
                {user.name}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.userDetails}>
          {selectedUserData ? (
            <>
              <h3 className={styles.tag}>User Details</h3>
              <p className={styles.tag}><strong>Package:</strong> {selectedUserData.selectedPackage}</p>
              <p className={styles.tag}><strong>Amount Contributed:</strong> {formatCurrency(selectedUserData.amountContributed)}</p>
              <p className={styles.tag}><strong>Contribution Amount:</strong> {formatCurrency(selectedUserData.contributionAmount)}</p>

              <div className={styles.adminUserGrid}>
                <h4>Contribution Grid</h4>
                <button className={styles.primaryBtn} onClick={() => setShowGrid(true)} aria-label="View Contribution Grid">View Contribution Grid</button>
              </div>

              {showGrid && <ContributionGridModal onClose={() => setShowGrid(false)} />}

              <div className={styles.actionButtons}>
                <button className={styles.primaryBtn} onClick={handleConfirmPayment} disabled={loading} aria-label="Confirm Payment">Confirm Payment</button>
                <button className={styles.primaryBtn} onClick={handleCashout} disabled={loading} aria-label="Cashout">Cashout</button>
                <button className={styles.primaryBtn} onClick={handleResetUser} disabled={loading} aria-label="Reset User">Reset User</button>
                <button className={styles.primaryBtn} onClick={handleDeleteUser} disabled={loading} aria-label="Delete User">Delete User</button>
              </div>

              <div className={styles.dashboardSections}>
                <button className={styles.primaryBtn} onClick={handleDownloadReport} aria-label="Download Excel Report">Download Monthly Report (Excel)</button>
                <button
                  onClick={() => {
                    const confirmed = window.confirm("Are you sure you want to log out?");
                    if (confirmed) {
                      signOut(auth)
                      .then(() => {
                        navigate('/contribution');
                      })
                      .catch((error) => {
                        console.error('Logout error:', error);
                        setMessage('❌ Failed to log out.');
                      });
                    }
                  }}
                  className={styles.logoutButton}
                  aria-label="Logout"
                >
                  Logout
                </button>

              </div>
            </>
          ) : (
            <p className={styles.tag}>Select a user to view details</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
