// Load YouTube Iframe API
const tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

let player;

document.addEventListener('DOMContentLoaded', async () => {
    // Import Firestore functions
    const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js");
    const db = window.firestoreDb;
    if (!db) {
        return;
    }

    // Ambil daftar video dari Firestore
    let videos = [];
    try {
        const videoDocRef = doc(db, "videos", "list");
        const videoDoc = await getDoc(videoDocRef);
        if (videoDoc.exists()) {
            videos = videoDoc.data().urls || [];
        }
    } catch (error) {
        // Silent error handling
    }

    // Filter video yang valid (tidak kosong)
    videos = videos.filter(url => url.trim() !== '');

    const iframe = document.getElementById('youtubeVideo');
    const noVideoMessage = document.getElementById('no-video-message');
    const downloadButton = document.getElementById('downloadButton');

    // Handle download button
    function startCountdown() {
        let countdown = 20;
        downloadButton.textContent = `Download (${countdown} detik)`;
        downloadButton.disabled = true;

        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                downloadButton.textContent = `Download (${countdown} detik)`;
            } else if (countdown === 0) {
                downloadButton.textContent = 'DOWNLOAD';
                downloadButton.disabled = false;
                clearInterval(countdownInterval);
            }
        }, 1000);
    }

    downloadButton.addEventListener('click', async () => {
        if (!downloadButton.disabled) {
            try {
                const downloadDocRef = doc(db, "settings", "download");
                const downloadDoc = await getDoc(downloadDocRef);
                const downloadLink = downloadDoc.exists() ? downloadDoc.data().url : '';
                if (downloadLink) {
                    window.open(downloadLink, '_blank');
                } else {
                    alert('No download link set. Please configure it in the admin page.');
                }
            } catch (error) {
                alert('Error fetching download link.');
            }
        }
    });

    // Handle video playback
    if (videos.length > 0) {
        // Pilih video secara random
        const randomIndex = Math.floor(Math.random() * videos.length);
        const videoUrl = videos[randomIndex];

        // Ubah URL ke format embed dengan autoplay
        let videoId = '';
        try {
            // Tangani format youtube.com dan youtu.be
            if (videoUrl.includes('v=')) {
                videoId = videoUrl.split('v=')[1]?.split('&')[0];
            } else if (videoUrl.includes('youtu.be')) {
                videoId = videoUrl.split('/').pop();
            }
        } catch (error) {
            // Silent error handling
        }

        if (videoId) {
            iframe.style.display = 'block';
            noVideoMessage.style.display = 'none';

            // Inisialisasi YouTube Player
            window.onYouTubeIframeAPIReady = function () {
                try {
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
                            },
                            onError: function (event) {
                                iframe.style.display = 'none';
                                noVideoMessage.style.display = 'block';
                                noVideoMessage.textContent = 'Error loading video. Please check the URL.';
                            },
                        },
                    });
                } catch (error) {
                    // Silent error handling
                }
            };

            // Fallback jika YouTube API tidak dimuat dalam 5 detik
            setTimeout(() => {
                if (!window.YT) {
                    iframe.style.display = 'none';
                    noVideoMessage.style.display = 'block';
                    noVideoMessage.textContent = 'Error loading YouTube API. Please try again later.';
                }
            }, 5000);
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