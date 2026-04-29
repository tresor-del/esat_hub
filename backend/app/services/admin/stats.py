from sqlalchemy import func

from app.db.schemas.user import User, UserRole, UserStatus
from app.services.admin.base import BaseAdminService
from app.db.schemas.post import Post
from app.db.schemas.comments import Comment
from app.models.admin import Stats


class AdminStatsService(BaseAdminService):
        
        def get_statistics(self) -> Stats:
            """
            Retourne les stats globales de l'application
            """
            total_users = self._db.query(User).count()
            active_users = self._db.query(User).filter(User.status == UserStatus.ACTIVE).count()
            pending_users = self._db.query(User).filter(User.status == UserStatus.PENDING).count()

            total_posts = self._db.query(Post).count()
            total_comments = self._db.query(Comment).count()

            # Count by role
            admin_count = self._db.query(User).filter(User.role == UserRole.ADMIN).count()
            student_count = self._db.query(User).filter(User.role == UserRole.STUDENT).count()

            # Count by domain
            domain_counts = {}
            domains = self._db.query(User.domain, func.count(User.id)).group_by(User.domain).all()
            for domain, count in domains:
                domain_counts[domain] = count

            return Stats(
                total_users = total_users,
                active_users = active_users,
                pending_users = pending_users,
                admin_count = admin_count,
                student_count = student_count,
                domain_counts = domain_counts,
                total_posts = total_posts,
                total_comments = total_comments
            )

 