// Load YouTube Iframe API
const tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

let player;

document.addEventListener('DOMContentLoaded', async () => {
    // Import Firestore functions
    let doc, getDoc;
    try {
        const module = await import("https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js");
        doc = module.doc;
        getDoc = module.getDoc;
    } catch (error) {
        alert('Gagal memuat Firestore. Periksa koneksi internet.');
        return;
    }

    const db = window.firestoreDb;
    if (!db) {
        alert('Database tidak tersedia. Silakan muat ulang halaman.');
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
        alert('Gagal mengambil video dari database. Coba lagi nanti.');
        return;
    }

    // Filter video yang valid (tidak kosong)
    videos = videos.filter(url => url.trim() !== '');

    const iframe = document.getElementById('youtubeVideo');
    const noVideoMessage = document.getElementById('no-video-message');
    const downloadButton = document.getElementById('downloadButton');

    if (!iframe || !noVideoMessage || !downloadButton) {
        alert('Elemen halaman tidak ditemukan. Muat ulang halaman.');
        return;
    }

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
                    alert('Link download belum disetel. Atur di halaman admin.');
                }
            } catch (error) {
                alert('Gagal memuat link download.');
            }
        }
    });

    // Handle video playback
    if (videos.length > 0) {
        // Pilih video secara random
        const randomIndex = Math.floor(Math.random() * videos.length);
        const videoUrl = videos[randomIndex];

        // Ekstrak videoId
        let videoId = '';
        try {
            if (videoUrl.includes('youtube.com/watch')) {
                const params = new URLSearchParams(videoUrl.split('?')[1]);
                videoId = params.get('v') || '';
            } else if (videoUrl.includes('youtu.be')) {
                videoId = videoUrl.split('youtu.be/')[1].split('/')[0];
            }
            // Validasi videoId
            if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
                videoId = '';
            }
        } catch (error) {
            alert('Gagal memproses URL video.');
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
                                // Tidak ada pengaturan kualitas, biarkan jaringan menentukan
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
                            onError: function () {
                                iframe.style.display = 'none';
                                noVideoMessage.style.display = 'block';
                                noVideoMessage.textContent = 'Gagal memuat video. Periksa URL.';
                            },
                        },
                    });
                } catch (error) {
                    alert('Gagal memulai pemutar video.');
                }
            };

            // Fallback jika YouTube API tidak dimuat
            setTimeout(() => {
                if (!window.YT) {
                    iframe.style.display = 'none';
                    noVideoMessage.style.display = 'block';
                    noVideoMessage.textContent = 'Gagal memuat YouTube. Coba lagi nanti.';
                }
            }, 5000);
        } else {
            iframe.style.display = 'none';
            noVideoMessage.style.display = 'block';
            downloadButton.textContent = 'DOWNLOAD';
            downloadButton.disabled = true;
            noVideoMessage.textContent = 'URL video tidak valid.';
        }
    } else {
        iframe.style.display = 'none';
        noVideoMessage.style.display = 'block';
        downloadButton.textContent = 'DOWNLOAD';
        downloadButton.disabled = true;
        noVideoMessage.textContent = 'Tidak ada video yang tersedia.';
    }
});