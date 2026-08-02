import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getDatabase,
  ref,
  get,
  onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import {
  getAuth,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Login Check
const userId = localStorage.getItem("userId");
const userName = localStorage.getItem("userName");

if (!userId || !userName) {
  window.location.href = "login.html";
}

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBe5YHFmT1qmI0dLj2vsNzMapHoh6do3mU",
  authDomain: "aashish-chat.firebaseapp.com",
  databaseURL: "https://aashish-chat-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "aashish-chat",
  storageBucket: "aashish-chat.firebasestorage.app",
  messagingSenderId: "879314147015",
  appId: "1:879314147015:web:5c6ea4ee171941a79c90e2"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// HTML Elements
const profile = document.getElementById("myProfile");
const searchId = document.getElementById("searchId");
const findUser = document.getElementById("findUser");
const recentChats = document.getElementById("recentChats");
const logoutBtn = document.getElementById("logoutBtn");

// Profile
profile.innerHTML = `👤 ${userName} (@${userId})`;

// Search User
findUser.onclick = async () => {

  const id = searchId.value.trim().toLowerCase();

  if (id === "") {
    alert("User ID डालो");
    return;
  }

  if (id === userId) {
    alert("अपनी ही ID search नहीं कर सकते");
    return;
  }

  const snap = await get(ref(db, "users/" + id));

  if (!snap.exists()) {
    alert("User Not Found");
    return;
  }

  const user = snap.val();

  localStorage.setItem("chatWith", user.userid);
  localStorage.setItem("chatWithName", user.name);
  localStorage.setItem("chatWithPhoto", user.photo || "");

  window.location.href = "private.html";

};

// Recent Chats

onValue(ref(db, "recentChats/" + userId), (snap) => {

  recentChats.innerHTML = "";

  if (!snap.exists()) {
    recentChats.innerHTML = "<p>No Recent Chats</p>";
    return;
  }

  const chats = snap.val();

  Object.keys(chats)
    .sort((a,b)=>chats[b].time-chats[a].time)
    .forEach(id=>{

      const chat=chats[id];
      const unread=chat.unread||0;

      const div=document.createElement("div");

      div.style.padding="10px";
      div.style.borderBottom="1px solid #444";
      div.style.cursor="pointer";

      div.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center">

      <div style="display:flex;align-items:center">

      <img src="${chat.photo||'https://via.placeholder.com/45'}"
      width="45"
      height="45"
      style="border-radius:50%;object-fit:cover;">

      <div style="margin-left:10px">

      <b>${chat.name}</b><br>

      <small>${chat.lastMessage}</small>

      </div>

      </div>

      ${
      unread>0?
      `<span style="background:#00c853;color:white;border-radius:50%;padding:5px 8px;font-size:12px">${unread}</span>`
      :""
      }

      </div>
      `;

      div.onclick=()=>{

        localStorage.setItem("chatWith",id);
        localStorage.setItem("chatWithName",chat.name);
        localStorage.setItem("chatWithPhoto",chat.photo||"");

        window.location.href="private.html";

      };

      recentChats.appendChild(div);

    });

});

// Logout

logoutBtn.onclick = async ()=>{

if(!confirm("Logout करना है?")) return;

await signOut(auth);

localStorage.clear();

window.location.href="index.html";

};
