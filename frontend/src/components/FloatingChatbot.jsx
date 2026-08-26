import { useState, useRef, useEffect } from 'react';
import { Send, Wand2, User, X, Trash2, Sparkles, MessageSquare } from 'lucide-react';
import api from '../api';

function formatBotMessage(text) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let inList = false;
  let listItems = [];

  const parseBoldText = (str) => {
    const parts = str.split('**');
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="font-bold text-forest">{part}</strong>;
      }
      return part;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (line === '***' || line === '---' || line === '___') {
      if (inList) {
        elements.push(<ul key={`list-${i}`} className="space-y-1.5 my-2 pl-1">{listItems}</ul>);
        inList = false;
        listItems = [];
      }
      elements.push(<hr key={`hr-${i}`} className="my-3 border-sand/60" />);
      continue;
    }

    const listMatch = line.match(/^[\*\-\+]\s+(.*)/);
    if (listMatch) {
      inList = true;
      const content = listMatch[1];
      listItems.push(
        <li key={`li-${i}`} className="flex items-start gap-2 text-sm leading-6 mb-2">
          <span className="text-sage mt-1.5 shrink-0 text-[10px]">✦</span>
          <span className="flex-1">{parseBoldText(content)}</span>
        </li>
      );
    } else {
      if (inList) {
        elements.push(<ul key={`list-${i}`} className="space-y-1.5 my-2 pl-1">{listItems}</ul>);
        inList = false;
        listItems = [];
      }

      if (line === '') {
        elements.push(<div key={`spacer-${i}`} className="h-2" />);
      } else {
        const isDisclaimer = line.toLowerCase().includes('please remember') || 
                             line.toLowerCase().includes('consult your doctor') ||
                             line.toLowerCase().includes('disclaimer') ||
                             line.toLowerCase().includes('educational purposes');
        if (isDisclaimer) {
          const cleanedLine = line.replace(/^[\*_]+|[\*_]+$/g, '');
          elements.push(
            <div key={`disclaimer-${i}`} className="mt-3 p-3 bg-sand/30 border border-sand/50 rounded-xl text-xs text-forest/70 italic leading-5">
              {parseBoldText(cleanedLine)}
            </div>
          );
        } else {
          elements.push(
            <p key={`p-${i}`} className="mb-2 text-sm leading-6 last:mb-0">
              {parseBoldText(line)}
            </p>
          );
        }
      }
    }
  }

  if (inList) {
    elements.push(<ul key={`list-final`} className="space-y-1.5 my-2 pl-1">{listItems}</ul>);
  }

  return <div className="space-y-1">{elements}</div>;
}

export default function FloatingChatbot({ auth }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    const stored = sessionStorage.getItem('ayurbot-messages');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored chat history:', e);
      }
    }
    return [
      {
        id: 1,
        sender: 'bot',
        text: `Hello ${auth?.fullName || 'there'}! 🌿 I am AyurBot, your AI Ayurvedic Wellness Companion. I see your dominant Dosha is ${auth?.dominantDosha || 'not assessed yet'}. How can I assist you with your health, diet, daily routine, or Panchakarma therapies today?`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestionChips = [
    'What foods balance my dominant Dosha?',
    'What are the benefits of Shirodhara?',
    'Give me a basic morning Ayurvedic routine.',
    'What should I eat before a therapy session?',
  ];

  useEffect(() => {
    sessionStorage.setItem('ayurbot-messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-chatbot', handleOpen);
    return () => window.removeEventListener('open-chatbot', handleOpen);
  }, []);

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear the conversation?')) {
      const initialMsg = [
        {
          id: 1,
          sender: 'bot',
          text: `Hello ${auth?.fullName || 'there'}! 🌿 I am AyurBot, your AI Ayurvedic Wellness Companion. I see your dominant Dosha is ${auth?.dominantDosha || 'not assessed yet'}. How can I assist you today?`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ];
      setMessages(initialMsg);
    }
  };

  async function handleSend(textToSend) {
    const text = textToSend || input;
    if (!text.trim()) return;

    if (!textToSend) {
      setInput('');
    }

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const { data } = await api.post('/chatbot/ask', { message: text });
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: data.response || 'I could not retrieve an answer at this time. Please try again.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: 'Sorry, I am having trouble connecting to the server. Please ensure the backend is running and try again.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @keyframes slideUpFade {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-slide-up-fade {
          animation: slideUpFade 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] text-white shadow-[0_8px_30px_rgba(53,92,57,0.4)] transition-all duration-300 hover:scale-110 active:scale-95 hover:shadow-[0_12px_36px_rgba(53,92,57,0.5)] border border-white/20"
        title="Chat with Wellness Bot"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} className="animate-pulse" />}
      </button>

      {/* Floating Chat Panel */}
      {isOpen && (
        <div className="panel-frost fixed bottom-24 right-6 z-50 flex h-[500px] w-[380px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-[rgba(250,248,242,0.95)] shadow-[0_24px_72px_rgba(30,44,35,0.22)] backdrop-blur-2xl transition-all duration-300 animate-slide-up-fade">
          {/* Header */}
          <header className="flex items-center justify-between bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] px-4 py-3.5 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white">
                <Wand2 size={16} />
              </div>
              <div>
                <h2 className="font-display text-sm font-bold leading-none">AyurBot</h2>
                <p className="mt-1 text-[10px] opacity-80 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  AI Wellness Companion
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleClearChat}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition"
                title="Clear Chat"
              >
                <Trash2 size={14} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition"
                title="Minimize"
              >
                <X size={15} />
              </button>
            </div>
          </header>

          {/* Messages Viewport */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin bg-[#faf8f4]/60">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 max-w-[88%] ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-semibold shrink-0 ${
                    msg.sender === 'user'
                      ? 'bg-forest text-white'
                      : 'bg-[#e6efdf] text-sage border border-[#cfe0c2]'
                  }`}
                >
                  {msg.sender === 'user' ? <User size={12} /> : '🌿'}
                </div>

                <div className="flex flex-col">
                  <div
                    className={`rounded-[1.2rem] px-3.5 py-2.5 text-xs leading-5 shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-forest text-white rounded-tr-none'
                        : 'bg-white/95 text-forest border border-sand/70 rounded-tl-none'
                    }`}
                  >
                    {msg.sender === 'user' ? msg.text : formatBotMessage(msg.text)}
                  </div>
                  <span
                    className={`text-[9px] mt-1 text-forest/40 ${
                      msg.sender === 'user' ? 'text-right mr-1' : 'ml-1'
                    }`}
                  >
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-2.5 max-w-[80%]">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e6efdf] border border-[#cfe0c2] text-sage text-[10px] font-semibold">
                  🌿
                </div>
                <div className="flex flex-col">
                  <div className="bg-white/95 text-forest border border-sand/70 rounded-[1.2rem] rounded-tl-none px-3 py-2.5 shadow-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-forest/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-forest/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-forest/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          {messages.length === 1 && !loading && (
            <div className="px-4 py-2 border-t border-sand/30 bg-[#faf8f4]/60">
              <p className="text-[9px] uppercase tracking-[0.12em] text-forest/50 mb-2">
                Ask about:
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-[75px] overflow-y-auto pr-1">
                {suggestionChips.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleSend(chip)}
                    className="rounded-full border border-sand/80 bg-white/90 px-2.5 py-1.5 text-[10px] font-medium text-forest hover:bg-forest hover:text-white transition shadow-sm active:scale-[0.98] leading-tight"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 border-t border-sand/40 bg-white p-2.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              disabled={loading}
              className="flex-1 bg-transparent border-0 outline-none text-xs text-forest placeholder-forest/45 px-2.5 py-1.5 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] text-white shadow-md transition hover:translate-y-[-1px] disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 shrink-0"
            >
              <Send size={12} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
