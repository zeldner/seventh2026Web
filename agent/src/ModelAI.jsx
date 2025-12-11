// Ilya Zeldner
import { useState } from "react";
const API_KEY = import.meta.env.VITE_API_KEY;
function App() {
  const [logs, setLogs] = useState([]);
  // Tool to find available models
  const checkAvailableModels = async () => {
    addToLog("Checking available models...");
    try {
      // https://generativelanguage.googleapis.com/v1beta/models API endpoint : GET /models
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
      ); // Fetch models
      // Check for errors
      const data = await response.json();
      if (data.error) {
        addToLog("❌ API Error: " + data.error.message);
      } else {
        addToLog("✅ SUCCESS! Found these models:");
        // Filter for "generateContent" models only
        const models = data.models
          .filter((m) =>
            m.supportedGenerationMethods.includes("generateContent")
          )
          .map((m) => m.name.replace("models/", "")); // Keep only content generation models ,  Clean up names for display
        setLogs((prev) => [...prev, ...models]); // Add models to logs
      }
    } catch (e) {
      addToLog("❌ Network Error: " + e.message); // Handle network errors
    }
  };
  const addToLog = (msg) => setLogs((prev) => [...prev, msg]); // Helper to add messages to log
  return (
    <div className="min-h-screen bg-black text-green-400 p-10 font-mono">
      <h1 className="text-2xl mb-5">🕵️ Model Diagnostics</h1>
      <div className="flex gap-4 mb-5">
        <button
          onClick={checkAvailableModels}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
        >
          1. List My Models
        </button>
      </div>
      <div className="bg-gray-900 border border-gray-700 p-5 rounded h-96 overflow-auto whitespace-pre-wrap">
        {logs.length === 0
          ? "Click 'List My Models' to start..."
          : logs.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
}

export default App;
