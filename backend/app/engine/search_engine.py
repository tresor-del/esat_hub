from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.dependencies import get_current_user, get_db
from app.db.schemas.user import User
from app.db.schemas.post import Post
from app.models.post import PostListResponse
from app.models.search import SearchResult
from app.models.user import UserListResponse


class SearchEngine:

    def __init__(self, db: Session, current_user: User):
        self.db = db
        self.current_user = current_user

    def general_search(self, q: str, skip: int = 0, limit: int = 10) -> SearchResult:
        queries = q.split(" ")

        users = []
        posts = []

        for query in queries:

            posts_results = self.db.query(Post).filter(
                or_(
                    Post.title.like(f"%{query}%"),
                    Post.description.like(f"%{query}%")
                )
            ).offset(skip).limit(limit).all()

            for post in posts_results:
                if post not in posts:
                    posts.append(post)
            

            users_results = self.db.query(User).filter(
                or_(
                    User.username.like(f"%{query}%"),
                    User.first_name.like(f"%{query}%"),
                    User.last_name.like(f"%{query}%"),
                    User.profil_name.like(f"%{query}%"),
                )
            ).offset(skip).limit(limit).all()

            for user in users_results:
                if user not in users:
                    users.append(user) 
        
        posts_results = PostListResponse(total=len(posts), posts=posts)
        users_results = UserListResponse(total=len(users), users=users)
            
        return SearchResult(posts_list=posts_results, users_list=users_results)