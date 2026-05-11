"""
Document formatting router.

POST /api/v1/format-document
  - Accepts multipart file upload + JSON config
  - Validates file type via magic bytes
  - Queues processing job
  - Returns job_id for status polling
"""



import json
import logging
import uuid
from typing import Annotated, Any

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    Request,
    UploadFile,
    status,
)
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import Settings, get_settings
from app.models.schemas import (
    FormattingConfig,
    FormatJobResponse,
    JobStatus,
)
from app.security.auth import get_current_user, validate_upload
from app.services.document_parser import AdvancedDocumentParser

logger = logging.getLogger("docuforge.router.documents")
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

# In-memory job store (replace with Redis in production)
JOB_STORE: dict[str, dict] = {}


@router.post(
    "/format-document",
    response_model=FormatJobResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Upload and format a document",
    description="""
Upload a Word document (.docx, .doc) or plain text (.txt) file
and apply AI-powered professional formatting.

The document is processed asynchronously:
1. File validation (MIME type, size, extension)
2. DOCX parsing via python-docx (OOXML level)
3. NLP preprocessing (spaCy + NLTK)
4. GPT-4 Turbo semantic reformatting
5. DOCX/PDF generation

Returns a `job_id` to poll for completion via GET /api/v1/jobs/{job_id}
    """,
)
@limiter.limit("10/minute")
async def format_document(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="Document file (.docx, .doc, .txt)"),
    config: str = Form(
        default="{}",
        description="JSON formatting configuration (FormattingConfig schema)",
    ),
    current_user: dict[str, Any] = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> FormatJobResponse:
    """Upload document and start async formatting job."""

    # Parse config
    try:
        config_data = json.loads(config)
        fmt_config = FormattingConfig(**config_data)
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid formatting config: {e}",
        )

    # Validate file
    file_content = await validate_upload(file)

    # Create job
    job_id = str(uuid.uuid4())
    JOB_STORE[job_id] = {
        "status": JobStatus.QUEUED,
        "progress": 0.0,
        "user_id": current_user["user_id"],
        "file_name": file.filename,
        "file_content": file_content,
        "config": fmt_config,
        "result": None,
        "error": None,
    }

    # Queue background processing
    background_tasks.add_task(
        _process_document_job,
        job_id=job_id,
        file_content=file_content,
        file_name=file.filename or "document.docx",
        config=fmt_config,
        settings=settings,
        nlp=getattr(request.app.state, "nlp", None),
    )

    logger.info(f"Job {job_id} created for user {current_user['user_id']}: {file.filename}")

    return FormatJobResponse(
        job_id=job_id,
        status=JobStatus.QUEUED,
        message="Document queued for AI formatting",
        estimated_seconds=8,
        preview_url=f"/api/v1/jobs/{job_id}",
    )


async def _process_document_job(
    job_id: str,
    file_content: bytes,
    file_name: str,
    config: FormattingConfig,
    settings: Settings,
    nlp=None,
):
    """Background task: parse, NLP analyze, AI format."""
    import time
    from app.services.ai_formatter import AIDocumentFormatter
    from app.services.nlp_pipeline import NLPPipeline

    job = JOB_STORE.get(job_id)
    if not job:
        return

    start = time.monotonic()

    try:
        # Step 1: Parse document
        job["status"] = JobStatus.PROCESSING
        job["progress"] = 0.1
        parser = AdvancedDocumentParser(file_content, file_name)
        parsed = parser.parse()
        logger.info(f"Job {job_id}: parsed {len(parsed.paragraphs)} paragraphs")

        # Step 2: NLP analysis
        job["progress"] = 0.25
        nlp_pipeline = NLPPipeline(spacy_nlp=nlp)
        nlp_analysis = nlp_pipeline.analyze(
            [{"text": p.text, "type": p.type.value} for p in parsed.paragraphs]
        )
        logger.info(f"Job {job_id}: NLP analysis complete")

        # Step 3: Professional Formatting Rules (API-Free)
        job["progress"] = 0.40
        from app.services.rule_formatter import RuleBasedFormatter
        
        # Always apply professional rules first
        rule_formatter = RuleBasedFormatter(config)
        ai_result = rule_formatter.format(parsed)
        
        # Step 3.5: Optional AI Enhancement (Only if key exists)
        if settings.has_ai_key:
            try:
                job["status_text"] = "Enhancing with AI Intelligence..."
                formatter = AIDocumentFormatter(
                    api_key=settings.OPENAI_API_KEY,
                    base_url=settings.OPENAI_BASE_URL,
                    model=settings.AI_MODEL,
                )
                # AI can refine the already rule-formatted text
                ai_result = await formatter.format_document(parsed, config)
            except Exception as e:
                logger.error(f"AI enhancement failed, sticking with rule-based result: {e}")

        job["progress"] = 0.85

        # Step 4: Build metadata
        elapsed = time.monotonic() - start
        word_count = sum(len(p.formatted_text.split()) for p in ai_result.paragraphs)
        page_count = max(1, word_count // 250)
        reading_minutes = max(1, word_count // 200)

        from app.models.schemas import (
            DocumentMetadata,
            FormattedDocumentResult,
        )

        # Convert to HTML for frontend editor
        content_html = _paragraphs_to_html(ai_result.paragraphs, config)

        result = FormattedDocumentResult(
            job_id=job_id,
            title=ai_result.title,
            content_html=content_html,
            metadata=DocumentMetadata(
                word_count=word_count,
                page_count=page_count,
                reading_time=f"{reading_minutes} min read",
                language=parsed.detected_language,
                readability_score=ai_result.readability_score,
                grammar_errors_fixed=ai_result.grammar_errors_fixed,
                formatting_changes=len(ai_result.paragraphs),
                suggestions=ai_result.suggestions,
            ),
            processing_time_seconds=round(elapsed, 2),
            config_applied=config,
        )

        job["status"] = JobStatus.COMPLETED
        job["progress"] = 1.0
        job["result"] = result
        job["ai_result"] = ai_result  # Store for export

        logger.info(f"Job {job_id} completed in {elapsed:.2f}s")

    except Exception as e:
        logger.error(f"Job {job_id} failed: {e}", exc_info=True)
        job["status"] = JobStatus.FAILED
        job["error"] = str(e)


def _paragraphs_to_html(paragraphs, config: FormattingConfig) -> str:
    """Convert FormattedParagraph list to HTML for frontend editor."""
    from app.models.schemas import ParagraphType

    color = config.primary_color
    font = config.font
    size = config.font_size
    spacing = config.line_spacing

    parts = []
    for para in paragraphs:
        text = para.formatted_text
        if para.type == ParagraphType.HEADING_1:
            parts.append(
                f'<h1 style="color:{color};font-family:{font};font-size:{size+8}pt;font-weight:700;margin-top:24px;margin-bottom:12px">{text}</h1>'
            )
        elif para.type == ParagraphType.HEADING_2:
            parts.append(
                f'<h2 style="color:{color};font-family:{font};font-size:{size+4}pt;font-weight:600;margin-top:20px;margin-bottom:10px">{text}</h2>'
            )
        elif para.type == ParagraphType.HEADING_3:
            parts.append(
                f'<h3 style="color:{color};font-family:{font};font-size:{size+1}pt;font-weight:600;margin-top:16px;margin-bottom:8px">{text}</h3>'
            )
        elif para.type == ParagraphType.LIST_ITEM:
            parts.append(
                f'<div style="font-family:{font};font-size:{size}pt;line-height:{spacing};display:list-item;list-style-type:disc;margin-left:40px;margin-bottom:8px">{text}</div>'
            )
        elif para.type == ParagraphType.NUMBERED_LIST:
            parts.append(
                f'<div style="font-family:{font};font-size:{size}pt;line-height:{spacing};display:list-item;list-style-type:decimal;margin-left:40px;margin-bottom:8px">{text}</div>'
            )
        elif para.type == ParagraphType.BLOCK_QUOTE:
            parts.append(
                f'<blockquote style="border-left:3px solid {color};padding-left:16px;margin-left:20px;font-style:italic;color:#4b5563;margin-top:16px;margin-bottom:16px">{text}</blockquote>'
            )
        else:
            parts.append(
                f'<p style="font-family:{font};font-size:{size}pt;line-height:{spacing};text-align:justify;margin-bottom:16px">{text}</p>'
            )

    return "\n".join(parts)
