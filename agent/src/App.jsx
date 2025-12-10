// Ilya Zeldner
import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from "react-markdown"; // For rendering markdown

// Initialize Google Generative AI
// Make sure to set VITE_API_KEY in your .env file

const API_KEY = import.meta.env.VITE_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY); // Create the Generative AI client
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

function App() {
  const [task, setTask] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // Track if robot is talking

  // THE SPEAKING FUNCTION (Text -> Sound)

  const speakText = (textToSpeak) => {
    if (!textToSpeak) return;

    // Stop any current speech
    window.speechSynthesis.cancel();

    // Clean up symbols (*, #) so it sounds natural
    const cleanText = textToSpeak.replace(/[*#`_]/g, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "en-US";
    utterance.rate = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // THE AI FUNCTION
  const handleRun = async () => {
    if (!task.trim()) return;

    setIsLoading(true);
    // Don't clear response ,  so the screen doesn't jump

    try {
      const result = await model.generateContent(task);
      const text = result.response.text();
      setResponse(text);

      // AUTO-SPEAK: Robot speaks immediately after thinking
      speakText(text);
    } catch (error) {
      setResponse(`**Error:** ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // THE LISTENING FUNCTION (Sound -> Text)
  const startListening = () => {
    // If robot is talking, we shut it up ,  so it can listen
    if (isSpeaking) stopSpeaking();

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser doesn't support speech.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setTask((prev) => prev + " " + transcript);
    };

    recognition.start();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-10 gap-8 font-sans">
      <h1 className="text-5xl font-extrabold bg-linear-to-r from-blue-400 via-cyan-400 to-teal-300 bg-clip-text text-transparent tracking-tight">
        Agent v4.0
      </h1>

      <div className="w-full max-w-3xl flex flex-col gap-5">
        {/* TEXT INPUT */}
        <textarea
          className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-5 focus:ring-2 ring-cyan-500/50 outline-none text-lg resize-none shadow-xl"
          placeholder="Type or use the microphone..."
          value={task}
          onChange={(e) => setTask(e.target.value)}
        />

        {/* BUTTONS BAR */}
        <div className="flex gap-4 h-16">
          {/* MICROPHONE BUTTON */}
          <button
            onClick={startListening}
            className={`flex-1 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xl ${
              isListening
                ? "bg-red-600 animate-pulse text-white border-4 border-red-900"
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20"
            }`}
          >
            {isListening ? "🛑 Listening..." : "🎤 Speak to Agent"}
          </button>

          {/* RUN BUTTON */}
          <button
            onClick={handleRun}
            disabled={isLoading || !task}
            className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-xl"
          >
            {isLoading ? "Thinking..." : "🚀 Run"}
          </button>
        </div>
      </div>

      {/* RESPONSE AREA */}
      {(response || isLoading) && (
        <div className="w-full max-w-3xl bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-sm relative min-h-[200px]">
          {/* STOP TALKING BUTTON (Top Right) */}
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full shadow-lg animate-bounce font-bold flex gap-2 items-center"
            >
              🤫 Shhh!
            </button>
          )}

          {/* REPLAY BUTTON (Top Right - visible when not speaking) */}
          {!isSpeaking && response && (
            <button
              onClick={() => speakText(response)}
              className="absolute top-4 right-4 bg-slate-700 hover:bg-cyan-600 text-white p-3 rounded-full shadow-lg transition"
              title="Read Again"
            >
              🔊
            </button>
          )}

          {isLoading && !response ? (
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                <div className="h-4 bg-slate-700 rounded"></div>
              </div>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown>{response}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
