"""
DocuForge AI — FastAPI Backend Entry Point
==========================================
Advanced AI-powered document formatting engine.

Tech Stack:
- FastAPI (async REST API)
- python-docx (DOCX parsing and generation)
- ReportLab Platypus (PDF rendering)
- OpenAI GPT-4 Turbo (AI formatting intelligence)
- spaCy + NLTK (NLP preprocessing)
- WeasyPrint (HTML→PDF fallback)
- Celery + Redis (async job queue)
- JWT authentication

Author: DocuForge AI Team
Version: 2.0.0
"""

import logging
import uuid
from contextlib import asynccontextmanager
from typing import Annotated

import nltk
import spacy
from fastapi import (
    Depends,
    FastAPI,
    File,
    Form,
    HTTPException,
    Request,
    UploadFile,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import Settings, get_settings
from app.routers import auth, documents, export, jobs
from app.services.nlp_pipeline import NLPPipeline

# ─── Logging ────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)-8s │ %(name)s │ %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("docuforge.main")

# ─── Rate Limiter ────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["200/hour"])


# ─── Lifespan (startup/shutdown) ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize ML models and NLP resources on startup."""
    logger.info("🚀 DocuForge AI starting up...")

    # Download NLTK data
    try:
        nltk.download("punkt", quiet=True)
        nltk.download("stopwords", quiet=True)
        nltk.download("averaged_perceptron_tagger", quiet=True)
        logger.info("✅ NLTK corpora loaded")
    except Exception as e:
        logger.warning(f"NLTK download failed: {e}")

    # Load spaCy model
    try:
        nlp = spacy.load("en_core_web_sm")
        app.state.nlp = nlp
        logger.info("✅ spaCy en_core_web_sm loaded")
    except OSError:
        logger.warning("spaCy model not found. Run: python -m spacy download en_core_web_sm")
        app.state.nlp = None

    logger.info("✅ DocuForge AI ready")
    yield

    # Cleanup
    logger.info("🛑 DocuForge AI shutting down...")
    app.state.nlp = None


# ─── FastAPI App ──────────────────────────────────────────────────────────────
def create_application() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="DocuForge AI API",
        description="""
## 🤖 AI-Powered Professional Document Formatting Engine

DocuForge AI transforms raw Word documents into professionally formatted,
publication-ready documents using GPT-4 intelligence and advanced Python
document processing libraries.

### Features
- **Document Parsing**: Deep OOXML parsing with python-docx
- **AI Formatting**: GPT-4 Turbo semantic restructuring
- **NLP Pipeline**: spaCy + NLTK preprocessing
- **DOCX Export**: Professional styles via python-docx OOXML manipulation
- **PDF Export**: ReportLab Platypus with custom page templates
- **Async Processing**: Celery job queue for large documents
- **JWT Auth**: Secure token-based authentication
        """,
        version="2.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # ── Middleware ────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(GZipMiddleware, minimum_size=1000)

    # Rate limit error handler
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # ── Routers ───────────────────────────────────────────────────────────────
    app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
    app.include_router(documents.router, prefix="/api/v1", tags=["Documents"])
    app.include_router(export.router, prefix="/api/v1/export", tags=["Export"])
    app.include_router(jobs.router, prefix="/api/v1/jobs", tags=["Jobs"])

    # ── Health Check ─────────────────────────────────────────────────────────
    @app.get("/health", tags=["System"])
    async def health_check(request: Request):
        return {
            "status": "healthy",
            "version": "2.0.0",
            "nlp_loaded": request.app.state.nlp is not None,
            "services": {
                "python_docx": "ready",
                "reportlab": "ready",
                "openai": "configured" if settings.OPENAI_API_KEY else "not_configured",
                "spacy": "loaded" if request.app.state.nlp else "unavailable",
            },
        }

    return app


app = create_application()
