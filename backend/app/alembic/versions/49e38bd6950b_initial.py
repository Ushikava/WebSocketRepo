"""initial

Revision ID: 49e38bd6950b
Revises: 
Create Date: 2026-04-24 01:48:48.404646

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '49e38bd6950b'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE canvas_images ADD COLUMN IF NOT EXISTS rotation FLOAT DEFAULT 0.0")


def downgrade() -> None:
    op.drop_column('canvas_images', 'rotation')
