document.addEventListener('DOMContentLoaded', () => {
  // Ambil daftar video dari localStorage
  let videos = JSON.parse(localStorage.getItem('youtubeVideos')) || [];
  
  // Filter video yang valid (tidak kosong)
  videos = videos.filter(url => url.trim() !== '');
  
  const iframe = document.getElementById('youtubeVideo');
  const noVideoMessage = document.getElementById('no-video-message');
  
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
});