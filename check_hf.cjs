require('dotenv').config();
async function run() {
  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) {
    console.log("No token in .env"); return;
  }
  const hfRes = await fetch("https://api-inference.huggingface.co/models/stabilityai/stable-video-diffusion-img2vid-xt", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${hfToken}`,
      "Content-Type": "image/jpeg"
    },
    body: "fake image data"
  });
  console.log("Status:", hfRes.status);
  console.log("Response:", await hfRes.text());
}
run();
