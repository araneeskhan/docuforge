import type { FormattedDocument, DocumentFormatting } from "../App";

/**
 * Simulates what the Python FastAPI backend would return after processing.
 * In production, this is replaced by a real API call to:
 *   POST /api/format-document
 * Which runs GPT-4 + python-docx + ReportLab on the server.
 */

const DEMO_FORMATTED_CONTENT = `
<h1 style="text-align:center;color:#1e40af;font-size:24px;font-weight:700;margin-bottom:8px;">PROFESSIONAL BUSINESS PROPOSAL</h1>
<p style="text-align:center;color:#6b7280;font-size:13px;margin-bottom:32px;"><em>Prepared by DocuForge AI — Advanced Document Formatting Engine</em></p>

<h2 style="color:#1e3a8a;font-size:18px;font-weight:600;border-bottom:2px solid #3b82f6;padding-bottom:6px;margin-bottom:16px;">1. Executive Summary</h2>
<p style="text-indent:32px;margin-bottom:14px;line-height:1.8;color:#e5e7eb;">This document has been intelligently reformatted using <strong>DocuForge AI</strong>, powered by GPT-4 and advanced Python document-processing libraries including <em>python-docx</em>, <em>ReportLab</em>, and <em>WeasyPrint</em>. The AI engine analyzes the structural semantics of your document and applies professional typographic rules automatically.</p>
<p style="text-indent:32px;margin-bottom:14px;line-height:1.8;color:#e5e7eb;">The formatting engine applies consistent heading hierarchies, optimizes paragraph spacing, corrects grammar and punctuation using GPT-4 language models, and exports production-ready DOCX and PDF files with embedded metadata.</p>

<h2 style="color:#1e3a8a;font-size:18px;font-weight:600;border-bottom:2px solid #3b82f6;padding-bottom:6px;margin-bottom:16px;">2. Document Analysis Results</h2>

<table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px;">
  <thead>
    <tr style="background:#1e3a8a;color:white;">
      <th style="padding:10px 14px;text-align:left;font-weight:600;">Metric</th>
      <th style="padding:10px 14px;text-align:left;font-weight:600;">Before</th>
      <th style="padding:10px 14px;text-align:left;font-weight:600;">After</th>
      <th style="padding:10px 14px;text-align:left;font-weight:600;">Improvement</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background:#1f2937;">
      <td style="padding:9px 14px;border-bottom:1px solid #374151;color:#d1d5db;">Readability Score</td>
      <td style="padding:9px 14px;border-bottom:1px solid #374151;color:#9ca3af;">62/100</td>
      <td style="padding:9px 14px;border-bottom:1px solid #374151;color:#34d399;">91/100</td>
      <td style="padding:9px 14px;border-bottom:1px solid #374151;color:#34d399;">+47%</td>
    </tr>
    <tr style="background:#111827;">
      <td style="padding:9px 14px;border-bottom:1px solid #374151;color:#d1d5db;">Grammar Errors</td>
      <td style="padding:9px 14px;border-bottom:1px solid #374151;color:#f87171;">23</td>
      <td style="padding:9px 14px;border-bottom:1px solid #374151;color:#34d399;">0</td>
      <td style="padding:9px 14px;border-bottom:1px solid #374151;color:#34d399;">100% fixed</td>
    </tr>
    <tr style="background:#1f2937;">
      <td style="padding:9px 14px;border-bottom:1px solid #374151;color:#d1d5db;">Formatting Consistency</td>
      <td style="padding:9px 14px;border-bottom:1px solid #374151;color:#f87171;">38%</td>
      <td style="padding:9px 14px;border-bottom:1px solid #374151;color:#34d399;">100%</td>
      <td style="padding:9px 14px;border-bottom:1px solid #374151;color:#34d399;">+163%</td>
    </tr>
    <tr style="background:#111827;">
      <td style="padding:9px 14px;color:#d1d5db;">Structure Score</td>
      <td style="padding:9px 14px;color:#f87171;">Poor</td>
      <td style="padding:9px 14px;color:#34d399;">Excellent</td>
      <td style="padding:9px 14px;color:#34d399;">✓ Optimized</td>
    </tr>
  </tbody>
</table>

<h2 style="color:#1e3a8a;font-size:18px;font-weight:600;border-bottom:2px solid #3b82f6;padding-bottom:6px;margin-bottom:16px;">3. AI Formatting Features Applied</h2>
<ul style="margin-bottom:20px;padding-left:24px;space-y:8px;">
  <li style="margin-bottom:10px;color:#d1d5db;line-height:1.7;"><strong style="color:#60a5fa;">Semantic Structure Analysis:</strong> GPT-4 identifies headings, subheadings, body text, lists, and tables from unstructured content and applies proper hierarchy.</li>
  <li style="margin-bottom:10px;color:#d1d5db;line-height:1.7;"><strong style="color:#60a5fa;">Typography Engine:</strong> python-docx applies professional font stacks (Times New Roman, Calibri, Arial), precise point sizes, and correct line spacing per APA/MLA/Chicago standards.</li>
  <li style="margin-bottom:10px;color:#d1d5db;line-height:1.7;"><strong style="color:#60a5fa;">Smart Paragraph Formatting:</strong> Automatic indentation (0.5in first-line), widow/orphan control, keep-with-next for headings, and justified alignment for body text.</li>
  <li style="margin-bottom:10px;color:#d1d5db;line-height:1.7;"><strong style="color:#60a5fa;">PDF Export Engine:</strong> ReportLab Platypus with embedded TTF fonts, custom page templates, running headers/footers, and automatic page numbering.</li>
  <li style="margin-bottom:10px;color:#d1d5db;line-height:1.7;"><strong style="color:#60a5fa;">Grammar & Style Correction:</strong> GPT-4 language model corrects spelling, grammar, punctuation, and suggests style improvements maintaining the author's voice.</li>
</ul>

<h2 style="color:#1e3a8a;font-size:18px;font-weight:600;border-bottom:2px solid #3b82f6;padding-bottom:6px;margin-bottom:16px;">4. Technical Architecture</h2>
<p style="text-indent:32px;margin-bottom:14px;line-height:1.8;color:#e5e7eb;">The backend processing pipeline is built on <strong>FastAPI</strong> with async I/O for handling concurrent document processing requests. The pipeline consists of five stages:</p>
<ol style="margin-bottom:20px;padding-left:24px;">
  <li style="margin-bottom:10px;color:#d1d5db;line-height:1.7;"><strong style="color:#a78bfa;">Document Ingestion:</strong> python-docx extracts raw text, preserving paragraph runs, font metadata, and existing styles using the OOXML parser.</li>
  <li style="margin-bottom:10px;color:#d1d5db;line-height:1.7;"><strong style="color:#a78bfa;">NLP Analysis:</strong> spaCy + NLTK perform POS tagging, sentence boundary detection, and semantic paragraph clustering before GPT-4 processing.</li>
  <li style="margin-bottom:10px;color:#d1d5db;line-height:1.7;"><strong style="color:#a78bfa;">AI Restructuring:</strong> GPT-4 Turbo reformats content, fixes grammar, improves sentence flow, and generates structured JSON with heading levels and formatting hints.</li>
  <li style="margin-bottom:10px;color:#d1d5db;line-height:1.7;"><strong style="color:#a78bfa;">DOCX Generation:</strong> python-docx rebuilds the document with professional styles, custom XML styles injected via OOXML manipulation for advanced formatting.</li>
  <li style="margin-bottom:10px;color:#d1d5db;line-height:1.7;"><strong style="color:#a78bfa;">PDF Rendering:</strong> ReportLab Platypus flows content into professional page layouts with bleed, margins, headers, and bookmarked table of contents.</li>
</ol>

<h2 style="color:#1e3a8a;font-size:18px;font-weight:600;border-bottom:2px solid #3b82f6;padding-bottom:6px;margin-bottom:16px;">5. Conclusion & Next Steps</h2>
<p style="text-indent:32px;margin-bottom:14px;line-height:1.8;color:#e5e7eb;">DocuForge AI represents the cutting edge of AI-assisted document processing, combining large language model intelligence with precision typographic engines to deliver professional-grade documents automatically. The system is fully configurable via the Settings panel.</p>
<p style="text-indent:32px;line-height:1.8;color:#e5e7eb;">You can now edit this document using the rich text editor above, adjust formatting using the Settings panel, and export as <strong>DOCX</strong> (Microsoft Word compatible) or <strong>PDF</strong> (print-ready) using the buttons in the toolbar.</p>
`;

export async function mockFormatDocument(
  fileName: string,
  _content: string,
  _formatting: DocumentFormatting
): Promise<FormattedDocument> {
  // Simulate network + AI processing delay
  await new Promise((resolve) => setTimeout(resolve, 3500));

  const wordCount = DEMO_FORMATTED_CONTENT.replace(/<[^>]+>/g, "").split(/\s+/).length;

  return {
    title: fileName.replace(/\.(docx|doc|txt)$/i, "").replace(/[_-]/g, " "),
    content: DEMO_FORMATTED_CONTENT,
    rawText: DEMO_FORMATTED_CONTENT.replace(/<[^>]+>/g, ""),
    formatting: _formatting,
    metadata: {
      wordCount,
      pageCount: Math.ceil(wordCount / 250),
      readingTime: `${Math.ceil(wordCount / 200)} min read`,
      language: "English (US)",
      suggestions: [
        "Added consistent H1/H2/H3 heading hierarchy",
        "Fixed 23 grammar and punctuation errors",
        "Applied professional line spacing (1.5×)",
        "Standardized paragraph indentation to 0.5in",
        "Generated dynamic table of contents",
        "Embedded running headers and page numbers",
        "Improved passive voice usage in 4 paragraphs",
        "Applied Chicago Manual of Style formatting",
      ],
    },
  };
}
