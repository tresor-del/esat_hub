from sqlalchemy import func

from app.db.schemas.user import User, UserRole, UserStatus
from app.services.admin.base import BaseAdminService


class AdminStatsService(BaseAdminService):
        
        def get_statistics(self) -> dict:
            """Get overall statistics."""
            total_users = self._db.query(User).count()
            active_users = self._db.query(User).filter(User.status == UserStatus.ACTIVE).count()
            pending_users = self._db.query(User).filter(User.status == UserStatus.PENDING).count()

            # Count by role
            admin_count = self._db.query(User).filter(User.role == UserRole.ADMIN).count()
            student_count = self._db.query(User).filter(User.role == UserRole.STUDENT).count()

            # Count by domain
            domain_counts = {}
            domains = self._db.query(User.domain, func.count(User.id)).group_by(User.domain).all()
            for domain, count in domains:
                domain_counts[domain] = count

            return {
                "total_users": total_users,
                "active_users": active_users,
                "pending_users": pending_users,
                "admin_count": admin_count,
                "student_count": student_count,
                "domain_counts": domain_counts
            }

 