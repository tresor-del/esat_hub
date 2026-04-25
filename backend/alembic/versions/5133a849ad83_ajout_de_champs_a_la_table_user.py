"""ajout de champs a la table user

Revision ID: 5133a849ad83
Revises: bf83c8279743
Create Date: 2024-04-25 00:28:07.781875

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '5133a849ad83'
down_revision: Union[str, Sequence[str], None] = 'bf83c8279743'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. CRÉATION MANUELLE DES NOUVEAUX TYPES ENUM DANS POSTGRES
    # Cela évite l'erreur "type roles does not exist"
    userrole = postgresql.ENUM('ADMIN', 'STUDENT', name='userrole')
    userrole.create(op.get_bind())
    
    major = postgresql.ENUM('IA', 'CYBERSECURITE', 'GENIE_LOGICIEL', 'GENIE_MECANIQUE', name='major')
    major.create(op.get_bind())
    
    status = postgresql.ENUM('ACTIVE', 'PENDING', 'INACTIVE', name='status')
    status.create(op.get_bind())

    # 2. AJOUT DES NOUVELLES COLONNES
    op.add_column('users', sa.Column('role', sa.Enum('ADMIN', 'STUDENT', name='userrole'), server_default='STUDENT', nullable=True))
    op.add_column('users', sa.Column('major', sa.Enum('IA', 'CYBERSECURITE', 'GENIE_LOGICIEL', 'GENIE_MECANIQUE', name='major'), server_default='IA', nullable=True))
    op.add_column('users', sa.Column('status', sa.Enum('ACTIVE', 'PENDING', 'INACTIVE', name='status'), server_default='PENDING', nullable=True))

    # 3. RENOMMAGE DES TYPES EXISTANTS (Option propre pour éviter les erreurs de type)
    # On renomme d'abord les types en base pour correspondre à ton nouveau modèle
    op.execute("ALTER TYPE years RENAME TO year")
    op.execute("ALTER TYPE schools RENAME TO school")
    op.execute("ALTER TYPE domains RENAME TO domain")
    op.execute("ALTER TYPE levels RENAME TO level")

    # 4. MISE À JOUR DES INDEX ET SUPPRESSION DE L'ANCIENNE COLONNE 'type'
    op.drop_index('ix_users_type', table_name='users')
    op.create_index(op.f('ix_users_major'), 'users', ['major'], unique=False)
    op.create_index(op.f('ix_users_role'), 'users', ['role'], unique=False)
    op.create_index(op.f('ix_users_status'), 'users', ['status'], unique=False)
    op.drop_column('users', 'type')
    
    # NOTE: J'ai supprimé la partie qui drop 'revoked_tokens' ici.

def downgrade() -> None:
    # 1. RÉTABLISSEMENT DE LA COLONNE 'type'
    op.add_column('users', sa.Column('type', sa.String(), nullable=True)) # Simplifié pour le downgrade
    op.drop_index(op.f('ix_users_status'), table_name='users')
    op.drop_index(op.f('ix_users_role'), table_name='users')
    op.drop_index(op.f('ix_users_major'), table_name='users')
    
    # 2. SUPPRESSION DES COLONNES AJOUTÉES
    op.drop_column('users', 'status')
    op.drop_column('users', 'major')
    op.drop_column('users', 'role')

    # 3. RENOMMAGE DES TYPES VERS L'ANCIEN NOM
    op.execute("ALTER TYPE year RENAME TO years")
    op.execute("ALTER TYPE school RENAME TO schools")
    op.execute("ALTER TYPE domain RENAME TO domains")
    op.execute("ALTER TYPE level RENAME TO levels")

    # 4. SUPPRESSION DES TYPES CRÉÉS
    op.execute("DROP TYPE userrole")
    op.execute("DROP TYPE major")
    op.execute("DROP TYPE status")
