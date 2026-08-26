import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Sparkles, Wand2, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import DashboardLayout from '../components/DashboardLayout';

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

export default function WellnessBotPage({ auth, onLogout }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: `Hello ${auth?.fullName || 'there'}! 🌿 I am AyurBot, your AI Ayurvedic Wellness Companion. I see your dominant Dosha is ${auth?.dominantDosha || 'not assessed yet'}. How can I assist you with your health, diet, daily routine, or Panchakarma therapies today?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
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
      const { data } = await api.post('/patient/ai-recommendations', { query });
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: data.recommendations || data.advice || data.answer || 'I have analysed your health query based on classical Ayurvedic principles.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
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
  };

  return (
    <DashboardLayout auth={auth} onLogout={onLogout} activeTab="wellness">
      <div className="flex flex-col h-[calc(100vh-140px)] w-full rounded-3xl border border-emerald-900/10 bg-white/90 shadow-sm overflow-hidden">
        {/* Header bar inside card */}
        <div className="p-4 border-b border-sand/40 bg-[#f9fcf7] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center h-10 w-10 rounded-2xl bg-white/70 border border-sand hover:bg-white transition text-forest/70 hover:text-forest"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] shadow-md text-white">
              <Wand2 size={18} />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold leading-none text-forest">AyurBot</h1>
              <p className="mt-1 text-xs text-forest/60 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                AI Wellness Companion
              </p>
            </div>
          </div>
        </div>

        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-sage bg-[#eef6e6] border border-[#cfe0c2] rounded-full px-3 py-1.5">
          Dosha: {auth?.dominantDosha || 'Not Assessed'}
        </div>
      </div>

      {/* Main chat viewport */}
      <main className="relative z-10 flex-1 flex flex-col max-w-4xl w-full mx-auto p-4 justify-between overflow-hidden">
        {/* Messages container */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4 scrollbar-thin">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 max-w-[85%] ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-semibold shrink-0 ${
                  msg.sender === 'user'
                    ? 'bg-forest text-white'
                    : 'bg-[#e6efdf] text-sage border border-[#cfe0c2]'
                }`}
              >
                {msg.sender === 'user' ? <User size={14} /> : '🌿'}
              </div>

              <div className="flex flex-col">
                <div
                  className={`rounded-[1.4rem] px-4 py-3 text-sm leading-6 shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-forest text-white rounded-tr-none'
                      : 'bg-white/95 text-forest border border-sand/70 rounded-tl-none'
                  }`}
                >
                  <div>
                    {msg.sender === 'user' ? msg.text : formatBotMessage(msg.text)}
                  </div>
                </div>
                <span
                  className={`text-[10px] mt-1 text-forest/50 ${
                    msg.sender === 'user' ? 'text-right mr-1' : 'ml-1'
                  }`}
                >
                  {msg.time}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3 max-w-[80%]">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e6efdf] border border-[#cfe0c2] text-sage text-xs font-semibold">
                🌿
              </div>
              <div className="flex flex-col">
                <div className="bg-white/95 text-forest border border-sand/70 rounded-[1.4rem] rounded-tl-none px-4 py-3.5 shadow-sm flex items-center gap-1">
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
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.14em] text-forest/45 mb-2.5 ml-1">
              Ask about:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestionChips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleSend(chip)}
                  className="rounded-full border border-sand bg-white/80 px-3.5 py-2 text-xs font-medium text-forest hover:bg-forest hover:text-white transition shadow-sm active:scale-[0.98]"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="panel-frost rounded-[1.8rem] p-2 bg-white/90 border border-white/60 shadow-lg flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your health or wellness question here..."
            disabled={loading}
            className="flex-1 bg-transparent border-0 outline-none text-sm text-forest placeholder-forest/40 px-3 py-2 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#355c39_0%,#5a8553_100%)] text-white shadow-md transition hover:translate-y-[-1px] disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
          >
            <Send size={16} />
          </button>
        </form>
      </main>
    </div>
  </DashboardLayout>
);
}
