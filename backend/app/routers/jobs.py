from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas import JobStatusResponse
from app.routers.documents import JOB_STORE
from app.security.auth import get_current_user

router = APIRouter()

@router.get("/{job_id}", response_model=JobStatusResponse)
async def get_job_status(
    job_id: str, 
    current_user: dict = Depends(get_current_user)
):
    """
    Poll for document formatting job status.
    """
    job = JOB_STORE.get(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found"
        )
    
    if job["user_id"] != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this job"
        )
        
    return JobStatusResponse(
        job_id=job_id,
        status=job["status"],
        progress=job["progress"],
        message="Processing document..." if job["status"] == "processing" else "Done",
        result=job["result"],
        error=job["error"]
    )
