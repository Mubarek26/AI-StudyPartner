import { 
  Files, 
  Settings, 
  Plus,
  FileText,
  Clock,
  Star,
  Trash2,
  MoreVertical,
  Zap,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = ({ documents, activeDoc, setActiveDoc, onDelete, onNewSession, onOpenSettings, onClose }) => {
  return (
    <aside className="w-72 h-full border-r border-gray-200 dark:border-gray-800 flex flex-col glass relative">
      <div className="p-6 flex items-center justify-between">
        <button
          className="flex-1 btn-primary group"
          type="button"
          onClick={onNewSession}
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          <span>New Session</span>
        </button>
        <button 
          onClick={onClose}
          className="ml-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden text-gray-500"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar space-y-8">
        <div>
          <h2 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>Documents</span>
            <Files size={14} />
          </h2>
          <div className="space-y-1">
            {documents.map((doc) => (
              <motion.div
                key={doc.id}
                whileHover={{ x: 4 }}
                onClick={() => setActiveDoc(doc)}
                className={`
                  group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all
                  ${activeDoc?.id === doc.id 
                    ? 'bg-academic-50 dark:bg-academic-500/10 text-academic-600 dark:text-academic-400 border border-academic-100 dark:border-academic-500/20 shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'}
                `}
              >
                <div className={`
                  p-2 rounded-lg transition-colors
                  ${activeDoc?.id === doc.id ? 'bg-academic-100 dark:bg-academic-500/20' : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'}
                `}>
                  <FileText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{doc.size} • {doc.date}</p>
                </div>
                <button
                  type="button"
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-colors"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (onDelete) {
                      onDelete(doc.id);
                    }
                  }}
                  title="Delete document"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>Library</span>
            <Clock size={14} />
          </h2>
          <div className="space-y-1">
            {[
              { icon: Star, label: 'Favorites', count: 12 },
              { icon: Trash2, label: 'Trash', count: 4 },
            ].map((item, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 cursor-pointer transition-all"
              >
                <item.icon size={18} />
                <span className="text-sm font-medium flex-1">{item.label}</span>
                <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="p-4 bg-gradient-to-br from-academic-500 to-indigo-600 rounded-2xl text-white relative overflow-hidden group cursor-pointer shadow-lg shadow-academic-500/20">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Zap size={64} fill="currentColor" />
          </div>
          <p className="text-xs font-medium text-academic-100 opacity-80 mb-1">Upgrade to Pro</p>
          <p className="text-sm font-bold mb-3">Get Advanced AI Models</p>
          <button className="text-xs font-bold py-2 px-4 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg transition-colors">
            Learn More
          </button>
        </div>
        
        <button
          type="button"
          onClick={onOpenSettings}
          className="mt-4 w-full flex items-center gap-3 px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-xl cursor-pointer transition-all"
        >
          <Settings size={18} />
          <span className="text-sm font-medium">Settings</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
