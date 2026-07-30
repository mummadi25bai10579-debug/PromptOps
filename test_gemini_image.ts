import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: 'A beautiful sunset',
    });
    console.log("Success! Parts:", response.candidates?.[0]?.content?.parts?.length);
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}
run();
