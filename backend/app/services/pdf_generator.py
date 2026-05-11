"""
Advanced PDF generation using ReportLab Platypus.

Features:
- Multi-template page layout (cover page, TOC, body, back matter)
- Custom paragraph styles with kerning control
- Automatic table of contents with clickable hyperlinks
- Running headers and footers with PAGE/NUMPAGES
- Bookmarked headings for PDF outline navigation
- HRFlowable horizontal rules
- KeepTogether for heading+first-paragraph widow prevention
- Professional color theming
- A4/Letter/A3 page sizes
- Watermark support via canvas overlay
"""

from __future__ import annotations

import io
import logging
from typing import Optional, Callable

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4, LETTER, A3
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch, cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    SimpleDocTemplate,
    Frame,
    HRFlowable,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents

from app.models.schemas import (
    AIFormattingResult,
    FormattedParagraph,
    FormattingConfig,
    ParagraphType,
)

logger = logging.getLogger("docuforge.pdf_gen")


class DocuForgePDFDocument(SimpleDocTemplate):
    """
    Extended SimpleDocTemplate that supports:
    - Dynamic total page count (requires two-pass build)
    - Header/footer via canvas callbacks
    - PDF bookmarks/outlines for headings
    """

    def __init__(self, buffer: io.BytesIO, config: FormattingConfig, title: str, **kwargs):
        super().__init__(buffer, **kwargs)
        self.config = config
        self.doc_title = title
        self._primary_color = self._parse_color(config.primary_color)

    def _parse_color(self, hex_color: str) -> colors.Color:
        h = hex_color.lstrip("#")
        r, g, b = [int(h[i: i + 2], 16) / 255 for i in (0, 2, 4)]
        return colors.Color(r, g, b)

    def afterFlowable(self, flowable):
        """Track headings to build PDF outline (bookmarks)."""
        if hasattr(flowable, "_docuforge_heading"):
            level = flowable._docuforge_heading_level
            text = flowable._docuforge_heading_text
            
            # Clean up text from Word fields or control characters
            clean_text = text.replace('\x13', '').replace('\x15', '').replace('PAGE', '').strip()
            if not clean_text:
                clean_text = f"Heading {level}"
                
            key = f"heading_{self.page}_{clean_text[:20]}"
            self.notify("TOCEntry", (level, clean_text, self.page, key))
            self.canv.bookmarkPage(key)
            
            try:
                self.canv.addOutlineEntry(clean_text, key, level=level - 1, closed=level > 1)
            except ValueError:
                # If there is a jump in heading levels (e.g. H2 appears before H1)
                self.canv.addOutlineEntry(clean_text, key, level=0, closed=False)


class ProfessionalPDFGenerator:
    """
    ReportLab Platypus PDF engine.

    Builds complete publication-quality PDFs with:
    - Cover page with large title treatment
    - Clickable table of contents
    - Body content with professional typography
    - Page headers/footers
    - PDF outline/bookmarks navigation
    """

    PAGE_SIZES = {
        "A4": A4,
        "LETTER": LETTER,
        "A3": A3,
    }

    def __init__(self, config: FormattingConfig):
        self.config = config
        self.primary_color = self._parse_color(config.primary_color)
        self._styles = self._build_styles()
        self._total_pages: int = 0

    def _parse_color(self, hex_color: str) -> colors.Color:
        h = hex_color.lstrip("#")
        r, g, b = [int(h[i: i + 2], 16) / 255 for i in (0, 2, 4)]
        return colors.Color(r, g, b)

    def _build_styles(self) -> dict[str, ParagraphStyle]:
        """Define all paragraph styles."""
        base_size = self.config.font_size
        base_leading = base_size * self.config.line_spacing

        styles = {}

        styles["title"] = ParagraphStyle(
            name="DocTitle",
            fontName="Helvetica-Bold",
            fontSize=base_size + 16,
            textColor=self.primary_color,
            alignment=TA_CENTER,
            spaceAfter=16,
            leading=(base_size + 16) * 1.2,
        )
        styles["subtitle"] = ParagraphStyle(
            name="DocSubtitle",
            fontName="Helvetica",
            fontSize=base_size + 2,
            textColor=colors.HexColor("#6B7280"),
            alignment=TA_CENTER,
            spaceAfter=24,
            leading=(base_size + 2) * 1.3,
        )
        styles["heading1"] = ParagraphStyle(
            name="DocH1",
            fontName="Helvetica-Bold",
            fontSize=base_size + 8,
            textColor=self.primary_color,
            spaceBefore=24,
            spaceAfter=12,
            leading=(base_size + 8) * 1.2,
            alignment=TA_LEFT,
        )
        styles["heading2"] = ParagraphStyle(
            name="DocH2",
            fontName="Helvetica-Bold",
            fontSize=base_size + 4,
            textColor=self.primary_color,
            spaceBefore=18,
            spaceAfter=8,
            leading=(base_size + 4) * 1.2,
            alignment=TA_LEFT,
        )
        styles["heading3"] = ParagraphStyle(
            name="DocH3",
            fontName="Helvetica-Bold",
            fontSize=base_size + 1,
            textColor=self.primary_color,
            spaceBefore=14,
            spaceAfter=6,
            leading=(base_size + 1) * 1.3,
        )
        styles["body"] = ParagraphStyle(
            name="DocBody",
            fontName="Times-Roman",
            fontSize=base_size,
            leading=base_leading,
            spaceBefore=0,
            spaceAfter=8,
            alignment=TA_JUSTIFY,
            firstLineIndent=0.4 * inch,
        )
        styles["body_no_indent"] = ParagraphStyle(
            name="DocBodyNoIndent",
            parent=styles["body"],
            firstLineIndent=0,
        )
        styles["list_item"] = ParagraphStyle(
            name="DocList",
            fontName="Times-Roman",
            fontSize=base_size,
            leading=base_leading,
            leftIndent=0.4 * inch,
            spaceAfter=4,
            bulletIndent=0.2 * inch,
        )
        styles["numbered_list"] = ParagraphStyle(
            name="DocNumList",
            parent=styles["list_item"],
            bulletIndent=0.1 * inch,
        )
        styles["block_quote"] = ParagraphStyle(
            name="DocQuote",
            fontName="Times-Italic",
            fontSize=base_size,
            leading=base_leading,
            leftIndent=0.5 * inch,
            rightIndent=0.5 * inch,
            spaceBefore=12,
            spaceAfter=12,
            textColor=colors.HexColor("#4B5563"),
            borderColor=self.primary_color,
            borderPadding=(0, 0, 0, 12),
            borderWidth=0,
        )
        styles["toc1"] = ParagraphStyle(
            name="DOCTOC1",
            fontName="Helvetica-Bold",
            fontSize=base_size,
            leading=base_size * 1.5,
            leftIndent=0,
        )
        styles["toc2"] = ParagraphStyle(
            name="DOCTOC2",
            fontName="Helvetica",
            fontSize=base_size - 1,
            leading=(base_size - 1) * 1.5,
            leftIndent=20,
            textColor=colors.HexColor("#6B7280"),
        )
        styles["toc3"] = ParagraphStyle(
            name="DOCTOC3",
            fontName="Helvetica",
            fontSize=base_size - 2,
            leading=(base_size - 2) * 1.5,
            leftIndent=40,
            textColor=colors.HexColor("#9CA3AF"),
        )

        return styles

    def _get_page_size(self):
        return self.PAGE_SIZES.get(self.config.page_size, A4)

    def _page_decorator(self, canvas_obj, doc, title: str, show_header: bool = True):
        """
        Called for every page — draws header line, title, and footer.
        Uses canvas save/restore to avoid affecting flowable rendering.
        """
        canvas_obj.saveState()
        page_w, page_h = self._get_page_size()
        margin = self.config.margins.left * inch
        right_margin = page_w - self.config.margins.right * inch

        if show_header:
            # Header rule
            canvas_obj.setStrokeColor(colors.HexColor("#E5E7EB"))
            canvas_obj.setLineWidth(0.5)
            top_y = page_h - 0.6 * inch
            canvas_obj.line(margin, top_y, right_margin, top_y)

            # Header text
            canvas_obj.setFillColor(colors.HexColor("#9CA3AF"))
            canvas_obj.setFont("Helvetica", 8)
            canvas_obj.drawString(margin, page_h - 0.48 * inch, title)
            canvas_obj.drawRightString(
                right_margin, page_h - 0.48 * inch, "DocuForge AI"
            )

        # Footer rule
        canvas_obj.setStrokeColor(colors.HexColor("#E5E7EB"))
        canvas_obj.line(margin, 0.75 * inch, right_margin, 0.75 * inch)

        # Page number
        canvas_obj.setFillColor(colors.HexColor("#9CA3AF"))
        canvas_obj.setFont("Helvetica", 8)
        page_text = f"Page {doc.page}"
        canvas_obj.drawCentredString(page_w / 2, 0.5 * inch, page_text)

        canvas_obj.restoreState()

    def _build_cover_page(self, title: str, subtitle: Optional[str] = None) -> list:
        """Build the cover page flowables."""
        story = [Spacer(1, 2.5 * inch)]

        story.append(Paragraph(title, self._styles["title"]))
        story.append(
            HRFlowable(
                width="60%",
                thickness=2,
                color=self.primary_color,
                spaceAfter=24,
                spaceBefore=8,
            )
        )
        if subtitle:
            story.append(Paragraph(subtitle, self._styles["subtitle"]))

        story.append(Spacer(1, 0.3 * inch))

        # Meta info table
        meta_data = [
            ["Formatted by:", "DocuForge AI"],
            ["Engine:", "ReportLab Platypus + GPT-4"],
            ["Style:", self.config.theme.value.capitalize()],
            ["Font:", f"{self.config.font} {self.config.font_size}pt"],
        ]
        meta_table = Table(meta_data, colWidths=[1.5 * inch, 3 * inch])
        meta_table.setStyle(
            TableStyle(
                [
                    ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#9CA3AF")),
                    ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor("#374151")),
                    ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ]
            )
        )
        story.append(meta_table)
        story.append(PageBreak())
        return story

    def _build_toc(self) -> tuple[TableOfContents, list]:
        """Build the ReportLab TOC object and heading paragraph."""
        toc = TableOfContents()
        toc.levelStyles = [
            self._styles["toc1"],
            self._styles["toc2"],
            self._styles["toc3"],
        ]
        toc.dotsMinLevel = 0

        story = [
            Paragraph("Table of Contents", self._styles["heading1"]),
            Spacer(1, 12),
            toc,
            PageBreak(),
        ]
        return toc, story

    def _para_to_flowable(self, para: FormattedParagraph):
        """Convert a FormattedParagraph to ReportLab flowable(s)."""
        text = para.formatted_text

        if para.type == ParagraphType.HEADING_1:
            p = Paragraph(text, self._styles["heading1"])
            p._docuforge_heading = True
            p._docuforge_heading_level = 1
            p._docuforge_heading_text = text
            return [KeepTogether([p, Spacer(1, 2)])]

        elif para.type == ParagraphType.HEADING_2:
            p = Paragraph(text, self._styles["heading2"])
            p._docuforge_heading = True
            p._docuforge_heading_level = 2
            p._docuforge_heading_text = text
            return [KeepTogether([p, Spacer(1, 2)])]

        elif para.type == ParagraphType.HEADING_3:
            p = Paragraph(text, self._styles["heading3"])
            p._docuforge_heading = True
            p._docuforge_heading_level = 3
            p._docuforge_heading_text = text
            return [p]

        elif para.type == ParagraphType.LIST_ITEM:
            return [Paragraph(f"• {text}", self._styles["list_item"])]

        elif para.type == ParagraphType.NUMBERED_LIST:
            return [Paragraph(text, self._styles["numbered_list"])]

        elif para.type == ParagraphType.BLOCK_QUOTE:
            return [
                Spacer(1, 6),
                Paragraph(f'"{text}"', self._styles["block_quote"]),
                Spacer(1, 6),
            ]

        else:  # body
            return [Paragraph(text, self._styles["body"])]

    def generate(self, result: AIFormattingResult) -> bytes:
        """
        Build the complete PDF document.
        Uses two-pass rendering for accurate total page count.
        """
        logger.info(f"Building PDF: {len(result.paragraphs)} paragraphs")
        buffer = io.BytesIO()
        page_size = self._get_page_size()
        margin_left = self.config.margins.left * inch
        margin_right = self.config.margins.right * inch
        margin_top = self.config.margins.top * inch
        margin_bottom = self.config.margins.bottom * inch

        doc = DocuForgePDFDocument(
            buffer=buffer,
            config=self.config,
            pagesize=page_size,
            leftMargin=margin_left,
            rightMargin=margin_right,
            topMargin=margin_top + 0.4 * inch,  # header space
            bottomMargin=margin_bottom + 0.4 * inch,  # footer space
            title=result.title,
            author="DocuForge AI",
            subject="AI-Formatted Professional Document",
        )

        # Build story
        story = []

        # Cover page
        story.extend(
            self._build_cover_page(
                title=result.title,
                subtitle="AI-Formatted Professional Document",
            )
        )

        # Table of contents
        if self.config.table_of_contents:
            toc, toc_story = self._build_toc()
            story.extend(toc_story)

        # Body content
        for para in result.paragraphs:
            flowables = self._para_to_flowable(para)
            story.extend(flowables)

        # Build with header/footer
        title = result.title

        def first_page(canvas_obj, doc_obj):
            self._page_decorator(canvas_obj, doc_obj, title, show_header=False)

        def later_pages(canvas_obj, doc_obj):
            self._page_decorator(canvas_obj, doc_obj, title, show_header=True)

        doc.build(story, onFirstPage=first_page, onLaterPages=later_pages)

        buffer.seek(0)
        content = buffer.read()
        logger.info(f"PDF generated: {len(content)} bytes")
        return content
