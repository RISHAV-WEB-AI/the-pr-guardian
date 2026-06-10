const vs = require("@langchain/core/vectorstores");
console.log("KEYS:", Object.keys(vs));
console.log("MemoryVectorStore:", vs.MemoryVectorStore ? "FOUND" : "MISSING");
