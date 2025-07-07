import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
  increment,
  Timestamp
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyASIQCUoU7biVUPjFSlJhACK2uI8C2Hm2I",
  authDomain: "ehub-1d950.firebaseapp.com",
  projectId: "ehub-1d950",
  storageBucket: "ehub-1d950.appspot.com",
  messagingSenderId: "156410249022",
  appId: "1:156410249022:web:7b072d01c7e8c924e9b66f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const balanceEl = document.getElementById("balance");
const videoList = document.getElementById("videoList");

let currentUser = null;

// Load balance
async function loadBalance(uid) {
  try {
    const docRef = doc(db, "users", uid);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();
      const earned = typeof data.earned === "number" ? data.earned : 0;
      balanceEl.textContent = `Your Balance: ${earned.toLocaleString()} Rwf`;
    } else {
      balanceEl.textContent = "User not found.";
    }
  } catch (err) {
    console.error("Error fetching balance:", err);
    balanceEl.textContent = "Error fetching balance.";
  }
}

function getEmbedUrl(url) {
  const match = url.match(/video\/(\d+)/);
  return match ? `https://www.tiktok.com/embed/${match[1]}` : url;
}

async function canWatchVideo(userId, videoId) {
  const watchDocRef = doc(db, "users", userId, "watchHistory", videoId);
  const snap = await getDoc(watchDocRef);

  if (!snap.exists()) return true; // never watched

  const data = snap.data();
  if (!data.lastWatched) return true;

  const lastWatched = data.lastWatched.toDate();
  const now = new Date();
  const diffMs = now - lastWatched;
  return diffMs > 24 * 60 * 60 * 1000; // more than 24 hours
}

async function markVideoWatched(userId, videoId, reward) {
  const watchDocRef = doc(db, "users", userId, "watchHistory", videoId);
  const userDocRef = doc(db, "users", userId);

  await setDoc(watchDocRef, { lastWatched: serverTimestamp() });

  // Atomically increment earned
  await updateDoc(userDocRef, {
    earned: increment(reward)
  });

  // Refresh balance display
  loadBalance(userId);
}

async function loadVideos() {
  videoList.innerHTML = "Loading videos...";

  try {
    const querySnapshot = await getDocs(collection(db, "tiktokVideos"));
    videoList.innerHTML = "";

    if (querySnapshot.empty) {
      videoList.innerHTML = "<p>No videos found.</p>";
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const videoId = docSnap.id;
      const embedUrl = getEmbedUrl(data.url);

      const card = document.createElement("div");
      card.className = "video-card";

      card.innerHTML = `
        <h4>${data.title}</h4>
        <p><strong>Reward:</strong> ${data.reward} Rwf</p>
        <p><strong>Watch Time:</strong> ${data.requiredWatchTime} seconds</p>
        <iframe src="${embedUrl}" allowfullscreen frameborder="0"></iframe>
        <button>Watch to Earn</button>
        <p class="status" style="color: red; display:none;"></p>
      `;

      const iframe = card.querySelector("iframe");
      const button = card.querySelector("button");
      const status = card.querySelector(".status");

      iframe.style.display = "none";

      button.addEventListener("click", async () => {
        if (!currentUser) {
          alert("Please log in to watch videos.");
          return;
        }

        const canWatch = await canWatchVideo(currentUser.uid, videoId);
        if (!canWatch) {
          status.style.display = "block";
          status.textContent = "You can watch this video again after 24 hours.";
          return;
        }

        button.style.display = "none";
        status.style.display = "none";
        iframe.style.display = "block";
        iframe.scrollIntoView({ behavior: "smooth" });

        // Start timer for watch duration
        setTimeout(async () => {
          // After watching required time, reward user
          await markVideoWatched(currentUser.uid, videoId, data.reward);
          status.style.display = "block";
          status.style.color = "green";
          status.textContent = `Congrats! You earned ${data.reward} Rwf for watching.`;
        }, data.requiredWatchTime * 1000);
      });

      videoList.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading videos:", err);
    videoList.innerHTML = `<p style="color:red;">Error loading videos: ${err.message}</p>`;
  }
}

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    loadBalance(user.uid);
    loadVideos();
  } else {
    balanceEl.textContent = "You must be logged in to view your balance.";
    videoList.innerHTML = "<p>Please log in to see videos.</p>";
  }
});