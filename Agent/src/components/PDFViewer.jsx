import React from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  Printer, 
  ChevronLeft, 
  ChevronRight,
  Maximize2
} from 'lucide-react';

const PDFViewer = ({ document }) => {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0a]">
      {/* Viewer Toolbar */}
      <div className="h-12 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-medium px-2 dark:text-gray-300">Page 1 / 12</span>
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-700"></div>
          <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
              <ZoomOut size={16} />
            </button>
            <span className="text-xs font-medium px-2 dark:text-gray-300">100%</span>
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
              <ZoomIn size={16} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {[RotateCw, Download, Printer, Maximize2].map((Icon, idx) => (
            <button key={idx} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 transition-colors">
              <Icon size={16} />
            </button>
          ))}
        </div>
      </div>

      {/* Viewer Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-gray-200 dark:bg-[#121212] flex flex-col items-center gap-8">
        {/* Mock PDF Pages */}
        {[1, 2, 3].map((page) => (
          <div 
            key={page}
            className="w-full max-w-2xl aspect-[1/1.414] bg-white dark:bg-gray-900 shadow-2xl rounded-sm border border-gray-300 dark:border-gray-800 p-12 relative overflow-hidden shrink-0 group"
          >
            {/* Academic Content Placeholder */}
            <div className="space-y-6 opacity-30 group-hover:opacity-40 transition-opacity">
              <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-800 rounded-md"></div>
              <div className="space-y-3">
                <div className="h-4 w-full bg-gray-100 dark:bg-gray-800/50 rounded"></div>
                <div className="h-4 w-full bg-gray-100 dark:bg-gray-800/50 rounded"></div>
                <div className="h-4 w-5/6 bg-gray-100 dark:bg-gray-800/50 rounded"></div>
              </div>
              <div className="h-40 w-full bg-gray-100 dark:bg-gray-800/50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-xs font-mono text-gray-400">[Figure {page}.1: Statistical Distribution Diagram]</p>
              </div>
              <div className="space-y-3">
                <div className="h-4 w-full bg-gray-100 dark:bg-gray-800/50 rounded"></div>
                <div className="h-4 w-full bg-gray-100 dark:bg-gray-800/50 rounded"></div>
                <div className="h-4 w-2/3 bg-gray-100 dark:bg-gray-800/50 rounded"></div>
              </div>
            </div>

            {/* Page number */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 font-medium">
              - Page {page} -
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PDFViewer;
