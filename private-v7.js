// ======================================
// AASHISH CHAT
// PRIVATE V7
// PHASE 1
// ======================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    set,
    get,
    update,
    remove,
    onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// ======================================
// FIREBASE
// ======================================

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

// ======================================
// USER
// ======================================

const myId = localStorage.getItem("userId");
const myName = localStorage.getItem("userName");

const otherId = localStorage.getItem("chatWith");
const otherName = localStorage.getItem("chatWithName");

const roomId = [myId, otherId].sort().join("_");

// ======================================
// CALL REF
// ======================================

const callRef = ref(db, "calls/" + roomId);

// ======================================
// HTML
// ======================================

const audioBtn = document.getElementById("audioCallBtn");
const videoBtn = document.getElementById("videoCallBtn");

const incomingBox = document.getElementById("incomingCall");
const callerName = document.getElementById("callerName");

const acceptBtn = document.getElementById("acceptCall");
const rejectBtn = document.getElementById("rejectCall");

console.log("✅ PRIVATE V7 PHASE 1");
// ======================================
// PRIVATE V7
// PHASE 2
// CREATE CALL
// ======================================

async function createCall(type) {

    const callId = crypto.randomUUID();

    await set(callRef, {

        callId: callId,

        roomId: roomId,

        callerId: myId,
        callerName: myName,

        receiverId: otherId,

        type: type,

        status: "ringing",

        createdAt: Date.now()

    });

    localStorage.setItem("callId", callId);
    localStorage.setItem("callType", type);
    localStorage.setItem("isCaller", "true");

    window.location.href = "call.html";

}

audioBtn.onclick = () => createCall("audio");

videoBtn.onclick = () => createCall("video");

console.log("✅ PRIVATE V7 PHASE 2");
// ======================================
// PRIVATE V7
// PHASE 3
// INCOMING CALL LISTENER
// ======================================

onValue(callRef, (snap) => {

    if (!snap.exists()) {

        incomingBox.style.display = "none";
        return;

    }

    const call = snap.val();

    // मैं Caller हूँ
    if (call.callerId === myId) return;

    // मेरे लिए Incoming Call
    if (
        call.receiverId === myId &&
        call.status === "ringing"
    ) {

        callerName.innerText =
            (call.callerName || "Unknown User") +
            " is calling...";

        incomingBox.style.display = "block";

    }

    // Caller ने Cancel किया
    if (call.status === "cancelled") {

        incomingBox.style.display = "none";

    }

});

console.log("✅ PRIVATE V7 PHASE 3");
// ======================================
// PRIVATE V7
// PHASE 4
// ACCEPT / REJECT
// ======================================

acceptBtn.onclick = async () => {

    const snap = await get(callRef);

    if (!snap.exists()) return;

    const call = snap.val();

    await update(callRef, {

        status: "accepted",
        acceptedAt: Date.now()

    });

    localStorage.setItem("callId", call.callId);
    localStorage.setItem("callType", call.type);
    localStorage.setItem("isCaller", "false");

    incomingBox.style.display = "none";

    window.location.href = "call.html";

};

rejectBtn.onclick = async () => {

    await update(callRef, {

        status: "rejected",
        rejectedAt: Date.now()

    });

    incomingBox.style.display = "none";

};
// ======================================
// PRIVATE V7
// PHASE 5
// CALL STATUS LISTENER
// ======================================

onValue(callRef, (snap) => {

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

    if (call.status === "cancelled") {

        alert("📞 Call Cancelled");

    }

});
// ======================================
// PRIVATE V7
// PHASE 6
// CANCEL + MISSED CALL
// ======================================

// Caller Cancel
window.addEventListener("beforeunload", async () => {

    try {

        const snap = await get(callRef);

        if (!snap.exists()) return;

        const call = snap.val();

        if (
            call.callerId === myId &&
            call.status === "ringing"
        ) {

            await update(callRef, {
                status: "cancelled"
            });

        }

    } catch (e) {

        console.log(e);

    }

});

// Auto Missed Call
setTimeout(async () => {

    try {

        const snap = await get(callRef);

        if (!snap.exists()) return;

        const call = snap.val();

        if (call.status === "ringing") {

            await update(callRef, {
                status: "missed"
            });

        }

    } catch (e) {

        console.log(e);

    }

}, 30000);

console.log("✅ PRIVATE V7 PHASE 6");
// ======================================
// PRIVATE V7
// PHASE 7
// FINAL CLEANUP
// ======================================

onValue(callRef, (snap) => {

    if (!snap.exists()) {

        incomingBox.style.display = "none";
        return;

    }

    const call = snap.val();

    if (
        call.status === "ended" ||
        call.status === "missed"
    ) {

        incomingBox.style.display = "none";

    }

});

window.addEventListener("unload", () => {

    localStorage.removeItem("callId");
    localStorage.removeItem("callType");
    localStorage.removeItem("isCaller");

});

console.log("✅ PRIVATE V7 COMPLETE");