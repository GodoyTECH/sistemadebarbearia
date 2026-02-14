"""fastapi parity schema

Revision ID: 0002_fastapi_parity
Revises: 0001_initial
Create Date: 2026-02-14
"""

from alembic import op
import sqlalchemy as sa

revision = "0002_fastapi_parity"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "shops",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("code", sa.String(length=12), nullable=False),
        sa.Column("manager_user_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_shops_code", "shops", ["code"], unique=True)

    with op.batch_alter_table("profiles") as batch:
        batch.add_column(sa.Column("shop_id", sa.Integer(), nullable=True))
        batch.add_column(sa.Column("approval_status", sa.String(), nullable=False, server_default="active"))
        batch.add_column(sa.Column("approved_by_user_id", sa.String(), nullable=True))
        batch.add_column(sa.Column("approval_at", sa.DateTime(), nullable=True))
        batch.add_column(sa.Column("rejection_at", sa.DateTime(), nullable=True))
        batch.add_column(sa.Column("availability", sa.Boolean(), nullable=False, server_default=sa.text("true")))
        batch.create_foreign_key("fk_profiles_shop_id", "shops", ["shop_id"], ["id"])
        batch.create_foreign_key("fk_profiles_approved_by_user_id", "users", ["approved_by_user_id"], ["id"])

    op.create_index("ix_profiles_shop_id", "profiles", ["shop_id"], unique=False)

    op.create_table(
        "professional_approvals",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("professional_user_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("manager_user_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("action", sa.String(length=16), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_professional_approvals_professional_user_id", "professional_approvals", ["professional_user_id"], unique=False)

    op.create_table(
        "media_uploads",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("type", sa.String(length=16), nullable=False),
        sa.Column("shop_id", sa.Integer(), sa.ForeignKey("shops.id"), nullable=True),
        sa.Column("professional_id", sa.String(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("payment_id", sa.Integer(), nullable=True),
        sa.Column("secure_url", sa.Text(), nullable=False),
        sa.Column("public_id", sa.Text(), nullable=False),
        sa.Column("asset_id", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_media_uploads_shop_id", "media_uploads", ["shop_id"], unique=False)
    op.create_index("ix_media_uploads_professional_id", "media_uploads", ["professional_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_media_uploads_professional_id", table_name="media_uploads")
    op.drop_index("ix_media_uploads_shop_id", table_name="media_uploads")
    op.drop_table("media_uploads")
    op.drop_index("ix_professional_approvals_professional_user_id", table_name="professional_approvals")
    op.drop_table("professional_approvals")
    op.drop_index("ix_profiles_shop_id", table_name="profiles")
    with op.batch_alter_table("profiles") as batch:
        batch.drop_constraint("fk_profiles_approved_by_user_id", type_="foreignkey")
        batch.drop_constraint("fk_profiles_shop_id", type_="foreignkey")
        batch.drop_column("availability")
        batch.drop_column("rejection_at")
        batch.drop_column("approval_at")
        batch.drop_column("approved_by_user_id")
        batch.drop_column("approval_status")
        batch.drop_column("shop_id")

    op.drop_index("ix_shops_code", table_name="shops")
    op.drop_table("shops")
