const fs = require('fs');
const path = require('path');

const auditorsDir = path.join(__dirname, 'src', 'auditors');
const files = fs.readdirSync(auditorsDir).filter(f => f.endsWith('.ts') && f !== 'manager.ts');

files.forEach(file => {
    const filePath = path.join(auditorsDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');

    // Replace imports
    content = content.replace(
        /import \{ (.*?) \} from "\.\.\/ai\/llm";/g,
        'import { getReviewLLM, getPremiumLLM } from "../ai/provider";'
    );
    
    // Sometimes it's imported from provider directly in older files?
    content = content.replace(
        /import \{ (.*?)reviewLLM(.*?) \} from "\.\.\/ai\/provider";/g,
        'import { getReviewLLM, getPremiumLLM } from "../ai/provider";'
    );

    // Replace usages
    content = content.replace(/invokeWithRetry\(reviewLLM,/g, 'invokeWithRetry(getReviewLLM(state.geminiApiKey),');
    content = content.replace(/invokeWithRetry\(premiumLLM,/g, 'invokeWithRetry(getPremiumLLM(state.geminiApiKey),');
    content = content.replace(/reviewLLM\.invoke\(/g, 'getReviewLLM(state.geminiApiKey).invoke(');
    content = content.replace(/premiumLLM\.invoke\(/g, 'getPremiumLLM(state.geminiApiKey).invoke(');

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${file}`);
});
