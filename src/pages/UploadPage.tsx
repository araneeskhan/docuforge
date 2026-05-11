import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Loader2,
  Zap,
  Brain,
  FileCheck,
  ArrowRight,
  X,
  Download,
} from "lucide-react";
import type { AppPage, FormattedDocument, DocumentFormatting } from "../App";
import { mockFormatDocument } from "../utils/mockAI";

interface UploadPageProps {
  setDocument: (doc: FormattedDocument) => void;
  setCurrentPage: (page: AppPage) => void;
  formatting: DocumentFormatting;
}

type ProcessingStep = {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  status: "pending" | "active" | "done" | "error";
};

const INITIAL_STEPS: ProcessingStep[] = [
  {
    id: "parse",
    label: "Parsing Document",
    description: "python-docx extracts text, runs, and paragraph metadata",
    icon: FileText,
    status: "pending",
  },
  {
    id: "nlp",
    label: "NLP Analysis",
    description: "spaCy + NLTK perform semantic structure analysis",
    icon: Brain,
    status: "pending",
  },
  {
    id: "ai",
    label: "Professional Reformatting",
    description: "Smart rules restructure content and optimize layout",
    icon: Sparkles,
    status: "pending",
  },
  {
    id: "format",
    label: "Applying Styles",
    description: "Professional typography and layout engine runs",
    icon: FileCheck,
    status: "pending",
  },
  {
    id: "done",
    label: "Document Ready",
    description: "DOCX and PDF export engines initialized",
    icon: CheckCircle,
    status: "pending",
  },
];

export default function UploadPage({ setDocument, setCurrentPage, formatting }: UploadPageProps) {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [steps, setSteps] = useState<ProcessingStep[]>(INITIAL_STEPS);
  const [done, setDone] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const updateStep = (id: string, status: ProcessingStep["status"]) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  };

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ];
    const validExt = /\.(docx|doc|txt)$/i.test(f.name);
    if (!validTypes.includes(f.type) && !validExt) {
      toast.error("Please upload a .docx, .doc, or .txt file");
      return;
    }
    setFile(f);
    setDone(false);
    setSteps(INITIAL_STEPS);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/msword": [".doc"],
      "text/plain": [".txt"],
    },
    multiple: false,
  });

  const handleProcess = async () => {
    if (!file) return;
    setProcessing(true);
    setDone(false);
    setSteps(INITIAL_STEPS);

    try {
      // 1. Upload & Start Job
      updateStep("parse", "active");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("config", JSON.stringify(formatting));

      const response = await fetch("http://localhost:8000/api/v1/format-document", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");
      const { job_id } = await response.json();
      updateStep("parse", "done");

      // 2. Poll for Completion
      let isComplete = false;
      let lastStatus = "";

      while (!isComplete) {
        const pollRes = await fetch(`http://localhost:8000/api/v1/jobs/${job_id}`);
        if (!pollRes.ok) throw new Error("Polling failed");
        
        const job = await pollRes.json();
        
        if (job.status !== lastStatus) {
          if (job.status === "processing") {
             updateStep("nlp", "active");
             // Simulate next steps as we don't have fine-grained status for all steps yet
             setTimeout(() => updateStep("nlp", "done"), 1000);
             setTimeout(() => updateStep("ai", "active"), 1200);
          }
          lastStatus = job.status;
        }

        if (job.status === "completed") {
          updateStep("ai", "done");
          updateStep("format", "active");
          
          // Map backend result to frontend structure
          const docResult: FormattedDocument = {
            title: job.result.title,
            content: job.result.content_html, // The backend generates this now
            rawText: "", // Not used in the UI, paragraphs omitted from backend to save bandwidth
            formatting: formatting,
            metadata: {
              wordCount: job.result.metadata?.word_count || 0,
              pageCount: job.result.metadata?.page_count || 1,
              readingTime: job.result.metadata?.reading_time || "1 min read",
              language: job.result.metadata?.language || "English",
              readabilityScore: job.result.metadata?.readability_score || 85,
              grammarErrorsFixed: job.result.metadata?.grammar_errors_fixed || 0,
              formattingChanges: job.result.metadata?.formatting_changes || 0,
              suggestions: job.result.metadata?.suggestions || [],
            },
            jobId: job_id
          };
          
          setDocument(docResult);
          setJobId(job_id);
          updateStep("format", "done");
          updateStep("done", "done");
          isComplete = true;
          setDone(true);
          toast.success("Document formatted successfully!");
        } else if (job.status === "failed") {
          throw new Error(job.error || "Processing failed");
        } else {
          // Wait before next poll
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Processing failed. Check your backend server.");
      setSteps((prev) => prev.map((s) => (s.status === "active" ? { ...s, status: "error" } : s)));
    } finally {
      setProcessing(false);
    }
  };


  const handleOpenEditor = () => {
    setCurrentPage("editor");
  };

  const handleExport = async (type: "docx" | "pdf") => {
    if (!jobId) {
      toast.error("Job ID missing. Please format the document first.");
      return;
    }
    setExporting(true);
    const loadingToast = toast.loading(`Generating ${type.toUpperCase()}...`);
    try {
      const response = await fetch(`http://localhost:8000/api/v1/export/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId, format: type, options: {} }),
      });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = `Formatted_Document.${type}`;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success(`${type.toUpperCase()} downloaded successfully!`);
    } catch (error) {
      toast.error("Failed to download file.");
    } finally {
      toast.dismiss(loadingToast);
      setExporting(false);
    }
  };

  const removeFile = (e: React.MouseEvent) => {
      e.stopPropagation();
      setFile(null);
      setSteps(INITIAL_STEPS);
      setDone(false);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900/80 border-b border-gray-800 px-8 py-5 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Upload size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Upload Document</h1>
            <p className="text-xs text-gray-400">Supports .docx, .doc, .txt — up to 50MB</p>
          </div>
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-300 font-medium">System Ready</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8 space-y-6">
        {/* Drop Zone */}
        <div
          {...getRootProps()}
          className={`
            relative rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 p-12
            flex flex-col items-center justify-center gap-4 text-center min-h-[240px]
            ${isDragActive
              ? "border-blue-400 bg-blue-500/10"
              : file
              ? "border-green-500/50 bg-green-500/5"
              : "border-gray-700 bg-gray-900/50 hover:border-blue-500/50 hover:bg-blue-500/5"
            }
          `}
        >
          <input {...getInputProps()} />
          {file ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center">
                <FileText size={28} className="text-green-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">{file.name}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {(file.size / 1024).toFixed(1)} KB • Ready to process
                </p>
              </div>
              <button
                onClick={removeFile}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                <Upload size={28} className={isDragActive ? "text-blue-400" : "text-gray-500"} />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">
                  {isDragActive ? "Drop your document here" : "Drag & drop your document"}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  or <span className="text-blue-400 font-medium">click to browse</span> • .docx, .doc, .txt
                </p>
              </div>
              <div className="flex gap-6 mt-2">
                {["DOCX", "DOC", "TXT"].map((ext) => (
                  <span key={ext} className="px-3 py-1 rounded-full bg-gray-800 text-gray-400 text-xs font-mono border border-gray-700">
                    .{ext.toLowerCase()}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Brain, color: "blue", title: "Rule-Based Logic", desc: "Deterministic professional styling, layout optimization, and auto-correction" },
            { icon: Zap, color: "purple", title: "python-docx Engine", desc: "Advanced OOXML manipulation with custom styles and typography" },
            { icon: FileCheck, color: "green", title: "Multi-Format Export", desc: "ReportLab PDF + python-docx DOCX with embedded metadata" },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className={`w-8 h-8 rounded-lg bg-${color}-500/20 flex items-center justify-center mb-3`}>
                <Icon size={16} className={`text-${color}-400`} />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Processing Steps */}
        <AnimatePresence>
          {(processing || done) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900 rounded-2xl border border-gray-800 p-6"
            >
              <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                <Sparkles size={14} className="text-blue-400" />
                Processing Pipeline
              </h3>
              <div className="space-y-3">
                {steps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: step.status === "pending" ? 0.4 : 1 }}
                      className="flex items-center gap-3"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                          step.status === "done"
                            ? "bg-green-500/20"
                            : step.status === "active"
                            ? "bg-blue-500/20 animate-pulse"
                            : step.status === "error"
                            ? "bg-red-500/20"
                            : "bg-gray-800"
                        }`}
                      >
                        {step.status === "done" ? (
                          <CheckCircle size={15} className="text-green-400" />
                        ) : step.status === "active" ? (
                          <Loader2 size={15} className="text-blue-400 animate-spin" />
                        ) : step.status === "error" ? (
                          <AlertCircle size={15} className="text-red-400" />
                        ) : (
                          <Icon size={15} className="text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium ${
                            step.status === "done"
                              ? "text-green-400"
                              : step.status === "active"
                              ? "text-blue-300"
                              : step.status === "error"
                              ? "text-red-400"
                              : "text-gray-600"
                          }`}
                        >
                          {step.label}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{step.description}</p>
                      </div>
                      {step.status === "active" && (
                        <div className="w-24 h-1.5 rounded-full bg-gray-800 overflow-hidden">
                          <motion.div
                            className="h-full bg-blue-500 rounded-full"
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex gap-4 w-full max-w-xl mx-auto">
          {!done ? (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleProcess}
              disabled={!file || processing}
              className="flex-1 flex items-center justify-center gap-3 py-4 rounded-xl font-semibold text-base transition-all
                bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500
                text-white shadow-lg shadow-blue-500/20
                disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {processing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Auto-Formatting in Progress...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Format Professionally
                </>
              )}
            </motion.button>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col gap-3 w-full"
            >
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleExport("docx")}
                  disabled={exporting}
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-base transition-all
                    bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                  Download DOCX
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleExport("pdf")}
                  disabled={exporting}
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-base transition-all
                    bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20 disabled:opacity-50"
                >
                  {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                  Download PDF
                </motion.button>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleOpenEditor}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-base transition-all
                  bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 hover:border-gray-600 shadow-lg"
              >
                Open Editor
                <ArrowRight size={18} />
              </motion.button>
            </motion.div>
          )}
        </div>

        {/* API Info Banner */}
        <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-4">
          <p className="text-xs font-mono text-gray-500 leading-relaxed">
            <span className="text-blue-400">POST</span>{" "}
            <span className="text-gray-300">http://localhost:8000/api/v1/format-document</span>
            {"  "}
            <span className="text-yellow-400 ml-2">• python-docx</span>
            <span className="text-purple-400 ml-2">• OOXML Engine</span>
            <span className="text-green-400 ml-2">• Smart Rules</span>
            <span className="text-pink-400 ml-2">• WeasyPrint</span>
            <span className="text-orange-400 ml-2">• spaCy</span>
          </p>
        </div>
      </div>
    </div>
  );
}
