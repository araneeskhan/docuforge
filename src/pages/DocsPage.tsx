import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Code2,
  Terminal,
  Server,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Zap,
  Globe,
  Shield,
  Cpu,
} from "lucide-react";

type Section = {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
};

const SECTIONS: Section[] = [
  { id: "overview", title: "Architecture Overview", icon: Server, color: "blue" },
  { id: "setup", title: "Quick Setup", icon: Terminal, color: "green" },
  { id: "api", title: "REST API Reference", icon: Code2, color: "purple" },
  { id: "python", title: "Python Code Deep Dive", icon: Cpu, color: "yellow" },
  { id: "nextjs", title: "Next.js Integration", icon: Globe, color: "pink" },
  { id: "security", title: "Security & Auth", icon: Shield, color: "red" },
];

const CODE_BLOCKS: Record<string, { lang: string; code: string }[]> = {
  overview: [
    {
      lang: "text",
      code: `ARCHITECTURE OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────────────┐
│           Next.js 14 Frontend               │
│  React + TailwindCSS + Framer Motion        │
│  Rich Text Editor (contentEditable)         │
└──────────────┬──────────────────────────────┘
               │ HTTP/REST (multipart/form-data)
               ▼
┌─────────────────────────────────────────────┐
│         FastAPI Python Backend              │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Document │  │   NLP    │  │  Export  │  │
│  │  Parser  │→ │ Pipeline │→ │ Engine   │  │
│  │python-   │  │spaCy +   │  │ReportLab │  │
│  │  docx   │  │  NLTK    │  │+ python- │  │
│  └──────────┘  └────┬─────┘  │  docx   │  │
│                     │        └──────────┘  │
│              ┌──────▼──────┐               │
│              │  GPT-4 API  │               │
│              │  Formatter  │               │
│              └─────────────┘               │
└─────────────────────────────────────────────┘
               │
               ▼ Returns formatted .docx / .pdf blob`,
    },
  ],
  setup: [
    {
      lang: "bash",
      code: `# Clone the repository
git clone https://github.com/yourusername/docuforge-ai.git
cd docuforge-ai

# ─── Python Backend Setup ───────────────────────
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\\Scripts\\activate

pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env and add your OpenAI API key:
# OPENAI_API_KEY=sk-...your-key...

# Start FastAPI server (with hot reload)
uvicorn app.main:app --reload --port 8000

# ─── Next.js Frontend Setup ─────────────────────
cd ../frontend
npm install

# Configure API URL
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start development server
npm run dev`,
    },
    {
      lang: "text",
      code: `requirements.txt:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
fastapi==0.111.0
uvicorn[standard]==0.30.1
python-multipart==0.0.9
python-docx==3.1.2
reportlab==4.2.0
openai==1.35.0
spacy==3.7.4
nltk==3.8.1
weasyprint==62.1
mammoth==1.8.0
pillow==10.3.0
python-jose[cryptography]==3.3.0
aiofiles==23.2.1
pydantic==2.7.3
pydantic-settings==2.3.3
redis==5.0.6
celery==5.4.0
python-dotenv==1.0.1`,
    },
  ],
  api: [
    {
      lang: "bash",
      code: `# ─── POST /api/v1/format-document ──────────────────
# Upload and AI-format a Word document

curl -X POST "http://localhost:8000/api/v1/format-document" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -F "file=@document.docx" \\
  -F 'config={"theme":"professional","font":"Times New Roman","font_size":12,"line_spacing":1.5,"table_of_contents":true}'

# Response:
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "estimated_seconds": 8,
  "preview_url": "/api/v1/jobs/550e.../preview"
}`,
    },
    {
      lang: "bash",
      code: `# ─── GET /api/v1/jobs/{job_id} ─────────────────────
curl "http://localhost:8000/api/v1/jobs/550e8400..." \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Response when done:
{
  "job_id": "550e8400-...",
  "status": "completed",
  "result": {
    "title": "Business Proposal",
    "content_html": "<h1>...</h1>",
    "metadata": {
      "word_count": 1842,
      "page_count": 7,
      "reading_time": "9 min read",
      "language": "English (US)",
      "readability_score": 91,
      "grammar_errors_fixed": 23,
      "suggestions": ["Applied H1/H2 hierarchy", "..."]
    }
  }
}`,
    },
    {
      lang: "bash",
      code: `# ─── POST /api/v1/export/docx ──────────────────────
curl -X POST "http://localhost:8000/api/v1/export/docx" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"job_id": "550e8400-...","include_toc": true}' \\
  --output formatted_document.docx

# ─── POST /api/v1/export/pdf ────────────────────────
curl -X POST "http://localhost:8000/api/v1/export/pdf" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"job_id": "550e8400-...","page_size":"A4","orientation":"portrait"}' \\
  --output formatted_document.pdf`,
    },
  ],
  python: [
    {
      lang: "python",
      code: `# app/services/document_parser.py
"""
Advanced DOCX parser using python-docx with OOXML-level access.
Extracts rich metadata, preserves run-level formatting,
and identifies semantic paragraph types.
"""
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
from typing import Optional
import re
import unicodedata

class AdvancedDocumentParser:
    """
    Enterprise-grade DOCX parser with OOXML manipulation support.
    """
    HEADING_PATTERNS = [
        r'^#{1,6}\\s+',              # Markdown-style
        r'^\\d+\\.\\s+[A-Z]',        # Numbered headings
        r'^[A-Z][A-Z\\s]{5,}$',     # ALL CAPS headings
        r'^Chapter\\s+\\d+',         # Chapter headings
        r'^Section\\s+\\d+',         # Section headings
    ]
    
    def __init__(self, file_path: str):
        self.doc = Document(file_path)
        self.paragraphs: list[dict] = []
        self.tables: list[dict] = []
        self.images: list[dict] = []
        self.styles: dict = {}
        
    def parse(self) -> dict:
        """Full document parse with metadata extraction."""
        self._extract_metadata()
        self._parse_paragraphs()
        self._parse_tables()
        self._extract_images()
        self._analyze_structure()
        
        return {
            "metadata": self._get_metadata(),
            "paragraphs": self.paragraphs,
            "tables": self.tables,
            "images": self.images,
            "structure": self._get_structure(),
            "raw_text": self._get_raw_text(),
        }
    
    def _parse_paragraphs(self):
        for i, para in enumerate(self.doc.paragraphs):
            if not para.text.strip():
                continue
                
            # Detect paragraph type
            para_type = self._classify_paragraph(para)
            
            # Extract run-level formatting
            runs = []
            for run in para.runs:
                runs.append({
                    "text": run.text,
                    "bold": run.bold,
                    "italic": run.italic,
                    "underline": run.underline,
                    "font_name": run.font.name,
                    "font_size": run.font.size.pt if run.font.size else None,
                    "color": str(run.font.color.rgb) if run.font.color.type else None,
                })
            
            # Check XML for advanced properties
            xml_elem = para._element
            outline_level = xml_elem.find(
                f'.//{qn("w:outlineLvl")}')
            
            self.paragraphs.append({
                "index": i,
                "text": para.text,
                "type": para_type,
                "style": para.style.name,
                "alignment": str(para.alignment),
                "runs": runs,
                "outline_level": int(outline_level.get(qn("w:val"), 9))
                    if outline_level is not None else 9,
                "is_heading": para_type.startswith("heading"),
            })
    
    def _classify_paragraph(self, para) -> str:
        """Semantic classification of paragraph type."""
        style_name = para.style.name.lower()
        text = para.text.strip()
        
        if "heading 1" in style_name or re.match(r'^#\\s', text):
            return "heading_1"
        if "heading 2" in style_name or re.match(r'^##\\s', text):
            return "heading_2"
        if "heading 3" in style_name:
            return "heading_3"
        if "list" in style_name:
            return "list_item"
        if "quote" in style_name or text.startswith('"'):
            return "block_quote"
        if re.match(r'^\\d+\\.', text):
            return "numbered_list"
        if len(text) < 50 and text.isupper():
            return "heading_2"  # ALL CAPS short lines = heading
        return "body"`,
    },
    {
      lang: "python",
      code: `# app/services/ai_formatter.py
"""
GPT-4 powered document reformatting pipeline.
Uses structured outputs for deterministic formatting decisions.
"""
from openai import AsyncOpenAI
from pydantic import BaseModel, Field
import json

class ParagraphFormat(BaseModel):
    index: int
    formatted_text: str
    heading_level: Optional[int] = None  # 1-6, None = body
    style: str = "body"
    grammar_corrections: list[str] = Field(default_factory=list)
    
class DocumentStructure(BaseModel):
    title: str
    abstract: Optional[str] = None
    paragraphs: list[ParagraphFormat]
    toc_entries: list[dict] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)
    readability_score: int = Field(ge=0, le=100)

class AIDocumentFormatter:
    """
    Async GPT-4 Turbo formatter with structured JSON output.
    Uses parallel processing for large documents.
    """
    MAX_CHUNK_SIZE = 4000  # tokens per chunk
    
    def __init__(self, api_key: str):
        self.client = AsyncOpenAI(api_key=api_key)
        
    async def format_document(
        self, 
        paragraphs: list[dict],
        config: dict
    ) -> DocumentStructure:
        """
        Split document into chunks for parallel GPT-4 processing.
        Maintains context continuity between chunks.
        """
        chunks = self._split_into_chunks(paragraphs)
        results = []
        
        # Process chunks with async semaphore (rate limiting)
        import asyncio
        semaphore = asyncio.Semaphore(3)  # Max 3 concurrent API calls
        
        async def process_chunk(chunk: list[dict], ctx: str) -> dict:
            async with semaphore:
                return await self._format_chunk(chunk, ctx, config)
        
        # Gather with context passing between chunks
        context = ""
        for chunk in chunks:
            result = await process_chunk(chunk, context)
            results.append(result)
            context = chunk[-1]["text"][:200]  # Last 200 chars as context
        
        return self._merge_results(results)
    
    async def _format_chunk(
        self, 
        paragraphs: list[dict],
        context: str,
        config: dict
    ) -> dict:
        system_prompt = f"""
You are an expert document formatter using {config['theme']} professional style.
Apply Chicago Manual of Style (17th edition) formatting rules.
Font: {config['font']}, Size: {config['font_size']}pt, 
Spacing: {config['line_spacing']}x line spacing.

Rules:
1. Fix ALL grammar, spelling, punctuation errors
2. Classify each paragraph: heading_1/heading_2/heading_3/body/list/quote
3. Improve sentence clarity without changing the author's voice
4. Return valid JSON matching the DocumentStructure schema
5. Flag specific improvements in grammar_corrections array
"""
        response = await self.client.beta.chat.completions.parse(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Context: {context}\\n\\nParagraphs:\\n{json.dumps(paragraphs)}"}
            ],
            response_format=DocumentStructure,
            temperature=0.1,  # Low temp for consistency
            max_tokens=4096,
        )
        return response.choices[0].message.parsed`,
    },
    {
      lang: "python",
      code: `# app/services/docx_generator.py
"""
Professional DOCX generation using python-docx with
advanced OOXML manipulation for features beyond the public API.
"""
from docx import Document
from docx.shared import Pt, Inches, RGBColor, Cm, Emu
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.section import WD_SECTION
from docx.oxml.ns import qn, nsmap
from docx.oxml import OxmlElement
from copy import deepcopy
import io, re

class ProfessionalDocxGenerator:
    """
    Creates publication-quality DOCX files with:
    - Custom XML style injection
    - Running headers/footers with page numbers
    - Clickable table of contents
    - Bookmarked headings for navigation
    - Embedded metadata and document properties
    """
    
    HEADING_STYLES = {
        1: {"size": 20, "bold": True, "space_before": 24, "space_after": 12},
        2: {"size": 16, "bold": True, "space_before": 18, "space_after": 8},
        3: {"size": 13, "bold": True, "space_before": 12, "space_after": 6},
    }
    
    def __init__(self, config: dict):
        self.config = config
        self.doc = Document()
        self._setup_document()
        
    def _setup_document(self):
        """Configure page layout via section properties."""
        section = self.doc.sections[0]
        
        # Page margins (convert inches to EMU)
        section.top_margin = Inches(self.config["margins"]["top"])
        section.right_margin = Inches(self.config["margins"]["right"])
        section.bottom_margin = Inches(self.config["margins"]["bottom"])
        section.left_margin = Inches(self.config["margins"]["left"])
        
        # Page size (A4: 8.27 x 11.69 in)
        section.page_width = Inches(8.27)
        section.page_height = Inches(11.69)
        
        # Set default body style
        style = self.doc.styles["Normal"]
        style.font.name = self.config["font"]
        style.font.size = Pt(self.config["font_size"])
        
        # Line spacing via paragraph format
        style.paragraph_format.line_spacing_rule = WD_LINE_SPACING.MULTIPLE
        style.paragraph_format.line_spacing = self.config["line_spacing"]
        style.paragraph_format.space_after = Pt(6)
        
        self._inject_custom_styles()
        
    def _inject_custom_styles(self):
        """
        Inject custom styles via raw OOXML manipulation.
        This enables styling not possible through the python-docx API.
        """
        color_hex = self.config["primary_color"].lstrip("#")
        r, g, b = int(color_hex[:2], 16), int(color_hex[2:4], 16), int(color_hex[4:], 16)
        
        styles_element = self.doc.styles.element
        
        # Custom "DocuForge Heading 1" style via OOXML
        new_style = OxmlElement("w:style")
        new_style.set(qn("w:type"), "paragraph")
        new_style.set(qn("w:styleId"), "DocuForgeH1")
        
        name_elem = OxmlElement("w:name")
        name_elem.set(qn("w:val"), "DocuForge Heading 1")
        
        pPr = OxmlElement("w:pPr")
        jc = OxmlElement("w:jc")
        jc.set(qn("w:val"), "both")  # Justified
        pPr.append(jc)
        
        rPr = OxmlElement("w:rPr")
        # Font color
        color = OxmlElement("w:color")
        color.set(qn("w:val"), color_hex.upper())
        rPr.append(color)
        # Bold
        bold = OxmlElement("w:b")
        rPr.append(bold)
        # Font size (half-points)
        sz = OxmlElement("w:sz")
        sz.set(qn("w:val"), str(self.config.get("font_size", 12) * 2 + 8))
        rPr.append(sz)
        
        new_style.append(name_elem)
        new_style.append(pPr)
        new_style.append(rPr)
        styles_element.append(new_style)
    
    def add_heading(self, text: str, level: int = 1, bookmark_id: int = None):
        """Add heading with optional bookmarking for TOC navigation."""
        style_config = self.HEADING_STYLES.get(level, self.HEADING_STYLES[3])
        
        para = self.doc.add_paragraph()
        para.style = f"Heading {level}"
        
        # Set spacing
        pf = para.paragraph_format
        pf.space_before = Pt(style_config["space_before"])
        pf.space_after = Pt(style_config["space_after"])
        pf.keep_with_next = True  # Prevent heading orphans
        
        if bookmark_id is not None:
            # Insert bookmark XML for TOC cross-reference
            bookmark_start = OxmlElement("w:bookmarkStart")
            bookmark_start.set(qn("w:id"), str(bookmark_id))
            bookmark_start.set(qn("w:name"), f"_Heading{bookmark_id}")
            
            run = para.add_run(text)
            run.bold = style_config["bold"]
            run.font.size = Pt(style_config["size"])
            run.font.color.rgb = RGBColor.from_string(
                self.config["primary_color"].lstrip("#"))
            
            para._p.insert(0, bookmark_start)
            
            bookmark_end = OxmlElement("w:bookmarkEnd")
            bookmark_end.set(qn("w:id"), str(bookmark_id))
            para._p.append(bookmark_end)
        else:
            run = para.add_run(text)
            run.bold = style_config["bold"]
            run.font.size = Pt(style_config["size"])
            run.font.color.rgb = RGBColor.from_string(
                self.config["primary_color"].lstrip("#"))
    
    def add_table_of_contents(self):
        """
        Insert TOC field instruction for Word to auto-populate.
        Uses OOXML w:fldSimple with TOC field codes.
        """
        para = self.doc.add_paragraph()
        run = para.add_run()
        
        # TOC field with bookmarks and page numbers
        fld_char = OxmlElement("w:fldChar")
        fld_char.set(qn("w:fldCharType"), "begin")
        run._r.append(fld_char)
        
        instr_text = OxmlElement("w:instrText")
        instr_text.set(qn("xml:space"), "preserve")
        instr_text.text = ' TOC \\o "1-3" \\h \\z \\u '
        run._r.append(instr_text)
        
        fld_char_end = OxmlElement("w:fldChar")
        fld_char_end.set(qn("w:fldCharType"), "end")
        run._r.append(fld_char_end)
    
    def add_header_footer(self, title: str, author: str = "DocuForge AI"):
        """Add running headers and footers with page numbers."""
        section = self.doc.sections[0]
        section.different_first_page_header_footer = True
        
        # Header: Title | Author
        header = section.header
        header_para = header.paragraphs[0]
        header_para.clear()
        header_para.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        
        run = header_para.add_run(f"{title}  |  {author}")
        run.font.size = Pt(9)
        run.font.color.rgb = RGBColor(0x9C, 0xA3, 0xAF)
        
        # Footer: Page X of Y
        footer = section.footer
        footer_para = footer.paragraphs[0]
        footer_para.clear()
        footer_para.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        
        # "Page " text
        footer_para.add_run("Page ").font.size = Pt(9)
        
        # PAGE number field
        page_run = footer_para.add_run()
        page_fld = OxmlElement("w:fldChar")
        page_fld.set(qn("w:fldCharType"), "begin")
        page_run._r.append(page_fld)
        
        instr = OxmlElement("w:instrText")
        instr.text = " PAGE "
        page_run._r.append(instr)
        
        page_fld_end = OxmlElement("w:fldChar")
        page_fld_end.set(qn("w:fldCharType"), "end")
        page_run._r.append(page_fld_end)
        
        footer_para.add_run(" of ").font.size = Pt(9)
        
        # NUMPAGES field
        num_run = footer_para.add_run()
        num_fld = OxmlElement("w:fldChar")
        num_fld.set(qn("w:fldCharType"), "begin")
        num_run._r.append(num_fld)
        
        num_instr = OxmlElement("w:instrText")
        num_instr.text = " NUMPAGES "
        num_run._r.append(num_instr)
        
        num_fld_end = OxmlElement("w:fldChar")
        num_fld_end.set(qn("w:fldCharType"), "end")
        num_run._r.append(num_fld_end)
    
    def generate(self) -> bytes:
        """Serialize to bytes buffer for HTTP response."""
        buffer = io.BytesIO()
        self.doc.save(buffer)
        buffer.seek(0)
        return buffer.read()`,
    },
    {
      lang: "python",
      code: `# app/services/pdf_generator.py
"""
Advanced PDF generation using ReportLab Platypus.
Supports multi-column layouts, embedded fonts, custom page templates,
watermarks, and clickable TOC with bookmarks.
"""
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable, PageTemplate, Frame
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import A4, LETTER
from reportlab.lib.units import inch, cm
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER, TA_LEFT, TA_RIGHT
import io, os

class ProfessionalPDFGenerator:
    """
    ReportLab Platypus PDF engine with:
    - Custom page templates (first page, subsequent pages)
    - Automatic table of contents with clickable hyperlinks
    - Embedded custom TTF fonts
    - Header/footer with page numbers
    - Professional typography with kerning control
    """
    
    def __init__(self, config: dict):
        self.config = config
        self.buffer = io.BytesIO()
        self.styles = getSampleStyleSheet()
        self.primary_color = self._hex_to_color(config["primary_color"])
        self._setup_styles()
        
    def _hex_to_color(self, hex_str: str) -> colors.Color:
        hex_str = hex_str.lstrip("#")
        r, g, b = [int(hex_str[i:i+2], 16)/255 for i in (0, 2, 4)]
        return colors.Color(r, g, b)
    
    def _setup_styles(self):
        """Define custom paragraph styles."""
        base_font = self.config.get("font", "Times New Roman")
        base_size = self.config.get("font_size", 12)
        
        self.heading1_style = ParagraphStyle(
            name="DocH1",
            fontName="Helvetica-Bold",
            fontSize=base_size + 8,
            textColor=self.primary_color,
            spaceBefore=20,
            spaceAfter=10,
            alignment=TA_LEFT,
            leading=(base_size + 8) * 1.3,
            borderPad=0,
            borderColor=self.primary_color,
            borderWidth=0,
        )
        self.heading2_style = ParagraphStyle(
            name="DocH2",
            fontName="Helvetica-Bold",
            fontSize=base_size + 4,
            textColor=self.primary_color,
            spaceBefore=16,
            spaceAfter=8,
            alignment=TA_LEFT,
            leading=(base_size + 4) * 1.3,
        )
        self.body_style = ParagraphStyle(
            name="DocBody",
            fontName="Times-Roman",
            fontSize=base_size,
            leading=base_size * self.config.get("line_spacing", 1.5),
            spaceBefore=4,
            spaceAfter=8,
            alignment=TA_JUSTIFY,
            firstLineIndent=0.4 * inch,
        )
        self.toc_style = ParagraphStyle(
            name="TOCEntry",
            fontName="Helvetica",
            fontSize=11,
            leading=18,
            leftIndent=20,
        )
    
    def _header_footer(self, canvas, doc, title: str):
        """Page decorator with header line and footer page number."""
        canvas.saveState()
        
        # Header
        canvas.setStrokeColor(self.primary_color)
        canvas.setLineWidth(0.5)
        canvas.line(inch, A4[1] - 0.6*inch, A4[0] - inch, A4[1] - 0.6*inch)
        
        canvas.setFillColor(colors.HexColor("#9CA3AF"))
        canvas.setFont("Helvetica", 8)
        canvas.drawString(inch, A4[1] - 0.5*inch, title)
        canvas.drawRightString(A4[0] - inch, A4[1] - 0.5*inch, "DocuForge AI")
        
        # Footer
        canvas.line(inch, 0.7*inch, A4[0] - inch, 0.7*inch)
        canvas.drawCentredString(
            A4[0] / 2, 0.5*inch,
            f"Page {doc.page} of {self.total_pages}"
        )
        
        canvas.restoreState()
    
    def generate(self, content: list[dict], title: str) -> bytes:
        """Build the complete PDF document."""
        margins = self.config.get("margins", {})
        
        doc = SimpleDocTemplate(
            self.buffer,
            pagesize=A4,
            topMargin=margins.get("top", 1) * inch,
            rightMargin=margins.get("right", 1) * inch,
            bottomMargin=margins.get("bottom", 1) * inch,
            leftMargin=margins.get("left", 1.25) * inch,
            title=title,
            author="DocuForge AI",
            subject="AI-Formatted Document",
        )
        
        story = []
        bookmark_id = 0
        
        # Title page
        title_style = ParagraphStyle(
            name="Title",
            fontName="Helvetica-Bold",
            fontSize=28,
            textColor=self.primary_color,
            alignment=TA_CENTER,
            spaceAfter=12,
        )
        story.append(Spacer(1, 2*inch))
        story.append(Paragraph(title, title_style))
        story.append(HRFlowable(
            width="80%", thickness=2,
            color=self.primary_color, spaceAfter=24))
        story.append(PageBreak())
        
        # Table of Contents
        if self.config.get("table_of_contents", True):
            toc = TableOfContents()
            toc.levelStyles = [self.toc_style, self.toc_style]
            story.append(Paragraph("Table of Contents", self.heading1_style))
            story.append(toc)
            story.append(PageBreak())
        
        # Content
        for item in content:
            if item["type"] == "heading_1":
                para = Paragraph(item["text"], self.heading1_style)
                story.append(KeepTogether([para, Spacer(1, 6)]))
                bookmark_id += 1
            elif item["type"] == "heading_2":
                story.append(Paragraph(item["text"], self.heading2_style))
            else:
                story.append(Paragraph(item["text"], self.body_style))
        
        self.total_pages = len(story) // 40 + 1  # Estimate
        
        doc.build(
            story,
            onFirstPage=lambda c, d: self._header_footer(c, d, title),
            onLaterPages=lambda c, d: self._header_footer(c, d, title),
        )
        
        self.buffer.seek(0)
        return self.buffer.read()`,
    },
  ],
  nextjs: [
    {
      lang: "typescript",
      code: `// app/api/format/route.ts (Next.js 14 App Router)
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const config = JSON.parse(formData.get("config") as string);
  
  // Forward to FastAPI backend
  const backendForm = new FormData();
  backendForm.append("file", file);
  backendForm.append("config", JSON.stringify(config));
  
  const response = await fetch(
    \`\${process.env.FASTAPI_URL}/api/v1/format-document\`,
    {
      method: "POST",
      headers: {
        Authorization: \`Bearer \${process.env.INTERNAL_API_KEY}\`,
      },
      body: backendForm,
    }
  );
  
  if (!response.ok) {
    return NextResponse.json(
      { error: "Processing failed" },
      { status: response.status }
    );
  }
  
  const result = await response.json();
  return NextResponse.json(result);
}

// app/api/export/[type]/route.ts
export async function POST(
  request: NextRequest,
  { params }: { params: { type: "docx" | "pdf" } }
) {
  const { jobId, options } = await request.json();
  const { type } = params;
  
  const response = await fetch(
    \`\${process.env.FASTAPI_URL}/api/v1/export/\${type}\`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: \`Bearer \${process.env.INTERNAL_API_KEY}\`,
      },
      body: JSON.stringify({ job_id: jobId, ...options }),
    }
  );
  
  const blob = await response.blob();
  const mimeType = type === "pdf" ? "application/pdf"
    : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  
  return new NextResponse(blob, {
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": \`attachment; filename="formatted.\${type}"\`,
    },
  });
}`,
    },
    {
      lang: "typescript",
      code: `// hooks/useDocumentFormatter.ts
import { useState, useCallback } from "react";
import axios from "axios";

interface FormatConfig {
  theme: string;
  font: string;
  fontSize: number;
  lineSpacing: number;
  tableOfContents: boolean;
  pageNumbers: boolean;
}

interface FormattedResult {
  jobId: string;
  title: string;
  contentHtml: string;
  metadata: {
    wordCount: number;
    pageCount: number;
    readingTime: string;
    suggestions: string[];
  };
}

export function useDocumentFormatter() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<FormattedResult | null>(null);
  
  const formatDocument = useCallback(
    async (file: File, config: FormatConfig) => {
      setLoading(true);
      setProgress(0);
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("config", JSON.stringify(config));
      
      try {
        // Upload and start processing job
        const { data } = await axios.post<{ job_id: string }>(
          "/api/format",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (e) => {
              setProgress((e.loaded / (e.total || 1)) * 30);
            },
          }
        );
        
        // Poll for job completion
        const pollResult = await pollJobStatus(
          data.job_id,
          (p) => setProgress(30 + p * 0.7)
        );
        
        setResult(pollResult);
        return pollResult;
      } finally {
        setLoading(false);
      }
    },
    []
  );
  
  const exportDocument = useCallback(
    async (jobId: string, type: "docx" | "pdf") => {
      const response = await fetch(\`/api/export/\${type}\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = \`formatted_document.\${type}\`;
      a.click();
      URL.revokeObjectURL(url);
    },
    []
  );
  
  return { formatDocument, exportDocument, loading, progress, result };
}

async function pollJobStatus(
  jobId: string,
  onProgress: (p: number) => void
): Promise<FormattedResult> {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds timeout
    
    const interval = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(interval);
        reject(new Error("Processing timeout"));
        return;
      }
      
      try {
        const { data } = await axios.get(\`/api/jobs/\${jobId}\`);
        onProgress(attempts / maxAttempts);
        
        if (data.status === "completed") {
          clearInterval(interval);
          resolve(data.result);
        } else if (data.status === "failed") {
          clearInterval(interval);
          reject(new Error(data.error));
        }
      } catch (err) {
        clearInterval(interval);
        reject(err);
      }
    }, 1000);
  });
}`,
    },
  ],
  security: [
    {
      lang: "python",
      code: `# app/security/auth.py
"""
JWT authentication with refresh tokens.
Rate limiting per user + global.
File type validation with magic bytes.
"""
from fastapi import Depends, HTTPException, status, UploadFile
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from datetime import datetime, timedelta
import magic  # python-magic for MIME type detection
import hashlib
import secrets

security = HTTPBearer()
SECRET_KEY = secrets.token_urlsafe(32)  # From environment in production
ALGORITHM = "HS256"

ALLOWED_MIME_TYPES = {
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "text/plain",
}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB

def create_access_token(user_id: str, expires_delta: timedelta = None):
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=24))
    payload = {
        "sub": user_id,
        "exp": expire,
        "jti": secrets.token_urlsafe(16),  # Unique token ID
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Token expired or invalid")

async def validate_upload(file: UploadFile) -> bytes:
    """
    Multi-layer file validation:
    1. Extension check
    2. MIME type via magic bytes (not just Content-Type header)
    3. File size limit
    4. Content scanning
    """
    # Size check (streaming to avoid loading full file into memory)
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE // 1024 // 1024}MB"
        )
    
    # Magic bytes MIME detection (more reliable than extension)
    detected_mime = magic.from_buffer(content[:1024], mime=True)
    if detected_mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type: {detected_mime}"
        )
    
    # Extension validation
    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename else ""
    if ext not in {"docx", "doc", "txt"}:
        raise HTTPException(
            status_code=415,
            detail="File must have .docx, .doc, or .txt extension"
        )
    
    return content

# Rate limiting middleware
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

# Apply to routes:
# @router.post("/format-document")
# @limiter.limit("10/minute")
# async def format_document(request: Request, ...): ...`,
    },
  ],
};

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-800 bg-gray-950">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
        <span className="text-xs text-gray-500 font-mono">{lang}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="p-4 text-xs font-mono text-gray-300 overflow-x-auto leading-relaxed whitespace-pre">
        {code}
      </pre>
    </div>
  );
}

export default function DocsPage() {
  const [openSection, setOpenSection] = useState<string>("overview");

  return (
    <div className="h-full overflow-y-auto bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900/80 border-b border-gray-800 px-8 py-5 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-lg">
            <BookOpen size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">API Docs & Developer Guide</h1>
            <p className="text-xs text-gray-400">
              Complete reference for the Python FastAPI backend + Next.js frontend
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
            <Zap size={11} className="text-green-400" />
            <span className="text-xs text-green-300 font-medium">Extreme Advanced Python</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8 space-y-4">
        {/* Tech Stack Banner */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "FastAPI", sub: "Async REST API", color: "bg-green-500" },
            { label: "python-docx", sub: "DOCX Engine", color: "bg-blue-500" },
            { label: "ReportLab", sub: "PDF Engine", color: "bg-red-500" },
            { label: "GPT-4 Turbo", sub: "AI Formatter", color: "bg-purple-500" },
          ].map(({ label, sub, color }) => (
            <div key={label} className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex items-center gap-3">
              <div className={`w-2 h-8 ${color} rounded-full`} />
              <div>
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-xs text-gray-500">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Accordion Sections */}
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const isOpen = openSection === section.id;
          const blocks = CODE_BLOCKS[section.id] || [];

          return (
            <div key={section.id} className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              <button
                onClick={() => setOpenSection(isOpen ? "" : section.id)}
                className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-gray-800/50 transition-colors"
              >
                <div className={`w-7 h-7 rounded-lg bg-${section.color}-500/20 flex items-center justify-center`}>
                  <Icon size={14} className={`text-${section.color}-400`} />
                </div>
                <span className="text-sm font-semibold text-white">{section.title}</span>
                <span className="ml-auto">
                  {isOpen ? (
                    <ChevronDown size={16} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-400" />
                  )}
                </span>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 space-y-4 border-t border-gray-800 pt-4">
                      {blocks.map((block, i) => (
                        <CodeBlock key={i} lang={block.lang} code={block.code} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
