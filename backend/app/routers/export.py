"""
Document export router.

POST /api/v1/export/docx  → Returns .docx binary
POST /api/v1/export/pdf   → Returns .pdf binary
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response

from app.models.schemas import ExportFormat, ExportRequest, JobStatus
from app.routers.documents import JOB_STORE
from app.security.auth import get_current_user
from app.services.docx_generator import ProfessionalDocxGenerator
from app.services.pdf_generator import ProfessionalPDFGenerator

logger = logging.getLogger("docuforge.router.export")
router = APIRouter()


@router.post(
    "/docx",
    summary="Export formatted document as DOCX",
    description="Generates a professional .docx file using python-docx with OOXML manipulation.",
    responses={
        200: {
            "content": {
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {}
            },
            "description": "DOCX file",
        }
    },
)
async def export_docx(
    request: ExportRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> Response:
    """Generate and stream a DOCX file for the completed job."""
    job = _get_completed_job(request.job_id, current_user["user_id"])

    ai_result = job.get("ai_result")
    if not ai_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI formatting result not found for this job",
        )

    config = job["config"]

    logger.info(f"Generating DOCX for job {request.job_id}")
    generator = ProfessionalDocxGenerator(config)
    docx_bytes = generator.build(ai_result)

    safe_title = ai_result.title[:50].replace(" ", "_").replace("/", "-")
    safe_title = safe_title.encode("ascii", "ignore").decode("ascii")
    filename = f"{safe_title}_formatted.docx"

    return Response(
        content=docx_bytes,
        media_type=(
            "application/vnd.openxmlformats-officedocument"
            ".wordprocessingml.document"
        ),
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(docx_bytes)),
        },
    )


@router.post(
    "/pdf",
    summary="Export formatted document as PDF",
    description="Generates a publication-ready PDF using ReportLab Platypus.",
    responses={
        200: {
            "content": {"application/pdf": {}},
            "description": "PDF file",
        }
    },
)
async def export_pdf(
    request: ExportRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> Response:
    """Generate and stream a PDF file for the completed job."""
    job = _get_completed_job(request.job_id, current_user["user_id"])

    ai_result = job.get("ai_result")
    if not ai_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI formatting result not found for this job",
        )

    config = job["config"]

    logger.info(f"Generating PDF for job {request.job_id}")
    generator = ProfessionalPDFGenerator(config)
    pdf_bytes = generator.generate(ai_result)

    safe_title = ai_result.title[:50].replace(" ", "_").replace("/", "-")
    safe_title = safe_title.encode("ascii", "ignore").decode("ascii")
    filename = f"{safe_title}_formatted.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(pdf_bytes)),
        },
    )


def _get_completed_job(job_id: str, user_id: str) -> dict:
    """Fetch and validate a completed job."""
    job = JOB_STORE.get(job_id)

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found",
        )

    if job["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this job",
        )

    if job["status"] != JobStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Job is not completed (status: {job['status'].value})",
        )

    return job
