import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PDFViewer from '../components/PDFViewer';
import ChatInterface from '../components/ChatInterface';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const DocReader = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [provider] = useState(() => localStorage.getItem('chatProvider') || 'gemini');

  useEffect(() => {
    let isMounted = true;

    const loadDocument = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/documents/${id}`);
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          const message = payload?.error || 'Failed to load document.';
          throw new Error(message);
        }

        const payload = await response.json();
        const doc = payload.document
          ? { ...payload.document, id: payload.document._id }
          : null;
        if (isMounted) {
          setDocument(doc);
          setStatus('ready');
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load document.');
          setStatus('error');
        }
      }
    };

    loadDocument();

    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#050505] transition-colors duration-500 overflow-hidden font-sans">
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 flex items-center justify-between px-8 border-b border-gray-200 dark:border-gray-800 glass z-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800"
              title="Back to dashboard"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight dark:text-white">Document Reader</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {document?.filename || 'Loading document...'}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col p-4 md:p-6 gap-4 md:gap-6 overflow-y-auto lg:overflow-hidden">
          {status === 'loading' && (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
              Loading document...
            </div>
          )}

          {status === 'error' && (
            <div className="flex-1 flex items-center justify-center text-sm text-red-500">
              {error}
            </div>
          )}

          {status === 'ready' && (
            <section className="flex-1 flex flex-col lg:flex-row gap-4 md:gap-6 min-h-0">
              <div className="w-full lg:w-3/5 h-[500px] lg:h-full flex flex-col glass-card overflow-hidden">
                <PDFViewer document={document} />
              </div>
              <div className="w-full lg:w-2/5 h-[500px] lg:h-full flex flex-col glass-card overflow-hidden">
                <ChatInterface activeDoc={document} provider={provider} />
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default DocReader;
