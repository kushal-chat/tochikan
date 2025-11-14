'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
}

// mapUpdate() : boolean;

export default function ChatBubble() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    const message = inputValue.trim();
    if (!message) return;
  
    const userMessage: Message = {
      id: Date.now(),
      text: message,
      isUser: true,
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
  
    setIsTyping(true);
  
    try {
      const res = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: message }),
      });
  
      if (!res.ok) throw new Error("Server error");
  
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
  
      if (!reader) throw new Error("No response stream");
  
      // Create empty bot message
      const botId = Date.now() + 1;
      setMessages(prev => [
        ...prev,
        { id: botId, text: "", isUser: false },
      ]);
  
      // Stream chunks
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
  
        const chunk = decoder.decode(value, { stream: true });
  
        // Append chunk to bot message
        setMessages(prev => {
          return prev.map(m =>
            m.id === botId ? { ...m, text: m.text + chunk } : m
          );
        });
      }
    } catch (err) {
      // If error, send fallback message
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 2,
          text: "Error: Could not reach server.",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    }
  
    setIsTyping(false);
  };  

  return (
    <div className="fixed bottom-0 h-20 w-60vw flex z-50">
      {/* Chat Window */}
      <div className="shadow-2xl rounded-r-4x0 overflow-hidden flex flex-col h-full w-[60vw] min-w-[300px]">
            {/* Input */}
            <div className="grid gap-6 mb-6 md:grid-cols-2">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Type a message..." className="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" required />
                <button
                  type="submit"
                  disabled={isTyping || !inputValue.trim()}
                  className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  ➤
                </button>
              </form>
            </div>
          </div>
    </div>
  );
}