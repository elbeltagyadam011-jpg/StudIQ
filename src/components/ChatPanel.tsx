import React, { useState, useRef, useEffect } from "react";
import { AppLanguage, ChatMessage } from "../types";
import { translations } from "../translations";
import { Send, Sparkles, User, HelpCircle, ArrowDown } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ChatPanelProps {
  currentLanguage: AppLanguage;
  chatHistory: ChatMessage[];
  isThinking: boolean;
  onSendMessage: (text: string) => void;
}

export default function ChatPanel({
  currentLanguage,
  chatHistory,
  isThinking,
  onSendMessage,
}: ChatPanelProps) {
  const t = translations[currentLanguage];
  const isRtl = currentLanguage === "ar";
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isThinking]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isThinking) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (isThinking) return;
    onSendMessage(suggestion);
  };

  return (
    <div className={`mx-auto max-w-4xl w-full flex flex-col h-[600px] border border-gray-100 bg-white rounded-2xl shadow-sm ${
      isRtl ? "text-right" : "text-left"
    }`}>
      {/* 1. CHAT HEADER */}
      <div className={`flex items-center justify-between border-b border-gray-100 px-5 py-4 ${
        isRtl ? "flex-row-reverse" : ""
      }`}>
        <div className={`flex items-center gap-2.5 ${isRtl ? "flex-row-reverse" : ""}`}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="font-sans text-sm font-bold text-gray-900">{t.chatTitle}</h3>
            <span className="flex items-center gap-1 text-[10px] text-green-500 font-bold uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Online
            </span>
          </div>
        </div>
      </div>

      {/* 2. CHAT FEED */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/30"
      >
        {/* Intro greeting bubble */}
        <div className={`flex items-start gap-3 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shrink-0 shadow-sm shadow-indigo-100">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className={`max-w-[85%] rounded-2xl p-4 bg-white border border-gray-100 shadow-sm text-sm text-gray-700 leading-relaxed font-sans ${
            isRtl ? "rounded-tr-none" : "rounded-tl-none"
          }`}>
            {t.chatIntro}
          </div>
        </div>

        {/* Dynamic chat messages feed */}
        {chatHistory.map((msg) => {
          const isBot = msg.role === "model";
          
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 animate-slide-up ${
                isRtl 
                  ? isBot ? "flex-row-reverse" : "flex-row" 
                  : isBot ? "flex-row" : "flex-row-reverse"
              }`}
            >
              {/* Avatar Icon */}
              {isBot ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shrink-0 shadow-sm shadow-indigo-100">
                  <Sparkles className="h-4 w-4" />
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-200 text-gray-600 shrink-0">
                  <User className="h-4 w-4" />
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed font-sans shadow-sm border ${
                  isBot
                    ? `bg-white text-gray-700 border-gray-100 ${isRtl ? "rounded-tr-none" : "rounded-tl-none"}`
                    : `bg-indigo-600 text-white border-indigo-700 ${isRtl ? "rounded-tl-none" : "rounded-tr-none"}`
                }`}
              >
                {isBot ? (
                  <div className="markdown-body space-y-2">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                )}
              </div>
            </div>
          );
        })}

        {/* AI Typing Loader */}
        {isThinking && (
          <div className={`flex items-start gap-3 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shrink-0 shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className={`max-w-[85%] rounded-2xl p-4 bg-white border border-gray-100 shadow-sm ${
              isRtl ? "rounded-tr-none" : "rounded-tl-none"
            }`}>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold">
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                <span className="ml-1">{t.chatThinking}</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. SUGGESTED CHIPS AREA */}
      <div className="border-t border-gray-50 bg-white p-3">
        <div className={`flex flex-wrap gap-2 items-center text-xs text-gray-400 font-medium ${
          isRtl ? "flex-row-reverse justify-start" : "flex-row"
        }`}>
          <HelpCircle className="h-3.5 w-3.5 text-gray-300" />
          {[t.suggestedQuestion1, t.suggestedQuestion2, t.suggestedQuestion3].map((suggestion, index) => (
            <button
              key={index}
              disabled={isThinking}
              onClick={() => handleSuggestionClick(suggestion)}
              className="rounded-full bg-gray-50 border border-gray-100 px-3 py-1.5 text-gray-600 hover:border-indigo-200 hover:bg-indigo-50/10 transition-all text-xs disabled:opacity-50 active:scale-95"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* 4. INPUT CONTROLS BAR */}
      <form
        onSubmit={handleSend}
        className={`border-t border-gray-100 bg-white px-5 py-4 flex gap-3 items-center ${
          isRtl ? "flex-row-reverse" : ""
        }`}
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isThinking}
          placeholder={t.chatInputPlaceholder}
          className={`flex-grow rounded-xl border border-gray-200 py-3 px-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
            isRtl ? "text-right" : "text-left"
          }`}
        />
        <button
          type="submit"
          id="send-chat-btn"
          disabled={!inputText.trim() || isThinking}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95 shrink-0"
        >
          <Send className={`h-4.5 w-4.5 ${isRtl ? "rotate-180" : ""}`} />
        </button>
      </form>
    </div>
  );
}
