"""ensure_tables

Revision ID: efe917dc7dcc
Revises: 49e38bd6950b
Create Date: 2026-04-24 02:21:08.265283

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'efe917dc7dcc'
down_revision: Union[str, Sequence[str], None] = '49e38bd6950b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS users_data (
            id SERIAL PRIMARY KEY,
            username VARCHAR UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL
        )
    """)
    op.execute("""
        CREATE TABLE IF NOT EXISTS uploaded_videos (
            id SERIAL PRIMARY KEY,
            slug VARCHAR NOT NULL,
            filename VARCHAR NOT NULL,
            uploaded_by INTEGER NOT NULL REFERENCES users_data(id),
            title VARCHAR NOT NULL,
            uploaded_at TIMESTAMP
        )
    """)
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_uploaded_videos_slug ON uploaded_videos (slug)")
    op.execute("""
        CREATE TABLE IF NOT EXISTS video_stats (
            id SERIAL PRIMARY KEY,
            video_id INTEGER NOT NULL REFERENCES uploaded_videos(id),
            views INTEGER DEFAULT 0,
            likes INTEGER DEFAULT 0
        )
    """)
    op.execute("""
        CREATE TABLE IF NOT EXISTS video_likes (
            id SERIAL PRIMARY KEY,
            video_id INTEGER NOT NULL REFERENCES uploaded_videos(id),
            user_id INTEGER NOT NULL REFERENCES users_data(id),
            CONSTRAINT uq_video_like UNIQUE (video_id, user_id)
        )
    """)


def downgrade() -> None:
    pass
