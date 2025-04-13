// Load YouTube Iframe API
const tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

let player;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Script.js loaded');

    // Import Firestore functions
    const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js");
    const db = window.firestoreDb;
    if (!db) {
        console.error('Firestore DB not initialized');
        return;
    }

    // Ambil daftar video dari Firestore
    let videos = [];
    try {
        const videoDocRef = doc(db, "videos", "list");
        console.log('Fetching videos from Firestore...');
        const videoDoc = await getDoc(videoDocRef);
        if (videoDoc.exists()) {
            videos = videoDoc.data().urls || [];
            console.log('Videos from Firestore:', videos);
        } else {
            console.log('No videos document found in Firestore');
        }
    } catch (error) {
        console.error('Error fetching videos:', error);
    }

    // Filter video yang valid (tidak kosong)
    videos = videos.filter(url => url.trim() !== '');
    console.log('Filtered videos:', videos);

    const iframe = document.getElementById('youtubeVideo');
    const noVideoMessage = document.getElementById('no-video-message');
    const downloadButton = document.getElementById('downloadButton');

    // Debugging: Pastikan elemen ditemukan
    if (!iframe) console.error('Iframe not found');
    if (!noVideoMessage) console.error('No video message not found');
    if (!downloadButton) console.error('Download button not found');
    else console.log('Download button found');

    // Handle download button
    function startCountdown() {
        console.log('Starting countdown at 20 seconds');
        let countdown = 20;
        downloadButton.textContent = `Download (${countdown} detik)`;
        downloadButton.disabled = true;

        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                downloadButton.textContent = `Download (${countdown} detik)`;
                console.log(`Countdown: ${countdown}`);
            } else if (countdown === 0) {
                downloadButton.textContent = 'DOWNLOAD';
                downloadButton.disabled = false;
                console.log('Countdown finished, button enabled');
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
                console.log('Button clicked, downloadLink:', downloadLink);
                if (downloadLink) {
                    window.open(downloadLink, '_blank');
                } else {
                    alert('No download link set. Please configure it in the admin page.');
                }
            } catch (error) {
                console.error('Error fetching download link:', error);
                alert('Error fetching download link.');
            }
        }
    });

    // Handle video playback
    if (videos.length > 0) {
        // Pilih video secara random
        const randomIndex = Math.floor(Math.random() * videos.length);
        const videoUrl = videos[randomIndex];
        console.log('Selected video URL:', videoUrl);

        // Ubah URL ke format embed dengan autoplay
        let videoId = '';
        try {
            // Tangani format youtube.com dan youtu.be
            if (videoUrl.includes('v=')) {
                const urlParams = new URLSearchParams(videoUrl.split('?')[1]);
                videoId = urlParams.get('v');
            } else if (videoUrl.includes('youtu.be')) {
                // Ambil bagian setelah youtu.be/ dan sebelum parameter (jika ada)
                const path = videoUrl.split('youtu.be/')[1];
                videoId = path.split('?')[0].split('/')[0];
            }
            console.log('Extracted video ID:', videoId);
        } catch (error) {
            console.error('Error extracting video ID:', error);
        }

        if (videoId) {
            iframe.style.display = 'block';
            noVideoMessage.style.display = 'none';

            // Inisialisasi YouTube Player
            window.onYouTubeIframeAPIReady = function () {
                console.log('YouTube API ready');
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
                                console.log('Player ready');
                                event.target.setPlaybackQuality('medium');
                            },
                            onStateChange: function (event) {
                                if (event.data === YT.PlayerState.PLAYING) {
                                    console.log('Video playing');
                                    const checkTime = setInterval(() => {
                                        if (player && player.getCurrentTime) {
                                            const currentTime = player.getCurrentTime();
                                            console.log('Current time:', currentTime);
                                            if (currentTime >= 10) {
                                                startCountdown();
                                                clearInterval(checkTime);
                                            }
                                        }
                                    }, 1000);
                                }
                            },
                            onError: function (event) {
                                console.error('YouTube Player error:', event.data);
                                iframe.style.display = 'none';
                                noVideoMessage.style.display = 'block';
                                noVideoMessage.textContent = 'Error loading video. Please check the URL.';
                            },
                        },
                    });
                } catch (error) {
                    console.error('Error initializing YouTube player:', error);
                }
            };

            // Fallback jika YouTube API tidak dimuat dalam 5 detik
            setTimeout(() => {
                if (!window.YT) {
                    console.error('YouTube Iframe API not loaded');
                    iframe.style.display = 'none';
                    noVideoMessage.style.display = 'block';
                    noVideoMessage.textContent = 'Error loading YouTube API. Please try again later.';
                }
            }, 5000);
        } else {
            console.log('Invalid video ID, showing no video message');
            iframe.style.display = 'none';
            noVideoMessage.style.display = 'block';
            downloadButton.textContent = 'DOWNLOAD';
            downloadButton.disabled = true;
        }
    } else {
        console.log('No valid videos available, showing no video message');
        iframe.style.display = 'none';
        noVideoMessage.style.display = 'block';
        downloadButton.textContent = 'DOWNLOAD';
        downloadButton.disabled = true;
    }
});