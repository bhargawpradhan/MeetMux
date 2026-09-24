"""
MeetMux Geospatial Intelligence Engine — Role-Based Access Control (RBAC)
Defines enterprise roles, permissions matrix, and FastAPI authorization dependencies.
"""

from enum import Enum
from typing import List, Optional
from fastapi import Header, HTTPException, status

class Role(str, Enum):
    ADMIN = "ADMIN"
    OPERATIONS_MANAGER = "OPERATIONS_MANAGER"
    ANALYST = "ANALYST"
    VIEWER = "VIEWER"

# Permissions Matrix
ROLE_PERMISSIONS = {
    Role.ADMIN: [
        "shipments:read", "shipments:write",
        "routes:read", "routes:write",
        "predictions:read", "predictions:write",
        "simulations:run",
        "recommendations:approve", "recommendations:reject",
        "alerts:read", "alerts:write",
        "audit:read",
        "system:manage"
    ],
    Role.OPERATIONS_MANAGER: [
        "shipments:read", "shipments:write",
        "routes:read",
        "predictions:read",
        "simulations:run",
        "recommendations:approve", "recommendations:reject",
        "alerts:read", "alerts:write",
        "audit:read"
    ],
    Role.ANALYST: [
        "shipments:read",
        "routes:read",
        "predictions:read", "predictions:write",
        "simulations:run",
        "analytics:read",
        "graph:read"
    ],
    Role.VIEWER: [
        "shipments:read",
        "routes:read",
        "analytics:read"
    ]
}

def get_current_user_role(x_user_role: Optional[str] = Header("OPERATIONS_MANAGER")) -> Role:
    """
    Extracts and validates user role from request headers (defaults to OPERATIONS_MANAGER for demo).
    """
    try:
        return Role(x_user_role.upper())
    except (ValueError, AttributeError):
        return Role.OPERATIONS_MANAGER

def require_roles(allowed_roles: List[Role]):
    def role_checker(role: Role = Header(default="OPERATIONS_MANAGER", alias="X-User-Role")):
        try:
            user_role = Role(str(role).upper())
        except ValueError:
            user_role = Role.OPERATIONS_MANAGER

        if user_role not in allowed_roles and user_role != Role.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": {
                        "code": "FORBIDDEN",
                        "message": f"Role '{user_role.value}' does not have sufficient permissions. Allowed: {[r.value for r in allowed_roles]}",
                        "request_role": user_role.value
                    }
                }
            )
        return user_role
    return role_checker
