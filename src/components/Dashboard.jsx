import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import styles from './Dashboard.module.css';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const INITIATE_WORKER_URL = " https://squad-init.kenmaticssolutionservices.workers.dev/";
const VERIFY_WORKER_URL = "https://squad-verify.kenmaticssolutionservices.workers.dev/";
function Dashboard({ onLogout, userName, userId }) {
  const [step, setStep] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState('');
  const [contributionAmount, setContributionAmount] = useState('');
  const [checkedDays, setCheckedDays] = useState({});
  const [paidDays, setPaidDays] = useState({});
  const [amountContributed, setAmountContributed] = useState(0);
  const [showUnavailableMsg, setShowUnavailableMsg] = useState(false);
  const [cashedOut, setCashedOut] = useState(false);
  const [lockedGrids, setLockedGrids] = useState({});
  const [verifying, setVerifying] = useState(false);
  const alreadyVerifiedRef = useRef(false); // to avoid double verify race

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userRef = doc(db, 'users', userId);
        const snapshot = await getDoc(userRef);
        if (!snapshot.exists()) return;

        const data = snapshot.data();
        setCheckedDays(data.checkedDays || {});
        setPaidDays(data.paidDays || {});
        setSelectedPackage(data.selectedPackage || '');
        setContributionAmount(data.contributionAmount || '');
        setAmountContributed(data.amountContributed || 0);
        setCashedOut(data.cashedOut || false);
        setLockedGrids(data.lockedGrids || {});

        if (data.selectedPackage === 'cooperative') {
          setShowUnavailableMsg(true);
        }

        if (data.selectedPackage && data.contributionAmount) {
          setStep(3);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [userId]);

  // On return from Squad after payment: ?transaction_ref=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const transactionRef = params.get('transaction_ref');
    if (transactionRef && !alreadyVerifiedRef.current) {
      alreadyVerifiedRef.current = true; // prevent double
      // Clean URL so it doesn't re-trigger on reload
      const url = new URL(window.location.href);
      url.searchParams.delete('transaction_ref');
      window.history.replaceState({}, '', url.toString());
      verifyAndSavePayment(transactionRef);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, selectedPackage, contributionAmount, checkedDays, paidDays]);

  const handlePackageChange = async (event) => {
    const selected = event.target.value;
    try {
      if (!user) {
        console.error("No user is logged in.");
        return;
      }

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { selectedPackage: selected });
      setSelectedPackage(selected);
    } catch (error) {
      console.error('Error updating selected package:', error);
    }
  };

  const handleAmountChange = async (e) => {
    const value = e.target.value;
    setContributionAmount(value);

    try {
      await updateDoc(doc(db, 'users', userId), { contributionAmount: value });
    } catch (error) {
      console.error('Error updating contribution amount:', error);
    }
  };

  const handleCheckboxChange = async (month, label) => {
    const key = `${selectedPackage}-${month}${label ? '-' + label : ''}`;
    if (cashedOut || lockedGrids[key] || paidDays[key]) return;

    const updated = { ...checkedDays, [key]: !checkedDays[key] };
    setCheckedDays(updated);

    try {
      await updateDoc(doc(db, 'users', userId), { checkedDays: updated });
    } catch (error) {
      console.error('Error updating checked days:', error);
    }
  };

  const handleProceed = () => {
    if (step === 1 && selectedPackage && selectedPackage !== 'cooperative') {
      setStep(2);
    } else if (step === 2) {
      const amount = Number(contributionAmount.toString().trim());
      if (!amount || amount < 500) {
        alert("⚠️ Minimum contribution amount is ₦500");
        return;
      }
      setStep(3);
    }
  };

  const calculateTotal = () => {
    return Object.entries(checkedDays)
      .filter(([key, value]) => value && key.startsWith(selectedPackage) && !paidDays[key])
      .length * Number(contributionAmount.toString().trim());
  };

  const initiateSquadPayment = async () => {
    const totalAmount = calculateTotal(); // in Naira
    if (!totalAmount) return alert("Please select contributions to pay for.");
    if (!userId) return alert("User not ready yet.");

    const transaction_ref = `${selectedPackage}-${Date.now()}`;

    const safeEmail = userName?.trim()
      ? `${userName.trim().replace(/\s+/g, '').toLowerCase()}@marydayju.com`
      : `guest${Date.now()}@marydayju.com`;

    try {
      const resp = await fetch(INITIATE_WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalAmount, // Naira, worker will convert to lowest unit
          email: safeEmail,
          transaction_ref,
          callback_url: `${window.location.origin}/contribution?transaction_ref=${transaction_ref}`,
          currency: 'NGN',
          metadata: {
            contributor: userName || 'Anonymous',
            userId,
          },
        }),
      });

      const data = await resp.json();
      if (data.success && data.checkout_url) {
        // Redirect to Squad checkout page
        window.location.href = data.checkout_url;
      } else {
        console.error('Squad initiation failed:', data);
        alert('Failed to start payment. Please try again.');  
      }
    } catch (err) {
      console.error('Error initiating Squad payment:', err);
      alert('Could not initiate payment.');
    }
  };

  const verifyAndSavePayment = async (transactionRef) => {
    if (verifying) return;
    setVerifying(true);
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { lastRef: transactionRef });

      const res = await fetch(VERIFY_WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_ref: transactionRef }),
      });

      const verifyData = await res.json();
      console.log('Verification response:', verifyData);

      if (verifyData.success && verifyData.data?.transaction_status?.toLowerCase() === 'success') {
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();

        const newPaidDays = { ...userData.paidDays };
        const selectedGrid = [];
        const checked = userData.checkedDays || {};
        const newlyPaid = {};

        Object.entries(checked).forEach(([key, value], index) => {
          if (value && key.startsWith(selectedPackage) && !newPaidDays[key]) {
            newPaidDays[key] = true;
            newlyPaid[key] = true;
            selectedGrid[index] = true;
          } else {
            selectedGrid[index] = selectedGrid[index] || false;
          }
        });

        const contributionAmountNum = Number(userData.contributionAmount.toString().trim() || 0);
        const totalPaid = Object.keys(newlyPaid).length * contributionAmountNum;

        await updateDoc(userRef, {
          paidDays: newPaidDays,
          amountContributed: (userData.amountContributed || 0) + totalPaid,
          selectedGrid,
          lastRef: transactionRef,
        });

        setPaidDays(newPaidDays);
        setAmountContributed((userData.amountContributed || 0) + totalPaid);
        alert('✅ Payment verified and saved!');
      } else {
        alert('❌ Payment verification failed. Please wait or contact support.');
        console.error('Verification error:', verifyData);
      }
    } catch (err) {
      console.error('❌ Error verifying Squad payment:', err);
      alert('❌ Could not verify payment. Please try again shortly.');
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    const updateTotal = async () => {
      try {
        await updateDoc(doc(db, 'users', userId), {
          totalAmount: calculateTotal(),
        });
      } catch (error) {
        console.error('Error updating total amount:', error);
      }
    };

    if (selectedPackage && contributionAmount) updateTotal();
  }, [checkedDays, selectedPackage, contributionAmount, userId]);

  const renderGrid = () => {
    const getBoxClass = (isPaid, isChecked, isLocked) => {
      return `${isLocked ? 'locked' : isPaid ? 'paid' : isChecked ? 'selected' : ''} ${cashedOut ? 'cashedOut' : ''}`;
    };

    if (selectedPackage === 'daily') {
      return (
        <>
          <h3 className={styles.tag}>Daily Contribution Grid</h3>
          <p className={styles.tag}>Total to Pay: ₦{calculateTotal()}</p>
          <div className={styles.gridContainer}>
            <div className={styles.headerRow}>
              <div className={styles.dayLabel}>Month → Day ↓</div>
              {months.map(month => <div key={month} className={styles.headerCell}>{month}</div>)}
            </div>
            {days.map(day => (
              <div key={day} className={styles.gridRow}>
                <div className={styles.dayLabel}>{day}</div>
                {months.map(month => {
                  const key = `daily-${month}-${day}`;
                  return (
                    <div
                      key={key}
                      className={`${styles.gridCell} ${getBoxClass(paidDays[key], checkedDays[key], lockedGrids[key])}`}
                      onClick={() => handleCheckboxChange(month, day)}
                    >
                      <input type="checkbox" checked={checkedDays[key] || false} readOnly />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      );
    }

    if (selectedPackage === 'weekly') {
      return (
        <>
          <h3 className={styles.tag}>Weekly Contribution Grid</h3>
          <p className={styles.tag}>Total to Pay: ₦{calculateTotal()}</p>
          <div className={styles.gridContainer}>
            <div className={styles.headerRow}>
              <div className={styles.dayLabel}>Week ↓ / Month →</div>
              {months.map(month => <div key={month} className={styles.headerCell}>{month}</div>)}
            </div>
            {weeks.map(week => (
              <div key={week} className={styles.gridRow}>
                <div className={styles.dayLabel}>{week}</div>
                {months.map(month => {
                  const key = `weekly-${month}-${week}`;
                  return (
                    <div
                      key={key}
                      className={`${styles.gridCell} ${getBoxClass(paidDays[key], checkedDays[key], lockedGrids[key])}`}
                      onClick={() => handleCheckboxChange(month, week)}
                    >
                      <input type="checkbox" checked={checkedDays[key] || false} readOnly />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      );
    }

    if (selectedPackage === 'monthly') {
      return (
        <>
          <h3 className={styles.tag}>Monthly Contribution Grid</h3>
          <p className={styles.tag}>Total to Pay: ₦{calculateTotal()}</p>
          <div className={styles.gridContainer}>
            <div className={styles.headerRow}>
              {months.map(month => (
                <div key={month} className={styles.headerCell}>{month}</div>
              ))}
            </div>
            <div className={styles.gridRow}>
              {months.map(month => {
                const key = `monthly-${month}`;
                return (
                  <div
                    key={key}
                    className={`${styles.gridCell} ${getBoxClass(paidDays[key], checkedDays[key], lockedGrids[key])}`}
                    onClick={() => handleCheckboxChange(month, '')}
                  >
                    <input type="checkbox" checked={checkedDays[key] || false} readOnly />
                  </div>
                );
              })}
            </div>
          </div>
        </>
      );
    }

    return null;
  };

  const resetContribution = async () => {
    try {
      await updateDoc(doc(db, 'users', userId), { checkedDays: {} });
      setCheckedDays({});
      alert('✅ Contribution reset!');
    } catch (error) {
      console.error('Error resetting:', error);
    }
  };

  const downloadPdf = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(14);
    pdf.text("Contribution Summary", 20, 20);
    pdf.text(`Package: ${selectedPackage}`, 20, 30);
    pdf.text(`Amount per Period: ₦${contributionAmount}`, 20, 40);
    pdf.text(`Total Checked: ₦${calculateTotal()}`, 20, 50);
    pdf.save("contribution-summary.pdf");
  };

  return (
    <div className={styles.dashboardContainer}>
      <h2 className={styles.welcomeText}>Welcome {userName}</h2>
      <p className={styles.tag}>This is your savings dashboard</p>
      <p className={styles.tag}><strong>Total Paid so far:</strong> ₦{amountContributed.toLocaleString()}</p>

      {step === 1 && (
        <div>
          <label htmlFor="package" className={styles.welcomeText}>Choose your contribution package</label>
          <select id="package" value={selectedPackage} onChange={handlePackageChange}>
            <option value="">-- Select Package --</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="cooperative">Cooperative</option>
          </select>
          {showUnavailableMsg && <div className={styles.unavailableMessage}>🚫 Cooperative package is not yet available!</div>}
          <button className={styles.primaryBtn} onClick={handleProceed} disabled={!selectedPackage || selectedPackage === 'cooperative'}>Proceed</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <label htmlFor="amount" className={styles.welcomeText}>Contribution amount</label>
          <input type="number" id="amount" value={contributionAmount} min={500} onChange={handleAmountChange} placeholder="Enter amount (₦500 minimum)" />
          <button className={styles.primaryBtn} onClick={handleProceed}>Proceed</button>
        </div>
      )}

      {step === 3 && (
        <div>
          {renderGrid()}
          <button className={styles.primaryBtn} onClick={initiateSquadPayment} disabled={!calculateTotal() || verifying}>
            {verifying ? 'Verifying...' : 'Proceed to Payment'}
          </button>

          {cashedOut && (
            <div className={styles.cashoutBanner}>
              ✅ You have cashed out your savings. Thank you for your contribution!
            </div>
          )}

          <div className={styles.dashboardButtons}>
            <button onClick={resetContribution}>Reset Contribution</button>
            <button onClick={downloadPdf}>Download Summary (PDF)</button>
            <button onClick={() => {
              setStep(1);
              setSelectedPackage('');
              setContributionAmount('');
            }}>
              Switch Package
            </button>
          </div>
        </div>
      )}
      <button className={styles.primaryBtn} onClick={onLogout}>Logout</button>
    </div>
  );
}

export default Dashboard;
