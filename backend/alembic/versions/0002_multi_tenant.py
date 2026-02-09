"""multi-tenant and schedule

Revision ID: 0002_multi_tenant
Revises: 0001_initial
Create Date: 2025-01-02
"""
from alembic import op
import sqlalchemy as sa

revision = "0002_multi_tenant"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "stores",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("store_number", sa.String(), unique=True),
        sa.Column("store_name", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime()),
    )

    op.add_column("users", sa.Column("phone", sa.String()))
    op.add_column("users", sa.Column("role", sa.String(), nullable=False, server_default="professional"))
    op.add_column("users", sa.Column("store_id", sa.String(), sa.ForeignKey("stores.id")))

    op.add_column("profiles", sa.Column("store_id", sa.String(), sa.ForeignKey("stores.id")))

    op.add_column("services", sa.Column("store_id", sa.String(), sa.ForeignKey("stores.id")))

    op.add_column("appointments", sa.Column("store_id", sa.String(), sa.ForeignKey("stores.id")))
    op.add_column("appointments", sa.Column("proof_hash", sa.String()))

    op.add_column("audit_logs", sa.Column("store_id", sa.String(), sa.ForeignKey("stores.id")))

    op.create_table(
        "professional_availability",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("store_id", sa.String(), sa.ForeignKey("stores.id")),
        sa.Column("professional_id", sa.String(), sa.ForeignKey("users.id")),
        sa.Column("weekday", sa.Integer(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("active", sa.Boolean(), default=True),
    )

    op.create_table(
        "schedule_blocks",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("store_id", sa.String(), sa.ForeignKey("stores.id")),
        sa.Column("professional_id", sa.String(), sa.ForeignKey("users.id")),
        sa.Column("start_at", sa.DateTime(), nullable=False),
        sa.Column("end_at", sa.DateTime(), nullable=False),
        sa.Column("reason", sa.String()),
    )

    op.create_table(
        "appointment_requests",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("store_id", sa.String(), sa.ForeignKey("stores.id")),
        sa.Column("professional_id", sa.String(), sa.ForeignKey("users.id")),
        sa.Column("service_id", sa.Integer(), sa.ForeignKey("services.id")),
        sa.Column("customer_name", sa.String(), nullable=False),
        sa.Column("customer_phone", sa.String(), nullable=False),
        sa.Column("requested_at", sa.DateTime(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="requested"),
        sa.Column("created_at", sa.DateTime()),
    )


def downgrade() -> None:
    op.drop_table("appointment_requests")
    op.drop_table("schedule_blocks")
    op.drop_table("professional_availability")
    op.drop_column("audit_logs", "store_id")
    op.drop_column("appointments", "proof_hash")
    op.drop_column("appointments", "store_id")
    op.drop_column("services", "store_id")
    op.drop_column("profiles", "store_id")
    op.drop_column("users", "store_id")
    op.drop_column("users", "role")
    op.drop_column("users", "phone")
    op.drop_table("stores")
