from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas import LoginRequest, TokenResponse
from app.security.auth import get_current_user

router = APIRouter()

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """
    Mock login endpoint. 
    In a real app, this would verify credentials and return a real JWT.
    """
    if request.username == "admin" and request.password == "password123":
        return TokenResponse(
            access_token="mock_access_token",
            refresh_token="mock_refresh_token",
            expires_in=3600
        )
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid username or password"
    )

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user info."""
    return current_user
