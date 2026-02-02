# Health Check Endpoint
# Добавьте этот код в backend/main.py

from fastapi import APIRouter

health_router = APIRouter(prefix="/api", tags=["health"])

@health_router.get("/health")
async def health_check():
    """
    Health check endpoint для мониторинга
    """
    return {
        "status": "healthy",
        "service": "BeauTips Backend",
        "version": "2.0.0"
    }

# Не забудьте добавить router в main.py:
# app.include_router(health_router)
