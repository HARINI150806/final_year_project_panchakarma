import React, { useEffect, useState, useRef } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' }
];

export default function LanguageTranslator({ floating = false }) {
  const [selectedLang, setSelectedLang] = useState(() => {
    return localStorage.getItem('app_user_language') || 'en';
  });
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Global callback for Google Translate initialization
    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'en,ta,hi,te,ml,kn',
            autoDisplay: false,
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
          },
          'google_translate_element_hidden'
        );
      }
    };

    // Inject Google Translate script if not present
    const scriptId = 'google-translate-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    } else if (window.google && window.google.translate && window.googleTranslateElementInit) {
      window.googleTranslateElementInit();
    }
  }, []);

  const handleLanguageSelect = (langCode) => {
    setIsOpen(false);
    if (langCode === selectedLang) return;

    localStorage.setItem('app_user_language', langCode);
    setSelectedLang(langCode);

    const domain = window.location.hostname;

    if (langCode === 'en') {
      // Clear cookies to restore clean English
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}`;
    } else {
      // Set google translation cookie
      document.cookie = `googtrans=/en/${langCode}; path=/; domain=${domain}`;
      document.cookie = `googtrans=/en/${langCode}; path=/`;
    }

    // Trigger google select element if available
    const selectElem = document.querySelector('#google_translate_element_hidden select.goog-te-combo') || document.querySelector('select.goog-te-combo');
    if (selectElem) {
      selectElem.value = langCode;
      selectElem.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Refresh once smoothly to apply translation to 100% of DOM nodes
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const currentLangObj = LANGUAGES.find(l => l.code === selectedLang) || LANGUAGES[0];

  return (
    <div ref={containerRef} className={floating ? "fixed top-3.5 right-4 lg:right-8 z-[9990] font-sans" : "relative inline-block font-sans"}>
      {/* Off-screen hidden container for Google Translate element */}
      <div 
        id="google_translate_element_hidden" 
        style={{ position: 'fixed', top: '-9999px', left: '-9999px', opacity: 0, pointerEvents: 'none' }} 
      />

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-emerald-950 text-amber-200 border border-amber-400/40 shadow-sm backdrop-blur-md hover:bg-emerald-900 active:scale-95 transition-all duration-200 text-xs font-semibold cursor-pointer"
          title="Translate Website Language"
        >
          <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate max-w-[80px] sm:max-w-none">{currentLangObj.nativeName}</span>
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full mt-2 right-0 w-44 sm:w-48 bg-white border border-emerald-900/15 rounded-2xl shadow-2xl overflow-hidden py-1.5 z-[9999]">
            <div className="px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-emerald-900 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
              <span>Language</span>
              <span className="text-[10px] text-emerald-700 font-normal">Translate</span>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    selectedLang === lang.code
                      ? 'bg-emerald-100/80 text-emerald-950 font-bold'
                      : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-900'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold">{lang.nativeName}</span>
                    <span className="text-[10px] text-gray-500 font-normal">{lang.name}</span>
                  </div>
                  {selectedLang === lang.code && (
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
