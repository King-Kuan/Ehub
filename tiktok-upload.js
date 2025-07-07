import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

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

const form = document.getElementById("tiktok-upload-form");
const messageEl = document.getElementById("message");
const videoList = document.getElementById("videoList");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const url = document.getElementById("tiktokUrl").value.trim();
  const reward = parseInt(document.getElementById("reward").value);
  const duration = parseInt(document.getElementById("watchDuration").value);

  if (!title || !url || isNaN(reward) || isNaN(duration)) {
    messageEl.style.color = "red";
    messageEl.textContent = "Please fill all fields correctly.";
    return;
  }

  messageEl.style.color = "black";
  messageEl.textContent = "Uploading...";

  try {
    await addDoc(collection(db, "tiktokVideos"), {
      title,
      url,
      reward,
      requiredWatchTime: duration,
      createdAt: serverTimestamp()
    });
    messageEl.style.color = "green";
    messageEl.textContent = "Video uploaded successfully!";
    form.reset();
    loadVideos();
  } catch (error) {
    messageEl.style.color = "red";
    messageEl.textContent = `Error: ${error.message}`;
  }
});

// Extract TikTok video ID and create embed URL
function getEmbedUrl(originalUrl) {
  // Match video ID from URLs like https://www.tiktok.com/@user/video/1234567890
  const match = originalUrl.match(/video\/(\d+)/);
  if (match && match[1]) {
    return `https://www.tiktok.com/embed/${match[1]}`;
  }
  // Fallback: return original URL if no match
  return originalUrl;
}

async function loadVideos() {
  videoList.innerHTML = "<p>Loading videos...</p>";

  try {
    const querySnapshot = await getDocs(collection(db, "tiktokVideos"));
    videoList.innerHTML = "";

    if (querySnapshot.empty) {
      videoList.innerHTML = "<p>No videos uploaded yet.</p>";
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;

      const card = document.createElement("div");
      card.className = "video-card";

      const embedUrl = getEmbedUrl(data.url);

      card.innerHTML = `
        <h4>${data.title}</h4>
        <p><strong>Reward:</strong> ${data.reward} credits</p>
        <p><strong>Watch Time:</strong> ${data.requiredWatchTime} seconds</p>
        <iframe src="${embedUrl}" frameborder="0" allowfullscreen></iframe>
        <button data-id="${id}">Delete</button>
      `;

      // Delete button handler
      card.querySelector("button").addEventListener("click", async () => {
        if (confirm("Are you sure you want to delete this video?")) {
          try {
            await deleteDoc(doc(db, "tiktokVideos", id));
            loadVideos();
          } catch (err) {
            alert("Error deleting video: " + err.message);
          }
        }
      });

      videoList.appendChild(card);
    });
  } catch (err) {
    videoList.innerHTML = `<p style="color:red;">Error loading videos: ${err.message}</p>`;
  }
}

// Load videos initially
loadVideos();