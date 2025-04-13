// Load YouTube Iframe API
const tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

document.addEventListener('DOMContentLoaded', () => {
    const iframe = document.getElementById('youtubeVideo');
    const noVideoMessage = document.getElementById('no-video-message');

    if (!iframe || !noVideoMessage) {
        alert('Elemen halaman tidak ditemukan. Muat ulang halaman.');
        return;
    }

    iframe.style.display = 'none';
    noVideoMessage.style.display = 'block';
    noVideoMessage.textContent = 'Memuat video...';

    const db = window.firestoreDb;
    if (!db) {
        noVideoMessage.textContent = 'Database tidak tersedia.';
        return;
    }

    // Ambil video dari Firestore
    try {
        db.collection('videos').doc('list').get().then(videoDoc => {
            if (videoDoc.exists) {
                const videos = videoDoc.data().urls || [];
                const validVideos = videos.filter(url => url.trim() !== '');
                if (validVideos.length > 0) {
                    const videoUrl = validVideos[0]; // Ambil video pertama
                    let videoId = '';
                    try {
                        if (videoUrl.includes('youtube.com/watch')) {
                            const params = new URLSearchParams(videoUrl.split('?')[1]);
                            videoId = params.get('v') || '';
                        } else if (videoUrl.includes('youtu.be')) {
                            videoId = videoUrl.split('youtu.be/')[1].split('/')[0].split('?')[0];
                        }
                        if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
                            throw new Error('Invalid videoId');
                        }
                    } catch (error) {
                        iframe.style.display = 'none';
                        noVideoMessage.style.display = 'block';
                        noVideoMessage.textContent = 'URL video tidak valid.';
                        return;
                    }

                    window.onYouTubeIframeAPIReady = function () {
                        try {
                            new YT.Player('youtubeVideo', {
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
                                    onError: function () {
                                        iframe.style.display = 'none';
                                        noVideoMessage.style.display = 'block';
                                        noVideoMessage.textContent = 'Gagal memuat video.';
                                    },
                                },
                            });
                        } catch (error) {
                            iframe.style.display = 'none';
                            noVideoMessage.style.display = 'block';
                            noVideoMessage.textContent = 'Gagal memulai pemutar video.';
                        }
                    };

                    if (window.YT && window.YT.Player) {
                        window.onYouTubeIframeAPIReady();
                    }

                    setTimeout(() => {
                        if (!document.querySelector('#youtubeVideo iframe')) {
                            iframe.style.display = 'none';
                            noVideoMessage.style.display = 'block';
                            noVideoMessage.textContent = 'Gagal memuat pemutar YouTube.';
                        }
                    }, 5000);
                } else {
                    iframe.style.display = 'none';
                    noVideoMessage.style.display = 'block';
                    noVideoMessage.textContent = 'Tidak ada video yang tersedia.';
                }
            } else {
                iframe.style.display = 'none';
                noVideoMessage.style.display = 'block';
                noVideoMessage.textContent = 'Tidak ada data video di database.';
            }
        }).catch(error => {
            iframe.style.display = 'none';
            noVideoMessage.style.display = 'block';
            noVideoMessage.textContent = 'Gagal mengambil video dari database.';
        });
    } catch (error) {
        iframe.style.display = 'none';
        noVideoMessage.style.display = 'block';
        noVideoMessage.textContent = 'Gagal mengakses database.';
    }
});