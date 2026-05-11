import { motion } from "framer-motion";
import {
  FileText,
  Upload,
  Settings,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
} from "lucide-react";
import type { AppPage } from "../App";

interface SidebarProps {
  currentPage: AppPage;
  setCurrentPage: (page: AppPage) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  hasDocument: boolean;
}

const navItems = [
  { id: "upload" as AppPage, icon: Upload, label: "Upload Document", always: true },
  { id: "editor" as AppPage, icon: FileText, label: "Document Editor", always: false },
  { id: "settings" as AppPage, icon: Settings, label: "Format Settings", always: true },
  { id: "docs" as AppPage, icon: BookOpen, label: "User Guide & Help", always: true },
];

export default function Sidebar({
  currentPage,
  setCurrentPage,
  collapsed,
  setCollapsed,
  hasDocument,
}: SidebarProps) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed top-0 left-0 h-full bg-gray-900 border-r border-gray-800 z-40 flex flex-col overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
            <Sparkles size={18} className="text-white" />
          </div>
          <AnimatedLabel show={!collapsed}>
            <span className="font-bold text-white text-base whitespace-nowrap">DocuForge</span>
            <span className="text-blue-400 font-bold text-base"> Pro</span>
          </AnimatedLabel>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto flex-shrink-0 w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* AI Badge */}
      {!collapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="mx-4 mt-4 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-900/40 to-green-900/40 border border-green-500/20"
        >
          <div className="flex items-center gap-2">
            <Zap size={12} className="text-yellow-400" />
            <span className="text-xs text-blue-300 font-medium">Professional Rule Engine</span>
          </div>
        </motion.div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const disabled = !item.always && !hasDocument;
          const active = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => !disabled && setCurrentPage(item.id)}
              disabled={disabled}
              title={collapsed ? item.label : undefined}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                ${active
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : disabled
                  ? "text-gray-600 cursor-not-allowed"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }
              `}
            >
              {active && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 rounded-xl bg-blue-600/10 border border-blue-500/20"
                  transition={{ duration: 0.2 }}
                />
              )}
              <Icon
                size={18}
                className={`flex-shrink-0 relative z-10 ${active ? "text-blue-400" : ""}`}
              />
              <AnimatedLabel show={!collapsed}>
                <span className="text-sm font-medium whitespace-nowrap relative z-10">
                  {item.label}
                </span>
                {disabled && (
                  <span className="text-xs text-gray-600 whitespace-nowrap ml-auto">No doc</span>
                )}
              </AnimatedLabel>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 border-t border-gray-800"
        >
          <div className="text-xs text-gray-600 space-y-1">
            <p className="font-medium text-gray-500">DocuForge Pro v2.0</p>
            <p>Python Rule-Based Engine</p>
            <p className="text-blue-500/70">python-docx • ReportLab • WeasyPrint</p>
          </div>
        </motion.div>
      )}
    </motion.aside>
  );
}

function AnimatedLabel({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <motion.div
      animate={{ opacity: show ? 1 : 0, width: show ? "auto" : 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden flex items-center gap-2 min-w-0 flex-1"
    >
      {children}
    </motion.div>
  );
}
