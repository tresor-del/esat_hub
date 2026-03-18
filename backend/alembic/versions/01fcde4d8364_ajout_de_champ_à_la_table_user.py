"""ajout de champ à la table user

Revision ID: 01fcde4d8364
Revises: 7e2a175ac8c8
Create Date: 2026-03-18 03:24:49.301103

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '01fcde4d8364'
down_revision: Union[str, Sequence[str], None] = '7e2a175ac8c8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Création des types ENUM dans Postgres
    sa.Enum('ESAT_TOGO', name='schools').create(op.get_bind())
    sa.Enum('AERONAUTIQUE', 'INFORMATIQUE', name='domains').create(op.get_bind())
    sa.Enum('PREPA', 'INGE', name='levels').create(op.get_bind())

    # 2. Ajout des colonnes avec server_default
    op.add_column('users', sa.Column('first_name', sa.String(), nullable=False, server_default='Utilisateur'))
    op.add_column('users', sa.Column('last_name', sa.String(), nullable=False, server_default='Utilisateur'))
    op.add_column('users', sa.Column('profil_name', sa.String(), nullable=False, server_default='Utilisateur'))
    op.add_column('users', sa.Column('username', sa.String(), nullable=False, server_default='Utilisateur'))
    
    op.add_column('users', sa.Column('school_name', sa.Enum('ESAT_TOGO', name='schools'), nullable=False, server_default='ESAT_TOGO'))
    op.add_column('users', sa.Column('domain', sa.Enum('AERONAUTIQUE', 'INFORMATIQUE', name='domains'), nullable=False, server_default='INFORMATIQUE'))
    op.add_column('users', sa.Column('level', sa.Enum('PREPA', 'INGE', name='levels'), nullable=False, server_default='PREPA'))

    # 3. RÉPARATION DES DONNÉES : Rendre profil_name et username uniques pour les lignes existantes
    # On ajoute l'ID au texte pour éviter la UniqueViolation (ex: User_1, User_2...)
    op.execute("UPDATE users SET profil_name = 'User_p_' || id::text WHERE profil_name = 'Utilisateur'")
    op.execute("UPDATE users SET username = 'User_u_' || id::text WHERE username = 'Utilisateur'")

    # 4. Création des index (maintenant que les données sont uniques)
    op.create_index(op.f('ix_users_profil_name'), 'users', ['profil_name'], unique=True)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
    
    op.create_index(op.f('ix_users_domain'), 'users', ['domain'], unique=False)
    op.create_index(op.f('ix_users_level'), 'users', ['level'], unique=False)
    op.create_index(op.f('ix_users_school_name'), 'users', ['school_name'], unique=False)


def downgrade() -> None:
    # Suppression des index
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_school_name'), table_name='users')
    op.drop_index(op.f('ix_users_profil_name'), table_name='users')
    # ... les autres index
    op.drop_index(op.f('ix_users_level'), table_name='users')
    op.drop_index(op.f('ix_users_domain'), table_name='users')

    # Suppression des colonnes
    op.drop_column('users', 'level')
    op.drop_column('users', 'domain')
    op.drop_column('users', 'school_name')
    op.drop_column('users', 'username')
    op.drop_column('users', 'profil_name')
    op.drop_column('users', 'last_name')
    op.drop_column('users', 'first_name')

    # Suppression des types ENUM
    sa.Enum(name='schools').drop(op.get_bind())
    sa.Enum(name='domains').drop(op.get_bind())
    sa.Enum(name='levels').drop(op.get_bind())
