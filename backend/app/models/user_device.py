from pydantic import BaseModel
from uuid import UUID

class DeviceRegistration(BaseModel):
    user_id: UUID
    device_token: str
