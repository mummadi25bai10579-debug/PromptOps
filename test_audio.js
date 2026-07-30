const prompt = "Hello, world!";
const hfToken = process.env.HF_TOKEN;
async function test() {
  try {
    let response = await fetch('https://api-inference.huggingface.co/models/myshell-ai/MeloTTS-English', {
      headers: { Authorization: `Bearer ${hfToken}` },
      method: 'POST',
      body: JSON.stringify({ inputs: prompt })
    });
    console.log("MeloTTS:", response.status, response.statusText, await response.text());
  } catch(e) { console.error(e); }

  try {
    let response = await fetch('https://api-inference.huggingface.co/models/facebook/mms-tts-eng', {
      headers: { Authorization: `Bearer ${hfToken}` },
      method: 'POST',
      body: JSON.stringify({ inputs: prompt })
    });
    console.log("mms-tts:", response.status, response.statusText, await response.text());
  } catch(e) { console.error(e); }
}
test();
