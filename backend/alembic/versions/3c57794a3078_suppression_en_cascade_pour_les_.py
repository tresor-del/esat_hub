"""suppression en cascade pour les relations des users

Revision ID: 3c57794a3078
Revises: 5133a849ad83
Create Date: 2026-04-25 06:33:52.624096

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '3c57794a3078'
down_revision: Union[str, Sequence[str], None] = '5133a849ad83'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Comments
    op.drop_constraint('comments_user_id_fkey', 'comments', type_='foreignkey')
    op.create_foreign_key('comments_user_id_fkey', 'comments', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    
    # Notifications
    op.drop_constraint('notifications_recipient_id_fkey', 'notifications', type_='foreignkey')
    op.create_foreign_key('notifications_recipient_id_fkey', 'notifications', 'users', ['recipient_id'], ['id'], ondelete='CASCADE')
    
    # Posts
    op.drop_constraint('posts_user_id_fkey', 'posts', type_='foreignkey')
    op.create_foreign_key('posts_user_id_fkey', 'posts', 'users', ['user_id'], ['id'], ondelete='CASCADE')


def downgrade() -> None:
    op.drop_constraint('posts_user_id_fkey', 'posts', type_='foreignkey')
    op.create_foreign_key('posts_user_id_fkey', 'posts', 'users', ['user_id'], ['id'])

    op.drop_constraint('notifications_recipient_id_fkey', 'notifications', type_='foreignkey')
    op.create_foreign_key('notifications_recipient_id_fkey', 'notifications', 'users', ['recipient_id'], ['id'])

    op.drop_constraint('comments_user_id_fkey', 'comments', type_='foreignkey')
    op.create_foreign_key('comments_user_id_fkey', 'comments', 'users', ['user_id'], ['id'])
    
