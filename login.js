import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getDatabase,
  ref,
  set,
  get
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

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
const auth = getAuth(app);
onAuthStateChanged(auth, (user) => {

  if (user) {

    if (localStorage.getItem("userId")) {

      window.location.href = "chat.html";

    }

  }

});
onAuthStateChanged(auth, (user) => {

  if (user && localStorage.getItem("userId")) {

    window.location.href = "chat.html";

  }

});
// =====================
// AUTO LOGIN
// =====================

onAuthStateChanged(auth, async (user) => {

  if (!user) return;

  const uid = user.uid;

  const snap = await get(ref(db, "users"));

  if (!snap.exists()) return;

  const users = snap.val();

  for (const key in users) {

    if (users[key].uid === uid) {

      localStorage.setItem("userId", users[key].userid);
      localStorage.setItem("userName", users[key].name);

      window.location.href = "chat.html";
      return;

    }

  }

});
const db = getDatabase(app);
let photoBase64 = "";
document.getElementById("photo").addEventListener("change", (e) => {

  const file = e.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = function () {

    photoBase64 = reader.result;

    document.getElementById("preview").src = photoBase64;

  };

  reader.readAsDataURL(file);

});
// SIGN UP
document.getElementById("signupBtn").onclick = async () => {

  const name = document.getElementById("name").value.trim();
  const userid = document.getElementById("userid").value.trim().toLowerCase();
  const mobile = document.getElementById("mobile").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!name || !userid || !mobile || !email || !password) {
    alert("Sabhi fields bharo.");
    return;
  }

  try {

    const userCredential =
      await createUserWithEmailAndPassword(auth, email, password);

   await set(ref(db, "users/" + userid), {
  uid: userCredential.user.uid,
  name,
  userid,
  mobile,
  email,
  photo: photoBase64,
  status: "offline",
  createdAt: Date.now()
});

    localStorage.setItem("userId", userid);
    localStorage.setItem("userName", name);

    alert("Sign Up Successful");

    window.location.href = "chat.html";

  } catch (e) {

    alert(e.message);

  }

};

// LOGIN
document.getElementById("loginBtn").onclick = async () => {

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  try {

    const userCredential =
      await signInWithEmailAndPassword(auth, email, password);

    const uid = userCredential.user.uid;

    const snap = await get(ref(db, "users"));

    if (snap.exists()) {

      const users = snap.val();

      for (const key in users) {

        if (users[key].uid === uid) {

          localStorage.setItem("userId", users[key].userid);
          localStorage.setItem("userName", users[key].name);

          break;
        }

      }

    }

    alert("Login Successful");

    window.location.href = "chat.html";

  } catch (e) {

    alert(e.message);

  }

};

// FORGOT PASSWORD
const forgotBtn = document.getElementById("forgotPassword");

if (forgotBtn) {

  forgotBtn.onclick = async () => {

    const email = document.getElementById("loginEmail").value.trim();

    if (!email) {
      alert("Pehle Login Email likho.");
      return;
    }

    try {

      await sendPasswordResetEmail(auth, email);

      console.log("Reset email sent successfully");

      alert("✅ Password reset email bhej diya gaya hai.\n\nInbox, Spam aur Promotions folder check karo.");

    } catch (e) {

      console.error(e);

      alert(
        "Error Code: " + e.code +
        "\n\nMessage: " + e.message
      );

    }

  };

}