async function run() {
  const HF_TOKEN = process.env.HF_TOKEN;
  if (!HF_TOKEN) return console.error('No HF_TOKEN');
  try {
    const res = await fetch('https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: 'A beautiful sunset',
      })
    });
    console.log("Status:", res.status);
    if (!res.ok) {
        console.log(await res.text());
    } else {
        const buffer = await res.arrayBuffer();
        console.log("Buffer size:", buffer.byteLength);
    }
  } catch(e) {
    console.error(e);
  }
}
run();
