import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Konfigurasi Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDDB8wgUqtfZUHx0qc6xT97L7oBp-k9nns",
  authDomain: "viral-cok.firebaseapp.com",
  projectId: "viral-cok",
  storageBucket: "viral-cok.firebasestorage.app",
  messagingSenderId: "465866226747",
  appId: "1:465866226747:web:cbe62190014be0f1bcf01e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Load YouTube Iframe API
const tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

let player;
let videoId = "";

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Script.js loaded');

  // Ambil konfigurasi dari Firestore
  let configData = { youtubeVideos: [], downloadLink: "" };
  try {
    const docRef = doc(db, "config", "configData");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      configData = docSnap.data();
    } else {
      console.log("No config data found in Firestore");
    }
  } catch (error) {
    console.error("Error retrieving config:", error);
  }

  let videos = configData.youtubeVideos || [];
  videos = videos.filter(url => url.trim() !== '');

  const iframe = document.getElementById('youtubeVideo');
  const noVideoMessage = document.getElementById('no-video-message');
  const downloadButton = document.getElementById('downloadButton');

  if (!iframe || !noVideoMessage || !downloadButton) return;

  function startCountdown() {
    let countdown = 20;
    downloadButton.textContent = `Download (${countdown} detik)`;
    downloadButton.disabled = true;
    const countdownInterval = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        downloadButton.textContent = `Download (${countdown} detik)`;
      } else {
        downloadButton.textContent = 'DOWNLOAD';
        downloadButton.disabled = false;
        clearInterval(countdownInterval);
      }
    }, 1000);
  }

  downloadButton.addEventListener('click', () => {
    if (!downloadButton.disabled) {
      const downloadLink = configData.downloadLink || '';
      if (downloadLink) {
        window.open(downloadLink, '_blank');
      } else {
        alert('No download link set. Please configure it in the admin page.');
      }
    }
  });

  if (videos.length > 0) {
    const randomIndex = Math.floor(Math.random() * videos.length);
    const videoUrl = videos[randomIndex];

    if (videoUrl.includes('v=')) {
      videoId = videoUrl.split('v=')[1]?.split('&')[0];
    } else if (videoUrl.includes('youtu.be')) {
      videoId = videoUrl.split('/').pop().split('?')[0];
    }

    if (videoId) {
      iframe.style.display = 'block';
     downloadButton.disabled = true;
     downloadButton.textContent = 'Download (20 detik)';
      noVideoMessage.style.display = 'none';
    } else {
      iframe.style.display = 'none';
      noVideoMessage.style.display = 'block';
      downloadButton.textContent = 'DOWNLOAD';
      downloadButton.disabled = true;
    }
  } else {
    iframe.style.display = 'none';
    noVideoMessage.style.display = 'block';
    downloadButton.textContent = 'DOWNLOAD';
    downloadButton.disabled = true;
  }
});

window.onYouTubeIframeAPIReady = function () {
  if (videoId) {
    player = new YT.Player('youtubeVideo', {
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        mute: 1,
        controls: 1,
      },
      events: {
        onReady: function (event) {
          event.target.setPlaybackQuality('medium');
        },
        onStateChange: function (event) {
          if (event.data === YT.PlayerState.PLAYING) {
            const checkTime = setInterval(() => {
              if (player && player.getCurrentTime) {
                const currentTime = player.getCurrentTime();
                if (currentTime >= 10) {
                  startCountdown();
                  clearInterval(checkTime);
                }
              }
            }, 1000);
          }
        }
      }
    });
  }
};