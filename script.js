document.addEventListener('DOMContentLoaded', () => {
    // Ambil daftar video dari localStorage
    let videos = JSON.parse(localStorage.getItem('youtubeVideos')) || [];

    // Filter video yang valid (tidak kosong)
    videos = videos.filter(url => url.trim() !== '');

    const iframe = document.getElementById('youtubeVideo');
    const noVideoMessage = document.getElementById('no-video-message');
    const downloadButton = document.getElementById('downloadButton');

    // Handle video playback
    if (videos.length > 0) {
        // Pilih video secara random
        const randomIndex = Math.floor(Math.random() * videos.length);
        const videoUrl = videos[randomIndex];

        // Ubah URL ke format embed dengan autoplay
        let videoId = '';
        if (videoUrl.includes('v=')) {
            videoId = videoUrl.split('v=')[1]?.split('&')[0];
        } else if (videoUrl.includes('youtu.be')) {
            videoId = videoUrl.split('/').pop().split('?')[0];
        }

        if (videoId) {
            const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
            iframe.src = embedUrl;
            iframe.style.display = 'block';
            noVideoMessage.style.display = 'none';

            // Start countdown only when video is playing
            iframe.addEventListener('load', () => {
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
            });
        } else {
            iframe.style.display = 'none';
            noVideoMessage.style.display = 'block';
            downloadButton.textContent = 'DOWNLOAD';
            downloadButton.disabled = true; // Nonaktifkan tombol jika video tidak valid
        }
    } else {
        iframe.style.display = 'none';
        noVideoMessage.style.display = 'block';
        downloadButton.textContent = 'DOWNLOAD';
        downloadButton.disabled = true; // Nonaktifkan tombol jika tidak ada video
    }

    downloadButton.addEventListener('click', () => {
        if (!downloadButton.disabled) {
            const downloadLink = localStorage.getItem('downloadLink') || '';
            if (downloadLink) {
                window.open(downloadLink, '_blank');
            } else {
                alert('No download link set. Please configure it in the admin page.');
            }
        }
    });
});