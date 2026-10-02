import React, { useState } from "react";
import { Bot, Send, Shield, User, CheckCircle2 } from "lucide-react";
import { api } from "../../services/api";

export const AIAssistantDrawer: React.FC = () => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "I answer using records currently available in the registry database. Ask about application status, missing documents, certificates, or registry totals.",
      time: "Just now",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    "Summarize high-priority pending cases",
    "List files missing required documents",
    "Count certificates in the registry",
    "Draft registrar decision notes",
  ];

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg = { role: "user", content: query, time: "Just now" };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const res = await api.askAI(query);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.reply || "The registry database returned no answer.",
          time: "Just now",
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: err instanceof Error
            ? err.message
            : "The registry database could not be reached. No answer was generated.",
          time: "Just now",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Registry Review Assistant
          </h1>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
            <Shield className="w-3 h-3" />
            Staff Tool
          </span>
        </div>
          <p className="text-sm text-slate-500 mt-0.5">
          Database-backed summaries, missing-record checks, and application lookups
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-lg border border-slate-200/90 shadow-sm flex flex-col h-[600px] overflow-hidden">
          {/* Chat Messages */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 ${
                  m.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    m.role === "user"
                      ? "bg-slate-900 text-white"
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                  }`}
                >
                  {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-xl p-4 rounded-lg text-xs leading-relaxed space-y-1 shadow-2xs ${
                    m.role === "user"
                      ? "bg-slate-900 text-white rounded-tr-xs"
                      : "bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-xs"
                  }`}
                >
                  <p>{m.content}</p>
                  <span
                    className={`text-[10px] block ${
                      m.role === "user" ? "text-slate-400 text-right" : "text-slate-400"
                    }`}
                  >
                    {m.time}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 pl-11">
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
                <span>Assistant is reviewing registry records...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/70 space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {quickPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(p)}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors shadow-2xs"
                >
                  {p}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask the assistant to summarize cases, check documents, or draft notes..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-4 py-2.5 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 disabled:bg-slate-300 transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Send
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Database sources
            </h3>
            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800">Application records</p>
                  <p className="text-[11px] text-slate-500">Applicant details and current registry status</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800">Document upload records</p>
                  <p className="text-[11px] text-slate-500">Required document upload and flag statuses</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800">Certificate and officer totals</p>
                  <p className="text-[11px] text-slate-500">Counts retrieved from registry database tables</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
