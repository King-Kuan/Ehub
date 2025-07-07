import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import {
  getFirestore, doc, setDoc, updateDoc, query, where, getDocs, getDoc, collection, arrayUnion
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyASIQCUoU7biVUPjFSlJhACK2uI8C2Hm2I",
  authDomain: "ehub-1d950.firebaseapp.com",
  projectId: "ehub-1d950",
  storageBucket: "ehub-1d950.firebasestorage.app",
  messagingSenderId: "156410249022",
  appId: "1:156410249022:web:7b072d01c7e8c924e9b66f",
  measurementId: "G-HSZR82Y876"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const signupForm = document.getElementById("signup-form");
const messageEl = document.getElementById("message");

// Auto-fill referral input from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const refCode = urlParams.get("ref");
if (refCode) {
  signupForm.referral.value = refCode;
}

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = signupForm.email.value.trim();
  const password = signupForm.password.value.trim();
  const referralInput = signupForm.referral.value.trim();

  messageEl.style.color = "black";
  messageEl.textContent = "Signing up...";

  try {
    let referralUID = null;

    if (referralInput) {
      // Find user with this referralCode
      const q = query(collection(db, "users"), where("referralCode", "==", referralInput));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        referralUID = snapshot.docs[0].id;
      } else {
        messageEl.style.color = "red";
        messageEl.textContent = "Referral code not found.";
        return;
      }
    }

    // Create new user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const referralCode = user.uid.slice(0, 6);

    // Wait for Firebase Auth state to be fully active before writing to Firestore
    onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Save new user with referralCode and referral (string)
        await setDoc(doc(db, "users", user.uid), {
          email,
          createdAt: new Date().toISOString(),
          referral: referralInput || null,
          referrerId: referralUID || null,
          referralCode,
          paymentConfirmed: false,
          role: "user",
          earned: 0,
          withdrawn: 0,
          referees: []
        });

        // Reward first-level referrer
        if (referralUID) {
          const referrerRef = doc(db, "users", referralUID);
          const referrerSnap = await getDoc(referrerRef);
          if (referrerSnap.exists()) {
            const referrerData = referrerSnap.data();
            const newEarned1 = (referrerData.earned || 0) + 2000;
            await updateDoc(referrerRef, {
              earned: newEarned1,
              referees: arrayUnion(user.uid)
            });

            // Reward second-level referrer
            const secondLevelUID = referrerData.referrerId || referrerData.referral;
            if (secondLevelUID) {
              const secondRef = doc(db, "users", secondLevelUID);
              const secondSnap = await getDoc(secondRef);
              if (secondSnap.exists()) {
                const secondData = secondSnap.data();
                const newEarned2 = (secondData.earned || 0) + 1000;
                await updateDoc(secondRef, { earned: newEarned2 });

                // Reward third-level referrer
                const thirdLevelUID = secondData.referrerId || secondData.referral;
                if (thirdLevelUID) {
                  const thirdRef = doc(db, "users", thirdLevelUID);
                  const thirdSnap = await getDoc(thirdRef);
                  if (thirdSnap.exists()) {
                    const thirdData = thirdSnap.data();
                    const newEarned3 = (thirdData.earned || 0) + 500;
                    await updateDoc(thirdRef, { earned: newEarned3 });
                  }
                }
              }
            }
          }
        }

        messageEl.style.color = "green";
        messageEl.textContent = "Signup successful! Redirecting to payment page...";
        setTimeout(() => {
          window.location.href = "payment.html";
        }, 2000);
      }
    });

  } catch (error) {
    messageEl.style.color = "red";
    messageEl.textContent = `Error: ${error.message}`;
  }
});