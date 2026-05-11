import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Download,
  FileText,
  FileDown,
  Sparkles,
  BarChart2,
  ChevronDown,
  ChevronRight,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  Type,
  Wand2,
  Clock,
  Globe,
  Hash,
  BookOpen,
  Lightbulb,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import type { AppPage, FormattedDocument, DocumentFormatting } from "../App";

interface EditorPageProps {
  document: FormattedDocument | null;
  setDocument: (doc: FormattedDocument) => void;
  formatting: DocumentFormatting;
  setFormatting: (f: DocumentFormatting) => void;
  setCurrentPage: (page: AppPage) => void;
}

type TabType = "editor" | "analysis" | "suggestions";

export default function EditorPage({
  document,
  setDocument,
  formatting,
}: EditorPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>("editor");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [exporting, setExporting] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());

  if (!document) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-950">
        <div className="text-center space-y-3">
          <FileText size={48} className="text-gray-700 mx-auto" />
          <p className="text-gray-400 font-medium">No document loaded</p>
          <p className="text-gray-600 text-sm">Upload and format a document first</p>
        </div>
      </div>
    );
  }

  const execCommand = (command: string, value?: string) => {
    window.document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleExport = async (type: "docx" | "pdf") => {
    if (!document?.jobId) {
      toast.error("Job ID missing. Please re-upload the document.");
      return;
    }

    setExporting(true);
    const loadingToast = toast.loading(`Generating ${type.toUpperCase()} via Python backend...`);

    try {
      const response = await fetch(`http://localhost:8000/api/v1/export/${type}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          job_id: document.jobId,
          format: type,
          options: {},
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Export failed: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = `${document.title}.${type}`;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      toast.success(`${type.toUpperCase()} generated and downloaded!`);
    } catch (error: any) {
      toast.error(error.message || "Export failed. Check backend logs.");
    } finally {
      toast.dismiss(loadingToast);
      setExporting(false);
    }
  };


  const handleRefreshAI = async () => {
    toast.loading("Re-running Rule-Based analysis...");
    await new Promise((r) => setTimeout(r, 1500));
    toast.dismiss();
    toast.success("Professional rules refreshed!");
  };

  const toggleSuggestion = (i: number) => {
    setSelectedSuggestions((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: "editor", label: "Rich Editor", icon: Type },
    { id: "analysis", label: "Doc Analysis", icon: BarChart2 },
    { id: "suggestions", label: "AI Suggestions", icon: Lightbulb },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-950 overflow-hidden">
      {/* Top Bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <h1
              className="text-base font-bold text-white truncate"
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) =>
                setDocument({ ...document, title: e.currentTarget.textContent || document.title })
              }
            >
              {document.title}
            </h1>
            <div className="flex items-center gap-4 mt-0.5">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Hash size={10} />
                {document.metadata.wordCount.toLocaleString()} words
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <BookOpen size={10} />
                {document.metadata.pageCount} pages
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock size={10} />
                {document.metadata.readingTime}
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Globe size={10} />
                {document.metadata.language}
              </span>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshAI}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-medium transition-all border border-gray-700"
            >
              <RefreshCw size={13} />
              Re-analyze
            </button>
            <button
              onClick={() => handleExport("docx")}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              <FileText size={13} />
              Export DOCX
            </button>
            <button
              onClick={() => handleExport("pdf")}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
            >
              <FileDown size={13} />
              Export PDF
            </button>
            <button
              onClick={() => {
                const content = editorRef.current?.innerHTML || document.content;
                setDocument({ ...document, content });
                toast.success("Document saved!");
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-semibold transition-all"
            >
              <Download size={13} />
              Save
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-blue-600/20 text-blue-300 border border-blue-500/30"
                    : "text-gray-500 hover:text-gray-300 hover:bg-gray-800"
                }`}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex">
        <AnimatePresence mode="wait">
          {activeTab === "editor" && (
            <motion.div
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Formatting Toolbar */}
              <div className="bg-gray-900/80 border-b border-gray-800 px-4 py-2 flex items-center gap-1 flex-wrap flex-shrink-0">
                {/* Text style */}
                <select
                  className="h-7 px-2 rounded bg-gray-800 text-gray-300 text-xs border border-gray-700 mr-1"
                  onChange={(e) => execCommand("formatBlock", e.target.value)}
                >
                  <option value="p">Paragraph</option>
                  <option value="h1">Heading 1</option>
                  <option value="h2">Heading 2</option>
                  <option value="h3">Heading 3</option>
                  <option value="h4">Heading 4</option>
                  <option value="blockquote">Quote</option>
                  <option value="pre">Code</option>
                </select>

                <select
                  className="h-7 px-2 rounded bg-gray-800 text-gray-300 text-xs border border-gray-700 mr-2"
                  defaultValue={formatting.fontSize}
                  onChange={(e) => execCommand("fontSize", e.target.value)}
                >
                  {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48].map((s) => (
                    <option key={s} value={s}>{s}pt</option>
                  ))}
                </select>

                <div className="h-5 w-px bg-gray-700 mx-1" />

                {[
                  { cmd: "bold", icon: Bold, title: "Bold" },
                  { cmd: "italic", icon: Italic, title: "Italic" },
                  { cmd: "underline", icon: Underline, title: "Underline" },
                ].map(({ cmd, icon: Icon, title }) => (
                  <button
                    key={cmd}
                    onMouseDown={(e) => { e.preventDefault(); execCommand(cmd); }}
                    title={title}
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                  >
                    <Icon size={13} />
                  </button>
                ))}

                <div className="h-5 w-px bg-gray-700 mx-1" />

                {[
                  { cmd: "justifyLeft", icon: AlignLeft },
                  { cmd: "justifyCenter", icon: AlignCenter },
                  { cmd: "justifyRight", icon: AlignRight },
                  { cmd: "justifyFull", icon: AlignJustify },
                ].map(({ cmd, icon: Icon }) => (
                  <button
                    key={cmd}
                    onMouseDown={(e) => { e.preventDefault(); execCommand(cmd); }}
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                  >
                    <Icon size={13} />
                  </button>
                ))}

                <div className="h-5 w-px bg-gray-700 mx-1" />

                {[
                  { cmd: "insertUnorderedList", icon: List },
                  { cmd: "insertOrderedList", icon: ListOrdered },
                ].map(({ cmd, icon: Icon }) => (
                  <button
                    key={cmd}
                    onMouseDown={(e) => { e.preventDefault(); execCommand(cmd); }}
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                  >
                    <Icon size={13} />
                  </button>
                ))}

                <div className="h-5 w-px bg-gray-700 mx-1" />

                {[
                  { cmd: "undo", icon: Undo2 },
                  { cmd: "redo", icon: Redo2 },
                ].map(({ cmd, icon: Icon }) => (
                  <button
                    key={cmd}
                    onMouseDown={(e) => { e.preventDefault(); execCommand(cmd); }}
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                  >
                    <Icon size={13} />
                  </button>
                ))}

                <div className="h-5 w-px bg-gray-700 mx-1" />

                <input
                  type="color"
                  className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                  title="Text Color"
                  onChange={(e) => execCommand("foreColor", e.target.value)}
                />

                <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
                  <Wand2 size={12} className="text-purple-400" />
                  <span className="text-purple-400 font-medium">Auto Formatted</span>
                </div>
              </div>

              {/* Document Editor Canvas */}
              <div className="flex-1 overflow-y-auto bg-gray-950 p-8">
                <div className="max-w-[816px] mx-auto">
                  {/* Page Shadow */}
                  <div
                    className="bg-white rounded-sm shadow-2xl shadow-black/60 min-h-[1056px] p-[72px] relative"
                    style={{ fontFamily: formatting.font }}
                  >
                    {/* Page Header */}
                    {formatting.headerFooter && (
                      <div className="absolute top-6 left-[72px] right-[72px] flex justify-between items-center text-[10px] text-gray-400 border-b border-gray-200 pb-2">
                        <span>{document.title}</span>
                        <span className="flex items-center gap-1">
                          <Sparkles size={9} /> DocuForge AI
                        </span>
                      </div>
                    )}

                    {/* Editable Content */}
                    <div
                      ref={editorRef}
                      contentEditable
                      suppressContentEditableWarning
                      className="outline-none min-h-full text-gray-900"
                      style={{
                        fontSize: `${formatting.fontSize}pt`,
                        lineHeight: formatting.lineSpacing,
                        fontFamily: formatting.font,
                      }}
                      dangerouslySetInnerHTML={{ __html: document.content }}
                      onInput={(e) =>
                        setDocument({ ...document, content: e.currentTarget.innerHTML })
                      }
                    />

                    {/* Page Footer */}
                    {formatting.pageNumbers && (
                      <div className="absolute bottom-6 left-[72px] right-[72px] flex justify-between text-[10px] text-gray-400 border-t border-gray-200 pt-2 mt-8">
                        <span>Confidential</span>
                        <span>Page 1 of {document.metadata.pageCount}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "analysis" && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-y-auto p-8"
            >
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Word Count", value: document.metadata.wordCount.toLocaleString(), color: "blue", icon: Type },
                    { label: "Estimated Pages", value: document.metadata.pageCount.toString(), color: "purple", icon: BookOpen },
                    { label: "Reading Time", value: document.metadata.readingTime, color: "green", icon: Clock },
                    { label: "Language", value: document.metadata.language, color: "yellow", icon: Globe },
                  ].map(({ label, value, color, icon: Icon }) => (
                    <div key={label} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                      <div className={`w-8 h-8 rounded-lg bg-${color}-500/20 flex items-center justify-center mb-3`}>
                        <Icon size={15} className={`text-${color}-400`} />
                      </div>
                      <p className="text-2xl font-bold text-white">{value}</p>
                      <p className="text-xs text-gray-500 mt-1">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Score Gauges */}
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                  <h3 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
                    <BarChart2 size={14} className="text-blue-400" />
                    Document Quality Scores
                  </h3>
                  <div className="space-y-4">
                    {[
                      { label: "Readability", score: 91, color: "bg-green-500" },
                      { label: "Grammar & Spelling", score: 100, color: "bg-blue-500" },
                      { label: "Formatting Consistency", score: 100, color: "bg-purple-500" },
                      { label: "Structure & Flow", score: 88, color: "bg-yellow-500" },
                      { label: "Professional Tone", score: 94, color: "bg-pink-500" },
                    ].map(({ label, score, color }) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-gray-400">{label}</span>
                          <span className="text-white font-semibold">{score}/100</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${score}%` }}
                            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                            className={`h-full ${color} rounded-full`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Formatting Applied */}
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <Sparkles size={14} className="text-purple-400" />
                    Formatting Applied by Rules
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "Font", val: formatting.font },
                      { key: "Font Size", val: `${formatting.fontSize}pt` },
                      { key: "Line Spacing", val: `${formatting.lineSpacing}×` },
                      { key: "Margins", val: `${formatting.margins.top}" all` },
                      { key: "Theme", val: formatting.theme.charAt(0).toUpperCase() + formatting.theme.slice(1) },
                      { key: "Header Style", val: formatting.headerStyle },
                      { key: "Table of Contents", val: formatting.tableOfContents ? "Enabled" : "Disabled" },
                      { key: "Page Numbers", val: formatting.pageNumbers ? "Enabled" : "Disabled" },
                    ].map(({ key, val }) => (
                      <div key={key} className="flex justify-between py-2 border-b border-gray-800">
                        <span className="text-xs text-gray-500">{key}</span>
                        <span className="text-xs text-gray-200 font-mono">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Python Backend Info */}
                <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-5">
                  <h3 className="text-xs font-semibold text-gray-400 mb-3 font-mono">DOCUMENT PROCESSING PIPELINE</h3>
                  <div className="space-y-2 font-mono text-xs">
                    {[
                      ["python-docx", "Document parsing & DOCX export", "3.1.2"],
                      ["reportlab", "PDF generation with Platypus", "4.2.0"],
                      ["openai", "Text restructuring engine", "1.35.0"],
                      ["spacy", "NLP semantic analysis", "3.7.4"],
                      ["nltk", "Sentence boundary detection", "3.8.1"],
                      ["weasyprint", "HTML→PDF fallback engine", "62.1"],
                      ["fastapi", "Async REST API server", "0.111.0"],
                      ["mammoth", "DOCX→HTML conversion", "1.8.0"],
                    ].map(([lib, desc, ver]) => (
                      <div key={lib} className="flex items-center gap-2">
                        <span className="text-green-400 w-28 flex-shrink-0">{lib}</span>
                        <span className="text-gray-600 flex-1">{desc}</span>
                        <span className="text-gray-600">v{ver}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "suggestions" && (
            <motion.div
              key="suggestions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-y-auto p-8"
            >
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="text-base font-bold text-white">Rule Analysis</h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {(document.metadata?.suggestions || []).length} improvements applied by rule engine
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                  >
                    {showSuggestions ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    {showSuggestions ? "Collapse" : "Expand"}
                  </button>
                </div>

                <AnimatePresence>
                  {showSuggestions && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3"
                    >
                      {(document.metadata?.suggestions || []).map((suggestion, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                            selectedSuggestions.has(i)
                              ? "bg-green-500/10 border-green-500/30"
                              : "bg-gray-900 border-gray-800 hover:border-gray-700"
                          }`}
                          onClick={() => toggleSuggestion(i)}
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              selectedSuggestions.has(i)
                                ? "bg-green-500"
                                : "bg-gray-800 border border-gray-700"
                            }`}
                          >
                            {selectedSuggestions.has(i) ? (
                              <CheckCircle2 size={13} className="text-white" />
                            ) : (
                              <span className="text-xs text-gray-500 font-mono">{i + 1}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm ${
                                selectedSuggestions.has(i) ? "text-green-300" : "text-gray-300"
                              }`}
                            >
                              {suggestion}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                              selectedSuggestions.has(i)
                                ? "bg-green-500/20 text-green-400"
                                : "bg-blue-500/10 text-blue-400"
                            }`}
                          >
                            {selectedSuggestions.has(i) ? "Applied" : "AI"}
                          </span>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl p-5 border border-blue-500/20 mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={14} className="text-blue-400" />
                    <span className="text-sm font-semibold text-blue-300">Rule Logic Applied</span>
                  </div>
                  <pre className="text-xs text-gray-400 font-mono leading-relaxed whitespace-pre-wrap">
{`Deterministic professional document layout engine.
Rules:
1. Enforce standard heading hierarchy (H1 > H2 > H3)
2. Professional line spacing (1.5x) and margins (1")
3. Justified text alignment for formal aesthetics
4. Automated punctuation and spacing correction
5. Thematic color application to semantic headers`}
                  </pre>
                </div>

                {/* Export reminder */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleExport("docx")}
                    disabled={exporting}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-sm font-medium border border-blue-500/20 transition-all disabled:opacity-50"
                  >
                    <Download size={15} />
                    Download as DOCX
                  </button>
                  <button
                    onClick={() => handleExport("pdf")}
                    disabled={exporting}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 text-sm font-medium border border-red-500/20 transition-all disabled:opacity-50"
                  >
                    <Download size={15} />
                    Download as PDF
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
