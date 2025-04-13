// Load YouTube Iframe API
const tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

let player;

document.addEventListener('DOMContentLoaded', () => {
    console.log('Script.js loaded'); // Debugging

    // Ambil daftar video dari localStorage
    let videos = JSON.parse(localStorage.getItem('youtubeVideos')) || [];
    console.log('Videos from localStorage:', videos); // Debugging

    // Filter video yang valid (tidak kosong)
    videos = videos.filter(url => url.trim() !== '');

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
        console.log('Starting countdown at 10 seconds'); // Debugging
        let countdown = 20;
        downloadButton.textContent = `Download (${countdown} detik)`;
        downloadButton.disabled = true;

        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                downloadButton.textContent = `Download (${countdown} detik)`;
                console.log(`Countdown: ${countdown}`); // Debugging
            } else if (countdown === 0) {
                downloadButton.textContent = 'DOWNLOAD';
                downloadButton.disabled = false;
                console.log('Countdown finished, button enabled'); // Debugging
                clearInterval(countdownInterval);
            }
        }, 1000);
    }

    downloadButton.addEventListener('click', () => {
        if (!downloadButton.disabled) {
            const downloadLink = localStorage.getItem('downloadLink') || '';
            console.log('Button clicked, downloadLink:', downloadLink); // Debugging
            if (downloadLink) {
                window.open(downloadLink, '_blank');
            } else {
                alert('No download link set. Please configure it in the admin page.');
            }
        }
    });

    // Handle video playback
    if (videos.length > 0) {
        // Pilih video secara random
        const randomIndex = Math.floor(Math.random() * videos.length);
        const videoUrl = videos[randomIndex];
        console.log('Selected video URL:', videoUrl); // Debugging

        // Ubah URL ke format embed dengan autoplay
        let videoId = '';
        if (videoUrl.includes('v=')) {
            videoId = videoUrl.split('v=')[1]?.split('&')[0];
        } else if (videoUrl.includes('youtu.be')) {
            videoId = videoUrl.split('/').pop().split('?')[0];
        }
        console.log('Video ID:', videoId); // Debugging

        if (videoId) {
            iframe.style.display = 'block';
            noVideoMessage.style.display = 'none';

            // Inisialisasi YouTube Player
            window.onYouTubeIframeAPIReady = function () {
                console.log('YouTube API ready'); // Debugging
                player = new YT.Player('youtubeVideo', {
                    videoId: videoId,
                    playerVars: {
                        autoplay: 1,
                        mute: 1,
                        controls: 1,
                    },
                    events: {
                        onReady: function (event) {
                            console.log('Player ready'); // Debugging
                            event.target.setPlaybackQuality('medium'); // Coba set ke 360p
                        },
                        onStateChange: function (event) {
                            if (event.data === YT.PlayerState.PLAYING) {
                                console.log('Video playing'); // Debugging
                                // Periksa waktu video setiap detik
                                const checkTime = setInterval(() => {
                                    if (player && player.getCurrentTime) {
                                        const currentTime = player.getCurrentTime();
                                        console.log('Current time:', currentTime); // Debugging
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
            console.log('No valid video ID, countdown not started'); // Debugging
        }
    } else {
        iframe.style.display = 'none';
        noVideoMessage.style.display = 'block';
        downloadButton.textContent = 'DOWNLOAD';
        downloadButton.disabled = true;
        console.log('No videos available, countdown not started'); // Debugging
    }
});