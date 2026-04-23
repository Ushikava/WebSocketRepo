"""initial

Revision ID: 49e38bd6950b
Revises:
Create Date: 2026-04-24 01:48:48.404646

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '49e38bd6950b'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS canvas_settings (
            key VARCHAR PRIMARY KEY,
            value TEXT
        )
    """)
    op.execute("""
        CREATE TABLE IF NOT EXISTS canvas_lines (
            id VARCHAR PRIMARY KEY,
            "user" VARCHAR NOT NULL,
            points TEXT NOT NULL,
            color VARCHAR DEFAULT '#000000',
            stroke_width FLOAT DEFAULT 5.0,
            composite_op VARCHAR DEFAULT 'source-over',
            created_at TIMESTAMP
        )
    """)
    op.execute("""
        CREATE TABLE IF NOT EXISTS canvas_images (
            id VARCHAR PRIMARY KEY,
            "user" VARCHAR NOT NULL,
            filename VARCHAR NOT NULL,
            x FLOAT DEFAULT 80.0,
            y FLOAT DEFAULT 80.0,
            width FLOAT NOT NULL,
            height FLOAT NOT NULL,
            rotation FLOAT DEFAULT 0.0,
            created_at TIMESTAMP
        )
    """)
    op.execute("""
        CREATE TABLE IF NOT EXISTS chat_messages (
            id VARCHAR PRIMARY KEY,
            "user" VARCHAR NOT NULL,
            text TEXT NOT NULL,
            msg_type VARCHAR DEFAULT 'text',
            extra TEXT,
            created_at TIMESTAMP
        )
    """)
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
    op.execute("ALTER TABLE canvas_images ADD COLUMN IF NOT EXISTS rotation FLOAT DEFAULT 0.0")


def downgrade() -> None:
    op.drop_table('video_likes')
    op.drop_table('video_stats')
    op.drop_table('uploaded_videos')
    op.drop_table('users_data')
    op.drop_table('chat_messages')
    op.drop_table('canvas_images')
    op.drop_table('canvas_lines')
    op.drop_table('canvas_settings')
