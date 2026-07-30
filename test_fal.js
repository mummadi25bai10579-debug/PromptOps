async function run() {
  const FAL_KEY = process.env.FAL_KEY;
  if (!FAL_KEY) return console.error('No FAL_KEY');
  const res = await fetch('https://fal.run/fal-ai/flux/schnell', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: 'A beautiful sunset',
      image_size: 'square_hd'
    })
  });
  console.log(await res.text());
}
run();
