// ===============================
// FIREBASE IMPORTS
// ===============================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    set,
    get,
    push,
    update,
    remove,
    onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// ===============================
// FIREBASE CONFIG
// ===============================

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

// ===============================
// USER DATA
// ===============================

const myId = localStorage.getItem("userId");
const myName = localStorage.getItem("userName");
const myPhoto = localStorage.getItem("myPhoto") || "";

const otherId = localStorage.getItem("chatWith");
const otherName = localStorage.getItem("chatWithName");
const otherPhoto = localStorage.getItem("chatWithPhoto") || "";

if (!myId || !otherId) {
    alert("User Missing");
    location.href = "home.html";
}

// ===============================
// ROOM ID
// ===============================

const roomId = [myId, otherId].sort().join("_");

// ===============================
// HTML ELEMENTS
// ===============================

const profilePhoto = document.getElementById("profilePhoto");
const chatTitle = document.getElementById("chatTitle");
const userStatus = document.getElementById("userStatus");

const messages = document.getElementById("messages");
const typing = document.getElementById("typing");

const msg = document.getElementById("msg");
const sendBtn = document.getElementById("send");

const imageBtn = document.getElementById("imageBtn");
const imageInput = document.getElementById("image");

const audioCallBtn = document.getElementById("audioCallBtn");
const videoCallBtn = document.getElementById("videoCallBtn");

// ===============================
// HEADER
// ===============================

chatTitle.textContent = otherName || "Unknown User";

if (otherPhoto) {
    profilePhoto.src = otherPhoto;
}

console.log("✅ PRIVATE V5 PART-1 LOADED");
// ===============================
// ONLINE STATUS
// ===============================

const myRef = ref(db, "users/" + myId);

update(myRef, {
    status: "online",
    lastSeen: Date.now()
});

window.addEventListener("beforeunload", async () => {

    await remove(typingRef);

    await update(myRef, {
        status: "offline",
        lastSeen: Date.now()
    });

});

onValue(ref(db, "users/" + otherId), (snap) => {

    if (!snap.exists()) return;

    const user = snap.val();

    userStatus.innerText =
        user.status === "online"
            ? "🟢 Online"
            : "⚫ Offline";

});

// ===============================
// TIME FORMAT
// ===============================

function formatTime(time){

    return new Date(time).toLocaleTimeString([],{

        hour:"2-digit",
        minute:"2-digit"

    });

}

// ===============================
// SEND MESSAGE
// ===============================

async function sendMessage(){

    const text = msg.value.trim();

    if(text==="") return;

    await push(ref(db,"privateChats/"+roomId),{

        sender:myId,
        senderName:myName,
        text:text,
        time:Date.now(),
        seen:false

    });

    msg.value="";

}

sendBtn.onclick = sendMessage;

msg.addEventListener("keydown",(e)=>{

    if(e.key==="Enter"){

        e.preventDefault();

        sendMessage();

    }

});

// ===============================
// LOAD CHAT
// ===============================

onValue(ref(db,"privateChats/"+roomId),(snap)=>{

    messages.innerHTML="";

    if(!snap.exists()) return;

    snap.forEach(item=>{

        const chat=item.val();

        const div=document.createElement("div");

        div.className=
        chat.sender===myId
        ?"myMsg"
        :"otherMsg";

        div.innerHTML=`
            <div>${chat.text||""}</div>
            <small>${formatTime(chat.time)}</small>
        `;

        messages.appendChild(div);

    });

    messages.scrollTop=messages.scrollHeight;

});

console.log("✅ PRIVATE V5 PART-2 LOADED");
// ===============================
// TYPING SYSTEM
// ===============================

const typingRef = ref(db, "typing/" + roomId + "/" + myId);

msg.addEventListener("input", async () => {

    if (msg.value.trim() === "") {

        await remove(typingRef);

    } else {

        await set(typingRef, {
            typing: true,
            time: Date.now()
        });

    }

});

onValue(ref(db, "typing/" + roomId + "/" + otherId), (snap) => {

    if (!snap.exists()) {

    typing.innerText = "";
    return;

}

const data = snap.val();

if (Date.now() - data.time > 3000) {

    typing.innerText = "";

} else {

    typing.innerText = "✍️ Typing...";

}

});

// ===============================
// REMOVE TYPING AFTER SEND
// ===============================

async function clearTyping() {

    await remove(typingRef);

}

const oldSend = sendMessage;

sendMessage = async function () {

    await oldSend();

    await clearTyping();

};

// ===============================
// SEEN STATUS
// ===============================

async function markSeen() {

    const snap = await get(ref(db, "privateChats/" + roomId));

    if (!snap.exists()) return;

    snap.forEach(async (item) => {

        const chat = item.val();

        if (chat.sender !== myId && !chat.seen) {

            await update(
                ref(db, "privateChats/" + roomId + "/" + item.key),
                {
                    seen: true
                }
            );

        }

    });

}

markSeen();

console.log("✅ PRIVATE V5 PART-3 LOADED");
// ===============================
// IMAGE UPLOAD
// ===============================

imageBtn.onclick = () => imageInput.click();

imageInput.addEventListener("change", async () => {

    const file = imageInput.files[0];

    if (!file) return;

    const form = new FormData();

    form.append("file", file);
    form.append("upload_preset", "chat_images");

    const res = await fetch(
        "https://api.cloudinary.com/v1_1/evsxhohk/image/upload",
        {
            method: "POST",
            body: form
        }
    );

    const data = await res.json();

    await push(ref(db, "privateChats/" + roomId), {

        sender: myId,
        senderName: myName,
        image: data.secure_url,
        time: Date.now(),
        seen: false

    });

    imageInput.value = "";

});

console.log("✅ PRIVATE V5 PART-4 LOADED");
// ===============================
// CALL BUTTONS
// ===============================

async function startCall(type) {

    const callId = Date.now().toString();

    localStorage.setItem("callId", callId);
    localStorage.setItem("callType", type);
    localStorage.setItem("isCaller", "true");

    await set(ref(db, "calls/" + roomId), {

        callId: callId,
        roomId: roomId,

        callerId: myId,
        callerName: myName,
        callerPhoto: myPhoto,

        receiverId: otherId,

        type: type,
        status: "ringing",
        time: Date.now()

    });

    window.location.href = "call.html";

}

audioCallBtn.onclick = () => {

    startCall("audio");

};

videoCallBtn.onclick = () => {

    startCall("video");

};

console.log("✅ PRIVATE V5 FULLY LOADED");
// ===============================
// INCOMING CALL LISTENER
// ===============================

const incomingRef = ref(db, "calls/" + roomId);

onValue(incomingRef, (snap) => {

    if (!snap.exists()) return;

    const call = snap.val();

    // मैं Caller हूँ
    if (call.callerId === myId) return;

    // अगर मेरे लिए Call आई है
    if (
        call.receiverId === myId &&
        call.status === "ringing"
    ) {

        const box = document.getElementById("incomingCall");

        const caller = document.getElementById("callerName");

        caller.innerText =
            (call.callerName || "Unknown") +
            " is calling...";

        box.style.display = "block";

    }

});

console.log("✅ Incoming Listener Loaded");
// ===============================
// ACCEPT / REJECT BUTTONS
// ===============================

const acceptBtn = document.getElementById("acceptCall");
const rejectBtn = document.getElementById("rejectCall");
const incomingBox = document.getElementById("incomingCall");

acceptBtn.onclick = async () => {

    const snap = await get(incomingRef);

    if (!snap.exists()) return;

    const call = snap.val();

    localStorage.setItem("callId", call.callId);
    localStorage.setItem("callType", call.type);
    localStorage.setItem("isCaller", "false");

    await update(incomingRef, {
        status: "accepted",
        acceptedTime: Date.now()
    });

    incomingBox.style.display = "none";

    window.location.href = "call.html";
};

rejectBtn.onclick = async () => {

    await update(incomingRef, {
        status: "rejected"
    });

    incomingBox.style.display = "none";
};

console.log("✅ Accept / Reject Ready");
// ===============================
// CALL STATUS LISTENER
// ===============================

onValue(incomingRef, (snap) => {

    if (!snap.exists()) return;

    const call = snap.val();

    // सिर्फ Caller के लिए
    if (call.callerId !== myId) return;

    if (call.status === "accepted") {

        localStorage.setItem("callId", call.callId);
        localStorage.setItem("callType", call.type);
        localStorage.setItem("isCaller", "true");

        window.location.href = "call.html";

    }

    if (call.status === "rejected") {

        alert("❌ User Rejected Your Call");

    }

});
// ===============================
// INCOMING PART 4
// CLEANUP + MISSED CALL
// ===============================

// Caller Cancel
window.addEventListener("beforeunload", async () => {

    try {

        const snap = await get(incomingRef);

        if (!snap.exists()) return;

        const call = snap.val();

        if (
            call.callerId === myId &&
            call.status === "ringing"
        ) {

            await update(incomingRef, {
                status: "cancelled"
            });

        }

    } catch (e) {

        console.log(e);

    }

});

// Receiver Listen
onValue(incomingRef, (snap) => {

    if (!snap.exists()) return;

    const call = snap.val();

    if (
        call.receiverId === myId &&
        call.status === "cancelled"
    ) {

        incomingBox.style.display = "none";

    }

});

// Missed Call
setTimeout(async () => {

    try {

        const snap = await get(incomingRef);

        if (!snap.exists()) return;

        const call = snap.val();

        if (call.status === "ringing") {

            await update(incomingRef, {
                status: "missed"
            });

        }

    } catch (e) {

        console.log(e);

    }

}, 30000);

console.log("✅ Incoming Part 4 Loaded");
