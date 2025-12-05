import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_API_KEY; 

const AdaptiveExam = () => {
    // STATE MANAGEMENT
  // Options: IDLE, ACTIVE, THINKING, ANALYZING, FINISHED
  const [history, setHistory] = useState([]);   
  const [examState, setExamState] = useState("IDLE"); 
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [studentInput, setStudentInput] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [finalReport, setFinalReport] = useState(null);

  // SCROLL REF
  // pull the screen down
  const bottomRef = useRef(null);

  // EFFECT: AUTO-SCROLL
  // This runs every time the 'history' or 'examState' changes
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history, examState]);

 // --- BRAIN 1: THE EXAMINER (Upgraded to 2.5 Flash) ---
  const askTheExaminer = async (userAnswer = "") => {
    // Logic to handle start/thinking state
    if (userAnswer === "START_EXAM") {
        setExamState("THINKING");
        setHistory([]); 
    } else {
        setExamState("THINKING");
    }

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash", // 🧠 UPGRADED TO THE FLASH MODEL
        generationConfig: { responseMimeType: "application/json" } 
      });

      const prompt = `
        You are an Adaptive React JS Examiner.
        Previous Context: ${JSON.stringify(history)}
        Student Answer: "${userAnswer}"
        
        TASK:
        1. If this is the start, ask a medium-level React question.
        2. If the user answered, grade it (Pass/Fail) and explain briefly.
        3. If Pass -> Generate a HARDER React question.
        4. If Fail -> Generate a SIMPLER React question.
        5. If they have answered 5 questions OR showed mastery, set "isExamOver": true.

        OUTPUT JSON ONLY:
        {
          "botMessage": "string",
          "nextQuestion": "string",
          "isExamOver": boolean
        }
      `;

      const result = await model.generateContent(prompt);
      const data = JSON.parse(result.response.text());

      if (data.isExamOver) {
        await generateGeniusReport(history, userAnswer);
      } else {
        setFeedback(data.botMessage);
        setCurrentQuestion(data.nextQuestion);
        if (userAnswer !== "START_EXAM") {
           setHistory(prev => [...prev, 
             { role: "user", text: userAnswer },
             { role: "model", text: data.botMessage }
           ]);
        }
        setExamState("ACTIVE");
      }

    } catch (e) {
      console.error(e);
      setFeedback("Error: " + e.message);
      setExamState("ACTIVE");
    }
  };

  // --- BRAIN 2: THE COACH (Upgraded to 2.5 Pro) ---
  const generateGeniusReport = async (fullHistory, lastAnswer) => {
    setExamState("ANALYZING"); 
    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-pro", // 🧠 UPGRADED TO THE GENIUS MODEL
        generationConfig: { responseMimeType: "application/json" } 
      });

      const prompt = `
        You are a Team Performance Coach. 
        Review this exam transcript: ${JSON.stringify([...fullHistory, {role: "user", text: lastAnswer}])}

        CRITICAL ANALYSIS TASK:
        Do not look at the code accuracy. Look at the HUMAN BEHAVIOR.
        1. Did they guess? (Short answers, no logic)
        2. Did they collaborate? (Look for words like "We think", "Debated", "Agreed")
        3. Did they learn? (Did they fix mistakes in later turns?)

        OUTPUT JSON:
        {
          "teamScore": "Number 1-100",
          "collaborationLevel": "Low/Medium/High",
          "behavioralAnalysis": "Explain how they worked together based on the text evidence.",
          "improvementPlan": "Specific advice for this team to work better next time."
        }
      `;

      const result = await model.generateContent(prompt);
      const data = JSON.parse(result.response.text());
      
      setFinalReport(data);
      setExamState("FINISHED");

    } catch (e) {
      console.error(e);
      setFeedback("Error generating report");
      setExamState("FINISHED");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-blue-100 p-6 font-sans flex flex-col items-center">
      
      {/* HEADER */}
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold bg-linear-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
          🧠 The Hybrid Examiner
        </h1>
        <p className="text-gray-400 text-sm mt-2">Flash for Speed • Pro for Strategy</p>
      </header>

      {/* IDLE (Start Button) */}
      {examState === "IDLE" && (
        <div className="text-center mt-10">
          <p className="mb-6 text-gray-300 max-w-md">
            This AI will test your React knowledge and analyze your team's collaboration strategy.
          </p>
          <button 
            onClick={() => askTheExaminer("START_EXAM")}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-4 rounded-xl text-xl font-bold transition shadow-lg shadow-cyan-900/50"
          >
            Start Team Exam
          </button>
        </div>
      )}

      {/* ACTIVE EXAM (Chat & Inputs) */}
      {(examState === "ACTIVE" || examState === "THINKING") && (
        <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col h-[70vh]">
          
          {/* Chat History Area */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
            {/* Previous Feedback Bubble */}
            {feedback && (
               <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-purple-500 text-sm text-gray-300">
                  <strong>Previous Feedback:</strong> {feedback}
               </div>
            )}
            
            {/* History Loop */}
            {history.map((msg, i) => (
              <div key={i} className={`p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-slate-800 ml-10 border-l-2 border-cyan-500' : 'bg-slate-950 mr-10 border-r-2 border-gray-600'}`}>
                <strong>{msg.role === 'user' ? 'Team' : 'Examiner'}:</strong> {msg.text}
              </div>
            ))}
            
            {/* The Invisible Anchor for Auto-Scroll */}
            <div ref={bottomRef} />
          </div>

          {/* Current Question Display */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4">
            <h2 className="text-gray-500 text-xs uppercase tracking-widest mb-1">Current Question</h2>
            <div className="text-lg font-medium text-white animate-fade-in">
              {examState === "THINKING" ? <span className="animate-pulse">Thinking...</span> : currentQuestion}
            </div>
          </div>

          {/* Input Area */}
          <div className="flex gap-2">
            <textarea
              value={studentInput}
              onChange={(e) => setStudentInput(e.target.value)}
              placeholder="Type your answer here... (Tip: Explain your reasoning!)"
              className="flex-1 bg-slate-800 border-slate-700 rounded-xl p-3 focus:ring-2 ring-cyan-500 outline-none resize-none h-20 text-sm"
            />
            <button 
              onClick={() => { askTheExaminer(studentInput); setStudentInput(""); }}
              disabled={examState === "THINKING" || !studentInput}
              className="bg-cyan-600 hover:bg-cyan-500 px-6 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* ANALYZING (Loading Animation) */}
      {examState === "ANALYZING" && (
        <div className="flex flex-col items-center mt-20 animate-pulse">
          <div className="text-6xl mb-4">🔮</div>
          <div className="text-2xl text-purple-400 font-bold">Consulting the Coach...</div>
          <p className="text-gray-500">Analyzing your collaboration strategy</p>
        </div>
      )}

      {/* FINAL REPORT */}
      {examState === "FINISHED" && finalReport && (
        <div className="w-full max-w-3xl bg-slate-900 border border-purple-500/30 rounded-2xl p-8 animate-fade-in">
          <h2 className="text-3xl font-bold text-white mb-6 border-b border-slate-700 pb-4">
            🎓 Performance Report
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-950 p-6 rounded-xl text-center border border-slate-800">
              <div className="text-5xl font-black text-transparent bg-clip-text bg-linear-to-br from-purple-400 to-pink-600">
                {finalReport.teamScore}
              </div>
              <div className="text-gray-400 mt-2 font-bold uppercase tracking-wider text-xs">Team Score</div>
            </div>
            <div className="bg-slate-950 p-6 rounded-xl text-center flex flex-col justify-center border border-slate-800">
              <div className="text-2xl font-bold text-white mb-1">
                {finalReport.collaborationLevel}
              </div>
              <div className="text-gray-400 font-bold uppercase tracking-wider text-xs">Collaboration Level</div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-purple-400 font-bold mb-2 flex items-center gap-2">
                <span>🕵️</span> Behavioral Analysis
              </h3>
              <p className="text-gray-300 leading-relaxed bg-slate-950 p-4 rounded-lg">
                {finalReport.behavioralAnalysis}
              </p>
            </div>
            
            <div className="bg-purple-900/20 border border-purple-500/30 p-6 rounded-xl">
              <h3 className="text-purple-300 font-bold mb-2 flex items-center gap-2">
                <span>🚀</span> Improvement Plan
              </h3>
              <p className="text-purple-100 italic">
                "{finalReport.improvementPlan}"
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => window.location.reload()} 
            className="mt-8 w-full py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-gray-400 border border-slate-700 transition"
          >
            Start New Session
          </button>
        </div>
      )}

    </div>
  );
}

export default AdaptiveExam;