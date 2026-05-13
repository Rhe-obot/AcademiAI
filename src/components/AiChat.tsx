import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store/AppProvider';
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

export function AiChat() {
  const { chatWithAI } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: "Hi! I'm your AcademiAI assistant. I know about your courses and tasks. How can I help you today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMsg = message.trim();
    setMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const reply = await chatWithAI(userMsg);
      setChatHistory(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-20 right-4 lg:bottom-8 lg:right-8 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-indigo-700 hover:scale-110 active:scale-95 transition-all z-40 group",
          isOpen && "scale-0 opacity-0 pointer-events-none"
        )}
      >
        <Sparkles className="w-6 h-6 animate-pulse group-hover:animate-none" />
      </button>

      {/* Chat Overlay */}
      <div className={cn(
        "fixed inset-x-4 bottom-20 top-20 lg:inset-auto lg:bottom-8 lg:right-8 lg:w-96 lg:h-[600px] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col z-50 transition-all duration-300 origin-bottom-right",
        !isOpen && "scale-0 opacity-0 pointer-events-none"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-indigo-600 text-white rounded-t-3xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">AcademiAI Assistant</h3>
              <p className="text-[10px] opacity-80">Online & ready to help</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1.5 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {chatHistory.map((chat, i) => (
            <div key={i} className={cn("flex items-start gap-3", chat.role === 'user' ? "flex-row-reverse" : "flex-row")}>
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                chat.role === 'user' ? "bg-indigo-100" : "bg-white border border-slate-100"
              )}>
                {chat.role === 'user' ? <User className="w-4 h-4 text-indigo-600" /> : <Bot className="w-4 h-4 text-indigo-600" />}
              </div>
              <div className={cn(
                "max-w-[80%] p-3 rounded-2xl text-sm shadow-sm",
                chat.role === 'user' ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white text-slate-800 border border-slate-100 rounded-tl-none"
              )}>
                {chat.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white border border-slate-100 rounded-lg flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="bg-white text-slate-800 border border-slate-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs font-medium">Thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-50 rounded-b-3xl">
          <div className="relative">
            <input 
              type="text" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask anything about your courses..."
              className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm font-medium"
            />
            <button 
              type="submit"
              disabled={!message.trim() || isLoading}
              className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-md active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
