"""
Pydantic schemas for request/response validation.
Uses strict typing and comprehensive validation.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


# ─── Enums ────────────────────────────────────────────────────────────────────

class DocumentTheme(str, Enum):
    PROFESSIONAL = "professional"
    MODERN = "modern"
    ACADEMIC = "academic"
    MINIMAL = "minimal"
    EXECUTIVE = "executive"


class HeaderStyle(str, Enum):
    CENTERED = "centered"
    LEFT = "left"
    BANNER = "banner"


class ExportFormat(str, Enum):
    DOCX = "docx"
    PDF = "pdf"


class JobStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ParagraphType(str, Enum):
    HEADING_1 = "heading_1"
    HEADING_2 = "heading_2"
    HEADING_3 = "heading_3"
    HEADING_4 = "heading_4"
    BODY = "body"
    LIST_ITEM = "list_item"
    NUMBERED_LIST = "numbered_list"
    BLOCK_QUOTE = "block_quote"
    CODE_BLOCK = "code_block"
    TABLE = "table"


# ─── Formatting Config ────────────────────────────────────────────────────────

class MarginConfig(BaseModel):
    top: float = Field(default=1.0, ge=0.25, le=3.0, description="Inches")
    right: float = Field(default=1.0, ge=0.25, le=3.0)
    bottom: float = Field(default=1.0, ge=0.25, le=3.0)
    left: float = Field(default=1.25, ge=0.25, le=3.0)


class FormattingConfig(BaseModel):
    font: str = Field(default="Times New Roman", max_length=100)
    font_size: int = Field(default=12, ge=8, le=72, description="Point size")
    line_spacing: float = Field(default=1.5, ge=1.0, le=3.0)
    margins: MarginConfig = Field(default_factory=MarginConfig)
    theme: DocumentTheme = DocumentTheme.PROFESSIONAL
    primary_color: str = Field(
        default="#1e40af",
        pattern=r"^#[0-9A-Fa-f]{6}$",
        description="Hex color code"
    )
    header_style: HeaderStyle = HeaderStyle.CENTERED
    table_of_contents: bool = True
    page_numbers: bool = True
    header_footer: bool = True
    watermark: Optional[str] = Field(default=None, max_length=50)
    page_size: str = Field(default="A4", pattern=r"^(A4|LETTER|A3|LEGAL)$")
    orientation: str = Field(default="portrait", pattern=r"^(portrait|landscape)$")

    @field_validator("primary_color")
    @classmethod
    def validate_color(cls, v: str) -> str:
        return v.upper() if v.startswith("#") else f"#{v}".upper()


# ─── Document Structures ──────────────────────────────────────────────────────

class RunMetadata(BaseModel):
    """Character-level formatting metadata from a docx Run."""
    text: str
    bold: Optional[bool] = None
    italic: Optional[bool] = None
    underline: Optional[bool] = None
    font_name: Optional[str] = None
    font_size: Optional[float] = None
    color: Optional[str] = None
    highlight: Optional[str] = None


class ParsedParagraph(BaseModel):
    """Single paragraph extracted from the source document."""
    index: int
    text: str
    type: ParagraphType = ParagraphType.BODY
    style: str = "Normal"
    alignment: Optional[str] = None
    runs: list[RunMetadata] = Field(default_factory=list)
    outline_level: int = Field(default=9, ge=0, le=9)
    is_heading: bool = False
    word_count: int = 0

    @model_validator(mode="after")
    def compute_word_count(self) -> "ParsedParagraph":
        self.word_count = len(self.text.split())
        self.is_heading = self.type.value.startswith("heading")
        return self


class ParsedTable(BaseModel):
    """Table extracted from the source document."""
    index: int
    rows: list[list[str]]
    col_count: int
    row_count: int
    has_header: bool = True


class ParsedDocument(BaseModel):
    """Complete parsed document structure."""
    file_name: str
    file_size_bytes: int
    paragraphs: list[ParsedParagraph]
    tables: list[ParsedTable] = Field(default_factory=list)
    image_count: int = 0
    total_word_count: int = 0
    detected_language: str = "en"
    has_existing_toc: bool = False


# ─── AI Output ────────────────────────────────────────────────────────────────

class FormattedParagraph(BaseModel):
    """AI-formatted paragraph with corrections."""
    index: int
    original_text: str
    formatted_text: str
    type: ParagraphType = ParagraphType.BODY
    grammar_corrections: list[str] = Field(default_factory=list)
    style_suggestions: list[str] = Field(default_factory=list)


class AIFormattingResult(BaseModel):
    """Structured output from GPT-4 formatting pass."""
    title: str
    abstract: Optional[str] = None
    paragraphs: list[FormattedParagraph]
    toc_entries: list[dict[str, Any]] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)
    readability_score: int = Field(ge=0, le=100)
    grammar_errors_fixed: int = 0
    detected_style: str = "General"


# ─── API Requests / Responses ────────────────────────────────────────────────

class FormatDocumentRequest(BaseModel):
    """Multipart form data (parsed from FormData fields)."""
    config: FormattingConfig = Field(default_factory=FormattingConfig)


class FormatJobResponse(BaseModel):
    """Returned immediately after upload, before processing completes."""
    job_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: JobStatus = JobStatus.QUEUED
    message: str = "Document queued for processing"
    estimated_seconds: int = 8
    preview_url: Optional[str] = None


class DocumentMetadata(BaseModel):
    word_count: int
    page_count: int
    reading_time: str
    language: str
    readability_score: int
    grammar_errors_fixed: int
    formatting_changes: int
    suggestions: list[str]


class FormattedDocumentResult(BaseModel):
    """Full result returned when job completes."""
    job_id: str
    status: JobStatus = JobStatus.COMPLETED
    title: str
    content_html: str
    metadata: DocumentMetadata
    processing_time_seconds: float
    config_applied: FormattingConfig


class JobStatusResponse(BaseModel):
    job_id: str
    status: JobStatus
    progress: float = Field(ge=0.0, le=1.0)
    message: str = ""
    result: Optional[FormattedDocumentResult] = None
    error: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ExportRequest(BaseModel):
    job_id: str
    format: ExportFormat
    options: dict[str, Any] = Field(default_factory=dict)


# ─── Auth ─────────────────────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class LoginRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8)
