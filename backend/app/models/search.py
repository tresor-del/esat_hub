from pydantic import BaseModel
from app.models.post import PostListResponse
from app.models.user import UserListResponse

class SearchResult(BaseModel):
    posts_list: PostListResponse
    users_list: UserListResponse