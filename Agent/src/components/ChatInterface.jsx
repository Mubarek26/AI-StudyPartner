import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Zap, 
  Sparkles, 
  User, 
  Bot, 
  MoreHorizontal,
  Paperclip,
  Smile,
  BrainCircuit
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const ChatInterface = ({ activeDoc, provider }) => {
  const providerLabel = provider === 'groq' ? 'Groq' : 'Gemini';
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      role: 'assistant', 
      content: "Hello! I've analyzed your document. I can help you understand the concepts, summarize sections, or generate a practice quiz. What would you like to start with?",
      timestamp: '10:00 AM'
    },
  ]);
  const [input, setInput] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizError, setQuizError] = useState(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [providerUsed, setProviderUsed] = useState(null);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      if (!activeDoc?.id) {
        const assistantMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: 'Please upload and select a document so I can answer questions about it.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, assistantMessage]);
        return;
      }

      const history = [...messages, userMessage]
        .slice(-6)
        .map((item) => ({ role: item.role, content: item.content }));

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          documentId: activeDoc.id,
          history,
          provider: (provider || 'gemini').toLowerCase()
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = payload?.error || 'Failed to get a response.';
        throw new Error(message);
      }

      const payload = await response.json();
      if (payload.providerUsed) {
        setProviderUsed(payload.providerUsed);
      }
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: payload.finalAnswer || 'No response available yet.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: error.message || 'Failed to get a response.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!activeDoc?.id || isGeneratingQuiz) {
      return;
    }

    setQuizError(null);
    setIsGeneratingQuiz(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: activeDoc.id, provider: (provider || 'gemini').toLowerCase() })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = payload?.error || 'Failed to generate quiz.';
        throw new Error(message);
      }

      const payload = await response.json();
      setQuiz(payload);
      setShowAnswers(false);
    } catch (error) {
      setQuizError(error.message || 'Failed to generate quiz.');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0a] relative">
      {/* Chat Header */}
      <div className="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 bg-white dark:bg-gray-900/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-academic-100 dark:bg-academic-500/20 text-academic-600 dark:text-academic-400 flex items-center justify-center">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold dark:text-white flex items-center gap-2">
              Study AI
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            </h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
              Always online • {providerLabel}{providerUsed ? ` (using ${providerUsed})` : ''}
            </p>
          </div>
        </div>
        
        <button
          className="btn-primary py-1.5 px-3 text-xs bg-gradient-to-r from-academic-600 to-indigo-600 border-none shadow-academic-500/30"
          onClick={handleGenerateQuiz}
          disabled={!activeDoc?.id || isGeneratingQuiz}
          title={!activeDoc?.id ? 'Upload a document first' : 'Generate a quiz'}
        >
          <BrainCircuit size={14} />
          {isGeneratingQuiz ? 'Generating...' : 'Generate Quiz'}
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {quizError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 text-red-600 text-sm px-4 py-3">
            {quizError}
          </div>
        )}

        {quiz && (
          <div className="rounded-2xl border border-academic-200 dark:border-academic-500/30 bg-academic-50/60 dark:bg-academic-900/20 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Quiz</p>
                <h4 className="text-sm font-bold dark:text-white">{quiz.title || 'Practice Quiz'}</h4>
              </div>
              <button
                className="btn-secondary text-xs py-1.5"
                onClick={() => setShowAnswers((prev) => !prev)}
              >
                {showAnswers ? 'Hide Answers' : 'Show Answers'}
              </button>
            </div>
            <div className="space-y-4">
              {quiz.questions?.map((question, idx) => (
                <div key={question.id || idx} className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase text-gray-400">Question {idx + 1}</p>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                      {question.difficulty || 'medium'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium dark:text-white">{question.question}</p>
                  {question.options?.length ? (
                    <ul className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                      {question.options.map((option, optionIdx) => (
                        <li key={`${question.id || idx}-option-${optionIdx}`}>
                          {option}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {showAnswers && (
                    <div className="mt-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 px-3 py-2 text-xs text-gray-600 dark:text-gray-300">
                      <p><span className="font-semibold">Answer:</span> {question.answer}</p>
                      <p className="mt-1"><span className="font-semibold">Why:</span> {question.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`
              w-8 h-8 rounded-lg flex items-center justify-center shrink-0
              ${msg.role === 'user' ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-academic-100 dark:bg-academic-500/20 text-academic-600 dark:text-academic-400'}
            `}>
              {msg.role === 'user' ? <User size={18} /> : <Sparkles size={16} />}
            </div>
            
            <div className={`
              max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed
              ${msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200 dark:border-gray-800'}
            `}>
              {msg.content}
              <div className={`text-[10px] mt-2 opacity-60 ${msg.role === 'user' ? 'text-white' : 'text-gray-500'}`}>
                {msg.timestamp}
              </div>
            </div>
          </motion.div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 pt-0">
        <div className="relative group">
          <div className="absolute inset-0 bg-academic-500/10 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
          <div className="relative flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-2 transition-all group-focus-within:border-academic-500/50 group-focus-within:ring-2 group-focus-within:ring-academic-500/10">
            <button className="p-2 text-gray-400 hover:text-academic-500 transition-colors">
              <Paperclip size={18} />
            </button>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything about your document..." 
              className="flex-1 bg-transparent border-none outline-none text-sm py-2 dark:text-white"
            />
            <button className="p-2 text-gray-400 hover:text-academic-500 transition-colors">
              <Smile size={18} />
            </button>
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              className={`
                p-2.5 rounded-xl transition-all
                ${input.trim() && !isSending
                  ? 'bg-academic-600 text-white shadow-lg shadow-academic-500/20 active:scale-95' 
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600'}
              `}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
        <p className="text-[10px] text-center text-gray-400 mt-4 font-medium flex items-center justify-center gap-1">
          <Zap size={10} className="text-amber-500" /> Powered by Academic AI GPT-4o
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
