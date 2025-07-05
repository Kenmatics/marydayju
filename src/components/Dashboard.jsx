import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import styles from './Dashboard.module.css';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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


  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

  const auth = getAuth();
  const user = auth.currentUser;

//   if (user) {
//   const userDocRef = doc(db, "users", user.uid);
//   await updateDoc(userDocRef, {
//     selectedPackage: "daily", // or whatever value you're updating
//   });
// }

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

  const handlePackageChange = async (event) => {
    const selected = event.target.value;
    try {
      const auth = getAuth();
      const user = auth.currentUser;
  
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
    if (cashedOut || lockedGrids[key]) return;

    const updated = { ...checkedDays, [key]: !checkedDays[key] };
    setCheckedDays(updated);

    try {
      await updateDoc(doc(db, 'users', userId), { checkedDays: updated });
    } catch (error) {
      console.error('Error updating checked days:', error);
    }
  };

  const handleProceed = () => {
    if (step === 1 && selectedPackage !== '' && selectedPackage !== 'cooperative') {
      setStep(2);
    } else if (step === 2) {
      const amount = Number(contributionAmount);
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
      .length * Number(contributionAmount);
  };

  const handlePaystackPayment = () => {
    const totalAmount = calculateTotal() * 100;

    if (!totalAmount) return alert("Please select contributions to pay for.");
    if (!window.PaystackPop?.setup) {
      alert("⚠️ Paystack script is not loaded.");
      return;
    }

    const safeEmail = userName?.trim()
      ? `${userName.trim().replace(/\s+/g, '').toLowerCase()}@marydayju.com`
      : `guest${Date.now()}@marydayju.com`;

      const handler = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: safeEmail,
        amount: totalAmount,
        ref: `${selectedPackage}-${Date.now()}`,
        currency: "NGN",
        metadata: {
          custom_fields: [
            {
              display_name: "Contributor Name",
              variable_name: "contributor_name",
              value: userName || 'Anonymous',
            },
          ],
        },
        callback: function (response) {
          console.log("Payment complete:", response);
        
          const newPaidDays = { ...paidDays };
          const selectedGrid = [];
        
          Object.entries(checkedDays).forEach(([key, value], index) => {
            if (value && key.startsWith(selectedPackage)) {
              newPaidDays[key] = true;
              selectedGrid[index] = true;
            } else {
              selectedGrid[index] = selectedGrid[index] || false;
            }
          });
    
          setPaidDays(newPaidDays);
          const userRef = doc(db, 'users', userId);
          const newlyPaidCount = Object.entries(checkedDays).filter(
            ([key, value]) => value && key.startsWith(selectedPackage) && !paidDays[key]
          ).length;
          
          const newAmount = amountContributed + (newlyPaidCount * Number(contributionAmount));
          
          updateDoc(userRef, {
            paidDays: newPaidDays,
            amountContributed: newAmount,
            selectedGrid: selectedGrid,
          })
            .then(() => {
              setPaidDays(newPaidDays);
              setAmountContributed(newAmount);
              alert("✅ Payment successful!");
            })
            .catch(err => console.error("Error updating paid days:", err));        
        },
        onClose: function () {
          alert("Transaction was cancelled.");
        }
      });
    
      handler.openIframe();
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
              <div className={styles.dayLabel}>Day ↓ / Month →</div>
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
                  const key = `${selectedPackage}-${month}-${week}`;
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
                const key = `${selectedPackage}-${month}`;
                return (
                  <div
                    key={key}
                    className={`${styles.gridCell} ${getBoxClass(paidDays[key], checkedDays[key], lockedGrids[key])}`}
                    onClick={() => handleCheckboxChange(month, '')} // fix: pass label as empty string
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
      alert("✅ Contribution reset!");
    } catch (error) {
      console.error("Error resetting:", error);
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
          <input type="number" id="amount" value={contributionAmount}  min={500} onChange={handleAmountChange} placeholder="Enter amount (₦500 minimum)" />
          <button className={styles.primaryBtn} onClick={handleProceed}>Proceed</button>
        </div>
      )}

      {step === 3 && (
        <div>
          {renderGrid()}
          <button className={styles.primaryBtn} onClick={handlePaystackPayment} disabled={!calculateTotal()}>Proceed to Payment</button>

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
      <button className={styles.primaryBtn} onClick={onLogout} >Logout</button>
    </div>
  );
}

export default Dashboard;
