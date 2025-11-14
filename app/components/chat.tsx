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
    <div className="fixed top-0 left-0 h-full flex z-50">
      {/* Chat Window */}
      <div className="bg-white shadow-2xl rounded-r-3xl overflow-hidden flex flex-col h-full w-[20vw] min-w-[300px]">
        {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 max-w-[85%] animate-slideIn ${
                    message.isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0 ${
                      message.isUser
                        ? 'bg-gradient-to-br from-purple-400 to-purple-600'
                        : 'bg-gradient-to-br from-pink-400 to-red-500'
                    }`}
                  >
                    {message.isUser ? '👤' : '🤖'}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`px-3 py-2 rounded-2xl leading-relaxed text-sm ${
                      message.isUser
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm shadow-sm'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-2 max-w-[85%] mr-auto animate-slideIn">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0 bg-gradient-to-br from-pink-400 to-red-500">
                    🤖
                  </div>
                  <div className="px-3 py-2 rounded-2xl bg-white border border-gray-200 rounded-bl-sm shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-gray-200 flex-shrink-0">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-sm outline-none focus:border-blue-600 transition-colors"
                  disabled={isTyping}
                />
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

          <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}