try {
    const { MemoryVectorStore } = require("langchain/vectorstores/memory");
    console.log("SUCCESS: Found MemoryVectorStore in langchain/vectorstores/memory");
    console.log("Type:", typeof MemoryVectorStore);
    console.log("fromDocuments:", typeof MemoryVectorStore.fromDocuments);
} catch (e) {
    console.log("FAILED langchain/vectorstores/memory:", e.message);
}

try {
    const { MemoryVectorStore } = require("@langchain/community/vectorstores/memory");
    console.log("SUCCESS: Found MemoryVectorStore in @langchain/community/vectorstores/memory");
} catch (e) {
    console.log("FAILED @langchain/community/vectorstores/memory:", e.message);
}
