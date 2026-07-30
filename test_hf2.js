async function run() {
  const HF_TOKEN = process.env.HF_TOKEN;
  if (!HF_TOKEN) return console.error('No HF_TOKEN');
  try {
    const res = await fetch('https://api-inference.huggingface.co/models/stabilityai/stable-video-diffusion-img2vid-xt', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: 'https://raw.githubusercontent.com/vitejs/vite/main/docs/images/vite.svg',
      })
    });
    console.log("Status:", res.status);
    if (!res.ok) {
        console.log(await res.text());
    } else {
        console.log("ContentType:", res.headers.get("content-type"));
        const buffer = await res.arrayBuffer();
        console.log("Buffer size:", buffer.byteLength);
    }
  } catch(e) {
    console.error(e);
  }
}
run();
