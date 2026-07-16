from datetime import datetime
from typing import List, Optional
import uuid

from pydantic import BaseModel, ConfigDict

from app.models.user import UserResponse
from app.models.room import RoomResponse
from app.models.media import MediaResponse


class AssignmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    room_id: uuid.UUID
    subject: str
    due_date: datetime
    
    model_config = ConfigDict(from_attributes=True)
    
class AssignmentCreate(AssignmentBase):
    pass

class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    room_id: Optional[uuid.UUID] = None
    subject: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None
    media: Optional[List[MediaResponse]] = []
    
class AssignmentResponse(AssignmentBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    teacher_id: uuid.UUID
    teacher: UserResponse
    status: str
    room: RoomResponse
    media: List[MediaResponse] = []
    submissions: List["AssignmentSubmissionResponse"] = []
    
class AssignmentSubmissionBase(BaseModel):
    assignment_id: uuid.UUID
    student_id: uuid.UUID
    grade: Optional[int] = None
    feedback: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)
    
class AssignmentSubmissionCreate(AssignmentSubmissionBase):
    pass
    
class AssignmentSubmissionResponse(AssignmentSubmissionBase):
    id: uuid.UUID
    submitted_at: datetime
    media: List[MediaResponse] = []
    student: UserResponse

AssignmentResponse.model_rebuild()