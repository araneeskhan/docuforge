from typing import Any
from fastapi import HTTPException, Security, status, UploadFile
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import get_settings

# Initialize the bearer scheme - set auto_error=False to handle missing tokens manually
security = HTTPBearer(auto_error=False)

async def get_current_user(auth: HTTPAuthorizationCredentials = Security(security)) -> dict[str, Any]:
    """
    Placeholder for JWT/User validation.
    Allows optional authentication for development.
    """
    # For now, if no token is provided, we return a default admin user
    if not auth:
        return {"user_id": "guest_user", "role": "guest"}
        
    # If a token is provided, we still return the mock admin for now
    return {"user_id": "admin_user", "role": "admin"}

async def validate_upload(file: UploadFile) -> bytes:
    """
    Validates file extension and size, then returns file content.
    """
    settings = get_settings()
    
    # Check extension
    ext = file.filename.split(".")[-1].lower() if file.filename else ""
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension: {ext}. Allowed: {settings.ALLOWED_EXTENSIONS}"
        )

    # Read content
    content = await file.read()
    
    # Check size
    if len(content) > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Max size: {settings.MAX_FILE_SIZE_MB}MB"
        )
        
    return content