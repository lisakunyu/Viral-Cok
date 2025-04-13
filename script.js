// Load YouTube Iframe API
const tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

let player = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Reset UI awal
    const iframe = document.getElementById('youtubeVideo');
    const noVideoMessage = document.getElementById('no-video-message');
    const downloadButton = document.getElementById('downloadButton');

    if (!iframe || !noVideoMessage || !downloadButton) {
        alert('Elemen halaman tidak ditemukan. Muat ulang halaman.');
        return;
    }

    iframe.style.display = 'none';
    noVideoMessage.style.display = 'none';
    downloadButton.textContent = 'Download';
    downloadButton.disabled = true;

    // Import Firestore functions
    let doc, getDoc;
    try {
        const module = await import("https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js");
        doc = module.doc;
        getDoc = module.getDoc;
    } catch (error) {
        noVideoMessage.style.display = 'block';
        noVideoMessage.textContent = 'Gagal memuat Firestore. Periksa koneksi internet.';
        return;
    }

    const db = window.firestoreDb;
    if (!db) {
        noVideoMessage.style.display = 'block';
        noVideoMessage.textContent = 'Database tidak tersedia. Muat ulang halaman.';
        return;
    }

    // Ambil daftar video dari Firestore
    let videos = [];
    try {
        const videoDocRef = doc(db, "videos", "list");
        const videoDoc = await getDoc(videoDocRef);
        if (videoDoc.exists()) {
            videos = videoDoc.data().urls || [];
        } else {
            noVideoMessage.style.display = 'block';
            noVideoMessage.textContent = 'Tidak ada data video di database.';
            return;
        }
    } catch (error) {
        noVideoMessage.style.display = 'block';
        noVideoMessage.textContent = 'Gagal mengambil video dari database.';
        return;
    }

    // Filter video yang valid (tidak kosong)
    videos = videos.filter(url => url.trim() !== '');

    // Handle download button
    function startCountdown() {
        let countdown = 20;
        downloadButton.textContent = `Download (${countdown} detik)`;
        downloadButton.disabled = true;

        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                downloadButton.textContent = `Download (${countdown} detik)`;
            } else {
                downloadButton.textContent = 'Download';
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
                videoId = videoUrl.split('youtu.be/')[1].split('/')[0].split('?')[0];
            }
            // Validasi videoId
            if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
                videoId = '';
            }
        } catch (error) {
            iframe.style.display = 'none';
            noVideoMessage.style.display = 'block';
            noVideoMessage.textContent = 'Gagal memproses URL video.';
            downloadButton.disabled = true;
            return;
        }

        if (videoId) {
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
                            onReady: function () {
                                iframe.style.display = 'block';
                                noVideoMessage.style.display = 'none';
                            },
                            onStateChange: function (event) {
                                if (event.data === YT.PlayerState.PLAYING && player) {
                                    const checkTime = setInterval(() => {
                                        try {
                                            const currentTime = player.getCurrentTime();
                                            if (currentTime >= 10) {
                                                startCountdown();
                                                clearInterval(checkTime);
                                            }
                                        } catch (error) {
                                            clearInterval(checkTime);
                                        }
                                    }, 1000);
                                }
                            },
                            onError: function () {
                                iframe.style.display = 'none';
                                noVideoMessage.style.display = 'block';
                                noVideoMessage.textContent = 'Gagal memuat video. Periksa URL.';
                                downloadButton.disabled = true;
                            },
                        },
                    });
                } catch (error) {
                    iframe.style.display = 'none';
                    noVideoMessage.style.display = 'block';
                    noVideoMessage.textContent = 'Gagal memulai pemutar video.';
                    downloadButton.disabled = true;
                }
            };

            // Panggil API secara manual jika sudah dimuat
            try {
                if (window.YT && window.YT.Player) {
                    window.onYouTubeIframeAPIReady();
                }
            } catch (error) {
                // Silent catch
            }

            // Fallback jika YouTube API tidak dimuat
            setTimeout(() => {
                if (!player) {
                    iframe.style.display = 'none';
                    noVideoMessage.style.display = 'block';
                    noVideoMessage.textContent = 'Gagal memuat pemutar YouTube.';
                    downloadButton.disabled = true;
                }
            }, 5000);
        } else {
            iframe.style.display = 'none';
            noVideoMessage.style.display = 'block';
            noVideoMessage.textContent = 'URL video tidak valid.';
            downloadButton.disabled = true;
        }
    } else {
        iframe.style.display = 'none';
        noVideoMessage.style.display = 'block';
        noVideoMessage.textContent = 'Tidak ada video yang tersedia.';
        downloadButton.disabled = true;
    }
});