// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDDB8wgUqtfZUHx0qc6xT97L7oBp-k9nns",
    authDomain: "viral-cok.firebaseapp.com",
    projectId: "viral-cok",
    storageBucket: "viral-cok.firebasestorage.app",
    messagingSenderId: "465866226747",
    appId: "1:465866226747:web:cbe62190014be0f1bcf01e"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Load YouTube Iframe API
const tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

let player;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Script.js loaded');

    const iframe = document.getElementById('youtubeVideo');
    const noVideoMessage = document.getElementById('no-video-message');
    const downloadButton = document.getElementById('downloadButton');

    if (!iframe) console.error('Iframe not found');
    if (!noVideoMessage) console.error('No video message not found');
    if (!downloadButton) console.error('Download button not found');
    else console.log('Download button found');

    // Handle download button countdown
    function startCountdown() {
        console.log('Starting countdown at 20 seconds');
        let countdown = 20;
        downloadButton.textContent = `Download (${countdown} detik)`;
        downloadButton.disabled = true;

        const countdownInterval = setInterval(function() {
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

    // Handle download button click
    downloadButton.addEventListener('click', function() {
        if (!downloadButton.disabled) {
            db.collection("settings").doc("download").get().then(function(doc) {
                if (doc.exists && doc.data().url) {
                    window.open(doc.data().url, '_blank');
                } else {
                    alert('No download link set. Please configure it in the admin page.');
                }
            }).catch(function(error) {
                console.error("Error fetching download link: ", error);
                alert('Error fetching download link.');
            });
        }
    });

    // Fetch videos from Firestore
    db.collection("videos").get().then(function(querySnapshot) {
        let videos = [];
        querySnapshot.forEach(function(doc) {
            if (doc.data().url) {
                videos.push(doc.data().url);
            }
        });
        console.log('Videos from Firestore:', videos);

        // Handle video playback
        if (videos.length > 0) {
            const randomIndex = Math.floor(Math.random() * videos.length);
            const videoUrl = videos[randomIndex];
            console.log('Selected video URL:', videoUrl);

            let videoId = '';
            if (videoUrl.includes('v=')) {
                videoId = videoUrl.split('v=')[1]?.split('&')[0];
            } else if (videoUrl.includes('youtu.be')) {
                videoId = videoUrl.split('/').pop().split('?')[0];
            }
            console.log('Video ID:', videoId);

            if (videoId) {
                iframe.style.display = 'block';
                noVideoMessage.style.display = 'none';

                // Initialize YouTube Player
                window.onYouTubeIframeAPIReady = function() {
                    console.log('YouTube API ready');
                    player = new YT.Player('youtubeVideo', {
                        videoId: videoId,
                        playerVars: {
                            autoplay: 1,
                            mute: 1,
                            controls: 1,
                        },
                        events: {
                            onReady: function(event) {
                                console.log('Player ready');
                                event.target.setPlaybackQuality('medium');
                            },
                            onStateChange: function(event) {
                                if (event.data === YT.PlayerState.PLAYING) {
                                    console.log('Video playing');
                                    const checkTime = setInterval(function() {
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
                        },
                    });
                };
            } else {
                iframe.style.display = 'none';
                noVideoMessage.style.display = 'block';
                downloadButton.textContent = 'DOWNLOAD';
                downloadButton.disabled = true;
                console.log('No valid video ID, countdown not started');
            }
        } else {
            iframe.style.display = 'none';
            noVideoMessage.style.display = 'block';
            downloadButton.textContent = 'DOWNLOAD';
            downloadButton.disabled = true;
            console.log('No videos available, countdown not started');
        }
    }).catch(function(error) {
        console.error("Error fetching videos: ", error);
        iframe.style.display = 'none';
        noVideoMessage.style.display = 'block';
        downloadButton.textContent = 'DOWNLOAD';
        downloadButton.disabled = true;
    });
});