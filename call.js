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
  onValue,
  remove,
  update
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

const callType = localStorage.getItem("callType") || "video";

const roomId = [myId, otherId].sort().join("_");

// ===============================
// HTML ELEMENTS
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

let localStream = null;
let remoteStream = null;

let peer = null;

let timer = 0;
let timerInterval = null;
// ===============================
// WEBRTC CONFIG
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
// START CAMERA + MICROPHONE
// ===============================

async function startMedia() {

  try {

    localStream = await navigator.mediaDevices.getUserMedia({

      video: callType === "video",
      audio: true

    });

    myVideo.srcObject = localStream;

    if (callType === "audio") {

      myVideo.style.display = "none";

    }

    localStream.getTracks().forEach(track => {

      peer.addTrack(track, localStream);

    });

    remoteStream = new MediaStream();

    remoteVideo.srcObject = remoteStream;

    peer.ontrack = (event) => {

      event.streams[0].getTracks().forEach(track => {

        remoteStream.addTrack(track);

      });

    };

    callTitle.innerText =
      callType === "video"
      ? "🎥 Video Call"
      : "📞 Audio Call";

    startTimer();

  } catch (e) {

    alert("Camera / Microphone Permission Denied");

    console.error(e);

  }

}

// ===============================
// CALL TIMER
// ===============================

function startTimer() {

  timerInterval = setInterval(() => {

    timer++;

    const min = String(Math.floor(timer / 60)).padStart(2, "0");
    const sec = String(timer % 60).padStart(2, "0");

    callTime.innerText = `${min}:${sec}`;

  }, 1000);

}

const isCaller = localStorage.getItem("isCaller") === "true";

startMedia().then(() => {
    if (isCaller) {
        createOffer();
    }
});
onValue(ref(db, "calls/" + roomId), (snap) => {

  if (!snap.exists()) return;

  const data = snap.val();

  if (data.status === "rejected") {

    alert("❌ Call Rejected");

    if (peer) peer.close();

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    clearInterval(timerInterval);

    window.location.href = "private.html";
  }

});
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

  if (peer.currentRemoteDescription) return;

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

  if (peer.currentRemoteDescription) return;

  await peer.setRemoteDescription(
    new RTCSessionDescription(snap.val())
  );

});

// Camera start होने के बाद Offer बनाओ

// ===============================
// ICE CANDIDATES SEND
// ===============================

peer.onicecandidate = async (event) => {

  if (!event.candidate) return;

  await push(
    ref(db, "calls/" + roomId + "/candidates/" + myId),
    event.candidate.toJSON()
  );

};

// ===============================
// ICE CANDIDATES RECEIVE
// ===============================

onValue(
  ref(db, "calls/" + roomId + "/candidates/" + otherId),
  (snap) => {

    if (!snap.exists()) return;

    snap.forEach(async (child) => {

      try {

        await peer.addIceCandidate(
          new RTCIceCandidate(child.val())
        );

      } catch (e) {

        console.log("ICE Error:", e);

      }

    });

  }
);

// ===============================
// CONNECTION STATUS
// ===============================

peer.onconnectionstatechange = () => {

  console.log("Connection:", peer.connectionState);

  if (peer.connectionState === "connected") {

    callTitle.innerText = "🟢 Connected";

  }

  if (
    peer.connectionState === "disconnected" ||
    peer.connectionState === "failed"
  ) {

    callTitle.innerText = "🔴 Call Ended";

  }

};
// ===============================
// MUTE BUTTON
// ===============================

muteBtn.onclick = () => {

  if (!localStream) return;

  const audioTrack = localStream.getAudioTracks()[0];

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
// END CALL
// ===============================

endBtn.onclick = async () => {

  if (localStream) {

    localStream.getTracks().forEach(track => track.stop());

  }

  if (peer) {

    peer.close();

  }

  clearInterval(timerInterval);

  try {

    await remove(ref(db, "calls/" + roomId));

  } catch (e) {

    console.log(e);

  }

  window.location.href = "private.html";

};
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

    clearInterval(timerInterval);

    await remove(ref(db, "calls/" + roomId));

  } catch (e) {

    console.log(e);

  }

});

// ===============================
// REMOTE CALL ENDED
// ===============================

onValue(ref(db, "calls/" + roomId), (snap) => {

  if (!snap.exists()) {

    if (peer) {

      peer.close();

    }

    if (localStream) {

      localStream.getTracks().forEach(track => track.stop());

    }

    clearInterval(timerInterval);

    alert("📞 Call Ended");

    window.location.href = "private.html";

  }

});
