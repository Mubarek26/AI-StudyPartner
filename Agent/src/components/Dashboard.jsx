import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Upload, 
  MessageSquare, 
  Zap, 
  Files, 
  Settings, 
  Moon, 
  Sun, 
  Plus,
  Search,
  ChevronRight,
  MoreVertical,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import FileUpload from './FileUpload';
import PDFViewer from './PDFViewer';
import ChatInterface from './ChatInterface';

const API_BASE_URL = 'http://localhost:4000';

const Dashboard = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeDoc, setActiveDoc] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [sessionKey, setSessionKey] = useState(0);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    let isMounted = true;

    const loadDocuments = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/documents`);
        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        const docs = (payload.documents || []).map((doc) => {
          const sizeMb = (doc.sizeBytes / (1024 * 1024)).toFixed(2);
          return {
            id: doc._id,
            name: doc.filename,
            size: `${sizeMb} MB`,
            date: doc.createdAt ? doc.createdAt.slice(0, 10) : '',
            cloudinaryUrl: doc.cloudinaryUrl,
            chunks: doc.chunks
          };
        });

        if (isMounted) {
          setDocuments(docs);
          if (docs.length) {
            setActiveDoc((prev) => prev || docs[0]);
          }
        }
      } catch (error) {
        // Ignore load failures to keep UI responsive.
      }
    };

    loadDocuments();

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleUploaded = (payload) => {
    const created = new Date();
    const sizeMb = (payload.sizeBytes / (1024 * 1024)).toFixed(2);
    const doc = {
      id: payload.id,
      name: payload.name,
      size: `${sizeMb} MB`,
      date: created.toISOString().slice(0, 10),
      cloudinaryUrl: payload.cloudinaryUrl,
      chunks: payload.chunks
    };

    setDocuments((prev) => [doc, ...prev]);
    setActiveDoc(doc);
  };

  const handleNewSession = () => {
    setActiveDoc(null);
    setSessionKey((prev) => prev + 1);
  };

  const handleDelete = async (docId) => {
    if (!docId) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/${docId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        return;
      }

      setDocuments((prev) => {
        const next = prev.filter((doc) => doc.id !== docId);
        setActiveDoc((current) => {
          if (!current || current.id !== docId) {
            return current;
          }
          return next[0] || null;
        });
        return next;
      });
    } catch (error) {
      // Ignore delete failures to keep UI responsive.
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#050505] transition-colors duration-500 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar 
        documents={documents} 
        activeDoc={activeDoc} 
        setActiveDoc={setActiveDoc}
        onDelete={handleDelete}
        onNewSession={handleNewSession}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-gray-200 dark:border-gray-800 glass z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-academic-600 flex items-center justify-center text-white shadow-lg shadow-academic-500/30">
              <BookOpen size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight dark:text-white">StudyPartner AI</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Your personal academic assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search documents or notes..." 
                className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-900/50 border-none rounded-xl text-sm focus:ring-2 focus:ring-academic-500 transition-all outline-none w-64"
              />
            </div>
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-academic-500 to-indigo-600 p-0.5 cursor-pointer">
              <div className="w-full h-full rounded-full border-2 border-white dark:border-gray-950 overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col p-6 gap-6 overflow-hidden">
          {/* Top Section: Upload Zone */}
          <section className="h-1/3 min-h-[200px]">
            <FileUpload onUploaded={handleUploaded} />
          </section>

          {/* Bottom Section: Split Screen */}
          <section className="flex-1 flex gap-6 min-h-0">
            {/* Left side: PDF Viewer */}
            <div className="w-3/5 flex flex-col glass-card overflow-hidden">
              <PDFViewer document={activeDoc} />
            </div>

            {/* Right side: Chat Interface */}
            <div className="w-2/5 flex flex-col glass-card overflow-hidden">
              <ChatInterface key={sessionKey} activeDoc={activeDoc} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
