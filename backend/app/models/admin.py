from pydantic import BaseModel
from typing import Optional

class Stats(BaseModel):
    total_users: Optional[int] = None
    active_users:  Optional[int] = None
    pending_users:  Optional[int] = None
    admin_count:   Optional[int] = None
    student_count:  Optional[int] = None
    domain_counts:  Optional[dict] = None
    total_posts:  Optional[int] = None
    total_comments:  Optional[int] = None