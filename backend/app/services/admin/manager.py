from sqlalchemy.orm import Session

from app.services.admin.users import AdminUsersService
from app.services.admin.posts import AdminPostsService
from app.services.admin.comments import AdminCommentsService
from app.services.admin.stats import AdminStatsService
from app.services.admin.rooms import AdminRoomsService


class AdminService:

    def __init__(self, db: Session):
        self._db = db
        self.users = AdminUsersService(db)
        self.posts = AdminPostsService(db)
        self.comments = AdminCommentsService(db)
        self.stats = AdminStatsService(db)
        self.rooms = AdminRoomsService(db)
