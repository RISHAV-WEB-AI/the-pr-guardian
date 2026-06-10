try {
  const { MemoryVectorStore } = require("langchain/vectorstores/memory");
  console.log("SUCCESS: langchain/vectorstores/memory");
} catch (e) {
  console.log("FAIL: langchain/vectorstores/memory");
  try {
    const { MemoryVectorStore } = require("@langchain/core/vectorstores");
    console.log("SUCCESS: @langchain/core/vectorstores");
  } catch (e2) {
    console.log("FAIL: @langchain/core/vectorstores");
    try {
      const { MemoryVectorStore } = require("langchain/dist/vectorstores/memory");
      console.log("SUCCESS: langchain/dist/vectorstores/memory");
    } catch (e3) {
      console.log("FAIL: langchain/dist/vectorstores/memory");
    }
  }
}
