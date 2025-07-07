import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const userList = document.getElementById("user-list");
const logoutBtn = document.getElementById("logoutBtn");
const confirmBadge = document.getElementById("confirm-badge");

// Create badge for withdrawals
const withdrawalsLink = document.getElementById("view-withdrawals");
const withdrawalBadge = document.createElement("span");
withdrawalBadge.className = "notification-badge";
withdrawalBadge.style.display = "none";
withdrawalsLink.appendChild(withdrawalBadge);

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "admin-login.html";
    return;
  }

  try {
    const usersSnapshot = await getDocs(collection(db, "users"));
    let pendingCount = 0;
    let totalUsers = 0;
    userList.innerHTML = "";

    usersSnapshot.forEach((docSnap) => {
      const userData = docSnap.data();
      const userId = docSnap.id;
      totalUsers++;

      if (!userData.paymentConfirmed) {
        pendingCount++;
      }

      const div = document.createElement("div");
      div.classList.add("user-block");
      div.innerHTML = `
        <p><strong>Email:</strong> ${userData.email}</p>
        <p><strong>Payment:</strong> ${userData.paymentConfirmed ? "Confirmed" : "Pending"}</p>
        <button ${userData.paymentConfirmed ? "disabled" : ""} onclick="confirmPayment('${userId}')">
          Confirm Payment
        </button>
      `;
      userList.appendChild(div);
    });

    // Total users header
    const totalHeader = document.createElement("h3");
    totalHeader.textContent = `Total Users: ${totalUsers}`;
    userList.prepend(totalHeader);

    // Confirm badge
    if (pendingCount > 0) {
      confirmBadge.textContent = pendingCount;
      confirmBadge.style.display = "inline-block";
    } else {
      confirmBadge.style.display = "none";
    }

    // Withdrawal badge
    const withdrawalSnapshot = await getDocs(collection(db, "withdrawals"));
    let pendingWithdrawals = 0;

    withdrawalSnapshot.forEach(docSnap => {
      if (!docSnap.data().approved) {
        pendingWithdrawals++;
      }
    });

    if (pendingWithdrawals > 0) {
      withdrawalBadge.textContent = pendingWithdrawals;
      withdrawalBadge.style.display = "inline-block";
    } else {
      withdrawalBadge.style.display = "none";
    }

  } catch (error) {
    userList.innerHTML = "<p>Error loading users</p>";
    console.error("Error getting users:", error);
  }
});

window.confirmPayment = async (uid) => {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    alert("User not found!");
    return;
  }

  const userData = userSnap.data();

  // 🔥 REWARD REFERRAL CHAIN
  if (userData.referrerId) {
    const firstRef = doc(db, "users", userData.referrerId);
    const firstSnap = await getDoc(firstRef);
    if (firstSnap.exists()) {
      const firstData = firstSnap.data();
      await updateDoc(firstRef, {
        earned: (firstData.earned || 0) + 2000,
        referees: arrayUnion(uid)
      });

      // Second level
      const secondLevelId = firstData.referrerId || firstData.referral;
      if (secondLevelId) {
        const secondRef = doc(db, "users", secondLevelId);
        const secondSnap = await getDoc(secondRef);
        if (secondSnap.exists()) {
          const secondData = secondSnap.data();
          await updateDoc(secondRef, {
            earned: (secondData.earned || 0) + 1000
          });

          // Third level
          const thirdLevelId = secondData.referrerId || secondData.referral;
          if (thirdLevelId) {
            const thirdRef = doc(db, "users", thirdLevelId);
            const thirdSnap = await getDoc(thirdRef);
            if (thirdSnap.exists()) {
              const thirdData = thirdSnap.data();
              await updateDoc(thirdRef, {
                earned: (thirdData.earned || 0) + 500
              });
            }
          }
        }
      }
    }
  }

  // ✅ Finally confirm payment
  await updateDoc(userRef, {
    paymentConfirmed: true
  });

  alert("Payment confirmed and referral rewards given!");
  location.reload();
};

logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "admin-login.html";
  });
});