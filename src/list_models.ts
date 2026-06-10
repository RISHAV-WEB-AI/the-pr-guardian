import "dotenv/config";

async function listModels() {
    console.log("Checking API Key: ", process.env.GOOGLE_API_KEY ? "EXISTS" : "MISSING");
    
    const url = "https://generativelanguage.googleapis.com/v1beta/models?key=" + process.env.GOOGLE_API_KEY;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (response.ok) {
            console.log("Models Available:");
            data.models.forEach((model: any) => {
                console.log("- " + model.name + " (Methods: " + (model.supportedGenerationMethods ? model.supportedGenerationMethods.join(", ") : "None") + ")");
            });
        } else {
            console.error("Error from Google API:", data);
        }
    } catch (e: any) {
        console.error("Failed to fetch:", e.message);
    }
}

listModels();
