import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

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
const db = getFirestore(app);
const auth = getAuth(app);

const balanceEl = document.getElementById("balance");
const form = document.getElementById("withdrawForm");
const historyList = document.getElementById("historyList");

let currentUser;
let currentBalance = 0;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Please sign in to withdraw.");
    return;
  }

  currentUser = user;
  const userDoc = await getDoc(doc(db, "users", user.uid));

  if (userDoc.exists()) {
    const data = userDoc.data();
    currentBalance = data.earned || 0;
    balanceEl.textContent = currentBalance;

    loadWithdrawalHistory(user.uid);
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("receiverName").value.trim();
  const number = document.getElementById("receiverNumber").value.trim();
  const amount = parseInt(document.getElementById("amount").value.trim());

  if (amount < 2500) {
    alert("Minimum withdrawal is 2500 RWF.");
    return;
  }

  if (amount > currentBalance) {
    alert("You cannot withdraw more than your balance.");
    return;
  }

  await addDoc(collection(db, "withdrawals"), {
    uid: currentUser.uid,
    name,
    number,
    amount,
    approved: false,
    createdAt: Timestamp.now()
  });

  const userRef = doc(db, "users", currentUser.uid);
  await updateDoc(userRef, {
    earned: currentBalance - amount,
    withdrawn: (currentBalance - amount)
  });

  alert("Withdrawal request submitted!");
  location.reload();
});

async function loadWithdrawalHistory(uid) {
  const q = query(collection(db, "withdrawals"), where("uid", "==", uid));
  const querySnapshot = await getDocs(q);
  historyList.innerHTML = "";

  querySnapshot.forEach(doc => {
    const w = doc.data();
    const li = document.createElement("li");
    li.textContent = `${w.amount} RWF to ${w.name} (${w.number}) - ${w.approved ? "Approved" : "Pending"}`;
    li.className = w.approved ? "approved" : "pending";
    historyList.appendChild(li);
  });
}