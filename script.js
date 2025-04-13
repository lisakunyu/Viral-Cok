document.addEventListener('DOMContentLoaded', () => {
    console.log('Script loaded'); // Debugging: Pastikan script berjalan

    // Ambil daftar video dari localStorage
    let videos = JSON.parse(localStorage.getItem('youtubeVideos')) || [];

    // Filter video yang valid (tidak kosong)
    videos = videos.filter(url => url.trim() !== '');

    const iframe = document.getElementById('youtubeVideo');
    const noVideoMessage = document.getElementById('no-video-message');
    const downloadButton = document.getElementById('downloadButton');

    // Debugging: Pastikan elemen ditemukan
    if (!downloadButton) {
        console.error('Download button not found. Check ID in index.html');
    } else {
        console.log('Download button found');
    }

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
        } else {
            iframe.style.display = 'none';
            noVideoMessage.style.display = 'block';
        }
    } else {
        iframe.style.display = 'none';
        noVideoMessage.style.display = 'block';
    }

    // Handle download button
    if (downloadButton) {
        let countdown = 17;
        downloadButton.textContent = `Download (${countdown})`;
        downloadButton.disabled = true; // Nonaktifkan tombol saat hitungan mundur
        console.log('Starting countdown'); // Debugging

        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                downloadButton.textContent = `Download (${countdown})`;
                console.log(`Countdown: ${countdown}`); // Debugging
            } else if (countdown === 0) {
                downloadButton.textContent = 'DOWNLOAD';
                downloadButton.disabled = false; // Aktifkan tombol
                console.log('Countdown finished, button enabled'); // Debugging
                clearInterval(countdownInterval);
            }
        }, 1000);

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
    }
});