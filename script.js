document.addEventListener('DOMContentLoaded', () => {
    console.log('Script.js loaded'); // Debugging: Pastikan script dimuat

    // Ambil daftar video dari localStorage
    let videos = JSON.parse(localStorage.getItem('youtubeVideos')) || [];
    console.log('Videos from localStorage:', videos); // Debugging: Cek daftar video

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

    // Handle video playback
    if (videos.length > 0) {
        // Pilih video secara random
        const randomIndex = Math.floor(Math.random() * videos.length);
        const videoUrl = videos[randomIndex];
        console.log('Selected video URL:', videoUrl); // Debugging: Cek URL video

        // Ubah URL ke format embed dengan autoplay
        let videoId = '';
        if (videoUrl.includes('v=')) {
            videoId = videoUrl.split('v=')[1]?.split('&')[0];
        } else if (videoUrl.includes('youtu.be')) {
            videoId = videoUrl.split('/').pop().split('?')[0];
        }
        console.log('Video ID:', videoId); // Debugging: Cek ID video

        if (videoId) {
            const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
            iframe.src = embedUrl;
            iframe.style.display = 'block';
            noVideoMessage.style.display = 'none';
            console.log('Iframe src set to:', embedUrl); // Debugging: Cek URL embed

            // Start countdown when video is likely playing
            // Use timeout as fallback since iframe load may not reliably indicate playback
            setTimeout(() => {
                console.log('Starting countdown'); // Debugging
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
            }, 2000); // Delay 2 detik untuk memastikan video mulai
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
});