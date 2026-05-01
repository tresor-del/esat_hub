"""ajout des relations des posts et comments avec les notifications

Revision ID: a4197bac8d98
Revises: a4cd265ef188
Create Date: 2026-05-01 15:02:13.131423

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a4197bac8d98'
down_revision: Union[str, Sequence[str], None] = 'a4cd265ef188'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- CASCADE POUR LES POSTS ---
    # Supprime l'ancienne contrainte et ajoute la cascade
    op.drop_constraint('notifications_post_id_fkey', 'notifications', type_='foreignkey')
    op.create_foreign_key(
        'notifications_post_id_fkey',
        source_table='notifications',
        referent_table='posts',
        local_cols=['post_id'],
        remote_cols=['id'],
        ondelete='CASCADE'
    )

    # --- CASCADE POUR LES COMMENTAIRES ---
    # Supprime l'ancienne contrainte et ajoute la cascade
    op.drop_constraint('notifications_comment_id_fkey', 'notifications', type_='foreignkey')
    op.create_foreign_key(
        'notifications_comment_id_fkey',
        source_table='notifications',
        referent_table='comments',
        local_cols=['comment_id'],
        remote_cols=['id'],
        ondelete='CASCADE'
    )


def downgrade() -> None:
    # --- RETOUR ARRIÈRE POSTS ---
    op.drop_constraint('notifications_post_id_fkey', 'notifications', type_='foreignkey')
    op.create_foreign_key(
        'notifications_post_id_fkey',
        source_table='notifications',
        referent_table='posts',
        local_cols=['post_id'],
        remote_cols=['id']
    )

    # --- RETOUR ARRIÈRE COMMENTAIRES ---
    op.drop_constraint('notifications_comment_id_fkey', 'notifications', type_='foreignkey')
    op.create_foreign_key(
        'notifications_comment_id_fkey',
        source_table='notifications',
        referent_table='comments',
        local_cols=['comment_id'],
        remote_cols=['id']
    )
