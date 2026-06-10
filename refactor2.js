const fs = require('fs');
const path = require('path');

const auditorsDir = path.join(__dirname, 'src', 'auditors');
const files = fs.readdirSync(auditorsDir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
    const filePath = path.join(auditorsDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');

    // Fix premiumLLM imports
    content = content.replace(
        /import \{ (.*?)premiumLLM(.*?) \} from "\.\.\/ai\/provider";/g,
        'import { getReviewLLM, getPremiumLLM } from "../ai/provider";'
    );
    
    // Also if it just says import { premiumLLM } from "../ai/provider";
    content = content.replace(
        /import \{ premiumLLM \} from "\.\.\/ai\/provider";/g,
        'import { getPremiumLLM } from "../ai/provider";'
    );
    
    // Also if it was imported as { getReviewLLM } and they forgot premium
    if (content.includes('getPremiumLLM(') && !content.includes('getPremiumLLM }')) {
        content = content.replace(
            /import \{ getReviewLLM \} from "\.\.\/ai\/provider";/g,
            'import { getReviewLLM, getPremiumLLM } from "../ai/provider";'
        );
    }

    fs.writeFileSync(filePath, content, 'utf-8');
});

// Delete llm.ts
try {
    fs.unlinkSync(path.join(__dirname, 'src', 'ai', 'llm.ts'));
} catch (e) {}
