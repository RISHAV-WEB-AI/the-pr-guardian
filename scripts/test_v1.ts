import axios from 'axios';
import "dotenv/config";

async function testV1() {
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`;
  try {
    const res = await axios.post(url, {
      contents: [{ parts: [{ text: "hi" }] }]
    });
    console.log("✅ v1 gemini-1.5-flash works!");
  } catch (e: any) {
    console.log(`❌ v1 gemini-1.5-flash: ${e.response?.data?.error?.message || e.message}`);
  }
}

testV1();
