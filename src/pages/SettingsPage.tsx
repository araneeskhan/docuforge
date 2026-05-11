import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Settings,
  Type,
  AlignJustify,
  Palette,
  Layout,
  Save,
  RotateCcw,
  CheckSquare,
} from "lucide-react";
import type { DocumentFormatting } from "../App";

interface SettingsPageProps {
  formatting: DocumentFormatting;
  setFormatting: (f: DocumentFormatting) => void;
}

const FONTS = [
  "Times New Roman",
  "Calibri",
  "Arial",
  "Georgia",
  "Garamond",
  "Helvetica Neue",
  "Palatino Linotype",
  "Book Antiqua",
  "Cambria",
  "Trebuchet MS",
];

const THEMES = [
  { id: "professional", label: "Professional", desc: "Corporate standard — dark blue headers, clean lines", color: "#1e40af" },
  { id: "modern", label: "Modern", desc: "Contemporary design — gradient accents, bold typography", color: "#7c3aed" },
  { id: "academic", label: "Academic", desc: "Research paper — Times New Roman, APA/MLA compliant", color: "#1e293b" },
  { id: "minimal", label: "Minimal", desc: "Clean whitespace — pure typography, no decoration", color: "#374151" },
  { id: "executive", label: "Executive", desc: "C-suite ready — luxury serif fonts, gold accents", color: "#92400e" },
] as const;

const HEADER_STYLES = [
  { id: "centered", label: "Centered", desc: "Title centered on page" },
  { id: "left", label: "Left Aligned", desc: "Title flush left" },
  { id: "banner", label: "Banner", desc: "Full-width colored header banner" },
] as const;

export default function SettingsPage({ formatting, setFormatting }: SettingsPageProps) {
  const update = (key: keyof DocumentFormatting, value: unknown) => {
    setFormatting({ ...formatting, [key]: value });
  };

  const updateMargin = (side: keyof DocumentFormatting["margins"], value: number) => {
    setFormatting({
      ...formatting,
      margins: { ...formatting.margins, [side]: value },
    });
  };

  const resetDefaults = () => {
    setFormatting({
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
    });
    toast.success("Reset to professional defaults");
  };

  const saveSettings = () => {
    toast.success("Settings saved! Re-upload a document to apply.");
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900/80 border-b border-gray-800 px-8 py-5 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
            <Settings size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Format Settings</h1>
            <p className="text-xs text-gray-400">Configure professional formatting rules applied by the Python backend</p>
          </div>
          <div className="ml-auto flex gap-2">
            <button
              onClick={resetDefaults}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium border border-gray-700 transition-all"
            >
              <RotateCcw size={12} />
              Reset
            </button>
            <button
              onClick={saveSettings}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-lg shadow-blue-500/20"
            >
              <Save size={12} />
              Save Settings
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-8 py-8 space-y-8">
        {/* Document Theme */}
        <Section icon={Palette} label="Document Theme" color="purple">
          <div className="grid grid-cols-1 gap-3">
            {THEMES.map((theme) => (
              <motion.button
                key={theme.id}
                whileHover={{ x: 2 }}
                onClick={() => {
                  update("theme", theme.id);
                  update("primaryColor", theme.color);
                }}
                className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                  formatting.theme === theme.id
                    ? "border-blue-500/50 bg-blue-500/10"
                    : "border-gray-800 bg-gray-900 hover:border-gray-700"
                }`}
              >
                <div
                  className="w-8 h-8 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: theme.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{theme.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{theme.desc}</p>
                </div>
                {formatting.theme === theme.id && (
                  <CheckSquare size={16} className="text-blue-400 flex-shrink-0" />
                )}
              </motion.button>
            ))}
          </div>
        </Section>

        {/* Typography */}
        <Section icon={Type} label="Typography" color="blue">
          <div className="space-y-5">
            <div>
              <label className="text-xs font-medium text-gray-400 block mb-2">Font Family</label>
              <select
                value={formatting.font}
                onChange={(e) => update("font", e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-gray-800 text-white text-sm border border-gray-700 focus:border-blue-500 outline-none"
              >
                {FONTS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <p className="text-xs text-gray-600 mt-1.5">Applied via python-docx style engine to all paragraphs</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-2">
                  Font Size: <span className="text-white">{formatting.fontSize}pt</span>
                </label>
                <input
                  type="range"
                  min={8}
                  max={24}
                  step={1}
                  value={formatting.fontSize}
                  onChange={(e) => update("fontSize", Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>8pt</span>
                  <span>24pt</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-2">
                  Line Spacing: <span className="text-white">{formatting.lineSpacing}×</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.25}
                  value={formatting.lineSpacing}
                  onChange={(e) => update("lineSpacing", Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>1.0×</span>
                  <span>3.0×</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 block mb-2">Primary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formatting.primaryColor}
                  onChange={(e) => update("primaryColor", e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-gray-700"
                />
                <input
                  type="text"
                  value={formatting.primaryColor}
                  onChange={(e) => update("primaryColor", e.target.value)}
                  className="flex-1 h-10 px-3 rounded-lg bg-gray-800 text-white text-sm font-mono border border-gray-700 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        </Section>

        {/* Page Layout */}
        <Section icon={AlignJustify} label="Page Margins (inches)" color="green">
          <div className="grid grid-cols-2 gap-4">
            {(["top", "right", "bottom", "left"] as const).map((side) => (
              <div key={side}>
                <label className="text-xs font-medium text-gray-400 block mb-2 capitalize">
                  {side}: <span className="text-white">{formatting.margins[side]}"</span>
                </label>
                <input
                  type="range"
                  min={0.5}
                  max={2.5}
                  step={0.125}
                  value={formatting.margins[side]}
                  onChange={(e) => updateMargin(side, Number(e.target.value))}
                  className="w-full accent-green-500"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-3">
            Margins applied via python-docx: <code className="text-green-400">section.top_margin = Inches({formatting.margins.top})</code>
          </p>
        </Section>

        {/* Header Style */}
        <Section icon={Layout} label="Header Style" color="yellow">
          <div className="grid grid-cols-3 gap-3">
            {HEADER_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => update("headerStyle", style.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  formatting.headerStyle === style.id
                    ? "border-yellow-500/50 bg-yellow-500/10"
                    : "border-gray-800 bg-gray-900 hover:border-gray-700"
                }`}
              >
                <p className="text-sm font-semibold text-white">{style.label}</p>
                <p className="text-xs text-gray-400 mt-1">{style.desc}</p>
              </button>
            ))}
          </div>
        </Section>

        {/* Document Options */}
        <Section icon={CheckSquare} label="Document Options" color="pink">
          <div className="space-y-3">
            {[
              { key: "tableOfContents" as const, label: "Table of Contents", desc: "Auto-generated TOC with hyperlinks using python-docx" },
              { key: "pageNumbers" as const, label: "Page Numbers", desc: "Footer page numbers via Header/Footer XML manipulation" },
              { key: "headerFooter" as const, label: "Header & Footer", desc: "Running headers with document title and author" },
            ].map(({ key, label, desc }) => (
              <div
                key={key}
                onClick={() => update(key, !formatting[key])}
                className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                  formatting[key]
                    ? "border-pink-500/30 bg-pink-500/5"
                    : "border-gray-800 bg-gray-900 hover:border-gray-700"
                }`}
              >
                <div
                  className={`w-10 h-6 rounded-full transition-all flex items-center flex-shrink-0 ${
                    formatting[key] ? "bg-pink-500 justify-end pr-1" : "bg-gray-700 justify-start pl-1"
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
                <span
                  className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
                    formatting[key]
                      ? "bg-pink-500/20 text-pink-300"
                      : "bg-gray-800 text-gray-500"
                  }`}
                >
                  {formatting[key] ? "ON" : "OFF"}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* Python Config Preview */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h3 className="text-xs font-semibold text-gray-400 mb-3 font-mono flex items-center gap-2">
            <span className="text-green-400">»</span> PYTHON CONFIG OBJECT (sent to FastAPI)
          </h3>
          <pre className="text-xs font-mono text-gray-400 leading-relaxed overflow-x-auto">
{`formatting_config = {
    "font": "${formatting.font}",
    "font_size": ${formatting.fontSize},          # pt
    "line_spacing": ${formatting.lineSpacing},       # WD_LINE_SPACING constant
    "margins": {
        "top": ${formatting.margins.top},            # Inches
        "right": ${formatting.margins.right},
        "bottom": ${formatting.margins.bottom},
        "left": ${formatting.margins.left}
    },
    "theme": "${formatting.theme}",
    "primary_color": "${formatting.primaryColor}",  # RGBColor hex
    "header_style": "${formatting.headerStyle}",
    "table_of_contents": ${formatting.tableOfContents ? "True" : "False"},
    "page_numbers": ${formatting.pageNumbers ? "True" : "False"},
    "header_footer": ${formatting.headerFooter ? "True" : "False"},
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  label,
  color,
  children,
}: {
  icon: React.ElementType;
  label: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/50 rounded-2xl border border-gray-800 overflow-hidden"
    >
      <div className={`flex items-center gap-3 px-6 py-4 border-b border-gray-800 bg-gray-900`}>
        <div className={`w-7 h-7 rounded-lg bg-${color}-500/20 flex items-center justify-center`}>
          <Icon size={14} className={`text-${color}-400`} />
        </div>
        <h2 className="text-sm font-semibold text-white">{label}</h2>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  );
}
