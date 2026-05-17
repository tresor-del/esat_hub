from pydantic import BaseModel

class DeviceRegistration(BaseModel):
    user_id: int
    device_token: str
