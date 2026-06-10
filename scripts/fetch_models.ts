import axios from 'axios';
import "dotenv/config";

async function fetchModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_API_KEY}`;
  try {
    const res = await axios.get(url);
    const models = res.data.models.map((m: any) => m.name.replace('models/', ''));
    console.log("AVAILABLE MODELS:", JSON.stringify(models, null, 2));
  } catch (e: any) {
    console.log(`❌ ERROR: ${e.response?.data?.error?.message || e.message}`);
  }
}

fetchModels();
