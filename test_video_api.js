const fetch = require('node-fetch'); // wait, node 22 fetch is built-in
async function run() {
  const res = await fetch('http://localhost:3000/api/generate/video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageUrl: 'https://raw.githubusercontent.com/vitejs/vite/main/docs/images/vite.svg',
      animation: 'Zoom In',
      duration: 3,
      resolution: '720p',
      fps: 24
    })
  });
  console.log(res.status, await res.text());
}
run();
