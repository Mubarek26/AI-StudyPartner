import React, { useRef, useState } from 'react';
import { Upload, File, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const FileUpload = ({ onUploaded, provider }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event) => {
    const selected = event.target.files && event.target.files[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
    }
  };

  const uploadFile = async () => {
    if (!file || isUploading) {
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('provider', (provider || 'gemini').toLowerCase());

      const response = await fetch(`${API_BASE_URL}/api/ingest`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = payload?.error || 'Upload failed.';
        throw new Error(message);
      }

      const payload = await response.json();
      if (onUploaded) {
        onUploaded({
          id: payload.documentId,
          name: file.name,
          sizeBytes: file.size,
          cloudinaryUrl: payload.cloudinaryUrl,
          chunks: payload.chunks
        });
      }

      setFile(null);
    } catch (err) {
      setError(err.message || 'Failed to upload.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="h-full w-full">
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              h-full w-full rounded-2xl border-2 border-dashed transition-all duration-300
              flex flex-col items-center justify-center gap-4 relative overflow-hidden
              ${isDragging 
                ? 'border-academic-500 bg-academic-50/50 dark:bg-academic-500/10 scale-[1.01]' 
                : 'border-gray-300 dark:border-gray-800 bg-white/50 dark:bg-gray-900/30 hover:border-academic-400 dark:hover:border-academic-500/50'}
            `}
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
              <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            </div>

            <div className={`
              p-4 rounded-2xl transition-all duration-500
              ${isDragging ? 'bg-academic-500 text-white shadow-xl scale-110' : 'bg-academic-100 dark:bg-academic-900/50 text-academic-600 dark:text-academic-400'}
            `}>
              <Upload size={32} />
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-bold dark:text-white">Drag & Drop Study Material</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Upload your PDF documents to start the AI session
              </p>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <button className="btn-secondary text-sm py-1.5" onClick={handleBrowseClick}>
                Browse Files
              </button>
              <span className="text-xs text-gray-400">Max size: 25MB</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />

            {isDragging && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-academic-500/10 backdrop-blur-[2px] pointer-events-none"
              />
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full w-full rounded-2xl border border-academic-200 dark:border-academic-500/30 bg-academic-50/30 dark:bg-academic-900/20 p-8 flex flex-col items-center justify-center text-center"
          >
            <div className="w-16 h-16 bg-academic-500 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-academic-500/20 relative">
              <File size={32} />
              <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1 border-4 border-white dark:border-[#0f0a1a]">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <h3 className="text-lg font-bold dark:text-white mb-1">{file.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for analysis</p>
            
            <div className="flex gap-3">
              <button className="btn-primary" onClick={uploadFile} disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Analyze Document'}
              </button>
              <button 
                onClick={() => setFile(null)}
                className="btn-secondary text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 border-red-200 dark:border-red-500/20"
                disabled={isUploading}
              >
                <X size={18} />
                Remove
              </button>
            </div>

            {error && (
              <p className="text-sm text-red-500 mt-4">{error}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileUpload;
