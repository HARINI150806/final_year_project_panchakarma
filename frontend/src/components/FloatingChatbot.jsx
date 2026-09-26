import { useState, useRef, useEffect } from 'react';
import {
  Send,
  User,
  X,
  Trash2,
  BookOpen,
  ShieldAlert,
  RefreshCw,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Sparkles,
  HelpCircle,
  Flame,
  Leaf,
  HeartPulse,
  Apple,
} from 'lucide-react';
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
        return (
          <strong key={index} className="font-bold text-[#164E3D]">
            {part}
          </strong>
        );
      }
      return part;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (line === '***' || line === '---' || line === '___') {
      if (inList) {
        elements.push(
          <ul key={`list-${i}`} className="space-y-1.5 my-2.5 pl-1">
            {listItems}
          </ul>
        );
        inList = false;
        listItems = [];
      }
      elements.push(<hr key={`hr-${i}`} className="my-3 border-emerald-900/10" />);
      continue;
    }

    if (line.startsWith('### ') || line.startsWith('## ') || line.startsWith('# ')) {
      if (inList) {
        elements.push(
          <ul key={`list-${i}`} className="space-y-1.5 my-2.5 pl-1">
            {listItems}
          </ul>
        );
        inList = false;
        listItems = [];
      }
      const titleText = line.replace(/^#+\s+/, '');
      elements.push(
        <h4 key={`h-${i}`} className="font-bold text-[#163322] text-sm md:text-base mt-3 mb-1.5 pb-1 border-b border-emerald-900/10 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
          {parseBoldText(titleText)}
        </h4>
      );
      continue;
    }

    const listMatch = line.match(/^[\*\-\+]\s+(.*)/);
    const numListMatch = line.match(/^(\d+)\.\s+(.*)/);

    if (listMatch || numListMatch) {
      inList = true;
      const content = listMatch ? listMatch[1] : numListMatch[2];
      const numPrefix = numListMatch ? `${numListMatch[1]}.` : null;

      listItems.push(
        <li key={`li-${i}`} className="flex items-start gap-2.5 text-xs md:text-sm leading-relaxed text-gray-800">
          {numPrefix ? (
            <span className="font-bold text-emerald-800 shrink-0 text-xs mt-0.5">{numPrefix}</span>
          ) : (
            <span className="text-emerald-600 mt-1 shrink-0 text-[10px]">🌿</span>
          )}
          <span className="flex-1">{parseBoldText(content)}</span>
        </li>
      );
    } else {
      if (inList) {
        elements.push(
          <ul key={`list-${i}`} className="space-y-2 my-2.5 pl-0.5">
            {listItems}
          </ul>
        );
        inList = false;
        listItems = [];
      }

      if (line === '') {
        elements.push(<div key={`spacer-${i}`} className="h-2" />);
      } else {
        const isDisclaimer =
          line.toLowerCase().includes('please remember') ||
          line.toLowerCase().includes('consult your doctor') ||
          line.toLowerCase().includes('disclaimer') ||
          line.toLowerCase().includes('educational purposes');

        if (isDisclaimer) {
          const cleanedLine = line.replace(/^[\*_]+|[\*_]+$/g, '');
          elements.push(
            <div key={`disclaimer-${i}`} className="mt-3 p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 leading-relaxed font-medium flex items-start gap-2">
              <ShieldAlert size={14} className="text-amber-700 shrink-0 mt-0.5" />
              <span>{parseBoldText(cleanedLine)}</span>
            </div>
          );
        } else {
          elements.push(
            <p key={`p-${i}`} className="mb-2 text-xs md:text-sm leading-relaxed text-gray-800 last:mb-0">
              {parseBoldText(line)}
            </p>
          );
        }
      }
    }
  }

  if (inList) {
    elements.push(
      <ul key={`list-final`} className="space-y-2 my-2.5 pl-0.5">
        {listItems}
      </ul>
    );
  }

  return <div className="space-y-1">{elements}</div>;
}

export default function FloatingChatbot({ auth }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [activeCategory, setActiveCategory] = useState('ALL');

  const topicCategories = [
    { id: 'ALL', label: 'Popular Topics', icon: Sparkles },
    { id: 'PANCHAKARMA', label: 'Panchakarma', icon: Leaf },
    { id: 'DOSHAS', label: 'Doshas & Prakriti', icon: Flame },
    { id: 'THERAPIES', label: 'Therapies & Benefits', icon: HeartPulse },
    { id: 'DIET', label: 'Diet & Pathya', icon: Apple },
  ];

  // Compute patient-specific storage key so chat history is isolated per patient
  const userId = auth?.id || auth?.email || auth?.username || 'guest';
  const storageKey = `ayurveda-rag-chat-messages-${userId}`;

  const getInitialWelcomeMsg = () => [
    {
      id: 1,
      sender: 'bot',
      text: `Namaste ${auth?.fullName || 'Patient'}! 🌿 Welcome to the **Ayurveda Educational Study Assistant**.\n\nI can help answer your questions about classical Ayurvedic texts, Panchakarma therapies, Vata-Pitta-Kapha Doshas, and healthy daily routines (Dinacharya & Ritucharya).`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ];

  const [messages, setMessages] = useState(() => {
    const stored = localStorage.getItem(storageKey) || sessionStorage.getItem(storageKey);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored chat history:', e);
      }
    }
    return getInitialWelcomeMsg();
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Sync messages whenever userId changes (patient logs out / logs in as another user)
  useEffect(() => {
    const stored = localStorage.getItem(storageKey) || sessionStorage.getItem(storageKey);
    if (stored) {
      try {
        setMessages(JSON.parse(stored));
        return;
      } catch (e) {
        console.error('Failed to parse patient chat history:', e);
      }
    }
    setMessages(getInitialWelcomeMsg());
  }, [userId, auth?.fullName]);

  // Persist messages to patient-specific storage key
  useEffect(() => {
    if (storageKey && messages.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, storageKey]);

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

  const handleCopyText = (msgId, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    if (window.confirm('Clear conversation history?')) {
      const initialMsg = getInitialWelcomeMsg();
      setMessages(initialMsg);
      if (storageKey) {
        localStorage.removeItem(storageKey);
        sessionStorage.removeItem(storageKey);
        sessionStorage.removeItem('ayurveda-rag-chat-messages');
      }
    }
  };

  async function handleSend(textToSend) {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

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
      const { data } = await api.post('/ayurveda-ai/chat', { question: text });
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: data.answer || data.response || "I couldn't find this information in the classical Ayurveda knowledge base.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: "I couldn't find this information in the classical Ayurveda knowledge base.",
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
            transform: translateY(20px) scale(0.96);
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
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#164E3D_0%,#1F4D3A_100%)] text-white shadow-[0_12px_32px_rgba(22,78,61,0.35)] transition-all duration-300 hover:scale-110 active:scale-95 hover:shadow-[0_16px_40px_rgba(22,78,61,0.45)] border border-emerald-400/30 cursor-pointer group"
          title="Open Ayurveda AI Study Assistant"
        >
          <BookOpen size={24} className="group-hover:scale-110 transition" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border border-white"></span>
          </span>
        </button>
      )}

      {/* Main Chat Assistant Container */}
      {isOpen && (
        <div
          className={`fixed z-50 flex flex-col overflow-hidden bg-white/95 shadow-[0_24px_72px_rgba(15,35,25,0.25)] backdrop-blur-2xl transition-all duration-300 animate-slide-up-fade ${
            isFullScreen
              ? 'inset-3 sm:inset-6 rounded-3xl border border-emerald-900/20 shadow-2xl'
              : 'bottom-20 right-6 h-[620px] w-[460px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] rounded-3xl border border-emerald-900/15'
          }`}
        >
          {/* Header Bar */}
          <header className="flex items-center justify-between bg-[linear-gradient(135deg,#164E3D_0%,#1F4D3A_100%)] px-5 py-4 text-white border-b border-emerald-900/20 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-emerald-200 border border-white/20 shrink-0 shadow-xs">
                <BookOpen size={20} />
              </div>
                <h2 className="font-display text-base font-bold leading-tight">Ayurveda AI Assistant</h2>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white/80 hover:bg-white/15 hover:text-white transition cursor-pointer"
                title={isFullScreen ? 'Compact View' : 'Study Mode (Full Screen)'}
              >
                {isFullScreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
              </button>
              <button
                onClick={handleClearChat}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white/80 hover:bg-white/15 hover:text-white transition cursor-pointer"
                title="Clear Chat History"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsFullScreen(false);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white/80 hover:bg-white/15 hover:text-white transition cursor-pointer"
                title="Close Assistant"
              >
                <X size={18} />
              </button>
            </div>
          </header>



          {/* Study Mode FullScreen Sidebar Layout */}
          <div className={`flex-1 flex overflow-hidden ${isFullScreen ? 'divide-x divide-emerald-900/10' : ''}`}>
            {isFullScreen && (
              <div className="w-72 bg-[#f4f8f2] p-5 hidden md:flex flex-col gap-4 shrink-0 overflow-y-auto">
                <div>
                  <h3 className="text-xs font-bold text-[#163322] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-emerald-700" /> Study Topics
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed font-medium">
                    Explore classical Ayurvedic concepts, Panchakarma procedures, and wellness rules.
                  </p>
                </div>

                <div className="space-y-1">
                  {topicCategories.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#164E3D] text-white shadow-xs'
                            : 'bg-white text-gray-700 hover:bg-emerald-100/50 border border-emerald-900/10'
                        }`}
                      >
                        <Icon size={15} className={isSelected ? 'text-emerald-300' : 'text-emerald-700'} />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-auto p-3.5 bg-emerald-900/5 border border-emerald-900/10 rounded-2xl text-xs text-emerald-950 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <HelpCircle size={14} className="text-emerald-700" /> Need Medical Advice?
                  </p>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Please schedule a consultation with our doctors for individual health recommendations.
                  </p>
                </div>
              </div>
            )}

            {/* Chat Transcript Viewport */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#fbfdfa] overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 scrollbar-thin">
                <div className={`space-y-5 ${isFullScreen ? 'max-w-4xl mx-auto w-full' : 'w-full'}`}>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-3 ${
                        isFullScreen ? 'max-w-[85%]' : 'max-w-[90%]'
                      } ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                    >
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-2xl text-xs font-semibold shrink-0 shadow-2xs ${
                          msg.sender === 'user'
                            ? 'bg-[#164E3D] text-white'
                            : 'bg-[#e3eee0] text-emerald-950 border border-emerald-300/60'
                        }`}
                      >
                        {msg.sender === 'user' ? <User size={15} /> : '🌿'}
                      </div>

                      <div className="flex flex-col group relative">
                        <div
                          className={`rounded-2xl p-4 text-xs md:text-sm leading-relaxed shadow-2xs ${
                            msg.sender === 'user'
                              ? 'bg-[#164E3D] text-white rounded-tr-none'
                              : 'bg-white text-gray-800 border border-emerald-900/10 rounded-tl-none'
                          }`}
                        >
                          {msg.sender === 'user' ? msg.text : formatBotMessage(msg.text)}
                        </div>

                        <div className={`flex items-center gap-2 mt-1.5 ${msg.sender === 'user' ? 'justify-end mr-1' : 'justify-between ml-1'}`}>
                          <span className="text-[10px] font-medium text-gray-400">{msg.time}</span>
                          {msg.sender === 'bot' && (
                            <button
                              onClick={() => handleCopyText(msg.id, msg.text)}
                              className="text-[11px] text-gray-400 hover:text-emerald-700 flex items-center gap-1 transition opacity-80 hover:opacity-100 cursor-pointer"
                              title="Copy response"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check size={12} className="text-emerald-600" />
                                  <span className="text-emerald-700 font-bold">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={12} />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className={`flex items-start gap-3 ${isFullScreen ? 'max-w-[80%]' : 'max-w-[85%]'}`}>
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#e3eee0] border border-emerald-300/60 text-emerald-950 text-xs font-semibold shrink-0">
                        🌿
                      </div>
                      <div className="flex flex-col">
                        <div className="bg-white text-gray-800 border border-emerald-900/10 rounded-2xl rounded-tl-none p-4 shadow-2xs flex items-center gap-2.5 text-xs">
                          <RefreshCw size={15} className="animate-spin text-emerald-700" />
                          <span className="text-xs font-semibold text-emerald-950">Searching classical Ayurveda knowledge base...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Space-Optimized 1-Line Quick Suggestion Bar */}
              <div className="border-t border-emerald-900/10 bg-[#f7faf6] px-3 py-1.5 shrink-0 overflow-x-auto no-scrollbar flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-900/70 shrink-0 flex items-center gap-1 pl-1">
                  <Sparkles size={11} className="text-amber-600" /> Ask:
                </span>
                {[
                  'What is Panchakarma?',
                  'Explain Abhyanga',
                  'Explain Vata Dosha',
                  'Benefits of Shirodhara',
                  'Diet after Panchakarma',
                  'Pathya & Apathya rules',
                  'Ayurvedic Daily Habits',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleSend(chip)}
                    disabled={loading}
                    className="whitespace-nowrap shrink-0 rounded-full border border-emerald-900/15 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-emerald-950 hover:bg-[#164E3D] hover:text-white transition shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    • {chip}
                  </button>
                ))}
              </div>

              {/* Compact Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="border-t border-emerald-900/10 bg-white px-3 py-2 shrink-0"
              >
                <div className={`flex items-center gap-2 ${isFullScreen ? 'max-w-4xl mx-auto w-full' : 'w-full'}`}>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask an Ayurveda question (e.g. Explain Vata)..."
                    disabled={loading}
                    className="flex-1 bg-gray-50 border border-emerald-900/15 rounded-xl outline-none text-xs md:text-sm text-gray-800 placeholder-gray-400 px-3.5 py-2 focus:border-[#164E3D] focus:bg-white transition disabled:opacity-50 shadow-2xs"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-xl bg-[#164E3D] text-white shadow-md transition hover:bg-[#113d2f] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
                    title="Send Question"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

