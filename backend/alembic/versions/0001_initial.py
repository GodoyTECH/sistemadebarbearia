"""initial schema

Revision ID: 0001_initial
Revises: 
Create Date: 2025-01-01
"""
from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("email", sa.String(), unique=True, index=True),
        sa.Column("first_name", sa.String()),
        sa.Column("last_name", sa.String()),
        sa.Column("profile_image_url", sa.String()),
        sa.Column("hashed_password", sa.String()),
        sa.Column("created_at", sa.DateTime()),
        sa.Column("updated_at", sa.DateTime()),
    )
    op.create_table(
        "profiles",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id")),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("cpf", sa.String()),
        sa.Column("phone", sa.String()),
        sa.Column("is_verified", sa.Boolean(), default=False),
    )
    op.create_table(
        "services",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("price", sa.Integer(), nullable=False),
        sa.Column("commission_rate", sa.Integer(), nullable=False),
        sa.Column("active", sa.Boolean(), default=True),
        sa.Column("description", sa.Text()),
    )
    op.create_table(
        "appointments",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("professional_id", sa.String(), sa.ForeignKey("users.id")),
        sa.Column("service_id", sa.Integer(), sa.ForeignKey("services.id")),
        sa.Column("date", sa.DateTime()),
        sa.Column("customer_name", sa.String(), nullable=False),
        sa.Column("price", sa.Integer(), nullable=False),
        sa.Column("commission_rate", sa.Integer(), nullable=False),
        sa.Column("payment_method", sa.String(), nullable=False),
        sa.Column("transaction_id", sa.String(), unique=True),
        sa.Column("proof_url", sa.Text()),
        sa.Column("proof_hash", sa.String()),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("possible_duplicate", sa.Boolean(), default=False),
    )
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("actor_id", sa.String(), sa.ForeignKey("users.id")),
        sa.Column("appointment_id", sa.Integer(), sa.ForeignKey("appointments.id")),
        sa.Column("action", sa.String(), nullable=False),
        sa.Column("metadata", sa.Text()),
        sa.Column("created_at", sa.DateTime()),
    )


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("appointments")
    op.drop_table("services")
    op.drop_table("profiles")
    op.drop_table("users")
