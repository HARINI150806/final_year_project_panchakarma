import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, BookOpen, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import api from '../api';

function formatMarkdownText(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let inList = false;
  let listItems = [];

  const parseBoldText = (str) => {
    const parts = str.split('**');
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="font-bold text-[#1F4D3A]">{part}</strong>;
      }
      return part;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (line === '***' || line === '---' || line === '___') {
      if (inList) {
        elements.push(<ul key={`list-${i}`} className="space-y-1 my-2 pl-2">{listItems}</ul>);
        inList = false;
        listItems = [];
      }
      elements.push(<hr key={`hr-${i}`} className="my-3 border-emerald-900/10" />);
      continue;
    }

    const listMatch = line.match(/^[\*\-\+]\s+(.*)/);
    if (listMatch) {
      inList = true;
      const content = listMatch[1];
      listItems.push(
        <li key={`li-${i}`} className="flex items-start gap-2 text-sm leading-6 mb-1.5">
          <span className="text-emerald-700 mt-1 shrink-0 text-[10px]">🌿</span>
          <span className="flex-1">{parseBoldText(content)}</span>
        </li>
      );
    } else {
      if (inList) {
        elements.push(<ul key={`list-${i}`} className="space-y-1 my-2 pl-2">{listItems}</ul>);
        inList = false;
        listItems = [];
      }

      if (line === '') {
        elements.push(<div key={`spacer-${i}`} className="h-2" />);
      } else {
        elements.push(
          <p key={`p-${i}`} className="mb-2 text-sm leading-6 last:mb-0 text-gray-800">
            {parseBoldText(line)}
          </p>
        );
      }
    }
  }

  if (inList) {
    elements.push(<ul key={`list-final`} className="space-y-1 my-2 pl-2">{listItems}</ul>);
  }

  return <div className="space-y-1">{elements}</div>;
}

export default function AyurvedaAiAssistant({ auth }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: `Namaste ${auth?.fullName || 'there'}! 🌿 I am your **Ayurveda AI Assistant**, grounded in classical Ayurvedic literature.\n\nAsk me any educational question about Ayurvedic concepts, therapies, Panchakarma procedures, or Doshas.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestedQuestions = [
    'What is Panchakarma?',
    'Explain Abhyanga.',
    'Explain Vata Dosha.',
    'Benefits of Shirodhara.',
    'Diet after Panchakarma.',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/ayurveda-ai/chat', { question: query });
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: data.answer || data.response || "I couldn't find this information in the Ayurveda knowledge base.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: "I couldn't find this information in the Ayurveda knowledge base.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full rounded-3xl border border-emerald-900/10 bg-white/90 shadow-sm overflow-hidden backdrop-blur-md">
      {/* Top Header Bar */}
      <div className="p-4 md:px-6 border-b border-emerald-900/10 bg-[#f7faf4] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1F4D3A] text-white shadow-md">
            <BookOpen size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg font-bold text-[#1F4D3A]">Ayurveda AI Assistant</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-300">
                Ayurveda Expert
              </span>
            </div>
            <p className="text-xs text-gray-600 flex items-center gap-1.5 mt-0.5">
              <Sparkles size={13} className="text-amber-600 shrink-0" />
              Educational Knowledge Base over Classical Texts
            </p>
          </div>
        </div>

        {/* Disclaimer Badge */}
        <div className="flex items-center gap-2 bg-amber-50/80 border border-amber-200/80 rounded-2xl px-3.5 py-2 text-[11px] text-amber-950 max-w-md">
          <ShieldAlert size={16} className="text-amber-700 shrink-0" />
          <span>
            <strong>Educational Only:</strong> Educational answers only. Never diagnoses, prescribes, or predicts recovery.
          </span>
        </div>
      </div>

      {/* Suggested Questions Bar */}
      <div className="bg-[#f0f6ec]/80 px-4 py-2.5 border-b border-emerald-900/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-xs font-bold text-emerald-900 shrink-0 flex items-center gap-1">
          💡 Suggested Questions:
        </span>
        <div className="flex items-center gap-2">
          {suggestedQuestions.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => handleSend(q)}
              disabled={loading}
              className="shrink-0 rounded-full border border-emerald-700/20 bg-white px-3.5 py-1 text-xs font-semibold text-emerald-900 hover:bg-[#1F4D3A] hover:text-white transition shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
            >
              • {q}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 max-w-[88%] md:max-w-[75%] ${
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-2xl text-xs font-semibold shrink-0 shadow-2xs ${
                msg.sender === 'user'
                  ? 'bg-[#1F4D3A] text-white'
                  : 'bg-[#e4efe0] text-emerald-900 border border-emerald-200'
              }`}
            >
              {msg.sender === 'user' ? <User size={16} /> : <Bot size={18} />}
            </div>

            <div className="flex flex-col">
              <div
                className={`rounded-3xl px-5 py-3.5 text-sm leading-relaxed shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-[#1F4D3A] text-white rounded-tr-none'
                    : 'bg-white text-gray-900 border border-emerald-900/10 rounded-tl-none'
                }`}
              >
                {msg.sender === 'user' ? msg.text : formatMarkdownText(msg.text)}
              </div>
              <span
                className={`text-[10px] mt-1 font-medium text-gray-400 ${
                  msg.sender === 'user' ? 'text-right mr-2' : 'ml-2'
                }`}
              >
                {msg.time}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3 max-w-[80%]">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#e4efe0] border border-emerald-200 text-emerald-900 text-xs font-semibold shrink-0">
              <Bot size={18} />
            </div>
            <div className="flex flex-col">
              <div className="bg-white text-gray-800 border border-emerald-900/10 rounded-3xl rounded-tl-none px-5 py-3.5 shadow-xs flex items-center gap-2">
                <RefreshCw size={15} className="animate-spin text-emerald-700" />
                <span className="text-xs font-semibold text-emerald-900">Retrieving classical Ayurveda knowledge...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 md:p-4 bg-[#f7faf4] border-t border-emerald-900/10 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask an educational question (e.g., Explain Abhyanga)..."
          disabled={loading}
          className="flex-1 bg-white border border-emerald-900/15 rounded-2xl outline-none text-sm text-gray-800 placeholder-gray-400 px-4 py-3 focus:border-[#1F4D3A] focus:ring-1 focus:ring-[#1F4D3A] transition disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1F4D3A] text-white shadow-md transition hover:bg-[#16392b] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95 shrink-0"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
