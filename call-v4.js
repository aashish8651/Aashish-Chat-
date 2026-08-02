// ===============================
// FIREBASE IMPORT
// ===============================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getDatabase,
  ref,
  set,
  get,
  push,
  remove,
  update,
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
// USER INFO
// ===============================

const myId = localStorage.getItem("userId");
const otherId = localStorage.getItem("chatWith");

const roomId = [myId, otherId].sort().join("_");

const isCaller =
localStorage.getItem("isCaller") === "true";

const callType =
localStorage.getItem("callType") || "video";

// ===============================
// HTML
// ===============================

const myVideo = document.getElementById("myVideo");
const remoteVideo = document.getElementById("remoteVideo");

const callTitle = document.getElementById("callTitle");
const callTime = document.getElementById("callTime");

const muteBtn = document.getElementById("muteBtn");
const cameraBtn = document.getElementById("cameraBtn");
const endBtn = document.getElementById("endBtn");

// ===============================
// VARIABLES
// ===============================

let localStream;
let remoteStream;

let peer;

let timer = 0;
let timerInterval;

// ===============================
// STUN SERVER
// ===============================

const servers = {

  iceServers: [

    {
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302"
      ]
    }

  ]

};

peer = new RTCPeerConnection(servers);

// ===============================
// START CAMERA
// ===============================

async function startMedia(){

    localStream =
    await navigator.mediaDevices.getUserMedia({

        video: callType==="video",
        audio:true

    });

    myVideo.srcObject=localStream;

    remoteStream=new MediaStream();

    remoteVideo.srcObject=remoteStream;

    localStream.getTracks().forEach(track=>{

        peer.addTrack(track,localStream);

    });

    callTitle.innerText=
    callType==="video"
    ?"🎥 Video Call"
    :"📞 Audio Call";

}

console.log("✅ CALL V4 PART-1 LOADED");
// ===============================
// REMOTE VIDEO + AUDIO
// ===============================

peer.ontrack = (event) => {

    event.streams[0].getTracks().forEach(track => {

        remoteStream.addTrack(track);

    });

};

// ===============================
// ICE SEND
// ===============================

peer.onicecandidate = async (event) => {

    if (!event.candidate) return;

    await push(
        ref(db, "calls/" + roomId + "/candidates/" + myId),
        event.candidate.toJSON()
    );

};

// ===============================
// ICE RECEIVE
// ===============================

onValue(
    ref(db, "calls/" + roomId + "/candidates/" + otherId),
    async (snap) => {

        if (!snap.exists()) return;

        for (const child of Object.values(snap.val())) {

            try {

                await peer.addIceCandidate(
                    new RTCIceCandidate(child)
                );

            } catch (e) {

                console.log(e);

            }

        }

    }
);

// ===============================
// CREATE OFFER
// ===============================

async function createOffer() {

    const offer = await peer.createOffer();

    await peer.setLocalDescription(offer);

    await set(ref(db, "calls/" + roomId + "/offer"), {

        type: offer.type,
        sdp: offer.sdp

    });

}

// ===============================
// RECEIVE OFFER
// ===============================

onValue(ref(db, "calls/" + roomId + "/offer"), async (snap) => {

    if (!snap.exists()) return;

    if (peer.remoteDescription) return;

    const offer = snap.val();

    await peer.setRemoteDescription(
        new RTCSessionDescription(offer)
    );

    const answer = await peer.createAnswer();

    await peer.setLocalDescription(answer);

    await set(ref(db, "calls/" + roomId + "/answer"), {

        type: answer.type,
        sdp: answer.sdp

    });

});

// ===============================
// RECEIVE ANSWER
// ===============================

onValue(ref(db, "calls/" + roomId + "/answer"), async (snap) => {

    if (!snap.exists()) return;

    if (peer.remoteDescription) return;

    await peer.setRemoteDescription(
        new RTCSessionDescription(snap.val())
    );

});

// ===============================
// START
// ===============================

startMedia().then(() => {

    if (isCaller) {

        createOffer();

    }

});

console.log("✅ CALL V4 PART-2 LOADED");
// ===============================
// CONNECTION STATUS
// ===============================

peer.onconnectionstatechange = () => {

    console.log("Connection:", peer.connectionState);

    if (peer.connectionState === "connected") {

        callTitle.innerText = "🟢 Connected";

        startTimer();

    }

    if (
        peer.connectionState === "disconnected" ||
        peer.connectionState === "failed" ||
        peer.connectionState === "closed"
    ) {

        callTitle.innerText = "🔴 Call Ended";

        clearInterval(timerInterval);

    }

};

// ===============================
// CALL TIMER
// ===============================

function startTimer() {

    if (timerInterval) return;

    timerInterval = setInterval(() => {

        timer++;

        const min = String(Math.floor(timer / 60)).padStart(2, "0");
        const sec = String(timer % 60).padStart(2, "0");

        callTime.innerText = min + ":" + sec;

    }, 1000);

}

// ===============================
// MUTE BUTTON
// ===============================

muteBtn.onclick = () => {

    if (!localStream) return;

    const audioTrack = localStream.getAudioTracks()[0];

    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;

    muteBtn.innerText =
        audioTrack.enabled ? "🎤" : "🔇";

};

// ===============================
// CAMERA BUTTON
// ===============================

cameraBtn.onclick = () => {

    if (!localStream) return;

    const videoTrack = localStream.getVideoTracks()[0];

    if (!videoTrack) return;

    videoTrack.enabled = !videoTrack.enabled;

    cameraBtn.innerText =
        videoTrack.enabled ? "📷" : "🚫";

};

// ===============================
// REMOTE VIDEO PLAY FIX
// ===============================

remoteVideo.onloadedmetadata = () => {

    remoteVideo.play().catch(() => {});

};

myVideo.onloadedmetadata = () => {

    myVideo.play().catch(() => {});

};

console.log("✅ CALL V4 PART-3 LOADED");
// ===============================
// END CALL
// ===============================

endBtn.onclick = async () => {

    try {

        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }

        if (remoteStream) {
            remoteStream.getTracks().forEach(track => track.stop());
        }

        if (peer) {
            peer.close();
        }

        clearInterval(timerInterval);

        await update(ref(db, "calls/" + roomId), {
            status: "ended",
            endedBy: myId,
            endTime: Date.now()
        });

        setTimeout(async () => {
            await remove(ref(db, "calls/" + roomId));
        }, 1000);

    } catch (e) {

        console.log(e);

    }

    window.location.href = "private.html";

};

// ===============================
// REMOTE CALL END
// ===============================

onValue(ref(db, "calls/" + roomId), (snap) => {

    if (!snap.exists()) {

        clearInterval(timerInterval);

        if (peer) peer.close();

        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }

        return;
    }

    const call = snap.val();

    if (call.status === "ended") {

        alert("📞 Call Ended");

        clearInterval(timerInterval);

        if (peer) peer.close();

        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }

        window.location.href = "private.html";
    }

});

// ===============================
// AUTO CLEANUP
// ===============================

window.addEventListener("beforeunload", async () => {

    try {

        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }

        if (peer) {
            peer.close();
        }

    } catch (e) {

        console.log(e);

    }

});

console.log("✅ CALL V4 PART-4 LOADED");
// ===============================
// FINAL CONNECTION FIX
// ===============================

peer.oniceconnectionstatechange = () => {

    console.log("ICE:", peer.iceConnectionState);

    if (
        peer.iceConnectionState === "connected" ||
        peer.iceConnectionState === "completed"
    ) {

        callTitle.innerText = "🟢 Connected";

    }

    if (
        peer.iceConnectionState === "failed"
    ) {

        callTitle.innerText = "🔴 Connection Failed";

    }

};

// ===============================
// REMOTE STREAM SAFE ADD
// ===============================

peer.ontrack = (event) => {

    event.streams[0].getTracks().forEach(track => {

        const already =
            remoteStream.getTracks()
            .find(t => t.id === track.id);

        if (!already) {

            remoteStream.addTrack(track);

        }

    });

};

// ===============================
// FORCE VIDEO PLAY
// ===============================

setInterval(() => {

    if (
        remoteVideo.srcObject &&
        remoteVideo.paused
    ) {

        remoteVideo.play().catch(()=>{});

    }

},1000);

// ===============================
// DEBUG
// ===============================

console.log("Room:", roomId);
console.log("Me:", myId);
console.log("Other:", otherId);
console.log("Caller:", isCaller);

console.log("✅ CALL V4 FULLY LOADED");