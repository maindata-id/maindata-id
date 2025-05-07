"""Update dataset schema v2

Revision ID: 2024032502
Revises: 2024032501
Create Date: 2024-03-25 11:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic.
revision = '2024032502'
down_revision = '2024032501'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Add new columns
    op.add_column('dataset_catalog', sa.Column('is_cors_allowed', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('dataset_catalog', sa.Column('slug', sa.String(), nullable=True))
    op.add_column('dataset_catalog', sa.Column('direct_source', sa.String(), nullable=True))
    op.add_column('dataset_catalog', sa.Column('original_source', sa.String(), nullable=True))
    
    # Fill slug with title for existing records
    op.execute("""
        UPDATE dataset_catalog 
        SET slug = title,
            direct_source = source,
            original_source = source
        WHERE slug IS NULL
    """)
    
    # Make columns not nullable after filling data
    op.alter_column('dataset_catalog', 'slug', nullable=False)
    op.alter_column('dataset_catalog', 'direct_source', nullable=False)
    op.alter_column('dataset_catalog', 'original_source', nullable=False)
    
    # Create unique index on slug
    op.create_index('ix_dataset_catalog_slug', 'dataset_catalog', ['slug'], unique=True)
    
    # Drop old source column
    op.drop_column('dataset_catalog', 'source')

def downgrade() -> None:
    # Add back source column
    op.add_column('dataset_catalog', sa.Column('source', sa.String(), nullable=True))
    
    # Fill source from direct_source
    op.execute("""
        UPDATE dataset_catalog 
        SET source = direct_source
    """)
    
    # Make source not nullable
    op.alter_column('dataset_catalog', 'source', nullable=False)
    
    # Drop new columns
    op.drop_index('ix_dataset_catalog_slug')
    op.drop_column('dataset_catalog', 'is_cors_allowed')
    op.drop_column('dataset_catalog', 'slug')
    op.drop_column('dataset_catalog', 'direct_source')
    op.drop_column('dataset_catalog', 'original_source')
