import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";

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

// UI targets
const level1List = document.getElementById("level1List");
const level2List = document.getElementById("level2List");
const level3List = document.getElementById("level3List");

function addToList(container, uid) {
  const li = document.createElement("li");
  li.textContent = uid;
  container.appendChild(li);
}

async function getReferees(uid) {
  const userDoc = await getDoc(doc(db, "users", uid));
  if (userDoc.exists()) {
    const data = userDoc.data();
    return Array.isArray(data.referees) ? data.referees : [];
  }
  return [];
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const rootUID = user.uid;

    // Level 1
    const level1 = await getReferees(rootUID);
    level1.forEach(uid => addToList(level1List, uid));

    // Level 2
    const level2 = [];
    for (const uid of level1) {
      const refs = await getReferees(uid);
      refs.forEach(ref => {
        level2.push(ref);
        addToList(level2List, ref);
      });
    }

    // Level 3
    for (const uid of level2) {
      const refs = await getReferees(uid);
      refs.forEach(ref => addToList(level3List, ref));
    }

  } else {
    alert("Please sign in to view your referees.");
  }
});