from fastapi import APIRouter
from app.api.v1.ws import event
import app.api.v1.state as state

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.post("/notify")
async def notify(message: str):
    state.current_message = message
    event.set()