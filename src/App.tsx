import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "./components/Sidebar";
import UploadPage from "./pages/UploadPage";
import EditorPage from "./pages/EditorPage";
import SettingsPage from "./pages/SettingsPage";
import DocsPage from "./pages/DocsPage";

export type AppPage = "upload" | "editor" | "settings" | "docs";

export interface FormattedDocument {
  title: string;
  content: string;
  rawText: string;
  formatting: DocumentFormatting;
  metadata: DocumentMetadata;
  jobId?: string;
}

export interface DocumentFormatting {
  font: string;
  fontSize: number;
  lineSpacing: number;
  margins: { top: number; right: number; bottom: number; left: number };
  theme: "professional" | "modern" | "academic" | "minimal" | "executive";
  primaryColor: string;
  headerStyle: "centered" | "left" | "banner";
  tableOfContents: boolean;
  pageNumbers: boolean;
  headerFooter: boolean;
}

export interface DocumentMetadata {
  wordCount: number;
  pageCount: number;
  readingTime: string;
  language: string;
  suggestions: string[];
}

const defaultFormatting: DocumentFormatting = {
  font: "Times New Roman",
  fontSize: 12,
  lineSpacing: 1.5,
  margins: { top: 1, right: 1, bottom: 1, left: 1.25 },
  theme: "professional",
  primaryColor: "#1e40af",
  headerStyle: "centered",
  tableOfContents: true,
  pageNumbers: true,
  headerFooter: true,
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>("upload");
  const [document, setDocument] = useState<FormattedDocument | null>(null);
  const [formatting, setFormatting] = useState<DocumentFormatting>(defaultFormatting);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden font-inter">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1f2937",
            color: "#f9fafb",
            border: "1px solid #374151",
            fontFamily: "Inter, sans-serif",
          },
        }}
      />
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        hasDocument={!!document}
      />
      <main
        className="flex-1 overflow-hidden transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? "72px" : "260px" }}
      >
        <AnimatePresence mode="wait">
          {currentPage === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="h-full"
            >
              <UploadPage
                setDocument={setDocument}
                setCurrentPage={setCurrentPage}
                formatting={formatting}
              />
            </motion.div>
          )}
          {currentPage === "editor" && (
            <motion.div
              key="editor"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="h-full"
            >
              <EditorPage
                document={document}
                setDocument={setDocument}
                formatting={formatting}
                setFormatting={setFormatting}
                setCurrentPage={setCurrentPage}
              />
            </motion.div>
          )}
          {currentPage === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="h-full"
            >
              <SettingsPage formatting={formatting} setFormatting={setFormatting} />
            </motion.div>
          )}
          {currentPage === "docs" && (
            <motion.div
              key="docs"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="h-full"
            >
              <DocsPage />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
