"""Update dataset catalog schema

Revision ID: 2024032501
Revises: 48bf639d3c32
Create Date: 2024-03-25 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, VECTOR

# revision identifiers, used by Alembic.
revision = '2024032501'
down_revision = '48bf639d3c32'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Drop the old dataset_catalog table
    op.drop_table('dataset_catalog')
    
    # Create the new dataset_catalog table with updated schema
    op.create_table('dataset_catalog',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('url', sa.String(), nullable=False),
        sa.Column('info_url', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('source', sa.String(), nullable=False),
        sa.Column('source_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('embedding', VECTOR(768), nullable=True),  # Updated for Gemini's embedding size
    )

def downgrade() -> None:
    # Drop the new dataset_catalog table
    op.drop_table('dataset_catalog')
    
    # Recreate the original dataset_catalog table
    op.create_table('dataset_catalog',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('url', sa.String(), nullable=True),
        sa.Column('embedding', VECTOR(1536), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )