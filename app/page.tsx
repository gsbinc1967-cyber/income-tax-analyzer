"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Sidebar from "@/components/Sidebar";
import CalculatorModal from "@/components/CalculatorModal";

// --- Types ---
type Message = {
  role: "user" | "assistant";
  content: string;
  drillDowns?: string[];
};

type ModelData = {
  id: string;
  label: string;
};

// --- Page Component ---
export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [audience, setAudience] = useState("professional");
  const [models, setModels] = useState<Record<string, ModelData>>({});
  const [currentModel, setCurrentModel] = useState("opus");
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [actContext, setActContext] = useState<"both" | "ita2025" | "ita1961">("both");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Load Models
  useEffect(() => {
    fetch("/api/models")
      .then((res) => res.json())
      .then((data) => {
        if (data.models) {
          setModels(data.models);
          setCurrentModel(data.default);
        }
      });
  }, []);

  // Toggle Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark-mode");
    } else {
      document.documentElement.classList.remove("dark-mode");
    }
  }, [darkMode]);

  const handleShowComparison = () => {
    setMessages((prev) => [
      ...prev,
      { role: "user", content: "Show comparison between the two Acts section wise." },
      { role: "assistant", content: `Here is the section-wise comparison between the old Income Tax Act, 1961 and the newly enacted Income Tax Act, 2025:

| Category | Income Tax Act, 1961 | Income Tax Act, 2025 | Notes / Major Changes |
| :--- | :--- | :--- | :--- |
| **Charging Section** | Section 4 | Section 3 | Foundational section updated. |
| **Residential Status** | Section 6 | Section 5 | |
| **Salary Income** | Sections 15 – 17 | Sections 14 – 16 | |
| **House Property** | Sections 22 – 27 | Sections 20 – 25 | |
| **Business / Profession (PGBP)** | Sections 28 – 44 | Sections 28 – 60 | PGBP sections heavily restructured. |
| **Capital Gains** | Sections 45 – 55 | Sections 61 – 70 | |
| **Other Sources** | Sections 56 – 59 | Sections 71 – 74 | |
| **Clubbing of Income** | Sections 60 – 64 | Sections 75 – 79 | |
| **Set off & Carry Forward** | Sections 70 – 80 | Sections 80 – 90 | |
| **Deductions** | Sec 80C to 80U | Chapter VI-A | Clause numbers updated. |
| **Tax Rebate** | Section 87A | Section 87A | Section number retained. |
| **Assessments / Notices** | Sec 143, 147/148 | Sec 143, 147/148 | Core assessment sections retained. |

### TDS Consolidation
One of the most radical changes in ITA 2025 is the complete overhaul and consolidation of TDS:

| TDS Category | Income Tax Act, 1961 | Income Tax Act, 2025 | Notes |
| :--- | :--- | :--- | :--- |
| **Salary TDS** | Section 192 | **Section 392** | |
| **Non-Salary TDS** | Scattered across 193, 194, 206C, etc. | **Section 393** | All non-salary TDS is now under Section 393, mapped by a **Nature-Code** system (e.g. 1001 for Interest, 1012 for Professional fees). |
`,
        drillDowns: [
          "Explain the changes to PGBP (Business Income) from ITA 1961 to ITA 2025 in detail.",
          "What are the major changes to Capital Gains under ITA 2025?",
          "How has the TDS system been consolidated under Section 392 and 393?",
          "Detail the changes in Set off and Carry Forward of Losses in ITA 2025."
        ] 
      }
    ]);
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          model: currentModel,
          audience,
          actContext,
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) throw new Error("Network response was not ok");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      let assistantContent = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split("\n\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            if (dataStr === "[DONE]") {
              break;
            }
            try {
              const data = JSON.parse(dataStr);
              if (data.chunk) {
                assistantContent += data.chunk;
                setMessages((prev) => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1].content = assistantContent;
                  return newMsgs;
                });
              }
            } catch (e) {
              // Parse error on incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <div style={{ height: "4px", background: "linear-gradient(to right, var(--saffron) 33.3%, white 33.3% 66.6%, var(--green) 66.6%)", flexShrink: 0 }}></div>
      <header style={{
        background: "linear-gradient(135deg, var(--navy) 0%, #5c6bc0 50%, #3949ab 100%)",
        color: "white", padding: "0 24px", height: "80px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, boxShadow: "0 3px 20px rgba(0,0,128,0.35)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "60px", height: "60px", background: "var(--saffron)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "30px", fontWeight: 700, color: "white", boxShadow: "0 3px 10px rgba(0,128,128,0.4)" }}>₹</div>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.3px" }}>Indian Income Tax Analyser</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", marginTop: "1px" }}>Powered by Claude AI — ITA 2025 & ITA 1961</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button 
            onClick={() => setActContext(actContext === "ita2025" ? "both" : "ita2025")}
            style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, background: "rgba(255,153,51,0.25)", color: "#FFB84D", border: "1px solid rgba(255,153,51,0.3)", cursor: "pointer", opacity: actContext === "ita1961" ? 0.4 : 1, transition: "opacity 0.2s" }}
            title="Force ITA 2025 Mode"
          >ITA 2025</button>
          <button 
            onClick={() => setActContext(actContext === "ita1961" ? "both" : "ita1961")}
            style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, background: "rgba(19,136,8,0.25)", color: "#4CAF50", border: "1px solid rgba(19,136,8,0.3)", cursor: "pointer", opacity: actContext === "ita2025" ? 0.4 : 1, transition: "opacity 0.2s" }}
            title="Force ITA 1961 Mode"
          >ITA 1961</button>
          <button onClick={() => setDarkMode(!darkMode)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}>{darkMode ? "☀️" : "🌙"}</button>
          <select value={audience} onChange={(e) => setAudience(e.target.value)} style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)" }}>
            <option value="student">Student (Learn Mode)</option>
            <option value="professional">Professional (Enterprise)</option>
            <option value="ca">Chartered Accountant (Advanced)</option>
          </select>
          <button onClick={() => setMessages([])} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "6px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>🗑 New Chat</button>
          <button onClick={() => setIsCalcOpen(true)} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "6px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>⚙️ Calculator</button>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <Sidebar 
          onActionClick={(q) => handleSend(q)} 
          onOpenCalc={() => setIsCalcOpen(true)} 
          onShowComparison={handleShowComparison}
        />

        {/* Chat Area */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--bg)", overflow: "hidden" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px", scrollBehavior: "smooth" }}>
            {messages.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: "16px" }}>
                <div style={{ width: "72px", height: "72px", background: "linear-gradient(135deg, var(--saffron), var(--saffron-dark))", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px", boxShadow: "0 8px 24px rgba(255,153,51,0.35)", marginBottom: "8px" }}>₹</div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--navy)" }}>How can I help you with Indian Income Tax today?</div>
                <div style={{ fontSize: "15px", color: "var(--text-muted)", maxWidth: "480px", lineHeight: 1.6 }}>Ask me anything about ITA 2025, ITA 1961, tax slabs, capital gains, deductions, or landmark case laws.</div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} style={{ display: "flex", gap: "12px", maxWidth: "820px", margin: msg.role === "user" ? "0 0 0 auto" : "0", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0, marginTop: "2px", background: msg.role === "user" ? "var(--navy)" : "linear-gradient(135deg, var(--saffron), var(--saffron-dark))", color: "white" }}>
                    {msg.role === "user" ? "👤" : "₹"}
                  </div>
                  <div className="markdown-body" style={{ background: msg.role === "user" ? "var(--navy)" : "var(--surface)", color: msg.role === "user" ? "white" : "var(--text)", border: `1px solid ${msg.role === "user" ? "var(--navy)" : "var(--border)"}`, borderRadius: "var(--radius)", padding: "14px 16px", boxShadow: "var(--shadow)", maxWidth: "700px", lineHeight: 1.65, fontSize: "14px" }}>
                    {msg.role === "user" ? (
                      <div>{msg.content}</div>
                    ) : (
                      <>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                        {msg.drillDowns && msg.drillDowns.length > 0 && (
                          <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px dashed var(--border)", paddingTop: "16px" }}>
                            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Drill Down Options:</div>
                            {msg.drillDowns.map((drill, idx) => (
                              <button 
                                key={idx} 
                                onClick={() => handleSend(drill)}
                                style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", color: "var(--text)", cursor: "pointer", textAlign: "left", transition: "border-color 0.2s" }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--saffron)"}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
                              >
                                🔍 {drill}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
            {isTyping && (
               <div style={{ display: "flex", gap: "12px", maxWidth: "820px", margin: "0" }}>
                 <div style={{ width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0, marginTop: "2px", background: "linear-gradient(135deg, var(--saffron), var(--saffron-dark))", color: "white" }}>₹</div>
                 <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "14px 16px", boxShadow: "var(--shadow)", maxWidth: "700px", lineHeight: 1.65, fontSize: "14px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <div style={{ width: "7px", height: "7px", background: "var(--saffron)", borderRadius: "50%", animation: "bounce 1.2s infinite" }} />
                    <div style={{ width: "7px", height: "7px", background: "var(--saffron)", borderRadius: "50%", animation: "bounce 1.2s infinite 0.2s" }} />
                    <div style={{ width: "7px", height: "7px", background: "var(--saffron)", borderRadius: "50%", animation: "bounce 1.2s infinite 0.4s" }} />
                 </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: "16px 24px 20px", background: "var(--surface)", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", background: "var(--bg)", border: "2px solid var(--border)", borderRadius: "var(--radius)", padding: "10px 14px", transition: "border-color 0.2s" }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about Indian Income Tax..."
                style={{ flex: 1, border: "none", background: "transparent", fontFamily: "inherit", fontSize: "14px", color: "var(--text)", resize: "none", outline: "none", minHeight: "22px", maxHeight: "160px", lineHeight: 1.5 }}
                rows={1}
              />
              <button 
                onClick={() => handleSend()}
                disabled={isTyping || !input.trim()}
                style={{ background: "var(--navy)", color: "white", border: "none", borderRadius: "8px", width: "38px", height: "38px", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: (isTyping || !input.trim()) ? 0.4 : 1 }}
              >
                ➤
              </button>
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px", textAlign: "center" }}>Enter to send, Shift+Enter for new line. Powered by Claude AI.</div>
          </div>
        </main>
      </div>
      {isCalcOpen && <CalculatorModal onClose={() => setIsCalcOpen(false)} />}
    </>
  );
}
