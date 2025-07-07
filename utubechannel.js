import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import {
  getFirestore, collection, getDocs, doc, getDoc, setDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyASIQCUoU7biVUPjFSlJhACK2uI8C2Hm2I",
  authDomain: "ehub-1d950.firebaseapp.com",
  projectId: "ehub-1d950",
  storageBucket: "ehub-1d950.appspot.com",
  messagingSenderId: "156410249022",
  appId: "1:156410249022:web:7b072d01c7e8c924e9b66f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const balanceDiv = document.getElementById("balance");
const channelList = document.getElementById("channelList");
const questionList = document.getElementById("questionList");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const subscribedRef = doc(db, "subscriptions", user.uid);
  const answersRef = doc(db, "answers", user.uid);

  const [userDoc, subsDoc, answersDoc] = await Promise.all([
    getDoc(userRef),
    getDoc(subscribedRef),
    getDoc(answersRef)
  ]);
  const userData = userDoc.exists() ? userDoc.data() : {};
  const subsData = subsDoc.exists() ? subsDoc.data() : {};
  const answersData = answersDoc.exists() ? answersDoc.data() : {};

  balanceDiv.textContent = `Balance: Rwf ${userData.earned || 0}`;

  // Load Channels
  const channelSnap = await getDocs(collection(db, "channels"));
  channelList.innerHTML = "";
  channelSnap.forEach(docSnap => {
    const ch = docSnap.data();
    const id = docSnap.id;
    const subscribed = subsData[id];

    const div = document.createElement("div");
    div.className = "channel-card";
    div.innerHTML = `<h3>${ch.title}</h3><p>Reward: ${ch.reward} Rwf</p>`;

    const btn = document.createElement("button");
    btn.textContent = subscribed ? "Subscribed" : "Subscribe";
    btn.disabled = !!subscribed;

    btn.onclick = async () => {
      if (btn.disabled) return;
      await setDoc(subscribedRef, { ...subsData, [id]: true });
      const newBalance = (userData.earned || 0) + ch.reward;
      await updateDoc(userRef, { earned: newBalance });
      userData.earned = newBalance;
      balanceDiv.textContent = `Balance: Rwf ${newBalance}`;
      btn.textContent = "Subscribed";
      btn.disabled = true;
    };

    div.appendChild(btn);
    channelList.appendChild(div);
  });

  // Load Questions
  const questionSnap = await getDocs(collection(db, "questions"));
  questionList.innerHTML = "";
  questionSnap.forEach(docSnap => {
    const q = docSnap.data();
    const id = docSnap.id;

    if (answersData[id]) return;

    const icon = document.createElement("div");
    icon.className = "question-icon";
    icon.textContent = "?";
    icon.title = "Click to answer";

    icon.onclick = () => {
      icon.style.display = "none";

      const card = document.createElement("div");
      card.className = "question-card";
      card.innerHTML = `<h3>${q.question}</h3><p>Time to answer: ${q.time} seconds</p>`;

      const optionsDiv = document.createElement("div");
      optionsDiv.className = "question-options";

      let answered = false;

      Object.entries(q.options).forEach(([key, val]) => {
        const optBtn = document.createElement("button");
        optBtn.textContent = `${key}: ${val}`;
        optBtn.onclick = async () => {
          if (answered) return;
          answered = true;

          await setDoc(answersRef, { ...answersData, [id]: true });

          const resultMsg = document.createElement("p");
          resultMsg.style.marginTop = "0.5rem";
          resultMsg.style.fontWeight = "bold";
          resultMsg.style.textAlign = "center";

          if (key === q.correct) {
            const newBalance = (userData.earned || 0) + 100;
            await updateDoc(userRef, { earned: newBalance });
            userData.earned = newBalance;
            balanceDiv.textContent = `Balance: Rwf ${newBalance}`;
            optBtn.style.backgroundColor = "#00c853";
            resultMsg.textContent = "Correct! +100 Rwf";
            resultMsg.style.color = "#00c853";
          } else {
            optBtn.style.backgroundColor = "#c62828";
            resultMsg.textContent = "Wrong answer.";
            resultMsg.style.color = "#c62828";
          }

          Array.from(optionsDiv.children).forEach(b => b.disabled = true);
          card.appendChild(resultMsg);

          // Hide card after 3 seconds
          setTimeout(() => card.remove(), 3000);
        };
        optionsDiv.appendChild(optBtn);
      });

      card.appendChild(optionsDiv);

      // Timer
      let timeLeft = q.time;
      const timerText = document.createElement("p");
      timerText.style.marginTop = "0.5rem";
      timerText.style.fontWeight = "bold";
      card.insertBefore(timerText, optionsDiv);

      const timerInterval = setInterval(() => {
        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          timerText.textContent = "Time expired! Question locked.";
          if (!answered) {
            answered = true;
            setDoc(answersRef, { ...answersData, [id]: true });
            Array.from(optionsDiv.children).forEach(b => b.disabled = true);
            setTimeout(() => card.remove(), 3000);
          }
          return;
        }
        timerText.textContent = `Time left: ${timeLeft}s`;
        timeLeft--;
      }, 1000);

      questionList.appendChild(card);
    };

    questionList.appendChild(icon);
  });
});